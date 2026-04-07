import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  FaTable, 
  FaThLarge, 
  FaPlus, 
  FaSearch, 
  FaBoxOpen, 
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 6;

const StockDetails = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [stockInputs, setStockInputs] = useState({});
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  /* SEARCH FILTER */
  const filteredProducts = useMemo(() =>
    products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  /* PAGINATION */
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  useEffect(() => { setPage(1); }, [search]);

  /* HANDLE STOCK INPUT */
  const handleStockChange = (productId, index, value) => {
    setStockInputs((prev) => ({ ...prev, [`${productId}-${index}`]: value }));
  };

  /* UPDATE STOCK */
  const updateStock = async (product) => {
    try {
      const updatedVariants = product.variants.map((v, i) => {
        const key = `${product.docId}-${i}`;
        const addedStock = Number(stockInputs[key] || 0);
        return { ...v, stock: Number(v.stock) + addedStock };
      });

      const totalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      await api.put(`/products/stock/${product.docId}`, { variants: updatedVariants, totalStock });

      toast.success("Stock updated");
      setStockInputs({});
      fetchProducts();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 animate-fadeIn">
      {/* HEADER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 relative group">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Scan or search inventory catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>

        <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-3">
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
            onClick={() => navigate("/admin/addstock")}
            className="h-[56px] px-10 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 flex items-center gap-3"
          >
            <FaPlus /> Refill Stock
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="overflow-x-auto bg-white rounded-xl mt-15 shadow">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left">S No</th>
                <th className="px-4 py-4 text-left">Image</th>
                <th className="px-4 py-4 text-left">Product</th>
                <th className="px-4 py-4 text-left">Variants</th>
                <th className="px-4 py-4 text-left">Total Stock</th>
                <th className="px-4 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p, i) => (
                <React.Fragment key={p.docId}>
                  <tr className="border-t border-gray-300">
                    <td className="p-3 font-medium">{i + 1}</td>
                    <td className="p-4">
                      {p.thumbnail || (p.images && p.images.length > 0) ? (
                        <img 
                          src={
                            (p.images && p.images.length > 0) 
                              ? p.images[0] 
                              : (p.thumbnail?.startsWith('[') ? JSON.parse(p.thumbnail)[0] : p.thumbnail)
                          } 
                          alt={p.name} 
                          className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm transition-transform hover:scale-105" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150?text=No+Img";
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center border border-dashed border-gray-300">
                          <FaBoxOpen className="text-gray-200" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.variants?.length || 0}</td>
                    <td className="p-3">
                      <span className={p.totalStock < 5 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        {p.totalStock || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setExpanded(expanded === p.docId ? null : p.docId)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expanded === p.docId ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {expanded === p.docId ? "Close Panel" : "View Inventory"}
                      </button>
                    </td>
                  </tr>

                  {expanded === p.docId && (
                    <tr>
                      <td colSpan="6" className="p-4 bg-gray-50">
                        <div className="space-y-3">
                          {p.variants?.map((v, vi) => {
                            const key = `${p.docId}-${vi}`;
                            return (
                              <div key={vi} className="grid grid-cols-5 gap-3 items-center">
                                <div className="text-sm">{v.position} | {v.material}</div>
                                <div className="text-sm">SKU: {v.sku}</div>
                                <div className="text-sm">Current: <span className="font-semibold">{v.stock}</span></div>
                                <input
                                  type="number"
                                  placeholder="Add qty"
                                  value={stockInputs[key] || ""}
                                  onChange={(e) => handleStockChange(p.docId, vi, e.target.value)}
                                  className="border px-2 py-1 rounded text-sm"
                                />
                                <div className="text-sm font-semibold text-green-600">
                                  New: {Number(v.stock) + Number(stockInputs[key] || 0)}
                                </div>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => updateStock(p)}
                            className="bg-black text-white px-4 py-2 rounded text-sm"
                          >
                            Update Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CARD VIEW */}
      {view === "card" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProducts.map((p) => (
            <div key={p.docId} className="bg-white rounded-xl shadow border p-4">
              {p.thumbnail && (
                <img src={p.thumbnail} alt={p.name} className="w-full h-32 object-cover rounded mb-3" />
              )}
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-500">Variants: {p.variants?.length || 0}</p>
              <p className="text-sm">
                Total Stock:{" "}
                <span className={p.totalStock < 5 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                  {p.totalStock || 0}
                </span>
              </p>
              <button
                onClick={() => setExpanded(expanded === p.docId ? null : p.docId)}
                className="mt-2 bg-gray-200 px-3 py-1 rounded text-xs"
              >
                {expanded === p.docId ? "Hide" : "Manage"}
              </button>

              {expanded === p.docId && (
                <div className="mt-3 space-y-2">
                  {p.variants?.map((v, vi) => {
                    const key = `${p.docId}-${vi}`;
                    return (
                      <div key={vi} className="border p-2 rounded text-sm">
                        <div>{v.position} | {v.material}</div>
                        <div>Stock: {v.stock}</div>
                        <input
                          type="number"
                          placeholder="Add qty"
                          value={stockInputs[key] || ""}
                          onChange={(e) => handleStockChange(p.docId, vi, e.target.value)}
                          className="border px-2 py-1 rounded w-full mt-1"
                        />
                        <div className="text-green-600 font-semibold">
                          New: {Number(v.stock) + Number(stockInputs[key] || 0)}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => updateStock(p)} className="bg-black text-white px-4 py-2 rounded text-sm w-full">
                    Update Stock
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center mt-10">
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default StockDetails;
