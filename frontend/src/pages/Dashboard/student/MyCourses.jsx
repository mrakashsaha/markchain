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

  // Filter only by semesterCode
  const [semesterFilter, setSemesterFilter] = useState("all"); // "all" or specific semesterCode

  // Search input + applied query (Enter/button applies)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  // Fetch semesters once; hide upcoming and preselect running semesterCode
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const { data } = await nodeBackend.get("/semesters");
        const available = (data || []).filter((s) => s.status !== "upcoming");
        setSemesters(available);

        const running = available.find((s) => s.status === "running");
        const defaultCode =
          running?.semesterCode || available[0]?.semesterCode || "all";
        setSemesterFilter(defaultCode);
      } catch (e) {
        console.error(e);
        CustomToast({ icon: "error", title: "Failed to load semesters" });
      }
    };
    fetchSemesters();
  }, []);

  // Fetch my courses
  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!userInfo?.walletAddress) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          studentWallet: userInfo.walletAddress,
        });

        if (searchQuery) params.append("search", searchQuery);
        // Only pass semester when it's a real code
        if (semesterFilter && semesterFilter !== "all") {
          params.append("semester", semesterFilter);
        }

        const res = await nodeBackend.get(`/my-courses?${params.toString()}`);
        setMyCourses(res.data || []);
      } catch (e) {
        console.error(e);
        CustomToast({ icon: "error", title: "Failed to load courses" });
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [userInfo, searchQuery, semesterFilter]);

  // Search handlers (Enter or button to apply)
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


  if (loading || !userInfo?.walletAddress) return <LoadingSpiner />;

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header + Controls (Search + Filter + Refresh) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FaBook /> My Courses
          </h1>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch">
            {/* Search input + apply/clear */}
            <div className="relative flex-1 md:w-96">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course or teacher..."
                className="input input-bordered bg-base-300 text-gray-200 pl-10 w-full h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <button onClick={handleSearchClick} className="btn btn-primary h-12">
              <FaSearch /> Search
            </button>

            {/* Semester filter (codes only, no upcoming) */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="select select-bordered bg-base-300 text-gray-200 h-12 md:w-64"
            >
              <option value="all">All Semesters</option>
              {semesters.map((s) => (
                <option key={s._id} value={s.semesterCode}>
                  {s.semesterName} {s.year} {s.status === "running" ? "(Current)" : ""}
                </option>
              ))}
            </select>

            <button onClick={() => setSearchQuery(searchTerm.trim())} className="btn btn-neutral h-12">
              <IoMdRefresh /> Refresh
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
                    No courses found. Try changing the semester or search.
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
                    <td>{semesterLabel(c)}</td>
                    <td>
                      {c.type === "retake" ? "Retake":"Regular"}
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
      </div>
    </div>
  );
};

export default MyCourses;