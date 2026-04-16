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
  "Service Completed",
  "Bill Pending",
  "Bill Completed",
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
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [timer, setTimer] = useState(0);

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
  
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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
    const mechanicName = (userProfile?.displayName || "").toLowerCase().trim();
    const userRole = (userProfile?.role || "").toLowerCase();
    const isAdmin = userRole === "admin";

    const relevantServices = services.filter(s => {
      if (isAdmin) return true;
      const assignedName = (s.assignedEmployeeName || "").toLowerCase().trim();
      return assignedName === mechanicName || assignedName.includes(mechanicName);
    });

    return {
      total: relevantServices.length,
      processing: relevantServices.filter(s => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat !== "" && !sStat.includes("completed") && !sStat.includes("bill completed") && !sStat.includes("bill pending") && sStat !== "cancelled";
      }).length,
      completed: relevantServices.filter(s => {
        const sStat = (s.serviceStatus || s.status || "").toLowerCase();
        return sStat.includes("completed") || sStat.includes("bill completed") || sStat.includes("bill pending");
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
    const mechanicName = (userProfile?.displayName || "").toLowerCase().trim();
    const userRole = (userProfile?.role || "").toLowerCase();
    const isAdmin = userRole === "admin";

    const filtered = services.filter(s => {
      const assignedName = (s.assignedEmployeeName || "").toLowerCase().trim();
      const isAssigned = isAdmin || assignedName === mechanicName || assignedName.includes(mechanicName);
      const statusValue = (s.serviceStatus || s.status || "").toLowerCase();
      const isFinalized = statusValue === "bill completed" || statusValue === "cancelled";
      
      // If a specific status filter is selected, respect it even if finalized
      if (statusFilter !== "All Status") return isAssigned;
      
      // Default: hide fully billed/finalized jobs from the busy technical board
      return isAssigned && !isFinalized;
    });

    return filtered.filter((s) => {
      const text = `${s.bookingId || ""} ${s.name || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
      
      if (statusFilter !== "All Status") {
        const rawStatus = (s.serviceStatus || s.status || "Booked").toLowerCase();
        const found = STATUS_STEPS.find(step => step.toLowerCase() === rawStatus);
        const mappedStatus = found || (rawStatus.includes("bill completed") ? "Bill Completed" : (rawStatus.includes("completed") ? "Service Completed" : "Booked"));
        if (mappedStatus !== statusFilter) return false;
      }

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
  }, [services, search, dateFilter, mainTab, userProfile, startDate, endDate, statusFilter]);

  const listData = currentMainList;
  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getMappedStatus = (status) => {
    if (!status) return "Booked";
    const sLow = status.toLowerCase();
    if (sLow === "cancelled") return "Cancelled";
    const found = STATUS_STEPS.find(s => s.toLowerCase() === sLow);
    if (found) return found;
    if (sLow.includes("bill completed")) return "Bill Completed";
    if (sLow.includes("completed")) return "Service Completed";
    return "Booked";
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
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };



  const handleUpdateStatus = async (id, newStatus) => {
    // Store old status for rollback
    const oldService = services.find(s => s.id === id);
    const oldStatus = oldService?.serviceStatus || oldService?.status;

    // ⚡ Optimistic update — reflect in UI immediately
    setServices(prev =>
      prev.map(s => s.id === id ? { ...s, serviceStatus: newStatus } : s)
    );
    try {
      await api.put(`/all-services/${id}/status`, { 
        serviceStatus: newStatus,
        status: newStatus 
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      // Revert to old status on failure
      setServices(prev =>
        prev.map(s => s.id === id ? { ...s, serviceStatus: oldStatus } : s)
      );
    }
  };

  const handleCloseBooking = async () => {
    if (!selectedBooking || !closeReason.trim() || isClosing) return;
    try {
      setIsClosing(true);
      
      // Auto-reject pending issues and parts
      const updatedIssues = (selectedBooking.issues || []).map(iss => 
        iss.issueStatus === 'pending' ? { ...iss, issueStatus: 'rejected' } : iss
      );
      const updatedParts = (selectedBooking.parts || []).map(p => 
        p.status === 'pending' ? { ...p, status: 'rejected' } : p
      );

      // Save the rejections
      if (updatedIssues.length > 0) {
        for (const iss of updatedIssues) {
          if (iss.id) await api.put(`/all-services/${selectedBooking.id}/issues/${iss.id}`, iss);
        }
      }
      if (updatedParts.length > 0) {
        await api.post(`/all-services/${selectedBooking.id}/parts`, { parts: updatedParts });
      }

      await api.put(`/all-services/${selectedBooking.id}/status`, { 
        serviceStatus: "Cancelled",
        status: "Cancelled",
        closeReason: closeReason.trim()
      });
      toast.success("Booking closed and items rejected");
      setCloseModalVisible(false);
      setCloseReason("");
      setSelectedBooking(null);
      loadData();
    } catch (error) {
      toast.error("Failed to close booking");
    } finally {
      setIsClosing(false);
    }
  };

  const getHoursDifference = (dateStr) => {
    if (!dateStr) return 0;
    const past = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - past) / (1000 * 60 * 60));
  };

  const getElapsedTime = (dateStr) => {
    if (!dateStr) return "0h";
    const past = new Date(dateStr);
    const now = new Date();
    const diffMs = now - past;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
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
      const mainIssueText = (item.issue?.toLowerCase() === 'others' && item.otherIssue ? `Others: ${item.otherIssue}` : item.issue) || item.otherIssue || item.carIssue || "Routine Checkup";
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

  /* ================= PRINT SERVICE ================= */
  const printService = async (item) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const date = new Date(item.created_at || item.createdAt).toLocaleDateString("en-IN");

    doc.write(`
      <html>
        <head>
          <title>Service Protocol - ${item.bookingId || item.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo img { height: 50px; }
            .protocol-title { text-align: right; }
            .protocol-title h1 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; padding: 20px; background: #f8fafc; border-radius: 12px; }
            .block h4 { margin: 0 0 8px 0; color: #64748b; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
            .block p { margin: 0; font-weight: 700; font-size: 13px; color: #0f172a; }

            .diagnostic-section { background: #fff; padding: 0; margin-bottom: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .diagnostic-section h3 { margin: 0 0 15px 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
            .issue-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #334155; }
            .dot { width: 6px; height: 6px; background: #0f172a; border-radius: 50%; }

            .tech-info { margin-top: 40px; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 12px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo"><img src="/logo_no_bg.png" /></div>
            <div class="protocol-title">
              <h1>SERVICE PROTOCOL</h1>
              <p style="margin:4px 0 0 0; font-weight:700; color:#64748b; font-size:12px;">ID: ${item.bookingId || "NEW"}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="block">
              <h4>Customer Details</h4>
              <p>${item.name}</p>
              <p style="font-weight:400; color:#64748b; font-size:11px;">${item.phone}</p>
            </div>
            <div class="block" style="text-align: right">
              <h4>Vehicle Information</h4>
              <p>${item.brand} ${item.model}</p>
              <p style="font-weight:400; color:#64748b; font-size:11px;">REG: ${item.vehicleNumber || "N/A"}</p>
            </div>
          </div>

          <div class="diagnostic-section">
            <h3>Technical Diagnostic Report</h3>
            ${item.issues?.length > 0 ? item.issues.map(iss => `
              <div class="issue-item"><span class="dot"></span> ${iss.issue}</div>
            `).join("") : `<p style="font-size:12px; color:#64748b;">System diagnostic: Routine review - no critical faults logged.</p>`}
          </div>

          <div class="tech-info">
             <h4>Chief Technician</h4>
             <p>${item.assignedEmployeeName || userProfile?.displayName || "Technical Team"}</p>
             <p style="margin-top: 5px; font-size: 10px; color: #64748b;">(Verified by Electronic Signature)</p>
          </div>

          <div class="footer">
            <p>Certified Service Report generated on ${date}.</p>
            <p style="font-weight:900; color:#0f172a; margin-top:10px; font-size: 12px;">CARBOOKING HUB AUTOMOTIVE</p>
          </div>
        </body>
      </html>
    `);

    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 500);
  };

  // removed loading block for instant dashboard access
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Technical Service Board</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time technical workflow & diagnostic manifest</p>
        </div>
        <button onClick={() => navigate(`${pathPrefix}/addserviceparts`)} className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-600 transition-all flex items-center justify-center gap-3 shadow-xl"><FaPlus /> Registry Service Parts</button>
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

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full lg:w-auto">
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full sm:w-auto h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm shrink-0">
              <option value="All Status">All Status</option>
              {STATUS_STEPS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="w-full sm:w-auto h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm shrink-0">
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>
            
            {dateFilter === "Custom Range" && (
              <div className="flex items-center gap-2 animate-fadeIn bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 font-bold uppercase text-[10px] tracking-widest text-gray-500">
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="h-10 px-4 bg-white border border-gray-100 rounded-xl outline-none focus:border-black" />
                <span>To</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="h-10 px-4 bg-white border border-gray-100 rounded-xl outline-none focus:border-black" />
              </div>
            )}
          </div>

          <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-[1.5rem] border border-gray-200 shadow-inner shrink-0 w-full sm:w-auto">
            <button onClick={() => setViewMode("table")} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaList className="hidden sm:block" /> Table</button>
            <button onClick={() => setViewMode("card")} className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaThLarge className="hidden sm:block" /> Cards</button>
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
                  <select 
                    value={getMappedStatus(item.serviceStatus || item.status)}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                    className={`px-4 py-2 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase border text-center cursor-pointer outline-none focus:ring-4 focus:ring-black/5 ${getStatusColor(item.serviceStatus || item.status)}`}
                  >
                    <option value="Cancelled" className="bg-white text-red-500 font-bold uppercase hidden">CANCELLED</option>
                    {(() => {
                      const currentStatus = getMappedStatus(item.serviceStatus || item.status);
                      const currentIndex = STATUS_STEPS.indexOf(currentStatus);
                      return STATUS_STEPS.map((status, idx) => {
                        if (currentStatus !== "Cancelled" && idx < currentIndex) return null;
                        return (
                          <option key={status} value={status} className="bg-white text-black font-bold uppercase">
                            {status.toUpperCase()}
                          </option>
                        );
                      });
                    })()}
                  </select>
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
                  {getMappedStatus(item.serviceStatus || item.status) === "Cancelled" && (
                    <div className="bg-red-50/50 p-4 rounded-3xl border border-red-100">
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Cancellation Cause</p>
                      <p className="text-xs font-bold text-red-900">{item.closeReason || "No explicit reason provided"}</p>
                      <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-2 text-right">- {item.lastUpdatedBy || "System Admin"}</p>
                    </div>
                  )}
                  <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Diagnostic Log & Parts</span>
                      {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                        <button onClick={() => handleOpenIssueModal(item)} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Edit</button>
                      )}
                    </div>
                    <div className="space-y-2">{item.issues?.length > 0 ? item.issues.map((iss, i) => <p key={i} className="text-xs font-bold text-gray-600 flex items-start gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full shrink-0 mt-1.5" /><span>{iss.issue}</span></p>) : <p className="text-xs italic text-gray-400">No log entries</p>}</div>
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
                  {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                    <button onClick={() => handleOpenIssueModal(item)} className="h-11 flex-1 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-all border border-transparent hover:border-amber-100" title="Edit Log & Parts"><FaEdit className="mr-2" /> Log</button>
                  )}
                  {["Bill Pending", "Service Completed"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                    <button onClick={() => navigate(`${pathPrefix}/addbillings`, { state: { service: item } })} className="h-11 flex-1 flex flex-col justify-center items-center rounded-xl bg-black text-white hover:bg-emerald-600 transition-all border border-transparent shadow-lg shadow-black/10 group/bill" title="Generate Bill">
                      <div className="flex items-center gap-2">
                        <FaFileInvoice /> 
                        <span className="text-[9px] font-black uppercase tracking-widest">Bill</span>
                      </div>
                      <span className="text-[7px] font-bold opacity-50 group-hover/bill:opacity-100 uppercase tracking-tighter">Ready: {getElapsedTime(item.updatedAt || item.updated_at)}</span>
                    </button>
                  )}
                  {getMappedStatus(item.serviceStatus || item.status) === "Waiting for Spare" && (
                    <button 
                      onClick={() => { setSelectedBooking(item); setCloseModalVisible(true); }} 
                      className="h-11 flex-1 flex flex-col justify-center items-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-100 group/close"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">No Response</span>
                      <span className="text-[8px] font-bold opacity-70 group-hover/close:opacity-100">{getElapsedTime(item.updatedAt || item.updated_at)}</span>
                    </button>
                  )}
                  <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-11 w-11 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100" title="View Details"><FaEye /></button>
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase tracking-widest text-xs">No service protocols found for designated metrics</div>}
          </div>
        ) : (
          <div className=" animate-fadeIn overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                <thead className="text-white">
                  <tr>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Customer</th>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Issues</th>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Spare Status</th>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Workflow</th>
                    <th className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-2 py-24 text-center">
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
                        <td className="px-2 py-2"><span className="text-xs font-black text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</span></td>

                        <td className="px-2 py-2"><span className="text-xs font-black text-blue-900">{item.bookingId || "SER-NEW"}</span><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{item.phone}</p></td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-3 group/issue">
                            <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]" title={(item.issue?.toLowerCase() === 'others' && item.otherIssue ? `Others: ${item.otherIssue}` : item.issue) || item.otherIssue || item.carIssue || "Routine Checkup"}>
                              {(item.issue?.toLowerCase() === 'others' && item.otherIssue ? `Others: ${item.otherIssue}` : item.issue) || item.otherIssue || item.carIssue || "Routine Checkup"}
                            </p>
                            {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                              <button 
                                onClick={() => handleOpenIssueModal(item)}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-all shadow-sm border border-amber-200/50"
                                title="Edit Diagnostics"
                              >
                                <FaEdit size={10} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                           {(() => {
                             const ss = getSpareStatus(item.parts);
                             return <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${ss.color}`}>{ss.label}</span>;
                           })()}
                           {getMappedStatus(item.serviceStatus || item.status) === "Cancelled" && (
                             <div className="mt-2 text-left">
                                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Cancelled By: {item.lastUpdatedBy || "System"}</p>
                                <p className="text-[9px] font-bold text-red-700 truncate max-w-[150px]" title={item.closeReason}>{item.closeReason || "Unknown Reason"}</p>
                             </div>
                           )}
                        </td>
                        <td className="px-2 py-2 text-left">
                           <select 
                             value={getMappedStatus(item.serviceStatus || item.status)}
                             onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                             className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border inline-block min-w-[150px] text-center cursor-pointer outline-none focus:ring-4 focus:ring-black/5 ${getStatusColor(item.serviceStatus || item.status)}`}
                           >
                             <option value="Cancelled" className="bg-white text-red-500 font-bold uppercase hidden">CANCELLED</option>
                             {(() => {
                               const currentStatus = getMappedStatus(item.serviceStatus || item.status);
                               const currentIndex = STATUS_STEPS.indexOf(currentStatus);
                               return STATUS_STEPS.map((status, idx) => {
                                 if (currentStatus !== "Cancelled" && idx < currentIndex) return null;
                                 return (
                                   <option key={status} value={status} className="bg-white text-black font-bold uppercase">
                                     {status.toUpperCase()}
                                   </option>
                                 );
                               });
                             })()}
                           </select>
                        </td>
                        <td className="px-2 py-2 text-left">
                          <div className="flex justify-start gap-2">
                          
                           {getMappedStatus(item.serviceStatus || item.status) === "Waiting for Spare" && (
                              <button 
                                onClick={() => { setSelectedBooking(item); setCloseModalVisible(true); }} 
                                className="h-10 px-4 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center leading-tight group/btn"
                              >
                                <span className={getHoursDifference(item.updatedAt || item.updated_at) >= 72 ? "text-red-700 group-hover/btn:text-white" : ""}>
                                  {getHoursDifference(item.updatedAt || item.updated_at) >= 72 ? "Time Out" : "No Response"}
                                </span>
                                <span className="text-[7px] font-bold opacity-60 group-hover/btn:opacity-100">{getElapsedTime(item.updatedAt || item.updated_at)}</span>
                              </button>
                            )}
                                
                            {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                              <button onClick={() => handleOpenIssueModal(item)} className="h-10 px-4 bg-gray-900 text-gray-400 hover:bg-amber-50 hover:text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Edit Log & Parts"><FaEdit /></button>
                            )}
                            {["Bill Pending", "Service Completed"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                              <button onClick={() => navigate(`${pathPrefix}/addbillings`, { state: { service: item } })} className="h-10 px-4 bg-black text-white hover:bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center leading-tight group/bill" title="Generate Bill">
                                <div className="flex items-center gap-2">
                                   <FaFileInvoice /> Bill
                                </div>
                                <span className="text-[7px] font-bold opacity-50 group-hover/bill:opacity-100 uppercase tracking-tighter">Ready: {getElapsedTime(item.updatedAt || item.updated_at)}</span>
                              </button>
                            )}
                            
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
                        <span 
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center justify-center min-w-[75px] ${
                            (entry.issueStatus || "pending") === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                            (entry.issueStatus || "pending") === "rejected" ? "bg-red-50 text-red-600 border-red-100" : 
                            "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {entry.issueStatus || "pending"}
                        </span>
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
                        <span 
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center justify-center min-w-[75px] ${
                            (part.status || "pending") === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                            (part.status || "pending") === "rejected" ? "bg-red-50 text-red-600 border-red-100" : 
                            "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {part.status || "pending"}
                        </span>
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
        {closeModalVisible && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 text-red-500">
                  <FaTimes size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Close Booking</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Provide reason for closing this service</p>
                {selectedBooking && getHoursDifference(selectedBooking.updatedAt || selectedBooking.updated_at) >= 72 && (
                  <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 py-1 px-3 rounded-full inline-block">72+ Hours since last update</p>
                )}
              </div>
              <div className="mb-6 space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Closing Reason</label>
                  <textarea 
                    value={closeReason} 
                    onChange={(e) => setCloseReason(e.target.value)} 
                    placeholder="e.g. Customer not approved spare parts / No response after 72 hours" 
                    className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-red-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCloseReason("Customer not approve spare part")} className="px-3 py-1.5 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100">Not Approved</button>
                  <button onClick={() => setCloseReason("No response from customer after 72 hours")} className="px-3 py-1.5 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100">No Response (72h)</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setCloseModalVisible(false); setCloseReason(""); setSelectedBooking(null); }} 
                  className="flex-1 rounded-xl bg-gray-100 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all font-bold"
                >
                  Back
                </button>
                <button 
                  onClick={handleCloseBooking} 
                  disabled={isClosing || !closeReason.trim()} 
                  className="flex-1 rounded-xl bg-red-600 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-20 shadow-lg shadow-red-200 font-bold"
                >
                  {isClosing ? "Closing..." : "Close Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
