import React, { useContext, useEffect, useMemo, useState, Fragment } from "react";
import { FaBookOpen, FaPaperPlane } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import Swal from "sweetalert2";
import { AuthContext } from "../../../contextAPI/AuthContext";

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

// Grade mapping (computed from percent internally, not shown)
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

const toNum = (v) =>
  typeof v === "number" ? v : Number(v?.$numberInt ?? v?.$numberDouble ?? v?.numberInt ?? v ?? 0);

const SubmitGrades = () => {
  const { userInfo } = useContext(AuthContext);
  const teacherWallet = userInfo?.walletAddress;

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // { [enrollmentId]: { fieldKey: number | "" } }
  const [marksMap, setMarksMap] = useState({});

  // Scheme by credit
  const scheme = useMemo(() => {
    const credit = toNum(selectedCourse?.credit);
    return credit === 1 ? LAB_SCHEME : THEORY_SCHEME;
  }, [selectedCourse]);

  // Total only from filled numbers; blanks count as 0
  const computeTotal = (m) =>
    scheme.fields.reduce((sum, f) => sum + (m?.[f.key] === "" ? 0 : Number(m?.[f.key] || 0)), 0);

  // Are all fields filled (not blank)?
  const allFilled = (m) => scheme.fields.every((f) => m?.[f.key] !== "" && m?.[f.key] != null);

  // Clamp with blank support
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

  // Load semesters (hide upcoming; preselect running)
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        const { data } = await nodeBackend.get("/semesters");
        const list = (data || []).filter((s) => s.status !== "upcoming");
        setSemesters(list);
        const running = list.find((s) => s.status === "running");
        if (running) setSelectedSemester(running.semesterCode);
        else if (list.length) setSelectedSemester(list[0].semesterCode);
      } catch {
        CustomToast({ icon: "error", title: "Failed to load semesters" });
      }
    };
    loadSemesters();
  }, []);

  // Load teacher courses
  useEffect(() => {
    const loadCourses = async () => {
      if (!teacherWallet || !selectedSemester) return;
      setCoursesLoading(true);
      setSelectedCourse(null);
      setStudents([]);
      setMarksMap({});
      try {
        const params = new URLSearchParams({ teacherWallet, semesterCode: selectedSemester });
        const { data } = await nodeBackend.get(`/teacher-courses?${params.toString()}`);
        setCourses(data || []);
      } catch {
        CustomToast({ icon: "error", title: "Failed to load courses" });
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, [teacherWallet, selectedSemester]);

  // Load students and seed blank/default marks
  const openCourse = async (course) => {
    setSelectedCourse(course);
    setStudentsLoading(true);
    setStudents([]);
    setMarksMap({});
    try {
      const params = new URLSearchParams({ teacherWallet, assignedCourseId: course._id, isCompleted: false});
      const { data } = await nodeBackend.get(`/teacher-course-students?${params.toString()}`);
      const rows = data?.students || [];
      setStudents(rows);

      const credit = toNum(course?.credit);
      const courseScheme = credit === 1 ? LAB_SCHEME : THEORY_SCHEME;

      const next = {};
      rows.forEach((r) => {
        const comp = r?.marks?.components || r?.marks || {};
        const seed = {};
        courseScheme.fields.forEach((f) => {
          // If existing mark present, use it; else blank ""
          const val = comp?.[f.key];
          seed[f.key] = typeof val === "number" ? val : val != null ? Number(val) : "";
        });
        next[r.enrollmentId] = seed;
      });
      setMarksMap(next);
    } catch {
      CustomToast({ icon: "error", title: "Failed to load students" });
    } finally {
      setStudentsLoading(false);
    }
  };

  const updateMark = (enrollmentId, field, value) => {
    const max = scheme.fields.find((f) => f.key === field)?.max;
    setMarksMap((prev) => {
      const cur = prev[enrollmentId] || {};
      return { ...prev, [enrollmentId]: { ...cur, [field]: clamp(value, max) } };
    });
  };

  // Validate required fields and confirm before submit
  const submitOne = async (student) => {
    const m = marksMap[student.enrollmentId] || {};
    // Check required fields
    const missing = scheme.fields.filter((f) => m[f.key] === "" || m[f.key] == null);
    if (missing.length) {
      CustomToast({
        icon: "error",
        title: `Please fill: ${missing.map((x) => x.label.split(" (")[0]).join(", ")}`,
      });
      return;
    }

    // Confirm
    const ok = await Swal.fire({
      title: "Submit marks?",
      text: "Once submitted, marks cannot be changed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    });
    if (!ok.isConfirmed) return;

    const total = computeTotal(m);
    const percent = Math.round((total / scheme.outOf) * 100);
    const { letter, points } = gradeInfoFromPercent(percent);

    const payload = {
      assignedCourseId: selectedCourse?._id,
      courseCode: selectedCourse?.courseCode,
      semesterCode: selectedCourse?.semesterCode || selectedSemester,
      teacherWallet,
      enrollmentId: student.enrollmentId,
      studentWallet: student.studentWallet,
      studentName: student.studentName,
      type: student.type,
      credit: toNum(selectedCourse?.credit),
      scheme: {
        outOf: scheme.outOf,
        fields: scheme.fields.map((f) => ({ key: f.key, max: f.max })),
      },
      marks: {
        components: scheme.fields.reduce((obj, f) => {
          obj[f.key] = Number(m[f.key]);
          return obj;
        }, {}),
        total,               // out of 100 (theory) or 90 (lab)
        letterGrade: letter,
        gradePoints: points,
      },
      computedAt: new Date().toISOString(),
    };

    console.log("SUBMIT_MARKS", payload);
    CustomToast({
      icon: "success",
      title: `Marks submitted for ${student.studentName || student.studentWallet}`,
    });
    openCourse(selectedCourse); // refech current course
  };


  if (!teacherWallet || !selectedSemester && semesters.length === 0) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-4 md:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <FaBookOpen /> Submit Marks (Individual)
          </h1>

          {/* Semester filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="select select-bordered bg-base-300 text-gray-200 h-12 w-full sm:w-64 md:w-72"
            >
              {semesters
                .filter((s) => s.status !== "upcoming")
                .map((s) => (
                  <option key={s._id} value={s.semesterCode}>
                    {s.semesterName} {s.year} {s.status === "running" ? "(Current)" : ""}
                  </option>
                ))}
            </select>
            <button onClick={() => setSelectedSemester(selectedSemester)} className="btn btn-neutral h-12">
              <IoMdRefresh /> Refresh
            </button>
          </div>
        </div>

        {/* Courses (unchanged) */}
        <div className="bg-base-100 border border-base-300 rounded-2xl p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Your courses in this semester</h2>
          {coursesLoading ? (
            <div className="py-8 flex justify-center">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-gray-400 py-6">No assigned courses found for this semester.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra text-gray-200">
                <thead>
                  <tr className="text-primary">
                    <th>#</th>
                    <th>Course Code</th>
                    <th>Title</th>
                    <th>Credit</th>
                    <th>Enrolled</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => (
                    <tr key={c._id}>
                      <td>{i + 1}</td>
                      <td className="font-semibold">{c.courseCode}</td>
                      <td>{c.courseTitle}</td>
                      <td>{toNum(c.credit)}</td>
                      <td>{c.enrolledCount}</td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => openCourse(c)}>
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

        {/* Provide Marking: two-part rows; no middle border; inline submit */}
        {selectedCourse && (
          <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedCourse.courseTitle} ({selectedCourse.courseCode})
                </h2>
                <p className="text-sm text-gray-400">
                  Semester: {selectedCourse.semesterName} {selectedCourse.semesterYear} • Credit: {toNum(selectedCourse.credit)}{" "}
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => openCourse(selectedCourse)}>
                <IoMdRefresh /> Reload
              </button>
            </div>

            {studentsLoading ? (
              <div className="py-8 flex justify-center">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-gray-400 py-6">No students enrolled in this course.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="table table-auto text-gray-200">
                  <thead>
                    <tr className="text-primary">
                      <th className="">#</th>
                      <th className="">Student</th>
                      <th className="">Wallet</th>
                      <th className="">Type</th>
                      <th className="">Score</th>
                      <th className="">Grade Point</th>
                      <th className="">Letter Grade</th>
                    </tr>
                  </thead>

                  {students.map((s, i) => {
                    const m = marksMap[s.enrollmentId] || {};
                    const filled = allFilled(m);
                    const total = filled ? computeTotal(m) : 0;
                    const percent = filled ? Math.round((total / scheme.outOf) * 100) : 0;
                    const { letter, points } = gradeInfoFromPercent(percent);

                    return (
                      <tbody key={s.enrollmentId} className="[&>tr]:bg-transparent">
                        {/* Summary row — no bottom border */}
                        <tr className="align-middle border-b-0">
                          <td>{i + 1}</td>
                          <td>
                            <div className="font-semibold truncate">{s.studentName || "Unknown"}</div>
                            <div className="text-[11px] text-gray-400">{s.studentEmail || "-"}</div>
                          </td>
                          <td className="text-[11px] break-all">{s.studentWallet}</td>
                          <td>
                            {s.type === "retake" ? (
                              <span className="badge badge-warning badge-sm">Retake</span>
                            ) : (
                              <span className="badge badge-primary badge-sm">Regular</span>
                            )}
                          </td>
                          <td>
                            <div className="font-semibold">
                              {filled ? `${total} / ${scheme.outOf}` : "—"}
                            </div>
                          </td>
                          <td className="font-semibold">{filled ? points.toFixed(2) : "—"}</td>
                          <td className="font-semibold">{filled ? letter : "—"}</td>
                        </tr>

                        {/* Details row — spans all; inputs + inline submit; no top border */}
                        <tr className="border-t-0">
                          <td></td>
                          <td colSpan={6} className="pt-4">
                            <div className="">
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
                                      value={m[f.key] ?? ""}
                                      onChange={(e) => updateMark(s.enrollmentId, f.key, e.target.value)}
                                    />
                                  </label>
                                ))}
                                <div className="flex md:justify-start justify-end">
                                  <button className="btn btn-sm btn-primary" onClick={() => submitOne(s)}>
                                    <FaPaperPlane /> Submit Marks
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Spacer */}
                        <tr className="border-0 h-2">
                          <td colSpan={6} />
                        </tr>
                      </tbody>
                    );
                  })}
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitGrades;