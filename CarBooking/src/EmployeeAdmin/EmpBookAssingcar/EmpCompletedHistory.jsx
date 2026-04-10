import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Search, 
  Filter, 
  Car, 
  User, 
  Phone, 
  Clock,
  LayoutGrid,
  List,
  IndianRupee,
  Eye,
  Wrench,
  Package,
  X,
  Plus,
  Printer
} from "lucide-react";
import { FaWrench, FaCogs, FaTimes } from "react-icons/fa";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 8;

const EmpCompletedHistory = () => {
  const { profileName: userProfile, cachedData, updateCache } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(!cachedData.history);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("issues");
  const [issueEntries, setIssueEntries] = useState([]);
  const [partsEntries, setPartsEntries] = useState([]);

  useEffect(() => {
    if (cachedData.history) {
      setServices(cachedData.history);
    }
    fetchCompletedServices(!!cachedData.history);
  }, [userProfile]);

  const fetchCompletedServices = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [servRes, billRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/billings")
      ]);
      
      const mechanicName = (userProfile?.displayName || "").toLowerCase();
      const billings = billRes.data || [];
      const billMap = {};

      billings.forEach(b => {
        // Create multiple entries for a single bill to increase hit rate
        const keys = [
          b.bookingId, 
          b.appointmentId, 
          b.serviceId, 
          b.jobId,
          b.id
        ].filter(Boolean).map(k => k.toString());
        
        const amount = b.grandTotal || b.totalAmount || b.total_amount || 0;
        keys.forEach(k => { billMap[k] = amount; });
      });

      const filtered = (servRes.data || []).filter(s => {
          const isMine = (s.assignedEmployeeName || "").toLowerCase() === mechanicName;
          const sStat = (s.serviceStatus || s.status || "").toLowerCase();
          const isDone = sStat === "bill completed";
          return isMine && isDone;
      }).map(s => {
        // Try to find the bill amount using all available IDs
        const possibleIds = [
          s.id, 
          s.bookingId, 
          s.appointmentId, 
          s.serviceId
        ].filter(Boolean).map(id => id.toString());
        
        let foundAmount = 0;
        for (let id of possibleIds) {
          if (billMap[id] !== undefined) {
            foundAmount = billMap[id];
            break;
          }
        }

        return {
          ...s,
          grandTotal: foundAmount
        };
      });
      
      setServices(filtered);
      updateCache("history", filtered);
    } catch (err) {
      if (!isSilent) toast.error("Failed to load completed services");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (item) => {
    const printWindow = window.open("", "_blank");
    const issues = item.issues || [];
    const parts = item.parts || [];
    
    const html = `
      <html>
        <head>
          <title>Service Protocol - ${item.bookingId || item.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; pb: 20px; mb: 30px; }
            .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
            .meta { text-align: right; font-size: 12px; font-weight: bold; color: #666; }
            
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #10b981; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .info-box p { margin: 2px 0; font-size: 13px; }
            .info-box strong { font-size: 10px; text-transform: uppercase; color: #999; display: block; margin-bottom: 4px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; font-size: 10px; text-transform: uppercase; padding: 12px; background: #f9fafb; border-bottom: 1px solid #eee; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; font-weight: 500; }
            
            .total-row { display: flex; justify-content: flex-end; gap: 40px; padding-top: 20px; }
            .total-item { text-align: right; }
            .total-item strong { display: block; font-size: 10px; color: #999; text-transform: uppercase; }
            .total-item span { font-size: 18px; font-weight: 900; color: #10b981; }

            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TECHNICAL SERVICE PROTOCOL</div>
            <div class="meta">
              <p>Generated: ${new Date().toLocaleDateString()}</p>
              <p>Record ID: ${item.bookingId || item.id}</p>
            </div>
          </div>

          <div class="section-title">Logistics & Intelligence</div>
          <div class="info-grid">
            <div class="info-box">
              <strong>Client Profile</strong>
              <p>${item.name || "Walk-in Customer"}</p>
              <p>${item.phone || "N/A"}</p>
            </div>
            <div class="info-box">
              <strong>Vehicle Specification</strong>
              <p>${item.brand} ${item.model}</p>
              <p>${item.vehicleNumber || "Registry Missing"}</p>
            </div>
            <div class="info-box">
              <strong>Mechanic Assigned</strong>
              <p>${item.assignedEmployeeName || "Service Team"}</p>
              <p>Completed: ${new Date(item.updatedAt || item.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="section-title">Diagnostic Manifest</div>
          <table>
            <thead>
              <tr>
                <th>Workflow Entry</th>
                <th style="text-align: right">Operational Cost</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(iss => `
                <tr>
                  <td>${iss.issue}</td>
                  <td style="text-align: right">₹${iss.issueAmount || 0}</td>
                </tr>
              `).join('')}
              ${issues.length === 0 ? '<tr><td colspan="2">No individual logs recorded</td></tr>' : ''}
            </tbody>
          </table>

          <div class="section-title">Spare Part Inventory Utilized</div>
          <table>
            <thead>
              <tr>
                <th>Component Identifier</th>
                <th>Quantity</th>
                <th style="text-align: right">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              ${parts.map(p => `
                <tr>
                  <td>${p.partName}</td>
                  <td>${p.qty}</td>
                  <td style="text-align: right">₹${p.price || 0}</td>
                </tr>
              `).join('')}
              ${parts.length === 0 ? '<tr><td colspan="3">No spare parts utilized</td></tr>' : ''}
            </tbody>
          </table>

          <div class="total-row">
            <div class="total-item">
              <strong>Net Service Value</strong>
              <span>₹${Number(item.grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredServices = useMemo(() => {
    return services.filter(item => {
      // Search Filter
      const text = search.toLowerCase();
      const matchesSearch = 
        (item.brand + " " + item.model).toLowerCase().includes(text) ||
        (item.vehicleNumber || item.vehicle_number || "").toLowerCase().includes(text) ||
        (item.name || item.customer_name || "").toLowerCase().includes(text) ||
        (item.bookingId || item.id + "").includes(text);

      // Date Filter
      let matchesDate = true;
      const bDateStr = item.created_at || item.createdAt;
      if (dateFilter !== "all" && bDateStr) {
        const bDate = new Date(bDateStr);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (dateFilter === "today") {
          matchesDate = bDate.toDateString() === today.toDateString();
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          matchesDate = bDate.toDateString() === yesterday.toDateString();
        } else if (dateFilter === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          matchesDate = bDate >= lastWeek;
        } else if (dateFilter === "month") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = bDate >= lastMonth;
        } else if (dateFilter === "custom") {
          const start = dateRange.start ? new Date(dateRange.start) : null;
          const end = dateRange.end ? new Date(dateRange.end) : null;
          if (end) end.setHours(23, 59, 59, 999);
          if (start && end) {
            matchesDate = bDate >= start && bDate <= end;
          } else if (start) {
            matchesDate = bDate >= start;
          } else if (end) {
            matchesDate = bDate <= end;
          }
        }
      } else if (dateFilter !== "all" && !bDateStr) {
        matchesDate = false;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [services, search, dateFilter, dateRange]);

  const handleViewDetails = async (item) => {
    try {
      const res = await api.get(`/all-services/${item.id}`);
      const fullData = res.data;
      setSelectedServiceDetail(fullData);
      setIssueEntries(fullData.issues || []);
      setPartsEntries(fullData.parts || []);
      setActiveModalTab("issues");
      setIssueModalVisible(true);
    } catch (err) {
      toast.error("Failed to load service details");
    }
  };

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // removed loading block for instant dashboard access

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 leading-none uppercase tracking-tight">Completed History</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2 block">Archive of finalized technical service protocols</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100">
            <div className="text-right">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Total Archived</p>
                <p className="text-3xl font-black text-emerald-600">{services.length}</p>
            </div>
            <div className="w-px h-10 bg-emerald-200/50 mx-2" />
            <LayoutGrid size={24} className="text-emerald-300" />
        </div>
      </div>

      {/* SEARCH & TOGGLE */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search finalized orders..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-15 pr-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full md:w-64">
               <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <select
                 value={dateFilter}
                 onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                 className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/5 shadow-sm"
               >
                 <option value="all">All Time History</option>
                 <option value="today">Today's Completed</option>
                 <option value="yesterday">Yesterday's Jobs</option>
                 <option value="week">Past Week</option>
                 <option value="month">Past Month</option>
                 <option value="custom">Custom Archive Range</option>
               </select>
            </div>

            <div className="flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200 w-full md:w-fit shrink-0">
               <button onClick={() => setViewMode("table")} className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === "table" ? "bg-white text-emerald-600 shadow-md" : "text-gray-400"}`}><List size={16}/> Table</button>
               <button onClick={() => setViewMode("card")} className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === "card" ? "bg-white text-emerald-600 shadow-md" : "text-gray-400"}`}><LayoutGrid size={16}/> Cards</button>
            </div>
          </div>
        </div>

        {dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-4 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 animate-fadeIn">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Archive Start</label>
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Archive End</label>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        )}
      </div>

      {/* DATA */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-lg p-24 text-center border-2 border-dashed border-gray-100">
           <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No completed protocols found in archive</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#020617] text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Job ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Client</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Vehicle Spec</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-center">Completion Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-emerald-300">Final Bill</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedServices.map((item, index) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-8 py-6 text-xs font-black text-gray-400">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td className="px-8 py-6 text-xs font-black text-gray-400">#{item.bookingId || item.id}</td>
                  <td className="px-8 py-6 font-black text-gray-800">{item.name || item.customer_name}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900 uppercase">{item.brand} {item.model}</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.vehicleNumber || item.vehicle_number || "Registry Missing"}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Completed</span>
                  </td>
                  <td className="px-8 py-6 ">
                    <p className="text-xs font-black text-gray-500 flex items-center justify-start gap-2"><Clock size={12}/> {new Date(item.updatedAt || item.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-sm font-black text-emerald-600">₹{Number(item.grandTotal || item.billAmount || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(item)}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        title="View Full Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handlePrint(item)}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        title="Print Protocol"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedServices.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all border-b-4 border-b-emerald-500">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest"># {item.bookingId || item.id}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={16}/></div>
               </div>
               <h3 className="text-lg font-black text-gray-800 uppercase leading-tight mb-1">{item.brand} {item.model}</h3>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">{item.vehicleNumber || "NO PLATE"}</p>
               
               <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-3"><User size={14} className="text-gray-400"/><span className="text-xs font-bold text-gray-600">{item.name || item.customer_name}</span></div>
                  <div className="flex items-center gap-3"><Clock size={14} className="text-gray-400"/><span className="text-xs font-bold text-gray-600">{new Date(item.updatedAt || item.created_at).toLocaleDateString()}</span></div>
               </div>

               <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Status</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Completed</span>
               </div>
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* SERVICE DETAIL MODAL */}
      {issueModalVisible && selectedServiceDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            <div className="bg-black p-10 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FaWrench size={100} className="text-white"/></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <FaWrench className="text-emerald-400 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Service Protocol Record</h2>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 opacity-80">Finalized Technical Diagnostic History</p>
                  </div>
                </div>
                <button onClick={() => setIssueModalVisible(false)} className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-all backdrop-blur-sm border border-white/10"><X size={20}/></button>
              </div>
            </div>

            {/* 📋 CUSTOMER & VEHICLE BRIEFING */}
            <div className="bg-gray-50/50 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400"><User size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em] leading-none mb-1.5">Client Profile</p>
                  <p className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">{selectedServiceDetail.name || selectedServiceDetail.customer_name || "N/A"}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">{selectedServiceDetail.phone || "No Contact"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400"><Car size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em] leading-none mb-1.5">Vehicle Intelligence</p>
                  <p className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">{selectedServiceDetail.brand} {selectedServiceDetail.model}</p>
                  <p className="text-[10px] font-black text-blue-600 mt-2 uppercase tracking-widest">{selectedServiceDetail.vehicleNumber || selectedServiceDetail.vehicle_number || "NO PLATE"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400"><Clock size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em] leading-none mb-1.5">Timeline Archive</p>
                  <p className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">{new Date(selectedServiceDetail.updatedAt || selectedServiceDetail.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest leading-none">Record # {selectedServiceDetail.id}</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-100 bg-gray-50/50 shrink-0">
              <button 
                onClick={() => setActiveModalTab("issues")}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "issues" ? "bg-white border-b-2 border-black text-black" : "text-gray-400 hover:bg-gray-100"}`}
              >
                Diagnostic Issues
              </button>
              <button 
                onClick={() => setActiveModalTab("parts")}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "parts" ? "bg-white border-b-2 border-black text-black" : "text-gray-400 hover:bg-gray-100"}`}
              >
                Archived Spare Parts
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              {activeModalTab === "issues" ? (
                <div className="space-y-4">
                  {issueEntries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No diagnostic issues logged for this protocol</p>
                    </div>
                  ) : (
                    issueEntries.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[60px]">Issue #{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-800 uppercase">{entry.issue}</p>
                        </div>
                        <div className="w-32 text-right">
                          <p className="text-sm font-black text-emerald-600">₹{entry.issueAmount || 0}</p>
                        </div>
                        <div className="w-28 text-center">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Approved</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {partsEntries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No spare parts utilized in this service</p>
                    </div>
                  ) : (
                    partsEntries.map((part, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[60px]">Part #{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-800 uppercase">{part.partName}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Qty: <span className="text-black">{part.qty}</span></p>
                           <p className="text-sm font-black text-emerald-600 w-24 text-right">₹{part.price || 0}</p>
                        </div>
                        <div className="w-28 text-center">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Approved</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job ID: {selectedServiceDetail.bookingId || selectedServiceDetail.id}</span>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-4 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100 italic">Financial Value: ₹{Number(selectedServiceDetail.grandTotal || 0).toLocaleString()}</span>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4 px-3 py-1 bg-emerald-100/50 rounded-lg border border-emerald-100">Protocol Archived</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handlePrint(selectedServiceDetail)} className="px-6 py-3 bg-white text-black border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                     <Printer size={16} /> Print Record
                   </button>
                   <button onClick={() => setIssueModalVisible(false)} className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-xl shadow-black/10">Back to Archive</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpCompletedHistory;
