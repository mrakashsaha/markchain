import React, { useContext, useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaSearch, FaBook } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import Swal from "sweetalert2";
import { AuthContext } from "../../../contextAPI/AuthContext";

const EnrollCourses = () => {
  const { userInfo } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 triggers fetch only when Enter or button pressed
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchCourses();
  }, [searchQuery, userInfo])

  // ✅ Fetch offered courses for current student
  const fetchCourses = async () => {
    if (!userInfo?.walletAddress) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentWallet: userInfo.walletAddress,
        search: searchQuery,
      });

      const res = await nodeBackend.get(`/offer-courses?${params.toString()}`);
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      CustomToast({ icon: "error", title: "Failed to fetch courses" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Press Enter to search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(searchTerm.trim());
    }
  };

  // ✅ Search button click
  const handleSearchClick = () => {
    setSearchQuery(searchTerm.trim());
  };

  // ✅ Enroll handler
  const handleEnroll = async (course) => {
    try {
      const confirm = await Swal.fire({
        title: `Enroll in ${course.courseTitle}?`,
        text: `You will be enrolled as ${course.type.toUpperCase()}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Enroll",
      });

      if (!confirm.isConfirmed) return;

      const enrollmentData = {
        assignedCourseId: course._id,
        studentWallet: userInfo.walletAddress,
        teacherWallet: course.teacherWallet,
        courseCode: course.courseCode,
        semesterCode: course.semesterCode,
        type: course.type,
        isCompleted: false,
      }

      console.log(enrollmentData);

      const res = await nodeBackend.post("/enroll", { enrollmentData });

      if (res.data.insertedId) {
        CustomToast({ icon: "success", title: "Enrolled successfully!" });
        fetchCourses();
      }
    } catch (error) {
      console.error(error);
      CustomToast({
        icon: "error",
        title: error.response?.data?.message || "Failed to enroll",
      });
    }
  };

  // ✅ Drop handler
  const handleDrop = async (course) => {
    try {
      const confirm = await Swal.fire({
        title: `Drop ${course.courseTitle}?`,
        text: "Are you sure you want to drop this course?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Drop it",
      });

      if (!confirm.isConfirmed) return;

      const res = await nodeBackend.delete(
        `/enroll?studentWallet=${userInfo.walletAddress}&assignedCourseId=${course._id}`
      );

      if (res.data.deletedCount > 0) {
        CustomToast({ icon: "success", title: "Course dropped successfully!" });
        fetchCourses();
      }
    } catch (error) {
      console.error(error);
      CustomToast({ icon: "error", title: "Failed to drop course" });
    }
  };


  if (loading) return <LoadingSpiner />;
  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FaBook /> Enroll Courses
          </h1>

          {/* ✅ Search Box + Button */}
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course or teacher..."
                className="input input-bordered bg-base-300 text-gray-200 pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown} // 🔍 triggers only on Enter
              />
            </div>
            <button
              onClick={handleSearchClick}
              className="btn btn-primary flex items-center gap-1"
            >
              <FaSearch /> Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Course Code</th>
                <th>Title</th>
                <th>Credit</th>
                <th>Teacher</th>
                <th>Type</th>
                <th>Semester</th>
                <th>Seats</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No offered courses available.
                  </td>
                </tr>
              ) : (
                courses.map((course, i) => (
                  <tr key={course._id}>
                    <td>{i + 1}</td>
                    <td>{course.courseCode}</td>
                    <td>{course.courseTitle}</td>
                    <td>{course.credit}</td>
                    <td>{course.teacherName}</td>
                    <td>
                      <span
                        className={`badge ${course.type === "retake"
                          ? "badge-warning"
                          : "badge-success"
                          }`}
                      >
                        {course.type}
                      </span>
                    </td>
                    <td>{course.semesterName} {course.semesterYear}</td>
                    <td>
                      {course.enrolledCount}/{course.studentLimit}
                    </td>
                    <td>
                      {course.isEnrolled === true ? (
                        <button
                          onClick={() => handleDrop(course)}
                          className="btn btn-sm px-5 btn-error flex items-center gap-1"
                        >
                          <FaTimesCircle /> Drop
                        </button>
                      ) : (
                        <button disabled={course.enrolledCount === course.studentLimit}
                          onClick={() => handleEnroll(course)}
                          className={`btn btn-sm flex items-center gap-2 ${course.type === "retake" ? "btn-warning" : "btn-primary"
                            }`}
                        >
                          {course.type === "retake" ? (
                            <>
                              <IoMdRefresh className="text-lg" /> Retake
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="text-lg" /> Enroll
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrollCourses;
