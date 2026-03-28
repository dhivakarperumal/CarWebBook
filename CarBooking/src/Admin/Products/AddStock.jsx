import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

const AddStock = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState("");
  const [addQty, setAddQty] = useState("");

  /* FETCH PRODUCTS */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const list = snap.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
    });

    return () => unsub();
  }, []);

  const selectedProduct = products.find(
    (p) => p.docId === selectedProductId
  );

  const selectedVariant =
    selectedProduct?.variants?.[selectedVariantIndex];

  const currentStock = Number(selectedVariant?.stock || 0);
  const newStock = currentStock + Number(addQty || 0);

  /* UPDATE STOCK */
  const handleUpdateStock = async () => {
    if (!selectedProductId || selectedVariantIndex === "") {
      toast.error("Select product and variant");
      return;
    }

    if (Number(addQty) <= 0) {
      toast.error("Enter valid quantity");
      return;
    }

    try {
      const updatedVariants = selectedProduct.variants.map((v, i) => {
        if (i === Number(selectedVariantIndex)) {
          return {
            ...v,
            stock: newStock,
          };
        }
        return v;
      });

      const totalStock = updatedVariants.reduce(
        (sum, v) => sum + Number(v.stock || 0),
        0
      );

      await updateDoc(doc(db, "products", selectedProduct.docId), {
        variants: updatedVariants,
        totalStock: totalStock,
      });

      toast.success("Stock added successfully");

      /* RESET */
      setSelectedProductId("");
      setSelectedVariantIndex("");
      setAddQty("");
    } catch (error) {
      console.error(error);
      toast.error("Stock update failed");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow space-y-5">
      <h2 className="text-2xl font-bold">Add Stock</h2>

      {/* PRODUCT SELECT */}
      <div>
        <label className="text-sm font-medium">Select Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            setSelectedVariantIndex("");
            setAddQty("");
          }}
          className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition transition"
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.docId} value={p.docId}>
              {p.name} (Stock: {p.totalStock || 0})
            </option>
          ))}
        </select>
      </div>

      {/* VARIANT SELECT */}
      {selectedProduct && (
        <div>
          <label className="text-sm font-medium">
            Select Variant
          </label>
          <select
            value={selectedVariantIndex}
            onChange={(e) => setSelectedVariantIndex(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition transition"
          >
            <option value="">Select Variant</option>
            {selectedProduct.variants?.map((v, i) => (
              <option key={i} value={i}>
                {v.position} | {v.material} | SKU: {v.sku} (Stock:{" "}
                {v.stock})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STOCK DETAILS */}
      {selectedVariant && (
        <div className="">
          <div>
            Current Stock:{" "}
            <span className="font-semibold text-blue-600">
              {currentStock}
            </span>
          </div>

          <input
            type="number"
            placeholder="Enter quantity to add"
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition transition"
          />

          <div>
            New Stock:{" "}
            <span className="font-bold text-green-600">
              {newStock}
            </span>
          </div>
        </div>
      )}

      {/* BUTTON */}
      <button
        onClick={handleUpdateStock}
        className=" 
bg-gradient-to-r from-black to-cyan-400
text-white px-6 py-3 rounded
hover:from-cyan-400 hover:to-black
transition-all duration-500 ease-in-out
hover:scale-105 hover:shadow-lg
"
      >
        Update Stock
      </button>
    </div>
  );
};

export default AddStock;

