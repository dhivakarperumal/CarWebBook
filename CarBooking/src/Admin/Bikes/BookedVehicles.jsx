import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  FaSearch,
  FaCar,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaShoppingCart,
  FaStar,
  FaEye,
  FaUndo,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const formatValue = (num) => {
  if (num >= 100000) return (num / 100000).toFixed(1) + " L";
  if (num >= 1000) return (num / 1000).toFixed(1) + " K";
  return num.toLocaleString();
};

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
  const [dateFilter, setDateFilter] = useState("today"); // "all", "today"
  const [statusFilter, setStatusFilter] = useState("booked"); // "all", "booked", "confirmed", "sold", "cancelled"
  const [deliveryFilter, setDeliveryFilter] = useState(false); // only confirmed/booked

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

  const updateStatus = async (id, newStatus, extraData = {}) => {
    try {
      toast.loading("Updating status...", { id: "status-update" });
      await api.put(`/vehicle-bookings/${id}/status`, {
        status: newStatus,
        ...extraData
      });
      toast.success("Status updated successfully", { id: "status-update" });
      fetchBookings();
    } catch {
      toast.error("Failed to update status", { id: "status-update" });
    }
  };

  const stats = useMemo(() => {
    // Only 'booked' and 'confirmed' are considered active/open bookings
    const activeBookings = bookings.filter(b => {
      const s = (b.status || "booked").toLowerCase();
      return s === "booked" || s === "confirmed";
    });

    const total = activeBookings.length;
    const totalAdvance = activeBookings.reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0);
    const confirmed = activeBookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;

    const soldBookings = bookings.filter(b => (b.status || "").toLowerCase() === "sold");
    const soldCount = soldBookings.length;
    const totalRevenue = soldBookings.reduce((sum, b) => {
      const net = Number(b.totalPrice || 0) - Number(b.negotiation || 0);
      return sum + net;
    }, 0);

    return { total, totalAdvance, confirmed, soldCount, totalRevenue };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search Filter
      const searchLower = search.toLowerCase();
      const matchSearch = (
        (b.bookingId || "").toLowerCase().includes(searchLower) ||
        (b.vehicleName || "").toLowerCase().includes(searchLower) ||
        (b.customerName || "").toLowerCase().includes(searchLower) ||
        (b.customerPhone || "").toLowerCase().includes(searchLower)
      );

      // 2. Date Filter
      let matchDate = true;
      if (dateFilter === "today") {
        const today = new Date().toLocaleDateString("en-IN");
        const bDate = new Date(b.createdAt).toLocaleDateString("en-IN");
        matchDate = today === bDate;
      }

      // 3. Status Filter
      let matchStatus = true;
      if (statusFilter !== "all") {
        const currentStatus = (b.status || "booked").toLowerCase();
        matchStatus = currentStatus === statusFilter.toLowerCase();
      }

      // 4. Delivery Filter (Confirmed/Booked statuses)
      let matchDelivery = true;
      if (deliveryFilter) {
        const status = (b.status || "").toLowerCase();
        matchDelivery = status === "confirmed" || status === "booked";
      }

      return matchSearch && matchDate && matchStatus && matchDelivery;
    });
  }, [bookings, search, dateFilter, statusFilter, deliveryFilter]);

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


      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Active Bookings" value={stats.total} icon={<FaCalendarCheck />} gradient="from-blue-600 to-blue-400" />
        <StatCard title="Advance Collected" value={`₹ ${formatValue(stats.totalAdvance)}`} icon={<FaMoneyBillWave />} gradient="from-emerald-600 to-emerald-400" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={<FaCheckCircle />} gradient="from-indigo-600 to-indigo-400" />
        <StatCard title="Sold Vehicles" value={stats.soldCount} icon={<FaShoppingCart />} gradient="from-rose-600 to-rose-400" />
        <StatCard title="Total Revenue" value={`₹ ${formatValue(stats.totalRevenue)}`} icon={<FaStar />} gradient="from-amber-600 to-amber-400" />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by ID, Vehicle or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Filters */}
          <div className="p-1.5 bg-gray-100 rounded-2xl border border-gray-200 w-fit">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest 
    bg-white outline-none cursor-pointer text-gray-600"
            >
              <option value="all">All</option>
              <option value="booked">Booked</option>
              <option value="confirmed">Confirmed</option>
              <option value="sold">Sold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Time Filters */}
          <div className="p-1.5 bg-gray-100 rounded-2xl border border-gray-200 w-fit">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest 
    bg-white outline-none cursor-pointer text-gray-700"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">S No</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">Booking Info</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">Vehicle</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">Customer</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">Advance</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-left">Status</th>
              <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedBookings.map((b, i) => (
              <tr key={b.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-6 font-black text-gray-500">{(currentPage - 1) * bookingsPerPage + i + 1}</td>
                <td className="px-8 py-6 font-black text-blue-600">{b.bookingId} <br /> <span className="text-[10px] text-gray-400 font-bold">{new Date(b.createdAt).toLocaleDateString("en-IN")}</span></td>
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
                  {(b.status || "").toLowerCase() === "cancelled" ? (
                    <span className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 block text-center shadow-sm">
                      Cancelled
                    </span>
                  ) : (
                    <div className="relative group/status">
                      <select
                        value={b.status || "Booked"}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        className={`w-full px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border transition-all cursor-pointer text-center appearance-none shadow-sm hover:scale-[1.02] active:scale-[0.98] ${(b.status || "").toLowerCase() === "sold"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 focus:ring-4 focus:ring-emerald-500/10"
                            : (b.status || "").toLowerCase() === "confirmed"
                              ? "bg-blue-50 text-blue-600 border-blue-100 focus:ring-4 focus:ring-blue-500/10"
                              : (b.status || "").toLowerCase() === "booked"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-100 focus:ring-4 focus:ring-indigo-500/10"
                                : "bg-amber-50 text-amber-600 border-amber-100 focus:ring-4 focus:ring-amber-500/10"
                          }`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Sold" disabled={(b.status || "").toLowerCase() !== "sold"}>Sold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-40 group-hover/status:opacity-100 transition-opacity">▼</div>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm group-hover:scale-110 active:scale-95"
                      title="View Details"
                    >
                      <FaEye size={16} />
                    </button>
                    {(b.status || "").toLowerCase() !== "cancelled" && (
                      <button
                        onClick={() => handleCancelAndRepublish(b.id)}
                        className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:scale-110 active:scale-95"
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
                <td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-bold">No vehicle bookings found.</td>
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

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancelAndRepublish}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
};

const BookingModal = ({ booking, onClose, onCancel, onUpdateStatus }) => {
  const [totalPrice, setTotalPrice] = useState(booking.expected_price || booking.totalPrice || 0);
  const [negotiation, setNegotiation] = useState(0);
  const [advanceOverride, setAdvanceOverride] = useState(booking.advanceAmount || 0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (totalPrice > 0) return;

      const vId = booking.vehicleId || booking.bikeId || booking.id;
      if (!vId) return;

      try {
        const res = await api.get(`/bikes/${vId}`);
        if (res.data?.expected_price) {
          setTotalPrice(Number(res.data.expected_price));
        }
      } catch (err) {
        console.error("Failed to fetch bike price:", err);
      }
    };
    fetchFullDetails();
  }, [booking, totalPrice]);

  const totalPayable = Number(totalPrice || 0) - Number(negotiation || 0);

  useEffect(() => {
    // Auto-calculate paidAmount when pricing, negotiation, or advance changes
    const autoPay = Math.max(0, totalPayable - Number(advanceOverride || 0));
    setPaidAmount(autoPay);
  }, [totalPrice, negotiation, advanceOverride]);

  const remaining = totalPayable - Number(advanceOverride || 0) - Number(paidAmount || 0);

  const handleSettle = () => {
    if (totalPrice <= 0) {
      toast.error("Please enter a valid vehicle price");
      return;
    }
    onUpdateStatus(booking.id, "Sold", {
      totalPrice,
      negotiation,
      advanceAmount: advanceOverride,
      paidAmount,
      remainingAmount: remaining
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-zoomIn border border-white/20">
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
            <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Vehicle Information</label>
              <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{booking.vehicleName}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest">{booking.vehicleType}</p>
                {booking.expected_price && (
                  <p className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    Expected: ₹ {Number(booking.expected_price).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Advance Payment</label>
              <p className="text-3xl font-black text-emerald-700">₹ {Number(booking.advanceAmount).toLocaleString()}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Status: {booking.paymentStatus || "Paid"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                <p className="font-black text-gray-900">{booking.customerName}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Contact No</p>
                <p className="font-black text-gray-900">{booking.customerPhone}</p>
              </div>
              {booking.customerEmail && (
                <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="font-black text-gray-900">{booking.customerEmail}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-8">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Settlement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-2 bg-gray-900 rounded-2xl border border-white/10 text-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Expected Bike Price</p>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="bg-transparent font-black text-lg outline-none w-full  focus:border-blue-500 transition-all font-black"
                />
              </div>
              <div className="p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Advance Amount</p>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={advanceOverride}
                  onChange={(e) => setAdvanceOverride(Number(e.target.value))}
                  className="bg-transparent font-black text-lg text-emerald-600 outline-none w-full  focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="p-2 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Negotiation / Off</p>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={negotiation}
                  onChange={(e) => setNegotiation(Number(e.target.value))}
                  className="bg-transparent font-black text-lg text-amber-600 outline-none w-full  focus:border-amber-500 transition-all"
                />
              </div>
              <div className="p-2 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Pay Final Amount</p>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="bg-transparent font-black text-lg text-blue-600 outline-none w-full focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase font-black">Booking Date</p>
              <p className="font-black text-gray-900 text-sm">{new Date(booking.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase font-black">Transaction ID</p>
              <p className="font-black text-gray-900 text-[10px] break-all">{booking.paymentId || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          {(booking.status || "").toLowerCase() !== "sold" && (booking.status || "").toLowerCase() !== "cancelled" && (
            <button
              onClick={handleSettle}
              className="flex-[2] px-8 py-2 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
            >
              <FaCheckCircle size={18} /> Commit Sale & Close
            </button>
          )}
          {(booking.status || "").toLowerCase() !== "cancelled" && (booking.status || "").toLowerCase() !== "sold" && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex-1 px-8 py-2 bg-white text-rose-500 rounded-2xl font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-50 transition-all"
            >
              <FaUndo className="inline mr-2" /> Cancel
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-8 py-3 bg-white text-gray-500 rounded-2xl font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all shadow-sm"          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookedVehicles;
