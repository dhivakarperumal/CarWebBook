import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit,FaEye, FaThLarge, FaList, FaPlus, FaCalendarAlt, FaClock, FaCheckCircle, FaSearch, FaWrench, FaUserCheck, FaTimes, FaFileInvoice } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import Pagination from "../../Components/Pagination";

const STATUS_STEPS = [
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white border border-gray-300 rounded-md p-6 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
      </div>
      <div className={`p-4 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-lg shadow-black/10`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function EmpService() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName: userProfile, cachedData, updateCache } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";
  const pathPrefix = location.pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [viewMode, setViewMode] = useState("table");
  const [mainTab, setMainTab] = useState("all");
  const [services, setServices] = useState(cachedData.globalServices || []);
  const [employees, setEmployees] = useState(cachedData.employees || []);
  const [issueEntries, setIssueEntries] = useState([]);
  const [serviceParts, setServiceParts] = useState(cachedData.partsMap || {});
  const [loading, setLoading] = useState(!cachedData.globalServices);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("issues");
  const [editingParts, setEditingParts] = useState([]);
  const [products, setProducts] = useState(cachedData.products || []);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [servRes, empRes, prodRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
        api.get("/products"),
      ]);
      setProducts(prodRes.data || []);
      const partsMap = {};
      const servicesWithDetails = [];
      await Promise.all(
        (servRes.data || []).map(async (service) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            const details = detailRes.data || {};
            partsMap[service.id] = details.parts || [];
            servicesWithDetails.push({ ...service, parts: details.parts || [], issues: details.issues || [] });
          } catch (err) {
            partsMap[service.id] = [];
            servicesWithDetails.push({ ...service, parts: [], issues: [] });
          }
        })
      );
      setServiceParts(partsMap);
      setServices(servicesWithDetails);
      setEmployees(empRes.data);
      
      updateCache("globalServices", servicesWithDetails);
      updateCache("employees", empRes.data || []);
      updateCache("products", prodRes.data || []);
      updateCache("partsMap", partsMap);
    } catch (error) {
      if (!isSilent) toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(!!cachedData.globalServices); }, []);

  const searchedServices = useMemo(() => {
    return services.filter((s) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;

      const bDateStr = s.created_at || s.createdAt;
      // If filtering by history, don't block records with missing dates
      if (dateFilter === "All Time") return true;
      if (!bDateStr) return false;

      const bookingDate = new Date(bDateStr);
      const today = new Date();
      if (dateFilter === "Today") return bookingDate.toDateString() === today.toDateString();
      if (dateFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return bookingDate.toDateString() === yesterday.toDateString();
      }
      if (dateFilter === "This Week") {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        return bookingDate >= lastWeek;
      }
      if (dateFilter === "This Month") {
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 30);
        lastMonth.setHours(0, 0, 0, 0);
        return bookingDate >= lastMonth;
      }
      return true;
    });
  }, [services, search, dateFilter]);

  const stats = useMemo(() => {
    const mechanicName = (userProfile?.displayName || "").toLowerCase();
    const relevantServices = services.filter(s => 
      (s.assignedEmployeeName || "").toLowerCase() === mechanicName
    );

    return {
      total: relevantServices.length,
      processing: relevantServices.filter(s => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat !== "" && !sStat.includes("completed") && !sStat.includes("bill completed") && sStat !== "cancelled";
      }).length,
      completed: relevantServices.filter(s => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat.includes("completed") || sStat.includes("bill completed");
      }).length
    };
  }, [services, userProfile]);

  const getSpareStatus = (parts) => {
    if (!parts || parts.length === 0) return { label: "No Spares", color: "text-gray-400 bg-gray-50 border-gray-100" };
    const statuses = parts.map(p => (p.status || "Pending").toLowerCase());
    if (statuses.every(s => s === "approved")) return { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (statuses.some(s => s === "rejected")) return { label: "Issues/Rejected", color: "text-red-600 bg-red-50 border-red-100" };
    return { label: "Awaiting Appr.", color: "text-amber-600 bg-amber-50 border-amber-100" };
  };

  const currentMainList = useMemo(() => {
    const mechanicName = (userProfile?.displayName || "").toLowerCase();
    const filtered = services.filter(s => {
      const isAssigned = (s.assignedEmployeeName || "").toLowerCase() === mechanicName;
      const status = (s.serviceStatus || s.status || "").toLowerCase();
      const isCompleted = status === "service completed" || status === "bill completed";
      return isAssigned && !isCompleted;
    });

    return filtered.filter((s) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;

      const bDateStr = s.created_at || s.createdAt;
      if (dateFilter === "All Time") return true;
      if (!bDateStr) return false;
      const bookingDate = new Date(bDateStr);

      const today = new Date();
      if (dateFilter === "Today") return bookingDate.toDateString() === today.toDateString();
      if (dateFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return bookingDate.toDateString() === yesterday.toDateString();
      }
      if (dateFilter === "This Week") {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        return bookingDate >= lastWeek;
      }
      if (dateFilter === "This Month") {
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 30);
        lastMonth.setHours(0, 0, 0, 0);
        return bookingDate >= lastMonth;
      }
      if (dateFilter === "Custom Range" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return bookingDate >= start && bookingDate <= end;
      }
      return true;
    });
  }, [services, search, dateFilter, mainTab, userProfile, startDate, endDate]);

  const listData = currentMainList;
  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getMappedStatus = (status) => {
    if (!status) return "Booked";
    const found = STATUS_STEPS.find(s => s.toLowerCase() === status.toLowerCase());
    return found || "Booked";
  };

  const getStatusColor = (status) => {
    const mapped = getMappedStatus(status);
    switch (mapped) {
      case "Booked": case "Approved": return "bg-indigo-100 text-indigo-700";
      case "Processing": return "bg-purple-100 text-purple-700";
      case "Waiting for Spare": return "bg-yellow-100 text-yellow-800";
      case "Service Going on": return "bg-orange-100 text-orange-700";
      case "Bill Pending": return "bg-pink-100 text-pink-700";
      case "Bill Completed": return "bg-cyan-100 text-cyan-700";
      case "Service Completed": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };



  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/all-services/${id}/status`, { 
        serviceStatus: newStatus,
        status: newStatus 
      });
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    try {
      setAssigning(true);
      const emp = employees.find(e => e.id.toString() === selectedEmployeeId.toString());
      if (!emp) return toast.error("Mechanic not found");
      await api.put(`/all-services/${selectedBooking.id}/assign`, { assignedEmployeeId: emp.id, assignedEmployeeName: emp.name, serviceStatus: "Processing" });
      toast.success(`Mechanic ${emp.name} assigned!`);
      setModalVisible(false); loadData();
    } catch {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenIssueModal = (item) => {
    setEditingIssueId(item.id);
    let initialIssues = [...(item.issues || [])];
    if (initialIssues.length === 0) {
      const mainIssueText = item.issue || item.otherIssue || item.carIssue || "Routine Checkup";
      initialIssues = [{
        issue: mainIssueText,
        issueAmount: item.issueAmount || 0,
        issueStatus: item.issueStatus || 'pending'
      }];
    }
    setIssueEntries(initialIssues);
    setEditingParts([...(item.parts || [])]);
    setActiveModalTab("issues");
    setIssueModalVisible(true);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Technician Service Board</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time technical workflow & diagnostic manifest</p>
        </div>
        <button onClick={() => navigate(`${pathPrefix}/addserviceparts`)} className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"><FaPlus /> Registry Service Parts</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Assigned Jobs" value={stats.total} icon={<FaCalendarAlt />} gradient="from-blue-600 to-blue-400" />
        <StatCard title="Active Progress" value={stats.processing} icon={<FaClock />} gradient="from-indigo-600 to-indigo-400" />
        <StatCard title="Completed Ready" value={stats.completed} icon={<FaCheckCircle />} gradient="from-emerald-600 to-emerald-400" />
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group w-full xl:max-w-xl">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all" />
          <input type="text" placeholder="Track service ID, customer, or vehicle plate..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-15 pr-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-inner" />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto xl:justify-end">
          <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button onClick={() => setViewMode("table")} className={`flex items-center px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaList /> </button>
            <button onClick={() => setViewMode("card")} className={`flex items-center px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaThLarge /> </button>
          </div>

          <div className="flex flex-nowrap items-center gap-3">
            {dateFilter === "Custom Range" && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-[56px] px-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-[10px] outline-none focus:border-black shadow-sm" />
                <span className="text-gray-400 font-bold">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-[56px] px-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-[10px] outline-none focus:border-black shadow-sm" />
              </div>
            )}
            <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm min-w-[160px]">
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      <>
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {paginatedData.map((item) => (
              <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><FaWrench size={80} /></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">SERVICE ID</span>
                    <p className="text-sm font-black text-blue-900">{item.bookingId || `SER-${item.id}`}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-[1.5rem] text-[10px] font-black tracking-widest border text-center ${getStatusColor(item.serviceStatus || item.status)}`}>
                    {getMappedStatus(item.serviceStatus || item.status)}
                  </div>
                </div>
                <div className="space-y-5 flex-1 relative z-10">
                  <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 font-bold text-xs uppercase">{item.name?.charAt(0)}</div>
                        <div><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Client</p><p className="text-sm font-black text-gray-800">{item.name}</p></div>
                      </div>
                      {(() => {
                        const ss = getSpareStatus(item.parts);
                        return <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${ss.color}`}>{ss.label}</span>;
                      })()}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 overflow-hidden">
                    <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Diagnostic Log & Parts</span><button onClick={() => handleOpenIssueModal(item)} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Edit</button></div>
                    <div className="space-y-2">{item.issues?.slice(0, 2).map((iss, i) => <p key={i} className="text-xs font-bold text-gray-600 line-clamp-1 flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full" />{iss.issue}</p>) || <p className="text-xs italic text-gray-400">No log entries</p>}</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-2">
                  {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                    <button onClick={() => navigate(`${pathPrefix}/addserviceparts`, { state: { service: item } })} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100" title="Add Parts"><FaPlus className="mr-2" /> Parts</button>
                  )}
                  {getMappedStatus(item.serviceStatus || item.status) === "Processing" && (
                    <button onClick={() => handleUpdateStatus(item.id, "Service Going on")} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all border border-transparent" title="Start Service">Start</button>
                  )}
                  {getMappedStatus(item.serviceStatus || item.status) === "Service Going on" && (
                    <button onClick={() => handleUpdateStatus(item.id, "Service Completed")} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all border border-transparent" title="Complete Service">Complete</button>
                  )}
                  <button onClick={() => handleOpenIssueModal(item)} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-all border border-transparent hover:border-amber-100" title="Edit Log & Parts"><FaEdit className="mr-2" /> Log</button>
                  <button onClick={() => navigate(`${pathPrefix}/addbillings`, { state: { service: item } })} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-black text-white hover:bg-emerald-600 transition-all border border-transparent" title="Generate Bill"><FaFileInvoice className="mr-2" /> Bill</button>
                  <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-11 w-11 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100" title="View Details"><FaEye /></button>
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase tracking-widest text-xs">No service protocols found for designated metrics</div>}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl shadow-blue-900/5 border border-gray-100 animate-fadeIn overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
                <thead className="bg-[#0e5f76] text-white">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">S No</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Identifier</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Customer Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Issues</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Spare Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Workflow</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100 text-gray-300">
                            <FaWrench size={24} />
                          </div>
                          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No active service protocols found for criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-6"><span className="text-xs font-black text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</span></td>
                        <td className="px-8 py-6"><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none mb-1">#ID {item.id}</span><span className="text-xs font-black text-blue-900">{item.bookingId || "SER-NEW"}</span></td>
                        <td className="px-8 py-6"><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{item.phone}</p></td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 group/issue">
                            <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]" title={item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}>
                              {item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}
                            </p>
                            <button 
                              onClick={() => handleOpenIssueModal(item)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-all shadow-sm border border-amber-200/50"
                              title="Edit Diagnostics"
                            >
                              <FaEdit size={10} />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           {(() => {
                             const ss = getSpareStatus(item.parts);
                             return <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${ss.color}`}>{ss.label}</span>;
                           })()}
                        </td>
                        <td className="px-8 py-6 text-center">
                           <select 
                             value={getMappedStatus(item.serviceStatus || item.status)}
                             onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                             className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border inline-block min-w-[150px] text-center cursor-pointer outline-none focus:ring-4 focus:ring-black/5 ${getStatusColor(item.serviceStatus || item.status)}`}
                           >
                             {STATUS_STEPS.map((step, idx) => {
                               const currentIdx = STATUS_STEPS.findIndex(s => s.toLowerCase() === (item.serviceStatus || item.status || "Booked").toLowerCase()) || 0;
                               if (idx < currentIdx) return null;
                               return (
                                 <option key={step} value={step} className="bg-white text-black font-bold uppercase">{step}</option>
                               );
                             })}
                           </select>
                        </td>
                        <td className="px-8 py-6 text-left">
                          <div className="flex justify-end gap-2">
                            {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                              <button onClick={() => navigate(`${pathPrefix}/addserviceparts`, { state: { service: item } })} className="h-10 px-4 bg-emerald-500 text-white hover:bg-emerald-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Add Parts">Parts</button>
                            )}
                           
                           
                            <button onClick={() => handleOpenIssueModal(item)} className="h-10 px-4 bg-gray-900 text-gray-400 hover:bg-amber-50 hover:text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Edit Log & Parts"><FaEdit /></button>
                            <button onClick={() => navigate(`${pathPrefix}/addbillings`, { state: { service: item } })} className="h-10 px-4 bg-black text-white hover:bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2" title="Generate Bill"><FaFileInvoice /> Bill</button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        {modalVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Assign Mechanic</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Select personnel for this service</p>
              </div>
              <div className="mb-6">
                <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-black outline-none transition-all uppercase tracking-wider">
                  <option value="">-- SELECT TECHNICIAN --</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setModalVisible(false); setSelectedEmployeeId(""); }} className="flex-1 rounded-xl bg-gray-100 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={assignEmployee} disabled={assigning || !selectedEmployeeId} className="flex-1 rounded-xl bg-black py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-20">Assign Now</button>
              </div>
            </div>
          </div>
        )}

        {issueModalVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Diagnostic & Parts Log</h2>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Update service manifest</p>
                </div>
                <button onClick={() => { setIssueModalVisible(false); setEditingIssueId(null); }} className="p-2 text-gray-400 hover:text-red-500 transition-all"><FaTimes size={16} /></button>
              </div>

              <div className="flex px-8 border-b border-gray-100">
                <button onClick={() => setActiveModalTab("issues")} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "issues" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}>Issues</button>
                <button onClick={() => setActiveModalTab("parts")} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "parts" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}>Parts</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {activeModalTab === "issues" ? (
                  <>
                    {issueEntries.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-all">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest min-w-[50px]">#{idx + 1}</span>
                        <input type="text" value={entry.issue || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issue: e.target.value }; setIssueEntries(copy); }} className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-black transition-all" placeholder="Diagnostic Issue..." />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                          <input type="number" value={entry.issueAmount || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issueAmount: e.target.value }; setIssueEntries(copy); }} placeholder="Amt" className="w-full pl-6 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-800 outline-none focus:border-black" />
                        </div>
                        <div className="w-28 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${entry.issueStatus === "approved" ? "text-emerald-500" : entry.issueStatus === "rejected" ? "text-red-500" : "text-amber-500"}`}>{entry.issueStatus || "pending"}</span>
                        </div>
                        <button onClick={() => { const copy = [...issueEntries]; copy.splice(idx, 1); setIssueEntries(copy); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTimes size={12} /></button>
                      </div>
                    ))}
                    {issueEntries.length === 0 && <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-gray-100 rounded-[3rem]">Initial diagnostic log empty</div>}
                  </>
                ) : (
                  <>
                    {editingParts.map((part, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-all relative">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest min-w-[50px]">Part #{idx + 1}</span>
                        <input 
                          type="text" 
                          list="spare-parts-list"
                          value={part.partName || ""} 
                          onChange={(e) => { 
                            const val = e.target.value;
                            const copy = [...editingParts]; 
                            const matchedProduct = products.find(p => p.name === val);
                            if (matchedProduct) {
                              copy[idx] = { 
                                ...copy[idx], 
                                partName: val, 
                                price: matchedProduct.offerPrice || matchedProduct.mrp || 0 
                              };
                            } else {
                              copy[idx] = { ...copy[idx], partName: val }; 
                            }
                            setEditingParts(copy); 
                          }} 
                          className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-black transition-all" 
                          placeholder="Search or Enter Part Name..." 
                        />
                        <datalist id="spare-parts-list">
                          {products.map(p => (
                            <option key={p.id} value={p.name}>₹{p.offerPrice || p.mrp}</option>
                          ))}
                        </datalist>
                        <div className="flex items-center gap-2">
                           <input type="number" value={part.qty || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], qty: e.target.value }; setEditingParts(copy); }} placeholder="Qty" className="w-16 px-2 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-800 outline-none focus:border-black text-center" />
                           <div className="relative w-24">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                             <input type="number" value={part.price || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], price: e.target.value }; setEditingParts(copy); }} placeholder="Price" className="w-full pl-5 pr-2 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-800 outline-none focus:border-black" />
                           </div>
                        </div>
                        <div className="w-28 text-center">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${part.status === "approved" ? "text-emerald-500" : part.status === "rejected" ? "text-red-500" : "text-amber-500"}`}>{part.status || "pending"}</span>
                        </div>
                        <button onClick={() => { const copy = [...editingParts]; copy.splice(idx, 1); setEditingParts(copy); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTimes size={12} /></button>
                      </div>
                    ))}
                    {editingParts.length === 0 && <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-gray-100 rounded-[3rem]">No spare parts requested</div>}
                  </>
                )}
              </div>

              <div className="px-8 py-5 border-t border-gray-100 bg-white flex gap-3">
                {activeModalTab === "issues" ? (
                  <button onClick={() => setIssueEntries([...issueEntries, { issue: '', issueAmount: '', issueStatus: 'pending' }])} className="px-6 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Add Issue</button>
                ) : (
                  <button onClick={() => setEditingParts([...editingParts, { partName: '', qty: 1, price: 0, status: 'pending' }])} className="px-6 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Add Part</button>
                )}
                <button onClick={async () => {
                  try {
                    // Synchronize Issues
                    const issuesToSave = issueEntries.filter(e => e.issue?.trim());
                    for (const entry of issuesToSave) {
                      if (entry.id) await api.put(`/all-services/${editingIssueId}/issues/${entry.id}`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0), issueStatus: entry.issueStatus || 'pending' });
                      else await api.post(`/all-services/${editingIssueId}/issues`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0), issueStatus: entry.issueStatus || 'pending' });
                    }

                    // Synchronize Parts
                    const partsToSave = editingParts.filter(p => p.partName?.trim());
                    if (partsToSave.length > 0 || editingParts.length === 0) {
                      await api.post(`/all-services/${editingIssueId}/parts`, { parts: partsToSave.map(p => ({ ...p, status: p.status || 'pending' })) });
                    }

                    // Update main issue amounts if necessary based on first entry
                    if (issuesToSave.length > 0) {
                       await api.put(`/all-services/${editingIssueId}/issue`, {
                         issue: issuesToSave[0].issue,
                         issueAmount: Number(issuesToSave[0].issueAmount || 0)
                       });
                    }

                    toast.success('Service items saved successfully');
                    setIssueModalVisible(false);
                    setEditingIssueId(null);
                    setActiveModalTab("issues");
                    loadData();
                  } catch (error) { toast.error('Failed to save items'); }
                }} className="flex-1 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10">Save Spares & Items</button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
