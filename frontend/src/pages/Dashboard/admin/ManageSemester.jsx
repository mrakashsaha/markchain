import React, { useEffect, useState } from "react";
import { FaSearch, FaPlus, FaTrash } from "react-icons/fa";
import { nodeBackend } from "../../../axios/axiosInstance";
import LoadingSpiner from "../../../components/LoadingSpiner";
import moment from "moment";
import CustomToast from "../../../Toast/CustomToast";
import Swal from "sweetalert2";

const ManageSemester = () => {
  const [semesters, setSemesters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ✅ Fetch semesters
  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await nodeBackend.get(`/semesters?${params.toString()}`);
      setSemesters(res.data);
    } catch (error) {
      console.error("Failed to fetch semesters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [statusFilter]);

  // ✅ Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchSemesters();
  };

  // ✅ Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const semesterData = Object.fromEntries(data.entries());

    semesterData.startDate = moment(semesterData.startDate).toISOString();
    semesterData.endDate = moment(semesterData.endDate).toISOString();
    semesterData.year = Number(semesterData.year);
    semesterData.semesterCode = `${semesterData.semesterName.toLowerCase()}${semesterData.year}`;

    nodeBackend
      .post("/semesters", { semesterData })
      .then((res) => {
        if (res.data.insertedId) {
          CustomToast({
            icon: "success",
            title: `${semesterData.semesterName + " " + semesterData.year
              } has been created successfully`,
          });
          fetchSemesters();
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

  // ✅ Handle status update (toggle)
  const handleMarkCurrentStatus = async (id, currentStatus) => {
    try {
      let newStatus =
        currentStatus === "upcoming" ? "running" : "completed";

      const res = await nodeBackend.patch(`/semesters?id=${id}`, { status: newStatus });
      console.log(res.data);
      if (res.data.modifiedCount > 0) {
        CustomToast({
          icon: "success",
          title: `Semester marked as ${newStatus}`,
        });
        fetchSemesters();
      } else {
        CustomToast({
          icon: "error",
          title: "Failed to update status",
        });
      }
    } catch (error) {
      console.error(error);
      CustomToast({
        icon: "error",
        title: `${error.response?.data?.error || "Update failed"}`,
      });
    }
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        nodeBackend.delete(`/semesters?id=${id}`)
          .then(res => {
            if (res.data.deletedCount > 0) {
              Swal.fire({
                title: "Deleted!",
                text: "Your file has been deleted.",
                icon: "success"
              });
              fetchSemesters();
            }
          })
          .catch(error => {
            CustomToast({
              icon: "error",
              title: "Failed to delete semester",
            });
            console.log(error)
          })
      }
    });

    if (loading) return <LoadingSpiner />;
  }
  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary">Manage Semesters</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus /> Add Semester
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered bg-base-300 text-gray-200 w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
          </select>

          <form
            onSubmit={handleSearch}
            className="flex items-center w-full md:w-auto gap-2"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search semester..."
              className="input input-bordered bg-base-300 text-gray-200 w-full md:w-64"
            />
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <FaSearch /> Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Semester Name</th>
                <th>Code</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Description</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {semesters.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No semesters found.
                  </td>
                </tr>
              ) : (
                semesters.map((s, i) => (
                  <tr key={s._id}>
                    <td>{i + 1}</td>
                    <td>{s.semesterName}</td>
                    <td>{s.semesterCode}</td>
                    <td>{moment(s.startDate).format("LL")}</td>
                    <td>{moment(s.endDate).format("LL")}</td>
                    <td>
                      <span
                        className={`capitalize badge ${s.status === "running"
                          ? "badge badge-soft badge-warning"
                          : s.status === "upcoming"
                            ? "badge badge-soft badge-primary"
                            : "badge badge-soft badge-success"
                          }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="truncate max-w-xs">{s.description || "N/A"}</td>
                    <td className="flex items-center gap-3">
                      {s.status !== "completed" && (
                        <button
                          onClick={() => handleMarkCurrentStatus(s._id, s.status)}
                          className={`btn btn-sm ${s.status==="upcoming" ? "btn-primary" : "btn-primary btn-outline"} flex items-center justify-center gap-1 min-w-[130px]`}
                        >
                          {s.status === "running"
                            ? "Mark as Completed"
                            : "Mark as Running"}
                        </button>
                      )}

                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="btn-sm btn btn-soft btn-error flex items-center gap-1"
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
          <input type="checkbox" id="semester-modal" className="modal-toggle" checked readOnly />
        )}
        <div className={`modal ${showModal ? "modal-open" : ""}`}>
          <div className="modal-box bg-base-100 text-gray-200 rounded-2xl">
            <h3 className="font-bold text-lg text-primary mb-4">
              Add New Semester
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="label">
                <span className="label-text">Semester Name</span>
              </label>
              <select
                name="semesterName"
                className="select select-bordered w-full bg-base-300 text-gray-200"
                required
              >
                <option value="">Select Semester</option>
                <option value="Summer">Summer</option>
                <option value="Spring">Spring</option>
                <option value="Fall">Fall</option>
              </select>

              <div className="flex gap-x-5">
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Year</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    placeholder="e.g. 2024"
                    className="input input-bordered w-full bg-base-300 text-gray-200"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    className="select select-bordered w-full bg-base-300 text-gray-200"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option disabled value="running">Running</option>
                    <option disabled value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-x-5">
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="input input-bordered w-full bg-base-300 text-gray-200"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">End Date</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="input input-bordered w-full bg-base-300 text-gray-200"
                    required
                  />
                </div>
              </div>



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

export default ManageSemester;
