import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import Pagination from "../../Components/Pagination";

import {
  FaThLarge,
  FaTable,
  FaCar,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaHashtag,
  FaTools,
  FaMotorcycle
} from "react-icons/fa";

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

const ITEMS_PER_PAGE = 8;

const BOOKING_STATUS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Cancelled",
];

const ShowAllBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Booked");
  const [dateFilter, setDateFilter] = useState("Today");
  const [page, setPage] = useState(1);

  const [popup, setPopup] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings");
        const sorted = response.data.sort((a, b) => 
          new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
        );
        setBookings(sorted);
      } catch (err) {
        toast.error("Failed to load bookings");
      }
    };
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) ||
      b.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
      
    const matchStatus =
      statusFilter === "All" ||
      (b.status || "Booked").toLowerCase() === statusFilter.toLowerCase();

    const bDateStr = b.created_at || b.createdAt;
    const bookingDate = bDateStr ? new Date(bDateStr) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchDate = true;

    if (dateFilter === "Today") {
      if (!bookingDate) return false;
      const d = new Date(bookingDate);
      d.setHours(0, 0, 0, 0);
      matchDate = d.getTime() === today.getTime();
    } else if (dateFilter === "Yesterday") {
      if (!bookingDate) return false;
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const d = new Date(bookingDate);
      d.setHours(0, 0, 0, 0);
      matchDate = d.getTime() === yesterday.getTime();
    } else if (dateFilter === "This Week") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      matchDate = bookingDate >= lastWeek;
    } else if (dateFilter === "This Month") {
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      matchDate = bookingDate >= lastMonth;
    }

    return matchSearch && matchStatus && matchDate;
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      new: bookings.filter(b => (b.status || "Booked") === "Booked").length,
      approved: bookings.filter(b => b.status === "Approved").length,
      cancelled: bookings.filter(b => b.status === "Cancelled").length
    };
  }, [bookings]);

  const handleStatusChange = (booking, newStatus) => {
    if (booking.status === "Service Completed") return;

    if (newStatus === "Approved") {
      const autoTrackNumber = `TRK${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
      updateStatus(booking, "Approved", {
        trackNumber: autoTrackNumber,
        approvedAt: new Date(),
      });
      return;
    }

    if (newStatus === "Cancelled") {
      setPopup({ type: "cancel", booking });
      return;
    }

    updateStatus(booking, newStatus);
  };

  const updateStatus = async (booking, newStatus, extraData = {}) => {
    try {
      await api.put(`/bookings/status/${booking.id}`, {
        status: newStatus,
        ...extraData
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: newStatus, ...extraData } : b
        )
      );

      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Cancel reason required");
      return;
    }
    await updateStatus(popup.booking, "Cancelled", {
      cancelReason: cancelReason.trim(),
    });
    setPopup(null);
    setCancelReason("");
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      {/* HEADER ROW */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Booking Registry</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage customer intake & service approvals</p>
        </div>

        <button
          onClick={() => navigate("/admin/addbooking")}
          className="h-[56px] px-10 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95 self-start lg:self-auto"
        >
          <FaPlus /> New Booking Intake
        </button>
      </div>

      {/* STATS ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Lifetime Requests" 
          value={stats.total} 
          icon={<FaCalendarCheck />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Pending Verification" 
          value={stats.new} 
          icon={<FaClock />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Approved Queue" 
          value={stats.approved} 
          icon={<FaCheckCircle />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
        <StatCard 
          title="Revoked / Cancelled" 
          value={stats.cancelled} 
          icon={<FaTimesCircle />} 
          gradient="from-rose-600 to-rose-400" 
        />
      </div>

      {/* SEARCH AND FILTERS CONSOLIDATION - SINGLE ROW OPTIMIZATION */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group w-full lg:max-w-xs xl:max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all" />
          <input
            type="text"
            placeholder="Search ID, customer, vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-15 pr-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all duration-300 font-bold text-gray-700 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-3 w-full lg:w-auto">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm transition-all min-w-[160px]"
          >
            <option value="Today">Today Only</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">Last 7 Days</option>
            <option value="This Month">Last 30 Days</option>
            <option value="All">Full History</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm transition-all min-w-[160px]"
          >
            <option value="All">Global Registry</option>
            {BOOKING_STATUS.map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>

          <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaTable /> Table
            </button>
            <button
              onClick={() => setView("card")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaThLarge /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* VIEW RENDERER */}
      {view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedData.map((b) => (
            <div
              key={b.id}
              className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                {b.vehicleType === 'bike' ? <FaMotorcycle size={80}/> : <FaCar size={80} />}
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none block mb-1">REGISTRY ID</span>
                  <p className="text-sm font-black text-blue-900">{b.bookingId || "BKG-"+b.id}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest border transition-all ${
                    b.status === "Approved" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    b.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-100" :
                    "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {(b.status || "BOOKED").toUpperCase()}
                </div>
              </div>

              <div className="space-y-5 flex-1 relative z-10">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${b.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {b.vehicleType || 'Car'}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{b.brand} {b.model}</h3>
                   </div>
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-xl border border-blue-100">{b.vehicleNumber || "UNSPECIFIED"}</p>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                      <FaUser size={14}/>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Customer Profile</p>
                      <p className="text-sm font-black text-gray-800">{b.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                      <FaPhone size={14}/>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Contact Channel</p>
                      <p className="text-sm font-bold text-gray-500">{b.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-5">
                   <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-gray-300" size={14}/>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{formatDate(b.created_at || b.createdAt)}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <FaClock className="text-gray-300" size={14}/>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{formatTime(b.created_at || b.createdAt)}</span>
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-1">Workflow Action</p>
                  <select
                    value={b.status || "Booked"}
                    disabled={b.status === "Service Completed" || b.status === "Cancelled"}
                    onChange={(e) => handleStatusChange(b, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-black/5 outline-none transition-all cursor-pointer disabled:opacity-30 appearance-none"
                  >
                    {(b.status === "Approved" ? ["Approved"] : BOOKING_STATUS.slice(BOOKING_STATUS.indexOf(b.status || "Booked") === -1 ? 0 : BOOKING_STATUS.indexOf(b.status || "Booked"))).map((s) => (
                      <option key={s} value={s}>{s.toUpperCase()}</option>
                    ))}
                  </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 animate-fadeIn">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">S No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Identifier</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Customer Profile</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Vehicle Spec</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Registry Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Protocol Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Action Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((b, i) => (
                <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-gray-400">{(page - 1) * ITEMS_PER_PAGE + i + 1}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none mb-1">ID: {b.id}</span>
                    <span className="text-xs font-black text-blue-900">{b.bookingId || "BKG-NEW"}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900">{b.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{b.phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${b.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {b.vehicleType || 'Car'}
                        </span>
                        <p className="text-sm font-black text-gray-800">{b.brand} {b.model}</p>
                    </div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{b.vehicleNumber || "UNSPECIFIED"}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-800">{formatDate(b.created_at || b.createdAt)}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{formatTime(b.created_at || b.createdAt)}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest border border-current uppercase ${
                        b.status === "Approved" ? "text-indigo-600 bg-indigo-50" :
                        b.status === "Cancelled" ? "text-rose-600 bg-rose-50" :
                        "text-amber-600 bg-amber-50"
                    }`}>
                      {b.status || "BOOKED"}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <select
                      value={b.status || "Booked"}
                      disabled={b.status === "Service Completed" || b.status === "Cancelled"}
                      onChange={(e) => handleStatusChange(b, e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[9px] font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-black/5 outline-none transition-all cursor-pointer disabled:opacity-30 uppercase tracking-widest"
                    >
                      {(b.status === "Approved" ? ["Approved"] : BOOKING_STATUS.slice(BOOKING_STATUS.indexOf(b.status || "Booked") === -1 ? 0 : BOOKING_STATUS.indexOf(b.status || "Booked"))).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 text-gray-300">
                          <FaCalendarAlt size={24}/>
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No registry entries found for criteria</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* CANCEL MODAL */}
      {popup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white animate-in zoom-in duration-200">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-lg shadow-rose-500/10">
                    <FaTimesCircle size={24}/>
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Revocation Protocol</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Specify authorization for cancellation</p>
            </div>
            
            <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Personnel authorization required..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-inner"
                  rows={4}
                />
            </div>

            {/* Modal Footer - Upgraded Spacing */}
            <div className="px-10 py-8 pb-12 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-[2.5rem]">
                <button
                  onClick={() => setPopup(null)}
                  className="px-8 py-3.5 rounded-2xl border border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Terminate
                </button>
                <button
                  onClick={submitCancel}
                  className="px-10 py-3.5 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-black/10"
                >
                  Confirm Revoke
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAllBookings;
