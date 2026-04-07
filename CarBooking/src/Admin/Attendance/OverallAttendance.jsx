import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes, 
  FaUserClock, 
  FaSkiing,
  FaDownload,
  FaSearch,
  FaCalendarAlt
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white border border-gray-300 rounded-md p-6 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
      </div>
      <div className={`p-4 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-lg shadow-black/10`}>
        {icon}
      </div>
    </div>
  </div>
);

/* STATUS BADGE */
const StatusBadge = ({ status }) => {
  const statusColors = {
    "Present": "bg-green-100 text-green-700",
    "Absent": "bg-red-100 text-red-700",
    "Late": "bg-yellow-100 text-yellow-700",
    "On Leave": "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

const OverallAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', { params: { date: selectedDate } });
      const data = res.data.map((docData) => {
        return {
          ...docData,
          loginTime: docData.login_time,
          logoutTime: docData.logout_time,
          duration: docData.duration || (docData.login_time && !docData.logout_time ? "Active" : "N/A"),
        };
      });
      setAttendanceData(data);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setAttendanceData([]);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 FILTER LOGIC */
  const filtered = useMemo(() => {
    return attendanceData.filter((item) => {
      const text = `${item.name || ""} ${item.role || ""}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [attendanceData, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* STATISTICS */
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter((a) => a.status === "Present").length;
    const absent = attendanceData.filter((a) => a.status === "Absent").length;
    const late = attendanceData.filter((a) => a.status === "Late").length;
    const onLeave = attendanceData.filter((a) => a.status === "On Leave").length;

    return { total, present, absent, late, onLeave };
  }, [attendanceData]);

  const downloadAttendance = () => {
    try {
      let csv = "Name,Role,Status,Date,Login Time,Logout Time,Duration\n";
      attendanceData.forEach((item) => {
        let loginTimeStr = "N/A";
        let logoutTimeStr = "N/A";
        
        if (item.loginTime) {
          try {
            const loginDate = item.loginTime.toDate?.()
              ? item.loginTime.toDate()
              : new Date(item.loginTime);
            loginTimeStr = loginDate.toLocaleString();
          } catch (e) {
            loginTimeStr = String(item.loginTime);
          }
        }

        if (item.logoutTime) {
          try {
            const logoutDate = item.logoutTime.toDate?.()
              ? item.logoutTime.toDate()
              : new Date(item.logoutTime);
            logoutTimeStr = logoutDate.toLocaleString();
          } catch (e) {
            logoutTimeStr = String(item.logoutTime);
          }
        }
        
        csv += `"${item.name || "N/A"}","${item.role || "N/A"}","${item.status || "Present"}","${item.date || selectedDate}","${loginTimeStr}","${logoutTimeStr}","${item.duration || "N/A"}"\n`;
      });

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
      );
      element.setAttribute(
        "download",
        `attendance-${selectedDate}.csv`
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Attendance downloaded");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download");
    }
  };

  return (
    <div className="p-4 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Workforce Attendance
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Real-time personnel monitoring & analytics
          </p>
        </div>

        <button
          onClick={downloadAttendance}
          disabled={attendanceData.length === 0}
          className="h-[52px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
        >
          <FaDownload /> Global Export (CSV)
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Headcount" 
          value={stats.total} 
          icon={<FaUsers />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Present" 
          value={stats.present} 
          icon={<FaUserCheck />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
        <StatCard 
          title="Absent" 
          value={stats.absent} 
          icon={<FaUserTimes />} 
          gradient="from-rose-600 to-rose-400" 
        />
        <StatCard 
          title="Late Entry" 
          value={stats.late} 
          icon={<FaUserClock />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="On Leave" 
          value={stats.onLeave} 
          icon={<FaSkiing />} 
          gradient="from-indigo-600 to-indigo-400" 
        />
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-4 relative group">
          <FaCalendarAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="lg:col-span-5 relative group">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search personnel by name or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="lg:col-span-3 flex justify-end">
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner w-full overflow-hidden">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late Entry</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className=" overflow-hidden ">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Data...</div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-32">
            <FaCalendarAlt className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-900 text-xl font-black uppercase tracking-tight">No records discovered</p>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Adjust filters or select a different date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department/Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock In</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Out</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900">{item.name || "N/A"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.role || "Technician"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-slate-700">{item.loginTime ? dayjs(item.loginTime).format("hh:mm A") : "-- : --"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-slate-700">{item.logoutTime ? dayjs(item.logoutTime).format("hh:mm A") : (item.loginTime ? "Active" : "-- : --")}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">{item.duration || "N/A"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pb-10">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default OverallAttendance;
