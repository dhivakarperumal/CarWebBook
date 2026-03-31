import StatusTracker from "./StatusTracker";

const BookingModal = ({ booking, spareParts, onClose, onApprove  }) => {
  const bookingSpare = spareParts?.find(
    (sp) => sp.serviceName === booking.bookingId
  );
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

        {/* SPARE PARTS */}
        {bookingSpare?.parts?.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sky-400 font-bold mb-3">
              🔧 Spare Parts
            </h4>

           {bookingSpare.parts.map((part) => {
  const status = part.status || "pending";

  return (
    <div
      key={part.id}
      className="bg-slate-800 rounded-lg p-3 mb-2"
    >
      <p className="text-white font-semibold">
        {part.partName}
      </p>

      <p className="text-sm text-gray-400">
        {part.qty} × ₹{part.price} ={" "}
        <span className="text-orange-400 font-bold">
          ₹{part.total}
        </span>
      </p>

      {/* STATUS */}
      <p
        className={`text-xs font-bold mt-1 ${
          status === "pending"
            ? "text-yellow-400"
            : status === "approved"
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {status.toUpperCase()}
      </p>

      {/* 🔥 ACTION BUTTONS */}
      {status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() =>
              onApprove(
                bookingSpare.serviceId,
                part.id,
                "approved"
              )
            }
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
          >
            Approve
          </button>

          <button
            onClick={() =>
              onApprove(
                bookingSpare.serviceId,
                part.id,
                "rejected"
              )
            }
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
})}

            {/* TOTAL */}
            <div className="mt-3 text-right font-bold text-sky-400">
              Total: ₹
              {bookingSpare.parts
                .reduce((sum, p) => sum + Number(p.total), 0)
                .toFixed(2)}
            </div>
          </div>
        )}

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