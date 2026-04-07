import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, X, UserCheck, Calendar, Clock, LayoutGrid, List } from "lucide-react";
import api from "../../api";
import Pagination from "../../Components/Pagination";

import {
  FaUserCheck,
  FaUserSlash,
  FaCheckCircle,
  FaClipboardCheck,
  FaPlus,
  FaSearch,
  FaThLarge,
  FaList,
  FaCalendarAlt,
  FaClock
} from "react-icons/fa";

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

const ITEMS_PER_PAGE = 8;

export default function AdminAssignServices() {
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [globalModalVisible, setGlobalModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [mainTab, setMainTab] = useState("all"); 
  const [tab, setTab] = useState("unassigned");
  const [dateFilter, setDateFilter] = useState("Today");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("table"); 
  const [currentPage, setCurrentPage] = useState(1);

  const formatBookingDate = (b) => {
    if (b.createdDate) return b.createdDate;
    const dateStr = b.created_at || b.createdAt;
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  const formatBookingTime = (b) => {
    if (b.createdTime) return b.createdTime;
    const dateStr = b.created_at || b.createdAt;
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get("/staff");
      const list = res.data.filter((emp) => emp.status === "active");
      setEmployees(list);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const currentMainList = useMemo(() => {
    return bookings.filter(b => {
      if ((b.status || "").toLowerCase() === "booked") return false;
      if (mainTab === "all") return true;
      const isAddVehicle = b.uid === 'admin-created';
      return mainTab === "booked" ? !isAddVehicle : isAddVehicle;
    });
  }, [bookings, mainTab]);

  const dateFilteredList = useMemo(() => {
    return currentMainList.filter((b) => {
      const search = searchText.toLowerCase();
      const matchSearch =
        b.name?.toLowerCase().includes(search) ||
        b.phone?.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search) ||
        b.model?.toLowerCase().includes(search) ||
        b.vehicleNumber?.toLowerCase().includes(search) ||
        b.bookingId?.toLowerCase().includes(search) ||
        b.assignedEmployeeName?.toLowerCase().includes(search);

      if (!matchSearch) return false;

      const bDateStr = b.created_at || b.createdAt;
      const bookingDate = bDateStr ? new Date(bDateStr) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let matchDate = true;
      if (dateFilter === "Today") {
        if (!bookingDate) return false;
        const d = new Date(bookingDate);
        d.setHours(0, 0, 0, 0);
        matchDate = d.getTime() === today.getTime();
      } else if (dateFilter === "Yesterday") {
        if (!bookingDate) return false;
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const d = new Date(bookingDate);
        d.setHours(0, 0, 0, 0);
        matchDate = d.getTime() === yesterday.getTime();
      } else if (dateFilter === "This Week") {
        if (!bookingDate) return false;
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        matchDate = bookingDate >= lastWeek;
      } else if (dateFilter === "This Month") {
        if (!bookingDate) return false;
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        matchDate = bookingDate >= lastMonth;
      }
      return matchDate;
    });
  }, [currentMainList, searchText, dateFilter]);

  const assignedCount = dateFilteredList.filter((b) => b.assignedEmployeeId && (b.status || "").toLowerCase() !== "service completed").length;
  const unassignedCount = dateFilteredList.filter((b) => !b.assignedEmployeeId).length;
  const approvedCount = dateFilteredList.filter((b) => (b.status || "").toLowerCase() === "approved").length;
  const completedCount = dateFilteredList.filter((b) => (b.status || "").toLowerCase() === "service completed").length;
  const allCount = dateFilteredList.length;

  const filteredBookings = useMemo(() => {
    return dateFilteredList.filter((b) => {
      if (tab === "unassigned") return !b.assignedEmployeeId;
      if (tab === "assigned") return !!b.assignedEmployeeId && (b.status || "").toLowerCase() !== "service completed";
      if (tab === "approved") return (b.status || "").toLowerCase() === "approved";
      if (tab === "completed") return (b.status || "").toLowerCase() === "service completed";
      return true;
    });
  }, [dateFilteredList, tab]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const openAssignModal = async (booking) => {
    setSelectedBooking(booking);
    setSelectedEmployeeId("");
    await fetchEmployees();
    setModalVisible(true);
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    try {
      setAssigning(true);
      const bookingId = selectedBooking.id;
      const selectedEmployee = employees.find(
        (emp) => emp.id.toString() === selectedEmployeeId.toString()
      );
      if (!selectedEmployee) {
        toast.error("Mechanic not found");
        return;
      }
      await api.put(`/bookings/assign/${bookingId}`, {
        assignedEmployeeId: selectedEmployee.id,
        assignedEmployeeName: selectedEmployee.name,
        status: "Assigned"
      });
      toast.success(`Mechanic ${selectedEmployee.name} assigned successfully`);
      setModalVisible(false);
      setGlobalModalVisible(false);
      setSelectedBooking(null);
      setSelectedEmployeeId("");
      fetchData();
    } catch (e) {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent whitespace-nowrap"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-10 animate-fadeIn bg-gray-50/50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Assignment Station</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Allocate technical resources & monitor order fulfillment</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setSelectedBooking(null);
              setSelectedEmployeeId("");
              await fetchEmployees();
              setGlobalModalVisible(true);
            }}
            className="h-[56px] px-8 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95"
          >
            <FaUserCheck /> Direct Assignment
          </button>
          
          {mainTab === "addVehicle" && (
            <button
              onClick={() => window.location.href = "/admin/addservicevehicle"}
              className="h-[56px] px-8 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
            >
              <FaPlus /> Registration
            </button>
          )}
        </div>
      </div>

      {/* STATS ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Open Orders" 
          value={unassignedCount} 
          icon={<FaUserSlash />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Active Assignments" 
          value={assignedCount} 
          icon={<FaUserCheck />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Verified Requests" 
          value={approvedCount} 
          icon={<FaClipboardCheck />} 
          gradient="from-indigo-600 to-indigo-400" 
        />
        <StatCard 
          title="Closed Jobs" 
          value={completedCount} 
          icon={<FaCheckCircle />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
      </div>

      {/* CHANNEL TABS & SEARCH CONSOLIDATION */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] border border-gray-200 shadow-inner w-full lg:w-fit overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "Global Stream" },
            { id: "booked", label: "Customer Portal" },
            { id: "addVehicle", label: "Field Walk-ins" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mainTab === t.id ? "bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-[1.02]" : "text-gray-400 hover:text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative group w-full lg:max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-all duration-300" />
          <input
            type="text"
            placeholder="Track booking, mobile, personnel..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-16 pr-8 py-4.5 bg-white border border-gray-100 rounded-[2rem] focus:ring-8 focus:ring-black/5 focus:border-black outline-none transition-all duration-500 font-bold text-gray-700 shadow-xl shadow-slate-200/50"
          />
        </div>
      </div>

      {/* STATUS TABS & SEARCH */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "approved", label: `Approved (${approvedCount})`, color: "text-blue-600" },
            { id: "unassigned", label: `Open (${unassignedCount})`, color: "text-amber-600" },
            { id: "assigned", label: `In-Progress (${assignedCount})`, color: "text-indigo-600" },
            { id: "completed", label: `Closed (${completedCount})`, color: "text-emerald-600" },
            { id: "all", label: `Registry (${allCount})`, color: "text-slate-600" }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === s.id ? "bg-black text-white shadow-xl scale-105" : `bg-gray-50 ${s.color} hover:bg-gray-100`}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
         

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-[56px] px-8 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-inner"
          >
            <option value="Today">Today Only</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">Last 7 Days</option>
            <option value="This Month">Last 30 Days</option>
            <option value="All">Full History</option>
          </select>

          <div className="flex h-[56px] bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
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

      {viewMode === "card" ? (
        filteredBookings.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 animate-fadeIn">
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No bookings found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {paginatedBookings.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <LayoutGrid size={80} className="text-blue-900" />
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">
                      ID: {item.id}
                    </span>
                    <p className="text-sm font-black text-blue-900 mt-1">
                      {item.bookingId || "BKG-" + item.id}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all ${(item.status || "").toLowerCase() === "service completed"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : item.assignedEmployeeId
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                  >
                    {(item.status || "").toLowerCase() === "service completed"
                      ? "COMPLETED"
                      : item.assignedEmployeeId
                        ? "ASSIGNED"
                        : "UNASSIGNED"}
                  </div>
                </div>

                <div className="space-y-4 flex-1 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.vehicleType || 'Car'}
                      </span>
                      <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {item.brand} {item.model}
                      </h3>
                      {item.uid === 'admin-created' && (
                        <span className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">Walk-in</span>
                      )}
                    </div>
                    {item.vehicleNumber && (
                      <p className="text-blue-600 text-xs font-black bg-blue-50 w-fit px-3 py-1 rounded-xl border border-blue-100 uppercase tracking-widest">
                        {item.vehicleNumber}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 py-3 border-y border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{formatBookingDate(item)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{formatBookingTime(item)}</span>
                      </div>
                    </div>
                  </div>

                  {item.issue && (
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Reported Issue</p>
                      <p className="text-sm font-bold text-gray-700 leading-snug">{item.issue}</p>
                    </div>
                  )}

                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 text-xs">👤</div>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Customer</p>
                        <p className="text-sm font-black text-gray-800">{item.name}</p>
                      </div>
                    </div>

                    {item.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 text-xs">📞</div>
                        <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Contact</p>
                          <p className="text-sm font-bold text-gray-500">{item.phone}</p>
                        </div>
                      </div>
                    )}

                    {item.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 text-xs shrink-0">📍</div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Location</p>
                          <p className="text-[11px] font-bold text-gray-400 leading-snug line-clamp-2">{item.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.assignedEmployeeName && (
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group/staff">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Assigned Technician</p>
                        <p className="text-sm font-black text-emerald-800">{item.assignedEmployeeName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!item.assignedEmployeeId && (
                  <button
                    onClick={() => openAssignModal(item)}
                    className="mt-8 w-full bg-black text-white font-black py-4 rounded-2xl shadow-xl hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest text-xs"
                  >
                    Assign Mechanic
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-x-auto bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden animate-fadeIn">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">S No</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Booking ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Vehicle</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Service Detail</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Technician</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-gray-100 text-gray-300">
                        <List size={24} />
                      </div>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No bookings found in this category</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-gray-800">{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none">#{item.id}</span>
                      <span className="text-xs font-black text-blue-900 block mt-1">{item.bookingId || "BKG-NEW"}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-800">{item.name}</p>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">{item.phone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.vehicleType === 'bike' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {item.vehicleType || 'Car'}
                        </span>
                        <p className="text-sm font-black text-gray-900 font-inter">{item.brand} {item.model}</p>
                        {item.uid === 'admin-created' && <span className="bg-cyan-100 text-cyan-600 text-[9px] px-2 py-0.5 rounded font-black uppercase">Walk-in</span>}
                      </div>
                      <p className="text-[10px] font-black text-blue-500 mt-1 uppercase tracking-widest">{item.vehicleNumber || "N/A"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-600 max-w-[200px] truncate" title={item.issue}>
                        {item.issue}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-blue-900 block">{formatBookingDate(item)}</span>
                      <span className="text-[10px] font-bold text-gray-400 mt-1 block">{formatBookingTime(item)}</span>
                    </td>
                    <td className="px-8 py-6">
                      {item.assignedEmployeeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-xs font-black text-emerald-700">{item.assignedEmployeeName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-amber-500 border border-amber-200 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">Pending</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${(item.status || "").toLowerCase() === "service completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : item.assignedEmployeeId
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                        {(item.status || "Booked").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {!item.assignedEmployeeId ? (
                        <button
                          onClick={() => openAssignModal(item)}
                          className="bg-black text-white text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest shadow-lg shadow-black/10"
                        >
                          Assign
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Locked</span>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* 🔥 GLOBAL MODAL */}
      {globalModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Assign Service</h2>
              <button
                onClick={() => setGlobalModalVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Select Booking
                </label>
                <select
                  value={selectedBooking?.id || ""}
                  onChange={(e) =>
                    setSelectedBooking(
                      bookings.find((b) => b.id.toString() === e.target.value.toString()) || null
                    )
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all"
                >
                  <option value="">Select a booking...</option>
                  {bookings
                  .filter((b) => !b.assignedEmployeeId && (b.status || "").toLowerCase() === "approved")
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand} {b.model} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Select Mechanic
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={loadingEmployees}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Select a mechanic...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setGlobalModalVisible(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedBooking || !selectedEmployeeId || assigning}
                onClick={assignEmployee}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 CARD MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Assign Mechanic</h2>
              <button
                onClick={() => setModalVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedBooking && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                <p className="text-xs font-bold text-blue-500 uppercase">
                  Selected Vehicle
                </p>
                <h3 className="text-lg font-bold text-blue-900 mt-0.5">
                  {selectedBooking.brand} {selectedBooking.model}
                </h3>
                <p className="text-sm text-blue-700 font-medium mt-1">
                  Customer: {selectedBooking.name}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Select Mechanic
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={loadingEmployees}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Select a mechanic...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setModalVisible(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedEmployeeId || assigning}
                onClick={assignEmployee}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
