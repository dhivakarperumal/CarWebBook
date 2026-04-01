import React, { useEffect, useState } from "react";
import BookingModal from "./BookingModal";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

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
  const [services, setServices] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [spareParts, setSpareParts] = useState([]);
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [approvingPartId, setApprovingPartId] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user?.email) {
        console.warn("⚠️ User email not available yet");
        return;
      }

      console.log("� [ServiceStatus] User email:", user.email);

      // Fetch bookings
      console.log("📋 [ServiceStatus] Fetching bookings from /bookings...");
      const res = await api.get("/bookings");
      console.log("📊 [ServiceStatus] All bookings:", res.data);
      
      const bookingData = (res.data || [])
        .filter((b) => {
          const match = b.email?.toLowerCase() === user.email.toLowerCase();
          console.log(`   Booking ${b.id}: email="${b.email}" match="${match}"`);
          return match;
        })
        .map((raw) => ({
          id: raw.id,
          ...raw,
          normalizedStatus:
            STATUS_NORMALIZER[raw.status] || raw.status,
        }));

      console.log(`✅ [ServiceStatus] Filtered ${bookingData.length} bookings`);

      // Merge issue from all_services into bookings for user view
      const bookingsWithServiceIssue = bookingData.map((b) => {
        const matchedService = (res.data || []).find(
          (s) => s.bookingId === b.bookingId || s.bookingDocId === b.id
        );
        return {
          ...b,
          issue: matchedService?.issue || b.issue,
          issueAmount: matchedService?.issueAmount != null ? matchedService.issueAmount : b.issueAmount,
          issueStatus: matchedService?.issueStatus || b.issueStatus || 'pending',
          issueUpdatedAt: matchedService?.updatedAt || b.updatedAt,
        };
      });

      setBookings(bookingsWithServiceIssue);

      // Fetch all services to get spare parts and issue entries
      console.log("🔍 [ServiceStatus] Fetching all services from /all-services...");
      const servicesRes = await api.get("/all-services");
      console.log("📊 [ServiceStatus] All services:", servicesRes.data);
      
      const filteredServices = (servicesRes.data || []).filter((s) => {
        const match = s.email?.toLowerCase() === user.email.toLowerCase();
        console.log(`   Service ${s.id}: email="${s.email}" match="${match}"`);
        return match;
      });
      console.log(`✅ [ServiceStatus] Filtered ${filteredServices.length} services`);

      // Enrich services with parts and issue entries from detail endpoint
      const enrichedServices = [];
      for (let service of filteredServices) {
        try {
          const detailRes = await api.get(`/all-services/${service.id}`);
          const details = detailRes.data;
          enrichedServices.push({
            ...service,
            parts: details.parts || [],
            issues: details.issues || [],
          });
        } catch (err) {
          console.error(`❌ [ServiceStatus] Failed to fetch service details for ${service.id}:`, err);
          enrichedServices.push({ ...service, parts: [], issues: [] });
        }
      }

      console.log(`✅ [ServiceStatus] Enriched services with parts and issues`);
      setServices(enrichedServices);

      // Update bookings issue from linked all_services so user sees latest issue text
      const mergedBookings = bookingData.map((b) => {
        const matchedService = enrichedServices.find(
          (s) => s.bookingId === b.bookingId || s.bookingDocId === b.id
        );
        return {
          ...b,
          issues: matchedService?.issues || [],
          issue: matchedService?.issue || b.issue,
          issueAmount: matchedService?.issueAmount != null ? matchedService.issueAmount : b.issueAmount,
          issueStatus: matchedService?.issueStatus || b.issueStatus || 'pending',
          issueUpdatedAt: matchedService?.updatedAt || b.updatedAt,
        };
      });
      setBookings(mergedBookings);

      // Fetch spare parts for these services
      console.log("🔍 [ServiceStatus] Fetching spare parts for each service...");
      const allSpareParts = [];
      for (let service of filteredServices) {
        try {
          console.log(`📦 [ServiceStatus] Fetching parts for service ${service.id}...`);
          const partsRes = await api.get(`/all-services/${service.id}`);
          console.log(`✅ [ServiceStatus] Service ${service.id} response:`, partsRes.data);
          
          if (partsRes.data?.parts) {
            allSpareParts.push({
              serviceName: service.bookingId,
              serviceId: service.id,
              customerName: service.name,
              parts: partsRes.data.parts,
            });
            console.log(`✅ [ServiceStatus] Added ${partsRes.data.parts.length} parts for service ${service.id}`);
          } else {
            console.log(`ℹ️ [ServiceStatus] No parts found for service ${service.id}`);
          }
        } catch (err) {
          console.error(`❌ [ServiceStatus] Failed to fetch parts for service ${service.id}:`, err);
        }
      }
      console.log("📊 [ServiceStatus] Total spare parts groups:", allSpareParts.length);
      setSpareParts(allSpareParts);

      console.log("👉 [ServiceStatus] Fetch complete");
    } catch (err) {
      console.error("❌ [ServiceStatus] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user]); // 👈 IMPORTANT

  const handleApproveSpare = async (serviceId, itemId, status, type = 'part') => {
    try {
      if (type === 'part') {
        setApprovingPartId(itemId);
        await api.put(`/all-services/${serviceId}/parts/${itemId}/approve`, {
          status: status,
          approvedBy: user.email,
          approvalNotes: `${status} by customer`,
        });
      } else if (type === 'issue') {
        setApprovingPartId(itemId);
        if (itemId) {
          await api.put(
            `/all-services/${serviceId}/issues/${itemId}/status`,
            {
              issueStatus: status,
            }
          );
        } else {
          await api.put(`/all-services/${serviceId}/issue-status`, {
            issueStatus: status,
          });
        }
      }

      toast.success(`${type === 'issue' ? 'Issue' : 'Spare part'} ${status} successfully`);
      // Refresh data
      setLoading(true);
      const servicesRes = await api.get("/all-services");
      const filteredServices = (servicesRes.data || []).filter(
        (s) => s.email?.toLowerCase() === user.email.toLowerCase()
      );
      setServices(filteredServices);

      // Fetch spare parts again
      const allSpareParts = [];
      for (let service of filteredServices) {
        try {
          const partsRes = await api.get(`/all-services/${service.id}`);
          if (partsRes.data?.parts) {
            allSpareParts.push({
              serviceName: service.bookingId,
              serviceId: service.id,
              customerName: service.name,
              parts: partsRes.data.parts,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch parts for service ${service.id}`, err);
        }
      }
      setSpareParts(allSpareParts);

      if (type === 'issue') {
        // update local booking issue status for immediate reflection
        const linkedService =
          filteredServices.find((s) => s.id === serviceId) ||
          services.find((s) => s.id === serviceId);

        const bookingDocId = linkedService?.bookingDocId;

        if (bookingDocId) {
          setBookings((prev) =>
            prev.map((b) => {
              if (b.id !== bookingDocId) return b;
              return {
                ...b,
                issueStatus: status,
                issues: b.issues
                  ? b.issues.map((issue) =>
                      issue.id === itemId
                        ? { ...issue, issueStatus: status }
                        : issue
                    )
                  : b.issues,
              };
            })
          );

          // Also update selectedBooking if it is currently open
          setSelectedBooking((prev) => {
            if (!prev || prev.id !== bookingDocId) return prev;
            return {
              ...prev,
              issueStatus: status,
              issues: prev.issues
                ? prev.issues.map((issue) =>
                    issue.id === itemId
                      ? { ...issue, issueStatus: status }
                      : issue
                  )
                : prev.issues,
            };
          });
        }
      }

      setLoading(false);
    } catch (err) {
      toast.error("Failed to update spare part status");
      console.error(err);
    } finally {
      setApprovingPartId(null);
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-300">Loading...</div>;

  // Check if there are pending spare parts
  const pendingSpares = spareParts.filter(sp =>
    sp.parts.some(p => p.status === "pending")
  );

  return (
    <div className="p-1 md:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-sky-400">
        My Service Bookings
      </h2>

      {/* Show pending spares alert */}
      {pendingSpares.length > 0 && (
        <div className="mb-6 bg-orange-500/20 border border-orange-500/40 rounded-lg p-4">
          <p className="font-semibold text-orange-300">⚠️ {pendingSpares.length} service(s) have spare parts pending approval</p>
          <p className="text-sm text-orange-300 mt-1">
            Total pending amount: <span className="font-bold">₹{pendingSpares.reduce((sum, sp) => sum + sp.parts.reduce((psum, p) => p.status === 'pending' ? psum + Number(p.total) : psum, 0), 0).toFixed(2)}</span>
          </p>
          <button
            onClick={() => setShowSpareModal(true)}
            className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
          >
            View & Approve Spare Parts
          </button>
        </div>
      )}

      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            // Find spare parts for this booking
            const bookingSpares = spareParts.find(sp => sp.serviceId === booking.id);
            const hasPendingSpares = bookingSpares?.parts?.some(p => p.status === 'pending');
            
            return (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking({ ...booking, serviceId: bookingSpares?.serviceId })}
                className={`cursor-pointer bg-[#020617] border rounded-xl px-2 md:px-6 py-4 flex justify-between items-center hover:shadow-lg transition ${
                  hasPendingSpares 
                    ? 'border-orange-500/40 hover:shadow-orange-500/30' 
                    : 'border-sky-500/30 hover:shadow-sky-500/30'
                }`}
              >
                <div>
                  <p className="text-white font-semibold">
                    {booking.bookingId}
                  </p>
                  <p className="text-sm text-gray-400">
                    {booking.name} • {booking.phone}
                  </p>
                  
                  {/* Show spare parts summary */}
                  {bookingSpares?.parts?.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="text-gray-500">
                        🔧 Spares: ₹{bookingSpares.parts.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)} - 
                        <span className={`ml-1 font-bold ${
                          hasPendingSpares ? 'text-orange-400' : 
                          bookingSpares.parts.every(p => p.status === 'approved') ? 'text-green-400' :
                          'text-red-400'
                        }`}>
                          {bookingSpares.parts.filter(p => p.status === 'pending').length ? 'PENDING' : 
                           bookingSpares.parts.every(p => p.status === 'approved') ? 'APPROVED' : 'PARTIAL'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                  hasPendingSpares 
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                }`}>
                  {STATUS_LABELS[booking.normalizedStatus]}
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-gray-500">
            No bookings found
          </div>
        )}
      </div>

      {/* Spare Parts Approval Modal */}
      {showSpareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[70vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Spare Parts Status</h3>
            
            {spareParts.filter(sp => sp.parts.length > 0).length > 0 ? (
              spareParts.map((service) => (
                service.parts.length > 0 && (
                  <div key={service.serviceId} className="mb-6 pb-6 border-b border-gray-700">
                    <p className="text-sky-400 font-bold mb-3">📋 {service.serviceName} - {service.customerName}</p>
                    
                    {service.parts.map((part) => (
                      <div key={part.id} className="bg-gray-800 rounded-lg p-4 mb-3">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-white font-semibold">{part.partName}</p>
                            <p className="text-sm text-gray-400">
                              Qty: {part.qty} × ₹{Number(part.price).toFixed(2)} = <span className="text-orange-400 font-bold">₹{Number(part.total).toFixed(2)}</span>
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                            part.status === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : part.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {(part.status || 'pending').toUpperCase()}
                          </span>
                        </div>

                        {part.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveSpare(service.serviceId, part.id, 'approved')}
                              disabled={approvingPartId === part.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                              <FaCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleApproveSpare(service.serviceId, part.id, 'rejected')}
                              disabled={approvingPartId === part.id}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                              <FaTimes /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Total for this service */}
                    <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <p className="text-blue-300 font-bold">Total for {service.serviceName}</p>
                        <p className="text-xl font-black text-blue-400">₹{service.parts.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="p-6 text-center text-gray-400">
                No spare parts added yet
              </div>
            )}

            <button
              onClick={() => setShowSpareModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingModal
          booking={{
            ...selectedBooking,
            status: selectedBooking.normalizedStatus,
          }}
          spareParts={spareParts}
          onClose={() => setSelectedBooking(null)}
          onApprove={handleApproveSpare}
        />
      )}
    </div>
  );
};

export default ServiceStatus;