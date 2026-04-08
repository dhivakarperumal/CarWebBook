import React, { useEffect, useState } from "react";
import api, { getBookings, getAllServices } from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import toast from "react-hot-toast";

const STATUS_LABELS = {
  "Service Completed": "✅ Completed",
  "Bill Completed": "✅ Completed",
  "Cancelled": "❌ Cancelled",
};

const History = () => {
  const { user } = useAuth();
  const [completedServices, setCompletedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState(null);

  useEffect(() => {
    fetchCompletedServices();
  }, [user?.uid]);

  const fetchCompletedServices = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        console.warn("User UID not available");
        return;
      }

      // Fetch all services for this user
      console.log("📋 Fetching all services...");
      const servicesRes = await getAllServices();
      const allServices = servicesRes.data || [];
      const userServices = allServices.filter(
        (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      // Filter for completed services
      const completed = userServices.filter((s) =>
        ["Service Completed", "Bill Completed"].includes(s.serviceStatus)
      );

      console.log(`✅ Found ${completed.length} completed services`);

      // Fetch spare parts for each completed service
      const enrichedServices = await Promise.all(
        completed.map(async (service) => {
          try {
            const partsRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: partsRes.data?.parts || [],
            };
          } catch (err) {
            console.error(`Failed to fetch parts for service ${service.id}`, err);
            return {
              ...service,
              parts: [],
            };
          }
        })
      );

      setCompletedServices(enrichedServices);
    } catch (err) {
      console.error("Error fetching completed services:", err);
      toast.error("Failed to load service history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-300">
        <FaClock className="animate-spin mx-auto mb-2" size={24} />
        Loading service history...
      </div>
    );
  }

  if (completedServices.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p className="text-lg font-semibold">No service history yet</p>
        <p className="text-sm mt-2">Your completed services will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-1 md:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-sky-400">
        📜 Service History
      </h2>

      <div className="space-y-4">
        {completedServices.map((service) => {
          const isExpanded = expandedService === service.id;
          const totalSpareAmount = service.parts?.reduce(
            (sum, p) => sum + Number(p.total || 0),
            0
          ) || 0;

          return (
            <div
              key={service.id}
              className="border border-sky-500/30 rounded-xl bg-slate-800/50 overflow-hidden transition"
            >
              {/* Header - Click to Expand */}
              <button
                onClick={() =>
                  setExpandedService(isExpanded ? null : service.id)
                }
                className="w-full text-left px-4 md:px-6 py-4 hover:bg-slate-700/50 transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaCheckCircle className="text-green-400" size={16} />
                      <p className="text-white font-semibold text-lg">
                        {service.bookingId}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-500">Vehicle:</span>{" "}
                        {service.brand} {service.model}
                      </div>
                      <div>
                        <span className="text-gray-500">Number:</span>{" "}
                        {service.vehicleNumber}
                      </div>
                      <div>
                        <span className="text-gray-500">Issue:</span>{" "}
                        {service.issue}
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span className="text-green-400 font-semibold">
                          {STATUS_LABELS[service.serviceStatus] ||
                            service.serviceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-sky-400">
                      ₹{totalSpareAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isExpanded ? "▼ Collapse" : "▶ Expand"}
                    </p>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-sky-500/20 px-4 md:px-6 py-4 bg-slate-800/30 space-y-4">
                  {/* Service Details Section */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sky-300 mb-3">
                      📋 Service Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-500">Customer Name:</span>
                        <p className="text-white font-medium">{service.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="text-white font-medium">
                          {service.phone}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="text-white font-medium">{service.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <p className="text-white font-medium">
                          {service.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Spare Parts Section */}
                  {service.parts && service.parts.length > 0 ? (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sky-300 mb-3">
                        🔧 Spare Parts / Materials Used
                      </h4>
                      <div className="space-y-2">
                        {service.parts.map((part, idx) => (
                          <div
                            key={part.id || idx}
                            className="flex justify-between items-center p-3 bg-slate-600/30 rounded-lg border border-slate-600/50"
                          >
                            <div className="flex-1">
                              <p className="text-white font-semibold">
                                {part.partName}
                              </p>
                              <p className="text-xs text-gray-400">
                                Qty: {part.qty} × ₹{Number(part.price).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-400">
                                ₹{Number(part.total).toFixed(2)}
                              </p>
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${part.status === "approved"
                                  ? "bg-green-500/20 text-green-400"
                                  : part.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                  }`}
                              >
                                {(part.status || "completed").toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-600/50 flex justify-end">
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Total Spare Cost</p>
                          <p className="text-2xl font-bold text-orange-400">
                            ₹{totalSpareAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center text-gray-400">
                      <p>No spare parts recorded for this service</p>
                    </div>
                  )}

                  {/* Service Labor/Notes Section */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sky-300 mb-3">
                      ℹ️ Service Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-500">Issue Reported:</span>
                        <p className="text-white font-medium">{service.issue}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Service Status:</span>
                        <p className="text-green-400 font-medium">
                          {service.serviceStatus}
                        </p>
                      </div>
                      {service.otherIssue && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">
                            Additional Notes:
                          </span>
                          <p className="text-white font-medium">
                            {service.otherIssue}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;