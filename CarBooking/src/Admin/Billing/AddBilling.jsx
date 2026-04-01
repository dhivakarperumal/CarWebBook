import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddBillings = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(18);

  /* =======================
     FETCH SERVICES
  ======================= */
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/all-services');
        setServices(res.data);
      } catch {
        toast.error("Failed to load services");
      }
    };
    fetchServices();
  }, []);

  /* =======================
     SELECT SERVICE
  ======================= */
  const selectService = async (s) => {
    try {
      setSelectedService(s);
      
      // Fetch parts from backend for this service
      const res = await api.get(`/all-services/${s.id}`);
      const data = res.data;

      const partsData = (data.parts || []).map((p) => {
        return {
          partName: p.partName,
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total: Number(p.qty || 0) * Number(p.price || 0),
        };
      });

      setParts(partsData);
    } catch (err) {
      toast.error("Failed to load spare parts");
    }
  };

  /* =======================
     CALCULATIONS
  ======================= */
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const labourAmount = Number(labour || 0);
  const gst = Number(gstPercent || 0);

  const subTotal = partsTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const grandTotal = subTotal + gstAmount;

  /* =======================
     SAVE BILL
  ======================= */
  const handleGenerateBill = async () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (parts.length === 0) {
      toast.error("No spare parts found");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Invalid billing amount");
      return;
    }

    try {
      const invoiceNo = `INV-${Date.now()}`;

      const payload = {
        invoiceNo,
        serviceId: selectedService.id,
        bookingId: selectedService.bookingId,
        uid: selectedService.uid,
        customerName: selectedService.name,
        mobileNumber: selectedService.phone,
        car: `${selectedService.brand || ""} ${selectedService.model || ""}`.trim(),
        parts,
        partsTotal,
        labour: labourAmount,
        gstPercent: gst,
        gstAmount,
        subTotal,
        grandTotal,
        paymentStatus: "Pending",
        paymentMode: "",
        status: "Generated"
      };

      await api.post('/billings', payload);

      toast.success("Invoice generated successfully 🚗💰");
      navigate("/admin/billing");
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 max-w-6xl bg-white shadow rounded-lg mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Generate Billing Invoice</h2>

      <div className="space-y-4">
        {/* 1. SEARCH SERVICE */}
        <div>
          <label className="block text-sm text-gray-600 mb-1 font-medium">Search Booking</label>
          <input
            placeholder="Search Booking ID / Name / Phone"
            className="w-full border border-gray-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-black transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 2. SELECT SERVICE */}
        <div>
          <label className="block text-sm text-gray-600 mb-1 font-medium">Select Booking</label>
          <select
            className="w-full border border-gray-200 bg-white px-4 py-3 rounded-lg cursor-pointer shadow-sm focus:ring-2 focus:ring-black outline-none transition"
            value={selectedService?.id || ""}
            onChange={(e) => {
              const s = services.find(
                (srv) => String(srv.id) === String(e.target.value)
              );
              if (s) {
                selectService(s);
              } else {
                setSelectedService(null);
                setParts([]);
              }
            }}
          >
            <option value="">-- Choose a Booking Default or From Search --</option>
            {services
              .filter((s) =>
                `${s.bookingId} ${s.name} ${s.phone} ${s.brand} ${s.model}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.bookingId} — {s.name} ({s.brand} {s.model}) - {s.phone}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* SERVICE DETAILS */}
      {selectedService && (
        <div className="bg-white p-4 shadow rounded grid grid-cols-2 gap-3 text-sm">
          <div><b>Customer:</b> {selectedService.name}</div>
          <div><b>Mobile:</b> {selectedService.phone}</div>
          <div><b>Car:</b> {selectedService.brand} {selectedService.model}</div>
          <div><b>Booking ID:</b> {selectedService.bookingId}</div>
        </div>
      )}

      {/* PARTS TABLE */}
      {parts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3">S No</th>
                <th className="px-4 py-3">Part Name</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 text-center">{i + 1}</td>
                  <td className="px-4 py-3 text-center">{p.partName}</td>
                  <td className="px-4 py-3 text-center">{p.qty}</td>
                  <td className="px-4 py-3 text-center">{p.price}</td>
                  <td className="px-4 py-3 text-center">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LABOUR & GST */}
      {selectedService && (
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Labour Charges (₹)"
            className="border px-4 py-3 rounded-lg"
            value={labour}
            onChange={(e) => setLabour(e.target.value)}
          />

          <input
            type="number"
            placeholder="GST %"
            className="border px-4 py-3 rounded-lg"
            value={gstPercent}
            onChange={(e) => setGstPercent(e.target.value)}
          />
        </div>
      )}

      {/* TOTAL */}
      {selectedService && (
        <div className="bg-gray-50 p-4 rounded text-right font-semibold space-y-1">
          <p>Parts Total: ₹{partsTotal}</p>
          <p>Labour Charges: ₹{labourAmount}</p>
          <p>GST ({gst}%): ₹{gstAmount.toFixed(2)}</p>
          <p className="text-lg text-green-700">
            Grand Total: ₹{grandTotal.toFixed(2)}
          </p>
        </div>
      )}

      {/* ACTION */}
      {selectedService && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="border px-5 py-2 rounded"
          >
            Cancel
          </button>

          <button
            disabled={parts.length === 0}
            onClick={handleGenerateBill}
            className="bg-black hover:bg-orange-500 text-white px-6 py-2 rounded"
          >
            Generate Invoice
          </button>
        </div>
      )}
    </div>
  );
};

export default AddBillings;

// import { useEffect, useState } from "react";
// import {
//   doc,
//   getDoc,
//   collection,
//   getDocs,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useNavigate, useParams } from "react-router-dom";
// import toast from "react-hot-toast";

// const AddBillings = () => {
//   const { serviceId } = useParams();
//   const navigate = useNavigate();

//   const [service, setService] = useState(null);
//   const [parts, setParts] = useState([]);
//   const [paymentStatus, setPaymentStatus] = useState("pending");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   /* =========================
//      LOAD SERVICE + PARTS
//   ========================= */
//   useEffect(() => {
//     if (!serviceId) return;

//     const loadData = async () => {
//       try {
//         /* 🔹 SERVICE */
//         const serviceRef = doc(db, "allServices", serviceId);
//         const serviceSnap = await getDoc(serviceRef);

//         if (!serviceSnap.exists()) {
//           toast.error("Service not found");
//           navigate("/admin/services");
//           return;
//         }

//         setService({ id: serviceSnap.id, ...serviceSnap.data() });

//         /* 🔹 PARTS */
//         const partsRef = collection(
//           db,
//           "allServices",
//           serviceId,
//           "parts"
//         );
//         const partsSnap = await getDocs(partsRef);

//         const safeParts = partsSnap.docs.map((d) => {
//           const data = d.data();
//           return {
//             id: d.id,
//             partName: data.partName,
//             qty: Number(data.qty || 0),
//             price: Number(data.price || 0),
//             total:
//               Number(data.qty || 0) * Number(data.price || 0),
//           };
//         });

//         setParts(safeParts);
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load invoice data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [serviceId, navigate]);

//   if (loading) {
//     return <div className="p-10 text-center">Loading invoice...</div>;
//   }

//   if (!service) return null;

//   /* =========================
//      TOTALS
//   ========================= */
//   const subTotal = parts.reduce((sum, p) => sum + p.total, 0);
//   const gstAmount = Math.round(subTotal * 0.18);
//   const grandTotal = subTotal + gstAmount;

//   /* =========================
//      SAVE INVOICE
//   ========================= */
//   const saveInvoice = async () => {
//     try {
//       setSaving(true);

//       await addDoc(collection(db, "billings"), {
//         serviceId: service.id,
//         bookingId: service.bookingId,

//         customerName: service.name,
//         mobileNumber: service.phone,
//         car: `${service.brand || ""} ${service.model || ""}`,

//         parts,
//         subTotal,
//         gstAmount,
//         grandTotal,

//         paymentStatus,
//         createdAt: serverTimestamp(),
//       });

//       toast.success("Invoice created successfully");
//       navigate("/admin/billings");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to save invoice");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* =========================
//      UI
//   ========================= */
//   return (
//     <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
//       <h2 className="text-2xl font-semibold text-blue-700">
//         Create Invoice
//       </h2>

//       {/* CUSTOMER INFO */}
//       <div className="grid md:grid-cols-2 gap-4 text-sm">
//         <Info label="Customer" value={service.name} />
//         <Info label="Mobile" value={service.phone} />
//         <Info
//           label="Car"
//           value={`${service.brand || ""} ${service.model || ""}`}
//         />
//         <Info label="Booking ID" value={service.bookingId} />
//       </div>

//       {/* PAYMENT STATUS */}
//       <div className="max-w-xs">
//         <label className="block text-sm text-gray-600 mb-1">
//           Payment Status
//         </label>
//         <select
//           value={paymentStatus}
//           onChange={(e) => setPaymentStatus(e.target.value)}
//           className="w-full border rounded-lg px-4 py-2"
//         >
//           <option value="pending">Pending</option>
//           <option value="partial">Partial</option>
//           <option value="paid">Paid</option>
//         </select>
//       </div>

//       {/* PARTS TABLE */}
//       <div className="overflow-hidden border rounded-xl">
//         <table className="min-w-full text-sm">
//           <thead className="bg-black text-white">
//             <tr>
//               <th className="px-4 py-3">Part</th>
//               <th className="px-4 py-3">Qty</th>
//               <th className="px-4 py-3">Price</th>
//               <th className="px-4 py-3">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {parts.map((p) => (
//               <tr key={p.id} className="border-t">
//                 <td className="px-4 py-3">{p.partName}</td>
//                 <td className="px-4 py-3 text-center">{p.qty}</td>
//                 <td className="px-4 py-3 text-center">₹{p.price}</td>
//                 <td className="px-4 py-3 text-center font-medium">
//                   ₹{p.total}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* TOTALS */}
//       <div className="text-right space-y-1">
//         <p>Sub Total: ₹{subTotal}</p>
//         <p>GST (18%): ₹{gstAmount}</p>
//         <p className="text-xl font-semibold">
//           Grand Total: ₹{grandTotal}
//         </p>
//       </div>

//       {/* ACTIONS */}
//       <div className="flex justify-end gap-3">
//         <button
//           onClick={() => navigate(-1)}
//           className="border px-5 py-2 rounded"
//         >
//           Back
//         </button>

//         <button
//           onClick={saveInvoice}
//           disabled={saving}
//           className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
//         >
//           {saving ? "Saving..." : "Save Invoice"}
//         </button>
//       </div>
//     </div>
//   );
// };

// const Info = ({ label, value }) => (
//   <div>
//     <p className="text-gray-500">{label}</p>
//     <p className="font-medium">{value || "-"}</p>
//   </div>
// );

// export default AddBillings;
