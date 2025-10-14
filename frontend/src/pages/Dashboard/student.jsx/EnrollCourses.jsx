import React, { useEffect, useState } from "react";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import { FaCheckCircle, FaPlus } from "react-icons/fa";

const EnrollCourses = () => {
  const [offeredCourses, setOfferedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch student info (assuming saved in localStorage after login)
  useEffect(() => {
    const storedStudent = JSON.parse(localStorage.getItem("studentInfo"));
    if (storedStudent) setStudent(storedStudent);
  }, []);

  // Fetch current semester
  const fetchCurrentSemester = async () => {
    try {
      const res = await nodeBackend.get("/semesters/current");
      setCurrentSemester(res.data);
    } catch (err) {
      console.error("Failed to fetch current semester:", err);
    }
  };

  // Fetch offered courses
  const fetchOfferedCourses = async (department, semesterCode) => {
    setLoading(true);
    try {
      const res = await nodeBackend.get(
        `/offerCourses?department=${department}&semesterCode=${semesterCode}`
      );
      setOfferedCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch enrolled courses for this student
  const fetchEnrolledCourses = async (studentId) => {
    try {
      const res = await nodeBackend.get(`/enrollCourses/student/${studentId}`);
      setEnrolledCourses(res.data.map((e) => e.offerId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (student && currentSemester) {
      fetchOfferedCourses(student.department, currentSemester.semesterCode);
      fetchEnrolledCourses(student._id);
    }
  }, [student, currentSemester]);

  useEffect(() => {
    fetchCurrentSemester();
  }, []);

  const handleEnroll = async (offerId) => {
    try {
      const payload = {
        offerId,
        studentId: student._id,
        enrolledAt: new Date().toISOString(),
      };
      const res = await nodeBackend.post("/enrollCourses", payload);
      if (res.data.insertedId) {
        CustomToast({ icon: "success", title: "Enrolled successfully!" });
        fetchEnrolledCourses(student._id);
      }
    } catch (err) {
      CustomToast({
        icon: "error",
        title: err.response?.data?.error || "Failed to enroll",
      });
    }
  };

  if (loading) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Enroll in Courses</h1>

        {student && currentSemester && (
          <div className="flex gap-4 mb-6">
            <div className="badge badge-primary p-3 text-lg">
              Department: {student.department}
            </div>
            <div className="badge badge-secondary p-3 text-lg">
              Semester: {currentSemester.semesterName} {currentSemester.year}
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Course</th>
                <th>Teacher</th>
                <th>Capacity</th>
                <th>Enrolled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {offeredCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No courses available to enroll.
                  </td>
                </tr>
              ) : (
                offeredCourses.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td>{c.assignedInfo.courseInfo.courseTitle}</td>
                    <td>{c.assignedInfo.teacherInfo.teacherName}</td>
                    <td>{c.courseCapacity}</td>
                    <td>{c.enrolledCount}</td>
                    <td>
                      {enrolledCourses.includes(c._id) ? (
                        <button className="btn btn-sm btn-success flex items-center gap-2" disabled>
                          <FaCheckCircle /> Enrolled
                        </button>
                      ) : c.enrolledCount >= c.courseCapacity ? (
                        <button className="btn btn-sm btn-disabled">Full</button>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary flex items-center gap-2"
                          onClick={() => handleEnroll(c._id)}
                        >
                          <FaPlus /> Enroll
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
