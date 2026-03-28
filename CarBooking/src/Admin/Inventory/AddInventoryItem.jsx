import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";


const labelClass = "text-sm font-semibold text-gray-800 mb-1";
const inputClass ="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition transition";

const AddInventoryItem = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 🔥 detect edit mode

  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    partName: "",
    category: "",
    vendor: "",
    stockQty: "",
    minStock: "",
  });

  const categories = [
    "Engine Parts",
    "Brake System",
    "Suspension",
    "Electrical",
    "Filters",
    "Oils & Fluids",
    "Tyres & Wheels",
    "Body Parts",
    "Accessories",
  ];

  const vendors = [
    "Bosch Auto Parts",
    "TVS Motor Spares",
    "MRF Distributors",
    "Castrol India",
    "Local Vendor",
  ];

  /* =======================
     FETCH ITEM (EDIT)
  ======================= */
  useEffect(() => {
    if (!isEditMode) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/inventory/${id}`);
        setForm(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load item");
        navigate("/admin/inventory");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, isEditMode, navigate]);

  /* =======================
     HANDLER
  ======================= */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =======================
     SUBMIT
  ======================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { partName, category, vendor, stockQty, minStock } = form;

    if (!partName || !category || !vendor || !stockQty || !minStock) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // 🔁 UPDATE
        await api.put(`/inventory/${id}`, {
          partName,
          category,
          vendor,
          stockQty: Number(stockQty),
          minStock: Number(minStock),
        });

        toast.success("Spare part updated");
      } else {
        // ➕ ADD
        await api.post("/inventory", {
          partName,
          category,
          vendor,
          stockQty: Number(stockQty),
          minStock: Number(minStock),
        });

        toast.success("Spare part added");
      }

      navigate("/admin/inventory");
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow space-y-6">
      <h2 className="text-2xl font-semibold text-blue-700">
        🔧 {isEditMode ? "Edit Spare Part" : "Add Car Spare Part"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Part Name *</label>
            <input
              name="partName"
              value={form.partName}
              onChange={handleChange}
              placeholder="Enter part name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Category *</label>
            <select
              name="category"
              value={form.category}
              
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Vendor *</label>
            <select
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Stock Qty *</label>
            <input
              type="number"
              name="stockQty"
              placeholder="Enter Stock Qty"
              value={form.stockQty}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Min Stock *</label>
            <input
              type="number"
              name="minStock"
              placeholder="Enter Min Stock"
              value={form.minStock}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-orange-400 text-white px-6 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Saving..." : isEditMode ? "Update Part" : "Save Part"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInventoryItem;

