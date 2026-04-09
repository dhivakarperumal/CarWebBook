import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAppointments, updateAppointment } from "../../api";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaUserCog,
  FaClock,
  FaFilter,
  FaEye,
  FaWrench,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaCarSide,
  FaPhoneAlt,
  FaPlus,
  FaSearch,
  FaList,
  FaThLarge,
  FaUserSlash,
  FaUserCheck,
  FaClipboardCheck,
} from "react-icons/fa";
import { LayoutGrid, Calendar, X } from "lucide-react";
import Pagination from "../../Components/Pagination";

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-default">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
    <div className={`w-13 h-13 ${colorClass} rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
      {icon}
    </div>
  </div>
);

const STATUS_OPTIONS = [
  "Appointment Booked",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled"
];

// Global cache to prevent re-loading flsh on navigation
let appointmentCache = null;
let technicianCache = null;

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState(appointmentCache || []);
  const [loading, setLoading] = useState(!appointmentCache);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const openModal = (apt) => {
    setSelectedAppointment(apt);
    setPendingChanges({});
  };
  const [technicians, setTechnicians] = useState(technicianCache || []);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("unassigned");
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table"); 
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, techRes] = await Promise.all([
        getAllAppointments(),
        api.get('/staff')
      ]);
      const data = appRes.data || [];
      const techs = techRes.data?.filter(s => s.role === 'mechanic' || s.role === 'technician') || [];
      
      setAppointments(data);
      setTechnicians(techs);
      
      appointmentCache = data;
      technicianCache = techs;
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedAppointment || Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    try {
      await updateAppointment(selectedAppointment.id, pendingChanges);
      toast.success("Appointment updated successfully");
      setPendingChanges({});
      setSelectedAppointment(null);
      loadData();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = appointments.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = !searchTerm ||
      a.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm);

    // Named date filter based on preferredDate
    let matchesDate = true;
    if (dateFilter !== 'All Time') {
      const apptDate = a.preferredDate ? new Date(a.preferredDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!apptDate) {
        matchesDate = false;
      } else if (dateFilter === 'Today') {
        const d = new Date(apptDate);
        d.setHours(0, 0, 0, 0);
        matchesDate = d.getTime() === today.getTime();
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const d = new Date(apptDate);
        d.setHours(0, 0, 0, 0);
        matchesDate = d.getTime() === yesterday.getTime();
      } else if (dateFilter === 'This Week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        matchesDate = new Date(apptDate) >= lastWeek;
      } else if (dateFilter === 'This Month') {
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        matchesDate = new Date(apptDate) >= lastMonth;
      }
    }

    const matchesAssignment = assignmentFilter === 'all' ||
      (assignmentFilter === 'assigned' ? !!a.assignedEmployeeId : !a.assignedEmployeeId);

    return matchesStatus && matchesDate && matchesSearch && matchesAssignment;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const assignedCount = appointments.filter(a => !!a.assignedEmployeeId && a.status !== 'Completed' && a.status !== 'Cancelled').length;
  const unassignedCount = appointments.filter(a => !a.assignedEmployeeId && a.status !== 'Completed' && a.status !== 'Cancelled').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
  const inProgressCount = appointments.filter(a => a.status === 'In Progress').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const totalActive = unassignedCount + assignedCount;

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Appointment Booked': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In Progress': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen space-y-10">
      {/* HEADER SECTION */}
      {/* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Service Appointments</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage scheduling, technicians, and service manifests</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/book-appointment")}
            className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
          >
            <FaPlus /> Add Appointment
          </button>
        </div>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Lifetime" 
          value={appointments.length} 
          icon={<LayoutGrid size={24} />} 
          colorClass="bg-blue-500 shadow-blue-500/40" 
        />
        <StatCard 
          title="Unassigned" 
          value={unassignedCount} 
          icon={<FaUserSlash />} 
          colorClass="bg-amber-500 shadow-amber-500/40" 
        />
        <StatCard 
          title="Assigned" 
          value={assignedCount} 
          icon={<FaUserCheck />} 
          colorClass="bg-indigo-500 shadow-indigo-500/40" 
        />
        <StatCard 
          title="Confirmed" 
          value={confirmedCount} 
          icon={<FaClipboardCheck />} 
          colorClass="bg-emerald-500 shadow-emerald-500/40" 
        />
       
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group flex-1 max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all duration-300" />
          <input
            type="text"
            placeholder="Search ID, customer, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-4.5 bg-white border border-gray-100 rounded-[2rem] focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all duration-500 font-bold text-gray-700 shadow-xl shadow-slate-200/50"
          />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* ASSIGNMENT QUICK TABS */}
          <div className="flex items-center gap-2 border-r border-gray-100 pr-4 mr-2">
            {[
              { id: "unassigned", label: `Unassigned (${unassignedCount})`, color: "text-amber-600" },
              { id: "assigned", label: `Assigned (${assignedCount})`, color: "text-indigo-600" }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => { 
                  setAssignmentFilter(assignmentFilter === s.id ? 'all' : s.id);
                  setCurrentPage(1); 
                }}
                className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  assignmentFilter === s.id 
                  ? "bg-black text-white shadow-xl scale-105" 
                  : `bg-gray-50 ${s.color} hover:bg-gray-100`}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* STATUS SELECT */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-inner whitespace-nowrap"
          >
            <option value="all">Global Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* DATE FILTER */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-inner whitespace-nowrap"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="All Time">Full History</option>
          </select>

          {/* VIEW TOGGLE */}
          <div className="flex h-[56px] bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaList />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
              <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No appointments found</p>
            </div>
          ) : paginated.map((apt) => (
            <div key={apt.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <LayoutGrid size={80} className="text-blue-900" />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">{apt.appointmentId}</p>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{apt.brand} {apt.model}</h3>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest uppercase shadow-sm ${getStatusColor(apt.status)}`}>
                  {apt.status}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-50 group-hover:border-white transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                    <FaUserCog size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-bold text-gray-700">{apt.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-50 group-hover:border-white transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Schedule</p>
                    <p className="text-sm font-bold text-gray-700">{new Date(apt.preferredDate).toLocaleDateString()} • {apt.preferredTimeSlot}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border ${apt.assignedEmployeeName ? 'bg-sky-50 text-sky-600 border-sky-100 uppercase' : 'bg-amber-50 text-amber-600 border-amber-100 italic'}`}>
                    {apt.assignedEmployeeName ? apt.assignedEmployeeName.charAt(0) : '?'}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {apt.assignedEmployeeName || 'Unassigned'}
                  </span>
                </div>
                <button 
                  onClick={() => openModal(apt)}
                  disabled={!!apt.assignedEmployeeId}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${apt.assignedEmployeeId ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {apt.assignedEmployeeId ? 'Assigned' : 'Manage'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
              <div className="overflow-hidden bg-white rounded-lg shadow-2xl shadow-blue-900/5 border border-gray-100  overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black text-white">
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">S No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Appointment ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Vehicle</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Schedule</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Technician</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-400">No appointments found</td></tr>
              ) : paginated.map((apt, index) => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition duration-300 group">
                  <td className="px-8 py-6 font-black text-xs text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-8 py-6 font-black text-xs text-sky-500 uppercase tracking-widest">{apt.appointmentId}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">{apt.name}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-0.5">{apt.phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">{apt.brand} {apt.model}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{apt.registrationNumber}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-sky-500 text-[10px]" />
                      <span className="text-xs font-black text-slate-700">{new Date(apt.preferredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <FaClock className="text-slate-300 text-[10px]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apt.preferredTimeSlot}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {apt.assignedEmployeeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-[10px] font-black text-sky-600 border border-sky-100 uppercase">
                          {apt.assignedEmployeeName.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-slate-700">{apt.assignedEmployeeName}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-amber-500 italic uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Unassigned</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-[0.1em] uppercase shadow-sm ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => openModal(apt)}
                      disabled={!!apt.assignedEmployeeId}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${apt.assignedEmployeeId ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}
                    >
                      {apt.assignedEmployeeId ? 'Assigned' : 'Manage'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        {totalPages > 1 && (
          <div className="p-6 bg-gray-50/30 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

      {/* Details & Assignment Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <FaWrench size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Appointment Details</h3>
                  <p className="text-xs text-sky-500 font-bold uppercase tracking-widest">{selectedAppointment.appointmentId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-gray-200 rounded-lg transition">
                <FaTimesCircle className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] grid md:grid-cols-2 gap-8">

              {/* Left Column: Info */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Info</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200"><FaUserCog className="text-gray-400 text-xs" /></div>
                      <span className="text-sm font-bold">{selectedAppointment.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200"><FaPhoneAlt className="text-gray-400 text-xs" /></div>
                      <span className="text-sm text-gray-600">{selectedAppointment.phone}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shrink-0"><FaMapMarkerAlt className="text-gray-400 text-xs" /></div>
                      <span className="text-xs text-gray-500 leading-relaxed">{selectedAppointment.address}, {selectedAppointment.city} - {selectedAppointment.pincode}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Vehicle Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Type', v: selectedAppointment.vehicleType },
                      { l: 'Brand', v: selectedAppointment.brand },
                      { l: 'Model', v: selectedAppointment.model },
                      { l: 'Reg. No', v: selectedAppointment.registrationNumber },
                      { l: 'Fuel', v: selectedAppointment.fuelType },
                      { l: 'Year', v: selectedAppointment.yearOfManufacture },
                    ].map(item => (
                      <div key={item.l} className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{item.l}</p>
                        <p className="text-sm font-bold text-gray-800">{item.v || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Management */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Service Management</h4>
                  <div className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    {/* Status Update */}
                    <div className="space-y-2">
  <label className="text-xs font-bold text-gray-600 ml-1">
    Current Status
  </label>

  <select
    value={pendingChanges.status ?? selectedAppointment.status}
    onChange={(e) => {
      const value = e.target.value;

      setSelectedAppointment((prev) => {
        const updated = { ...prev, status: value };
        if (value === "Cancelled") {
          updated.assignedEmployeeId = null;
          updated.assignedEmployeeName = null;
        }
        return updated;
      });

      setPendingChanges((prev) => {
        const updated = { ...prev, status: value };
        if (value === "Cancelled") {
          updated.assignedEmployeeId = null;
          updated.assignedEmployeeName = null;
        }
        return updated;
      });
    }}
    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition-all"
  >
    {STATUS_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>
                    

                    {/* Mechanic Assignment */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-600">Assign Technician</label>
                        {(pendingChanges.status ?? selectedAppointment.status) !== 'Confirmed' && (
                          <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter bg-amber-50 px-2 py-0.5 rounded">Status must be "Confirmed" to assign</span>
                        )}
                      </div>
                      <select
                        disabled={(pendingChanges.status ?? selectedAppointment.status) !== 'Confirmed'}
                        value={pendingChanges.assignedEmployeeId ?? selectedAppointment.assignedEmployeeId ?? ""}
                        onChange={(e) => {
                          const tech = technicians.find(t => t.id === Number(e.target.value));
                          setPendingChanges(prev => ({
                            ...prev,
                            assignedEmployeeId: tech?.id || null,
                            assignedEmployeeName: tech?.name || null
                          }));
                        }}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold bg-gray-50 outline-none transition-all ${
                          (pendingChanges.status ?? selectedAppointment.status) === 'Confirmed' 
                            ? 'focus:ring-2 focus:ring-sky-500/20' 
                            : 'opacity-50 cursor-not-allowed bg-gray-100'
                        }`}
                      >
                        <option value="">Unassigned</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                      </select>
                    </div>

                    {/* Time Slot confirmed */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 ml-1">Confirm/Update Time Slot</label>
                      <select
                        value={pendingChanges.preferredTimeSlot ?? selectedAppointment.preferredTimeSlot}
                        onChange={(e) => setPendingChanges(prev => ({ ...prev, preferredTimeSlot: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option>Morning (9AM–12PM)</option>
                        <option>Afternoon (12PM–4PM)</option>
                        <option>Evening (4PM–7PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <h5 className="text-[10px] font-black text-amber-600 uppercase mb-2">Customer Problem Description</h5>
                  <p className="text-sm text-amber-900 leading-relaxed italic">"{selectedAppointment.otherIssue || 'No specific issue described'}"</p>
                </div>
              </div>

            </div>

            {/* Modal Footer - Save Button */}
            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving || Object.keys(pendingChanges).length === 0}
                className="px-8 py-2.5 rounded-xl bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-lg shadow-black/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
