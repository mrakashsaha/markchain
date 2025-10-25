import React, { useContext, useEffect, useMemo, useState } from "react";
import { IoMdRefresh, IoMdSearch } from "react-icons/io";
import { FaSave, FaLock, FaLockOpen, FaKey, FaChevronRight } from "react-icons/fa";
import { MdOutlineEditNote, MdClose } from "react-icons/md";
import { nodeBackend } from "../../../axios/axiosInstance";
import { getContract } from "../../../hook/useContract";
import { AuthContext } from "../../../contextAPI/AuthContext";
import Swal from 'sweetalert2';

// ----------------- Helpers and constants (unchanged) -----------------
const THEORY_SCHEME = {
    fields: [
        { key: "attendance", label: "Attendance (10)", max: 10 },
        { key: "quiz", label: "Quiz (15)", max: 15 },
        { key: "assignment", label: "Assignment (25)", max: 25 },
        { key: "mid", label: "Mid (20)", max: 20 },
        { key: "final", label: "Final (30)", max: 30 },
    ],
    outOf: 100,
};

const LAB_SCHEME = {
    fields: [
        { key: "attendance", label: "Attendance (10)", max: 10 },
        { key: "classPerformance", label: "Performance (10)", max: 10 },
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

const deriveSchemeFromComponents = (components) => {
    const keys = Object.keys(components || {});
    const labMatch = LAB_SCHEME.fields.filter((f) => keys.includes(f.key)).length;
    const theoryMatch = THEORY_SCHEME.fields.filter((f) => keys.includes(f.key)).length;
    if (labMatch === 0 && theoryMatch === 0) return THEORY_SCHEME;
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
    const [searchTerm, setSearchTerm] = useState("");

    const [selected, setSelected] = useState(null);
    const [cidEnvelope, setCidEnvelope] = useState(null);
    const [cidLoading, setCidLoading] = useState(false);

    const [privateKeyPEM, setPrivateKeyPEM] = useState("");
    const [decrypting, setDecrypting] = useState(false);
    const [decryptError, setDecryptError] = useState("");

    const [decryptedData, setDecryptedData] = useState(null);
    const [marksMap, setMarksMap] = useState({});
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    // Filter series based on search term
    const filteredSeries = useMemo(() => {
        if (!searchTerm.trim()) return series;

        const term = searchTerm.toLowerCase();
        return series.filter(row =>
            row.student.toLowerCase().includes(term) ||
            row.courseCode.toLowerCase().includes(term) ||
            row.semesterCode.toLowerCase().includes(term) ||
            (row.headReason && row.headReason.toLowerCase().includes(term))
        );
    }, [series, searchTerm]);

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
        setDecryptError("");

        if (!row?.cid) return;
        setCidLoading(true);
        try {
            const { data } = await nodeBackend.get("/ipfsData", { params: { cid: row.cid } });
            setCidEnvelope(data);
        } catch (e) {
            setSeriesError(e?.message || "Failed to fetch IPFS data");
        } finally {
            setCidLoading(false);
        }
    };

    // Decrypt function (unchanged logic)
    const decryptNow = async () => {
        if (!cidEnvelope) return;
        if (!privateKeyPEM.trim()) {
            setDecryptError("Please paste your private key first.");
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

            const data = result?.decryptedData || result?.data || result?.plaintext;
            if (!data) throw new Error("Decrypt endpoint returned empty decryptedData");

            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            setDecryptedData(parsed);

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

    const fetchStudentPublicKey = async (studentWallet) => {
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
        if (!selected?.seriesId) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No series selected',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });
            return;
        }
        if (!decryptedData) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please decrypt first to load current marks',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });
            return;
        }
        if (!allFilled) {
            await Swal.fire({
                icon: 'error',
                title: 'Incomplete',
                text: 'Please fill all fields',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });
            return;
        }
        if (!reason.trim()) {
            await Swal.fire({
                icon: 'error',
                title: 'Reason Required',
                text: 'Please provide a reason for the change',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });
            return;
        }

        setSaving(true);
        try {
            const newCid = await encryptAndUpload();
            const ctr = contract || (await getContract());
            const tx = await ctr.editSeries(selected.seriesId, newCid, reason);
            await tx.wait();

            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Saved! New version appended on-chain.',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });

            await loadSeries();
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
            await Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: e?.message || 'Save failed',
                confirmButtonColor: '#2563eb',
                background: '#1f2937',
                color: 'white'
            });
        } finally {
            setSaving(false);
        }
    };

    const clearSelection = () => {
        setSelected(null);
        setDecryptedData(null);
        setPrivateKeyPEM("");
    };

    return (
        <div className="h-screen bg-base-200 flex flex-col p-4">
            {/* Header */}
            <div className="flex-shrink-0 bg-base-100 rounded-xl p-4 mb-4 shadow-lg border border-base-300">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                            <MdOutlineEditNote className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-base-content">Edit Student Grades</h1>
                            <p className="text-sm text-base-content/70">Manage and update student marks securely</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            className="btn btn-outline btn-primary"
                            onClick={loadSeries}
                            disabled={loadingSeries}
                        >
                            {loadingSeries ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <IoMdRefresh className="w-4 h-4" />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Fixed height, no scrolling */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Series List - Fixed height with scroll */}
                <div className="w-1/3 bg-base-100 rounded-xl shadow-lg border border-base-300 flex flex-col">
                    <div className="p-4 border-b border-base-300">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-base-content">Course Series</h2>
                            <div className="text-sm text-base-content/70">
                                {filteredSeries.length} of {series.length}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IoMdSearch className="h-4 w-4 text-base-content/50" />
                            </div>
                            <input
                                type="text"
                                className="input input-bordered w-full pl-10 bg-base-200 border-base-300"
                                placeholder="Search by student, course, or reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-hidden">
                        {seriesError && (
                            <div className="alert alert-error mb-4">
                                <span>{seriesError}</span>
                            </div>
                        )}

                        {loadingSeries ? (
                            <div className="flex items-center justify-center h-32">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                            </div>
                        ) : filteredSeries.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-base-content/50 text-lg mb-2">
                                    {searchTerm ? "No matching series found" : "No series found"}
                                </div>
                                <p className="text-sm text-base-content/50">
                                    {searchTerm ? "Try adjusting your search terms" : "You don't have any teaching series yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto pr-2 space-y-3">
                                {filteredSeries.map((row) => (
                                    <div
                                        key={row.seriesId}
                                        className={`
                                            p-4 rounded-lg border transition-all duration-200 cursor-pointer
                                            ${selected?.seriesId === row.seriesId
                                                ? 'border-primary bg-primary/10'
                                                : 'border-base-300 hover:border-primary/50 hover:bg-base-200'
                                            }
                                        `}
                                        onClick={() => openSeries(row)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-base-content">{row.courseCode}</span>
                                                <div className="badge badge-soft badge-primary">{row.semesterCode.replace(/[0-9]/g, "").charAt(0).toUpperCase() + row.semesterCode.replace(/[0-9]/g, "").slice(1) + " " + row.semesterCode.replace(/\D/g, "")}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="badge badge-soft badge-info">V{row.currentVersion}</div>
                                                <FaChevronRight className="w-4 h-4 text-base-content/50" />
                                            </div>
                                        </div>
                                        <div className="text-sm text-base-content/70 mb-1 font-mono">
                                            {row.student.slice(0, 8)}...{row.student.slice(-6)}
                                        </div>
                                        {row.headReason && (
                                            <div className="text-xs text-base-content/50 truncate">
                                                {row.headReason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Panel - Fixed height */}
                <div className="flex-1 bg-base-100 rounded-xl shadow-lg border border-base-300 flex flex-col">
                    {selected ? (
                        <>
                            <div className="p-4 border-b border-base-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-base-content">
                                            {selected.courseCode} • {selected.semesterCode}
                                        </h2>
                                        <p className="text-sm text-base-content/70 mt-1 font-mono">
                                            Student: {selected.student}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={clearSelection}
                                    >
                                        <MdClose className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Decrypt Section */}
                                    {!decryptedData && (
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <FaLock className="w-5 h-5 text-base-content/70" />
                                                <h3 className="text-lg font-medium text-base-content">Decrypt Marks</h3>
                                            </div>

                                            {cidLoading ? (
                                                <div className="flex items-center justify-center h-32">
                                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                                    <span className="ml-2 text-base-content/70">Fetching encrypted data...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-base-content mb-2">
                                                            Private Key (PEM)
                                                        </label>
                                                        <textarea
                                                            className="textarea textarea-bordered w-full h-32 font-mono bg-base-200 border-base-300"
                                                            value={privateKeyPEM}
                                                            onChange={(e) => setPrivateKeyPEM(e.target.value)}
                                                            placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                                                        />
                                                        <p className="mt-1 text-xs text-base-content/50">
                                                            For demonstration purposes only. Use client-side encryption in production.
                                                        </p>
                                                    </div>

                                                    <button
                                                        className="btn btn-primary w-full"
                                                        onClick={decryptNow}
                                                        disabled={decrypting || !privateKeyPEM.trim()}
                                                    >
                                                        {decrypting ? (
                                                            <span className="loading loading-spinner loading-sm"></span>
                                                        ) : (
                                                            <FaLockOpen className="w-4 h-4" />
                                                        )}
                                                        Decrypt Marks
                                                    </button>

                                                    {decryptError && (
                                                        <div className="alert alert-error">
                                                            <span>{decryptError}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Marks Form */}
                                    {decryptedData && (
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2">
                                                <FaSave className="w-5 h-5 text-base-content/70" />
                                                <h3 className="text-lg font-medium text-base-content">Edit Marks</h3>
                                            </div>

                                            {/* Marks Input Grid */}
                                            <div className="grid grid-cols-5 gap-4">
                                                {scheme.fields.map((f) => (
                                                    <div key={f.key} className="flex flex-col">
                                                        <label className="block text-sm font-medium text-base-content mb-2 text-center leading-tight min-h-[2.5rem] flex items-center justify-center">
                                                            {f.label}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={f.max}
                                                            step="0.5"
                                                            className="input input-bordered w-full text-center bg-base-200 border-base-300"
                                                            value={marksMap[f.key] ?? ""}
                                                            onChange={(e) => updateMark(f.key, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grade Summary */}
                                            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-sm text-base-content/70">Total</div>
                                                        <div className="text-xl font-semibold text-base-content">
                                                            {allFilled ? `${total}/${scheme.outOf}` : "—"}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm text-base-content/70">Percentage</div>
                                                        <div className="text-xl font-semibold text-base-content">
                                                            {allFilled ? `${percent}%` : "—"}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm text-base-content/70">Grade</div>
                                                        <div className="text-xl font-semibold text-primary">
                                                            {allFilled ? letter : "—"}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm text-base-content/70">Points</div>
                                                        <div className="text-xl font-semibold text-base-content">
                                                            {allFilled ? points.toFixed(2) : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Save Section */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-base-content mb-2">
                                                        Reason for Change
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="input input-bordered w-full bg-base-200 border-base-300"
                                                        placeholder="e.g., re-evaluation after appeal, correction of calculation error..."
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                    />
                                                </div>

                                                <button
                                                    className="btn btn-primary w-full"
                                                    onClick={saveChanges}
                                                    disabled={!allFilled || !reason.trim() || saving}
                                                >
                                                    {saving ? (
                                                        <span className="loading loading-spinner loading-sm"></span>
                                                    ) : (
                                                        <FaSave className="w-4 h-4" />
                                                    )}
                                                    Save New Version
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MdOutlineEditNote className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-base-content mb-2">No Series Selected</h3>
                                <p className="text-base-content/50 max-w-sm">
                                    Select a course series from the list to start editing grades.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditGrades;