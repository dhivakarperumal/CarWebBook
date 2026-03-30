import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, X, UserCheck } from "lucide-react";
import api from "../../api";

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

  const [tab, setTab] = useState("unassigned");
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      const list = res.data.filter((b) => b.status !== "Service Completed");
      setBookings(list);
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

  /* 🔍 SEARCH */
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const search = searchText.toLowerCase();

      const matches =
        b.name?.toLowerCase().includes(search) ||
        b.phone?.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search) ||
        b.model?.toLowerCase().includes(search);

      if (!matches) return false;

      if (tab === "unassigned") return !b.assignedEmployeeId;
      if (tab === "assigned") return !!b.assignedEmployeeId;
      // tab === "all" → return everything
      return true;
    });
  }, [bookings, searchText, tab]);

  const assignedCount = bookings.filter((b) => b.assignedEmployeeId).length;
  const unassignedCount = bookings.filter((b) => !b.assignedEmployeeId).length;
  const allCount = bookings.length;

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-cyan-500 bg-clip-text text-transparent">
              Assign Services
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and assign mechanics to service bookings
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
        </div>

        {/* CONTROLS (TABS & SEARCH) */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
          {/* TABS */}
          <div className="flex w-full md:w-auto gap-1 bg-gray-200/50 p-1 rounded-xl">
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
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        </div>

        {/* LIST */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500 font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group"
              >
                {/* 🔹 TOP ROW → ID + STATUS */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Booking ID
                    </span>
                    <p className="text-sm font-bold text-blue-900 mt-0.5">
                      {item.bookingId || "N/A"}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                      item.assignedEmployeeId
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.assignedEmployeeId ? "ASSIGNED" : "UNASSIGNED"}
                  </div>
                </div>

                {/* 🚗 VEHICLE & CUSTOMER */}
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                      {item.brand} {item.model}
                    </h3>
                    {item.vehicleNumber && (
                      <p className="text-cyan-600 text-sm font-bold mt-1">
                        {item.vehicleNumber}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-gray-400">👤</span> {item.name}
                    </p>
                    {item.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="text-gray-400">📞</span> {item.phone}
                      </p>
                    )}
                    {item.address && (
                      <p className="text-sm text-gray-500 flex items-start gap-2 mt-1">
                        <span className="text-gray-400 mt-0.5">📍</span>{" "}
                        <span className="line-clamp-2">{item.address}</span>
                      </p>
                    )}
                  </div>

                  {/* 🛠 ISSUE */}
                  {item.issue && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        Issue Reported
                      </p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        {item.issue}
                      </p>
                    </div>
                  )}

                  {/* 👨🔧 ASSIGNED EMPLOYEE */}
                  {item.assignedEmployeeName && (
                    <div className="mt-4 flex items-center gap-2 bg-green-50 text-green-700 p-2.5 rounded-xl border border-green-100 font-semibold text-sm">
                      <UserCheck className="w-4 h-4" />
                      Assigned to: {item.assignedEmployeeName}
                    </div>
                  )}
                </div>

                {/* 🔘 ASSIGN BUTTON */}
                {!item.assignedEmployeeId && (
                  <button
                    onClick={() => openAssignModal(item)}
                    className="mt-6 w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold py-2.5 rounded-xl transition-colors duration-300"
                  >
                    Assign Mechanic
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
