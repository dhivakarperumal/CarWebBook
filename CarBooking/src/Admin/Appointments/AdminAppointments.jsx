import React, { useState, useEffect, useMemo } from "react";
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
  FaThLarge,
  FaTable,
  FaHashtag,
  FaBriefcase,
  FaUserTie,
  FaMotorcycle
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const STATUS_OPTIONS = [
  "Appointment Booked",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled"
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

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [view, setView] = useState("table"); // "table" | "card"

  const openModal = (apt) => {
    setSelectedAppointment(apt);
    setPendingChanges({});
  };
  const [technicians, setTechnicians] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
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
      setAppointments(appRes.data || []);
      setTechnicians(techRes.data?.filter(s => s.role === 'mechanic' || s.role === 'technician') || []);
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
      a.phone?.includes(searchTerm) ||
      a.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'All Time') {
      const apptDateStr = a.preferredDate || a.preferred_date;
      const apptDate = apptDateStr ? new Date(apptDateStr) : null;
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
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "Appointment Booked").length,
      inProgress: appointments.filter(a => a.status === "In Progress" || a.status === "Confirmed").length,
      completed: appointments.filter(a => a.status === "Completed").length
    };
  }, [appointments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Appointment Booked': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Appointment Scheduler</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Orchestrate service appointments & technician loading</p>
        </div>

        <button
          onClick={() => navigate("/admin/book-appointment")}
          className="h-[56px] px-10 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
        >
          <FaPlus /> New Appointment Entry
        </button>
      </div>

      {/* STATS ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Service Requests" 
          value={stats.total} 
          icon={<FaCalendarAlt />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Pending Review" 
          value={stats.pending} 
          icon={<FaClock />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Active Jobs" 
          value={stats.inProgress} 
          icon={<FaWrench />} 
          gradient="from-indigo-600 to-indigo-400" 
        />
        <StatCard 
          title="Successfully Closed" 
          value={stats.completed} 
          icon={<FaCheckCircle />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
      </div>

      {/* FILTERS WORKFLOW CONSOLIDATION - SINGLE ROW OPTIMIZATION */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="relative group w-full lg:max-w-xs xl:max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all duration-300" />
          <input
            type="text"
            placeholder="Search ID, Customer, Phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-15 pr-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all duration-300 font-bold text-gray-700 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm transition-all"
          >
            <option value="all">Global Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>

          <select
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm transition-all"
          >
            <option value="Today">Today Only</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="All Time">Full History</option>
          </select>

          <div className="flex h-[56px] bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaTable /> Table
            </button>
            <button
              onClick={() => setView("card")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaThLarge /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Viewport */}
      {view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {paginated.map((apt) => (
            <div
              key={apt.id}
              className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-sky-100 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                {apt.vehicleType === 'bike' ? <FaMotorcycle size={80}/> : <FaCarSide size={80} />}
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none block mb-1">APPT ID</span>
                  <p className="text-sm font-black text-sky-900">{apt.appointmentId}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest border transition-all ${getStatusColor(apt.status)}`}>
                  {(apt.status || "BOOKED").toUpperCase()}
                </div>
              </div>

              <div className="space-y-5 flex-1 relative z-10">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${apt.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>
                        {apt.vehicleType || 'Car'}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-sky-600 transition-colors uppercase">{apt.brand} {apt.model}</h3>
                   </div>
                   <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest bg-sky-50 w-fit px-3 py-1 rounded-xl border border-sky-100">{apt.registrationNumber || "UNSPECIFIED"}</p>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                      <FaUserTie size={14}/>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Subscriber Profile</p>
                      <p className="text-sm font-black text-gray-800">{apt.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 text-xs">
                      <FaBriefcase />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Provision Type</p>
                      <p className="text-sm font-bold text-gray-500">{apt.serviceType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                   <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-sky-500" size={14}/>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{new Date(apt.preferredDate || apt.preferred_date).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <FaClock className="text-amber-500" size={14}/>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{apt.preferredTimeSlot}</span>
                   </div>
                </div>
              </div>

              <button
                onClick={() => openModal(apt)}
                className="mt-8 w-full bg-black text-white font-black py-4 rounded-2xl shadow-xl hover:bg-sky-600 transition-all duration-300 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
              >
                <FaUserCog /> Manage Parameters
              </button>
            </div>
          ))}
          {paginated.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase tracking-widest text-xs">No schedule found for designated metrics</div>}
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-lg shadow-2xl shadow-blue-900/5 border border-gray-100 animate-fadeIn">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">S No</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Identifier</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Client Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Vehicle Spec</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Workstream</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Schedule Log</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest text-center">Status protocol</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100 text-gray-300">
                          <FaWrench size={24}/>
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No active scheduling protocols found for criteria</p>
                     </div>
                  </td>
                </tr>
              ) : (
                paginated.map((apt, index) => (
                  <tr key={apt.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none mb-1">REQ ID: {apt.id}</span>
                      <span className="text-xs font-black text-blue-900 leading-none">{apt.appointmentId || "APT-NEW"}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-900 font-inter">{apt.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{apt.phone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${apt.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>
                          {apt.vehicleType || 'Car'}
                        </span>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{apt.brand} {apt.model}</p>
                      </div>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{apt.registrationNumber || "UNSPECIFIED"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-gray-800 uppercase tracking-widest">{apt.serviceType}</p>
                      {apt.emergencyService && <span className="inline-block mt-1 bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Critical / Urgent</span>}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-gray-800">{new Date(apt.preferredDate || apt.preferred_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] font-black text-amber-500 uppercase mt-1 tracking-wider">{apt.preferredTimeSlot}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black border tracking-widest uppercase transition-all ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => openModal(apt)}
                        className="h-10 px-6 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border border-transparent hover:shadow-xl shadow-black/10"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Details & Assignment Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}></div>
          <div className="relative bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                  <FaWrench size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Technical Workbench</h3>
                  <p className="text-[10px] text-sky-500 font-black uppercase tracking-widest mt-1">Diagnostic Report & Logic Assignment • {selectedAppointment.appointmentId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppointment(null)} 
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
              >
                <FaTimesCircle size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-10 overflow-y-auto max-h-[calc(85vh-160px)] grid md:grid-cols-2 gap-10">

              <div className="space-y-10">
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 ml-1">Subscriber Metadata</h4>
                  <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 text-gray-300"><FaUserCog size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Client Identity</p>
                        <p className="text-sm font-black text-gray-800">{selectedAppointment.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 text-gray-300"><FaPhoneAlt size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Auth Phone</p>
                        <p className="text-sm font-black text-gray-500">{selectedAppointment.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 text-gray-300 shrink-0"><FaMapMarkerAlt size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Geolocation</p>
                        <p className="text-[11px] font-bold text-gray-400 leading-snug">{selectedAppointment.address}, {selectedAppointment.city} - {selectedAppointment.pincode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 ml-1">Hardware Matrix</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'Structure', v: selectedAppointment.vehicleType },
                      { l: 'Brand', v: selectedAppointment.brand },
                      { l: 'Designat.', v: selectedAppointment.model },
                      { l: 'Plate ID', v: selectedAppointment.registrationNumber },
                    ].map(item => (
                      <div key={item.l} className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-300 uppercase mb-1">{item.l}</p>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{item.v || 'PROTOTYPE'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                   <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 ml-1">Logic Controls</h4>
                  <div className="space-y-6 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Workflow Stage</label>
                      <select
                        value={pendingChanges.status ?? selectedAppointment.status}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPendingChanges(prev => {
                            const updated = { ...prev, status: value };
                            if (value === 'Cancelled') {
                              updated.assignedEmployeeId = null;
                              updated.assignedEmployeeName = null;
                            }
                            return updated;
                          });
                        }}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-800 uppercase tracking-widest focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all shadow-inner"
                      >
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personnel Allocation</label>
                        {(pendingChanges.status ?? selectedAppointment.status) !== 'Confirmed' && (
                          <span className="text-[8px] text-amber-600 font-black uppercase bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">CONFIRMATION REQ.</span>
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
                        className={`w-full px-6 py-4 rounded-2xl border border-gray-100 text-xs font-black bg-gray-50 outline-none transition-all ${(pendingChanges.status ?? selectedAppointment.status) === 'Confirmed'
                            ? 'focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black cursor-pointer shadow-inner'
                            : 'opacity-30 cursor-not-allowed grayscale'
                          }`}
                      >
                        <option value="">-- SELECT OPERATIVE --</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()} [{t.status}]</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporal Window</label>
                      <select
                        value={pendingChanges.preferredTimeSlot ?? selectedAppointment.preferredTimeSlot}
                        onChange={(e) => setPendingChanges(prev => ({ ...prev, preferredTimeSlot: e.target.value }))}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-800 uppercase tracking-widest focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all shadow-inner"
                      >
                        <option>Morning (9AM–12PM)</option>
                        <option>Afternoon (12PM–4PM)</option>
                        <option>Evening (4PM–7PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 relative">
                  <span className="absolute -top-3 left-6 bg-white border border-amber-100 px-3 py-1 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest">Diagnostic Manifest</span>
                  <p className="text-sm text-amber-900 font-bold leading-relaxed italic mt-2">"{selectedAppointment.otherIssue || 'No diagnostic notes provided'}"</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-10 py-5 mb-10 p-5 pb-10 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-8 py-3 rounded-2xl border border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Abort
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving || Object.keys(pendingChanges).length === 0}
                className="px-10 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 transition-all shadow-xl shadow-black/10 disabled:opacity-20"
              >
                {saving ? 'Synchronizing...' : 'Sychronize Manifest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
