import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  Wrench,
  Search,
  Play,
  CheckCircle2,
  Clock,
  History,
  Activity,
  AlertCircle,
  Truck,
  User,
  MoreVertical,
  ChevronRight
} from "lucide-react";

/* 🔁 STATUS FLOW */
const STATUS_STEPS = [
  "Booked",
  "Approved",
  "Processing",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const EmpService = () => {
  const { profileName: userProfile } = useAuth();
  const [activeServices, setActiveServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/all-services");
      
      const mechanicName = userProfile?.displayName || "";
      // Filter for services assigned to ME and NOT yet fully completed/archived (or maybe show all status for today)
      const myServices = res.data.filter(s => 
        (s.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
      );
      
      const sorted = myServices.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      setActiveServices(sorted);
    } catch (err) {
      toast.error("Failed to load your active services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.displayName) fetchMyServices();
  }, [userProfile]);

  const filteredServices = useMemo(() => {
    return activeServices.filter((s) => {
      const text = `${s.bookingId} ${s.name} ${s.brand} ${s.model} ${s.vehicleNumber}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [activeServices, search]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/all-services/${id}/status`, { serviceStatus: newStatus });
      toast.success(`Vehicle moved to ${newStatus}`);
      fetchMyServices(); // Refresh
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Booked": return <Clock className="text-gray-400" />;
      case "Approved": return <Activity className="text-blue-500" />;
      case "Processing": return <Wrench className="text-orange-500" />;
      case "Service Going on": return <Play className="text-emerald-500" />;
      case "Service Completed": return <CheckCircle2 className="text-emerald-500" />;
      default: return <Clock className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Updating Service Board...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* 🚀 HEADER */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                 <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Workshop</h1>
           </div>
           <p className="text-sm text-gray-500 font-medium">Manage and track your assigned workshop jobs</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-blue-50 px-6 py-4 rounded-[1.5rem] border border-blue-100">
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none mb-1">On Deck</p>
              <p className="text-2xl font-black text-blue-600">{activeServices.filter(s => s.status !== 'Service Completed').length}</p>
           </div>
           <div className="bg-emerald-50 px-6 py-4 rounded-[1.5rem] border border-emerald-100">
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-none mb-1">Today's Goal</p>
              <p className="text-2xl font-black text-emerald-600">85%</p>
           </div>
        </div>
      </div>

      {/* 🔍 SEARCH */}
      <div className="relative max-w-xl mx-auto md:mx-0">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder="Quick search active job number, customer or car..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-16 pr-8 py-5 bg-white border-2 border-transparent rounded-[2.5rem] shadow-2xl shadow-gray-200/50 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-gray-700"
        />
      </div>

      {/* 🛠 JOB LIST */}
      {filteredServices.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
           <Truck className="w-20 h-20 text-gray-100 mx-auto mb-6" />
           <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No active workshop jobs</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const currentStepIdx = STATUS_STEPS.indexOf(service.serviceStatus || "Booked");
            
            return (
              <div key={service.id} className="group bg-white rounded-[3rem] border border-gray-100 p-8 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden">
                
                {/* STATUS BAR TOP */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${((currentStepIdx + 1) / STATUS_STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl border ${service.serviceStatus === 'Service Completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                      {getStatusIcon(service.serviceStatus)}
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{service.bookingId}</p>
                      <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-full tracking-wider mt-1 inline-block">
                         {service.serviceStatus || "Assigned"}
                      </span>
                   </div>
                </div>

                <div className="mb-8">
                   <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{service.name}</h3>
                   <p className="text-xs font-black text-blue-500 mt-1 uppercase tracking-widest">{service.brand} {service.model}</p>
                   <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-gray-400 bg-gray-50 w-fit px-3 py-1 rounded-lg border border-gray-100">
                      <History size={12} /> {new Date(service.createdAt).toLocaleDateString()}
                   </div>
                </div>

                {/* TIMELINE INDICATOR */}
                <div className="flex items-center gap-1 mb-8">
                   {STATUS_STEPS.map((step, idx) => (
                      <div 
                        key={step} 
                        className={`h-1.5 flex-1 rounded-full ${idx <= currentStepIdx ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-gray-100'}`}
                        title={step}
                      />
                   ))}
                </div>

                {/* ACTION TOOLS */}
                <div className="mt-auto space-y-3">
                   {service.serviceStatus === "Approved" || service.serviceStatus === "Booked" ? (
                      <button 
                        onClick={() => updateStatus(service.id, "Processing")}
                        className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-gray-200 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                         <Play size={16} fill="white" /> Start Job Now
                      </button>
                   ) : service.serviceStatus !== "Service Completed" ? (
                      <div className="flex gap-2">
                        <select 
                          value={service.serviceStatus}
                          onChange={(e) => updateStatus(service.id, e.target.value)}
                          className="flex-1 py-4 px-6 bg-gray-50 border border-transparent rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600 cursor-pointer appearance-none"
                        >
                           {STATUS_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                          onClick={() => updateStatus(service.id, STATUS_STEPS[currentStepIdx + 1] || service.serviceStatus)}
                          className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-100 hover:bg-black transition-all"
                        >
                           <ChevronRight size={20} />
                        </button>
                      </div>
                   ) : (
                      <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-center border border-emerald-100 flex items-center justify-center gap-2">
                         <CheckCircle2 size={16} /> Job Complete
                      </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default EmpService;
