import React, { useContext, useEffect, useState } from "react";
import { getContract } from "../../../hook/useContract";
import { AuthContext } from "../../../contextAPI/AuthContext";
import {
    FaHistory,
    FaUniversity,
    FaCalendarAlt,
    FaUserGraduate,
    FaFileAlt,
    FaKey
} from "react-icons/fa";
import { MdGrade, MdInfo } from "react-icons/md";
import Swal from 'sweetalert2';
import { nodeBackend } from "../../../axios/axiosInstance";

export default function MyResult() {
    const { userInfo } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [seriesMap, setSeriesMap] = useState({});
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [decryptedData, setDecryptedData] = useState({});
    const [gradeHistory, setGradeHistory] = useState({});
    const [showHistory, setShowHistory] = useState(null);
    const [isBulkDecrypting, setIsBulkDecrypting] = useState(false);
    const [courseNames, setCourseNames] = useState({});

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
                        versionCount: 0, // Initialize version count
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
                    text: 'Failed to load academic data',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            setLoading(false);
        };

        init();
    }, [userInfo?.walletAddress]);

    // Load version counts for all courses in the selected semester
    useEffect(() => {
        const loadVersionCounts = async () => {
            if (!selectedSemester || Object.keys(seriesMap).length === 0) return;

            setLoading(true);
            try {
                const contract = await getContract();
                const updatedSeriesMap = { ...seriesMap };
                const coursesInSemester = Object.values(seriesMap).filter(s => s.semesterCode === selectedSemester);

                for (const course of coursesInSemester) {
                    try {
                        const countBN = await contract.getVersionCount(course.seriesId);
                        const count = Number(countBN);
                        updatedSeriesMap[course.seriesId] = {
                            ...updatedSeriesMap[course.seriesId],
                            versionCount: count
                        };
                    } catch (err) {
                        console.error(`Error loading version count for ${course.courseCode}:`, err);
                        updatedSeriesMap[course.seriesId] = {
                            ...updatedSeriesMap[course.seriesId],
                            versionCount: 1 // Default to 1 if error
                        };
                    }
                }

                setSeriesMap(updatedSeriesMap);
            } catch (err) {
                console.error("Error loading version counts:", err);
            }
            setLoading(false);
        };

        loadVersionCounts();
        fetchCourseNames();
    }, [selectedSemester]);


    const fetchCourseNames = async () => {
        const names = {};
        for (const course of currentCourses) {
            const res = await nodeBackend(`/course/${course.courseCode}`);
            const data = await res.data;
            console.log(data);
            names[course.courseCode] = data.courseTitle;
        }
        setCourseNames(names);
    };


    const handleDecryptCourse = async (seriesId, isBulkOperation = false) => {
        const entry = seriesMap[seriesId];
        if (!entry) return;

        if (!privateKey || privateKey.trim().length === 0) {
            if (!isBulkOperation) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Private Key Required',
                    text: 'Please paste your private key in PEM format to decrypt grades',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            return false;
        }

        // Validate PEM format
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
            if (!isBulkOperation) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Private Key Format',
                    text: 'Please provide a valid PEM formatted private key',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            return false;
        }

        try {
            const contract = await getContract();
            const countBN = await contract.getVersionCount(seriesId);
            const count = Number(countBN);

            let latestDecryptedData = null;
            let versionHistory = [];

            // Get all versions to build history
            for (let i = 0; i < count; i++) {
                const v = await contract.getVersion(seriesId, i);
                const [cid, ts, editor, reason] = v;

                const ipfsResp = await nodeBackend.get(`/ipfsData?cid=${cid}`);
                const ipfsJson = ipfsResp.data;

                // Store version info for history
                versionHistory.push({
                    versionNumber: i + 1,
                    timestamp: new Date(Number(ts) * 1000),
                    editor,
                    reason: reason || 'No reason provided',
                    isCurrent: (i + 1) === entry.currentVersion
                });

                // Only decrypt the latest version (current version)
                if ((i + 1) === entry.currentVersion) {
                    // Decrypt the version
                    const recipient = norm(userInfo.walletAddress);
                    let matchingEncryptedKey = null;

                    if (Array.isArray(ipfsJson.encryptedKeys)) {
                        matchingEncryptedKey = ipfsJson.encryptedKeys.find(
                            (e) => norm(e.recipientId) === recipient
                        );
                    }

                    const tryDecryptWith = async (encryptedKey) => {
                        const body = {
                            recipientPrivateKey: privateKey.trim(),
                            encryptedKey: encryptedKey,
                            iv: ipfsJson.iv,
                            authTag: ipfsJson.authTag,
                            ciphertext: ipfsJson.ciphertext,
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
                        for (const ek of ipfsJson.encryptedKeys || []) {
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

                    // Store the decrypted data for the current version
                    latestDecryptedData = {
                        versionNumber: i + 1,
                        timestamp: new Date(Number(ts) * 1000),
                        editor,
                        reason,
                        decryptedData: decryptResult,
                    };
                }
            }

            if (latestDecryptedData) {
                setDecryptedData(prev => ({
                    ...prev,
                    [seriesId]: latestDecryptedData
                }));

                // Store version history
                setGradeHistory(prev => ({
                    ...prev,
                    [seriesId]: versionHistory
                }));

                if (!isBulkOperation) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Decryption Successful',
                        text: 'Grades have been successfully decrypted',
                        background: '#1f2937',
                        color: 'white',
                        confirmButtonColor: '#2563eb',
                        timer: 2000
                    });
                }
                return true;
            }

        } catch (err) {
            console.error("decrypt error", err);
            if (!isBulkOperation) {
                Swal.fire({
                    icon: 'error',
                    title: 'Decryption Failed',
                    text: err?.response?.data?.message || err.message || 'Failed to decrypt grades. Please check your private key.',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
            return false;
        }
        return false;
    };

    const decryptAllCourses = async () => {
        if (!privateKey || privateKey.trim().length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Private Key Required',
                text: 'Please paste your private key in PEM format to decrypt grades',
                background: '#1f2937',
                color: 'white',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Validate PEM format
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Private Key Format',
                text: 'Please provide a valid PEM formatted private key',
                background: '#1f2937',
                color: 'white',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        setLoading(true);
        setIsBulkDecrypting(true);
        const currentCourses = Object.values(seriesMap).filter(s => s.semesterCode === selectedSemester);
        let successCount = 0;

        try {
            for (const course of currentCourses) {
                try {
                    const success = await handleDecryptCourse(course.seriesId, true);
                    if (success) {
                        successCount++;
                    }
                    // Small delay to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (err) {
                    console.error(`Failed to decrypt ${course.courseCode}:`, err);
                }
            }

            if (successCount > 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'Decryption Complete',
                    text: `Successfully decrypted ${successCount} out of ${currentCourses.length} courses`,
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb',
                    timer: 3000
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Decryption Failed',
                    text: 'Failed to decrypt any courses. Please check your private key and try again.',
                    background: '#1f2937',
                    color: 'white',
                    confirmButtonColor: '#2563eb'
                });
            }
        } finally {
            setLoading(false);
            setIsBulkDecrypting(false);
        }
    };

    const currentCourses = Object.values(seriesMap)
        .filter((s) => s.semesterCode === selectedSemester)
        .sort((a, b) => (a.courseCode || "").localeCompare(b.courseCode || ""));

    const getGradeColor = (letterGrade) => {
        const gradeColors = {
            'A+': 'text-green-600',
            'A': 'text-green-600',
            'A-': 'text-green-500',
            'B+': 'text-blue-600',
            'B': 'text-blue-600',
            'B-': 'text-blue-500',
            'C+': 'text-yellow-600',
            'C': 'text-yellow-600',
            'C-': 'text-yellow-500',
            'D': 'text-orange-600',
            'F': 'text-red-600'
        };
        return gradeColors[letterGrade] || 'text-gray-600';
    };

    const getGradePointColor = (gradePoints) => {
        if (gradePoints >= 3.75) return 'text-green-600';
        if (gradePoints >= 3.0) return 'text-blue-600';
        if (gradePoints >= 2.0) return 'text-yellow-600';
        return 'text-red-600';
    };

    const hasMultipleVersions = (seriesId) => {
        const entry = seriesMap[seriesId];
        return entry && entry.versionCount > 1;
    };

    const showGradeHistory = (seriesId) => {
        setShowHistory(seriesId);
    };

    const closeGradeHistory = () => {
        setShowHistory(null);
    };

    const getCourseMarks = (seriesId) => {
        const data = decryptedData[seriesId];
        return data?.decryptedData?.decryptedData?.marks;
    };

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                                <FaFileAlt className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">Academic Results</h1>
                                <p className="text-base-content/60">View your semester-wise results and grade history</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-2">
                                <FaCalendarAlt className="w-4 h-4 inline mr-2 text-primary" />
                                Select Semester
                            </label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="select select-bordered w-full bg-base-200"
                            >
                                <option value="">Choose semester</option>
                                {semesters.map((s) => {
                                    // Extract season and year
                                    const season = s.replace(/[0-9]/g, ""); // "summer"
                                    const year = s.replace(/\D/g, "");      // "2025"
                                    const formatted = season.charAt(0).toUpperCase() + season.slice(1) + " " + year;

                                    return (
                                        <option key={s} value={s}>
                                            {formatted}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-base-content mb-2">
                                <FaKey className="w-4 h-4 inline mr-2 text-primary" />
                                Private Key (PEM Format)
                            </label>
                            <textarea
                                rows={4}
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                placeholder="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
                                className="textarea textarea-bordered w-full font-mono text-sm bg-base-200 resize-none"
                            />
                            <div className="text-xs text-base-content/50 mt-1">
                                Paste your complete private key in PEM format including BEGIN and END lines
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            className="btn btn-primary"
                            onClick={decryptAllCourses}
                            disabled={!selectedSemester || !privateKey.trim() || loading}
                        >
                            {loading && isBulkDecrypting ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <MdGrade className="w-4 h-4" />
                            )}
                            {loading && isBulkDecrypting ? 'Decrypting...' : 'Dycrypt Results'}
                        </button>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
                    {(selectedSemester && currentCourses.length > 0) ? (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-base-content">
                                    Results for{" "}
                                    {selectedSemester &&
                                        selectedSemester.replace(/[0-9]/g, "").charAt(0).toUpperCase() +
                                        selectedSemester.replace(/[0-9]/g, "").slice(1) +
                                        " " +
                                        selectedSemester.replace(/\D/g, "")}
                                </h2>
                                <div className="text-sm text-base-content/60">
                                    {currentCourses.filter(course => decryptedData[course.seriesId]).length} of {currentCourses.length} courses decrypted
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr className="bg-base-200">
                                            <th className="text-base-content font-semibold">Subject Code</th>
                                            <th className="text-base-content font-semibold">Subject Name</th>
                                            <th className="text-base-content font-semibold text-center">Credits</th>
                                            <th className="text-base-content font-semibold text-center">Total Marks</th>
                                            <th className="text-base-content font-semibold text-center">Letter Grade</th>
                                            <th className="text-base-content font-semibold text-center">Grade Points</th>
                                            <th className="text-base-content font-semibold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentCourses.map((course) => {
                                            const marks = getCourseMarks(course.seriesId);
                                            const hasHistory = hasMultipleVersions(course.seriesId);
                                            const isDecrypted = !!decryptedData[course.seriesId];

                                            return (
                                                <tr key={course.seriesId} className="hover:bg-base-200">
                                                    <td className="font-mono text-base-content">
                                                        {course.courseCode}
                                                    </td>
                                                    <td className="text-base-content">
                                                        {courseNames[course.courseCode] || "Loading..."}
                                                    </td>
                                                    <td className="text-center text-base-content">
                                                        3.0
                                                    </td>
                                                    <td className="text-center">
                                                        {isDecrypted ? (
                                                            <span className="font-semibold text-base-content">
                                                                {marks?.total || '-'}
                                                                {hasHistory && (
                                                                    <button
                                                                        className="text-primary ml-1"
                                                                        onClick={() => showGradeHistory(course.seriesId)}
                                                                        title="View grade history"
                                                                    >
                                                                        *
                                                                    </button>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-ghost btn-xs"
                                                                onClick={() => handleDecryptCourse(course.seriesId, false)}
                                                                disabled={loading}
                                                            >
                                                                {loading && !isBulkDecrypting ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    "Decrypt"
                                                                )}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {isDecrypted ? (
                                                            <span className={`font-bold ${getGradeColor(marks?.letterGrade)}`}>
                                                                {marks?.letterGrade || '-'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-base-content/60">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {isDecrypted ? (
                                                            <span className={`font-bold ${getGradePointColor(marks?.gradePoints)}`}>
                                                                {marks?.gradePoints ? marks.gradePoints.toFixed(2) : '-'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-base-content/60">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {hasHistory && isDecrypted && (
                                                            <button
                                                                className="btn btn-ghost btn-xs"
                                                                onClick={() => showGradeHistory(course.seriesId)}
                                                            >
                                                                <FaHistory className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Section */}
                            {Object.keys(decryptedData).length > 0 && (
                                <div className="mt-6 p-4 bg-base-200 rounded-lg">
                                    <h3 className="font-semibold text-base-content mb-3">Semester Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="text-base-content/60">Courses Completed</div>
                                            <div className="text-xl font-bold text-primary">{Object.keys(decryptedData).length}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-base-content/60">Semester GPA</div>
                                            <div className="text-xl font-bold text-primary">
                                                {(() => {
                                                    const validCourses = currentCourses.filter(course => {
                                                        const marks = getCourseMarks(course.seriesId);
                                                        return marks?.gradePoints;
                                                    });
                                                    const totalPoints = validCourses.reduce((sum, course) => {
                                                        const marks = getCourseMarks(course.seriesId);
                                                        return sum + (marks?.gradePoints || 0);
                                                    }, 0);
                                                    return validCourses.length > 0 ? (totalPoints / validCourses.length).toFixed(2) : '0.00';
                                                })()}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-base-content/60">Total Credits</div>
                                            <div className="text-xl font-bold text-primary">{Object.keys(decryptedData).length * 3}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-base-content/60">Status</div>
                                            <div className="text-xl font-bold text-green-600">Completed</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Legend */}
                            {Object.keys(decryptedData).length > 0 && (
                                <div className="mt-4 text-xs text-base-content/60">
                                    <MdInfo className="w-3 h-3 inline mr-1" />
                                    * indicates courses with grade updates - click to view history
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="text-center text-base-content/60">
                                No courses available for the selected semester
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {selectedSemester && currentCourses.length === 0 && !loading && (
                    <div className="bg-base-100 rounded-xl p-12 text-center">
                        <FaFileAlt className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-base-content mb-2">No Courses Available</h3>
                        <p className="text-base-content/60">No courses found for the selected semester</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-base-100 rounded-xl p-12 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <p className="text-base-content/60">Loading and decrypting results...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Grade History Modal */}
            {showHistory && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            <FaHistory className="w-5 h-5 mr-2 text-primary" />
                            Grade History - {seriesMap[showHistory]?.courseCode}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="bg-base-200">
                                        <th className="text-base-content font-semibold">Version</th>
                                        <th className="text-base-content font-semibold">Date & Time</th>
                                        <th className="text-base-content font-semibold">Updated By</th>
                                        <th className="text-base-content font-semibold">Reason for Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradeHistory[showHistory]?.map((history, index) => (
                                        <tr key={index} className={history.isCurrent ? 'bg-primary/10' : ''}>
                                            <td className="font-mono">
                                                {history.versionNumber}
                                                {history.isCurrent && <span className="badge badge-primary badge-xs ml-2">Current</span>}
                                            </td>
                                            <td className="text-sm">
                                                {history.timestamp.toLocaleString()}
                                            </td>
                                            <td className="text-sm font-mono">{history.editor}</td>
                                            <td className="text-sm">{history.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={closeGradeHistory}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}