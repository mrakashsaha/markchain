import React, { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import Swal from "sweetalert2";

const ManageAssignedCourses = () => {
  const [assignedCourses, setAssignedCourses] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentLimit, setStudentLimit] = useState("");

  // Split loading: init vs table fetch
  const [initLoading, setInitLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Ensure we auto-select running semester only once
  const didAutoselectSemester = useRef(false);

  // Fetch assigned courses with filters
  const fetchAssignedCourses = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      if (semesterFilter !== "all" && semesterFilter) {
        params.append("semesterCode", semesterFilter);
      }
      const res = await nodeBackend.get(`/assignedCourses?${params.toString()}`);
      setAssignedCourses(res.data || []);
    } catch (error) {
      console.error(error);
      CustomToast({ icon: "error", title: "Failed to load assigned courses" });
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch dependencies once; then autoselect current running semester
  useEffect(() => {
    const fetchData = async () => {
      setInitLoading(true);
      try {
        const [coursesRes, teachersRes, semestersRes] = await Promise.all([
          nodeBackend.get("/courses"),
          nodeBackend.get("/system-users?role=teacher&status=approved"),
          nodeBackend.get("/semesters"),
        ]);

        const semList = semestersRes.data || [];
        setCourses(coursesRes.data || []);
        setTeachers(teachersRes.data || []);
        setSemesters(semList);

        // Auto-select running semester only once
        if (!didAutoselectSemester.current) {
          const current = semList.find((s) => s.status === "running");
          if (current?.semesterCode) {
            setSemesterFilter(current.semesterCode);
          }
          didAutoselectSemester.current = true;
        }
      } catch (error) {
        console.error(error);
        CustomToast({ icon: "error", title: "Failed to load dependencies" });
      } finally {
        setInitLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refetch table when filters change, only after init done
  useEffect(() => {
    if (!initLoading) {
      fetchAssignedCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFilter, semesterFilter, initLoading]);

  // Assign Course Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const courseData = Object.fromEntries(data.entries());

    nodeBackend
      .post("/assignedCourses", { courseData })
      .then((res) => {
        if (res.data.insertedId) {
          CustomToast({ icon: "success", title: "Course assigned successfully" });
          fetchAssignedCourses();
          setShowModal(false);
        }
      })
      .catch((error) => {
        CustomToast({
          icon: "error",
          title: `${error.response?.data?.error || "Something went wrong"}`,
        });
      });
  };

  // Delete Assigned Course
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to remove this assignment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        nodeBackend
          .delete(`/assignedCourses/${id}`)
          .then((res) => {
            if (res.data.deletedCount > 0) {
              Swal.fire("Deleted!", "Assignment removed successfully.", "success");
              fetchAssignedCourses();
            }
          })
          .catch(() => {
            CustomToast({ icon: "error", title: "Failed to delete" });
          });
      }
    });
  };

  // Offer or Close Course
  const handleOffer = async (courseId, isOffered, limit = null) => {
    try {
      const payload = { isOffered };
      if (isOffered) payload.studentLimit = Number(limit);

      await nodeBackend.patch(`/assignedCourses?id=${courseId}`, payload);
      CustomToast({
        icon: "success",
        title: isOffered ? "Course offered successfully!" : "Course closed successfully!",
      });
      fetchAssignedCourses();
      setOfferModal(false);
      setSelectedCourse(null);
      setStudentLimit("");
    } catch (error) {
      console.error(error);
      CustomToast({ icon: "error", title: "Failed to update offer status" });
    }
  };

  // Offer Modal Open
  const openOfferModal = (course) => {
    setSelectedCourse(course);
    setStudentLimit(course.studentLimit || ""); // prefill previous value
    setOfferModal(true);
  };

  if (initLoading) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary">Assign and Offer Courses</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus /> Assign Course
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200 w-full md:w-48"
          >
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="BBA">BBA</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200 w-full md:w-64"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s._id} value={s.semesterCode}>
                {s.semesterName} {s.year} {s.status === "running" && "(Current)"}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Credit</th>
                <th>Teacher</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Action</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan="9" className="py-6 text-center">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : assignedCourses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No assigned courses found.
                  </td>
                </tr>
              ) : (
                assignedCourses.map((a, i) => (
                  <tr key={a._id}>
                    <td>{i + 1}</td>
                    <td>{a.courseCode}</td>
                    <td>{a.courseInfo?.courseTitle}</td>
                    <td>{a.courseInfo?.credit}</td>
                    <td>{a.teacherInfo?.teacherName}</td>
                    <td>
                      {a.semesterInfo?.semesterName} {a.semesterInfo?.year}
                    </td>
                    <td>
                      {a.isOffered ? (
                        <span className="badge badge-success badge-soft">
                          Offered {a.studentLimit ? `(${a.studentLimit})` : ""}
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-soft">
                          Not Offered
                        </span>
                      )}
                    </td>
                    <td className="flex flex-wrap gap-2">
                      {a.isOffered ? (
                        <button
                          onClick={() => handleOffer(a._id, false)}
                          className="btn px-4 btn-sm btn-neutral"
                        >
                          Close Offer
                        </button>
                      ) : (
                        <button
                          onClick={() => openOfferModal(a)}
                          className="btn btn-sm btn-primary"
                        >
                          Offer Course
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="btn btn-sm btn-error btn-soft flex items-center gap-1"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Offer Modal */}
        {offerModal && (
          <dialog open className="modal">
            <div className="modal-box bg-base-100 text-gray-200 rounded-2xl">
              <h3 className="font-bold text-lg text-primary mb-4">
                Offer Course: {selectedCourse?.courseInfo?.courseTitle}
              </h3>

              <div className="fieldset">
                <label className="label">Student Limit</label>
                <input
                  value={studentLimit}
                  onChange={(e) => setStudentLimit(e.target.value)}
                  type="number"
                  min={1}
                  className="input w-full"
                  placeholder="Enter student limit"
                />
              </div>

              <div className="modal-action">
                <button onClick={() => setOfferModal(false)} className="btn btn-sm btn-outline">
                  Cancel
                </button>
                <button
                  onClick={() => handleOffer(selectedCourse._id, true, studentLimit)}
                  className="btn btn-sm btn-primary"
                  disabled={!studentLimit || Number(studentLimit) <= 0}
                >
                  Confirm Offer
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Assign Modal */}
        {showModal && (
          <div className={`modal ${showModal ? "modal-open" : ""}`}>
            <div className="modal-box bg-base-100 text-gray-200 rounded-2xl">
              <h3 className="font-bold text-lg text-primary mb-4">
                Assign Course to Teacher
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="label">Course</label>
                <select
                  name="courseCode"
                  className="select select-bordered w-full bg-base-300 text-gray-200"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c.courseCode}>
                      {c.courseTitle} ({c.courseCode})
                    </option>
                  ))}
                </select>

                <label className="label">Teacher</label>
                <select
                  name="teacherWallet"
                  className="select select-bordered w-full bg-base-300 text-gray-200"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t.walletAddress}>
                      {t.teacherName} [{t.department}] - {t.teacherEmail}
                    </option>
                  ))}
                </select>

                <label className="label">Semester</label>
                <select
                  name="semesterCode"
                  defaultValue={
                    semesters.find((s) => s.status === "running")?.semesterCode || ""
                  }
                  className="select select-bordered w-full bg-base-300 text-gray-200"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s._id} value={s.semesterCode}>
                      {s.semesterName} {s.year} {s.status === "running" && "(Current)"}
                    </option>
                  ))}
                </select>

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAssignedCourses;