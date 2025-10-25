import React, { useContext, useEffect, useMemo, useState } from "react";
import { IoMdRefresh } from "react-icons/io";
import { FaSave } from "react-icons/fa";
import { nodeBackend } from "../../../axios/axiosInstance"; // adjust path
import { getContract } from "../../../hook/useContract";    // adjust path
import { AuthContext } from "../../../contextAPI/AuthContext"; // adjust path"

// ----------------- Helpers and constants (mirrors your SubmitGrades) -----------------
const THEORY_SCHEME = {
    fields: [
        { key: "attendance", label: "Attendance (10)", max: 10 },
        { key: "quiz", label: "Quiz (15)", max: 15 },
        { key: "assignment", label: "Assignment/Presentation (25)", max: 25 },
        { key: "mid", label: "Mid (20)", max: 20 },
        { key: "final", label: "Final (30)", max: 30 },
    ],
    outOf: 100,
};

const LAB_SCHEME = {
    fields: [
        { key: "attendance", label: "Attendance (10)", max: 10 },
        { key: "classPerformance", label: "Class Performance (10)", max: 10 },
        { key: "assignment", label: "Assignment (15)", max: 15 },
        { key: "viva", label: "Viva (25)", max: 25 },
        { key: "final", label: "Final (40)", max: 40 },
    ],
    outOf: 100,
};

const gradeInfoFromPercent = (p) => {
    if (p >= 80) return { letter: "A+", points: 4.0 };
    if (p >= 75 && p <= 79) return { letter: "A", points: 3.75 };
    if (p >= 70 && p <= 74) return { letter: "A-", points: 3.5 };
    if (p >= 65 && p <= 69) return { letter: "B+", points: 3.25 };
    if (p >= 60 && p <= 64) return { letter: "B", points: 3.0 };
    if (p >= 55 && p <= 59) return { letter: "B-", points: 2.75 };
    if (p >= 50 && p <= 54) return { letter: "C+", points: 2.5 };
    if (p >= 45 && p <= 49) return { letter: "C", points: 2.25 };
    if (p >= 40 && p <= 44) return { letter: "D", points: 2.0 };
    return { letter: "F", points: 0.0 };
};

const clamp = (v, max) => {
    if (v === "") return "";
    let x = Number(v);
    if (Number.isNaN(x)) x = 0;
    if (typeof max === "number") {
        if (x < 0) x = 0;
        if (x > max) x = max;
    }
    return x;
};

const norm = (a = "") => a.toLowerCase();

// Pick scheme by keys in components
const deriveSchemeFromComponents = (components) => {
    const keys = Object.keys(components || {});
    const labMatch = LAB_SCHEME.fields.filter((f) => keys.includes(f.key)).length;
    const theoryMatch = THEORY_SCHEME.fields.filter((f) => keys.includes(f.key)).length;
    if (labMatch === 0 && theoryMatch === 0) return THEORY_SCHEME; // default
    return labMatch >= theoryMatch ? LAB_SCHEME : THEORY_SCHEME;
};

// ----------------- Component -----------------
const EditGrades = () => {
    const { userInfo } = useContext(AuthContext);
    const teacherWallet = userInfo?.walletAddress;
    const teacherPublicKey = userInfo?.publicKey;

    const [contract, setContract] = useState(null);
    const [series, setSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [seriesError, setSeriesError] = useState("");

    const [selected, setSelected] = useState(null);
    const [cidEnvelope, setCidEnvelope] = useState(null);
    const [cidLoading, setCidLoading] = useState(false);

    const [privateKeyPEM, setPrivateKeyPEM] = useState("");
    const [decrypting, setDecrypting] = useState(false);
    const [decryptError, setDecryptError] = useState("");

    // decryptedData from backend (same shape as GradeViewer expects)
    const [decryptedData, setDecryptedData] = useState(null);

    // form state
    const [marksMap, setMarksMap] = useState({});
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });

    const scheme = useMemo(
        () => deriveSchemeFromComponents(decryptedData?.marks?.components || {}),
        [decryptedData]
    );

    const allFilled = useMemo(
        () => scheme.fields.every((f) => marksMap[f.key] !== "" && marksMap[f.key] != null),
        [marksMap, scheme]
    );
    const total = useMemo(
        () => scheme.fields.reduce((sum, f) => sum + (marksMap[f.key] === "" ? 0 : Number(marksMap[f.key] || 0)), 0),
        [marksMap, scheme]
    );
    const percent = useMemo(() => (scheme.outOf ? Math.round((total / scheme.outOf) * 100) : 0), [total, scheme]);
    const { letter, points } = useMemo(() => gradeInfoFromPercent(percent), [percent]);

    // Init contract
    useEffect(() => {
        (async () => {
            try {
                const ctr = await getContract();
                setContract(ctr);
            } catch (e) {
                setSeriesError(e?.message || "Failed to initialize contract");
            }
        })();
    }, []);

    // Load teacher's series
    const loadSeries = async () => {
        if (!contract || !teacherWallet) return;
        setLoadingSeries(true);
        setSeriesError("");
        try {
            const ids = await contract.listSeriesIdsByTeacher(teacherWallet);
            const rows = [];
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                try {
                    const res = await contract.getSeriesHead(id);
                    const [
                        teacher, student, enrollmentId, courseCode, semesterCode, currentVersion, cid, timestamp, headReason,
                    ] = res;
                    rows.push({
                        seriesId: id,
                        teacher, student, enrollmentId, courseCode, semesterCode,
                        currentVersion: Number(currentVersion), cid, timestamp: Number(timestamp), headReason,
                    });
                } catch (e) {
                    console.warn("getSeriesHead failed for", id, e);
                }
            }
            setSeries(rows);
        } catch (e) {
            setSeriesError(e?.message || "Failed to load series");
        } finally {
            setLoadingSeries(false);
        }
    };

    useEffect(() => {
        loadSeries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract, teacherWallet]);

    // Open a series -> fetch head CID envelope
    const openSeries = async (row) => {
        setSelected(row);
        setCidEnvelope(null);
        setDecryptedData(null);
        setMarksMap({});
        setReason("");
        setSaveMsg({ type: "", text: "" });
        setDecryptError("");

        if (!row?.cid) return;
        setCidLoading(true);
        try {
            const { data } = await nodeBackend.get("/ipfsData", { params: { cid: row.cid } });
            // data: { ciphertext, iv, authTag, encryptedKeys: [{recipientId, encryptedKey}, ...] }
            setCidEnvelope(data);
        } catch (e) {
            setSeriesError(e?.message || "Failed to fetch IPFS data");
        } finally {
            setCidLoading(false);
        }
    };

    // Decrypt using GradeViewer's approach: try matching key, else try all keys
    const decryptNow = async () => {
        if (!cidEnvelope) return;
        if (!privateKeyPEM.trim()) {
            setDecryptError("Paste your PRIVATE KEY (PEM) first.");
            return;
        }
        setDecryptError("");
        setDecrypting(true);
        try {
            const keys = Array.isArray(cidEnvelope.encryptedKeys) ? cidEnvelope.encryptedKeys : [];
            const mine = keys.find((e) => norm(e.recipientId) === norm(teacherWallet));

            const tryDecryptWith = async (encryptedKey) => {
                const body = {
                    recipientPrivateKey: privateKeyPEM,
                    encryptedKey,
                    iv: cidEnvelope.iv,
                    authTag: cidEnvelope.authTag,
                    ciphertext: cidEnvelope.ciphertext,
                };
                // Expect a response like { success: true, decryptedData: { ... } }
                const resp = await nodeBackend.post("/decrypt", body, {
                    headers: { "Content-Type": "application/json" },
                });
                return resp.data;
            };

            let result = null;
            let lastErr = null;

            if (mine) {
                try {
                    result = await tryDecryptWith(mine.encryptedKey);
                } catch (e) {
                    lastErr = e;
                }
            }

            if (!result) {
                for (const ek of keys) {
                    if (mine && ek.encryptedKey === mine.encryptedKey) continue;
                    try {
                        result = await tryDecryptWith(ek.encryptedKey);
                        if (result) break;
                    } catch (e) {
                        lastErr = e;
                    }
                }
            }

            if (!result) throw lastErr || new Error("No encryptedKey decrypted successfully.");

            // result.decryptedData should contain the JSON payload we need
            const data = result?.decryptedData || result?.data || result?.plaintext; // support variants
            if (!data) throw new Error("Decrypt endpoint returned empty decryptedData");

            // If plaintext string, parse it
            const parsed = typeof data === "string" ? JSON.parse(data) : data;

            setDecryptedData(parsed);

            // Seed marksMap
            const comp = parsed?.marks?.components || {};
            const curScheme = deriveSchemeFromComponents(comp);
            const seed = {};
            curScheme.fields.forEach((f) => {
                const val = comp?.[f.key];
                seed[f.key] = typeof val === "number" ? val : val != null ? Number(val) : "";
            });
            setMarksMap(seed);
        } catch (e) {
            console.error("decrypt error", e);
            const msg = e?.response?.data || e?.message || "Decrypt failed";
            setDecryptError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setDecrypting(false);
        }
    };

    const updateMark = (key, value) => {
        const max = scheme.fields.find((f) => f.key === key)?.max;
        setMarksMap((prev) => ({ ...prev, [key]: clamp(value, max) }));
    };

    // TODO: change to your real endpoint for fetching the student's publicKey
    const fetchStudentPublicKey = async (studentWallet) => {
        // Option A: GET /user-public-key?wallet=0x...
        try {
            const result = await nodeBackend.get(`/userinfo?wallet=${studentWallet}`);
            console.log(result.data);
            if (result.data?.publicKey) return result.data.publicKey;
        }
        catch (e) { console.log(e) }
        throw new Error("Student publicKey not found. Please provide an endpoint to fetch it.");
    };

    const encryptAndUpload = async () => {
        if (!selected) throw new Error("No series selected");
        if (!teacherWallet || !teacherPublicKey) throw new Error("Missing teacher wallet/publicKey");
        const enrollmentId = decryptedData?.enrollmentId || selected?.enrollmentId;

        const payloadData = {
            enrollmentId,
            marks: {
                components: scheme.fields.reduce((obj, f) => {
                    obj[f.key] = Number(marksMap[f.key] || 0);
                    return obj;
                }, {}),
                total,
                letterGrade: letter,
                gradePoints: points,
            },
            computedAt: new Date().toISOString(),
        };

        const studentWallet = selected?.student;
        const studentPublicKey = await fetchStudentPublicKey(studentWallet, enrollmentId);

        const payload = {
            data: payloadData,
            recipients: [
                { id: teacherWallet, publicKey: teacherPublicKey },
                { id: studentWallet, publicKey: studentPublicKey },
            ],
        };

        const res = await nodeBackend.post("/encrypt", payload);
        if (!res?.data?.cid) throw new Error("CID Generation Failed");
        return res.data.cid;
    };

    const saveChanges = async () => {
        setSaveMsg({ type: "", text: "" });
        if (!selected?.seriesId) return setSaveMsg({ type: "error", text: "No series selected" });
        if (!decryptedData) return setSaveMsg({ type: "error", text: "Decrypt first to load current marks" });
        if (!allFilled) return setSaveMsg({ type: "error", text: "Please fill all fields" });
        if (!reason.trim()) return setSaveMsg({ type: "error", text: "Please provide a reason for the change" });

        setSaving(true);
        try {
            const newCid = await encryptAndUpload();
            const ctr = contract || (await getContract());
            const tx = await ctr.editSeries(selected.seriesId, newCid, reason);
            await tx.wait();
            setSaveMsg({ type: "success", text: "Saved! New version appended on-chain." });

            // Reload head to reflect new CID/version
            await loadSeries();
            // Refresh selected row
            const updated = await ctr.getSeriesHead(selected.seriesId);
            const [
                teacher, student, enrollmentId, courseCode, semesterCode, currentVersion, cid, timestamp, headReason,
            ] = updated;
            setSelected({
                seriesId: selected.seriesId,
                teacher, student, enrollmentId, courseCode, semesterCode,
                currentVersion: Number(currentVersion), cid, timestamp: Number(timestamp), headReason,
            });
        } catch (e) {
            setSaveMsg({ type: "error", text: e?.message || "Save failed" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 text-gray-200 px-4 md:px-6 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Edit Marks</h1>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-neutral" onClick={loadSeries}>
                            <IoMdRefresh /> Refresh
                        </button>
                        {teacherWallet ? (
                            <div className="badge badge-outline badge-primary">
                                {teacherWallet.slice(0, 6)}...{teacherWallet.slice(-4)}
                            </div>
                        ) : (
                            <div className="badge badge-error">No wallet</div>
                        )}
                    </div>
                </div>

                {/* Series List */}
                <div className="bg-base-100 border border-base-300 rounded-2xl p-4 mb-6">
                    <h2 className="text-xl font-semibold mb-3">Your series</h2>
                    {seriesError && <div className="alert alert-error mb-3">{seriesError}</div>}
                    {loadingSeries ? (
                        <div className="py-8 flex justify-center">
                            <span className="loading loading-spinner loading-md" />
                        </div>
                    ) : series.length === 0 ? (
                        <div className="text-gray-400 py-6">No series found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra text-gray-200">
                                <thead>
                                    <tr className="text-primary">
                                        <th>#</th>
                                        <th>Course</th>
                                        <th>Semester</th>
                                        <th>Student</th>
                                        <th>Version</th>
                                        <th>Reason</th>
                                        <th>CID</th>
                                        <th>Open</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series.map((row, i) => (
                                        <tr key={row.seriesId}>
                                            <td>{i + 1}</td>
                                            <td className="font-semibold">{row.courseCode}</td>
                                            <td>{row.semesterCode}</td>
                                            <td className="text-xs break-all">{row.student}</td>
                                            <td>{row.currentVersion}</td>
                                            <td className="text-xs truncate max-w-[180px]" title={row.headReason}>
                                                {row.headReason}
                                            </td>
                                            <td className="text-xs truncate max-w-[220px]" title={row.cid}>
                                                {row.cid}
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-primary" onClick={() => openSeries(row)}>
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit Panel */}
                {selected && (
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {selected.courseCode} • {selected.semesterCode}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Student: <span className="font-mono">{selected.student}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    SeriesId: <span className="font-mono">{selected.seriesId}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400">Head CID:</div>
                                <div className="text-xs break-all">{selected.cid || "—"}</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Decrypt area */}
                            <div className="p-3 rounded-lg border border-base-300">
                                <h3 className="font-semibold mb-2">Decrypt latest marks</h3>
                                {!cidEnvelope ? (
                                    cidLoading ? (
                                        <div className="py-4">
                                            <span className="loading loading-spinner" /> Fetching encrypted payload...
                                        </div>
                                    ) : (
                                        <div className="text-sm opacity-70">Select a series to load its encrypted payload.</div>
                                    )
                                ) : (
                                    <>
                                        <label className="label">
                                            <span className="label-text">Your Private Key (PEM)</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered w-full font-mono text-xs"
                                            rows={6}
                                            value={privateKeyPEM}
                                            onChange={(e) => setPrivateKeyPEM(e.target.value)}
                                            placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            Demo only — posting private keys to server. Use client-side crypto for production.
                                        </div>
                                        <button
                                            className={`btn btn-primary btn-sm mt-3 ${decrypting ? "loading" : ""}`}
                                            onClick={decryptNow}
                                        >
                                            Decrypt
                                        </button>
                                        {decryptError && <div className="alert alert-error mt-2">{decryptError}</div>}

                                        {decryptedData && (
                                            <div className="mt-3 text-xs">
                                                <div className="text-gray-400">Decrypted snapshot:</div>
                                                <pre className="bg-base-300 p-2 rounded whitespace-pre-wrap">
                                                    {JSON.stringify(decryptedData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Marks form */}
                            <div className="p-3 rounded-lg border border-base-300">
                                <h3 className="font-semibold mb-2">Edit marks</h3>
                                {!decryptedData ? (
                                    <div className="text-sm opacity-70">Decrypt to load current marks.</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                                            {scheme.fields.map((f) => (
                                                <label key={f.key} className="text-xs">
                                                    <span className="block mb-1 text-gray-400">{f.label}</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={f.max}
                                                        step="1"
                                                        required
                                                        className="input input-bordered input-sm w-full"
                                                        value={marksMap[f.key] ?? ""}
                                                        onChange={(e) => updateMark(f.key, e.target.value)}
                                                    />
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-4">
                                            <div className="text-sm">
                                                <div className="font-semibold">Total: {allFilled ? `${total} / ${scheme.outOf}` : "—"}</div>
                                                <div className="font-semibold">
                                                    Grade: {allFilled ? letter : "—"} ({allFilled ? points.toFixed(2) : "—"})
                                                </div>
                                            </div>

                                            <div className="flex-1" />

                                            <div className="form-control w-full max-w-md">
                                                <label className="label">
                                                    <span className="label-text">Reason for change</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered"
                                                    placeholder="e.g., re-evaluation after appeal"
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                />
                                            </div>

                                            <button
                                                className={`btn btn-primary ${saving ? "loading" : ""}`}
                                                onClick={saveChanges}
                                                disabled={!allFilled || saving}
                                            >
                                                <FaSave /> Save new version
                                            </button>
                                        </div>

                                        {saveMsg.text && (
                                            <div className={`alert mt-3 ${saveMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                                {saveMsg.text}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditGrades