const STATUS_FLOW = [
  "BOOKED",
  "CALL_VERIFIED",
  "APPROVED",
  "PROCESSING",
  "WAITING_SPARE",
  "SERVICE_GOING",
  "SERVICE_COMPLETED",
  "BILL_PENDING",
  "BILL_COMPLETED",
];

const STATUS_NORMALIZER = {
  "Booked": "BOOKED",
  "Appointment Booked": "BOOKED",
  "Call Verified": "CALL_VERIFIED",
  "Confirmed": "APPROVED",
  "Approved": "APPROVED",
  "In Progress": "PROCESSING",
  "Processing": "PROCESSING",
  "Waiting for Spare": "WAITING_SPARE",
  "Service Going on": "SERVICE_GOING",
  "Bill Pending": "BILL_PENDING",
  "Bill Completed": "BILL_COMPLETED",
  "Service Completed": "SERVICE_COMPLETED",
  "Completed": "SERVICE_COMPLETED",
  "Cancelled": "CANCELLED",
};

const StatusTracker = ({ currentStatus }) => {
  const normalizedStatus =
    STATUS_NORMALIZER[currentStatus] || currentStatus;

  const activeIndex = STATUS_FLOW.indexOf(normalizedStatus);

  return (
    <div className="flex flex-wrap gap-6 justify-center mt-6">
      {STATUS_FLOW.map((status, index) => {
        const isCompleted = index <= activeIndex;

        return (
          <div key={status} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm
                border-2 transition-all duration-500
                ${
                  isCompleted
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white"
                    : "border-slate-700 bg-slate-800/50 text-slate-500"
                }`}
            >
              {index + 1}
            </div>
            <p className={`text-[10px] font-black text-center w-24 uppercase tracking-widest mt-1 transition-colors ${isCompleted ? 'text-cyan-400' : 'text-slate-500'}`}>
              {status.replace("_", " ")}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTracker;