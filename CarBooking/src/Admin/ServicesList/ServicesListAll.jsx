import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import {
  Trash2,
  Pencil,
  LayoutGrid,
  List,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../Components/Pagination";

// Global cache for seamless navigation
let servicesCache = null;

const ServicesListAll = () => {
  const [services, setServices] = useState(servicesCache || []);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(!servicesCache);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  /* ================= FETCH DATA ================= */
  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      const data = res.data || [];
      setServices(data);
      servicesCache = data;
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ================= RESET PAGE ON FILTER ================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;

    try {
      await api.delete(`/services/${id}`);
      toast.success("Service deleted");
      fetchServices();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ================= CATEGORY LIST ================= */
  const categories = useMemo(() => {
    const cats = services
      .map((s) => s.category?.trim())
      .filter(Boolean);

    return ["all", ...new Set(cats)];
  }, [services]);

  /* ================= FILTER ================= */
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const name = srv.name?.toLowerCase() || "";
      const cat = srv.category?.toLowerCase() || "";

      const matchSearch =
        name.includes(search.toLowerCase()) ||
        cat.includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === "all" ||
        srv.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [services, search, categoryFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage]);

  /* ================= LOADING ================= */

  return (
    <div className="p-6 max-w-7xl mx-auto pb-5">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* SEARCH */}
        <div className="relative w-full lg:w-94">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[45px] w-full pl-9 pr-3 py-3 border border-gray-300 bg-white
               rounded-md text-sm shadow-sm
               focus:ring-2 focus:ring-black outline-none transition"
          />
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 justify-end">

          <button
            onClick={() => setView("card")}
            className={`h-[42px] flex items-center gap-2 px-4 rounded-md text-sm border shadow-sm
              ${view === "card"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            <LayoutGrid size={18} /> Card
          </button>

          <button
            onClick={() => setView("table")}
            className={`h-[42px] flex items-center gap-2 px-4 rounded-md text-sm border shadow-sm
              ${view === "table"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            <List size={18} /> Table
          </button>

          <button
            onClick={() => navigate("/admin/addservices")}
            className="h-[42px] flex items-center gap-2
             bg-black text-white px-4 rounded-md font-semibold shadow
             hover:bg-gray-900 transition"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Service</span>
          </button>
        </div>
      </div>

      {/* ================= CARD VIEW ================= */}
      {view === "card" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-10">
          {paginatedServices.map((srv) => (
            <div
              key={srv.id}
              className="border border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
            >
              {srv.image && (
                <img
                  src={srv.image}
                  alt={srv.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}

              <h3 className="font-semibold text-sm">{srv.name}</h3>

              <p className="text-sm font-medium mt-2">
                ₹{Number(srv.price || 0).toLocaleString()}
              </p>

              <div className="flex justify-end gap-3 mt-3">
                <button
                  onClick={() =>
                    navigate(`/admin/addservices/${srv.id}`)
                  }
                  className="p-3 rounded-full border border-gray-300"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-3 rounded-full border border-gray-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200 mt-10">
          <table className="w-full text-md whitespace-nowrap">
            <thead className="bg-[#020617] text-white">
              <tr>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Image</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Name</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Price</th>
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedServices.map((srv, i) => (
                <tr key={srv.id} className="border-t border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </td>

                  <td className="px-4 py-4">
                    {srv.image ? (
                      <img
                        src={srv.image}
                        alt={srv.name}
                        className="w-12 h-12 object-cover rounded-md border"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No image</span>
                    )}
                  </td>

                  <td className="px-4 py-4 font-medium">{srv.name}</td>

                  <td className="px-4 py-4">
                    ₹{Number(srv.price || 0).toLocaleString()}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          navigate(`/admin/addservices/${srv.id}`)
                        }
                        className="p-3 rounded-full border border-gray-300"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(srv.id)}
                        className="p-3 rounded-full border border-gray-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ServicesListAll;