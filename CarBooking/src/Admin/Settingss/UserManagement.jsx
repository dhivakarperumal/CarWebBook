import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaArrowLeft
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const updateRole = async (id, role) => {
    await updateDoc(doc(db, "users", id), { role });
    toast.success("Role updated");
    loadUsers();
  };

  const toggleStatus = async (id, active) => {
    await updateDoc(doc(db, "users", id), { active: !active });
    toast.success("User status updated");
    loadUsers();
  };

  /* 📊 Stats */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;

  /* 🔍 Filters */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.active) ||
      (statusFilter === "inactive" && !u.active);

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white bg-black rounded-full px-3 py-2 hover:underline flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </button>

      </div>
      {/* ===================== CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Users</p>
            <h2 className="text-2xl font-bold">{totalUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <FaUsers />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Active Users</p>
            <h2 className="text-2xl font-bold">{activeUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-green-600 text-white rounded-lg flex items-center justify-center">
            <FaUserPlus />
          </div>
        </div>
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        {/* Left: Search */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
      border border-gray-200
      rounded-md
      px-4 py-3
      text-sm text-gray-700
      bg-white
      shadow-sm
      hover:shadow-md
      focus:outline-none
      focus:ring-2 focus:ring-gray-900
      transition
      cursor-pointer
     pl-10 pr-4  w-full "
          />
        </div>

        {/* Right: Filters + Add */}
        <div className="flex gap-3 flex-wrap justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className=" border border-gray-200
      rounded-md
      px-4 py-3
      text-sm text-gray-700
      bg-white
      shadow-sm
      hover:shadow-md
      focus:outline-none
      focus:ring-2 focus:ring-gray-900
      transition
      cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className=" border border-gray-200
      rounded-md
      px-4 py-3
      text-sm text-gray-700
      bg-white
      shadow-sm
      hover:shadow-md
      focus:outline-none
      focus:ring-2 focus:ring-gray-900
      transition
      cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>


        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">S No</th>
                <th className="px-4 py-4 text-left font-semibold">Name</th>
                <th className="px-4 py-4 text-left font-semibold" >Email</th>
                <th className="px-4 py-4 text-left font-semibold">Role</th>
                <th className="px-4 py-4 text-left font-semibold">Status</th>
                <th className="px-4 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u, index) => (
                <tr key={u.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>

                  <td className="px-4 py-4">
                    <select
                      value={u.role || "mechanic"}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="border border-gray-300 px-3 py-2 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="mechanic">Mechanic</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="customer">Customer</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${u.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(u.id, u.active)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
