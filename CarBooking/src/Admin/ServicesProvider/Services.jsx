import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaEye, FaThLarge, FaList, FaPlus } from "react-icons/fa";
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

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileName: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";
  const pathPrefix = location.pathname.startsWith("/employee") ? "/employee" : "/admin";

  const [viewMode, setViewMode] = useState("table"); // "card" | "table"

  const [mainTab, setMainTab] = useState("booked"); // booked | addVehicle
  const [subTab, setSubTab] = useState(isMechanic ? "assigned" : "unassigned"); // assigned | unassigned

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [serviceParts, setServiceParts] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
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

      setServices(servRes.data);
      setEmployees(empRes.data);

      const partsMap = {};
      await Promise.all(
        (servRes.data || []).map(async (service) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            partsMap[service.id] = detailRes.data?.parts || [];
          } catch (err) {
            console.error(`Failed to load parts for service ${service.id}`, err);
            partsMap[service.id] = [];
          }
        })
      );

      setServiceParts(partsMap);
    } catch (error) {
      console.error(error);
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
      return text.includes(search.toLowerCase());
    });
  }, [services, search]);

  const bookedServices = searchedServices.filter((s) => !s.addVehicle);
  const addVehicleServices = searchedServices.filter((s) => s.addVehicle);

  const currentMainList =
    mainTab === "booked" ? bookedServices : addVehicleServices;

  const assignedServices = currentMainList.filter((s) => {
    const isAssigned = !!s.assignedEmployeeId;
    if (!isAssigned) return false;

    // If mechanic, only see their own assigned tasks
    if (isMechanic) {
      return (s.assignedEmployeeName || "").toLowerCase() === (userProfile?.displayName || "").toLowerCase();
    }
    return true;
  });

  const unassignedServices = isMechanic
    ? [] // Mechanics don't see unassigned tasks (usually)
    : currentMainList.filter((s) => !s.assignedEmployeeId);

  const listData =
    subTab === "assigned" ? assignedServices : unassignedServices;

  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const paginatedData = listData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const availableEmployees = employees;

  const assignedCount = assignedServices.length;
  const unassignedCount = unassignedServices.length;

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

  const getServiceParts = (id) => {
    return serviceParts[id] || [];
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

  const handleIssueEdit = (item) => {
    setEditingIssueId(item.id);
    setIssueText(item.issue || "");
    setIssueAmount(item.issueAmount != null ? String(item.issueAmount) : "");
  };

  const handleIssueSave = async (id) => {
    try {
      await api.put(`/all-services/${id}/issue`, {
        issue: issueText,
        issueAmount: Number(issueAmount || 0),
      });
      toast.success("Issue updated successfully");
      setEditingIssueId(null);
      setIssueText("");
      setIssueAmount("");
      loadData();
    } catch (error) {
      toast.error("Failed to update issue");
    }
  };

  const handleIssueCancel = () => {
    setEditingIssueId(null);
    setIssueText("");
    setIssueAmount("");
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
    <div className="p-4 text-gray-800 font-sans sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* 🔝 MAIN TABS & TOGGLES */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex w-full space-x-2 md:w-auto flex-1 max-w-lg bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setMainTab("booked");
                setCurrentPage(1);
              }}
              className={`flex-1 rounded-lg p-2.5 text-center font-bold tracking-wide transition-all ${mainTab === "booked"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Booked
            </button>
            <button
              onClick={() => {
                setMainTab("addVehicle");
                setCurrentPage(1);
              }}
              className={`flex-1 rounded-lg p-2.5 text-center font-bold tracking-wide transition-all ${mainTab === "addVehicle"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Add Service Vehicle
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-bold transition-all ${viewMode === "table"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <FaList />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-bold transition-all ${viewMode === "card"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <FaThLarge />
              <span className="hidden sm:inline">Card</span>
            </button>
          </div>
        </div>

        {/* 🔍 SEARCH AND ADD PARTS */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search booking, name, phone, car..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 rounded-xl border border-gray-300 bg-white p-4 text-gray-800 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all shadow-sm"
          />
          <button
            onClick={() => navigate(`${pathPrefix}/addserviceparts`)}
            className="rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition-all hover:bg-blue-700 shadow-md whitespace-nowrap"
          >
            + Add Service Parts
          </button>
        </div>


        {/* 🔹 SUB TABS */}
        {!isMechanic ? (
          <div className="mb-8 flex space-x-2">
            <button
              onClick={() => {
                setSubTab("assigned");
                setCurrentPage(1);
              }}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${subTab === "assigned"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              Assigned ({assignedCount})
            </button>
            <button
              onClick={() => {
                setSubTab("unassigned");
                setCurrentPage(1);
              }}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${subTab === "unassigned"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              Unassigned ({unassignedCount})
            </button>
          </div>
        ) : (
          <div className="mb-8 flex space-x-2">
            <div className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md">
              My Assigned Tasks ({assignedCount})
            </div>
          </div>
        )}

        {/* 📋 DYNAMIC VIEW (CARD OR TABLE) */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pb-24">
            {paginatedData.map((item) => {
              const currentStepIndex = STATUS_STEPS.indexOf(
                item.serviceStatus || "Booked"
              );

              return (
                <div
                  key={item.id}
                  className="relative rounded-2xl bg-white p-6 shadow-sm border border-gray-200 transition-all hover:shadow-lg flex flex-col"
                >
                  <div className="flex-1">
                    {/* 🔹 STATUS BADGE */}
                    <div
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                        item.serviceStatus
                      )}`}
                    >
                      {item.serviceStatus || "Booked"}
                    </div>

                    {/* 🔹 CONTENT */}
                    <div className="mt-2 flex flex-col space-y-3">
                      <h3 className="text-xl font-black text-gray-900">
                        {item.bookingId || `SER-${item.id}`}
                      </h3>
                      <div>
                        <p className="text-md font-bold text-gray-800">
                          {item.name || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.phone || "No Phone"}
                        </p>
                      </div>

                      <div>
                        <p className="text-md font-bold text-blue-600">
                          {item.vehicleNumber || "No Plate Info"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.brand || ""} {item.model || ""}
                        </p>
                      </div>

                      {/* 🔹 ISSUE SECTION */}
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-2">
                          Service Issue
                        </p>
                        <div>
                          <p className="text-xs text-gray-700 mb-1">
                            {item.issue ? item.issue.substring(0, 50) + (item.issue.length > 50 ? "..." : "") :
                              <span className="text-gray-400 italic">No issue</span>}
                          </p>
                          {item.issueAmount != null && Number(item.issueAmount) > 0 && (
                            <p className="text-xs font-bold text-gray-800">Amount: ₹{Number(item.issueAmount).toFixed(2)}</p>
                          )}
                          <p className="text-xs font-semibold text-gray-600 mt-1">
                            Status: <span className="capitalize">{item.issueStatus || 'pending'}</span>
                          </p>

                          {isMechanic && item.assignedEmployeeName && (
                            <button
                              onClick={() => {
                                setSelectedIssueItem(item);
                                setIssueText(item.issue || "");
                                setIssueAmount(item.issueAmount != null ? String(item.issueAmount) : "");
                                setIssueModalVisible(true);
                              }}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 🔹 ASSIGNED MECHANIC */}
                      {item.assignedEmployeeName && (
                        <p className="mt-2 text-sm font-bold text-blue-600">
                          Mechanic: <span className="text-gray-700">{item.assignedEmployeeName}</span>
                        </p>
                      )}

                      {/* 🔧 SPARE PARTS SUMMARY */}
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                          Spare Parts
                        </p>
                        {getServiceParts(item.id).length === 0 ? (
                          <p className="text-sm text-gray-500">No spare parts added (pending).</p>
                        ) : (
                          <div className="space-y-2">
                            {getServiceParts(item.id).map((part, pindex) => (
                              <div key={part.id || `${part.partName}-${pindex}`} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{part.partName}</p>
                                  <p className="text-xs text-gray-500">Qty: {part.qty} | ₹{Number(part.total).toFixed(2)}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${partStatusClass(part.status)}`}>
                                  {formatPartStatus(part.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🔹 TIMELINE */}
                    <div className="mt-6 border-t border-gray-100 pt-5 overflow-hidden">
                      <div className="flex items-center justify-between pb-2">
                        {STATUS_STEPS.map((step, index) => {
                          const active = index <= currentStepIndex;
                          const isLast = index === STATUS_STEPS.length - 1;

                          return (
                            <div key={step} className="flex flex-1 items-center">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black z-10 ${active
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-gray-200 bg-gray-100 text-gray-400"
                                  }`}
                                title={step}
                              >
                                {index + 1}
                              </div>
                              {!isLast && (
                                <div
                                  className={`h-1 flex-1 mx-1 rounded-full ${index < currentStepIndex
                                    ? "bg-blue-600"
                                    : "bg-gray-100"
                                    }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-center text-xs font-bold text-gray-500">
                        Current: <span className="text-blue-600">{item.serviceStatus || "Booked"}</span>
                      </p>
                    </div>

                    {/* 🔹 STATUS PICKER */}
                    {item.assignedEmployeeId && (
                      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
                        <select
                          value={item.serviceStatus || "Booked"}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className="w-full bg-gray-50 p-2 text-sm font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          {BOOKING_STATUS.slice(BOOKING_STATUS.indexOf(item.serviceStatus || "Booked") === -1 ? 0 : BOOKING_STATUS.indexOf(item.serviceStatus || "Booked")).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 🔹 ADD SPARE BUTTON - Full Width below dropdown */}
                    {item.serviceStatus === "Processing" && item.assignedEmployeeId && (
                      <button
                        onClick={() => navigate(`${pathPrefix}/addserviceparts`, { state: { service: item } })}
                        className="mt-3 w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 transition-all shadow-md"
                        title="Add Spare Parts"
                      >
                        + Add Spare Parts
                      </button>
                    )}
                  </div>

                  {/* 🔹 ACTIONS (Card View) */}
                  <div className="mt-6 border-t border-gray-100 pt-4 flex flex-wrap gap-2">
                    {/* 🔹 ASSIGN BUTTON */}
                    {!item.assignedEmployeeId && (
                      <button
                        onClick={() => {
                          setSelectedBooking(item);
                          setModalVisible(true);
                        }}
                        className="flex-1 rounded-xl bg-blue-50 p-2.5 text-sm font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 hover:border-blue-600"
                      >
                        Assign
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`${pathPrefix}/services/${item.id}`)}
                      className="flex-1 flex justify-center items-center rounded-xl bg-gray-50 p-2.5 text-gray-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 hover:text-blue-600 transition-all"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => navigate(`${pathPrefix}/addservices/${item.id}`)}
                      className="flex-1 flex justify-center items-center rounded-xl bg-gray-50 p-2.5 text-gray-600 hover:bg-green-50 border border-gray-200 hover:border-green-200 hover:text-green-600 transition-all"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex justify-center items-center rounded-xl bg-gray-50 p-2.5 text-gray-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
            {paginatedData.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500">
                <FaThLarge className="mx-auto text-4xl mb-4 text-gray-300" />
                <p className="text-lg">No services found.</p>
              </div>
            )}
          </div>
        ) : (
          /* TABLE VIEW */
          // <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Vehicle</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Issue</th>
                  <th className="px-6 py-4 font-bold">Spare Parts</th>
                  <th className="px-6 py-4 font-bold">Mechanic</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="transition-all hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {item.bookingId || `SER-${item.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-blue-600">{item.vehicleNumber || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{item.brand} {item.model}</p>
                    </td>
                    <td className="px-6 py-4">
                      {item.assignedEmployeeId ? (
                        <select
                          value={item.serviceStatus || "Booked"}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-800 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {BOOKING_STATUS.slice(BOOKING_STATUS.indexOf(item.serviceStatus || "Booked") === -1 ? 0 : BOOKING_STATUS.indexOf(item.serviceStatus || "Booked")).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(item.serviceStatus)}`}
                        >
                          {item.serviceStatus || "Booked"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingIssueId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={issueText}
                            onChange={(e) => setIssueText(e.target.value)}
                            placeholder="Enter the issue details..."
                            className="w-full rounded-lg border border-blue-300 bg-white p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-600 resize-none h-16"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={issueAmount}
                            onChange={(e) => setIssueAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-full rounded-lg border border-blue-300 bg-white p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleIssueSave(item.id)}
                              className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleIssueCancel}
                              className="flex-1 rounded-lg bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold py-1 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-700 mb-1">
                            {item.issue ? item.issue.substring(0, 50) + (item.issue.length > 50 ? "..." : "") : <span className="text-gray-400 italic">No issue</span>}
                          </p>
                          {item.issueAmount != null && Number(item.issueAmount) > 0 && (
                            <p className="text-xs text-gray-500">Amount: ₹{Number(item.issueAmount).toFixed(2)}</p>
                          )}
                          <p className="text-xs font-semibold text-gray-600 mt-1">
                            Status: <span className="capitalize">{item.issueStatus || 'pending'}</span>
                          </p>
                          {isMechanic && item.assignedEmployeeName && (
                            <button
                              onClick={() => {
                                setSelectedIssueItem(item);
                                setIssueText(item.issue || "");
                                setIssueAmount(item.issueAmount != null ? String(item.issueAmount) : "");
                                setIssueModalVisible(true);
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getServiceParts(item.id).length === 0 ? (
                        <p className="text-xs text-gray-500">No parts added</p>
                      ) : (
                        <div className="space-y-1">

                          {/* ✅ show only 2 */}
                          {getServiceParts(item.id).slice(0, 2).map((part, pindex) => (
                            <p key={`${item.id}-part-${pindex}`} className="text-xs text-gray-700">
                              {part.partName} • ₹{Number(part.total).toFixed(2)} •
                              <span className="font-bold">{formatPartStatus(part.status)}</span>
                            </p>
                          ))}

                          {/* ✅ show popup button */}
                          {getServiceParts(item.id).length > 2 && (
                            <button
                              onClick={() => {
                                setSelectedParts(getServiceParts(item.id));
                                setPartsModalVisible(true);
                              }}
                              className="text-blue-600 font-bold text-xs hover:underline"
                            >
                              View All ({getServiceParts(item.id).length})
                            </button>
                          )}

                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {item.assignedEmployeeName ? (
                        item.assignedEmployeeName
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBooking(item);
                            setModalVisible(true);
                          }}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                        >
                          Assign Mode
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Add Spare Button - Show only when Processing */}
                        {item.serviceStatus === "Processing" && (
                          <button
                            onClick={() => navigate("/employee/addserviceparts", { state: { service: item } })}
                            className="rounded-lg p-2 text-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100"
                            title="Add Spare Parts"
                          >
                            <FaPlus />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`${pathPrefix}/services/${item.id}`)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => navigate(`${pathPrefix}/addservices/${item.id}`)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all border border-transparent hover:border-green-100"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500 text-base">
                      No services found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          // </div>
        )}

        {/* 📚 PAGINATION */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 🪟 ASSIGN MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-center text-xl font-bold text-gray-900">
                Assign Mechanic
              </h2>
              <p className="text-center text-sm text-gray-500 mt-1">
                Select an available mechanic for this service.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-800 shadow-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="" className="text-gray-400">
                  -- Select Mechanic --
                </option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setModalVisible(false);
                  setSelectedEmployeeId("");
                }}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-center font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignEmployee}
                disabled={assigning}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {partsModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold mb-4">
              Spare Parts List
            </h2>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {selectedParts.map((part, index) => (
                <div key={index} className="flex justify-between border p-3 rounded-lg">

                  <div>
                    <p className="font-semibold">{part.partName}</p>
                    <p className="text-xs text-gray-500">Qty: {part.qty}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">₹{Number(part.total).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${partStatusClass(part.status)}`}>
                      {formatPartStatus(part.status)}
                    </span>
                  </div>

                </div>
              ))}
            </div>

            <button
              onClick={() => setPartsModalVisible(false)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl"
            >
              Close
            </button>

          </div>
        </div>
      )}

      {issueModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold mb-4">
              Edit Service Issue
            </h2>

            <textarea
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="Enter issue..."
              className="w-full border rounded-lg p-3 mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIssueModalVisible(false)}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.put(`/all-services/${selectedIssueItem.id}/issue`, {
                      issue: issueText
                    });

                    toast.success("Issue updated");
                    setIssueModalVisible(false);
                    setSelectedIssueItem(null);
                    setIssueText("");
                    loadData(); // refresh table
                  } catch {
                    toast.error("Failed to update");
                  }
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
