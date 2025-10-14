import React, { useEffect, useState } from "react";
import { FaSearch, FaPlus, FaTrash } from "react-icons/fa";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import Swal from "sweetalert2";

const CreateCourses = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ✅ Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await nodeBackend.get(`/courses?${params.toString()}`);
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ✅ Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  // ✅ Handle Add Course
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const courseData = Object.fromEntries(data.entries());

    // Parse types
    courseData.credit = Number(courseData.credit);
    courseData.prerequisites = courseData.prerequisites
      ? courseData.prerequisites.split(",").map((p) => p.trim())
      : ["None"];

    nodeBackend
      .post("/courses", { courseData })
      .then((res) => {
        if (res.data.insertedId) {
          CustomToast({
            icon: "success",
            title: `${courseData.courseCode} added successfully`,
          });
          fetchCourses();
        }
      })
      .catch((error) => {
        CustomToast({
          icon: "error",
          title: `${error.response?.data?.error || "Something Went Wrong"}`,
        });
      });

    setShowModal(false);
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This course will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        nodeBackend
          .delete(`/courses?id=${id}`)
          .then((res) => {
            if (res.data.deletedCount > 0) {
              Swal.fire({
                title: "Deleted!",
                text: "Course deleted successfully.",
                icon: "success",
              });
              fetchCourses();
            }
          })
          .catch((error) => {
            CustomToast({
              icon: "error",
              title: "Failed to delete course",
            });
            console.error(error);
          });
      }
    });

    if (loading) return <LoadingSpiner />;
  };

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary">Manage Courses</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus /> Add Course
          </button>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex items-center w-full md:w-auto gap-2 mb-6"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course..."
            className="input input-bordered bg-base-300 text-gray-200 w-full md:w-64"
          />
          <button type="submit" className="btn btn-primary flex items-center gap-2">
            <FaSearch /> Search
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Code</th>
                <th>Title</th>
                <th>Credit</th>
                <th>Department</th>
                <th>Prerequisites</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No courses found.
                  </td>
                </tr>
              ) : (
                courses.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td>{c.courseCode}</td>
                    <td>{c.courseTitle}</td>
                    <td>{c.credit}</td>
                    <td>{c.department}</td>
                    <td>{c.prerequisites?.join(", ")}</td>
                    <td className="truncate max-w-xs">{c.description || "N/A"}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(c._id)}
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

        {/* DaisyUI Modal */}
        {showModal && (
          <input type="checkbox" id="course-modal" className="modal-toggle" checked readOnly />
        )}
        <div className={`modal ${showModal ? "modal-open" : ""}`}>
          <div className="modal-box bg-base-100 text-gray-200 rounded-2xl">
            <h3 className="font-bold text-lg text-primary mb-4">Add New Course</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-x-5">
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Course Code</span>
                  </label>
                  <input
                    name="courseCode"
                    placeholder="e.g. CSE101"
                    className="input input-bordered w-full bg-base-300 text-gray-200"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Credit</span>
                  </label>
                  <input
                    type="number"
                    name="credit"
                    placeholder="e.g. 3"
                    className="input input-bordered w-full bg-base-300 text-gray-200"
                    required
                  />
                </div>
              </div>

              <label className="label">
                <span className="label-text">Course Title</span>
              </label>
              <input
                name="courseTitle"
                placeholder="Introduction to Programming"
                className="input input-bordered w-full bg-base-300 text-gray-200"
                required
              />

              <label className="label">
                <span className="label-text">Department</span>
              </label>
              <select
                name="department"
                className="select select-bordered w-full bg-base-300 text-gray-200"
                required
              >
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="EEE">EEE</option>
                <option value="BBA">BBA</option>
                <option value="LLB">LLB</option>
                <option value="English">English</option>
              </select>

              <label className="label">
                <span className="label-text">Prerequisites (comma separated)</span>
              </label>
              <input
                name="prerequisites"
                placeholder="e.g. None, CSE100"
                className="input input-bordered w-full bg-base-300 text-gray-200"
              />

              <label className="label">
                <span className="label-text">Description (optional)</span>
              </label>
              <textarea
                name="description"
                className="textarea textarea-bordered w-full bg-base-300 text-gray-200"
                rows="3"
              ></textarea>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourses;
