import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTable, FaThLarge } from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";
import Pagination from "../../Components/Pagination";

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
    <div className="p-6 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-gray-300 bg-white px-4 py-3 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-black outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="h-[42px] w-full sm:w-auto flex-1 min-w-[140px] border border-gray-300 bg-white px-4 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-black outline-none transition"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
          </select>

          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => setView("table")}
              className={`h-[42px] flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 rounded-md text-sm border shadow-sm transition ${view === "table" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
            >
              <FaTable /> Table
            </button>
            <button
              onClick={() => setView("card")}
              className={`h-[42px] flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 rounded-md text-sm border shadow-sm transition ${view === "card" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
            >
              <FaThLarge /> Card
            </button>
          </div>

          <button
            onClick={() => navigate("/admin/addproducts")}
            className="h-[42px] w-full sm:w-auto bg-black text-white px-5 rounded-md font-bold shadow hover:bg-gray-900 transition"
          >
            + Add Product
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
                      <button onClick={() => handleEdit(p)} className="p-3 rounded-full border border-gray-300 transition"><FaEdit /></button>
                      <button onClick={() => handleDelete(p.docId)} className="p-3 rounded-full border border-gray-300 transition"><FaTrash /></button>
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
