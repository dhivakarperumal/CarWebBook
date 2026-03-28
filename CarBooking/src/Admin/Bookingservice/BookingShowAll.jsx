// import { useEffect, useState } from "react";
// import {
//   collection,
//   onSnapshot,
//   query,
//   orderBy,
//   updateDoc,
//   doc,
//   addDoc,
// } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import { FaThLarge, FaTable } from "react-icons/fa";
// import {
//   FaCar,
//   FaUser,
//   FaPhone,
//   FaMapMarkerAlt,
//   FaClock,
// } from "react-icons/fa";

// /* 🔹 STATUS LIST */
// const BOOKING_STATUS = [
//   "Booked",
//   "Call Verified",
//   "Approved",
//   "Processing",
//   "Waiting for Spare",
//   "Service Going on",
//   "Bill Pending",
//   "Bill Completed",
//   "Service Completed",
// ];

// const ShowAllBookings = () => {
//   const navigate = useNavigate();

//   const [bookings, setBookings] = useState([]);
//   const [view, setView] = useState("card");
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");

//   /* 🔥 FETCH BOOKINGS */
//   useEffect(() => {
//     const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));

//     const unsub = onSnapshot(q, (snap) => {
//       setBookings(
//         snap.docs.map((d) => ({
//           id: d.id,
//           ...d.data(),
//         }))
//       );
//     });

//     return () => unsub();
//   }, []);

//   /* 🔎 FILTER */
//   const filtered = bookings.filter((b) => {
//     const matchSearch =
//       b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
//       b.name?.toLowerCase().includes(search.toLowerCase()) ||
//       b.phone?.includes(search);

//     const matchStatus = statusFilter === "All" || b.status === statusFilter;

//     return matchSearch && matchStatus;
//   });

//   /* 🎨 STATUS COLOR */
//   const statusColor = (status) => {
//     switch (status) {
//       case "Booked":
//         return "bg-blue-100 text-blue-700";
//       case "Processing":
//         return "bg-yellow-100 text-yellow-700";
//       case "Service Completed":
//         return "bg-green-100 text-green-700";
//       case "Bill Pending":
//         return "bg-orange-100 text-orange-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   /* 🔄 STATUS UPDATE + COPY TO SERVICES */
//   const updateStatus = async (booking, newStatus) => {
//     if (booking.status === "Service Completed") return;

//     const previousStatus = booking.status;

//     /* 🟢 Optimistic UI */
//     setBookings((prev) =>
//       prev.map((b) =>
//         b.id === booking.id ? { ...b, status: newStatus } : b
//       )
//     );

//     try {
//       await updateDoc(doc(db, "bookings", booking.id), {
//         status: newStatus,
//       });

//       if (booking.uid) {
//         await updateDoc(
//           doc(db, "users", booking.uid, "bookings", booking.id),
//           { status: newStatus }
//         );
//       }

//       /* 🚀 COPY TO allServices WHEN APPROVED */
//       if (newStatus === "Approved" && !booking.serviceCreated) {
//         const serviceData = {
//           bookingId: booking.bookingId,
//           bookingDocId: booking.id,
//           uid: booking.uid,
//           name: booking.name,
//           phone: booking.phone,
//           email: booking.email,
//           brand: booking.brand,
//           model: booking.model,
//           issue: booking.issue,
//           otherIssue: booking.otherIssue || "",
//           location: booking.location,
//           address: booking.address,
//           serviceStatus: "Pending",
//           createdAt: booking.createdAt || new Date(),
//         };

//         await addDoc(collection(db, "allServices"), serviceData);

//         await updateDoc(doc(db, "bookings", booking.id), {
//           serviceCreated: true,
//         });

//         toast.success("Moved to Services");
//       }

//       toast.success("Status updated");
//     } catch (err) {
//       console.error(err);

//       /* 🔴 Revert UI */
//       setBookings((prev) =>
//         prev.map((b) =>
//           b.id === booking.id ? { ...b, status: previousStatus } : b
//         )
//       );

//       toast.error("Failed to update status");
//     }
//   };

//   /* 📅 FORMAT DATE SAFE */
//   const formatDate = (ts) => {
//     try {
//       return ts?.toDate?.().toLocaleString() || "-";
//     } catch {
//       return "-";
//     }
//   };

//   return (
//     <div className="p-8 max-w-7xl mx-auto">
//       {/* 🔝 TOP BAR */}
// <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
//   {/* 🔎 SEARCH */}
//   <div className="w-full max-w-sm">
//     <input
//       type="text"
//       placeholder="Search booking, name, phone..."
//       value={search}
//       onChange={(e) => setSearch(e.target.value)}
//       className="w-full border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm shadow-sm focus:border-black focus:ring-2 focus:ring-black/20 outline-none"
//     />
//   </div>

//   <div className="flex flex-wrap gap-3">
//     {/* 🎯 STATUS FILTER */}
//     <select
//       value={statusFilter}
//       onChange={(e) => setStatusFilter(e.target.value)}
//       className="h-[42px] min-w-[140px] border border-gray-300 bg-white px-4 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-black outline-none"
//     >
//       <option>All</option>
//       {BOOKING_STATUS.map((s) => (
//         <option key={s}>{s}</option>
//       ))}
//     </select>

//     {/* 🔄 VIEW TOGGLE */}
//     <div className="flex gap-2">
//       <button
//         onClick={() => setView("card")}
//         className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
//           view === "card"
//             ? "bg-black text-white"
//             : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//         }`}
//       >
//         <FaThLarge /> Card
//       </button>

//       <button
//         onClick={() => setView("table")}
//         className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
//           view === "table"
//             ? "bg-black text-white"
//             : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//         }`}
//       >
//         <FaTable /> Table
//       </button>
//     </div>

//     {/* ➕ ADD BOOKING */}
//     <button
//       onClick={() => navigate("/admin/addbooking")}
//       className="h-[42px] bg-black text-white px-5 rounded-md font-bold shadow hover:bg-gray-900 transition"
//     >
//       + Add Booking
//     </button>
//   </div>
// </div>

// {/* 🟦 CARD VIEW */}
// {view === "card" && (
//   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {filtered.map((b) => (
//       <div
//         key={b.id}
//         className="p-5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition"
//       >
//         <div className="flex justify-between items-start">
//           <h3 className="text-lg font-semibold">{b.bookingId}</h3>

//           <span
//             className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(
//               b.status
//             )}`}
//           >
//             {b.status}
//           </span>
//         </div>

//         <p className="mt-2 flex items-center gap-2 text-sm">
//           <FaCar /> {b.brand} • {b.model}
//         </p>

//         <p className="text-sm flex items-center gap-2 mt-2">
//           <FaUser /> {b.name}
//         </p>

//         <p className="text-sm flex items-center gap-2 mt-2">
//           <FaPhone /> {b.phone}
//         </p>

//         <p className="text-sm flex items-start gap-2 mt-2 line-clamp-2">
//           <FaMapMarkerAlt className="mt-0.5" />
//           {b.location}
//         </p>

//         <select
//           value={b.status}
//           disabled={b.status === "Service Completed"}
//           onChange={(e) => updateStatus(b, e.target.value)}
//           className="mt-4 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
//         >
//           {BOOKING_STATUS.map((s) => (
//             <option key={s} value={s}>
//               {s}
//             </option>
//           ))}
//         </select>

//         <p className="text-xs mt-3 flex items-center gap-2 text-gray-500">
//           <FaClock /> {formatDate(b.createdAt)}
//         </p>
//       </div>
//     ))}
//   </div>
// )}

//       {/* 🟨 TABLE VIEW */}
//       {view === "table" && (
//         <div className="overflow-x-auto bg-white rounded-2xl shadow-sm ">
//           <table className="w-full text-sm">
//             <thead className="bg-gradient-to-r from-black to-cyan-400 text-white text-left">
//               <tr>
//                 <th className="px-4 py-4 text-left">S No</th>
//                 <th className="px-4 py-4 text-left">Booking ID</th>
//                 <th className="px-4 py-4 text-left">Customer</th>
//                 <th className="px-4 py-4 text-left">Car</th>
//                 <th className="px-4 py-4 text-left">Phone</th>
//                 <th className="px-4 py-4 text-left">Status</th>
//                 <th className="px-4 py-4 text-left">Date</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filtered.map((b, i) => (
//                 <tr key={b.id} className="border-t border-gray-300">
//                   <td className="px-4 py-4">{i + 1}</td>
//                   <td className="px-4 py-4">{b.bookingId}</td>
//                   <td className="px-4 py-4">{b.name}</td>
//                   <td className="px-4 py-4">
//                     {b.brand} • {b.model}
//                   </td>
//                   <td className="px-4 py-4">{b.phone}</td>

//                   <td className="px-4 py-4">
//                     <select
//                       value={b.status}
//                       disabled={b.status === "Service Completed"}
//                       onChange={(e) => updateStatus(b, e.target.value)}
//                       className="px-3 py-1 rounded-lg border border-gray-300 text-xs bg-white"
//                     >
//                       {BOOKING_STATUS.map((s) => (
//                         <option key={s}>{s}</option>
//                       ))}
//                     </select>
//                   </td>

//                   <td className="px-4 py-4">{formatDate(b.createdAt)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {filtered.length === 0 && (
//         <p className="text-center text-gray-400 mt-10">
//           No bookings found
//         </p>
//       )}
//     </div>
//   );
// };

// export default ShowAllBookings;


import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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

  /* 🔴 POPUP STATE */
  const [popup, setPopup] = useState(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  /* 🔥 FETCH BOOKINGS */
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setBookings(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
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
      const bookingRef = doc(db, "bookings", booking.id);

      const updateData = {
        status: newStatus,
        ...extraData,
      };

      await updateDoc(bookingRef, updateData);

      if (booking.uid) {
        await updateDoc(
          doc(db, "users", booking.uid, "bookings", booking.id),
          updateData
        );
      }

      /* 🚀 MOVE TO allServices WHEN APPROVED */
      if (newStatus === "Approved" && !booking.serviceCreated) {
        const q = query(
          collection(db, "allServices"),
          where("bookingDocId", "==", booking.id)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          const serviceData = {
            bookingId: booking.bookingId,
            bookingDocId: booking.id,
            uid: booking.uid || null,

            name: booking.name || "",
            phone: booking.phone || "",
            email: booking.email || "",

            brand: booking.brand || "",
            model: booking.model || "",
            issue: booking.issue || "",
            otherIssue: booking.otherIssue || "",

            location: booking.location || "",
            address: booking.address || "",

            trackNumber: extraData.trackNumber || "",
            serviceStatus: "Pending",

            createdAt:
              booking.createdAt && booking.createdAt.toDate
                ? booking.createdAt
                : new Date(),
          };

          await addDoc(collection(db, "allServices"), serviceData);
        }

        await updateDoc(bookingRef, { serviceCreated: true });
      }

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
    try {
      return ts?.toDate?.().toLocaleString() || "-";
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
  <FaTable classNameName="text-base" />
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
          {filtered.map((b) => (
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
                <FaClock /> {formatDate(b.createdAt)}
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
              {filtered.map((b, i) => (
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
                    {formatDate(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
