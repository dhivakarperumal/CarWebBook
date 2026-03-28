import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

const PricingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState([""]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const pricingRef = collection(db, "pricingPackages");

  /* 🔄 Fetch package for edit */
  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "pricingPackages", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setTitle(data.title || "");
          setPrice(data.price || "");
          setFeatures(data.features?.length ? data.features : [""]);
          setEditId(id);
        } else {
          toast.error("Package not found");
          navigate("/admin/pricing");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading package");
      }
    };

    fetchPackage();
  }, [id, navigate]);

  /* 🔹 Feature change */
  const handleFeatureChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const addFeatureField = () => setFeatures((prev) => [...prev, ""]);

  const removeFeatureField = (index) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated.length ? updated : [""]);
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setFeatures([""]);
    setEditId(null);
  };

  /* 🔹 Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !price) {
      toast.error("Title & Price required");
      return;
    }

    const cleanFeatures = features
      .map((f) => f.trim())
      .filter((f) => f !== "");

    if (!cleanFeatures.length) {
      toast.error("Add at least one feature");
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        /* 🔄 UPDATE */
        await updateDoc(doc(db, "pricingPackages", editId), {
          title: title.trim(),
          price: Number(price),
          features: cleanFeatures,
          updatedAt: serverTimestamp(),
        });

        toast.success("Package updated");
        navigate("/admin/pricing");
      } else {
        /* ➕ ADD */
        await addDoc(pricingRef, {
          title: title.trim(),
          price: Number(price),
          features: cleanFeatures,
          createdAt: serverTimestamp(),
        });

        toast.success("Package added");
        resetForm();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving package");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-300">

        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {editId ? "Update Package" : "Add Package"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title + Price */}
          <div className="grid md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Package Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            />

            <input
              type="number"
              placeholder="Price ₹"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>

          {/* Features */}
          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Features</h3>

              <button
                type="button"
                onClick={addFeatureField}
                className="text-sm bg-black text-white px-4 py-2.5 rounded-md font-bold"
              >
                + Add Feature
              </button>
            </div>

            {features.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Feature ${i + 1}`}
                  value={f}
                  onChange={(e) =>
                    handleFeatureChange(i, e.target.value)
                  }
                  className="flex-1 w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => removeFeatureField(i)}
                  className="bg-red-600 text-white px-4 py-0.5 rounded-full"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/pricing")}
              className="px-6 py-2 border border-gray-300 rounded-md"
            >
              Back
            </button>

            <button
              disabled={loading}
              className="bg-black text-white px-8 py-2 rounded-md"
            >
              {loading
                ? editId
                  ? "Updating..."
                  : "Saving..."
                : editId
                ? "Update Package"
                : "Save Package"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PricingForm;
