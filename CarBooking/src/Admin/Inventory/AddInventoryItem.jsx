// import { useState } from "react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// const inputClass="w-full px-4 py-3 rounded-lg bg-white/95 text-gray-800 placeholder-gray-400 border border-white/40 shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#0B3C8A] focus:border-white transition-all duration-200 ease-in-out disabled:bg-white/60 disabled:cursor-not-allowed"


// const AddInventoryItem = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     itemName: "",
//     category: "",
//     supplier: "",
//     stockQty: "",
//     minStock: "",
//   });

//   const categories = [
//     "Medicines",
//     "Consumables",
//     "Dental Instruments",
//     "Surgical",
//     "Equipment",
//   ];

//   const suppliers = [
//     "Medico Supplies",
//     "HealthCare Corp.",
//     "DenTek Industries",
//     "MediDent Corp.",
//   ];

//   /* =======================
//      HANDLER
//   ======================= */
//   const handleChange = (e) => {
//     setForm(prev => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   /* =======================
//      SUBMIT
//   ======================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !form.itemName ||
//       !form.category ||
//       !form.supplier ||
//       !form.stockQty ||
//       !form.minStock
//     ) {
//       toast.error("Please fill all fields");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "inventory"), {
//         itemName: form.itemName,
//         category: form.category,
//         supplier: form.supplier,
//         stockQty: Number(form.stockQty),
//         minStock: Number(form.minStock),
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       });

//       toast.success("Item added successfully");
//       navigate("/admin/inventory");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to add item");
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow space-y-6">

//       <h2 className="text-2xl font-semibold text-blue-700">
//         ➕ Add New Inventory Item
//       </h2>

//       <form onSubmit={handleSubmit} className="space-y-6">

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//           <div>
//             <label className="block text-sm text-gray-600">Item Name *</label>
//             <input
//               type="text"
//               name="itemName"
//               value={form.itemName}
//               onChange={handleChange}
//               className={inputClass}
//               placeholder="Enter item name"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600">Category *</label>
//             <select
//               name="category"
//               value={form.category}
//               onChange={handleChange}
//               className={inputClass}
//             >
//               <option value="">Select category</option>
//               {categories.map(c => (
//                 <option key={c}>{c}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600">Supplier *</label>
//             <select
//               name="supplier"
//               value={form.supplier}
//               onChange={handleChange}
//               className={inputClass}
//             >
//               <option value="">Select supplier</option>
//               {suppliers.map(s => (
//                 <option key={s}>{s}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600">Stock Quantity *</label>
//             <input
//               type="number"
//               name="stockQty"
//               value={form.stockQty}
//               onChange={handleChange}
//               className={inputClass}
//               placeholder="Enter stock quantity"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600">Minimum Stock *</label>
//             <input
//               type="number"
//               name="minStock"
//               value={form.minStock}
//               onChange={handleChange}
//               className={inputClass}
//               placeholder="Low stock alert limit"
//             />
//           </div>

//         </div>

//         <div className="flex justify-end gap-4">
//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="border border-gray-300 px-6 py-2 rounded"
//           >
//             Cancel
//           </button>

//           <button
//             type="submit"
//             className="bg-blue-600 text-white px-6 py-2 rounded"
//           >
//             Save Item
//           </button>
//         </div>

//       </form>
//     </div>
//   );
// };

// export default AddInventoryItem;


import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

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
        const docRef = doc(db, "carInventory", id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          toast.error("Item not found");
          navigate("/admin/inventory");
          return;
        }

        setForm(snap.data());
      } catch (err) {
        console.error(err);
        toast.error("Failed to load item");
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
        await updateDoc(doc(db, "carInventory", id), {
          partName,
          category,
          vendor,
          stockQty: Number(stockQty),
          minStock: Number(minStock),
          updatedAt: serverTimestamp(),
        });

        toast.success("Spare part updated");
      } else {
        // ➕ ADD
        await addDoc(collection(db, "carInventory"), {
          partName,
          category,
          vendor,
          stockQty: Number(stockQty),
          minStock: Number(minStock),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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

