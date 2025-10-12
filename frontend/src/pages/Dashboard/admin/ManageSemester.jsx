import React, { useState } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";

const ManageSemester = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    semesterName: "",
    year: "",
    startDate: "",
    endDate: "",
    status: "upcoming",
  });

  // ✅ Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", search, "with status:", statusFilter);
  };

  // ✅ Handle Save
  const handleSave = () => {
    const { semesterName, year, startDate, endDate, status } = formData;
    if (!semesterName || !year || !startDate || !endDate || !status) {
      alert("Please fill all fields!");
      return;
    }

    const semesterCode = `${semesterName.toLowerCase()}${year}`;
    const fullData = { ...formData, semesterCode };

    console.log("🧾 Semester Data Submitted:", fullData);

    setFormData({
      semesterName: "",
      year: "",
      startDate: "",
      endDate: "",
      status: "upcoming",
    });
    document.getElementById("add_semester_modal").close();
  };

  return (
    <div className="min-h-screen bg-base-200 text-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary">🎓 Manage Semesters</h1>
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

        {/* Placeholder Table */}
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl shadow-md">
          <table className="table table-zebra text-gray-200">
            <thead>
              <tr className="text-primary">
                <th>#</th>
                <th>Semester Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="text-center py-4">
                  No semesters found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Semester Modal */}
      {showModal && (
        <dialog
          id="add_semester_modal"
          open
          className="modal modal-bottom sm:modal-middle"
        >
          <div className="modal-box bg-base-100 text-base-content">
            <h3 className="font-bold text-lg mb-4 text-primary">Add New Semester</h3>

            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Semester Name</span>
                </label>
                <select
                  name="semesterName"
                  value={formData.semesterName}
                  onChange={(e) =>
                    setFormData({ ...formData, semesterName: e.target.value })
                  }
                  className="select select-bordered bg-base-300 text-gray-200 w-full"
                >
                  <option value="">Select Semester</option>
                  <option value="Summer">Summer</option>
                  <option value="Spring">Spring</option>
                  <option value="Fall">Fall</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Year</span>
                </label>
                <input
                  type="number"
                  name="year"
                  placeholder="e.g. 2025"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="input input-bordered bg-base-300 text-gray-200 w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Start Date</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input input-bordered bg-base-300 text-gray-200 w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">End Date</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input input-bordered bg-base-300 text-gray-200 w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="select select-bordered bg-base-300 text-gray-200 w-full"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default ManageSemester;
