import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";

const VehicleBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useAuth();
  const location = useLocation();

  const fetchBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/vehicle-bookings/user/${user.id}`);
      setBookings(res.data || []);
    } catch (err) {
      console.error("Fetch vehicle bookings error", err);
      toast.error("Failed to load your vehicle bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  useEffect(() => {
    if (location.state?.highlightBookingId && bookings.length) {
      const found = bookings.find(b => b.bookingId === location.state.highlightBookingId || b.id === location.state.highlightBookingId);
      if (found) setSelectedBooking(found);
    }
  }, [bookings, location.state]);

  if (loading) return <p className="text-slate-400">Loading your vehicles...</p>;

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-sky-400">My Booked Vehicles</h2>
      {bookings.length === 0 ? (
        <p className="text-slate-400">No vehicle bookings found.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            return (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="cursor-pointer bg-black border border-slate-700 rounded-xl p-4 hover:border-sky-400 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">Booking ID: {booking.bookingId}</p>
                    <p className="text-slate-300 text-lg mt-1 font-bold">{booking.vehicleName}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Booked on: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-900 text-emerald-400">
                      {booking.status || "Booked"}
                    </span>
                    <p className="text-sky-400 font-bold">Advance Paid: ₹{booking.advanceAmount}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </>
  );
};

const BookingModal = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3 sm:px-6">
      <div className="bg-slate-900 w-full max-w-3xl rounded-2xl p-6 relative border border-sky-400 max-h-[85vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
        <h3 className="text-xl font-bold text-sky-400 mb-2">Booking ID: {booking.bookingId}</h3>
        <p className="text-slate-400 mb-6">Placed on: {new Date(booking.createdAt).toLocaleString()}</p>
        
        <div className="space-y-4 mb-6">
          <div className="flex gap-4 items-center border-b border-slate-700 pb-3">
            <div className="flex-1">
              <p className="text-white text-xl font-black">{booking.vehicleName}</p>
              <p className="text-slate-400 text-sm mt-2 font-semibold tracking-wider">Type: {booking.vehicleType}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs tracking-wider uppercase mb-1">Advance Payment</p>
              <p className="text-sky-400 font-semibold text-2xl">₹{booking.advanceAmount}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">Customer Details</h4>
          <div className="bg-black border border-slate-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-white font-bold">{booking.customerName}</p>
                <p className="text-slate-400 text-sm">📞 {booking.customerPhone}</p>
                {booking.customerEmail && <p className="text-slate-400 text-sm">✉️ {booking.customerEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">Pickup Info</h4>
          <div className="bg-black border border-slate-700 rounded-xl p-4">
            <p className="text-slate-300 text-sm leading-relaxed">{booking.pickupAddress}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">Payment Information</h4>
          <div className="bg-emerald-900/30 border border-emerald-500 rounded-xl p-4">
            <p className="text-emerald-400 font-semibold mb-1">Status: {booking.paymentStatus}</p>
            <p className="text-emerald-300 text-xs">Transaction ID: {booking.paymentId}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleBookings;
