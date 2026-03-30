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
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAssignedServices();
  }, [userProfile]);

  const fetchAssignedServices = async () => {
    try {
      setLoading(true);
      // Fetching all bookings, then filtering for the current mechanic
      const res = await api.get("/bookings");
      
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
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const text = search.toLowerCase();
      const matchesSearch = 
        (item.brand + " " + item.model).toLowerCase().includes(text) ||
        (item.vehicle_number || "").toLowerCase().includes(text) ||
        (item.customer_name || "").toLowerCase().includes(text) ||
        (item.id + "").includes(text);
      
      return matchesStatus && matchesSearch;
    });
  }, [services, search, filterStatus]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusColor = (status) => {
    const map = {
      "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Assigned": "bg-blue-100 text-blue-700 border-blue-200",
      "Service Going on": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "Bill Pending": "bg-purple-100 text-purple-700 border-purple-200",
      "Bill Completed": "bg-sky-100 text-sky-700 border-sky-200",
      "Service Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return map[status] || "bg-gray-100 text-gray-700 border-gray-200";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by vehicle, ID, or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all font-bold text-gray-700 cursor-pointer"
          >
            <option value="all">Any Status</option>
            <option value="Assigned">Assigned</option>
            <option value="Service Going on">Service Going on</option>
            <option value="Bill Pending">Bill Pending</option>
            <option value="Service Completed">Completed</option>
          </select>
        </div>
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
                <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-full border shadow-sm ${getStatusColor(item.status)}`}>
                  {item.status || "Assigned"}
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
                  <span className="text-[11px] font-bold">Assigned {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                  View history
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedServices.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">#{item.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800">{item.customer_name || item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.phone || "No Phone"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900">{item.brand} {item.model}</p>
                    <p className="text-xs font-bold text-blue-500">{item.vehicle_number || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                        {item.status || "Assigned"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
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
