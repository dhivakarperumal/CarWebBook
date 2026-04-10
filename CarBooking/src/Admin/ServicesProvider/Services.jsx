import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaFileInvoice, FaEye, FaThLarge, FaList, FaPlus, FaCalendarAlt, FaClock, FaCheckCircle, FaSearch, FaWrench, FaUserCheck, FaTimes, FaCar, FaCalendarCheck } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import Pagination from "../../Components/Pagination";

const STATUS_STEPS = [
  "Booked",
  "Call Verified",
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

// Global cache for seamless navigation
let servicesCache = null;

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";
  const pathPrefix = location.pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [viewMode, setViewMode] = useState("table");
  const [mainTab, setMainTab] = useState("all");
  const [services, setServices] = useState(servicesCache?.services || []);
  const [employees, setEmployees] = useState(servicesCache?.employees || []);
  const [issueEntries, setIssueEntries] = useState([]);
  const [serviceParts, setServiceParts] = useState(servicesCache?.partsMap || {});
  const [products, setProducts] = useState(servicesCache?.products || []);
  const [loading, setLoading] = useState(!servicesCache);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
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

  const loadData = async () => {
    try {
      const [servRes, empRes, prodRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
        api.get("/products"),
      ]);
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
      setProducts(prodRes.data || []);

      servicesCache = {
        services: servicesWithDetails,
        employees: empRes.data,
        partsMap: partsMap,
        products: prodRes.data || []
      };
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const searchedServices = useMemo(() => {
    return services.filter((s) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
      
      if (statusFilter !== "All Status") {
        const rawStatus = s.serviceStatus || s.status || "Booked";
        const found = STATUS_STEPS.find(step => step.toLowerCase() === rawStatus.toLowerCase());
        const mappedStatus = found || "Booked";
        if (mappedStatus !== statusFilter) return false;
      }

      const bDateStr = s.created_at || s.createdAt;
      // If filtering by history, don't block records with missing dates
      if (dateFilter === "All Time") return true;
      if (!bDateStr) return false;

      const bookingDate = new Date(bDateStr);
      const now = new Date();
      const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (dateFilter === "Today") {
        if (startOfDay(bookingDate).getTime() !== startOfDay(now).getTime()) return false;
      } else if (dateFilter === "Yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (startOfDay(bookingDate).getTime() !== startOfDay(yesterday).getTime()) return false;
      } else if (dateFilter === "This Week") {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        if (bookingDate < startOfDay(weekStart) || bookingDate > now) return false;
      } else if (dateFilter === "Last Week") {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek - 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - dayOfWeek - 1);
        weekEnd.setHours(23, 59, 59, 999);
        if (bookingDate < startOfDay(weekStart) || bookingDate > weekEnd) return false;
      } else if (dateFilter === "This Month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (bookingDate < monthStart || bookingDate > now) return false;
      } else if (dateFilter === "Custom Range") {
        if (customFrom) {
          const from = new Date(customFrom);
          if (startOfDay(bookingDate) < from) return false;
        }
        if (customTo) {
          const to = new Date(customTo);
          to.setHours(23, 59, 59, 999);
          if (bookingDate > to) return false;
        }
      }
      return true;
    });
  }, [services, search, dateFilter, customFrom, customTo, statusFilter]);

  const stats = useMemo(() => {
    const relevantServices = isMechanic
      ? services.filter(s => (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.displayName || "").toLowerCase())
      : services;

    return {
      total: relevantServices.length,
      appointments: relevantServices.filter(s => !s.addVehicle).length,
      bookings: relevantServices.filter(s => s.addVehicle).length,
      assigned: relevantServices.filter(s => !!s.assignedEmployeeId).length,
      unassigned: isMechanic ? 0 : relevantServices.filter(s => !s.assignedEmployeeId).length,
      completed: relevantServices.filter(s => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat.includes("completed") || sStat.includes("bill completed");
      }).length
    };
  }, [services, isMechanic, userProfile]);

  const currentMainList = mainTab === "all"
    ? searchedServices
    : (mainTab === "booked" ? searchedServices.filter(s => !s.addVehicle) : searchedServices.filter(s => s.addVehicle));
  const assignedServices = currentMainList.filter(s => {
    if (!s.assignedEmployeeId) return false;
    if (isMechanic) return (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.displayName || "").toLowerCase();
    return true;
  });
  const unassignedServices = isMechanic ? [] : currentMainList.filter(s => !s.assignedEmployeeId);
  const listData = assignedServices;

  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSpareStatus = (parts) => {
    if (!parts || parts.length === 0) return { label: "No Spares", color: "text-gray-400 bg-gray-50 border-gray-100" };
    const statuses = parts.map(p => (p.status || "Pending").toLowerCase());
    if (statuses.every(s => s === "approved")) return { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (statuses.some(s => s === "rejected")) return { label: "Issues/Rejected", color: "text-red-600 bg-red-50 border-red-100" };
    return { label: "Awaiting Appr.", color: "text-amber-600 bg-amber-50 border-amber-100" };
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/all-services/${id}`);
      toast.success("Service deleted");
      loadData();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/all-services/${id}/status`, { serviceStatus: newStatus });
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


  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
      
        </div>
        <button onClick={() => navigate(`${pathPrefix}/addserviceparts`)} className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"><FaPlus /> Registry Service Parts</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Service Volume" value={stats.total} icon={<FaCalendarAlt />} gradient="from-blue-600 to-blue-400" />
        <StatCard title="Appointments" value={stats.appointments} icon={<FaCalendarCheck />} gradient="from-purple-600 to-purple-400" />
        <StatCard title="Bookings" value={stats.bookings} icon={<FaCar />} gradient="from-orange-600 to-orange-400" />
        <StatCard title="Successfully Closed" value={stats.completed} icon={<FaCheckCircle />} gradient="from-emerald-600 to-emerald-400" />
      </div>


      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group w-full lg:max-w-md xl:max-w-lg">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all" />
          <input type="text" placeholder="Track booking, customer, vehicle ID..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-15 pr-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-inner" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full lg:w-auto">
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full sm:w-auto h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm shrink-0">
              <option value="All Status">All Status</option>
              {STATUS_STEPS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="w-full sm:w-auto h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm shrink-0">
              <option value="All Time">All</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="Last Week">Last Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>

            {dateFilter === "Custom Range" && (
              <div className="flex items-center gap-2 animate-fadeIn bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 font-bold uppercase text-[10px] tracking-widest text-gray-500">
                <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setCurrentPage(1); }} className="h-10 px-4 bg-white border border-gray-100 rounded-xl outline-none focus:border-black" />
                <span>To</span>
                <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setCurrentPage(1); }} className="h-10 px-4 bg-white border border-gray-100 rounded-xl outline-none focus:border-black" />
              </div>
            )}
          </div>

          <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-[1.5rem] border border-gray-200 shadow-inner shrink-0 w-full sm:w-auto">
            <button onClick={() => setViewMode("table")} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaList className="hidden sm:block" /></button>
            <button onClick={() => setViewMode("card")} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaThLarge className="hidden sm:block" /></button>
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
                <thead className="bg-[#020617] text-white">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                   
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Customer</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Vehicle Spec</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Issues</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Mechanic</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Spare Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-center">Workflow</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-right">Actions</th>
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

                        <td className="px-8 py-6"><span className="text-xs font-black text-blue-900">{item.bookingId || "SER-NEW"}</span><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{item.phone}</p></td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 mb-1"><p className="text-sm font-black text-gray-800">{item.brand} {item.model}</p></div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.vehicleNumber || "UNSPECIFIED"}</p>
                        </td>
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
                          {item.assignedEmployeeName ? (
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black border border-blue-100 uppercase">{item.assignedEmployeeName.charAt(0)}</div><span className="text-xs font-black text-gray-700">{item.assignedEmployeeName}</span></div>
                          ) : (
                            <button onClick={() => { setSelectedBooking(item); setModalVisible(true); }} className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">Pending Assignment</button>
                          )}
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
                        <input type="text" value={entry.issue || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issue: e.target.value }; setIssueEntries(copy); }} className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-black text-black outline-none focus:border-black transition-all" placeholder="Diagnostic Issue..." />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                          <input type="number" value={entry.issueAmount || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issueAmount: e.target.value }; setIssueEntries(copy); }} placeholder="Amt" className="w-full pl-6 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-black outline-none focus:border-black" />
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
                          className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-black text-black outline-none focus:border-black transition-all" 
                          placeholder="Search or Enter Part Name..." 
                        />
                        <datalist id="spare-parts-list">
                          {products.map(p => (
                            <option key={p.id} value={p.name}>₹{p.offerPrice || p.mrp}</option>
                          ))}
                        </datalist>
                        <div className="flex items-center gap-2">
                           <input type="number" value={part.qty || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], qty: e.target.value }; setEditingParts(copy); }} placeholder="Qty" className="w-16 px-2 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-black outline-none focus:border-black text-center" />
                           <div className="relative w-24">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₹</span>
                             <input type="number" value={part.price || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], price: e.target.value }; setEditingParts(copy); }} placeholder="Price" className="w-full pl-5 pr-2 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-black outline-none focus:border-black" />
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
                }} className="flex-1 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10">Save Spares & Issues</button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
