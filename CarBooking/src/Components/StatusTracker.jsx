const STATUS_FLOW = [
  "BOOKED",
  "CALL_VERIFIED",
  "APPROVED",
  "PROCESSING",
  "WAITING_SPARE",
  "SERVICE_GOING",
  "BILL_PENDING",
  "BILL_COMPLETED",
  "SERVICE_COMPLETED",
];

const STATUS_NORMALIZER = {
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
              className={`w-10 h-10 rounded-full flex items-center justify-center
                border-2
                ${
                  isCompleted
                    ? "bg-sky-500 border-sky-500 text-black"
                    : "border-gray-600 text-gray-400"
                }`}
            >
              {index + 1}
            </div>

            <p className="text-xs text-center w-24 text-gray-300">
              {status.replace("_", " ")}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTracker;