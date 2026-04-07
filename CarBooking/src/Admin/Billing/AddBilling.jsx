import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaSearch, 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaUser, 
  FaSync 
} from "react-icons/fa";

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
  const [invoiceNo, setInvoiceNo] = useState("");

  // For Manual Parts Entry
  const [newPart, setNewPart] = useState({ partName: "", qty: 1, price: 0 });

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(0);

  /* =======================
     FETCH SERVICES
  ======================= */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [servicesRes, billingsRes] = await Promise.all([
          api.get('/all-services'),
          api.get('/billings')
        ]);
        setServices(servicesRes.data);
        
        // Calculate next invoice number
        const nextNum = (billingsRes.data.length + 1).toString().padStart(3, '0');
        setInvoiceNo(`INV-${nextNum}`);
      } catch {
        toast.error("Failed to load initial data");
        setInvoiceNo(`INV-${Date.now()}`);
      }
    };
    loadInitialData();
  }, []);

  /* =======================
     SELECT SERVICE
  ======================= */
  const selectService = async (s) => {
    try {
      setSelectedService(s);
      
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
      const payload = {
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
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

      toast.success("Invoice generated successfully");
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-10">
      
      {/* 🚀 TOP NAVIGATION & HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Generate Billing Invoice</h1>
            <div className="flex items-center gap-3">
              <span className="bg-black text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-widest uppercase shadow-lg shadow-black/20">Invoice No</span>
              <div className="relative group">
                <input 
                  type="text" 
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="bg-transparent border-b-2 border-gray-100 group-focus-within:border-blue-500 outline-none font-black text-lg text-blue-600 transition-all px-1 min-w-[120px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 🎚️ MODE TOGGLE */}
        <div className="flex items-center p-1.5 bg-gray-100 rounded-[1.25rem] border border-gray-200/50 shadow-inner max-w-fit self-start lg:self-center">
          <button 
            onClick={() => { setActiveTab("online"); setSelectedService(null); setParts([]); }}
            className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'online' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Online Booking
          </button>
          <button 
            onClick={() => { setActiveTab("manual"); setSelectedService(null); setParts([]); }}
            className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'manual' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 🛠️ WORKSPACE AREA */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SELECTION WORKFLOW */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden transition-all duration-500">
            <div className="p-8">
              {activeTab === "online" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quick Search</label>
                    <div className="relative group">
                      <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                      <input
                        placeholder="Search Booking ID / Phone / Customer..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Verification Queue</label>
                    <select
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-black text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all cursor-pointer appearance-none shadow-sm"
                      value={selectedService?.id || ""}
                      onChange={(e) => {
                        const s = services.find(srv => String(srv.id) === String(e.target.value));
                        if (s) selectService(s);
                        else { setSelectedService(null); setParts([]); }
                      }}
                    >
                      <option value="" className="text-gray-400 italic">-- Select Assigned Job --</option>
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
                <div className="space-y-6 animate-slideUp">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUser className="text-gray-400" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Walk-in Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Customer Name" value={manualCustomer.name} onChange={v => setManualCustomer({...manualCustomer, name: v})} placeholder="Enter Customer Full Name" />
                    <InputField label="Contact Number" value={manualCustomer.phone} onChange={v => setManualCustomer({...manualCustomer, phone: v})} placeholder="Ex: +91 98765 43210" />
                    <InputField label="Vehicle Brand" value={manualCustomer.brand} onChange={v => setManualCustomer({...manualCustomer, brand: v})} placeholder="Ex: Honda Motors" />
                    <InputField label="Vehicle Model" value={manualCustomer.model} onChange={v => setManualCustomer({...manualCustomer, model: v})} placeholder="Ex: Unicorn 160 BS6" />
                    <InputField label="Plate Number" value={manualCustomer.regNo} onChange={v => setManualCustomer({...manualCustomer, regNo: v})} placeholder="Ex: MH-12-XX-1234" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 📦 INVENTORY MANAGEMENT */}
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
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 mb-1">
        Component Name
      </label>
      <input
        type="text"
        placeholder="Enter part name"
        className="border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-semibold outline-none focus:border-gray-300"
        value={newPart.partName}
        onChange={e => setNewPart({ ...newPart, partName: e.target.value })}
      />
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
                    {activeTab === "manual" && <th className="px-8 py-5 text-right font-black">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "manual" ? 6 : 5} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400 grayscale">
                          <FaSync className="text-2xl animate-spin-slow opacity-20" />
                          <p className="uppercase tracking-[0.2em] font-black italic">Awaiting Inventory Log...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    parts.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-8 py-5 text-gray-400">#{(i+1).toString().padStart(2, '0')}</td>
                        <td className="px-8 py-5 font-black uppercase text-gray-900">{p.partName}</td>
                        <td className="px-8 py-5 text-center">{p.qty}</td>
                        <td className="px-8 py-5 text-center text-gray-600">₹{p.price.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right font-black text-blue-600 tracking-tight">₹{p.total.toLocaleString()}</td>
                        {activeTab === "manual" && (
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => removePart(i)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all">
                              <FaTrash size={12} />
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

        {/* 💳 SUMMARY SIDEBAR */}
        <div className="space-y-8 h-fit">
          
          {activeTab === "online" ? (
            selectedService ? (
              <div className="bg-black p-8 text-white rounded-[2.5rem] shadow-2xl shadow-black/20 animate-slideDown">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Service Overview</h2>
                <div className="grid grid-cols-2 gap-y-6">
                  <MetricBox label="Customer" val={selectedService.name} />
                  <MetricBox label="Contact" val={selectedService.phone} />
                  <MetricBox label="Vehicle" val={`${selectedService.brand} ${selectedService.model}`} />
                  <MetricBox label="Ref ID" val={selectedService.bookingId} />
                </div>
              </div>
            ) : null
          ) : (
            <div className="bg-black p-8 text-white rounded-[2.5rem] shadow-2xl shadow-black/20 animate-slideDown">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Walk-in Overview</h2>
              <div className="grid grid-cols-2 gap-y-6">
                <MetricBox label="Customer" val={manualCustomer.name || "NEW"} />
                <MetricBox label="Contact" val={manualCustomer.phone || "---"} />
                <MetricBox label="Reg No" val={manualCustomer.regNo || "---"} />
                <MetricBox label="Brand" val={manualCustomer.brand || "MANUAL"} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 border border-gray-50 flex flex-col gap-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-4">Accounting Summary</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Workforce Charges (₹)</label>
              <input
                type="number"
                placeholder="₹ 0.00"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-black text-lg text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-right shadow-inner"
                value={labour}
                onChange={(e) => setLabour(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Taxation Layer (%)</label>
              <input
                type="number"
                placeholder="18%"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-black text-lg text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-right shadow-inner"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
              />
            </div>

            <div className="mt-4 p-8 bg-black rounded-[2rem] text-white shadow-2xl shadow-black/20 space-y-4">
              <div className="flex justify-between text-[11px] font-black opacity-50 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black opacity-50 uppercase tracking-widest">
                <span>Tax Allocation</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Grand Payable Total</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateBill}
              disabled={parts.length === 0}
              className="group w-full py-6 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-black/30 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaSave className="group-hover:scale-110 transition-transform" />
              Commit Invoice
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
            >
              Cancel Operation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- 🛰️ COMPONENTS ----- */
const InputField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
    <input 
      type="text" 
      placeholder={placeholder}
      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-white font-bold text-sm text-gray-800 outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all shadow-sm"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const MetricBox = ({ label, val }) => (
  <div className="space-y-1 group">
    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">{label}</p>
    <p className="font-black text-sm uppercase tracking-tight">{val || "---"}</p>
  </div>
);

export default AddBillings;
