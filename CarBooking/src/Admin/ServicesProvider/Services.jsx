import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BOOKING_STATUS = [
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const Services = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowLoading, setRowLoading] = useState(null);

  const itemsPerPage = 10;

  /* =======================
     REALTIME FETCH
  ======================= */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "allServices"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setServices(data);
      },
      (error) => {
        console.error(error);
        toast.error("Failed to load services");
      }
    );

    return () => unsub();
  }, []);

  /* =======================
     STATUS CHANGE
  ======================= */
 const handleStatusChange = async (s, newStatus) => {
  if (!s?.id) return toast.error("Invalid service ID");

  try {
    setRowLoading(s.id);

    /* 🔥 1. UPDATE SERVICE STATUS */
    await updateDoc(doc(db, "allServices", s.id), {
      serviceStatus: newStatus,
      updatedAt: serverTimestamp(),
    });

    /* 🔥 2. MAP SERVICE STATUS → BOOKING STATUS */
    let bookingStatus = newStatus;

    if (newStatus === "Completed") {
      bookingStatus = "Service Completed";
    } else if (newStatus === "Cancelled") {
      bookingStatus = "Cancelled";
    } else {
      bookingStatus = newStatus;
    }

    /* 🔥 3. UPDATE BOOKING STATUS */
    if (s.bookingDocId) {
      const bookingRef = doc(db, "bookings", s.bookingDocId);

      await updateDoc(bookingRef, {
        status: bookingStatus,
        updatedAt: serverTimestamp(),
      });

      /* 🔥 4. UPDATE USER SUBCOLLECTION BOOKING */
      if (s.uid) {
        await updateDoc(
          doc(db, "users", s.uid, "bookings", s.bookingDocId),
          {
            status: bookingStatus,
            updatedAt: serverTimestamp(),
          }
        );
      }
    }

    toast.success("Service & Booking status updated");
  } catch (error) {
    console.error(error);
    toast.error("Status update failed");
  } finally {
    setRowLoading(null);
  }
};


  /* =======================
     DELETE
  ======================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;

    try {
      setRowLoading(id);
      await deleteDoc(doc(db, "allServices", id));
      toast.success("Service deleted");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    } finally {
      setRowLoading(null);
    }
  };

  /* =======================
     FILTER + SEARCH
  ======================= */
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const text = `
        ${s.bookingId || ""}
        ${s.name || ""}
        ${s.phone || ""}
        ${s.brand || ""}
        ${s.model || ""}
      `.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "all" || s.serviceStatus === statusFilter)
      );
    });
  }, [services, search, statusFilter]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =======================
     STATUS COLOR
  ======================= */
  const getStatusColor = (status) => {
    switch (status) {
      case "Booked":
        return "bg-gray-100 text-gray-700";

      case "Call Verified":
        return "bg-blue-100 text-blue-700";

      case "Approved":
        return "bg-indigo-100 text-indigo-700";

      case "Processing":
        return "bg-purple-100 text-purple-700";

      case "Waiting for Spare":
        return "bg-yellow-100 text-yellow-800";

      case "Service Going on":
        return "bg-orange-100 text-orange-700";

      case "Bill Pending":
        return "bg-pink-100 text-pink-700";

      case "Bill Completed":
        return "bg-cyan-100 text-cyan-700";

      case "Service Completed":
        return "bg-green-100 text-green-700";

      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="p-4 min-h-screen space-y-6">
      {/* SEARCH & FILTER */}
      <div className="p-4 flex flex-wrap gap-3 justify-between items-center">
        {/* SEARCH */}
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-3 top-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search booking, name, phone, car"
            className="h-[45px] w-full pl-9 pr-3 py-3 border border-gray-300 bg-white
               rounded-md text-sm shadow-sm
               focus:ring-2 focus:ring-black outline-none transition"
          />
        </div>

        {/* FILTER + BUTTON */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/40"
          >
            <option value="all">All Status</option>
            {BOOKING_STATUS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigate("/admin/addserviceparts")}
            className="h-[42px] bg-black text-white px-5 rounded-md font-bold shadow
             hover:bg-gray-900 transition"
          >
            + Add Service Parts
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left">S No</th>
                <th className="px-4 py-4 text-left">Booking ID</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">Phone</th>
                <th className="px-4 py-4 text-left">Car</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Cost (₹)</th>
                <th className="px-4 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedServices.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="px-3 py-3">
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </td>

                  <td className="px-3 py-3 font-semibold">
                    {s.bookingId || "-"}
                  </td>

                  <td className="px-3 py-3">{s.name || "-"}</td>

                  <td className="px-3 py-3">{s.phone || "-"}</td>

                  <td className="px-3 py-3">
                    {s.brand || "-"} {s.model || ""}
                  </td>

                  {/* STATUS */}
                  <td className="px-3 py-3">
                    <select
                      value={s.serviceStatus || "Booked"}
                      disabled={rowLoading === s.id}
                      onChange={(e) =>
                        handleStatusChange(s, e.target.value)
                      }
                      className={`border rounded px-2 py-1 text-xs font-semibold ${getStatusColor(
                        s.serviceStatus || "Booked"
                      )}`}
                    >
                      {BOOKING_STATUS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-3">
                    ₹{s.estimatedCost || 0}
                  </td>

                  {/* ACTION */}
                  <td className="px-3 py-3 flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/admin/services/${s.id}`)
                      }
                      className="p-3 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                      title="View Service"
                    >
                      <FaEye />
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/admin/addservices/${s.id}`)
                      }
                      className="p-3 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                      title="Edit Service"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={rowLoading === s.id}
                      className="p-3 rounded-full border border-gray-300 hover:bg-red-100 transition"
                      title="Delete Service"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredServices.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-6 text-gray-500"
                  >
                    No services found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-4">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex gap-2 flex-wrap">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
