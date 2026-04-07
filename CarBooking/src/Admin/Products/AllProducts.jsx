import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";
import { 
  FaTable, 
  FaThLarge, 
  FaEdit, 
  FaTrashAlt, 
  FaThList, 
  FaWarehouse, 
  FaStar, 
  FaCheckCircle,
  FaSearch,
  FaPlus
} from "react-icons/fa";

const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white border border-gray-300 rounded-md p-6 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
      </div>
      <div className={`p-4 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-lg shadow-black/10`}>
        {icon}
      </div>
    </div>
  </div>
);

const ITEMS_PER_PAGE = 6;

const AllProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /* FETCH */
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  /* STATS */
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.totalStock || 0), 0);
    const featuredCount = products.filter(p => p.isFeatured).length;
    const activeCount = products.filter(p => p.isActive).length;
    return { totalProducts, totalStock, featuredCount, activeCount };
  }, [products]);

  /* DELETE */
  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${docId}`);
      toast.success("🗑️ Product deleted");
      fetchProducts();
    } catch {
      toast.error("❌ Delete failed");
    }
  };

  /* EDIT */
  const handleEdit = (product) => {
    navigate("/admin/addproducts", { state: { editData: product } });
  };

  /* TOGGLE ACTIVE */
  const toggleStatus = async (product) => {
    try {
      await api.put(`/products/status/${product.docId}`, { isActive: !product.isActive });
      toast.success("Status updated");
      fetchProducts();
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* FILTER + SEARCH */
  const filteredProducts = products
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filter === "active") return p.isActive;
      if (filter === "inactive") return !p.isActive;
      if (filter === "featured") return p.isFeatured;
      return true;
    });

  /* PAGINATION */
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) return <div className="p-6">Loading products...</div>;

  return (
    <div className="p-6 min-h-screen space-y-8 animate-fadeIn">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={<FaThList />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Total Stock" 
          value={stats.totalStock} 
          icon={<FaWarehouse />} 
          gradient="from-emerald-600 to-emerald-400" 
        />
        <StatCard 
          title="Featured Items" 
          value={stats.featuredCount} 
          icon={<FaStar />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Active Products" 
          value={stats.activeCount} 
          icon={<FaCheckCircle />} 
          gradient="from-indigo-600 to-indigo-400" 
        />
      </div>

      {/* SEARCH/FILTERS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-4 relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search catalog by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="lg:col-span-8 flex flex-wrap items-center justify-end gap-4">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="h-[56px] px-8 bg-white border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer focus:border-black shadow-sm"
          >
            <option value="all">Global Catalog</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="featured">Featured Listing</option>
          </select>

          <div className="flex h-[56px] bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "table" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaTable /> Table
            </button>
            <button
              onClick={() => setView("card")}
              className={`flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "card" ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-gray-900"}`}
            >
              <FaThLarge /> Cards
            </button>
          </div>

          <button
            onClick={() => navigate("/admin/addproducts")}
            className="h-[56px] px-10 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 flex items-center gap-3 active:scale-95"
          >
            <FaPlus /> Build New Product
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center text-gray-500">
          No products found
        </div>
      ) : view === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
          <table className="w-full text-md whitespace-nowrap">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left">S No</th>
                <th className="px-4 py-4 text-left">Image</th>
                <th className="px-4 py-4 text-left">Name</th>
                <th className="px-4 py-4 text-left">Price</th>
                <th className="px-4 py-4 text-left">Stock</th>
                <th className="px-4 py-4 text-left">Rating</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p, index) => (
                <tr key={p.docId} className="border-t border-gray-300 hover:bg-gray-50 transition">
                  <td className="p-4">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td className="p-4">
                    {(p.images && p.images.length > 0) || p.thumbnail ? (
                      <img 
                        src={
                          (p.images && p.images.length > 0) 
                            ? p.images[0] 
                            : (p.thumbnail?.startsWith('[') ? JSON.parse(p.thumbnail)[0] : p.thumbnail)
                        } 
                        className="w-12 h-12 rounded-lg object-cover border shadow-sm" 
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {p.name}
                    {p.isFeatured && (
                      <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">Featured</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-left text-gray-900">
                    ₹ {p.offerPrice || p.mrp}
                    {p.offerPrice && <div className="text-xs text-gray-400 line-through">₹ {p.mrp}</div>}
                  </td>
                  <td className="p-4">{p.totalStock || 0}</td>
                  <td className="p-4">⭐ {p.rating || 0}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${p.isActive ? "bg-black text-white hover:bg-gray-800" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(p)} className="p-3 rounded-full border border-gray-300 transition hover:bg-black hover:text-white"><FaEdit /></button>
                      <button onClick={() => handleDelete(p.docId)} className="p-3 rounded-full border border-gray-300 transition hover:bg-red-50 hover:text-red-600"><FaTrashAlt /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((p) => (
            <div key={p.docId} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
              <div className="relative">
                <img 
                  src={
                    (p.images && p.images.length > 0) 
                      ? p.images[0] 
                      : (p.thumbnail?.startsWith('[') ? JSON.parse(p.thumbnail)[0] : p.thumbnail)
                  } 
                  className="w-full h-44 object-cover rounded-xl mb-3" 
                  alt={p.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Product+Image";
                  }}
                />
                {p.isFeatured && <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 rounded-full">Featured</span>}
              </div>
              <h3 className="font-semibold text-lg text-gray-900">{p.name}</h3>
              <div className="text-sm text-gray-500 mb-2">⭐ {p.rating || 0}</div>
              <div className="text-black font-bold text-lg">₹ {p.offerPrice || p.mrp}</div>
              <div className="text-xs text-gray-400 mb-3">Stock: {p.totalStock || 0}</div>
              <div className="flex justify-between mt-auto gap-2">
                <button onClick={() => handleEdit(p)} className="p-3 rounded-full border border-gray-300 transition"><FaEdit /></button>
                <button onClick={() => handleDelete(p.docId)} className="p-3 rounded-full border border-gray-300 transition"><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AllProducts;
