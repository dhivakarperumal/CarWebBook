import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

import api from "../../api";

const PricingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [place, setPlace] = useState("home");
  const [features, setFeatures] = useState([""]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* 🔄 Fetch package for edit */
  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;

      try {
        const res = await api.get(`/pricing_packages/${id}`);
        const data = res.data;

        setTitle(data.title || "");
        setPrice(data.price || "");
        setPlace(data.place || "home");
        setFeatures(data.features?.length ? data.features : [""]);
        setEditId(id);
      } catch (err) {
        console.error(err);
        toast.error("Package not found");
        navigate("/admin/priceslist");
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
    setPlace("home");
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
        await api.put(`/pricing_packages/${editId}`, {
          title: title.trim(),
          price: Number(price),
          place,
          features: cleanFeatures,
        });

        toast.success("Package updated");
        navigate("/admin/priceslist");
      } else {
        /* ➕ ADD */
        await api.post("/pricing_packages", {
          title: title.trim(),
          price: Number(price),
          place,
          features: cleanFeatures,
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

          {/* Service Place */}
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-gray-800">
              <input
                type="radio"
                value="home"
                checked={place === "home"}
                onChange={() => setPlace("home")}
                className="accent-black w-5 h-5"
              />
              <span className="font-bold">Home Service</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-800">
              <input
                type="radio"
                value="shop"
                checked={place === "shop"}
                onChange={() => setPlace("shop")}
                className="accent-black w-5 h-5"
              />
              <span className="font-bold">Shop Service</span>
            </label>
          </div>

          {/* Title + Price */}
          <div className="grid md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Package Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-black outline-none transition"
            />

            <input
              type="number"
              placeholder="Price ₹"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-black outline-none transition"
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
                  className="flex-1 w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-black outline-none transition"
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
              onClick={() => navigate("/admin/priceslist")}
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