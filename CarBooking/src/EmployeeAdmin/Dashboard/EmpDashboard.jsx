import React, { useEffect, useState, useMemo } from "react";
import { 
  Wrench, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CalendarDays,
  User,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";

const EmpDashboard = () => {
  const navigate = useNavigate();
  const { profileName: userProfile, logout } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalStaff: 0
  });
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      // Fetch bookings and filter those assigned to this staff member
      // Note: We need a backend way to fetch by staff UID or name.
      // For now, we'll fetch all and filter client-side if a specific endpoint isn't available.
      const res = await api.get("/bookings");
      const allBookings = res.data || [];
      
      const myDisplayName = userProfile?.displayName || "";
      const filtered = allBookings.filter(b => 
        (b.assignedEmployeeName || "").toLowerCase() === myDisplayName.toLowerCase() &&
        b.status !== "Cancelled"
      );

      setMyTasks(filtered.slice(0, 5)); // Latest 5 tasks
      
      // Fetch total staff count
      const staffRes = await api.get("/staff");
      const totalStaffCount = (staffRes.data || []).length;

      setStats({
        pending: filtered.filter(b => b.status === "Booked" || b.status === "Pending").length,
        inProgress: filtered.filter(b => ["Call Verified", "Approved", "Processing", "Service Going on"].includes(b.status)).length,
        completed: filtered.filter(b => ["Service Completed", "Completed"].includes(b.status)).length,
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateServiceStatus = async (task, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === "Service Going on") {
        updateData.startedAt = new Date().toISOString();
      }

      if (newStatus === "Service Completed") {
        updateData.completedAt = new Date().toISOString();
      }

      await api.put(`/bookings/${task.id}`, updateData);
      toast.success(`Status updated to ${newStatus}`);
      fetchMyTasks();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update status");
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      "Pending": "bg-yellow-100 text-yellow-700",
      "Processing": "bg-orange-100 text-orange-700",
      "Assigned": "bg-blue-100 text-blue-700",
      "Service Going on": "bg-indigo-100 text-indigo-700",
      "Bill Pending": "bg-purple-100 text-purple-700",
      "Bill Completed": "bg-cyan-100 text-cyan-700",
      "Service Completed": "bg-green-100 text-green-700",
      "Completed": "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ===== WELCOME HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Hello, {userProfile?.displayName?.split(" ")[0] || "Technician"}!
            </h1>
            <p className="text-gray-500 font-medium capitalize">
              {userProfile?.role || "Staff Member"} • Welcome back to your workspace.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
          >
            <CalendarDays size={18} /> View Schedule
          </button>
        </div>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Tasks</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">In Progress</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.inProgress}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Jobs Completed</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.completed}</h3>
          </div>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        {/* ===== MY TASKS LIST ===== */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Assigned Tasks
            </h2>
            <button 
              onClick={() => navigate("/employee/bookings")}
              className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              View All
            </button>
          </div>
 
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-6 py-5 text-left font-bold">Vehicle Info</th>
                    <th className="px-6 py-5 text-left font-bold">Status</th>
                    <th className="px-6 py-5 text-left font-bold">Customer</th>
                    <th className="px-6 py-5 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myTasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList size={40} className="text-gray-200" />
                          <p>No tasks currently assigned to you.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-800">{task.brand} {task.model}</p>
                          <p className="text-xs text-gray-500">{task.vehicleNumber || "No Plate"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-medium text-gray-700">{task.name}</p>
                        </td>
                        <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                           {(task.status === "Assigned" || task.status === "Pending") && (
                             <button
                               onClick={() => updateServiceStatus(task, "Service Going on")}
                               className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-100 transition"
                             >
                               Start
                             </button>
                           )}
                           {task.status === "Service Going on" && (
                             <button
                               onClick={() => updateServiceStatus(task, "Service Completed")}
                               className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md shadow-green-100 transition"
                             >
                               Done
                             </button>
                           )}
                           <button 
                            onClick={() => navigate("/employee/assignservices")}
                            className="p-2 text-gray-400 hover:text-blue-600 transition"
                            title="View Details"
                          >
                            <AlertCircle size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== QUICK ACTIONS / PROFILE SUMMARY ===== */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl p-6 text-white shadow-xl">
             <h3 className="font-bold mb-4">Daily Goal</h3>
             <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <span className="text-xs text-gray-400 font-medium uppercase">Efficiency</span>
                 <span className="text-2xl font-bold">85%</span>
               </div>
               <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                 <div className="bg-cyan-400 h-full w-[85%] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
               </div>
               <p className="text-xs text-gray-400">Great job! You are ahead of your target for today.</p>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => navigate("/employee/services")}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Wrench size={16} /></div>
                New Service Entry
              </button>
              <button 
                onClick={() => navigate("/employee/addserviceparts")}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ClipboardList size={16} /></div>
                Add Service Parts
              </button>
              <button 
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-red-600 font-medium hover:bg-red-50 transition mt-4"
              >
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={16} /></div>
                Logout Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpDashboard;
