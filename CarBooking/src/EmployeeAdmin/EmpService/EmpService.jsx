import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import Pagination from "../../Components/Pagination";
import {
  Wrench,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  ExternalLink,
  LayoutGrid,
  List
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 5;

const EmpService = () => {
  const { profileName: userProfile } = useAuth();
  const [activeServices, setActiveServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchActiveServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      
      const mechanicName = userProfile?.displayName || "";
      
      // Filter for services assigned to this mechanic that are NOT cancelled
      // and typically in a non-final state (though we can show all and label them)
      const filtered = (res.data || []).filter(s => 
        (s.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase() &&
        s.status !== "Cancelled"
      );

      setActiveServices(filtered);
    } catch (err) {
      console.error("Fetch services error:", err);
      toast.error("Failed to load your services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveServices();
  }, [userProfile]);

  const updateStatus = async (id, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === "Service Going on") {
        updateData.startedAt = new Date().toISOString();
      }
      if (newStatus === "Service Completed") {
        updateData.completedAt = new Date().toISOString();
      }

      await api.put(`/bookings/${id}`, updateData);
      toast.success(`Status updated to ${newStatus}`);
      fetchActiveServices();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const getStatusColor = (status) => {
    const map = {
      "Pending": "bg-yellow-50 text-yellow-600 border-yellow-100",
      "Approved": "bg-blue-50 text-blue-600 border-blue-100",
      "Assigned": "bg-blue-50 text-blue-600 border-blue-100",
      "Service Going on": "bg-indigo-50 text-indigo-600 border-indigo-100",
      "Service Completed": "bg-green-50 text-green-600 border-green-100",
      "Completed": "bg-green-50 text-green-600 border-green-100",
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-100";
  };

  const totalPages = Math.ceil(activeServices.length / ITEMS_PER_PAGE);
  const paginatedServices = activeServices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Wrench className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your assignments...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Wrench className="text-blue-600 w-8 h-8" />
            Service Management
          </h1>
          <p className="text-gray-500 font-medium italic">Track and update your currently assigned vehicle services</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => { setViewMode("card"); setPage(1); }}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => { setViewMode("table"); setPage(1); }}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Assigned</p>
            <p className="text-2xl font-black text-gray-900">{activeServices.length}</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
            <Car size={28} />
          </div>
        </div>
      </div>

      {/* LIST SECTION */}
      {activeServices.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] py-24 text-center border-2 border-dashed border-gray-100">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="w-10 h-10 text-gray-200" />
           </div>
           <h3 className="text-xl font-bold text-gray-800">No Services Assigned</h3>
           <p className="text-gray-400 mt-1">You're all caught up! Check back later for new tasks.</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {paginatedServices.map((service) => (
            <div 
              key={service.id}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                        <Car className="text-gray-400 group-hover:text-white transition-colors" size={24} />
                     </div>
                     <div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(service.status)}`}>
                         {service.status || "Pending"}
                       </span>
                       <h3 className="text-xl font-black text-gray-900 mt-1">{service.brand} {service.model}</h3>
                     </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-blue-600 transition-colors">
                    <ExternalLink size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-gray-400" />
                       <p className="text-sm font-bold text-gray-800 truncate">{service.name}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle ID</p>
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-gray-800">{service.vehicle_number || "NO PLATE"}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertCircle size={12} /> Reported Issue
                   </p>
                   <p className="text-sm font-medium text-gray-600 leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-50">
                     {service.carIssue || "Routine checkup and general service inspection."}
                   </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-4 pt-2 border-t border-gray-50">
                  {(service.status === "Assigned" || service.status === "Approved" || service.status === "Pending") && (
                    <button 
                      onClick={() => updateStatus(service.id, "Service Going on")}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      <Play size={18} fill="currentColor" />
                      START SERVICE
                    </button>
                  )}
                  {service.status === "Service Going on" && (
                    <button 
                      onClick={() => updateStatus(service.id, "Service Completed")}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
                    >
                      <CheckCircle2 size={18} />
                      COMPLETE SERVICE
                    </button>
                  )}
                  {service.status === "Service Completed" && (
                    <div className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-gray-100 cursor-default">
                       <CheckCircle2 size={18} className="text-green-500" />
                       SERVICE FINISHED
                    </div>
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
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">#{service.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800">{service.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{service.brand} {service.model}</p>
                    <p className="text-xs font-bold text-blue-500">{service.vehicle_number || "NO PLATE"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(service.status)}`}>
                        {service.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(service.status === "Assigned" || service.status === "Approved" || service.status === "Pending") && (
                        <button 
                          onClick={() => updateStatus(service.id, "Service Going on")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black shadow-lg shadow-blue-200"
                        >
                          START
                        </button>
                      )}
                      {service.status === "Service Going on" && (
                        <button 
                          onClick={() => updateStatus(service.id, "Service Completed")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-black shadow-lg shadow-green-200"
                        >
                          COMPLETE
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
    </div>
  );
};

export default EmpService;
