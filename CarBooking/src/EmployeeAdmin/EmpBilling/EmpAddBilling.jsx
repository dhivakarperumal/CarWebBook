import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
  List
} from "lucide-react";

const EmpAddBilling = () => {
  const navigate = useNavigate();
  const { profileName: userProfile } = useAuth();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState("online"); // 'online' or 'manual'

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState(0); // GST forced to 0 per request

  /* =======================
     FETCH ASSIGNED SERVICES ONLY
  ======================= */
  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        setLoading(true);
        const res = await api.get('/all-services');

        const mechanicName = userProfile?.displayName || "";
        // Filter: Only services assigned to me
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
    if (userProfile?.displayName) fetchMyServices();
  }, [userProfile]);

  /* =======================
     SELECT SERVICE
  ======================= */
  const selectService = async (s) => {
    try {
      setSelectedService(s);

      // Fetch parts from backend for this service
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
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const issueTotal = issues.reduce((sum, i) => sum + i.amount, 0);
  const labourAmount = Number(labour || 0);
  const gst = Number(gstPercent || 0);

  const subTotal = partsTotal + issueTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const grandTotal = subTotal + gstAmount;

  /* =======================
     SAVE BILL
  ======================= */
  const handleGenerateBill = async () => {
    if (!selectedService) {
      toast.error("Please select a vehicle to bill");
      return;
    }

    if (parts.length === 0 && labourAmount === 0) {
      toast.error("Please add parts or labour charges");
      return;
    }

    try {
      const invoiceNo = `INV-EMP-${Date.now()}`;

      const payload = {
        invoiceNo,
        serviceId: selectedService.id,
        bookingId: selectedService.bookingId,
        uid: selectedService.uid,
        customerName: selectedService.name,
        mobileNumber: selectedService.phone,
        car: `${selectedService.brand || ""} ${selectedService.model || ""}`.trim(),
        parts,
        issues,
        partsTotal,
        issueTotal,
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

      toast.success("Job invoice generated for " + selectedService.name);
      navigate("/employee/billing");
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Calculator className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Preparing billing engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Generate Billing Invoice</h1>
            <div className="flex items-center gap-2 pt-1">
              <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase whitespace-nowrap">Invoice No</span>
              <span className="text-blue-600 font-black text-sm uppercase tracking-wider underline underline-offset-4 decoration-2">INV-{Math.floor(100 + Math.random() * 900)}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex gap-1 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setSelectionMode('online')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectionMode === 'online' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Online Booking
          </button>
          <button
            onClick={() => setSelectionMode('manual')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectionMode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT TOOLBOX */}
        <div className="lg:col-span-2 space-y-6">

          {/* ONLINE & MANUAL SELECTION */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Vehicle Verification</h2>
              <div className="sm:hidden flex gap-1 p-1 bg-gray-50 rounded-2xl">
                <button
                  onClick={() => setSelectionMode('online')}
                  className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all ${selectionMode === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Online
                </button>
                <button
                  onClick={() => setSelectionMode('manual')}
                  className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all ${selectionMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  Manual
                </button>
              </div>
            </div>

            {selectionMode === 'online' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  placeholder="Search your assigned cars by name, plate or ID..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            ) : (
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                  onChange={(e) => {
                    const selected = services.find(s => s.id.toString() === e.target.value);
                    if (selected) selectService(selected);
                  }}
                  value={selectedService?.id || ""}
                >
                  <option value="" disabled>Choose a vehicle from list...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.bookingId} - {s.name} ({s.brand} {s.model})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
            )}

            {search && (
              <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                {services
                  .filter((s) =>
                    `${s.bookingId} ${s.name} ${s.phone}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        selectService(s);
                        setSearch("");
                      }}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 border border-gray-100 shadow-sm group-hover:border-blue-200">
                          <Car size={20} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">{s.bookingId}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.name} | {s.brand} {s.model}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                    </div>
                  ))}
                {services.filter(s => `${s.bookingId} ${s.name} ${s.phone}`.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm font-medium">No assigned vehicles found matching your search</div>
                )}
              </div>
            )}
          </div>

          {/* PARTS OVERVIEW */}
          {selectedService && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Logged Spare Parts</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-wider uppercase">
                  {parts.length} Items Added
                </span>
              </div>

              {parts.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-50 bg-gray-50/50">
                  <table className="min-w-full text-left text-[11px] font-bold">
                    <thead>
                      <tr className="text-gray-400 uppercase tracking-widest ">
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right pr-6">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parts.map((p, i) => (
                        <tr key={i} className="text-gray-700">
                          <td className="px-4 py-4">{p.partName}</td>
                          <td className="px-4 py-4 text-center">{p.qty}</td>
                          <td className="px-4 py-4 text-right">₹{p.price}</td>
                          <td className="px-4 py-4 text-right pr-6 text-blue-600 font-black">₹{p.total}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-black text-gray-900">
                        <td className="px-4 py-3" colSpan="3">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right pr-6 text-blue-700">
                          ₹{partsTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-400">No spare parts recorded for this vehicle.</p>
                </div>
              )}

              {issues.length > 0 ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Approved Issues</h2>
                    <span className="text-xs font-bold text-blue-600">{issues.length} items</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-50 bg-gray-50/50">
                    <table className="min-w-full text-left text-[11px] font-bold">
                      <thead>
                        <tr className="text-gray-400 uppercase tracking-widest ">
                          <th className="px-4 py-3">Issue</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {issues.map((issue, i) => (
                          <tr key={i} className="text-gray-700">
                            <td className="px-4 py-4">{issue.issueName}</td>
                            <td className="px-4 py-4 text-right text-blue-600 font-black">₹{issue.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-black text-gray-900">
                          <td className="px-4 py-3">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right text-blue-700">
                            ₹{issueTotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">No approved issue entries available.</div>
              )}
            </div>
          )}

          {/* LABOUR & TAX */}
          {selectedService && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block mb-2">Service Labour Charges (₹)</label>
                <input
                  type="number"
                  placeholder="Enter labour amount..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-gray-700 text-lg"
                  value={labour}
                  onChange={(e) => setLabour(e.target.value)}
                />
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block mb-2">GST Percentage (%)</label>
                <input
                  type="number"
                  placeholder="18"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-gray-700 text-lg"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - SUMMARY */}
        <div className="space-y-6">

          {/* VEHICLE PREVIEW */}
          {selectedService ? (
            <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl shadow-gray-200">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Job Detail</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-black text-lg leading-tight">{selectedService.name}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedService.brand} {selectedService.model}</p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-500">Plate No:</span>
                  <span>{selectedService.vehicleNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-500">Booking ID:</span>
                  <span>{selectedService.bookingId}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-500">Assignment:</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-400" /> {userProfile?.displayName}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-100">
              <Car className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select a car to begin billing</p>
            </div>
          )}

          {/* FINAL TOTALS */}
          {selectedService && (
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 space-y-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-gray-400">Parts Total</span>
                  <span className="text-gray-900 font-black">₹{partsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-gray-400">Issues Total</span>
                  <span className="text-gray-900 font-black">₹{issueTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-gray-400">Labour</span>
                  <span className="text-gray-900 font-black">₹{labourAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-gray-400">GST ({gst}%)</span>
                  <span className="text-gray-900 font-black">₹{gstAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Grand Estimated Total</p>
                <p className="text-4xl font-black text-emerald-600">₹{grandTotal.toLocaleString()}</p>
              </div>

              <button
                onClick={handleGenerateBill}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Generate Final Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpAddBilling;
