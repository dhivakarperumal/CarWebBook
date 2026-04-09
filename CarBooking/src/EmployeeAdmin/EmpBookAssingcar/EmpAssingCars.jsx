import { useState, useEffect, useMemo } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Car, 
  User, 
  Phone, 
  Mail, 
  AlertCircle,
  IndianRupee,
  Calendar,
  LayoutGrid,
  List
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 6;

const EmpAssingCars = () => {
  const { profileName: userProfile } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'card' or 'table'
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchAssignedServices();
  }, [userProfile]);

  const fetchAssignedServices = async () => {
    try {
      setLoading(true);
      // 🔥 Fetching from all-services to include both bookings and appointments
      const res = await api.get("/all-services");
      
      const mechanicName = userProfile?.displayName || "";
      const filtered = res.data.filter(s => 
        (s.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
      );
      
      setServices(filtered);
    } catch (err) {
      console.error("Fetch assigned services failed", err);
      toast.error("Failed to load your assigned services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(item => {
      // Status Filter
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      
      // Search Filter
      const text = search.toLowerCase();
      const matchesSearch = 
        (item.brand + " " + item.model).toLowerCase().includes(text) ||
        (item.vehicle_number || "").toLowerCase().includes(text) ||
        (item.customer_name || "").toLowerCase().includes(text) ||
        (item.id + "").includes(text);

      // Date Filter
      let matchesDate = true;
      const bDateStr = item.created_at || item.createdAt;
      if (dateFilter !== "all") {
        if (!bDateStr) {
          matchesDate = false;
        } else {
          const bDate = new Date(bDateStr);
          const today = new Date();
          today.setHours(0,0,0,0);

          if (dateFilter === "today") {
            matchesDate = bDate.toDateString() === today.toDateString();
          } else if (dateFilter === "yesterday") {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            matchesDate = bDate.toDateString() === yesterday.toDateString();
          } else if (dateFilter === "week") {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            matchesDate = bDate >= lastWeek;
          } else if (dateFilter === "month") {
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
            matchesDate = bDate >= lastMonth;
          } else if (dateFilter === "custom") {
            const start = dateRange.start ? new Date(dateRange.start) : null;
            const end = dateRange.end ? new Date(dateRange.end) : null;
            if (end) end.setHours(23, 59, 59, 999);
            if (start && end) {
              matchesDate = bDate >= start && bDate <= end;
            } else if (start) {
              matchesDate = bDate >= start;
            } else if (end) {
              matchesDate = bDate <= end;
            }
          }
        }
      }
      
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [services, search, filterStatus, dateFilter, dateRange]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusColor = (status) => {
    const s = status || "Assigned";
    const map = {
      "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Assigned": "bg-blue-100 text-blue-700 border-blue-200",
      "Approved": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "Processing": "bg-purple-100 text-purple-700 border-purple-200",
      "Waiting for Spare": "bg-amber-100 text-amber-700 border-amber-200",
      "Service Going on": "bg-orange-100 text-orange-700 border-orange-200",
      "Bill Pending": "bg-pink-100 text-pink-700 border-pink-200",
      "Bill Completed": "bg-cyan-100 text-cyan-700 border-cyan-200",
      "Service Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return map[s] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <History className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium font-inter">Syncing your service history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn p-4 sm:p-6 lg:p-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Assigned History
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review all services linked to your account</p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
           {/* View Mode Toggle */}
           <div className="hidden sm:flex p-1 bg-gray-100 rounded-xl w-fit h-fit">
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

           <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                  <span className="text-2xl font-black text-blue-600">{services.length}</span>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider leading-tight">Total<br/>Services</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                  <span className="text-2xl font-black text-emerald-600">
                    {services.filter(s => s.status === "Service Completed" || s.status === "Completed").length}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-tight">Jobs<br/>Done</span>
              </div>
           </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by vehicle, ID, or customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">Any Status</option>
                <option value="Assigned">Assigned</option>
                <option value="Approved">Approved</option>
                <option value="Processing">Processing</option>
                <option value="Waiting for Spare">Waiting for Spare</option>
                <option value="Service Going on">Service Going on</option>
                <option value="Bill Pending">Bill Pending</option>
                <option value="Service Completed">Completed</option>
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
        </div>

        {dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 animate-fadeIn">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Start Date</label>
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">End Date</label>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        )}
      </div>

      {/* LIST SECTION */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-24 text-center border-2 border-dashed border-gray-100 transition-all">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Car className="w-12 h-12 text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-800">No Services Found</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto mt-2">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedServices.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
                 <Car size={120} className="text-blue-900 mt-2" />
              </div>

              <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-full border shadow-sm ${getStatusColor(item.serviceStatus || item.status)}`}>
                  {item.serviceStatus || item.status || "Assigned"}
                </span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {item.id}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {item.brand} {item.model}
                </h3>
                <p className="text-sm font-black text-blue-500 mt-1 uppercase tracking-wider">{item.vehicle_number || "NO PLATE"}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Reported Issue</p>
                    <p className="text-sm font-bold text-gray-700 leading-snug mt-0.5">{item.carIssue || "General Inspection"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100 transition-colors group-hover:bg-blue-600">
                    <User className="w-5 h-5 text-sky-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer</p>
                    <p className="text-sm font-black text-gray-800 truncate">{item.customer_name || item.name}</p>
                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {item.phone || item.mobile || "N/A"}
                    </p>
                  </div>
                </div>

                {item.parts_cost > 0 && (
                   <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                            <IndianRupee className="w-4 h-4 text-white" />
                         </div>
                         <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Total Parts Cost</span>
                      </div>
                      <span className="text-lg font-black text-emerald-600">₹{item.parts_cost}</span>
                   </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[11px] font-bold text-gray-800">Assigned {new Date(item.created_at || item.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                  View history
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">S No</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">Job ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">Vehicle</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedServices.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-gray-400">
                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">
                    #{item.bookingId || item.appointmentId || item.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800">{item.customer_name || item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.phone || "No Phone"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900">{item.brand} {item.model}</p>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{item.vehicle_number || item.vehicleNumber || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.serviceStatus || item.status)}`}>
                        {item.serviceStatus || item.status || "Assigned"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{new Date(item.created_at || item.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
};

export default EmpAssingCars;
