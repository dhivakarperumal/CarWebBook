import React, { useState, useEffect } from "react";
import api from "../api";
import { Plus, Trash, Search, MapPin, Loader2, Edit2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const ServiceAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({ pincode: "", area_name: "" });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/service-areas");
      setAreas(res.data || []);
    } catch (err) {
      toast.error("Failed to load service areas");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await api.put(`/service-areas/${editingArea.id}`, formData);
        toast.success("Area updated successfully");
      } else {
        await api.post("/service-areas", formData);
        toast.success("Area added successfully");
      }
      setIsModalOpen(false);
      setEditingArea(null);
      setFormData({ pincode: "", area_name: "" });
      fetchAreas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service area?")) return;
    try {
      await api.delete(`/service-areas/${id}`);
      toast.success("Area deleted");
      fetchAreas();
    } catch (err) {
      toast.error("Failed to delete area");
    }
  };

  const toggleStatus = async (area) => {
    try {
      const newStatus = area.status === "active" ? "inactive" : "active";
      await api.patch(`/service-areas/${area.id}/status`, { status: newStatus });
      toast.success(`Area ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchAreas();
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const filteredAreas = (areas || []).filter(
    (area) =>
      area.pincode?.includes(searchTerm) ||
      area.area_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Service Area Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage areas where your services are available.</p>
        </div>
        <button
          onClick={() => {
            setEditingArea(null);
            setFormData({ pincode: "", area_name: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Area
        </button>
      </div>

      {/* FILTER & STATS BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by pincode or area name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-600 shadow-sm"
          />
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Total Locations</p>
              <h4 className="text-xl font-bold">{areas.length}</h4>
            </div>
          </div>
          <div className="text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1 rounded-full">
            {areas.filter((a) => a.status === "active").length} Active
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="font-semibold">Fetching areas...</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-2">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <MapPin className="w-8 h-8" />
            </div>
            <p className="font-bold text-slate-500 text-lg uppercase tracking-wider">No Areas Found</p>
            <p className="text-sm">{searchTerm ? "Try a different search term" : "Click 'Add Area' to get started"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-5">S.No</th>
                  <th className="px-6 py-5">Pincode</th>
                  <th className="px-6 py-5">Area Name</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.map((area, index) => (
                  <tr key={area.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-800 text-sm font-bold rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors shadow-sm">
                        {area.pincode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{area.area_name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(area)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                          area.status === "active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                            : "bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700"
                        }`}
                      >
                        {area.status === "active" ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Active</>
                        ) : (
                          <><XCircle className="w-3.5 h-3.5" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-10 sm:opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingArea(area);
                            setFormData({ pincode: area.pincode, area_name: area.area_name });
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(area.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingArea ? "Edit Location" : "Add New Location"}</h3>
                <p className="text-slate-500 text-xs">Enter pincode and area details</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-800"
                  placeholder="e.g. 641001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Area Name</label>
                <input
                  type="text"
                  name="area_name"
                  required
                  value={formData.area_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-800"
                  placeholder="e.g. Gandhipuram, Coimbatore"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 border border-slate-100 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  {editingArea ? "Save Changes" : "Confirm Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAreas;
