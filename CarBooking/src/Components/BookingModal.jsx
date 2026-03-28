import StatusTracker from "./StatusTracker";

const BookingModal = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-3 sm:px-6">
      {/* MODAL */}
      <div
        className="
          bg-[#020617]
          border border-sky-400
          rounded-2xl
          w-full
          max-w-3xl
          max-h-[90vh]
          overflow-y-auto
          p-4 sm:p-6
          relative
        "
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="
            absolute top-3 right-3 sm:top-4 sm:right-4
            text-gray-400 hover:text-white
            text-xl
          "
        >
          ✕
        </button>

        {/* HEADER */}
        <h3 className="text-lg sm:text-xl font-bold text-sky-400 mb-4">
          Booking ID: {booking.bookingId}
        </h3>

        {/* DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base text-gray-300">
          <p>
            <span className="text-sky-400">Name:</span> {booking.name}
          </p>
          <p>
            <span className="text-sky-400">Phone:</span> {booking.phone}
          </p>
          <p>
            <span className="text-sky-400">Brand:</span> {booking.brand}
          </p>
          <p>
            <span className="text-sky-400">Model:</span> {booking.model}
          </p>

          <p className="sm:col-span-2">
            <span className="text-sky-400">Issue:</span> {booking.issue}
          </p>

          <p className="sm:col-span-2">
            <span className="text-sky-400">Address:</span> {booking.address}
          </p>
        </div>

        {/* STATUS TRACKER */}
        <div className="mt-6">
          {booking.status !== "CANCELLED" ? (
            <StatusTracker currentStatus={booking.status} />
          ) : (
            <p className="text-red-400 font-semibold text-center">
              ❌ Booking Cancelled
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;