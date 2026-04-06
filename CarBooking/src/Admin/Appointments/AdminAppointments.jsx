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
  FaPlus
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const STATUS_OPTIONS = [
  "Appointment Booked",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled"
];

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const openModal = (apt) => {
    setSelectedAppointment(apt);
    setPendingChanges({});
  };
  const [technicians, setTechnicians] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("Appointment Booked");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("Today");
  const [searchTerm, setSearchTerm] = useState("");
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = appointments.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesType = typeFilter === 'all' || a.vehicleType === typeFilter;
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

    return matchesStatus && matchesType && matchesDate && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage scheduling, technicians, and service status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/book-appointment")}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
          >
            <FaPlus /> Add Appointment
          </button>
<div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Total: {appointments.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID, Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none bg-white font-medium"
          >
            <option value="all">All Vehicle Types</option>
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="SUV">SUV</option>
          </select>

          <select
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none bg-white font-medium"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>

          <button
            onClick={() => { setStatusFilter('Appointment Booked'); setTypeFilter('all'); setDateFilter('Today'); setSearchTerm(''); setCurrentPage(1); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition"
          >
            <FaFilter /> Reset
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className=" overflow-hidden">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#87a5b3] text-white">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest">Technician</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-white uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">No appointments found</td></tr>
              ) : paginated.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition duration-200">
                  <td className="px-6 py-4 font-black text-sm text-sky-600">{apt.appointmentId}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{apt.name}</p>
                    <p className="text-xs text-gray-500">{apt.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FaCarSide className="text-gray-400 text-xs" />
                      <span className="text-sm font-medium text-gray-700">{apt.brand} {apt.model}</span>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-6">{apt.registrationNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-800">{apt.serviceType}</span>
                    {apt.emergencyService && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase">Urgent</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaCalendarAlt className="text-sky-500" /> {new Date(apt.preferredDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                      <FaClock /> {apt.preferredTimeSlot}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {apt.assignedEmployeeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-600 border border-sky-200 uppercase">
                          {apt.assignedEmployeeName.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{apt.assignedEmployeeName}</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => openModal(apt)}
                        className="text-xs italic text-gray-400 underline decoration-dotted hover:text-sky-500 transition-colors"
                      >
                        Unassigned
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border tracking-wider uppercase ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openModal(apt)}
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-sky-600 transition-all shadow-sm shadow-sky-500/20"
                    >
                      Manage / Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 bg-gray-50/30 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

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
                      <label className="text-xs font-bold text-gray-600 ml-1">Current Status</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              setSelectedAppointment(prev => ({ ...prev, status: opt }));
                              setPendingChanges(prev => ({ ...prev, status: opt }));
                            }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-tight border transition-all duration-300 ${
                              (pendingChanges.status ?? selectedAppointment.status) === opt
                                ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mechanic Assignment */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 ml-1">Assign Technician</label>
                      <select
                        value={pendingChanges.assignedEmployeeId ?? selectedAppointment.assignedEmployeeId ?? ""}
                        onChange={(e) => {
                          const tech = technicians.find(t => t.id === Number(e.target.value));
                          setPendingChanges(prev => ({
                            ...prev,
                            assignedEmployeeId: tech?.id || null,
                            assignedEmployeeName: tech?.name || null
                          }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-sky-500/20"
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
