import StatusTracker from "./StatusTracker";

const BookingModal = ({ booking, spareParts, onClose, onApprove }) => {
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
          <p>
            <span className="text-sky-400">Reg. No:</span> {booking.vehicleNumber || booking.registrationNumber || "N/A"}
          </p>

          <p className="sm:col-span-2">
            <span className="text-sky-400">Issue:</span> {booking.issue}
          </p>

          {booking.preferredDate && (
            <p>
              <span className="text-sky-400">Service Date:</span> {new Date(booking.preferredDate).toLocaleDateString()}
            </p>
          )}

          {booking.preferredTimeSlot && (
            <p>
              <span className="text-sky-400">Time Slot:</span> {booking.preferredTimeSlot}
            </p>
          )}

          {booking.assignedEmployeeName && (
            <p className="sm:col-span-2 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
              <span className="text-sky-400 font-bold">🔧 Assigned Mechanic:</span> {booking.assignedEmployeeName}
            </p>
          )}

          <p className="sm:col-span-2">
            <span className="text-sky-400">Address:</span> {booking.address || booking.location}
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
                    className={`text-xs font-bold mt-1 ${status === "pending"
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
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
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
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
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
        {/* SERVICE ISSUE SECTION */}
        <div className="mt-6">
          <h4 className="text-sky-400 font-bold mb-3">
            ⚙️ Service Issues
          </h4>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
            {(booking.issues && booking.issues.length > 0) ? (
              booking.issues.map((issueEntry) => {
                const status = (issueEntry.issueStatus || 'pending').toLowerCase();
                return (
                  <div key={issueEntry.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                    <p className="text-gray-300 text-sm leading-relaxed">{issueEntry.issue}</p>
                    {issueEntry.issueAmount != null && Number(issueEntry.issueAmount) > 0 && (
                      <p className="text-sm text-orange-300 font-semibold mt-1">Amount: ₹{Number(issueEntry.issueAmount).toFixed(2)}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Issue Date: {issueEntry.createdAt ? new Date(issueEntry.createdAt).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1">Status: <span className={`font-bold ${status === 'approved' ? 'text-green-300' : status === 'rejected' ? 'text-red-300' : 'text-yellow-300'}`}>{status.toUpperCase()}</span></p>

                    {status === 'pending' && booking.serviceId && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onApprove(booking.serviceId, issueEntry.id, 'approved', 'issue')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onApprove(booking.serviceId, issueEntry.id, 'rejected', 'issue')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : booking.issue ? (
              <div>
                <p className="text-gray-300 text-sm leading-relaxed">{booking.issue}</p>
                {booking.issueAmount != null && Number(booking.issueAmount) > 0 && (
                  <p className="text-sm text-orange-300 font-semibold mt-1">Amount: ₹{Number(booking.issueAmount).toFixed(2)}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">Issue Date: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-1">Status: <span className={`font-bold ${booking.issueStatus === 'approved' ? 'text-green-300' : booking.issueStatus === 'rejected' ? 'text-red-300' : 'text-yellow-300'}`}>{(booking.issueStatus || 'pending').toUpperCase()}</span></p>

                {(booking.issueStatus || 'pending') === 'pending' && booking.serviceId && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onApprove(booking.serviceId, null, 'approved', 'issue')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onApprove(booking.serviceId, null, 'rejected', 'issue')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No service issue details entered yet.</p>
            )}
          </div>
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


