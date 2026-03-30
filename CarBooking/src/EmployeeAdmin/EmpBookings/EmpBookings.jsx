import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  LayoutDashboard,
  Search,
  Filter,
  Car,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const EmpBookings = () => {
  const navigate = useNavigate();
  const { profileName: userProfile } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const BOOKING_STATUS = ["Booked", "Call Verified", "Approved", "Cancelled", "Service Completed"];

  /* 🔥 FETCH BOOKINGS AND FILTER FOR MECHANIC */
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.get("/bookings");
        
        const mechanicName = userProfile?.displayName || "";
        
        // IMPORTANT: Filter by assigned mechanic
        const filtered = response.data.filter(b => 
          (b.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
        );

        const sorted = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setBookings(sorted);
      } catch (err) {
        toast.error("Failed to load your bookings");
      } finally {
        setLoading(false);
      }
    };
    if (userProfile?.displayName) fetchBookings();
  }, [userProfile]);

  /* 🔎 FILTER SEARCH RESULTS */
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        `${b.bookingId} ${b.name} ${b.phone} ${b.brand} ${b.model}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Service Completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Calendar className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Synchronizing your booking records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
               <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            Service Bookings
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and track your assigned customer bookings</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Assigned Tasks</p>
              <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
           </div>
           <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-none mb-1">Completed</p>
              <p className="text-2xl font-black text-emerald-600">{bookings.filter(b => b.status === 'Service Completed').length}</p>
           </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative drop-shadow-sm">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, name, car or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all font-bold text-gray-700 cursor-pointer shadow-sm"
          >
            <option value="All">All Status Types</option>
            {BOOKING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* RESULT GRID */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100">
          <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-gray-900">No Match Found</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto mt-2">Try adjusting your search or filters to see other assigned bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredBookings.map((b) => (
            <div key={b.id} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(b.status)}`}>
                  {b.status}
                </span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {b.bookingId}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-none">{b.name}</h3>
                  <div className="flex items-center gap-2 mt-2 font-bold text-xs text-blue-500 uppercase tracking-wider">
                     <Car size={14} /> {b.brand} • {b.model}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Phone size={14} className="text-gray-300" /> {b.phone}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Clock size={14} className="text-gray-300" /> {new Date(b.created_at).toLocaleDateString()}
                   </div>
                </div>
              </div>

              <div className="mt-auto">
                 <button 
                  onClick={() => navigate(`/employee/cars`)}
                  className="w-full py-4 bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-200 transition-all duration-300"
                 >
                    <CheckCircle2 size={16} /> Update Progress
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmpBookings;
