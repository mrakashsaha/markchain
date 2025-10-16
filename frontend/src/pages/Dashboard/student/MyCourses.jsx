import React, { useContext, useEffect, useState } from "react";
import { FaSearch, FaTimes, FaBook } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import CustomToast from "../../../Toast/CustomToast";
import { AuthContext } from "../../../contextAPI/AuthContext";

const MyCourses = () => {
  const { userInfo } = useContext(AuthContext);
  const [myCourses, setMyCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Filters
  const [semesterFilter, setSemesterFilter] = useState("all"); // all | running | upcoming | completed | <semesterCode>

  // Search UX like EnrollCourses: input + "apply" trigger
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // used for API

  const [loading, setLoading] = useState(false);

  // Fetch semesters once and default to running if available
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const { data } = await nodeBackend.get("/semesters");
        setSemesters(data || []);
        const running = (data || []).find((s) => s.status === "running");
        if (running) setSemesterFilter("running");
      } catch (e) {
        console.error(e);
        CustomToast({ icon: "error", title: "Failed to load semesters" });
      }
    };
    fetchSemesters();
  }, []);

  // Fetch my courses when wallet is ready and filters/search change
  useEffect(() => {
    fetchMyCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, searchQuery, semesterFilter]);

  const fetchMyCourses = async () => {
    if (!userInfo?.walletAddress) return; // wait for AuthContext to provide wallet
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentWallet: userInfo.walletAddress,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (semesterFilter !== "all") params.append("semester", semesterFilter);

      const res = await nodeBackend.get(`/my-courses?${params.toString()}`);
      setMyCourses(res.data || []);
    } catch (e) {
      console.error(e);
      CustomToast({ icon: "error", title: "Failed to load courses" });
    } finally {
      setLoading(false);
    }
  };

  // Search handlers (Enter to search + button)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") setSearchQuery(searchTerm.trim());
  };
  const handleSearchClick = () => setSearchQuery(searchTerm.trim());
  const handleResetSearch = () => {
    setSearchTerm("");
    setSearchQuery("");
  };

  const semesterLabel = (c) =>
    c?.semesterName ? `${c.semesterName} ${c.semesterYear}` : c?.semesterCode || "-";

  if (!userInfo?.walletAddress || loading) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FaBook /> My Courses
          </h1>

          {/* Search box + actions */}
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course or teacher..."
                className="input input-bordered bg-base-300 text-gray-200 pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <button onClick={handleSearchClick} className="btn btn-primary">
              <FaSearch /> Search
            </button>

            <button onClick={fetchMyCourses} className="btn btn-neutral">
              <IoMdRefresh /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200 w-full md:w-64"
          >
            <option value="all">All</option>
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
                <th>Type</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6">
                    No courses found. Try changing filters or search.
                  </td>
                </tr>
              ) : (
                myCourses.map((c, i) => (
                  <tr key={c.enrollmentId || `${c.courseCode}-${i}`}>
                    <td>{i + 1}</td>
                    <td className="font-semibold">{c.courseCode}</td>
                    <td>{c.courseTitle}</td>
                    <td>{c.credit}</td>
                    <td>{c.teacherName || "-"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{semesterLabel(c)}</span>
                        {c.semesterStatus === "running" && (
                          <span className="badge badge-success badge-soft">Running</span>
                        )}
                        {c.semesterStatus === "upcoming" && (
                          <span className="badge badge-info badge-soft">Upcoming</span>
                        )}
                        {c.semesterStatus === "completed" && (
                          <span className="badge badge-neutral badge-soft">Completed</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.type === "retake" ? (
                        <span className="badge badge-warning badge-soft">Retake</span>
                      ) : (
                        <span className="badge badge-primary badge-soft">Regular</span>
                      )}
                    </td>
                    <td>
                      {c.isCompleted ? (
                        <span className="badge badge-success badge-soft">Completed</span>
                      ) : (
                        <span className="badge badge-accent badge-soft">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Showing {myCourses.length} course{myCourses.length !== 1 ? "s" : ""}.
        </div>
      </div>
    </div>
  );
};

export default MyCourses;