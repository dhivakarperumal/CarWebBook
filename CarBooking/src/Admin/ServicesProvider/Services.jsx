import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaEye, FaThLarge, FaList, FaPlus, FaCalendarAlt, FaClock, FaCheckCircle, FaSearch, FaWrench, FaUserCheck, FaTimes } from "react-icons/fa";
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

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";
  const pathPrefix = location.pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [viewMode, setViewMode] = useState("table"); 
  const [mainTab, setMainTab] = useState("booked"); 
  const [subTab, setSubTab] = useState("assigned"); 
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [issueEntries, setIssueEntries] = useState([]);
  const [serviceParts, setServiceParts] = useState({});
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
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
    return {
      total: services.length,
      assigned: services.filter(s => !!s.assignedEmployeeId).length,
      unassigned: services.filter(s => !s.assignedEmployeeId).length,
      completed: services.filter(s => (s.serviceStatus || s.status || "").toLowerCase().includes("completed")).length
    };
  }, [services]);

  const currentMainList = mainTab === "booked" ? searchedServices.filter(s => !s.addVehicle) : searchedServices.filter(s => s.addVehicle);
  const assignedServices = currentMainList.filter(s => {
    if (!s.assignedEmployeeId) return false;
    if (isMechanic) return (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.displayName || "").toLowerCase();
    return true;
  });
  const unassignedServices = isMechanic ? [] : currentMainList.filter(s => !s.assignedEmployeeId);
  const listData = subTab === "assigned" ? assignedServices : unassignedServices;

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

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Operations</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitor technical workflows & spare parts fulfillment</p>
        </div>
        <button onClick={() => navigate(`${pathPrefix}/addserviceparts`)} className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"><FaPlus /> Registry Service Parts</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Service Volume" value={stats.total} icon={<FaCalendarAlt />} gradient="from-blue-600 to-blue-400" />
        <StatCard title="Technician Assigned" value={stats.assigned} icon={<FaClock />} gradient="from-indigo-600 to-indigo-400" />
        <StatCard title="Open Queue" value={stats.unassigned} icon={<FaWrench />} gradient="from-amber-600 to-amber-400" />
        <StatCard title="Successfully Closed" value={stats.completed} icon={<FaCheckCircle />} gradient="from-emerald-600 to-emerald-400" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner overflow-x-auto no-scrollbar w-full lg:w-auto">
          <button onClick={() => { setMainTab("booked"); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mainTab === "booked" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-gray-600"}`}>Portal Bookings</button>
          <button onClick={() => { setMainTab("addVehicle"); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mainTab === "addVehicle" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-gray-600"}`}>Direct Walk-ins</button>
        </div>

        <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner shrink-0">
          <button onClick={() => setViewMode("table")} className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaList /> Table</button>
          <button onClick={() => setViewMode("card")} className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}><FaThLarge /> Cards</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group w-full lg:max-w-xs xl:max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all" />
          <input type="text" placeholder="Track booking, customer, vehicle ID..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-15 pr-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-inner" />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-3 w-full lg:w-auto">
          <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm min-w-[160px]">
            <option value="All Time">Full History</option>
            <option value="Today">Today Only</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">Last 7 Days</option>
            <option value="This Month">Last 30 Days</option>
          </select>

          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button onClick={() => setSubTab("assigned")} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === "assigned" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-600"}`}>Assigned ({assignedServices.length})</button>
            <button onClick={() => setSubTab("unassigned")} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === "unassigned" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-600"}`}>Pending ({unassignedServices.length})</button>
          </div>
        </div>
      </div>

      <>
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {paginatedData.map((item) => (
            <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><FaWrench size={80}/></div>
               <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">SERVICE ID</span>
                  <p className="text-sm font-black text-blue-900">{item.bookingId || `SER-${item.id}`}</p>
                </div>
                <select 
                  value={getMappedStatus(item.serviceStatus || item.status)}
                  onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                  className={`px-4 py-2 rounded-[1.5rem] text-[10px] font-black tracking-widest border transition-all outline-none cursor-pointer appearance-none text-center ${getStatusColor(item.serviceStatus || item.status)}`}
                >
                  {STATUS_STEPS.map(s => <option key={s} value={s} className="bg-white text-black normal-case text-left">{s}</option>)}
                </select>
              </div>
              <div className="space-y-5 flex-1 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{item.brand} {item.model}</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-xl border border-blue-100 mt-1">{item.vehicleNumber || "UNSPECIFIED"}</p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 font-bold text-xs uppercase">{item.name?.charAt(0)}</div>
                    <div><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Client</p><p className="text-sm font-black text-gray-800">{item.name}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 text-xs"><FaClock /></div>
                     <div><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Allocation</p><p className="text-sm font-bold text-gray-500">{item.assignedEmployeeName || "Pending Assignment"}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 overflow-hidden">
                   <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Diagnostic Log & Parts</span><button onClick={() => handleOpenIssueModal(item)} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Edit</button></div>
                   <div className="space-y-2">{item.issues?.slice(0, 2).map((iss, i) => <p key={i} className="text-xs font-bold text-gray-600 line-clamp-1 flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full" />{iss.issue}</p>) || <p className="text-xs italic text-gray-400">No log entries</p>}</div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-50 flex gap-3">
                 {!item.assignedEmployeeId && <button onClick={() => { setSelectedBooking(item); setModalVisible(true); }} className="flex-1 rounded-2xl bg-black py-4 text-[10px] font-black text-white hover:bg-blue-600 transition-all uppercase tracking-widest">Assign Technician</button>}
                 {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                   <button onClick={() => navigate(`${pathPrefix}/addserviceparts`, { state: { service: item } })} className="h-12 w-12 flex justify-center items-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Add Parts"><FaPlus /></button>
                 )}
                                   <button onClick={() => handleOpenIssueModal(item)} className="h-12 w-12 flex justify-center items-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-all" title="Edit Log & Parts"><FaEdit /></button>
                 <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-12 w-12 flex justify-center items-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all" title="View Details"><FaEye /></button>
                 <button onClick={() => handleDelete(item.id)} className="h-12 w-12 flex justify-center items-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete"><FaTrash /></button>
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
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Vehicle Spec</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Issues</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Mechanic Allocation</th>
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
                          <FaWrench size={24}/>
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
                      <div className="flex items-center gap-2 mb-1"><p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.brand} {item.model}</p></div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.vehicleNumber || "UNSPECIFIED"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]" title={item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}>
                        {item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {item.assignedEmployeeName ? (
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black border border-blue-100 uppercase">{item.assignedEmployeeName.charAt(0)}</div><span className="text-xs font-black text-gray-700">{item.assignedEmployeeName}</span></div>
                      ) : (
                        <button onClick={() => { setSelectedBooking(item); setModalVisible(true); }} className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">Pending Assignment</button>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <select
                        value={getMappedStatus(item.serviceStatus || item.status)}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black border tracking-widest uppercase transition-all outline-none cursor-pointer appearance-none text-center ${getStatusColor(item.serviceStatus || item.status)}`}
                      >
                        {STATUS_STEPS.map(s => <option key={s} value={s} className="bg-white text-black normal-case text-left">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {["Processing", "Waiting for Spare", "Service Going on"].includes(getMappedStatus(item.serviceStatus || item.status)) && (
                          <button onClick={() => navigate(`${pathPrefix}/addserviceparts`, { state: { service: item } })} className="h-10 px-4 bg-gray-50 text-gray-400 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Add Parts"><FaPlus /></button>
                        )}
                        <button onClick={() => handleOpenIssueModal(item)} className="h-10 px-4 bg-gray-50 text-gray-400 hover:bg-amber-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Edit Log & Parts"><FaEdit /></button>
                        <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-10 px-4 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="View Details"><FaEye /></button>
                        <button onClick={() => handleDelete(item.id)} className="h-10 px-4 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Delete"><FaTrash /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm shadow-2xl">
          <div className="w-full max-w-md rounded-[3rem] bg-white p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-black/20"><FaUserCheck size={28}/></div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mechanic Load</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Personnel Authorization Protocol</p>
            </div>
            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Technician Registry</label>
              <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full rounded-[1.5rem] border border-gray-100 bg-gray-50 px-6 py-4.5 text-xs font-black text-gray-800 focus:bg-white focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner uppercase tracking-wider">
                <option value="">-- AUTHORIZE PERSONNEL --</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setModalVisible(false); setSelectedEmployeeId(""); }} className="flex-1 rounded-[1.5rem] bg-gray-100 py-4.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={assignEmployee} disabled={assigning || !selectedEmployeeId} className="flex-1 rounded-[1.5rem] bg-black py-4.5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 disabled:opacity-20">Assign</button>
            </div>
          </div>
        </div>
      )}

      {issueModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-[3rem] bg-white shadow-2xl border border-white animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"><FaWrench size={24}/></div>
                  <div><h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Log Registry</h2><p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Diagnostics & Spare Parts</p></div>
                </div>
                <button onClick={() => { setIssueModalVisible(false); setEditingIssueId(null); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 transition-all shadow-sm"><FaTimes size={18} /></button>
            </div>
            
            <div className="flex px-10 bg-gray-50/50 border-b border-gray-100">
               <button onClick={() => setActiveModalTab("issues")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "issues" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}>Diagnostic Issues</button>
               <button onClick={() => setActiveModalTab("parts")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === "parts" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}>Spare Parts</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
              {activeModalTab === "issues" ? (
                <>
                  {issueEntries.map((entry, idx) => (
                    <div key={idx} className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50/30 hover:bg-white hover:shadow-2xl transition-all duration-500">
                       <div className="flex items-center justify-between mb-5"><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-4 py-1.5 bg-white rounded-full border border-gray-100">LOG ENTRY #{idx + 1}</span><button onClick={() => { const copy = [...issueEntries]; copy.splice(idx, 1); setIssueEntries(copy); }} className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline px-4">Remove Entry</button></div>
                      <textarea value={entry.issue || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issue: e.target.value }; setIssueEntries(copy); }} className="w-full bg-white border border-gray-100 rounded-[1.5rem] p-5 text-xs font-bold text-gray-700 focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner" rows={3} placeholder="Provide technical diagnostic details..."/>
                      <div className="mt-5 flex gap-4">
                         <div className="flex-1 relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">₹</span><input type="number" value={entry.issueAmount || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issueAmount: e.target.value }; setIssueEntries(copy); }} placeholder="Valuation Amount" className="w-full pl-10 pr-6 py-4 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-800 outline-none focus:ring-8 focus:ring-black/5 shadow-inner" /></div>
                         <select value={entry.issueStatus || "pending"} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issueStatus: e.target.value }; setIssueEntries(copy); }} className={`px-6 py-4 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none ${entry.issueStatus === "approved" ? "text-emerald-500" : entry.issueStatus === "rejected" ? "text-red-500" : "text-amber-500 font-bold"}`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
                      </div>
                    </div>
                  ))}
                  {issueEntries.length === 0 && <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-gray-100 rounded-[3rem]">Initial diagnostic log empty</div>}
                </>
              ) : (
                <>
                  {editingParts.map((part, idx) => (
                    <div key={idx} className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50/30 hover:bg-white hover:shadow-2xl transition-all duration-500">
                       <div className="flex items-center justify-between mb-5"><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-4 py-1.5 bg-white rounded-full border border-gray-100">PART REQUEST #{idx + 1}</span><button onClick={() => { const copy = [...editingParts]; copy.splice(idx, 1); setEditingParts(copy); }} className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline px-4">Remove Part</button></div>
                      <input type="text" value={part.partName || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], partName: e.target.value }; setEditingParts(copy); }} className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 text-xs font-bold text-gray-700 focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner" placeholder="Part Name" />
                      <div className="mt-5 flex gap-4">
                         <div className="flex-1 relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</span><input type="number" value={part.qty || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], qty: e.target.value }; setEditingParts(copy); }} placeholder="Qty" className="w-full pl-16 pr-6 py-4 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-800 outline-none focus:ring-8 focus:ring-black/5 shadow-inner" /></div>
                         <div className="flex-1 relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">₹</span><input type="number" value={part.price || ""} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], price: e.target.value }; setEditingParts(copy); }} placeholder="Price" className="w-full pl-10 pr-6 py-4 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-800 outline-none focus:ring-8 focus:ring-black/5 shadow-inner" /></div>
                         <select value={part.status || "pending"} onChange={(e) => { const copy = [...editingParts]; copy[idx] = { ...copy[idx], status: e.target.value }; setEditingParts(copy); }} className={`px-6 py-4 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none ${part.status === "approved" ? "text-emerald-500" : part.status === "rejected" ? "text-red-500" : "text-amber-500 font-bold"}`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
                      </div>
                    </div>
                  ))}
                  {editingParts.length === 0 && <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-gray-100 rounded-[3rem]">No spare parts requested</div>}
                </>
              )}
            </div>
            
            <div className="px-10 py-6 pb-12 border-t border-gray-100 bg-gray-50/50 flex gap-4">
               {activeModalTab === "issues" ? (
                 <button onClick={() => setIssueEntries([...issueEntries, { issue: '', issueAmount: '', issueStatus: 'pending' }])} className="px-8 py-4 rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Append Work Entry</button>
               ) : (
                 <button onClick={() => setEditingParts([...editingParts, { partName: '', qty: 1, price: 0, status: 'pending' }])} className="px-8 py-4 rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Append Spare Part</button>
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
                       await api.post(`/all-services/${editingIssueId}/parts`, { parts: partsToSave.map(p => ({ ...p, status: p.status || 'pending'})) });
                    }

                    // Update main issue amounts if necessary based on first entry
                    if (issuesToSave.length > 0) {
                       await api.put(`/all-services/${editingIssueId}/issue`, { 
                         issue: issuesToSave[0].issue, 
                         issueAmount: Number(issuesToSave[0].issueAmount || 0) 
                       });
                    }

                    toast.success('Manifest synchronized successfully'); 
                    setIssueModalVisible(false); 
                    setEditingIssueId(null); 
                    setActiveModalTab("issues");
                    loadData();
                  } catch (error) { toast.error('Synchronization failed'); }
               }} className="flex-1 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10">Synchronize Manifest</button>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  );
}
