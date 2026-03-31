import React, { useEffect, useState } from "react";
import BookingModal from "./BookingModal";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";

/* ===== STATUS LABELS ===== */
export const STATUS_LABELS = {
  BOOKED: "Booked",
  CALL_VERIFIED: "Call Verified",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  WAITING_SPARE: "Waiting for Spare",
  SERVICE_GOING: "Service Going On",
  BILL_PENDING: "Bill Pending",
  BILL_COMPLETED: "Bill Completed",
  SERVICE_COMPLETED: "Service Completed",
  CANCELLED: "Cancelled",
};

/* ===== NORMALIZER (Firestore → Enum) ===== */
export const STATUS_NORMALIZER = {
  "Booked": "BOOKED",
  "Call Verified": "CALL_VERIFIED",
  "Approved": "APPROVED",
  "Processing": "PROCESSING",
  "Waiting for Spare": "WAITING_SPARE",
  "Service Going on": "SERVICE_GOING",
  "Bill Pending": "BILL_PENDING",
  "Bill Completed": "BILL_COMPLETED",
  "Service Completed": "SERVICE_COMPLETED",
  "Cancelled": "CANCELLED",
};

const ServiceStatus = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

useEffect(() => {
  const fetchBookings = async () => {
    try {
      setLoading(true);

      if (!user?.email) {
        console.warn("⚠️ User email not available yet");
        return;
      }

      console.log("👉 Logged-in User Email:", user.email);

      const res = await api.get("/bookings");

      const data = (res.data || [])
        .filter(
          (b) =>
            b.email?.toLowerCase() === user.email.toLowerCase()
        )
        .map((raw) => ({
          id: raw.id,
          ...raw,
          normalizedStatus:
            STATUS_NORMALIZER[raw.status] || raw.status,
        }));

      console.log("👉 Filtered Bookings:", data);

      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  fetchBookings();
}, [user]); // 👈 IMPORTANT

  if (loading)
    return <div className="p-6 text-center">Loading...</div>;

  if (!bookings.length)
    return (
      <div className="p-6 text-center text-gray-500">
        No bookings found
      </div>
    );

  return (
    <div className="p-1 md:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-sky-400">
        My Service Bookings
      </h2>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => setSelectedBooking(booking)}
            className="cursor-pointer bg-[#020617]
                       border border-sky-500/30
                       rounded-xl px-2 md:px-6 py-4
                       flex justify-between items-center
                       hover:shadow-lg hover:shadow-sky-500/30
                       transition"
          >
            <div>
              <p className="text-white font-semibold">
                {booking.bookingId}
              </p>
              <p className="text-sm text-gray-400">
                {booking.name} • {booking.phone}
              </p>
            </div>

            <span className="px-4 py-1.5 rounded-full text-sm font-semibold
                             bg-sky-500/20 text-sky-400
                             border border-sky-500/40">
              {STATUS_LABELS[booking.normalizedStatus]}
            </span>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <BookingModal
          booking={{
            ...selectedBooking,
            status: selectedBooking.normalizedStatus,
          }}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default ServiceStatus;