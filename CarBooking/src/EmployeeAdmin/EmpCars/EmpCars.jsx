import { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertCircle,
  Package,
  FileText,
  LayoutGrid,
  List
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 6;

const STATUS_FLOW = [
  "Pending",
  "Processing",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const EmpCars = () => {
  const { profileName: userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("booked"); // 'booked' or 'direct'
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  /* MODAL STATES */
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showIssuesModal, setShowIssuesModal] = useState(false);

  /* FORM STATES */
  const [parts, setParts] = useState([{ partName: "", qty: 1, price: 0 }]);
  const [issues, setIssues] = useState([{ issue: "", amount: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
    setPage(1);
  }, [userProfile, mainTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // For now fetching all, ideally backend should filter by staff name/id
      const res = await api.get("/bookings");
      setTasks(res.data || []);
    } catch (err) {
      console.error("Fetch tasks failed", err);
      toast.error("Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  /* TABS FILTER */
  const currentList = useMemo(() => {
    return tasks.filter(t => {
      const isDirect = t.intake_type === "direct_intake" || t.is_direct_intake;
      if (mainTab === "booked") return !isDirect;
      return isDirect;
    });
  }, [tasks, mainTab]);

  /* SEARCH & STATUS FILTER */
  const filteredTasks = useMemo(() => {
    return currentList.filter(t => {
      const matchesSearch = 
        (t.brand + " " + t.model).toLowerCase().includes(search.toLowerCase()) ||
        (t.vehicle_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.customer_name || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [currentList, search, filterStatus]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* STATUS LOGIC */
  const getNextStatuses = (current) => {
    const idx = STATUS_FLOW.indexOf(current || "Pending");
    if (idx === -1) return [STATUS_FLOW[0]];
    return STATUS_FLOW.slice(idx, idx + 2);
  };

  const updateStatus = async (task, newStatus) => {
    if (newStatus === task.status) return;

    // Validation: Require parts if moving to Bill Pending
    if (newStatus === "Bill Pending" && !task.parts_added && !task.issues_added) {
      toast.error("Please add parts or issues before moving to billing");
      return;
    }

    try {
      const updateData = { status: newStatus };
      if (newStatus === "Service Going on") updateData.started_at = new Date().toISOString();
      if (newStatus === "Service Completed") updateData.completed_at = new Date().toISOString();

      await api.put(`/bookings/${task.id}`, updateData);
      toast.success(`Status updated to ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  /* PARTS MANAGEMENT */
  const openPartsModal = (task) => {
    setSelectedTask(task);
    setParts([{ partName: "", qty: 1, price: 0 }]);
    setShowPartsModal(true);
  };

  const addPartRow = () => setParts([...parts, { partName: "", qty: 1, price: 0 }]);
  const removePartRow = (i) => setParts(parts.filter((_, idx) => idx !== i));
  const handlePartChange = (i, field, value) => {
    const copy = [...parts];
    copy[i][field] = value;
    setParts(copy);
  };

  const saveParts = async () => {
    const validParts = parts.filter(p => p.partName.trim());
    if (validParts.length === 0) return toast.error("Add at least one part");

    try {
      setSaving(true);
      const totalCost = validParts.reduce((sum, p) => sum + (p.qty * p.price), 0);
      
      // In a real app we'd save to a sub-table, for now updating main record
      await api.put(`/bookings/${selectedTask.id}`, {
        parts_added: true,
        parts_cost: (selectedTask.parts_cost || 0) + totalCost,
        status: "Bill Pending"
      });

      toast.success("Parts added successfully");
      setShowPartsModal(false);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to save parts");
    } finally {
      setSaving(false);
    }
  };

  /* ISSUES MANAGEMENT */
  const openIssuesModal = (task) => {
    setSelectedTask(task);
    setIssues([{ issue: "", amount: 0 }]);
    setShowIssuesModal(true);
  };

  const addIssueRow = () => setIssues([...issues, { issue: "", amount: 0 }]);
  const removeIssueRow = (i) => setIssues(issues.filter((_, idx) => idx !== i));
  const handleIssueChange = (i, field, value) => {
    const copy = [...issues];
    copy[i][field] = value;
    setIssues(copy);
  };

  const saveIssues = async () => {
    const validIssues = issues.filter(i => i.issue.trim());
    if (validIssues.length === 0) return toast.error("Add at least one issue");

    try {
      setSaving(true);
      const totalCost = validIssues.reduce((sum, i) => sum + Number(i.amount), 0);

      await api.put(`/bookings/${selectedTask.id}`, {
        issues_added: true,
        issues_cost: (selectedTask.issues_cost || 0) + totalCost,
        status: "Bill Pending" // Auto-move for direct intake usually
      });

      toast.success("Issues logged successfully");
      setShowIssuesModal(false);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to save issues");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Processing": "bg-orange-100 text-orange-700 border-orange-200",
      "Service Going on": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "Bill Pending": "bg-purple-100 text-purple-700 border-purple-200",
      "Bill Completed": "bg-blue-100 text-blue-700 border-blue-200",
      "Service Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return map[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-sm text-gray-500">Track and update assigned service vehicles</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setMainTab("booked")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mainTab === "booked" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Booked ({tasks.filter(t => !(t.intake_type === "direct_intake" || t.is_direct_intake)).length})
            </button>
            <button
              onClick={() => setMainTab("direct")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mainTab === "direct" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Direct Intake ({tasks.filter(t => (t.intake_type === "direct_intake" || t.is_direct_intake)).length})
            </button>
          </div>

          <div className="hidden sm:flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search brand, model, plate or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
          >
            <option value="all">All Statuses</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-blue-500 flex animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Crunching your tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No vehicles found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">
            {search || filterStatus !== 'all' 
              ? "We couldn't find anything matching your filters." 
              : "You currenty have no vehicles assigned in this category."}
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTasks.map((task) => (
            <div 
              key={task.id} 
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${getStatusColor(task.status)}`}>
                  {task.status || "Pending"}
                </span>
                <span className="text-[10px] font-medium text-gray-400">ID: {task.id}</span>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                  {task.brand} {task.model}
                </h3>
                <p className="text-sm font-black text-blue-500">{task.vehicle_number || "NO PLATE"}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold truncate">{task.customer_name || task.name}</p>
                    <p className="text-xs text-gray-400">Customer</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold">{task.carIssue || "General Service"}</p>
                    <p className="text-xs text-gray-400">Issue Reported</p>
                  </div>
                </div>

                {(task.parts_cost > 0 || task.issues_cost > 0) && (
                  <div className="pt-3 border-t border-gray-50 flex gap-4">
                    {task.parts_cost > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Parts</p>
                        <p className="text-sm font-black text-emerald-600">₹{task.parts_cost}</p>
                      </div>
                    )}
                    {task.issues_cost > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Issues</p>
                        <p className="text-sm font-black text-orange-600">₹{task.issues_cost}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="space-y-2">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <select
                    disabled={task.status === "Service Completed"}
                    value={task.status || "Pending"}
                    onChange={(e) => updateStatus(task, e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {getNextStatuses(task.status).map(s => (
                      <option key={s} value={s}>{s === task.status ? `Current: ${s}` : `Next: ${s}`}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {task.status === "Service Going on" && !task.parts_added && (
                    <button
                      onClick={() => openPartsModal(task)}
                      className="flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black hover:bg-emerald-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Parts
                    </button>
                  )}
                  {mainTab === "direct" && !task.issues_added && (
                    <button
                      onClick={() => openIssuesModal(task)}
                      className="flex items-center justify-center gap-2 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-black hover:bg-orange-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Issues
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">{task.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900">{task.brand} {task.model}</p>
                    <p className="text-xs font-bold text-blue-500">{task.vehicle_number || "NO PLATE"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-700">{task.customer_name || task.name}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border shadow-sm ${getStatusColor(task.status)}`}>
                        {task.status || "Pending"}
                      </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-xs font-medium text-gray-500 truncate">{task.carIssue || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <select
                        disabled={task.status === "Service Completed"}
                        value={task.status || "Pending"}
                        onChange={(e) => updateStatus(task, e.target.value)}
                        className="bg-gray-100/50 border-none rounded-lg px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        {getNextStatuses(task.status).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {task.status === "Service Going on" && !task.parts_added && (
                         <button 
                          onClick={() => openPartsModal(task)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Add Parts"
                         >
                            <Plus size={16} />
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* PARTS MODAL */}
      {showPartsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Add Spare Parts</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Booking ID: {selectedTask?.id}</p>
              </div>
              <button 
                onClick={() => setShowPartsModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {parts.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl space-y-3 relative group">
                   {parts.length > 1 && (
                     <button 
                      onClick={() => removePartRow(idx)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <Trash2 className="w-3 h-3" />
                     </button>
                   )}
                   <input
                    placeholder="Part Name (e.g. Oil Filter)"
                    value={item.partName}
                    onChange={(e) => handlePartChange(idx, "partName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold"
                   />
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Quantity</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handlePartChange(idx, "qty", Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePartChange(idx, "price", Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-emerald-600"
                        />
                     </div>
                   </div>
                   <div className="text-right">
                      <span className="text-xs font-bold text-gray-400 uppercase">Subtotal: </span>
                      <span className="text-sm font-black text-emerald-600">₹{item.qty * item.price}</span>
                   </div>
                </div>
              ))}

              <button 
                onClick={addPartRow}
                className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-500 rounded-2xl flex items-center justify-center gap-2 font-black hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Another Part
              </button>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Total Parts Cost</p>
                <p className="text-2xl font-black text-gray-900">₹{parts.reduce((sum, p) => sum + (p.qty * p.price), 0)}</p>
              </div>
              <button 
                disabled={saving}
                onClick={saveParts}
                className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save & Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUES MODAL */}
      {showIssuesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Log Extra Issues</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Booking ID: {selectedTask?.id}</p>
              </div>
              <button 
                onClick={() => setShowIssuesModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {issues.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl space-y-3 relative group">
                   {issues.length > 1 && (
                     <button 
                      onClick={() => removeIssueRow(idx)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <Trash2 className="w-3 h-3" />
                     </button>
                   )}
                   <input
                    placeholder="Issue Description (e.g. Brake Pad Wear)"
                    value={item.issue}
                    onChange={(e) => handleIssueChange(idx, "issue", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold"
                   />
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estimated Cost</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => handleIssueChange(idx, "amount", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-orange-600"
                      />
                   </div>
                </div>
              ))}

              <button 
                onClick={addIssueRow}
                className="w-full py-4 border-2 border-dashed border-orange-200 text-orange-500 rounded-2xl flex items-center justify-center gap-2 font-black hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Another Issue
              </button>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Total Estimate</p>
                <p className="text-2xl font-black text-gray-900">₹{issues.reduce((sum, i) => sum + Number(i.amount), 0)}</p>
              </div>
              <button 
                disabled={saving}
                onClick={saveIssues}
                className="px-8 py-3 bg-orange-500 text-white font-black rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Log Issues"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpCars;
