import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Filter,
  RotateCcw,
  Pencil,
  Trash2,
  Box,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
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
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-md border border-gray-300 shadow flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
    </div>
    <div className={`p-3 rounded-full ${color.replace("text", "bg")}/10`}>
      {icon}
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
          className="bg-black hover:bg-orange-500 font-bold text-white px-5 py-3 rounded-md flex items-center gap-2 shadow"
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {/* ===== DASHBOARD CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Items" value={totalItems} icon={<Box />} color="text-blue-600" />
        <StatCard title="Low Stock Alerts" value={lowStock} icon={<AlertTriangle />} color="text-yellow-600" />
        <StatCard title="Out of Stock Items" value={outOfStock} icon={<ShoppingCart />} color="text-red-600" />
        {/* <StatCard title="Received Orders This Month" value={receivedOrders} icon={<ShoppingCart />} color="text-green-600" /> */}
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
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">S No</th>
                <th className="px-4 py-4 text-left font-semibold">Item Name</th>
                <th className="px-4 py-4 text-left font-semibold">Category</th>
                <th className="px-4 py-4 text-left font-semibold">Supplier</th>
                <th className="px-4 py-4 text-left font-semibold">Stock Qty</th>
                <th className="px-4 py-4 text-left font-semibold">Status</th>
                <th className="px-4 py-4 text-center font-semibold">Actions</th>
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
                      className="p-3 rounded-full  border border-gray-300  transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-3 rounded-full  border border-gray-300  transition"
                    >
                      <Trash2 size={14} />
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
      </div>
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

