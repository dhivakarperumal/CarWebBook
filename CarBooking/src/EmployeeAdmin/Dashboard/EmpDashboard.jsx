import React, { useEffect, useState, useMemo } from "react";
import { 
  Wrench, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CalendarDays,
  User,
  LogOut,
  History
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
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [myStaffRecord, setMyStaffRecord] = useState(null);

  useEffect(() => {
    fetchMyTasks();
  }, [userProfile?.id, userProfile?.uid]);

  useEffect(() => {
    if (userProfile?.email) {
      checkAttendanceStatus();
    }
  }, [userProfile?.email]);

  const checkAttendanceStatus = async () => {
    if (!userProfile?.email) {
      console.log("No user email found for attendance check");
      return;
    }
    
    try {
      console.log("Checking attendance for:", userProfile.email);
      // 1. Get staff record to find staff_id
      const staffRes = await api.get("/staff");
      const me = (staffRes.data || []).find(s => s.email?.toLowerCase() === userProfile?.email?.toLowerCase());
      
      console.log("Staff record found:", me);

      if (me) {
        setMyStaffRecord(me);
        // 2. Check if already marked for today (using local date string YYYY-MM-DD)
        const today = new Date().toLocaleDateString('en-CA');
        const attendRes = await api.get(`/attendance/check?staff_id=${me.id}&date=${today}`);
        
        console.log("Attendance status for today:", attendRes.data);

        // Show modal if NOT present today AND role is one that needs attendance
        const role = userProfile?.role?.toLowerCase();
        const needsAttendance = ["mechanic", "employee", "staff", "receptionist", "manager"].includes(role);
        
        console.log("Role:", role, "Needs attendance:", needsAttendance, "Is present:", attendRes.data.isPresent);

        if (!attendRes.data.isPresent && needsAttendance) {
          console.log("Showing attendance modal...");
          setShowAttendanceModal(true);
        }
      } else {
        console.warn("No matching staff record found for email:", userProfile.email);
      }
    } catch (err) {
      console.error("Attendance check failed", err);
    }
  };

  const handlePunchIn = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (!myStaffRecord) {
      toast.error("Staff record not found. Please contact admin.");
      return;
    }

    setIsPunchingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const today = new Date().toLocaleDateString('en-CA');
          
          await api.post("/attendance/punch-in", {
            staff_id: myStaffRecord.id,
            date: today,
            latitude,
            longitude,
            status: "Present"
          });
          
          toast.success("Attendance marked successfully!");
          setShowAttendanceModal(false);
        } catch (err) {
          toast.error(err.response?.data?.message || "Punch in failed");
        } finally {
          setIsPunchingIn(false);
        }
      },
      (error) => {
        setIsPunchingIn(false);
        toast.error("Please allow location access to mark attendance");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toDateString();
      // 🔥 Fetching from all-services to pick up both bookings and appointments
      const res = await api.get("/all-services");
      const allServices = res.data || [];
      
      const myDisplayName = userProfile?.displayName || "";
      const filtered = allServices.filter(b => 
        (b.assignedEmployeeName || "").toLowerCase() === myDisplayName.toLowerCase() &&
        b.status !== "Cancelled"
      );

      const tasksForToday = filtered.filter(b => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setMyTasks(tasksForToday);
      
      // Fetch total staff count
      const staffRes = await api.get("/staff");
      const totalStaffCount = (staffRes.data || []).length;

      const normalize = (s) => (s || "").toLowerCase().trim();
      
      const activeTasks = filtered.filter(b => {
        const s = normalize(b.status || b.serviceStatus);
        return !["service completed", "completed", "cancelled"].includes(s);
      });

      const todayAssigned = activeTasks.filter(b => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setStats({
        todayCount: todayAssigned.length,
        totalCount: activeTasks.length,
        inProgress: activeTasks.filter(b => ["processing", "service going on", "waiting for spare", "call verified"].includes(normalize(b.status || b.serviceStatus))).length,
        completed: filtered.filter(b => ["service completed", "completed", "bill pending", "bill completed"].includes(normalize(b.status || b.serviceStatus))).length,
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

  const StatusBadge = ({ status, bStatus }) => {
    const map = {
      "Booked": "bg-blue-50 text-blue-700 border-blue-200",
      "Pending": "bg-yellow-50 text-yellow-700 border-yellow-200",
      "Approved": "bg-sky-50 text-sky-700 border-sky-200",
      "Processing": "bg-orange-50 text-orange-700 border-orange-200",
      "Assigned": "bg-blue-50 text-blue-700 border-blue-200",
      "Service Going on": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "Waiting for Spare": "bg-purple-50 text-purple-700 border-purple-200",
      "Bill Pending": "bg-purple-50 text-purple-700 border-purple-200",
      "Bill Completed": "bg-sky-100 text-sky-700 border-sky-200",
      "Service Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    
    const displayStatus = status || bStatus || "Assigned";
    const s = (displayStatus || "").toLowerCase().trim();
    const styleClass = map[displayStatus] || map[s] || "bg-gray-50 text-gray-600 border-gray-200";

    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm inline-block ${styleClass}`}>
        {displayStatus}
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

      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<ClipboardList size={24} />} 
          title="Daily / Total Workload" 
          value={`${stats.todayCount || 0} / ${stats.totalCount || 0}`} 
          color="blue"
        />
        <StatCard 
          icon={<Wrench size={24} />} 
          title="In Progress" 
          value={stats.inProgress} 
          color="indigo"
        />
        <StatCard 
          icon={<CheckCircle2 size={24} />} 
          title="Completed" 
          value={stats.completed} 
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        {/* ===== MY TASKS LIST ===== */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Today's Work
            </h2>
            <button 
              onClick={() => navigate("/employee/assignservices")}
              className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              View All
            </button>
          </div>
 
            <div className="overflow-x-auto bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">S No</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">ID</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">Customer</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">Vehicle Info</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">Date</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-white">Status</th>

                   
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
                    myTasks.map((task,ind) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 text-center py-5">
                          {ind+1}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-gray-400">#{task.bookingId || task.appointmentId || task.id}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-medium text-gray-700">{task.name}</p>
                        </td>
                       
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-800">{task.brand} {task.model}</p>
                          <p className="text-xs text-gray-500">{task.vehicleNumber || "No Plate"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-blue-600 uppercase tracking-tight">
                            {formatDate(task.created_at || task.createdAt || task.preferredDate)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={task.status} bStatus={task.serviceStatus} />
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

      {/* ===== ATTENDANCE MODAL ===== */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-50">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-50/50">
                <Clock size={36} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Mark Attendance</h2>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Good morning! Please mark your attendance with GPS location to begin your workday.
              </p>
              
              <button
                onClick={handlePunchIn}
                disabled={isPunchingIn}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
              >
                {isPunchingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    Checking GPS...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Punch In Now
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpDashboard;

/* ===== Sub-Components ===== */
const StatCard = ({ icon, title, value, color }) => {
  const colorMap = {
    blue: "from-blue-600 to-blue-700 bg-blue-50 text-blue-600 border-blue-100",
    indigo: "from-indigo-600 to-indigo-700 bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "from-emerald-600 to-emerald-700 bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`p-4 rounded-2xl shadow-inner ${colorMap[color].split(" ").slice(2).join(" ")}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 leading-none">{value}</h3>
      </div>
    </div>
  );
};
