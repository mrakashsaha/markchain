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
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Fetch assigned courses
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

  // Fetch dependencies
  useEffect(() => {
    fetchAssignedCourses();
    nodeBackend.get("/courses").then(res => setCourses(res.data));
    nodeBackend.get("/system-users?role=teacher&status=approved").then(res => setTeachers(res.data));
    nodeBackend.get("/semesters").then(res => setSemesters(res.data));
  }, []);

  useEffect(() => {
    fetchAssignedCourses();
  }, [departmentFilter, semesterFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const courseData = Object.fromEntries(data.entries());

    console.log(courseData)

    nodeBackend
      .post("/assignedCourses", {courseData})
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
        nodeBackend.delete(`/assignedCourses/${id}`)
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

  if (loading) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary">Manage Assigned Courses</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
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
                {s.semesterName} {s.year}
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
                <th>Wallet</th>
                <th>Semester</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedCourses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No assigned courses found.</td>
                </tr>
              ) : (
                assignedCourses.map((a, i) => (
                  <tr key={a._id}>
                    <td>{i + 1}</td>
                    <td>{a.courseCode}</td>
                    <td>{a.courseInfo.courseTitle}</td>
                    <td>{a.courseInfo.credit}</td>
                    <td>{a.teacherInfo.teacherName}</td>
                    <td className="text-xs">{a.teacherInfo.walletAddress}</td>
                    <td>{a.semesterInfo.semesterName} {a.semesterInfo.year}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="btn btn-sm btn-error flex items-center gap-1"
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

        {/* Modal */}
        {showModal && <input type="checkbox" id="assign-course-modal" className="modal-toggle" checked readOnly />}
        <div className={`modal ${showModal ? "modal-open" : ""}`}>
          <div className="modal-box bg-base-100 text-gray-200 rounded-2xl">
            <h3 className="font-bold text-lg text-primary mb-4">Assign Course to Teacher</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="label">
                <span className="label-text">Course</span>
              </label>
              <select name="courseCode" className="select select-bordered w-full bg-base-300 text-gray-200" required>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.courseCode}>
                    {c.courseTitle} ({c.courseCode})
                  </option>
                ))}
              </select>

              <label className="label">
                <span className="label-text">Teacher</span>
              </label>
              <select name="teacherWallet" className="select select-bordered w-full bg-base-300 text-gray-200" required>
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t.walletAddress}>
                    {t.teacherName} [{t.department}] - {t.teacherEmail}
                  </option>
                ))}
              </select>

              <label className="label">
                <span className="label-text">Semester</span>
              </label>
              <select name="semesterCode" className="select select-bordered w-full bg-base-300 text-gray-200" required>
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s.semesterCode}>
                    {s.semesterName} {s.year}
                  </option>
                ))}
              </select>

              <div className="modal-action">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAssignedCourses;
