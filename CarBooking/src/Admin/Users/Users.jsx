import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaSearch,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaShieldAlt,
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

// Global cache for seamless navigation
let usersCache = null;

const Users = () => {
  const [users, setUsers] = useState(usersCache || []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(!usersCache);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [authRes, bookingsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/bookings')
      ]);
      
      const authUsers = authRes.data || [];
      const bookings = bookingsRes.data || [];

      // Unified Map to merge by email or phone
      const customerMap = new Map();

      // 1. Add Registered Users
      authUsers.forEach(user => {
        const key = user.email ? user.email.toLowerCase() : `user-${user.id}`;
        customerMap.set(key, {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || "-",
          role: user.role,
          active: !!user.active,
          type: "registered",
          bookingsCount: 0
        });
      });

      // 2. Merge Service Bookings
      bookings.forEach(b => {
        const emailKey = b.email ? b.email.toLowerCase() : null;
        let customer = null;
        
        if (emailKey && customerMap.has(emailKey)) {
          customer = customerMap.get(emailKey);
        } else {
          // Look by phone if email doesn't match
          for (let c of customerMap.values()) {
             if (c.phone === b.phone && b.phone && b.phone !== "-") {
               customer = c;
               break;
             }
          }
        }

        if (customer) {
          customer.bookingsCount++;
          if (customer.phone === "-" && b.phone) customer.phone = b.phone;
          if (!customer.username && b.name) customer.username = b.name;
        } else {
          // Create new guest customer entry
          const newKey = emailKey || `guest-${b.phone || b.id}`;
          customerMap.set(newKey, {
            id: `guest-${b.id}`,
            username: b.name,
            email: b.email || "No Email",
            phone: b.phone || "-",
            role: "customer",
            active: true,
            type: "guest",
            bookingsCount: 1
          });
        }
      });

      const finalUsers = Array.from(customerMap.values());
      setUsers(finalUsers);
      usersCache = finalUsers;
    } catch (err) {
      toast.error("Failed to load customers data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.put(`/auth/users/${id}/role`, { role });
      toast.success("Role updated");
      loadUsers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const toggleStatus = async (id, active) => {
    try {
      await api.put(`/auth/users/${id}/status`, { active: !active });
      toast.success("Status updated");
      loadUsers();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await api.delete(`/auth/auth/users/${id}`); // Wait, my router prefix is /api/auth but what about internal routes?
        // Actually Backend/index.js uses: app.use('/api/auth', authRoutes);
        // So it should be api.delete('/auth/users/id') if api instance uses baseurl with /api
        toast.success("User deleted");
        loadUsers();
      } catch (err) {
        toast.error("Failed to delete user");
      }
    }
  };
  
  /* FIXED DELETE PATH BELOW (Based on typical pattern) */
  const handleDelete = async (id) => {
    if (window.confirm("Confirm delete?")) {
       try {
         await api.delete(`/auth/users/${id}`);
         toast.success("User deleted");
         loadUsers();
       } catch (err) {
         toast.error("Delete failed");
       }
    }
  }

  /* 📊 Stats */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

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

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);


  return (
    <div className="space-y-6 p-2">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800"></h1>
      </div>

      {/* ===================== STATS CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-md border border-gray-300 shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Users</p>
            <h2 className="text-2xl font-bold">{totalUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <FaUsers />
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-300 shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Active Users</p>
            <h2 className="text-2xl font-bold">{activeUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-green-600 text-white rounded-lg flex items-center justify-center">
            <FaToggleOn />
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-300 shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Registered Accounts</p>
            <h2 className="text-2xl font-bold">{users.filter(u => u.type === "registered").length}</h2>
          </div>
          <div className="h-12 w-12 bg-purple-600 text-white rounded-lg flex items-center justify-center">
            <FaShieldAlt />
          </div>
        </div>
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className=" p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        {/* Left: Search */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search name, email or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition w-full pl-10"
          />
        </div>

        {/* Right: Filters */}
        <div className="flex gap-3 flex-wrap justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="mechanic">Mechanic</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>


          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">S No</th>
                <th className="px-4 py-4 text-left font-semibold">Name / Username</th>
                <th className="px-4 py-4 text-left font-semibold">Contact Details</th>
                <th className="px-4 py-4 text-left font-semibold">Type</th>
                <th className="px-4 py-4 text-left font-semibold">Role</th>
                <th className="px-4 py-4 text-left font-semibold">Orders / Bookings</th>
                <th className="px-4 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                paginatedUsers.map((u, index) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-300 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-4 font-medium">{index + 1}</td>
                    <td className="px-4 py-4 font-medium">
                      <div className="text-gray-900">{u.username || "Anonymous"}</div>
                      {u.type === "guest" && (
                         <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-bold uppercase border border-cyan-100">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                       <div className="text-sm">{u.email}</div>
                       <div className="text-xs text-blue-600 font-bold">{u.phone !== "-" ? u.phone : ""}</div>
                    </td>
                    <td className="px-4 py-4">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.type === 'registered' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                         {u.type === 'registered' ? 'ACCOUNT' : 'SERVICE GUEST'}
                       </span>
                    </td>

                    <td className="px-4 py-4">
                      {u.type === "registered" ? (
                        <select 
                          value={u.role} 
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="bg-transparent border-b border-gray-100 outline-none text-xs font-semibold"
                        >
                           <option value="admin">Admin</option>
                           <option value="mechanic">Mechanic</option>
                           <option value="staff">Staff</option>
                           <option value="customer">Customer</option>
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500 uppercase">Customer</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{u.bookingsCount || 0}</span>
                           <span className="text-[10px] text-gray-400 font-medium">Bookings</span>
                        </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                       <button 
                        onClick={() => handleDelete(u.id)}
                        className="text-red-500 hover:text-red-700 transition"
                       >
                         <FaTrash />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-white border-t border-gray-100 flex justify-center">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default Users;
