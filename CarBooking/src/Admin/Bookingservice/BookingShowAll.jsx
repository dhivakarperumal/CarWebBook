import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 8;

import {
  FaThLarge,
  FaTable,
  FaCar,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

/* 🔹 STATUS LIST */
const BOOKING_STATUS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Cancelled",
];

/* 🎨 CARD BG COLOR */
const cardBgColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-indigo-50 border-indigo-200";
    case "Service Completed":
      return "bg-green-50 border-green-200";
    case "Cancelled":
      return "bg-red-50 border-red-200";
    default:
      return "bg-white border-gray-300";
  }
};

const ShowAllBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  /* 🔴 POPUP STATE */
  const [popup, setPopup] = useState(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  /* 🔥 FETCH BOOKINGS */
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings");
        const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setBookings(sorted);
      } catch (err) {
        toast.error("Failed to load bookings");
      }
    };
    fetchBookings();
  }, []);

  /* 🔎 FILTER */
  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search);
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* 🎨 STATUS COLOR */
  const statusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white";
      case "Service Completed":
        return "bg-green-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* 🔄 STATUS CHANGE HANDLER */
  const handleStatusChange = (booking, newStatus) => {
    if (booking.status === "Service Completed") return;

    if (newStatus === "Approved") {
      setPopup({ type: "approved", booking });
      return;
    }

    if (newStatus === "Cancelled") {
      setPopup({ type: "cancel", booking });
      return;
    }

    updateStatus(booking, newStatus);
  };

  /* 🔥 UPDATE STATUS CORE */
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
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  /* ✅ APPROVED SUBMIT */
  const submitApproved = async () => {
    if (!trackNumber.trim()) {
      toast.error("Track number required");
      return;
    }

    await updateStatus(popup.booking, "Approved", {
      trackNumber: trackNumber.trim(),
      approvedAt: new Date(),
    });

    setPopup(null);
    setTrackNumber("");
  };

  /* ❌ CANCEL SUBMIT */
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

  /* 📅 FORMAT DATE */
  const formatDate = (ts) => {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "-";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 🔝 TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
  
  {/* LEFT → SEARCH */}
  <div className="flex-1 min-w-0">
    <input
      type="text"
      placeholder="Search booking, name, phone..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-1/2 border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm shadow-sm focus:border-black focus:ring-2 focus:ring-black/20 outline-none"
    />
  </div>

  {/* RIGHT → FILTERS + BUTTONS */}
  <div className="flex items-center gap-3 flex-wrap justify-end">
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="h-[42px] min-w-[140px] border border-gray-300 bg-white px-4 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-black outline-none"
    >
      <option>All</option>
      {BOOKING_STATUS.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>

  <button
  onClick={() => setView("card")}
  className={`h-[42px] px-4 rounded flex items-center gap-2 text-sm font-medium transition
    ${view === "card"
      ? "bg-black text-white"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`}
>
  <FaThLarge className="text-base" />
  Card
</button>

<button
  onClick={() => setView("table")}
  className={`h-[42px] px-4 rounded flex items-center gap-2 text-sm font-medium transition
    ${view === "table"
      ? "bg-black text-white"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`}
>
  <FaTable className="text-base" />
  Table
</button>


    <button
      onClick={() => navigate("/admin/addbooking")}
      className="bg-black text-white px-5 py-2 rounded-md"
    >
      + Add Booking
    </button>
  </div>
</div>


      {/* 🟦 CARD VIEW */}
      {view === "card" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedData.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border ${cardBgColor(b.status)}`}
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{b.bookingId}</h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${statusColor(
                    b.status
                  )}`}
                >
                  {b.status}
                </span>
              </div>

              <p className="mt-2 text-sm flex gap-2">
                <FaCar /> {b.brand} • {b.model}
              </p>
              <p className="text-sm flex gap-2 mt-2">
                <FaUser /> {b.name}
              </p>
              <p className="text-sm flex gap-2 mt-2">
                <FaPhone /> {b.phone}
              </p>
              <p className="text-xs mt-2 flex gap-2 text-gray-500">
                <FaClock /> {formatDate(b.created_at)}
              </p>

              {/* 🔥 FIXED SELECT */}
              <select
                value={b.status}
                disabled={b.status === "Service Completed"}
                onChange={(e) => handleStatusChange(b, e.target.value)}
                className="mt-4 w-full border px-3 py-2 rounded-lg"
              >
                {BOOKING_STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* 🟨 TABLE VIEW */}
      {view === "table" && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4">S No</th>
                <th className="px-4 py-4">Booking ID</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Car</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((b, i) => (
                <tr key={b.id} className="border-t border-gray-300">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{b.bookingId}</td>
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3">
                    {b.brand} • {b.model}
                  </td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      disabled={b.status === "Service Completed"}
                      onChange={(e) =>
                        handleStatusChange(b, e.target.value)
                      }
                      className="border px-2 py-1 rounded"
                    >
                      {BOOKING_STATUS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(b.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* 🔴 POPUP MODAL */}
      {popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[350px]">
            {popup.type === "approved" && (
              <>
                <h2 className="font-bold mb-3">Enter Track Number</h2>
                <input
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  className="w-full border px-3 py-2 rounded mb-4"
                  placeholder="Track Number"
                />
                <button
                  onClick={submitApproved}
                  className="w-full md:w-auto px-10 py-4 rounded-md font-semibold text-white
    bg-gradient-to-r from-black to-cyan-400
    hover:scale-105 transition-all duration-300
    shadow-lg shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </>
            )}

            {popup.type === "cancel" && (
              <>
                <h2 className="font-bold mb-3">Cancel Reason</h2>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border px-3 py-2 rounded mb-4"
                />
                <button
                  onClick={submitCancel}
                  className="bg-red-600 text-white px-4 py-2 rounded w-full"
                >
                  Submit
                </button>
              </>
            )}

            <button
              onClick={() => setPopup(null)}
              className="mt-3 text-sm text-gray-500 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAllBookings;
