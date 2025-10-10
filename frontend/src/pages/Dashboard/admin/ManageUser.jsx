import { useEffect, useState } from "react";
import { FaSearch, FaCheckCircle, FaTimesCircle, FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch users when filters or search query change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (role !== "all") params.append("role", role);
        if (status !== "all") params.append("status", status);
        if (query) params.append("search", query);

        const res = await fetch(`http://localhost:5000/system-users?${params.toString()}`);
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role, status, query]);

  // ✅ Trigger search manually
  const handleSearch = () => {
    setQuery(search.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // ✅ Handle status change
  const handleStatusChange = async (walletAddress, action) => {
    try {
      const res = await fetch(
        `http://localhost:5000/system-users?walletAddress=${walletAddress}&action=${action}`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (data.modifiedCount >= 1) {
        setUsers((prev) =>
          prev.map((u) =>
            u.walletAddress === walletAddress ? { ...u, status: action } : u
          )
        );
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // ✅ Badge color by status
  const getStatusBadge = (status) => {
    const colors = {
      approved: "badge-success",
      rejected: "badge-error",
      pending: "badge-warning",
    };
    return `badge ${colors[status] || "badge-neutral"} capitalize`;
  };

  return (
    <div className="min-h-screen bg-base-100 text-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <MdAdminPanelSettings className="text-3xl" /> Manage Users
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-base-200 p-4 rounded-xl shadow mb-5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name, email, wallet, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-72 bg-base-300 text-gray-200 placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary btn-square"
              title="Search"
            >
              <FaSearch />
            </button>
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-base-200 rounded-xl shadow">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No users found.</p>
          ) : (
            <table className="table w-full">
              <thead className="bg-base-300 text-gray-300">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Wallet Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.walletAddress} className="hover:bg-base-300 transition-colors">
                    <td>{i + 1}</td>
                    <td>{user.studentName || user.teacherName || "N/A"}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>{user.studentEmail || user.teacherEmail || "N/A"}</td>
                    <td className="font-mono text-sm">{user.walletAddress}</td>
                    <td>
                      <span className={getStatusBadge(user.status)}>{user.status}</span>
                    </td>
                    <td className="flex gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="btn btn-xs btn-outline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {selectedUser && (
          <dialog open className="modal modal-open">
            <div className="modal-box bg-base-200 text-gray-200 max-w-3xl">
              <h3 className="text-lg font-bold border-b border-base-300 pb-2 mb-4">
                User Details
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><FaUser className="inline mr-2 text-primary" /> <b>Name:</b> {selectedUser.studentName || selectedUser.teacherName}</p>
                <p><FaEnvelope className="inline mr-2 text-primary" /> <b>Email:</b> {selectedUser.studentEmail || selectedUser.teacherEmail}</p>
                <p><FaPhone className="inline mr-2 text-primary" /> <b>Phone:</b> {selectedUser.studentPhone || selectedUser.teacherPhone}</p>
                <p><b>Role:</b> {selectedUser.role}</p>
                <p><b>Status:</b> <span className={getStatusBadge(selectedUser.status)}>{selectedUser.status}</span></p>
                <p><b>Wallet Address:</b> {selectedUser.walletAddress}</p>
                <p><b>Gender:</b> {selectedUser.gender || "N/A"}</p>
                <p><b>Blood Group:</b> {selectedUser.bloodGroup || "N/A"}</p>
                <p><b>Created At:</b> {new Date(selectedUser.createdAt).toLocaleString()}</p>

                {selectedUser.role === "teacher" && (
                  <>
                    <p><b>Department:</b> {selectedUser.department || "N/A"}</p>
                    <p><b>Qualification:</b> {selectedUser.qualification || "N/A"}</p>
                    <p><b>Experience:</b> {selectedUser.experience || "N/A"} years</p>
                    <p><b>Specialization:</b> {selectedUser.specialization?.join(", ") || "N/A"}</p>
                  </>
                )}

                {selectedUser.role === "student" && (
                  <>
                    <p><b>Program:</b> {selectedUser.enrollProgram || "N/A"}</p>
                    <p><b>HSC Roll:</b> {selectedUser.hscRoll || "N/A"}</p>
                    <p><b>HSC CGPA:</b> {selectedUser.hscCGPA || "N/A"}</p>
                  </>
                )}
              </div>

              <div className="modal-action flex justify-between mt-6">
                <div className="flex gap-2">
                  {selectedUser.status === "approved" && (
                    <button
                      onClick={() => handleStatusChange(selectedUser.walletAddress, "rejected")}
                      className="btn btn-error btn-sm flex items-center gap-2"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  )}
                  {selectedUser.status === "rejected" && (
                    <button
                      onClick={() => handleStatusChange(selectedUser.walletAddress, "approved")}
                      className="btn btn-success btn-sm flex items-center gap-2"
                    >
                      <FaCheckCircle /> Approve
                    </button>
                  )}
                  {selectedUser.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedUser.walletAddress, "approved")}
                        className="btn btn-success btn-sm flex items-center gap-2"
                      >
                        <FaCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedUser.walletAddress, "rejected")}
                        className="btn btn-error btn-sm flex items-center gap-2"
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => setSelectedUser(null)} className="btn btn-outline btn-sm">
                  Close
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
