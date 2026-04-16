import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaSearch, 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaUser, 
  FaSync,
  FaEdit
} from "react-icons/fa";

const AddBillings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // present when editing
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState("online");
  const [manualCustomer, setManualCustomer] = useState({
    name: "",
    phone: "",
    brand: "",
    model: "",
    regNo: ""
  });

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [loading, setLoading] = useState(true);

  const [newPart, setNewPart] = useState({ partName: "", qty: 1, price: 0 });

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  /* =======================
     LOAD DATA
  ======================= */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [servicesRes, billingsRes, productsRes] = await Promise.all([
          api.get('/all-services'),
          api.get('/billings'),
          api.get('/products')
        ]);
        const filteredServices = servicesRes.data.filter(s => {
          const rawStatus = (s.serviceStatus || s.status || "").toString().trim().toLowerCase();
          if (rawStatus.includes("bill completed") || rawStatus.includes("cancelled")) return false;
          return rawStatus.includes("bill pending") || rawStatus.includes("completed");
        });
        setServices(filteredServices);
        setProducts(productsRes.data || []);

        if (!isEditMode) {
          const nextNum = (billingsRes.data.length + 1).toString().padStart(3, '0');
          setInvoiceNo(`INV-${nextNum}`);
        }
      } catch {
        toast.error("Failed to load initial data");
        if (!isEditMode) setInvoiceNo(`INV-${Date.now()}`);
      } finally {
        if (!isEditMode) setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isEditMode && location.state?.service) {
      setActiveTab("online");
      selectService(location.state.service);
    }
  }, [isEditMode, location.state?.service]);

  /* =======================
     LOAD BILL FOR EDIT
  ======================= */
  useEffect(() => {
    if (!isEditMode) return;

    const loadBill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/billings/${id}`);
        const b = res.data;

        setInvoiceNo(b.invoiceNo || "");
        setLabour(b.labour || "");
        setGstPercent(b.gstPercent || 0);
        setDiscount(b.discount || 0);
        setPaymentStatus(b.paymentStatus || "Pending");

        const loadedParts = (b.parts || []).map(p => ({
          partName: p.partName,
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total: Number(p.total || (Number(p.qty || 0) * Number(p.price || 0))),
        }));
        setParts(loadedParts);

        const loadedIssues = (b.issues || []).map(i => ({
          issueName: i.issueName || i.issue || "",
          amount: Number(i.amount || i.issueAmount || 0),
        }));
        setIssues(loadedIssues);

        // Set manual customer info from bill
        setActiveTab("manual");
        setManualCustomer({
          name: b.customerName || "",
          phone: b.mobileNumber || "",
          brand: (b.car || "").split(" ")[0] || "",
          model: (b.car || "").split(" ").slice(1).join(" ") || "",
          regNo: b.registrationNumber || ""
        });
      } catch {
        toast.error("Failed to load bill for editing");
      } finally {
        setLoading(false);
      }
    };

    loadBill();
  }, [id]);

  /* =======================
     SELECT SERVICE
  ======================= */
  const selectService = async (s) => {
    try {
      setSelectedService(s);
      const res = await api.get(`/all-services/${s.id}`);
      const data = res.data;

      const partsData = (data.parts || []).map((p) => ({
        partName: p.partName,
        qty: Number(p.qty || 0),
        price: Number(p.price || 0),
        total: Number(p.qty || 0) * Number(p.price || 0),
      }));

      const issuesData = (data.issues || [])
        .filter(i => (i.issueStatus || "").toLowerCase() === "approved")
        .map(i => ({
          issueName: i.issue,
          amount: Number(i.issueAmount || 0),
        }));

      setParts(partsData);
      setIssues(issuesData);
    } catch (err) {
      toast.error("Failed to load spare parts");
    }
  };

  /* =======================
     CALCULATIONS
  ======================= */
  const partsTotal = parts.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const issueTotal = issues.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const labourAmount = Number(labour || 0);
  const gst = Number(gstPercent || 0);
  const discountAmount = Number(discount || 0);

  const subTotal = partsTotal + issueTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const grandTotal = subTotal + gstAmount - discountAmount;

  /* =======================
     SAVE BILL
  ======================= */
  const handleGenerateBill = async () => {
    if (!isEditMode && activeTab === "online" && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (!isEditMode && activeTab === "manual" && (!manualCustomer.name || !manualCustomer.phone)) {
      toast.error("Please enter customer name and phone");
      return;
    }

    if (parts.length === 0 && labourAmount === 0) {
      toast.error("No billing items found");
      return;
    }

    try {
      const pathPrefix = location.pathname.startsWith("/employee") ? "/employee" : "/admin";
      const payload = {
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        serviceId: activeTab === "online" && selectedService ? selectedService.id : null,
        bookingId: activeTab === "online" && selectedService ? selectedService.bookingId : `MANUAL-${Date.now()}`,
        uid: activeTab === "online" && selectedService ? selectedService.uid : null,
        customerName: activeTab === "online" && selectedService ? selectedService.name : manualCustomer.name,
        mobileNumber: activeTab === "online" && selectedService ? selectedService.phone : manualCustomer.phone,
        car: activeTab === "online" && selectedService
          ? `${selectedService.brand || ""} ${selectedService.model || ""}`.trim()
          : `${manualCustomer.brand || ""} ${manualCustomer.model || ""}`.trim(),
        registrationNumber: activeTab === "online" && selectedService ? selectedService.registrationNumber : manualCustomer.regNo,
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
        paymentStatus,
        paymentMode: "",
        status: "Generated",
        billingType: activeTab
      };

      if (isEditMode) {
        await api.patch(`/billings/${id}`, payload);
        toast.success("Invoice updated successfully");
      } else {
        await api.post('/billings', payload);
        toast.success("Invoice generated successfully");
      }
      navigate(`${pathPrefix}/billing`);
    } catch (error) {
      toast.error(isEditMode ? "Failed to update invoice" : "Failed to generate invoice");
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

  const removeIssue = (index) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <FaSync className="text-blue-500 animate-spin mb-4 text-4xl" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">
          {isEditMode ? "Loading invoice for editing..." : "Synchronizing billing stack..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fadeIn pb-10">
      
      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {isEditMode && <FaEdit className="text-blue-600" size={22} />}
              {isEditMode ? "Edit Billing Invoice" : "Generate Billing Invoice"}
            </h1>
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

        {/* MODE TOGGLE — hidden in edit mode */}
        {!isEditMode && (
          <div className="flex items-center p-1.5 bg-gray-100 rounded-[1.25rem] border border-gray-200/50 shadow-inner max-w-fit self-start lg:self-center">
            <button 
              onClick={() => { setActiveTab("online"); setSelectedService(null); setParts([]); setIssues([]); }}
              className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'online' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Online Booking
            </button>
            <button 
              onClick={() => { setActiveTab("manual"); setSelectedService(null); setParts([]); setIssues([]); }}
              className={`px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'manual' ? 'bg-white text-black shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Manual Entry
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* WORKSPACE AREA */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* CUSTOMER / SERVICE SELECTION */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden transition-all duration-500">
            <div className="p-8">
               {activeTab === "online" && !isEditMode ? (
                <div className="space-y-6 animate-slideUp">
                  <div className="space-y-2 relative group w-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quick Search & Select Client</label>
                    <div className="relative">
                      <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                      <input
                        placeholder="Search Booking ID / Phone / Customer to Select..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => { if(!search) setSearch(" "); }}
                      />
                    </div>
                    {search && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                        <div className="p-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-50 border-b border-gray-100">Matching Billable Jobs</div>
                        {services
                          .filter(s => `${s.bookingId || `SER-${s.id}`} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || s.registrationNumber || s.carNumber || ""} ${s.car || ""} ${s.assignedEmployeeName || ""}`.toLowerCase().includes(search.toLowerCase().trim()))
                          .map(s => {
                            const st = (s.serviceStatus || s.status || "Completed");
                            const stLow = st.toLowerCase();
                            const stColor = stLow.includes("pending") ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600";
                            return (
                              <div 
                                key={s.id} 
                                onClick={() => { selectService(s); setSearch(""); }}
                                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"
                              >
                                <div>
                                  <p className="font-black text-gray-900">{s.bookingId || `SER-${s.id}`} | {(s.name || "").toUpperCase()}</p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{s.brand} {s.model} - {s.assignedEmployeeName || "Unassigned"}</p>
                                </div>
                                <span className={`text-[9px] px-3 py-1.5 font-black rounded-lg uppercase tracking-widest ${stColor}`}>{st}</span>
                              </div>
                            );
                          })}
                          {services.filter(s => `${s.bookingId || `SER-${s.id}`} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || s.registrationNumber || s.carNumber || ""} ${s.car || ""} ${s.assignedEmployeeName || ""}`.toLowerCase().includes(search.toLowerCase().trim())).length === 0 && (
                            <div className="p-6 text-center text-xs font-bold text-gray-400 italic">No billable jobs found</div>
                          )}
                      </div>
                    )}
                  </div>

                  {selectedService && (
                    <div className="p-6 bg-gray-900 rounded-3xl text-white border border-gray-800 animate-fadeIn shadow-2xl shadow-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Customer Identity</p>
                          <p className="text-sm font-black text-white">{selectedService.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest">{selectedService.phone}</p>
                        </div>
                        <div className="space-y-1 border-l-0 md:border-l border-white/10 md:pl-6">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Vehicle Specification</p>
                          <p className="text-sm font-black text-white uppercase">{selectedService.brand} {selectedService.model}</p>
                          <p className="text-[10px] font-black text-emerald-400 tracking-widest">{selectedService.registrationNumber}</p>
                        </div>
                        <div className="space-y-1 border-l-0 md:border-l border-white/10 md:pl-6">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Operational ID</p>
                          <p className="text-sm font-black text-blue-400">{selectedService.bookingId}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Assigned Service</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-slideUp">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUser className="text-gray-400" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isEditMode ? "Customer Information" : "Walk-in Information"}
                    </h3>
                    {isEditMode && (
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Editing</span>
                    )}
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

          {/* ISSUES TABLE */}
          {issues.length > 0 && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Diagnostic Issues</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Approved service issues included in this invoice</p>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full text-[11px] font-bold">
                  <thead className="bg-indigo-900 text-white uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left font-black">S.No</th>
                      <th className="px-8 py-5 text-left font-black">Issue Description</th>
                      <th className="px-8 py-5 text-right font-black">Amount</th>
                      {isEditMode && <th className="px-8 py-5 text-right font-black">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {issues.map((issue, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-8 py-5 text-gray-400">#{(i + 1).toString().padStart(2, '0')}</td>
                        <td className="px-8 py-5 font-black text-gray-900">{issue.issueName}</td>
                        <td className="px-8 py-5 text-right font-black text-indigo-600">₹{Number(issue.amount).toLocaleString()}</td>
                        {isEditMode && (
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => removeIssue(i)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all">
                              <FaTrash size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SPARE PARTS TABLE */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <div className="mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Spare Parts Inventory</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">List of components used in this service cycle</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col sm:col-span-1">
                  <label className="text-[10px] font-bold text-gray-400 mb-1">Component Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Type or select a spare part..."
                      list="spare-parts-list"
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-black text-black outline-none focus:border-gray-300 transition-all"
                      value={newPart.partName}
                      onChange={e => {
                        const val = e.target.value;
                        const matchedProduct = products.find(p => p.name === val);
                        if (matchedProduct) {
                          setNewPart({ ...newPart, partName: val, price: Number(matchedProduct.offerPrice || matchedProduct.mrp || 0) });
                        } else {
                          setNewPart({ ...newPart, partName: val });
                        }
                      }}
                    />
                    <datalist id="spare-parts-list">
                      {products.map(p => (
                        <option key={p.docId || p.id} value={p.name}>₹{p.offerPrice || p.mrp}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-black text-black outline-none focus:border-gray-300"
                    value={newPart.qty}
                    onChange={e => setNewPart({ ...newPart, qty: e.target.value === '' ? '' : Math.max(1, Number(e.target.value)) })}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-xs shadow-sm font-black text-black outline-none focus:border-gray-300"
                    value={newPart.price}
                    onChange={e => setNewPart({ ...newPart, price: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) })}
                  />
                </div>

                <button
                  onClick={addManualPart}
                  className="bg-black text-white px-4 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20 text-xs font-bold h-fit"
                >
                  <FaPlus className="inline mr-1" /> Add Part
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
                    <th className="px-8 py-5 text-right font-black">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400 grayscale">
                          <FaSync className="text-2xl opacity-20 animate-spin" />
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
                        <td className="px-8 py-5 text-center text-gray-600">₹{Number(p.price).toLocaleString()}</td>
                        <td className="px-8 py-5 text-right font-black text-blue-600 tracking-tight">₹{Number(p.total).toLocaleString()}</td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => removePart(i)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all">
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="space-y-8 h-fit">
          
          

          {/* ACCOUNTING SUMMARY */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 border border-gray-50 flex flex-col gap-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-4">Accounting Summary</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Workforce Charges (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="₹ 0.00"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-black text-lg text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-right shadow-inner"
                value={labour}
                onChange={(e) => setLabour(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Taxation Layer (%)</label>
              <input
                type="number"
                min="0"
                placeholder="18%"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-black text-lg text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-right shadow-inner"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="₹ 0.00"
                className="w-full px-6 py-4 rounded-2xl bg-rose-50/30 border border-rose-100 font-black text-lg text-rose-600 outline-none focus:bg-white focus:ring-4 focus:ring-rose-200/50 transition-all text-right shadow-inner"
                value={discount}
                onChange={(e) => setDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              />
            </div>

            {/* Payment Status (edit mode) */}
            {isEditMode && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-black text-sm text-gray-900 outline-none focus:border-black transition-all cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}

            <div className="mt-4 p-8 bg-black rounded-[2rem] text-white shadow-2xl shadow-black/20 space-y-4">
              <div className="flex justify-between text-[11px] font-black opacity-50 uppercase tracking-widest">
                <span>Parts Total</span>
                <span>₹{partsTotal.toLocaleString()}</span>
              </div>
              {issueTotal > 0 && (
                <div className="flex justify-between text-[11px] font-black opacity-50 uppercase tracking-widest">
                  <span>Issues Total</span>
                  <span>₹{issueTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-black opacity-50 uppercase tracking-widest">
                <span>Tax Allocation</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] font-black text-rose-400 uppercase tracking-widest">
                  <span>Discount</span>
                  <span>- ₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-4" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Grand Payable Total</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGenerateBill}
                disabled={parts.length === 0 && labourAmount === 0}
                className="group w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:active:scale-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none border border-transparent disabled:border-gray-200 bg-gradient-to-r from-black to-slate-800 hover:from-black hover:to-black shadow-black/20"
              >
                {isEditMode ? <FaEdit className="group-hover:scale-110 transition-transform" /> : <FaSave className="group-hover:scale-110 transition-transform" />}
                {isEditMode ? "Update Bill" : "Save Bill"}
              </button>
              
              <button
                onClick={() => navigate(-1)}
                className="w-full py-5 rounded-2xl bg-white border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-[0.98]"
              >
                Cancel Operation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- COMPONENTS ----- */
const InputField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
    <input 
      type="text" 
      placeholder={placeholder}
      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-white font-black text-sm text-black outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all shadow-sm"
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
