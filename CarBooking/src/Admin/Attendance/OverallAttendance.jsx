import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import { Search, Download, Calendar, Users } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

/* STATUS BADGE */
const StatusBadge = ({ status }) => {
  const statusColors = {
    "Present": "bg-green-100 text-green-700",
    "Absent": "bg-red-100 text-red-700",
    "Late": "bg-yellow-100 text-yellow-700",
    "On Leave": "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
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
      // Create CSV content with loginTime and logoutTime
      let csv = "Name,Role,Status,Date,Login Time,Logout Time,Duration\n";
      attendanceData.forEach((item) => {
        let loginTimeStr = "N/A";
        let logoutTimeStr = "N/A";
        
        // Handle loginTime
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

        // Handle logoutTime
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

      // Download
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-sky-600" />
            Overall Attendance
          </h1>
          <p className="text-slate-600 mt-1">Track staff attendance across all departments</p>
        </div>

        <button
          onClick={downloadAttendance}
          disabled={attendanceData.length === 0}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-2">Total Staff</p>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-green-600 mb-2">Present</p>
          <p className="text-3xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-red-600 mb-2">Absent</p>
          <p className="text-3xl font-bold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-yellow-600 mb-2">Late</p>
          <p className="text-3xl font-bold text-yellow-700">{stats.late}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-blue-600 mb-2">On Leave</p>
          <p className="text-3xl font-bold text-blue-700">{stats.onLeave}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "all"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setStatusFilter("Present");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "Present"
                ? "bg-green-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Present
          </button>
          <button
            onClick={() => {
              setStatusFilter("Absent");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "Absent"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Absent
          </button>
          <button
            onClick={() => {
              setStatusFilter("Late");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "Late"
                ? "bg-yellow-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Late
          </button>
          <button
            onClick={() => {
              setStatusFilter("On Leave");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "On Leave"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            On Leave
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-600">Loading...</div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg font-medium">
              No attendance records found
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Check the date or update attendance records
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Login Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Logout Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                      {item.role || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.loginTime ? dayjs(item.loginTime).format("HH:mm") : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.logoutTime ? dayjs(item.logoutTime).format("HH:mm") : "Active"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {item.duration || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OverallAttendance;
