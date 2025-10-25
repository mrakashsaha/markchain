import React, { useContext, useEffect, useState } from "react";
import { getContract } from "../../../hook/useContract";
import { AuthContext } from "../../../contextAPI/AuthContext";
import axios from "axios";

/**
 * GradeViewer
 * - Shows semester selector (collected from student's enrollments / series on chain)
 * - Shows courses for selected semester
 * - Expand each course to view version history (previous + current)
 * - Allows decrypting versions by posting student's PRIVATE KEY to your backend /decrypt endpoint
 *
 * Security note: This component will send the private key to your backend (POST /decrypt).
 * Only use with a backend you control. If you want client-side decryption (WebCrypto) I can provide that too.
 */

export default function GradeViewer() {
    const { userInfo } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // UI state
    const [seriesMap, setSeriesMap] = useState({}); // seriesId => { head: {...}, versions: [...], expanded: bool }
    const [semesters, setSemesters] = useState([]); // array of semester codes
    const [selectedSemester, setSelectedSemester] = useState("");
    const [privateKey, setPrivateKey] = useState("");

    // Helper: normalize address lower-case
    const norm = (a = "") => a.toLowerCase();

    useEffect(() => {
        // load student's series (head info) grouped by semester on mount
        const init = async () => {
            if (!userInfo?.walletAddress) return;
            setLoading(true);
            try {
                const contract = await getContract();

                // 1) list all series ids for this student
                const seriesIds = await contract.listSeriesIdsByStudent(userInfo.walletAddress);
                // seriesIds are bytes32 (string-like). We will query getSeriesHead for each.
                const map = {};
                const semSet = new Set();

                for (let i = 0; i < seriesIds.length; i++) {
                    const sid = seriesIds[i];
                    // get head data
                    const head = await contract.getSeriesHead(sid);
                    // head returns tuple: (teacher, student, enrollmentId, courseCode, semesterCode, currentVersion, cid, timestamp, reason)
                    const [
                        teacher,
                        student,
                        enrollmentId,
                        courseCode,
                        semesterCode,
                        currentVersion,
                        cid,
                        timestamp,
                        reason,
                    ] = head;

                    // create structure
                    map[sid] = {
                        seriesId: sid,
                        teacher,
                        student,
                        enrollmentId,
                        courseCode,
                        semesterCode,
                        currentVersion: Number(currentVersion || 0),
                        headCid: cid,
                        headTimestamp: Number(timestamp || 0),
                        headReason: reason,
                        versions: [], // will be filled when expanded
                        expanded: false,
                    };

                    semSet.add(semesterCode);
                }

                setSeriesMap(map);
                setSemesters(Array.from(semSet));
                if (!selectedSemester) setSelectedSemester(Array.from(semSet)[0] || "");
            } catch (err) {
                console.error("init error", err);
                alert("Failed to load series data: " + (err.message || err));
            }
            setLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo?.walletAddress]);

    // Expand course row -> load all versions (if not loaded)
    const handleExpandSeries = async (seriesId) => {
        const entry = seriesMap[seriesId];
        if (!entry) return;

        // toggle collapse if already loaded and expanded
        if (entry.expanded) {
            setSeriesMap((prev) => ({ ...prev, [seriesId]: { ...entry, expanded: false } }));
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract();
            const countBN = await contract.getVersionCount(seriesId);
            const count = Number(countBN);

            const versions = [];
            for (let i = 0; i < count; i++) {
                // getVersion returns (cid, timestamp, editor, reason)
                const v = await contract.getVersion(seriesId, i);
                const [cid, ts, editor, reason] = v;

                // fetch IPFS payload from backend (encrypted payload)
                // your backend endpoint:
                const ipfsResp = await axios.get(`http://localhost:5000/ipfsData?cid=${cid}`);
                const ipfsJson = ipfsResp.data;

                versions.push({
                    versionNumber: i + 1,
                    cid,
                    timestamp: new Date(Number(ts) * 1000).toISOString(),
                    editor,
                    reason,
                    ipfsJson, // encrypted payload (includes encryptedKeys[])
                    decrypted: null,
                    decryptError: null,
                    decryptLoading: false,
                });
            }

            setSeriesMap((prev) => ({ ...prev, [seriesId]: { ...entry, versions, expanded: true } }));
        } catch (err) {
            console.error("expand error", err);
            alert("Failed to load versions: " + (err.message || err));
        }
        setLoading(false);
    };

    // Decrypt a single version using the student's private key
    const handleDecryptVersion = async (seriesId, versionIndex) => {
        const entry = seriesMap[seriesId];
        if (!entry) return;
        const version = entry.versions[versionIndex];
        if (!version) return;

        if (!privateKey || privateKey.trim().length === 0) {
            alert("Paste your PRIVATE KEY (PEM) in the box above before decrypting.");
            return;
        }

        // mark loading
        version.decryptLoading = true;
        updateSeriesEntry(seriesId, entry);

        try {
            // find matching encryptedKey for this student (recipientId) if possible
            const recipient = norm(userInfo.walletAddress);
            let matchingEncryptedKey = null;

            if (Array.isArray(version.ipfsJson.encryptedKeys)) {
                matchingEncryptedKey = version.ipfsJson.encryptedKeys.find(
                    (e) => norm(e.recipientId) === recipient
                );
            }

            // If exact match not found, try every encryptedKey until decrypt endpoint succeeds
            const tryDecryptWith = async (encryptedKey) => {
                const body = {
                    recipientPrivateKey: privateKey,
                    encryptedKey: encryptedKey,
                    iv: version.ipfsJson.iv,
                    authTag: version.ipfsJson.authTag,
                    ciphertext: version.ipfsJson.ciphertext,
                };
                const resp = await axios.post("http://localhost:5000/decrypt", body, {
                    headers: { "Content-Type": "application/json" },
                });
                return resp.data; // assume { success: true, decryptedData: { ... } }
            };

            let decryptResult = null;
            if (matchingEncryptedKey) {
                decryptResult = await tryDecryptWith(matchingEncryptedKey.encryptedKey);
            } else {
                // try each encryptedKey
                let lastErr = null;
                for (const ek of version.ipfsJson.encryptedKeys || []) {
                    try {
                        const r = await tryDecryptWith(ek.encryptedKey);
                        decryptResult = r;
                        break;
                    } catch (e) {
                        lastErr = e;
                        // continue trying next key
                    }
                }
                if (!decryptResult) {
                    throw lastErr || new Error("No encryptedKey decrypted successfully.");
                }
            }

            // store decrypted data
            version.decrypted = decryptResult;
            version.decryptError = null;
        } catch (err) {
            console.error("decrypt err", err);
            version.decryptError = err?.response?.data || err.message || String(err);
            version.decrypted = null;
        } finally {
            version.decryptLoading = false;
            updateSeriesEntry(seriesId, entry);
        }
    };

    // helper to update seriesMap reactive state
    const updateSeriesEntry = (seriesId, newEntry) => {
        setSeriesMap((prev) => ({ ...prev, [seriesId]: newEntry }));
    };

    // Render helpers
    const renderSemesterTable = () => {
        const rows = Object.values(seriesMap)
            .filter((s) => s.semesterCode === selectedSemester)
            .sort((a, b) => (a.courseCode || "").localeCompare(b.courseCode || ""));
        if (!rows.length) return <div className="text-sm text-gray-400">No courses found for this semester.</div>;

        return (
            <div className="space-y-4">
                {rows.map((r) => (
                    <div key={r.seriesId} className="p-4 border rounded-lg bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-300">{r.courseCode} — <span className="text-sm text-gray-400">{r.courseCode && r.courseCode}</span></div>
                                <div className="text-lg font-semibold">{r.courseCode} {/* you can fetch course title from your courseCollection using enrollmentId if you want */}</div>
                                <div className="text-xs text-gray-500">Enrollment: {r.enrollmentId}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-400">Version: {r.currentVersion}</div>
                                <button
                                    className="btn"
                                    onClick={() => handleExpandSeries(r.seriesId)}
                                >
                                    {r.expanded ? "Collapse" : "View Versions"}
                                </button>
                            </div>
                        </div>

                        {r.expanded && (
                            <div className="mt-4">
                                <div className="space-y-3">
                                    {r.versions.map((v, idx) => (
                                        <div key={v.cid + idx} className="p-3 border rounded bg-gray-800">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm text-gray-300">Version {v.versionNumber} {v.versionNumber === r.currentVersion ? <span className="text-green-300">(current)</span> : null}</div>
                                                    <div className="text-xs text-gray-400">Updated: {new Date(v.timestamp).toLocaleString()}</div>
                                                    <div className="text-xs text-gray-400">By: {v.editor}</div>
                                                    <div className="text-xs text-gray-400">Reason: {v.reason}</div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-xs text-gray-400">CID: {v.cid}</div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn"
                                                            disabled={v.decryptLoading}
                                                            onClick={() => handleDecryptVersion(r.seriesId, idx)}
                                                        >
                                                            {v.decryptLoading ? "Decrypting..." : "Decrypt"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* decrypted output */}
                                            <div className="mt-3">
                                                {v.decryptError ? (
                                                    <div className="text-sm text-red-400">Decrypt error: {String(v.decryptError)}</div>
                                                ) : v.decrypted ? (
                                                    <div className="text-sm text-green-300">
                                                        <div><strong>Total:</strong> {v.decrypted?.decryptedData?.marks?.total ?? "-"}</div>
                                                        <div><strong>Grade:</strong> {v.decrypted?.decryptedData?.marks?.letterGrade ?? "-"} | <strong>GP:</strong> {v.decrypted?.decryptedData?.marks?.gradePoints ?? "-"}</div>
                                                        <div className="mt-2">
                                                            <strong>Components:</strong>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                                                                {v.decrypted?.decryptedData?.marks?.components &&
                                                                    Object.entries(v.decrypted.decryptedData.marks.components).map(([k, val]) => (
                                                                        <div key={k} className="p-2 bg-gray-700 rounded text-xs">
                                                                            <div className="capitalize">{k}</div>
                                                                            <div className="font-medium">{val}</div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                            <div className="mt-2 text-xs text-gray-400">Computed at: {v.decrypted?.decryptedData?.computedAt}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400">Encrypted payload loaded. Click decrypt to view marks.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-950 text-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Semester-wise Grade Viewer</h2>

            <div className="mb-4 flex gap-3 items-center">
                <label className="text-sm">Semester:</label>
                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="p-2 rounded bg-gray-800"
                >
                    <option value="">-- select semester --</option>
                    {semesters.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <div className="ml-auto flex items-center gap-2">
                    <textarea
                        rows={4}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="Paste your PRIVATE KEY (PEM) here to decrypt versions..."
                        className="p-2 rounded bg-gray-800 text-xs w-96"
                    />
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>{renderSemesterTable()}</div>
            )}

            <div className="mt-6 text-xs text-gray-500">
                Security: This posts your private key to <code>http://localhost:5000/decrypt</code>. Only use with a trusted backend or ask me to provide client-side decryption.
            </div>
        </div>
    );
}
