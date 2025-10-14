import React, { useEffect, useState } from "react";
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

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // ✅ Fetch assigned courses with filters
  const fetchAssignedCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      if (semesterFilter !== "all") params.append("semesterCode", semesterFilter);

      const res = await nodeBackend.get(`/assignedCourses?${params.toString()}`);
      setAssignedCourses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch all dependencies once and auto-select running semester
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [coursesRes, teachersRes, semestersRes] = await Promise.all([
          nodeBackend.get("/courses"),
          nodeBackend.get("/system-users?role=teacher&status=approved"),
          nodeBackend.get("/semesters"),
        ]);

        setCourses(coursesRes.data);
        setTeachers(teachersRes.data);
        setSemesters(semestersRes.data);

        const currentSemester = semestersRes.data.find((s) => s.status === "running");
        if (currentSemester) {
          setSemesterFilter(currentSemester.semesterCode);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Refetch when filters change
  useEffect(() => {
    fetchAssignedCourses();
  }, [departmentFilter, semesterFilter]);

  // ✅ Assign Course Submit Handler
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

  // ✅ Delete Assigned Course
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

  // ✅ Offer or Close Course
  const handleOffer = async (courseId, isOffered, limit = null) => {
    try {
      const payload = { isOffered };
      if (isOffered) payload.studentLimit = Number(limit);

      await nodeBackend.patch(`/assignedCourses?id=${courseId}`, payload);
      CustomToast({
        icon: "success",
        title: isOffered
          ? "Course offered successfully!"
          : "Course closed successfully!",
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

  // ✅ Handle Offer Modal Open
  const openOfferModal = (course) => {
    setSelectedCourse(course);
    setStudentLimit(course.studentLimit || ""); // prefill previous value
    setOfferModal(true);
  };

  if (loading) return <LoadingSpiner />;

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
            className="select select-bordered bg-base-300 text-gray-200 w-full md:w-48"
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
              {assignedCourses.length === 0 ? (
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
                          Offered ({a.studentLimit})
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

        {/* ✅ Offer Modal */}
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
                  className="input w-full"
                  placeholder="Enter student limit"
                />
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setOfferModal(false)}
                  className="btn btn-sm btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleOffer(selectedCourse._id, true, studentLimit)
                  }
                  className="btn btn-sm btn-primary"
                  disabled={!studentLimit}
                >
                  Confirm Offer
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Assign Modal (unchanged) */}
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
                      {s.semesterName} {s.year}{" "}
                      {s.status === "running" && "(Current)"}
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
