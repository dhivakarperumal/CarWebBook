import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaTimesCircle,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrashAlt
} from "react-icons/fa";
import Pagination from "../../Components/Pagination";

/* =======================
   COMMON INPUT STYLE
======================= */
const inputStyle = `
  border border-gray-200
  rounded-md
  px-4 py-3
  text-sm text-gray-700
  bg-white
  shadow-sm
  hover:shadow-md
  focus:outline-none
  focus:ring-2 focus:ring-gray-900
  transition
  cursor-pointer
  w-full sm:w-40 lg:w-70
`;

/* =======================
   STAT CARD
======================= */
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

const Inventory = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const [filters, setFilters] = useState({
    category: "",
    vendor: "",
    search: "",
  });

  /* =======================
     LOAD INVENTORY
  ======================= */
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await api.get("/inventory");
      const data = response.data.map(d => ({
        id: d.id,
        ...d,
      }));

      setItems(data);
      setFilteredItems(data);

      setCategories([...new Set(data.map(i => i.category).filter(Boolean))]);
      setSuppliers([...new Set(data.map(i => i.vendor).filter(Boolean))]);
    } catch {
      toast.error("Failed to load inventory");
    }
  };

  /* =======================
     STATS
  ======================= */
  const totalItems = items.length;
  const lowStock = items.filter(
    i => i.stockQty > 0 && i.stockQty <= i.minStock
  ).length;
  const outOfStock = items.filter(i => i.stockQty === 0).length;
  const receivedOrders = 18;

  /* =======================
     FILTER HANDLERS
  ======================= */
  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilter = () => {
    let data = [...items];

    if (filters.category)
      data = data.filter(i => i.category === filters.category);

    if (filters.vendor)
      data = data.filter(i => i.vendor === filters.vendor);

    if (filters.search)
      data = data.filter(i =>
        i.partName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        i.vendor?.toLowerCase().includes(filters.search.toLowerCase())
      );

    setFilteredItems(data);
  };

  const resetFilter = () => {
    setFilters({ category: "", vendor: "", search: "" });
    setFilteredItems(items);
  };


  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category, filters.vendor, filters.search]);

  /* =======================
     DELETE
  ======================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Item deleted");
      loadInventory();
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  /* =======================
     STATUS BADGE
  ======================= */
  const getStatus = (item) => {
    if (item.stockQty === 0)
      return (
        <span className="bg-red-500 text-white px-3 py-1 rounded text-xs">
          Out of Stock
        </span>
      );
    if (item.stockQty <= item.minStock)
      return (
        <span className="bg-yellow-400 text-black px-3 py-1 rounded text-xs">
          Low Stock
        </span>
      );
    return (
      <span className="bg-green-500 text-white px-3 py-1 rounded text-xs">
        In Stock
      </span>
    );
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/admin/additemsinventory")}
          className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          <FaPlus size={14} /> Add New Item
        </button>
      </div>

      {/* ===== DASHBOARD CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Spare Parts" 
          value={totalItems} 
          icon={<FaBoxOpen />} 
          gradient="from-blue-600 to-blue-400" 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStock} 
          icon={<FaExclamationTriangle />} 
          gradient="from-amber-600 to-amber-400" 
        />
        <StatCard 
          title="Out of Stock" 
          value={outOfStock} 
          icon={<FaTimesCircle />} 
          gradient="from-rose-600 to-rose-400" 
        />
      </div>

      {/* ===== FILTER + ADD ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* LEFT — SEARCH */}
        <div className="w-full lg:w-1/2">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search item or supplier"
            className={inputStyle}
          />
        </div>

        {/* RIGHT — FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto justify-end">
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            name="vendor"
            value={filters.vendor}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

      </div>


      {/* ===== INVENTORY TABLE ===== */}
      {/* <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"> */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700 whitespace-nowrap">
            <thead className="bg-[#020617] text-white">
              <tr>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Item Name</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Category</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Supplier</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Stock Qty</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Status</th>
                <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-3 py-4">{index + 1}</td>
                  <td className="px-3 py-4">{item.partName}</td>
                  <td className="px-3 py-4">{item.category}</td>
                  <td className="px-3 py-4">{item.vendor}</td>
                  <td className="px-3 py-4 font-semibold">{item.stockQty}</td>
                  <td className="px-3 py-4">{getStatus(item)}</td>
                  <td className="px-3 py-4 flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/admin/additemsinventory/${item.id}`)}
                      className="p-3 rounded-full border border-gray-300 transition hover:bg-black hover:text-white"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-3 rounded-full border border-gray-300 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <p className="text-center py-6 text-gray-500">
              No items found
            </p>
          )}
        </div>
      {/* </div> */}
      {totalPages > 1 && (
        <div className="flex justify-center p-4 bg-white border-t border-gray-100 rounded-2xl shadow-sm mt-4">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

    </div>
  );
};

export default Inventory;

