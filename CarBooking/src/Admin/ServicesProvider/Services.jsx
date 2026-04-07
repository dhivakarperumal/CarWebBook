import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaEye, FaThLarge, FaList, FaPlus, FaCalendarAlt, FaClock, FaCheckCircle, FaSearch, FaWrench } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import Pagination from "../../Components/Pagination";

const BOOKING_STATUS = [
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
  const [dateFilter, setDateFilter] = useState("Today");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [partsModalVisible, setPartsModalVisible] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);

  const [editingIssueId, setEditingIssueId] = useState(null);
  const [issueText, setIssueText] = useState("");
  const [issueAmount, setIssueAmount] = useState("");

  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);

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
            servicesWithDetails.push({
              ...service,
              parts: details.parts || [],
              issues: details.issues || [],
            });
          } catch (err) {
            partsMap[service.id] = [];
            servicesWithDetails.push({
              ...service,
              parts: [],
              issues: [],
            });
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

  useEffect(() => {
    loadData();
  }, []);

  const searchedServices = useMemo(() => {
    return services.filter((s) => {
      const text = `
        ${s.bookingId || ""}
        ${s.name || ""}
        ${s.phone || ""}
        ${s.brand || ""}
        ${s.model || ""}
        ${s.vehicleNumber || ""}
      `.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;

      const bDateStr = s.created_at || s.createdAt;
      if (!bDateStr) return false;

      const bookingDate = new Date(bDateStr);
      const today = new Date();

      if (dateFilter === "Today") {
        return bookingDate.toDateString() === today.toDateString();
      } else if (dateFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return bookingDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === "This Week") {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        return bookingDate >= lastWeek;
      } else if (dateFilter === "This Month") {
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
      completed: services.filter(s => (s.serviceStatus || "").toLowerCase().includes("completed")).length
    };
  }, [services]);

  const bookedServices = searchedServices.filter((s) => !s.addVehicle);
  const addVehicleServices = searchedServices.filter((s) => s.addVehicle);

  const currentMainList =
    mainTab === "booked" ? bookedServices : addVehicleServices;

  const assignedServices = currentMainList.filter((s) => {
    const isAssigned = !!s.assignedEmployeeId;
    if (!isAssigned) return false;
    if (isMechanic) {
      return (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.displayName || "").toLowerCase();
    }
    return true;
  });

  const unassignedServices = isMechanic
    ? [] 
    : currentMainList.filter((s) => !s.assignedEmployeeId);

  const listData =
    subTab === "assigned" ? assignedServices : unassignedServices;

  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const availableEmployees = employees;

  const getStatusColor = (status) => {
    switch (status) {
      case "Booked":
      case "Approved":
        return "bg-indigo-100 text-indigo-700";
      case "Processing":
        return "bg-purple-100 text-purple-700";
      case "Waiting for Spare":
        return "bg-yellow-100 text-yellow-800";
      case "Service Going on":
        return "bg-orange-100 text-orange-700";
      case "Bill Pending":
        return "bg-pink-100 text-pink-700";
      case "Bill Completed":
        return "bg-cyan-100 text-cyan-700";
      case "Service Completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatPartStatus = (status) => {
    const normalized = (status || "pending").toLowerCase();
    if (normalized === "approved") return "Approved";
    if (normalized === "rejected") return "Rejected";
    return "Pending";
  };

  const partStatusClass = (status) => {
    const normalized = (status || "pending").toLowerCase();
    if (normalized === "approved") return "bg-green-100 text-green-700";
    if (normalized === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getServiceParts = (id) => {
    return serviceParts[id] || [];
  };

  const handleStatusChange = async (service, newStatus) => {
    if (!service.assignedEmployeeId) {
      toast.error("Assign mechanic first");
      return;
    }
    try {
      await api.put(`/all-services/${service.id}/status`, {
        serviceStatus: newStatus,
      });
      toast.success("Status updated");
      loadData();
    } catch (error) {
      toast.error("Update failed");
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

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    if (selectedBooking.assignedEmployeeId) {
      toast.error("This service already has a mechanic assigned.");
      return;
    }
    try {
      setAssigning(true);
      const emp = employees.find(
        (e) => e.id.toString() === selectedEmployeeId.toString()
      );
      if (!emp) {
        toast.error("Mechanic not found");
        return;
      }
      await api.put(`/all-services/${selectedBooking.id}/assign`, {
        assignedEmployeeId: emp.id,
        assignedEmployeeName: emp.name,
        serviceStatus: "Processing",
      });
      toast.success(`Mechanic ${emp.name} assigned!`);
      setModalVisible(false);
      setSelectedBooking(null);
      setSelectedEmployeeId("");
      loadData();
    } catch (error) {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Operations</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitor technical workflows & spare parts fulfillment</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${pathPrefix}/addserviceparts`)}
            className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
          >
            <FaPlus /> Registry Service Parts
          </button>
        </div>
      </div>

      {/* STATS ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Service Volume" 
          value={stats.total} 
          icon={<FaCalendarAlt />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Technician Assigned" 
          value={stats.assigned} 
          icon={<FaClock />} 
          gradient="from-indigo-600 to-indigo-400" 
        />
        <StatCard 
          title="Open Queue" 
          value={stats.unassigned} 
          icon={<FaWrench />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Successfully Closed" 
          value={stats.completed} 
          icon={<FaCheckCircle />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
      </div>

      {/* VIEW & CHANNEL TABS */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
          <button
            onClick={() => { setMainTab("booked"); setCurrentPage(1); }}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === "booked" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
          >
            Portal Bookings
          </button>
          <button
            onClick={() => { setMainTab("addVehicle"); setCurrentPage(1); }}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === "addVehicle" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
          >
            Direct Walk-ins
          </button>
        </div>

        <div className="flex h-[56px] bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
          >
            <FaList className="mr-2"/> Table
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
          >
            <FaThLarge className="mr-2"/> Cards
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 relative group">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Track booking, customer, vehicle ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="lg:col-span-8 flex flex-wrap items-center justify-end gap-3">
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-[56px] px-8 bg-white border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm"
          >
            <option value="All Time">Full History</option>
            <option value="Today">Today Only</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">Last 7 Days</option>
            <option value="This Month">Last 30 Days</option>
          </select>

          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
            <button
              onClick={() => setSubTab("assigned")}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === "assigned" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-600"}`}
            >
              Assigned ({stats.assigned})
            </button>
            <button
              onClick={() => setSubTab("unassigned")}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === "unassigned" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-600"}`}
            >
              Pending ({stats.unassigned})
            </button>
          </div>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pb-24">
          {paginatedData.map((item) => {
            const currentStepIndex = STATUS_STEPS.indexOf(item.serviceStatus || "Booked");
            return (
              <div key={item.id} className="relative rounded-2xl bg-white p-6 shadow-sm border border-gray-200 transition-all hover:shadow-lg flex flex-col">
                <div className="flex-1">
                  <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(item.serviceStatus)}`}>
                    {item.serviceStatus || "Booked"}
                  </div>
                  <div className="mt-2 flex flex-col space-y-3">
                    <h3 className="text-xl font-black text-gray-900">{item.bookingId || `SER-${item.id}`}</h3>
                    <div>
                      <p className="text-md font-bold text-gray-800">{item.name || "Unknown Customer"}</p>
                      <p className="text-sm text-gray-500">{item.phone || "No Phone"}</p>
                    </div>
                    <div>
                      <p className="text-md font-bold text-blue-600">{item.vehicleNumber || "No Plate Info"}</p>
                      <p className="text-sm text-gray-500">{item.brand || ""} {item.model || ""}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Service Issues</p>
                        {item.assignedEmployeeName && (
                          <button onClick={() => {
                            setEditingIssueId(item.id);
                            const initialIssues = (item.issues || []).map((issue) => ({ ...issue }));
                            setIssueEntries(initialIssues);
                            setIssueModalVisible(true);
                          }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaEdit size={10} />
                          </button>
                        )}
                      </div>
                      {(item.issues && item.issues.length > 0) ? (
                        <div className="space-y-2">
                          {item.issues.map((issueEntry, index) => (
                            <div key={issueEntry.id || index} className="bg-white rounded-lg p-2 border border-gray-200">
                              <p className="text-xs text-gray-700 font-semibold">{issueEntry.issue}</p>
                              {Number(issueEntry.issueAmount) > 0 && <p className="text-[10px] text-gray-500">₹{Number(issueEntry.issueAmount).toFixed(2)}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-[10px] text-gray-400 italic">No issues added yet.</p>}
                    </div>
                  </div>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4 flex flex-wrap gap-2">
                  {!item.assignedEmployeeId && (
                    <button onClick={() => { setSelectedBooking(item); setModalVisible(true); }} className="flex-1 rounded-xl bg-black px-4 py-2.5 text-[10px] font-black text-white hover:bg-gray-800 transition-all uppercase tracking-widest shadow-lg shadow-black/10">
                      Assign Mechanic
                    </button>
                  )}
                  <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-10 w-10 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all">
                    <FaEye />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="h-10 w-10 flex justify-center items-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100 transition-all">
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
          {paginatedData.length === 0 && <div className="col-span-full py-20 text-center text-gray-500">No services found.</div>}
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">S No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Technician</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Workflow</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition duration-200">
                  <td className="px-6 py-4 font-black text-xs text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4 font-black text-xs text-blue-600">{item.bookingId || `SER-${item.id}`}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{item.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-blue-900">{item.vehicleNumber || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{item.brand} {item.model}</p>
                  </td>
                  <td className="px-6 py-4">
                    {item.assignedEmployeeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-100 uppercase">
                          {item.assignedEmployeeName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{item.assignedEmployeeName}</span>
                      </div>
                    ) : (
                      <button onClick={() => { setSelectedBooking(item); setModalVisible(true); }} className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">Pending Assignment</button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border tracking-wider uppercase ${getStatusColor(item.serviceStatus)}`}>
                      {item.serviceStatus || "Booked"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`${pathPrefix}/services/${item.id}`)} className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-blue-100">
                        <FaEye size={12} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* ASSIGN MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl border border-white">
            <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-lg shadow-blue-500/10">
                    <FaUserCheck size={24}/>
                </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Assign Mechanic</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Select personnel for deployment</p>
            </div>
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Technician Database</label>
              <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-inner">
                <option value="">-- Select Personnel --</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModalVisible(false); setSelectedEmployeeId(""); }} className="flex-1 rounded-2xl bg-gray-100 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={assignEmployee} disabled={assigning || !selectedEmployeeId} className="flex-1 rounded-2xl bg-black py-4 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-black/10 disabled:opacity-20">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {issueModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] bg-white shadow-2xl border border-white p-8">
            <div className="mb-6 flex justify-between items-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FaWrench size={20}/>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Service Log</h2>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Manage diagnostic entries</p>
                  </div>
                </div>
                <button onClick={() => { setIssueModalVisible(false); setEditingIssueId(null); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <FaTimes />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
              {issueEntries.map((entry, idx) => (
                <div key={idx} className="p-6 border border-gray-100 rounded-3xl bg-gray-50/30 hover:bg-white hover:shadow-xl transition-all duration-300">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Entry #{idx + 1}</span>
                     <button onClick={() => { const copy = [...issueEntries]; copy.splice(idx, 1); setIssueEntries(copy); }} className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline">Revoke</button>
                   </div>
                  <textarea value={entry.issue || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issue: e.target.value }; setIssueEntries(copy); }} className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-xs font-bold text-gray-700 focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-inner" rows={3} placeholder="Technical description..."/>
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">₹</span>
                        <input type="number" value={entry.issueAmount || ""} onChange={(e) => { const copy = [...issueEntries]; copy[idx] = { ...copy[idx], issueAmount: e.target.value }; setIssueEntries(copy); }} placeholder="Valuation" className="w-full pl-8 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-black/5 shadow-inner" />
                    </div>
                    <div className="flex items-center px-4 bg-white border border-gray-100 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-2">Status:</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${entry.issueStatus === "approved" ? "text-emerald-600" : "text-amber-600"}`}>{entry.issueStatus || "pending"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
               <button onClick={() => setIssueEntries([...issueEntries, { issue: '', issueAmount: '', issueStatus: 'pending' }])} className="px-6 py-3 rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Append Work Entry</button>
               <button onClick={async () => {
                  try {
                    const toSave = issueEntries.filter(e => e.issue?.trim());
                    for (const entry of toSave) {
                      if (entry.id) await api.put(`/all-services/${editingIssueId}/issues/${entry.id}`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0) });
                      else await api.post(`/all-services/${editingIssueId}/issues`, { issue: entry.issue.trim(), issueAmount: Number(entry.issueAmount || 0) });
                    }
                    toast.success('Service log synchronized'); setIssueModalVisible(false); setEditingIssueId(null); loadData();
                  } catch (error) { toast.error('Sync failed'); }
               }} className="flex-1 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10">Synchronize Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { FaUserCheck, FaTimes } from "react-icons/fa";
