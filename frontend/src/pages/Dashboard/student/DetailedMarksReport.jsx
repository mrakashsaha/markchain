import React, { useContext, useEffect, useState } from "react";
import { getContract } from "../../../hook/useContract";
import { AuthContext } from "../../../contextAPI/AuthContext";
import {
    FaEye,
    FaLock,
    FaLockOpen,
    FaCalendarAlt,
    FaBook,
    FaUserGraduate,
    FaKey,
    FaHistory,
    FaCheckCircle,
    FaTimesCircle
} from "react-icons/fa";
import { MdGrade, MdExpandMore, MdExpandLess } from "react-icons/md";
import Swal from 'sweetalert2';
import { nodeBackend } from "../../../axios/axiosInstance";

export default function DetailedMarksReport() {
    const { userInfo } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // UI state
    const [seriesMap, setSeriesMap] = useState({});
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [expandedCourses, setExpandedCourses] = useState(new Set());
    const [activeVersion, setActiveVersion] = useState({});

    // Helper: normalize address lower-case
    const norm = (a = "") => a.toLowerCase();

    useEffect(() => {
        const init = async () => {
            if (!userInfo?.walletAddress) return;
            setLoading(true);
            try {
                const contract = await getContract();
                const seriesIds = await contract.listSeriesIdsByStudent(userInfo.walletAddress);
                const map = {};
                const semSet = new Set();

                for (let i = 0; i < seriesIds.length; i++) {
                    const sid = seriesIds[i];
                    const head = await contract.getSeriesHead(sid);
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
                        versions: [],
                        expanded: false,
                    };

                    semSet.add(semesterCode);
                }

                setSeriesMap(map);
                const semesterArray = Array.from(semSet).sort().reverse();
                setSemesters(semesterArray);
                if (!selectedSemester && semesterArray.length > 0) {
                    setSelectedSemester(semesterArray[0]);
                }
            } catch (err) {
                console.error("init error", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Load Failed',
                    text: 'Failed to load grade data',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            setLoading(false);
        };

        init();
    }, [userInfo?.walletAddress]);

    const toggleCourseExpansion = async (seriesId) => {
        const entry = seriesMap[seriesId];
        if (!entry) return;

        const newExpanded = new Set(expandedCourses);
        if (newExpanded.has(seriesId)) {
            newExpanded.delete(seriesId);
            setExpandedCourses(newExpanded);
            return;
        }

        if (entry.versions.length === 0) {
            setLoading(true);
            try {
                const contract = await getContract();
                const countBN = await contract.getVersionCount(seriesId);
                const count = Number(countBN);

                const versions = [];
                for (let i = 0; i < count; i++) {
                    const v = await contract.getVersion(seriesId, i);
                    const [cid, ts, editor, reason] = v;

                    const ipfsResp = await nodeBackend.get(`/ipfsData?cid=${cid}`);
                    const ipfsJson = ipfsResp.data;

                    versions.push({
                        versionNumber: i + 1,
                        cid,
                        timestamp: new Date(Number(ts) * 1000).toISOString(),
                        editor,
                        reason,
                        ipfsJson,
                        decrypted: null,
                        decryptError: null,
                        decryptLoading: false,
                    });
                }

                setSeriesMap(prev => ({
                    ...prev,
                    [seriesId]: { ...entry, versions, expanded: true }
                }));
            } catch (err) {
                console.error("expand error", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Load Failed',
                    text: 'Failed to load version history',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            setLoading(false);
        }

        newExpanded.add(seriesId);
        setExpandedCourses(newExpanded);
    };

    const handleDecryptVersion = async (seriesId, versionIndex) => {
        const entry = seriesMap[seriesId];
        if (!entry) return;
        const version = entry.versions[versionIndex];
        if (!version) return;

        if (!privateKey || privateKey.trim().length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Private Key Required',
                text: 'Please paste your private key to decrypt grades',
                background: '#1f2937',
                color: 'white',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        version.decryptLoading = true;
        updateSeriesEntry(seriesId, entry);

        try {
            const recipient = norm(userInfo.walletAddress);
            let matchingEncryptedKey = null;

            if (Array.isArray(version.ipfsJson.encryptedKeys)) {
                matchingEncryptedKey = version.ipfsJson.encryptedKeys.find(
                    (e) => norm(e.recipientId) === recipient
                );
            }

            const tryDecryptWith = async (encryptedKey) => {
                const body = {
                    recipientPrivateKey: privateKey,
                    encryptedKey: encryptedKey,
                    iv: version.ipfsJson.iv,
                    authTag: version.ipfsJson.authTag,
                    ciphertext: version.ipfsJson.ciphertext,
                };
                const resp = await nodeBackend.post("/decrypt", body, {
                    headers: { "Content-Type": "application/json" },
                });
                return resp.data;
            };

            let decryptResult = null;
            if (matchingEncryptedKey) {
                decryptResult = await tryDecryptWith(matchingEncryptedKey.encryptedKey);
            } else {
                let lastErr = null;
                for (const ek of version.ipfsJson.encryptedKeys || []) {
                    try {
                        const r = await tryDecryptWith(ek.encryptedKey);
                        decryptResult = r;
                        break;
                    } catch (e) {
                        lastErr = e;
                    }
                }
                if (!decryptResult) {
                    throw lastErr || new Error("No encryptedKey decrypted successfully.");
                }
            }

            version.decrypted = decryptResult;
            version.decryptError = null;
            setActiveVersion({ seriesId, versionIndex });
        } catch (err) {
            console.error("decrypt err", err);
            version.decryptError = err?.response?.data || err.message || String(err);
            version.decrypted = null;
        } finally {
            version.decryptLoading = false;
            updateSeriesEntry(seriesId, entry);
        }
    };

    const updateSeriesEntry = (seriesId, newEntry) => {
        setSeriesMap((prev) => ({ ...prev, [seriesId]: newEntry }));
    };

    const currentCourses = Object.values(seriesMap)
        .filter((s) => s.semesterCode === selectedSemester)
        .sort((a, b) => (a.courseCode || "").localeCompare(b.courseCode || ""));

    const getGradeColor = (letterGrade) => {
        const gradeColors = {
            'A+': 'text-green-500',
            'A': 'text-green-500',
            'A-': 'text-green-500',
            'B+': 'text-blue-500',
            'B': 'text-blue-500',
            'B-': 'text-blue-500',
            'C+': 'text-yellow-500',
            'C': 'text-yellow-500',
            'C-': 'text-yellow-500',
            'D': 'text-orange-500',
            'F': 'text-red-500'
        };
        return gradeColors[letterGrade] || 'text-gray-500';
    };

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                                <FaEye className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">Detailed Marks Report</h1>
                                <p className="text-base-content/60">View your academic records and grades</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Control Panel */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Semester Selection */}
                        <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300">
                            <div className="flex items-center space-x-3 mb-4">
                                <FaCalendarAlt className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-base-content">Academic Semester</h2>
                            </div>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="select select-bordered w-full bg-base-200"
                            >
                                <option value="">Select semester</option>
                                {semesters.map((s) => (
                                    <option key={s} value={s}>{s.replace(/[0-9]/g, "").charAt(0).toUpperCase() + s.replace(/[0-9]/g, "").slice(1) + " " + s.replace(/\D/g, "")}</option>
                                ))}
                            </select>
                        </div>

                        {/* Security Section */}
                        <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300">
                            <div className="flex items-center space-x-3 mb-4">
                                <FaKey className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-base-content">Security Access</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Private Key
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={privateKey}
                                        onChange={(e) => setPrivateKey(e.target.value)}
                                        placeholder="Paste your private key in PEM format"
                                        className="textarea textarea-bordered w-full font-mono text-sm bg-base-200 resize-none"
                                    />
                                </div>
                                <div className="text-xs text-base-content/50 space-y-1">
                                    <p>Your private key is required to decrypt grade information.</p>
                                    <p>It is never stored and only used for decryption.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="xl:col-span-3">
                        {loading ? (
                            <div className="bg-base-100 rounded-xl p-12 flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                    <p className="text-base-content/60">Loading academic records</p>
                                </div>
                            </div>
                        ) : !selectedSemester ? (
                            <div className="bg-base-100 rounded-xl p-12 text-center">
                                <FaBook className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-base-content mb-2">Select Academic Semester</h3>
                                <p className="text-base-content/60">Choose a semester from the sidebar to view your courses</p>
                            </div>
                        ) : currentCourses.length === 0 ? (
                            <div className="bg-base-100 rounded-xl p-12 text-center">
                                <FaUserGraduate className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-base-content mb-2">No Courses Available</h3>
                                <p className="text-base-content/60">No courses found for the selected semester</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-base-content">Courses</h2>
                                    <span className="text-base-content/60">{currentCourses.length} courses</span>
                                </div>

                                {currentCourses.map((course) => (
                                    <div
                                        key={course.seriesId}
                                        className={`rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${expandedCourses.has(course.seriesId)
                                            ? 'bg-primary/5 border-primary/30 shadow-md'
                                            : 'bg-base-100 border-base-300'
                                            }`}
                                    >
                                        {/* Course Header */}
                                        <div
                                            className="p-6 cursor-pointer transition-colors border-b"
                                            onClick={() => toggleCourseExpansion(course.seriesId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${expandedCourses.has(course.seriesId)
                                                        ? 'bg-primary/20'
                                                        : 'bg-primary/10'
                                                        }`}>
                                                        <FaBook className={`w-5 h-5 transition-colors ${expandedCourses.has(course.seriesId)
                                                            ? 'text-primary'
                                                            : 'text-primary/80'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <h3 className={`text-lg font-semibold transition-colors ${expandedCourses.has(course.seriesId)
                                                            ? 'text-primary'
                                                            : 'text-base-content'
                                                            }`}>
                                                            {course.courseCode}
                                                        </h3>
                                                        <p className="text-base-content/60 text-sm">Enrollment ID: {course.enrollmentId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <div className="text-sm text-base-content/60">Version</div>
                                                        <div className={`text-md font-bold transition-colors ${expandedCourses.has(course.seriesId)
                                                            ? 'text-primary'
                                                            : 'text-primary'
                                                            }`}>
                                                            {course.currentVersion}
                                                        </div>
                                                    </div>
                                                    <div className={`transition-colors ${expandedCourses.has(course.seriesId)
                                                        ? 'text-primary'
                                                        : 'text-base-content/60'
                                                        }`}>
                                                        {expandedCourses.has(course.seriesId) ? (
                                                            <MdExpandLess className="w-5 h-5" />
                                                        ) : (
                                                            <MdExpandMore className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Course Content */}
                                        {expandedCourses.has(course.seriesId) && (
                                            <div className="p-6 bg-base-100">
                                                {course.versions.length === 0 ? (
                                                    <div className="text-center py-8 text-base-content/60">
                                                        <span className="loading loading-spinner loading-sm mr-2"></span>
                                                        Loading grade history
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-3 mb-4">
                                                            <FaHistory className="w-5 h-5 text-primary" />
                                                            <h4 className="text-lg font-semibold text-base-content">Grade History</h4>
                                                        </div>

                                                        {course.versions.map((version, idx) => (
                                                            <div key={version.cid} className={`border rounded-lg p-4 transition-all ${activeVersion.seriesId === course.seriesId && activeVersion.versionIndex === idx
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-base-300 bg-base-200'
                                                                }`}>
                                                                {/* Version Header */}
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className={`badge ${version.versionNumber === course.currentVersion ? 'badge-accent badge-soft' : 'badge-soft text-gray-400'}`}>
                                                                            Version {version.versionNumber}
                                                                            {version.versionNumber === course.currentVersion && (
                                                                                <FaCheckCircle className="w-3 h-3 ml-1" />
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-base-content/60">
                                                                            {new Date(version.timestamp).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        className={`btn btn-sm ${version.decrypted ? 'btn-success' : 'btn-primary'}`}
                                                                        disabled={version.decryptLoading}
                                                                        onClick={() => handleDecryptVersion(course.seriesId, idx)}
                                                                    >
                                                                        {version.decryptLoading ? (
                                                                            <span className="loading loading-spinner loading-xs"></span>
                                                                        ) : version.decrypted ? (
                                                                            <FaLockOpen className="w-3 h-3" />
                                                                        ) : (
                                                                            <FaLock className="w-3 h-3" />
                                                                        )}
                                                                        {version.decryptLoading ? 'Decrypting' : version.decrypted ? 'Decrypted' : 'Decrypt'}
                                                                    </button>
                                                                </div>

                                                                {/* Version Details */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                                                    <div>
                                                                        <span className="text-base-content/60">Updated by:</span>
                                                                        <div className="font-mono text-xs mt-1 truncate">{version.editor}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-base-content/60">Reason:</span>
                                                                        <div className="mt-1">{version.reason || 'No reason provided'}</div>
                                                                    </div>
                                                                </div>

                                                                {/* Status */}
                                                                <div className="mb-3">
                                                                    {version.decryptError ? (
                                                                        <div className="text-error text-sm flex items-center">
                                                                            <FaTimesCircle className="w-4 h-4 mr-2" />
                                                                            Decryption failed: {String(version.decryptError)}
                                                                        </div>
                                                                    ) : version.decrypted ? (
                                                                        <div className="text-success text-sm flex items-center">
                                                                            <FaCheckCircle className="w-4 h-4 mr-2" />
                                                                            Successfully decrypted
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-warning text-sm">Encrypted - Click decrypt to view grades</div>
                                                                    )}
                                                                </div>

                                                                {/* Decrypted Content */}
                                                                {version.decrypted && (
                                                                    <div className="mt-4 p-4 bg-base-100 rounded-lg border border-base-300">
                                                                        <h5 className="font-semibold text-base-content mb-4 flex items-center">
                                                                            <MdGrade className="w-5 h-5 mr-2 text-primary" />
                                                                            Grade Information
                                                                        </h5>

                                                                        {/* Grade Summary */}
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                                            <div className="text-center">
                                                                                <div className="text-sm text-base-content/60">Total</div>
                                                                                <div className="text-xl font-bold text-base-content">
                                                                                    {version.decrypted?.decryptedData?.marks?.total ?? '-'}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <div className="text-sm text-base-content/60">Percentage</div>
                                                                                <div className="text-xl font-bold text-base-content">
                                                                                    {version.decrypted?.decryptedData?.marks?.total ?
                                                                                        `${Math.round((version.decrypted.decryptedData.marks.total / 100) * 100)}%` : '-'
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <div className="text-sm text-base-content/60">Grade</div>
                                                                                <div className={`text-xl font-bold ${getGradeColor(version.decrypted?.decryptedData?.marks?.letterGrade)}`}>
                                                                                    {version.decrypted?.decryptedData?.marks?.letterGrade ?? '-'}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <div className="text-sm text-base-content/60">Points</div>
                                                                                <div className="text-xl font-bold text-base-content">
                                                                                    {version.decrypted?.decryptedData?.marks?.gradePoints ?? '-'}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Components */}
                                                                        {version.decrypted?.decryptedData?.marks?.components && (
                                                                            <div>
                                                                                <h6 className="font-semibold text-base-content mb-3">Component Breakdown</h6>
                                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                                                    {Object.entries(version.decrypted.decryptedData.marks.components).map(([key, value]) => (
                                                                                        <div key={key} className="bg-base-200 rounded-lg p-3 text-center">
                                                                                            <div className="text-sm text-base-content/60 capitalize">
                                                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                                            </div>
                                                                                            <div className="text-md font-semibold text-base-content">{value}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-4 text-xs text-base-content/50 border-t border-base-300 pt-3">
                                                                            Computed: {new Date(version.decrypted?.decryptedData?.computedAt).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}