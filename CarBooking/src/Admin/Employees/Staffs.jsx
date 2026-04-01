import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaEye
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";
import { useAuth } from "../../PrivateRouter/AuthContext.jsx";


const Staffs = () => {
  const { profileName: userProfile } = useAuth();
  const [staff, setStaff] = useState([]);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


  const loadStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch {
      toast.error('Failed to load staff');
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  useEffect(() => {
    loadStaff();
    setCurrentPage(1);
  }, [search, statusFilter]);


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff deleted successfully");
      loadStaff();
    } catch {
      toast.error("Failed to delete staff");
    }
  };

  // ===== Stats =====
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === "active").length;
  const inactiveStaff = staff.filter(s => s.status !== "active").length;

  return (
    <div className="p-4 min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-800">Technicians Management</h3>
        {(userProfile?.role === "admin" || userProfile?.role === "manager") && (
          <button
            onClick={() => navigate("/admin/addstaff")}
            className="inline-flex items-center gap-2
    bg-black text-white
    px-4 h-10
    rounded-md border border-gray-300 text-sm font-medium
    hover:bg-gray-900
    active:scale-95
    focus:outline-none focus:ring-2 focus:ring-black/40
    transition"
          >
            + Add Employees
          </button>
        )}
      </div>

      {/* ===== TOP CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-5 gap-6">

        {/* Total Staff */}
        <div className="bg-white rounded-md border border-gray-300 shadow-sm  p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Staff</p>
            <h2 className="text-3xl font-bold text-gray-900">{totalStaff}</h2>
          </div>
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <FaUsers className="text-white text-xl" />
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white rounded-md border border-gray-300 shadow-sm  p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Staff</p>
            <h2 className="text-3xl font-bold text-gray-900">{activeStaff}</h2>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <FaUserCheck className="text-white text-xl" />
          </div>
        </div>

        {/* Inactive Staff */}
        <div className="bg-white rounded-md border border-gray-300 shadow-sm  p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Inactive Staff</p>
            <h2 className="text-3xl font-bold text-gray-900">{inactiveStaff}</h2>
          </div>
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
            <FaUserTimes className="text-white text-xl" />
          </div>
        </div>

      </div>


      {/* ===== SEARCH & FILTER BAR ===== */}
      <div className=" flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* SEARCH - LEFT */}
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
        />

        {/* FILTERS - RIGHT */}
        <div className="flex gap-3">
          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>
      </div>


      {/* ===== HEADER ===== */}

      {/* ===== TABLE ===== */}
      {/* <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"> */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700 whitespace-nowrap">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">S.No</th>
                <th className="px-4 py-4 text-left font-semibold">Name</th>
                <th className="px-4 py-4 text-left font-semibold">Email</th>
                <th className="px-4 py-4 text-left font-semibold">Phone</th>
                <th className="px-4 py-4 text-left font-semibold">Role</th>
                <th className="px-4 py-4 text-left font-semibold">Time In</th>
                <th className="px-4 py-4 text-left font-semibold">Time Out</th>
                <th className="px-4 py-4 text-left font-semibold">Status</th>
                {(userProfile?.role === "admin" || userProfile?.role === "manager") && (
                  <th className="px-4 py-4 text-left font-semibold">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-gray-500">
                    No staff records found
                  </td>
                </tr>
              )}

              {paginatedStaff.map((s, index) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-300 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-4">{index + 1}</td>
                  <td className="px-4 py-4 font-medium">{s.name}</td>
                  <td className="px-4 py-4">{s.email}</td>
                  <td className="px-4 py-4">{s.phone}</td>
                  <td className="px-4 py-4">{s.role}</td>
                  <td className="px-4 py-4 text-sm">{s.time_in || "N/A"}</td>
                  <td className="px-4 py-4 text-sm">{s.time_out || "N/A"}</td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {s.status}
                    </span>
                  </td>

                   {(userProfile?.role === "admin" || userProfile?.role === "manager") && (
                    <td className="px-4 py-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/viewstaff/${s.id}`)}
                        className="p-3 rounded-full  border border-gray-200  transition hover:bg-gray-100"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/addstaff/${s.id}`)}
                        className="p-3  border border-gray-200 rounded-full  transition hover:bg-gray-100"
                        title="Edit Staff"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-3 rounded-full  border border-gray-200 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete Staff"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center p-4 bg-white border-t border-gray-100">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

      </div>
    // </div>
  );
};

export default Staffs;
