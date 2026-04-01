import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  FaSearch,
  FaCar,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUndo,
} from "react-icons/fa";
import toast from "react-hot-toast";
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

const BookedVehicles = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 8;

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vehicle-bookings");
      setBookings(res.data || []);
    } catch (err) {
      console.error("Fetch vehicle bookings error", err);
      toast.error("Failed to load vehicle bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelAndRepublish = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking and republish the vehicle?")) return;
    
    try {
      toast.loading("Processing...", { id: "cancel-loading" });
      await api.delete(`/vehicle-bookings/${id}`);
      toast.success("Booking cancelled and vehicle republished", { id: "cancel-loading" });
      fetchBookings();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(null);
      }
    } catch (err) {
      toast.error("Failed to cancel booking", { id: "cancel-loading" });
    }
  };

  const stats = useMemo(() => {
    const activeBookings = bookings.filter(b => (b.status || "").toLowerCase() !== "cancelled");
    const total = activeBookings.length;
    const totalAdvance = activeBookings.reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0);
    const confirmed = activeBookings.filter(b => (b.status || "").toLowerCase() === "confirmed" || (b.status || "").toLowerCase() === "booked").length;
    return { total, totalAdvance, confirmed };
  }, [bookings]);

  const filteredBookings = bookings.filter((b) => {
    const searchLower = search.toLowerCase();
    return (
      (b.bookingId || "").toLowerCase().includes(searchLower) ||
      (b.vehicleName || "").toLowerCase().includes(searchLower) ||
      (b.customerName || "").toLowerCase().includes(searchLower) ||
      (b.customerPhone || "").toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * bookingsPerPage;
    return filteredBookings.slice(start, start + bookingsPerPage);
  }, [filteredBookings, currentPage]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <FaCar className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Fetching Bookings...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-black to-slate-800 flex items-center justify-center shadow-xl shadow-slate-200 rotate-3">
             <FaCar className="text-white w-8 h-8 -rotate-3" />
          </div>
          <div>
             <h1 className="text-3xl font-black text-gray-900">Vehicle Marketplace Bookings</h1>
             <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage marketplace sales & republish vehicles</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Active Bookings" value={stats.total} icon={<FaCalendarCheck />} gradient="from-blue-600 to-blue-400" />
        <StatCard title="Advance Collected" value={`₹ ${stats.totalAdvance.toLocaleString("en-IN")}`} icon={<FaMoneyBillWave />} gradient="from-emerald-600 to-emerald-400" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={<FaCheckCircle />} gradient="from-indigo-600 to-indigo-400" />
      </div>

      {/* SEARCH */}
      <div className="relative max-w-2xl mx-auto md:mx-0">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search by ID, Vehicle or Customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Booking Info</th>
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Vehicle</th>
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</th>
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Advance</th>
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-8 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedBookings.map((b) => (
              <tr key={b.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-6 font-black text-blue-600">{b.bookingId} <br/> <span className="text-[10px] text-gray-400 font-bold">{new Date(b.createdAt).toLocaleDateString("en-IN")}</span></td>
                <td className="px-8 py-6">
                  <div className="font-black text-gray-900 uppercase tracking-tight">{b.vehicleName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{b.vehicleType}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="font-black text-gray-900">{b.customerName}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{b.customerPhone}</div>
                </td>
                <td className="px-8 py-6 font-black text-emerald-600 text-lg">₹ {Number(b.advanceAmount).toLocaleString()}</td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    (b.status || "").toLowerCase() === "cancelled"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : (b.status || "").toLowerCase() === "confirmed" || (b.status || "").toLowerCase() === "booked"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}>
                    {b.status || "Booked"}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setSelectedBooking(b)}
                      className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm"
                      title="View Details"
                    >
                      <FaEye size={16} />
                    </button>
                    {(b.status || "").toLowerCase() !== "cancelled" && (
                      <button 
                        onClick={() => handleCancelAndRepublish(b.id)}
                        className="p-3 rounded-2xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Cancel & Republish"
                      >
                        <FaUndo size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedBookings.length === 0 && (
              <tr>
                <td colSpan="6" className="px-8 py-20 text-center text-gray-400 font-bold">No vehicle bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onCancel={handleCancelAndRepublish} />}
    </div>
  );
};

const BookingModal = ({ booking, onClose, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-zoomIn border border-white/20">
        <div className="bg-gradient-to-r from-black to-slate-800 px-8 py-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <FaCar className="text-white" />
             </div>
             <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Booking Details</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.bookingId}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">✕</button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Vehicle Information</label>
              <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{booking.vehicleName}</p>
              <p className="text-xs font-black text-blue-500 uppercase mt-1 tracking-widest">{booking.vehicleType}</p>
            </div>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Advance Payment</label>
              <p className="text-3xl font-black text-emerald-700">₹ {Number(booking.advanceAmount).toLocaleString()}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Status: {booking.paymentStatus || "Paid"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                  <p className="font-black text-gray-900">{booking.customerName}</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Contact No</p>
                  <p className="font-black text-gray-900">{booking.customerPhone}</p>
               </div>
               {booking.customerEmail && (
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                    <p className="font-black text-gray-900">{booking.customerEmail}</p>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup Information</h4>
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm font-bold text-gray-700 leading-relaxed">{booking.pickupAddress || "Not specified"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Booking Date</p>
              <p className="font-black text-gray-900 text-sm">{new Date(booking.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase">Transaction ID</p>
              <p className="font-black text-gray-900 text-[10px] break-all">{booking.paymentId || "N/A"}</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          {(booking.status || "").toLowerCase() !== "cancelled" && (
            <button 
              onClick={() => onCancel(booking.id)}
              className="flex-1 px-8 py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3"
            >
              <FaUndo /> Cancel & Republish
            </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 px-8 py-5 bg-white text-gray-500 rounded-2xl font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all shadow-sm"          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookedVehicles;
