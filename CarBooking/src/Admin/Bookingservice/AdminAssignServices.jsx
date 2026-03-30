import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, X, UserCheck, Calendar, Clock, LayoutGrid, List } from "lucide-react";
import api from "../../api";
import Pagination from "../../Components/Pagination";

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

  const [mainTab, setMainTab] = useState("all"); // all | booked | addVehicle
  const [tab, setTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("card"); // card | table
  const [currentPage, setCurrentPage] = useState(1);

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
      // Filter for active staff (you may change this depending on staff schema)
      const list = res.data.filter((emp) => emp.status === "active");
      setEmployees(list);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const availableEmployees = employees; // Assuming all returned staff are available

  const currentMainList = useMemo(() => {
    return bookings.filter(b => {
      if (mainTab === "all") return true;
      const isAddVehicle = b.uid === 'admin-created';
      return mainTab === "booked" ? !isAddVehicle : isAddVehicle;
    });
  }, [bookings, mainTab]);

  const assignedCount = currentMainList.filter((b) => b.assignedEmployeeId && (b.status || "").toLowerCase() !== "service completed").length;
  const unassignedCount = currentMainList.filter((b) => !b.assignedEmployeeId).length;
  const bookedCount = currentMainList.filter((b) => (b.status || "").toLowerCase() === "booked").length;
  const completedCount = currentMainList.filter((b) => (b.status || "").toLowerCase() === "service completed").length;
  const allCount = currentMainList.length;

  /* 🔍 SEARCH */
  const filteredBookings = useMemo(() => {
    return currentMainList.filter((b) => {
      const search = searchText.toLowerCase();

      const matches =
        b.name?.toLowerCase().includes(search) ||
        b.phone?.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search) ||
        b.model?.toLowerCase().includes(search) ||
        b.vehicleNumber?.toLowerCase().includes(search) ||
        b.bookingId?.toLowerCase().includes(search) ||
        b.assignedEmployeeName?.toLowerCase().includes(search);

      if (!matches) return false;

      // Status filter
      if (tab === "unassigned") return !b.assignedEmployeeId;
      if (tab === "assigned") return !!b.assignedEmployeeId && (b.status || "").toLowerCase() !== "service completed";
      if (tab === "booked") return (b.status || "").toLowerCase() === "booked";
      if (tab === "completed") return (b.status || "").toLowerCase() === "service completed";
      
      return true;
    });
  }, [currentMainList, searchText, tab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, tab, mainTab]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  /* 🔥 OPEN CARD MODAL */
  const openAssignModal = async (booking) => {
    setSelectedBooking(booking);
    setSelectedEmployeeId("");
    await fetchEmployees();
    setModalVisible(true);
  };

  /* 🔥 ASSIGN FUNCTION */
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
      fetchData(); // Refresh bookings
    } catch (e) {
      console.error(e);
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
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        {/* MAIN TABS (Separating Booked from Add Service Vehicle) */}
        <div className="flex w-full space-x-2 md:w-auto flex-1 max-w-xl bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setMainTab("all")}
            className={`flex-1 rounded-lg p-2.5 text-center font-bold tracking-wide transition-all ${
              mainTab === "all"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setMainTab("booked")}
            className={`flex-1 rounded-lg p-2.5 text-center font-bold tracking-wide transition-all ${
              mainTab === "booked"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Customer Bookings
          </button>
          <button
            onClick={() => setMainTab("addVehicle")}
            className={`flex-1 rounded-lg p-2.5 text-center font-bold tracking-wide transition-all ${
              mainTab === "addVehicle"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Walk-ins
          </button>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-900 to-cyan-500 bg-clip-text text-transparent uppercase tracking-tight">
              {mainTab === "all" ? "All Service Management" : mainTab === "booked" ? "Customer Bookings" : "Walk-in Vehicles"}
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 uppercase tracking-widest opacity-60">
              {mainTab === "all" ? "Overview of all active and pending services" : mainTab === "booked" ? "Managing reservations and appointments" : "Handling on-site vehicle check-ins"}
            </p>
          </div>

          <button
            onClick={async () => {
              setSelectedBooking(null);
              setSelectedEmployeeId("");
              await fetchEmployees();
              setGlobalModalVisible(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Assign Service
          </button>
          
          {mainTab === "addVehicle" && (
            <button
              onClick={() => window.location.href = "/admin/addservicevehicle"}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Register New Vehicle
            </button>
          )}
        </div>

        {/* CONTROLS (TABS & SEARCH) */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
          {/* TABS */}
          <div className="flex w-full md:w-auto gap-1 bg-gray-200/50 p-1 rounded-xl">
            {/* Booked */}
            <button
              onClick={() => setTab("booked")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "booked"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Booked ({bookedCount})
            </button>
            {/* Unassigned */}
            <button
              onClick={() => setTab("unassigned")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "unassigned"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Unassigned ({unassignedCount})
            </button>
            {/* Assigned */}
            <button
              onClick={() => setTab("assigned")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "assigned"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Assigned ({assignedCount})
            </button>
            {/* Completed */}
            <button
              onClick={() => setTab("completed")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "completed"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed ({completedCount})
            </button>
            {/* All */}
            <button
              onClick={() => setTab("all")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "all"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All ({allCount})
            </button>
          </div>

          {/* SEARCH */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-72 relative">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
              />
            </div>
            
            <div className="hidden sm:flex p-1 bg-gray-200/50 rounded-xl">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed animate-fadeIn">
            <p className="text-gray-500 font-medium font-inter">No bookings found for this category</p>
          </div>
        ) : viewMode === "card" ? (
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
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all ${
                      (item.status || "").toLowerCase() === "service completed"
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
                    <div className="flex items-center gap-2 flex-wrap">
                       <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {item.brand} {item.model}
                      </h3>
                      {item.uid === 'admin-created' && (
                        <span className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">Walk-in</span>
                      )}
                    </div>
                    {item.vehicleNumber && (
                      <p className="text-blue-600 text-xs font-black mt-2 bg-blue-50 w-fit px-3 py-1 rounded-xl border border-blue-100 uppercase tracking-widest">
                        {item.vehicleNumber}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-4 py-3 border-y border-gray-50">
                       {item.createdDate && (
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Calendar className="w-4 h-4 text-gray-400" />
                           </div>
                           <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{item.createdDate}</span>
                        </div>
                      )}
                      {item.createdTime && (
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                               <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{item.createdTime}</span>
                         </div>
                      )}
                    </div>
                  </div>

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

                  {item.issue && (
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Reported Issue</p>
                       <p className="text-sm font-bold text-gray-700 leading-snug">{item.issue}</p>
                    </div>
                  )}

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
                    className="mt-8 w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-xs"
                  >
                    Assign Mechanic
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto animate-fadeIn">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Technician</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedBookings.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none">#{item.id}</span>
                       <span className="text-xs font-black text-blue-900 block mt-1">{item.bookingId || "BKG-NEW"}</span>
                       <span className="text-[10px] font-bold text-gray-400 mt-1 block">{item.createdDate}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-800">{item.name}</p>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">{item.phone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 font-inter">{item.brand} {item.model}</p>
                        {item.uid === 'admin-created' && <span className="bg-cyan-100 text-cyan-600 text-[9px] px-2 py-0.5 rounded font-black uppercase">Walk-in</span>}
                      </div>
                      <p className="text-[10px] font-black text-blue-500 mt-1 uppercase tracking-widest">{item.vehicleNumber || "N/A"}</p>
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
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                        (item.status || "").toLowerCase() === "service completed"
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
                          className="bg-black text-white text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-lg shadow-black/10"
                        >
                          Assign
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Locked</span>
                      )}
                    </td>
                  </tr>
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
      </div>

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
                    .filter((b) => !b.assignedEmployeeId)
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
                  {availableEmployees.map((emp) => (
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
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
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
                  {availableEmployees.map((emp) => (
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
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
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
