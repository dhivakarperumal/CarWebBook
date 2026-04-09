import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  ChevronLeft,
  Search,
  FileText,
  Calculator,
  Car,
  User,
  ShieldCheck,
  Package,
  ArrowRight,
  List,
  Plus,
  Trash,
  RotateCcw
} from "lucide-react";

const EmpAddBilling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName: userProfile } = useAuth();

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState("online"); // 'online' or 'manual'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);

  const [manualCustomer, setManualCustomer] = useState({
    name: "",
    phone: "",
    brand: "",
    model: "",
    regNo: ""
  });

  const [newPart, setNewPart] = useState({ partName: "", qty: 1, price: 0 });

  const [generatedInv, setGeneratedInv] = useState("");
  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(0); 
  const [discount, setDiscount] = useState(0);

  /* =======================
     FETCH ASSIGNED SERVICES ONLY
  ======================= */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [res, prodRes, billCountRes] = await Promise.all([
          api.get('/all-services'),
          api.get('/products'),
          api.get('/billings')
        ]);

        setProducts(prodRes.data || []);
        const nextIdx = (billCountRes.data?.length || 0) + 1;
        setGeneratedInv(`INV${String(nextIdx).padStart(3, '0')}`);
        
        const mechanicName = userProfile?.displayName || "";
        const myServices = res.data.filter(s => {
          const assignedMatch = (s.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase();
          const status = (s.serviceStatus || s.status || "").toString().trim();
          const isBillPending = status.toLowerCase() === "bill pending";
          return assignedMatch && isBillPending;
        });

        setServices(myServices);
      } catch (err) {
        toast.error("Failed to load your assigned services");
      } finally {
        setLoading(false);
      }
    };
    if (userProfile?.displayName) fetchInitialData();
  }, [userProfile]);

  /* =======================
     HANDLE NAVIGATION STATE
  ======================= */
  useEffect(() => {
    const initializeFromState = async () => {
      if (location.state?.service && !isEditMode) {
        setSelectionMode("online");
        selectService(location.state.service);
      }
      if (location.state?.editBill && !editingBillId) {
        try {
          setLoading(true);
          const res = await api.get(`/billings/${location.state.editBill.id}`);
          const b = res.data;
          
          setIsEditMode(true);
          setEditingBillId(b.id);
          setGeneratedInv(b.invoiceNo);
          setLabour(b.labour || "");
          setGstPercent(b.gstPercent || 0);
          setParts((b.parts || []).map(p => ({
            ...p,
            qty: Number(p.qty || 0),
            price: Number(p.price || 0),
            total: Number(p.total || (Number(p.qty || 0) * Number(p.price || 0)))
          })));
          setIssues((b.issues || []).map(i => ({
            ...i,
            amount: Number(i.amount || 0)
          })));
          setManualCustomer({
            name: b.customerName || "",
            phone: b.mobileNumber || "",
            brand: (b.car || "").split(" ")[0] || "",
            model: (b.car || "").split(" ").slice(1).join(" ") || "",
            regNo: b.carNumber || ""
          });
          setSelectionMode("manual");
        } catch (err) {
          toast.error("Failed to load original bill details");
        } finally {
          setLoading(false);
        }
      }
    };
    initializeFromState();
  }, [location.state]);
  const selectService = async (s) => {
    try {
      setSelectedService(s);

      const res = await api.get(`/all-services/${s.id}`);
      const data = res.data;

      const partsData = (data.parts || [])
        .filter((p) => (p.status || "").toLowerCase() === "approved")
        .map((p) => ({
          partName: p.partName,
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total: Number(p.qty || 0) * Number(p.price || 0),
        }));

      const issuesData = (data.issues || [])
        .filter((i) => (i.issueStatus || "").toLowerCase() === "approved")
        .map((i) => ({
          issueName: i.issue,
          amount: Number(i.issueAmount || 0),
        }));

      setParts(partsData);
      setIssues(issuesData);
    } catch (err) {
      toast.error("Failed to load spare parts for this vehicle");
    }
  };

   /* =======================
      CALCULATIONS
   ======================= */
   const partsTotal = parts.reduce((sum, p) => Number(sum) + Number(p.total || 0), 0);
   const issueTotal = issues.reduce((sum, i) => Number(sum) + Number(i.amount || 0), 0);
   const labourAmount = Number(labour || 0);
   const gst = Number(gstPercent || 0);

  const subTotal = partsTotal + issueTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const discountAmount = Number(discount || 0);
  const grandTotal = (subTotal + gstAmount) - discountAmount;

  /* =======================
     MANUAL HANDLING
  ======================= */
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
     SAVE BILL
  ======================= */
  const handleGenerateBill = async () => {
    if (selectionMode === "online" && !selectedService) {
      toast.error("Please select a vehicle to bill");
      return;
    }

    if (selectionMode === "manual" && (!manualCustomer.name || !manualCustomer.phone)) {
      toast.error("Please enter walk-in customer details");
      return;
    }

    if (parts.length === 0 && labourAmount === 0) {
      toast.error("No billing items recorded");
      return;
    }

    try {
      const invoiceNo = generatedInv;

      const payload = {
        invoiceNo,
        serviceId: selectionMode === "online" ? selectedService.id : null,
        bookingId: selectionMode === "online" ? selectedService.bookingId : `WALKIN-${Date.now()}`,
        uid: selectionMode === "online" ? selectedService.uid : null,
        customerName: selectionMode === "online" ? selectedService.name : manualCustomer.name,
        mobileNumber: selectionMode === "online" ? selectedService.phone : manualCustomer.phone,
        car: selectionMode === "online" 
          ? `${selectedService.brand || ""} ${selectedService.model || ""}`.trim()
          : `${manualCustomer.brand || ""} ${manualCustomer.model || ""}`.trim(),
        parts,
        issues,
        partsTotal,
        issueTotal,
        labour: labourAmount,
        gstPercent: gst,
        gstAmount,
        discount: discountAmount,
        subTotal,
        grandTotal,
        paymentStatus: "Pending",
        paymentMode: "",
        status: "Generated",
        billingType: selectionMode
      };

      if (isEditMode) {
        await api.patch(`/billings/${editingBillId}`, payload);
        toast.success("Job invoice successfully updated");
      } else {
        await api.post('/billings', payload);
        toast.success("Job invoice successfully pushed");
      }
      navigate("/employee/billing");
    } catch (error) {
      toast.error(isEditMode ? "Failed to update invoice" : "Failed to push invoice to system");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Calculator className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Synchronizing billing stack...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-fadeIn">

      {/* 🚀 PREMIUM HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{isEditMode ? "Update Billing Invoice" : "Generate Billing Invoice"}</h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="bg-black text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-widest uppercase shadow-lg shadow-black/20">Invoice No</span>
              <span className="text-blue-600 font-black text-sm uppercase tracking-wider underline underline-offset-4 decoration-2">{generatedInv}</span>
            </div>
          </div>
        </div>

        {/* 🎚️ MODE TOGGLE */}
        <div className={`flex items-center p-1.5 bg-gray-100 rounded-[1.25rem] border border-gray-200/50 shadow-inner max-w-fit self-start md:self-center ${isEditMode ? "opacity-50 pointer-events-none" : ""}`}>
          <button
            onClick={() => { setSelectionMode('online'); setSelectedService(null); setParts([]); setIssues([]); }}
            className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectionMode === 'online' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Online Booking
          </button>
          <button
            onClick={() => { setSelectionMode('manual'); setSelectedService(null); setParts([]); setIssues([]); }}
            className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectionMode === 'manual' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 🛠️ LEFT WORKSPACE */}
        <div className="lg:col-span-2 space-y-8">

          {/* VEHICLE VERIFICATION CARD */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Vehicle Verification</h2>
              </div>

              {selectionMode === 'online' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quick Search</label>
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors w-5 h-5" />
                      <input
                        placeholder="Search Booking ID / Plate / Name..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Verified Assigned Jobs</label>
                    <select
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-black text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all cursor-pointer appearance-none shadow-sm"
                      value={selectedService?.id || ""}
                      onChange={(e) => {
                        const s = services.find(srv => String(srv.id) === String(e.target.value));
                        if (s) selectService(s);
                        else setSelectedService(null);
                      }}
                    >
                      <option value="" className="text-gray-400 italic">-- Select Verified Job --</option>
                      {services
                        .filter(s => `${s.bookingId} ${s.name} ${s.phone} ${s.brand} ${s.model}`.toLowerCase().includes(search.toLowerCase()))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.bookingId} | {s.name.toUpperCase()}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                  <InputField label="Customer Name" value={manualCustomer.name} onChange={v => setManualCustomer({ ...manualCustomer, name: v })} placeholder="Enter Customer Full Name" />
                  <InputField label="Contact Number" value={manualCustomer.phone} onChange={v => setManualCustomer({ ...manualCustomer, phone: v })} placeholder="Ex: +91 98765 43210" />
                  <InputField label="Vehicle Brand" value={manualCustomer.brand} onChange={v => setManualCustomer({ ...manualCustomer, brand: v })} placeholder="Ex: Honda Motors" />
                  <InputField label="Vehicle Model" value={manualCustomer.model} onChange={v => setManualCustomer({ ...manualCustomer, model: v })} placeholder="Ex: Unicorn 160 BS6" />
                  <InputField label="Plate Number" value={manualCustomer.regNo} onChange={v => setManualCustomer({ ...manualCustomer, regNo: v })} placeholder="Ex: MH-12-XX-1234" Icon={ShieldCheck} />
                </div>
              )}
            </div>

            {/* QUICK PREVIEW STRIP */}
            {selectedService && selectionMode === "online" && (
              <div className="bg-black p-8 text-white grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/5 animate-slideDown">
                <MetricBox label="Technician" val={userProfile?.displayName} />
                <MetricBox label="Reference" val={selectedService.bookingId} />
                <MetricBox label="Job Status" val="Awaiting Sync" />
                <MetricBox label="Plate" val={selectedService.vehicleNumber || "N/A"} />
              </div>
            )}
          </div>

          {/* 📦 INVENTORY MANAGEMENT CARD */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                        <div className="p-8 border-b border-gray-50">
  
  {/* Header */}
  <div className="mb-4">
    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
      Spare Parts Inventory
    </h3>
    <p className="text-[10px] text-gray-400 mt-1 font-bold">
      List of components used in this service cycle
    </p>
  </div>

  {/* Inputs */}
  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">

    {/* Part Name */}
    <div className="flex flex-col sm:col-span-1">
      <label className="text-[10px] font-bold text-gray-400 mb-1">
        Component Name (Search or Type)
      </label>
      <div className="relative group">
        <input
          type="text"
          placeholder="Type or select a spare part..."
          list="spare-parts-list-emp"
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-semibold outline-none focus:border-gray-300 transition-all"
          value={newPart.partName}
          onChange={e => {
            const val = e.target.value;
            const matchedProduct = products.find(p => p.name === val);
            if (matchedProduct) {
              setNewPart({
                ...newPart,
                partName: val,
                price: Number(matchedProduct.offerPrice || matchedProduct.mrp || 0)
              });
            } else {
              setNewPart({ ...newPart, partName: val });
            }
          }}
        />
        <datalist id="spare-parts-list-emp">
          {products.map(p => (
            <option key={p.docId || p.id} value={p.name}>
              ₹{p.offerPrice || p.mrp}
            </option>
          ))}
        </datalist>
      </div>
    </div>

    {/* Quantity */}
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 mb-1">
        Quantity
      </label>
      <input
        type="number"
        placeholder="Qty"
        className="border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-semibold outline-none focus:border-gray-300"
        value={newPart.qty}
        onChange={e => setNewPart({ ...newPart, qty: Number(e.target.value) })}
      />
    </div>

    {/* Price */}
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 mb-1">
        Unit Price (₹)
      </label>
      <input
        type="number"
        placeholder="₹"
        className="border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-semibold outline-none focus:border-gray-300"
        value={newPart.price}
        onChange={e => setNewPart({ ...newPart, price: Number(e.target.value) })}
      />
    </div>

    {/* Button */}
    <button
      onClick={addManualPart}
      className="bg-black text-white px-4 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20 text-xs font-bold h-fit"
    >
      + Add Part
    </button>

  </div>
</div>

            <div className="overflow-hidden">
              <table className="min-w-full text-[11px] font-bold">
                <thead className="bg-black text-white uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left font-black">S.No</th>
                    <th className="px-8 py-5 text-left font-black">Description</th>
                    <th className="px-8 py-5 text-center font-black">Quantity</th>
                    <th className="px-8 py-5 text-center font-black">Unit Price</th>
                    <th className="px-8 py-5 text-right font-black">Subtotal</th>
                    {selectionMode === "manual" && <th className="px-8 py-5 text-right font-black">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={selectionMode === "manual" ? 6 : 5} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400 grayscale opacity-40">
                          <RotateCcw className="text-2xl animate-spin-slow" />
                          <p className="uppercase tracking-[0.2em] font-black italic">Awaiting Inventory Log...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    parts.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-8 py-5 text-gray-400">#{(i + 1).toString().padStart(2, '0')}</td>
                        <td className="px-8 py-5 font-black uppercase text-gray-900">{p.partName}</td>
                        <td className="px-8 py-5 text-center">{p.qty}</td>
                        <td className="px-8 py-5 text-center text-gray-600">₹{p.price.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right font-black text-blue-600 tracking-tight">₹{p.total.toLocaleString()}</td>
                        {selectionMode === "manual" && (
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => removePart(i)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm">
                              <Trash size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 💳 ACCOUNTING SIDEBAR */}
        <div className="space-y-8 h-fit">

          {/* FINANCIAL SUMMARY CARD */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-8 transition-all hover:shadow-md">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reconciliation</h3>

            <div className="space-y-4">
              <CompactInput label="Service Workforce" value={labour} onChange={setLabour} suffix="₹" />
              <CompactInput label="Tax Variable" value={gstPercent} onChange={setGstPercent} suffix="%" />
              <CompactInput label="Loyalty Discount" value={discount} onChange={setDiscount} suffix="₹" highlight />
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Inventory Sum</span>
                <span>₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Tax Allocation</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-rose-500 uppercase tracking-widest">
                <span>Applied Discount</span>
                <span>- ₹{discountAmount.toLocaleString()}</span>
              </div>
              
              <div className="bg-gray-900 rounded-2xl p-6 mt-6 flex flex-col gap-1 shadow-xl shadow-black/10">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Grand Final Total</span>
                <span className="text-3xl font-black text-white tracking-tighter">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateBill}
              disabled={parts.length === 0 && labourAmount === 0}
              className="w-full py-5 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-[11px] transition-all hover:bg-gray-800 active:scale-95 shadow-xl shadow-black/5 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <FileText className="group-hover:scale-110 transition-transform" />
              Save Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- 🛰️ HIGH-FIDELITY COMPONENTS ----- */
const InputField = ({ label, value, onChange, placeholder, Icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors w-4 h-4" />}
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-14' : 'px-6'} pr-6 py-4.5 rounded-2xl border border-gray-100 bg-white font-black text-sm text-gray-800 outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all shadow-sm`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

const MetricBox = ({ label, val }) => (
  <div className="space-y-1 group">
    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] group-hover:text-blue-400 transition-colors">{label}</p>
    <p className="font-black text-sm uppercase tracking-tight">{val || "---"}</p>
  </div>
);

const CompactInput = ({ label, value, onChange, suffix, highlight }) => (
  <div className="group relative">
    <label className={`text-[8px] font-black uppercase tracking-widest ml-1 absolute transform -translate-y-1/2 top-0 left-3 bg-white px-2 z-10 ${highlight ? 'text-rose-500' : 'text-gray-400'}`}>{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-5 py-4 rounded-xl border font-black text-sm outline-none transition-all text-right pr-12 ${highlight ? 'bg-rose-50/20 border-rose-100 text-rose-600 focus:border-rose-300' : 'bg-white border-gray-100 text-gray-900 focus:border-black'}`}
      />
      <span className={`absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase opacity-40 ${highlight ? 'text-rose-500' : 'text-gray-400'}`}>{suffix}</span>
    </div>
  </div>
);

const SummaryItem = ({ label, val }) => (
  <div className="flex justify-between items-center text-[11px] font-black">
    <span className="text-gray-500 uppercase tracking-widest">{label}:</span>
    <span className="text-white tracking-widest uppercase">{val}</span>
  </div>
);

export default EmpAddBilling;
