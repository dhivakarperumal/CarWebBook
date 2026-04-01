import { useState, useEffect, useMemo } from "react";
import { 
  Bike, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Filter, 
  ArrowUpDown, 
  MapPin, 
  IndianRupee, 
  Car,
  MoreVertical,
  Settings,
  X,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 5;

const AllBikes = ({ defaultType = "all" }) => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBike, setSelectedBike] = useState(null);

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bikes");
      setBikes(res.data);
    } catch (err) {
      toast.error("Failed to load bikes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Permanent delete this bike listing?")) return;
    try {
      await api.delete(`/bikes/${id}`);
      toast.success("Listing removed");
      fetchBikes();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/bikes/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchBikes();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredBikes = useMemo(() => {
    return bikes.filter(bike => {
      const matchesSearch = 
        bike.title.toLowerCase().includes(search.toLowerCase()) ||
        bike.brand.toLowerCase().includes(search.toLowerCase()) ||
        bike.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || bike.status === filterStatus;
      const matchesType = defaultType === "all" || bike.type === defaultType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [bikes, search, filterStatus, defaultType]);

  const totalPages = Math.ceil(filteredBikes.length / ITEMS_PER_PAGE);
  const paginatedBikes = filteredBikes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusColor = (status) => {
    const map = {
      published: "bg-emerald-100 text-emerald-700 border-emerald-200",
      draft: "bg-amber-100 text-amber-700 border-amber-200",
      sold: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Bike className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Fetching Inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-black to-blue-800 flex items-center justify-center shadow-xl shadow-blue-200 rotate-3">
             {defaultType === 'Car' ? <Car className="text-white w-8 h-8 -rotate-3" /> : <Bike className="text-white w-8 h-8 -rotate-3" />}
          </div>
          <div>
             <h1 className="text-3xl font-black text-gray-900">{defaultType === 'all' ? 'Vehicle Inventory' : `${defaultType} Inventory`}</h1>
             <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage your marketplace listings</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-3 bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100">
              <span className="text-3xl font-black text-blue-600">{filteredBikes.length}</span>
              <div className="flex flex-col leading-none">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total</span>
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Units</span>
              </div>
           </div>
           
           <button 
             onClick={() => navigate("/admin/add-vehicle")}
             className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 group"
           >
              <Plus className="group-hover:rotate-90 transition-transform" />
              Add New {defaultType === 'all' ? 'Vehicle' : defaultType}
           </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search title, brand or model..."
             className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
           />
        </div>
        <div className="relative">
           <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
           >
             <option value="all">All Status</option>
             <option value="published">Published</option>
             <option value="draft">Draft</option>
             <option value="sold">Sold</option>
           </select>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all">
           <ArrowUpDown size={18} /> Sort
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <th className="px-6 py-5 first:pl-10">{defaultType === 'all' ? 'Vehicle Details' : `${defaultType} Details`}</th>
              <th className="px-6 py-5">Specs</th>
              <th className="px-6 py-5">Location</th>
              <th className="px-6 py-5">Price</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 last:pr-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedBikes.map((bike) => (
              <tr key={bike.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-6 py-6 first:pl-10">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        {bike.images ? (
                           <img src={JSON.parse(bike.images).front} className="w-full h-full object-cover" alt="" />
                        ) : (
                           bike.type === 'Car' ? <Car className="w-full h-full p-4 text-gray-300" /> : <Bike className="w-full h-full p-4 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-black text-gray-900 leading-tight">{bike.title}</p>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${bike.type === 'Car' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {bike.type || 'Bike'}
                           </span>
                        </div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                           {bike.brand} • {bike.yom} Model
                        </p>
                      </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 whitespace-nowrap">
                         <Settings size={12} className="text-blue-500" /> {bike.engine_cc} CC • {bike.km_driven} KM
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">
                         {bike.fuel_type} • {bike.owners} Owner
                      </span>
                   </div>
                </td>
                <td className="px-6 py-6">
                   <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="text-red-400" />
                      <div>
                         <p className="text-xs font-bold">{bike.city}</p>
                         <p className="text-[10px] font-black text-gray-400 uppercase">{bike.area}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-6">
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                         <IndianRupee size={16} className="text-emerald-500" />
                         <span className="text-lg font-black text-gray-900">
                            {(Number(bike.expected_price) + 2000).toLocaleString()}
                         </span>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase mt-1">
                         Base: ₹{Number(bike.expected_price).toLocaleString()} • Markup: ₹2,000
                      </span>
                   </div>
                </td>
                <td className="px-6 py-6">
                   <select 
                     value={bike.status}
                     onChange={(e) => updateStatus(bike.id, e.target.value)}
                     className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm outline-none cursor-pointer transition-all ${getStatusColor(bike.status)}`}
                   >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="sold">Sold</option>
                   </select>
                </td>
                <td className="px-6 py-6 last:pr-10 text-right">
                   <div className="flex items-center justify-end gap-2">
                       <button 
                          onClick={() => setSelectedBike(bike)}
                          className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                           <Eye size={16} />
                        </button>
                       <button 
                         onClick={() => navigate(`/admin/add-vehicle/${bike.id}`)}
                         className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm"
                       >
                          <Edit size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(bike.id)}
                         className="p-2.5 rounded-xl bg-gray-50 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                       >
                          <Trash2 size={16} />
                       </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedBikes.length === 0 && (
          <div className="py-32 text-center">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
                <Plus className="w-12 h-12 text-gray-200" />
             </div>
             <h3 className="text-xl font-black text-gray-800">No Vehicle Listings Found</h3>
             <p className="text-gray-400 mt-2 font-medium max-w-sm mx-auto">
                Start by adding your first vehicle to the inventory manually.
             </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* VIEW MODAL */}
      {selectedBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                     {selectedBike.type === 'Car' ? <Car className="text-white w-6 h-6" /> : <Bike className="text-white w-6 h-6" />}
                  </div>
                  <div>
                     <h3 className="font-black text-gray-900 text-lg">{selectedBike.title}</h3>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedBike.brand} • {selectedBike.model}</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSelectedBike(null)}
                 className="p-3 bg-white rounded-2xl text-gray-400 hover:text-black hover:shadow-lg transition-all"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
               {/* Image Gallery */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedBike.images && Object.entries(JSON.parse(selectedBike.images)).map(([key, url]) => (
                    url && (
                      <div key={key} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border">
                        <img src={url} className="w-full h-full object-cover" alt={key} />
                        <p className="text-[8px] font-black uppercase bg-black/60 text-white p-1 text-center mt-[-15px] relative z-10">{key}</p>
                      </div>
                    )
                  ))}
               </div>

               {/* Specs Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Engine", value: `${selectedBike.engine_cc} CC`, icon: Settings },
                    { label: "Fuel", value: selectedBike.fuel_type, icon: IndianRupee },
                    { label: "Mileage", value: `${selectedBike.mileage} Kmpl`, icon: Bike },
                    { label: "Driven", value: `${selectedBike.km_driven} KM`, icon: MapPin },
                    { label: "Owners", value: `${selectedBike.owners} Owner`, icon: User },
                    { label: "YOM", value: selectedBike.yom, icon: Settings },
                    { label: "Price", value: `₹${(Number(selectedBike.expected_price)+2000).toLocaleString()}`, icon: IndianRupee },
                    { label: "City", value: selectedBike.city, icon: MapPin },
                  ].map((spec, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                       <p className="text-sm font-black text-gray-900">{spec.value}</p>
                    </div>
                  ))}
               </div>

               {/* Seller & Description */}
               <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-[1.5rem] border border-blue-100">
                     <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Seller Details</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[10px] font-bold text-blue-400">Name</p>
                           <p className="font-black text-gray-900">{selectedBike.seller_name}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-blue-400">Phone</p>
                           <p className="font-black text-gray-900">{selectedBike.seller_phone}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</h4>
                     <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {selectedBike.description || "No description provided."}
                     </p>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex gap-4">
                <button 
                  onClick={() => { setSelectedBike(null); navigate(`/admin/add-vehicle/${selectedBike.id}`); }}
                  className="flex-1 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                >
                  Edit Listing
                </button>
               <button 
                 onClick={() => setSelectedBike(null)}
                 className="px-8 py-4 bg-white text-gray-500 rounded-2xl font-black uppercase tracking-widest border hover:bg-gray-100 transition-all"
               >
                  Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBikes;
