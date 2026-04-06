import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddBillings = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("online"); // "online" or "manual"
  const [manualCustomer, setManualCustomer] = useState({
    name: "",
    phone: "",
    brand: "",
    model: "",
    regNo: ""
  });

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);

  // For Manual Parts Entry
  const [newPart, setNewPart] = useState({ partName: "", qty: 1, price: 0 });

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(0);

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
    if (activeTab === "online" && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (activeTab === "manual" && (!manualCustomer.name || !manualCustomer.phone)) {
      toast.error("Please enter customer name and phone");
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
        serviceId: activeTab === "online" ? selectedService.id : null,
        bookingId: activeTab === "online" ? selectedService.bookingId : `MANUAL-${Date.now()}`,
        uid: activeTab === "online" ? selectedService.uid : null,
        customerName: activeTab === "online" ? selectedService.name : manualCustomer.name,
        mobileNumber: activeTab === "online" ? selectedService.phone : manualCustomer.phone,
        car: activeTab === "online" 
          ? `${selectedService.brand || ""} ${selectedService.model || ""}`.trim()
          : `${manualCustomer.brand || ""} ${manualCustomer.model || ""}`.trim(),
        registrationNumber: activeTab === "online" ? selectedService.registrationNumber : manualCustomer.regNo,
        parts,
        partsTotal,
        labour: labourAmount,
        gstPercent: gst,
        gstAmount,
        subTotal,
        grandTotal,
        paymentStatus: "Pending",
        paymentMode: "",
        status: "Generated",
        billingType: activeTab // "online" or "manual"
      };

      await api.post('/billings', payload);

      toast.success("Invoice generated successfully 🚗💰");
      navigate("/admin/billing");
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  const addManualPart = () => {
    if (!newPart.partName || newPart.price <= 0) {
      toast.error("Please enter valid part name and price");
      return;
    }
    setParts([...parts, { ...newPart, total: newPart.qty * newPart.price }]);
    setNewPart({ partName: "", qty: 1, price: 0 });
  };

  const removePart = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 max-w-6xl bg-white shadow-2xl rounded-3xl mx-auto space-y-8 border border-gray-100">
      <div className="flex justify-between items-center bg-gray-50 -m-6 p-8 rounded-t-3xl border-b border-gray-100 mb-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Generate Billing Invoice</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Create invoices for online bookings or manual walk-ins</p> 
        </div>
        <div className="flex items-center p-1 bg-gray-200 rounded-xl">
          <button 
            onClick={() => { setActiveTab("online"); setSelectedService(null); setParts([]); }}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'online' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Online Booking
          </button>
          <button 
            onClick={() => { setActiveTab("manual"); setSelectedService(null); setParts([]); }}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {activeTab === "online" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search Booking</label>
            <input
              placeholder="Search Booking ID / Name / Phone..."
              className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black transition bg-white font-bold text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Booking</label>
            <select
              className="w-full border border-gray-200 bg-white px-4 py-3 rounded-xl cursor-pointer shadow-sm focus:ring-2 focus:ring-black outline-none transition font-bold text-sm"
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
              <option value="">-- Choose a Booking --</option>
              {services
                .filter((s) =>
                  `${s.bookingId} ${s.name} ${s.phone} ${s.brand} ${s.model}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.bookingId} — {s.name} ({s.brand} {s.model})
                  </option>
                ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer & Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
               <label className="text-[9px] font-bold text-gray-500 ml-1">Name</label>
               <input 
                type="text" placeholder="Customer Name"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm"
                value={manualCustomer.name}
                onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-bold text-gray-500 ml-1">Phone</label>
               <input 
                type="text" placeholder="Phone Number"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm"
                value={manualCustomer.phone}
                onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-bold text-gray-500 ml-1">Brand</label>
               <input 
                type="text" placeholder="Car Brand"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm"
                value={manualCustomer.brand}
                onChange={e => setManualCustomer({...manualCustomer, brand: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-bold text-gray-500 ml-1">Model</label>
               <input 
                type="text" placeholder="Car Model"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm"
                value={manualCustomer.model}
                onChange={e => setManualCustomer({...manualCustomer, model: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-bold text-gray-500 ml-1">Reg. No</label>
               <input 
                type="text" placeholder="Vehicle Reg Number"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm"
                value={manualCustomer.regNo}
                onChange={e => setManualCustomer({...manualCustomer, regNo: e.target.value})}
               />
            </div>
          </div>
        </div>
      )}

      {/* SERVICE DETAILS PREVIEW (Only for Online) */}
      {selectedService && activeTab === "online" && (
        <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div><p className="text-[9px] font-black text-sky-400 uppercase mb-1">Customer</p><p className="font-bold text-gray-900">{selectedService.name}</p></div>
          <div><p className="text-[9px] font-black text-sky-400 uppercase mb-1">Mobile</p><p className="font-bold text-gray-900">{selectedService.phone}</p></div>
          <div><p className="text-[9px] font-black text-sky-400 uppercase mb-1">Car</p><p className="font-bold text-gray-900">{selectedService.brand} {selectedService.model}</p></div>
          <div><p className="text-[9px] font-black text-sky-400 uppercase mb-1">Booking ID</p><p className="font-bold text-gray-900">{selectedService.bookingId}</p></div>
        </div>
      )}

      {/* PARTS MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spare Parts & Inventory</h3>
            {activeTab === "manual" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col gap-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Part Name</label>
                        <input 
                            type="text" placeholder="e.g. Brake Pads" 
                            className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-black transition"
                            value={newPart.partName}
                            onChange={e => setNewPart({...newPart, partName: e.target.value})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                        <input 
                            type="number" placeholder="1" 
                            className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-black transition"
                            value={newPart.qty}
                            onChange={e => setNewPart({...newPart, qty: Number(e.target.value)})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
                        <input 
                            type="number" placeholder="₹ 0" 
                            className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-black transition"
                            value={newPart.price}
                            onChange={e => setNewPart({...newPart, price: Number(e.target.value)})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 justify-end">
                        <button 
                            onClick={addManualPart}
                            className="h-[46px] w-full bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                        >
                            Add to List
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#87a5b3] text-white">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left">S No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left">Part Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Price (₹)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Total (₹)</th>
                {activeTab === "manual" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {parts.length === 0 ? (
                <tr>
                    <td colSpan={activeTab === "manual" ? 6 : 5} className="px-6 py-10 text-center text-gray-400 italic font-medium">
                        No spare parts added yet. {activeTab === "online" ? "Select a booking to load parts." : "Use the form above to add parts manually."}
                    </td>
                </tr>
              ) : parts.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-bold text-gray-600">{i + 1}</td>
                  <td className="px-6 py-4 font-black text-gray-900">{p.partName}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600">{p.qty}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600">₹{p.price}</td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">₹{p.total}</td>
                  {activeTab === "manual" && (
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => removePart(i)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter">Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LABOUR, GST & SUMMARY */}
      {(selectedService || activeTab === "manual") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Labour Charges</label>
                <input
                    type="number"
                    placeholder="₹ 0.00"
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm shadow-sm"
                    value={labour}
                    onChange={(e) => setLabour(e.target.value)}
                />
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Percentage</label>
                <input
                    type="number"
                    placeholder="18%"
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none bg-white font-bold text-sm shadow-sm"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 font-bold text-sm">
            <div className="flex justify-between text-gray-500">
                <span>Parts Total</span>
                <span>₹{partsTotal}</span>
            </div>
            <div className="flex justify-between text-gray-500">
                <span>Labour Charges</span>
                <span>₹{labourAmount}</span>
            </div>
            <div className="flex justify-between text-gray-500">
                <span>GST ({gst}%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between text-xl font-black text-gray-900">
                <span>Grand Total</span>
                <span className="text-emerald-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION */}
      {(selectedService || activeTab === "manual") && (
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            disabled={parts.length === 0}
            onClick={handleGenerateBill}
            className="px-8 py-3 rounded-xl bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
