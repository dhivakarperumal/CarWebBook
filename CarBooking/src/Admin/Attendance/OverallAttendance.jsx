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
  const [datePreset, setDatePreset] = useState("today"); // default → today
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]   = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Used for CSV filename
  const selectedDate = dayjs().format("YYYY-MM-DD");

  /* Build the API params based on active preset */
  const buildApiParams = (preset, cfrom, cto) => {
    const fmt = (d) => dayjs(d).format("YYYY-MM-DD");
    const now  = new Date();

    if (preset === "today") {
      return { date: fmt(now) };
    }
    if (preset === "yesterday") {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { date: fmt(y) };
    }
    if (preset === "thisweek") {
      const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
      return { from: fmt(ws), to: fmt(now) };
    }
    if (preset === "thismonth") {
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
    }
    if (preset === "custom") {
      const params = {};
      if (cfrom) params.from = cfrom;
      if (cto)   params.to   = cto;
      return params;
    }
    return {}; // "all" — no filter
  };

  useEffect(() => {
    loadAttendanceData();
  }, [datePreset, customFrom, customTo]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const params = buildApiParams(datePreset, customFrom, customTo);
      const res = await api.get('/attendance', { params });
      const data = res.data.map((docData) => ({
        ...docData,
        loginTime:  docData.login_time,
        logoutTime: docData.logout_time,
        duration: docData.duration || (docData.login_time && !docData.logout_time ? "Active" : "N/A"),
      }));
      setAttendanceData(data);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setAttendanceData([]);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  /* ── parse an attendance record's date ── */
  const parseAttendanceDate = (item) => {
    // prefer loginTime, fall back to item.date string
    const raw = item.loginTime || item.date;
    if (!raw) return null;
    if (raw?.toDate) return raw.toDate();
    if (raw?.seconds) return new Date(raw.seconds * 1000);
    return new Date(raw);
  };

  /* ── date range bounds for preset ── */
  const getDateBounds = () => {
    const now   = new Date();
    const sod   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const eod   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    if (datePreset === "today") {
      return { from: sod(now), to: eod(now) };
    }
    if (datePreset === "yesterday") {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { from: sod(y), to: eod(y) };
    }
    if (datePreset === "thisweek") {
      const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
      return { from: sod(ws), to: eod(now) };
    }
    if (datePreset === "thismonth") {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod(now) };
    }
    if (datePreset === "custom") {
      return {
        from: customFrom ? new Date(customFrom) : null,
        to:   customTo   ? new Date(new Date(customTo).setHours(23,59,59,999)) : null,
      };
    }
    return { from: null, to: null }; // "all"
  };

  /* 🔹 FILTER LOGIC */
  const filtered = useMemo(() => {
    const { from, to } = getDateBounds();

    return attendanceData.filter((item) => {
      const text = `${item.name || ""} ${item.role || ""}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      // Date range filter
      if (datePreset !== "all") {
        const d = parseAttendanceDate(item);
        if (!d) return false;
        if (from && d < from) return false;
        if (to   && d > to)   return false;
      }

      return matchSearch && matchStatus;
    });
  }, [attendanceData, search, statusFilter, datePreset, customFrom, customTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when any filter changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, datePreset, customFrom, customTo]);

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
      <div className="flex flex-wrap gap-3 items-center">

        {/* 🔎 SEARCH */}
        <div className="relative flex-1 min-w-[220px] group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search personnel by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all text-sm text-gray-700 shadow-sm"
          />
        </div>

        {/* 📅 DATE PRESET */}
        <div className="relative group">
          <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={datePreset}
            onChange={(e) => { setDatePreset(e.target.value); setCustomFrom(""); setCustomTo(""); }}
            className="h-[50px] pl-10 pr-4 min-w-[160px] rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition shadow-sm cursor-pointer"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisweek">This Week</option>
            <option value="thismonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* 📅 CUSTOM RANGE PICKERS */}
        {datePreset === "custom" && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-[50px] rounded-xl bg-white border border-gray-200 px-3 text-sm text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition shadow-sm"
            />
            <span className="text-gray-400 text-sm font-semibold">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-[50px] rounded-xl bg-white border border-gray-200 px-3 text-sm text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition shadow-sm"
            />
          </>
        )}

        {/* 🔵 STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[50px] min-w-[150px] rounded-xl bg-white border border-gray-200 px-4 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition shadow-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late Entry</option>
          <option value="On Leave">On Leave</option>
        </select>

      </div>

      {/* Table */}
      <div className=" overflow-hidden ">
        {paginatedData.length === 0 ? (
          <div className="text-center py-32">
            <FaCalendarAlt className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-900 text-xl font-black uppercase tracking-tight">No records discovered</p>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Adjust filters or select a different date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#020617] text-white">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Personnel</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Department/Role</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Clock In</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Clock Out</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Productivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</p>
                    </td>
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
