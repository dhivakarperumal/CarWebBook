


import { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { Car, Wrench, Settings, ShieldCheck } from "lucide-react";

/* 🔘 Icon Options */
const iconOptions = [
  { name: "Car", component: <Car size={18} /> },
  { name: "Wrench", component: <Wrench size={18} /> },
  { name: "Settings", component: <Settings size={18} /> },
  { name: "ShieldCheck", component: <ShieldCheck size={18} /> },
];

const AddCarService = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    bigDescription: "",
    icon: "Car",
    image: "",
    supportedBrands: [""],
    sparePartsIncluded: [""],
    status: "active",
  });



  /* 🔄 Fetch service when editing */
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const response = await api.get(`/services/${id}`);
        if (response.data) {
          const data = response.data;

          let parsedBrands = [""];
          let parsedSpareParts = [""];

          try {
             parsedBrands = typeof data.supportedBrands === "string" ? JSON.parse(data.supportedBrands) : data.supportedBrands;
             if (!Array.isArray(parsedBrands) || parsedBrands.length === 0) parsedBrands = [""];
          } catch(e) {}

          try {
             parsedSpareParts = typeof data.sparePartsIncluded === "string" ? JSON.parse(data.sparePartsIncluded) : data.sparePartsIncluded;
             if (!Array.isArray(parsedSpareParts) || parsedSpareParts.length === 0) parsedSpareParts = [""];
          } catch(e) {}

          setForm({
            name: data.name || "",
            price: data.price || "",
            description: data.description || "",
            bigDescription: data.bigDescription || "",
            icon: data.icon || "Car",
            image: data.image || "",
            supportedBrands: parsedBrands,
            sparePartsIncluded: parsedSpareParts,
            status: data.status || "active",
          });

          setImagePreview(data.image || "");
          setEditId(id);
        } else {
          toast.error("Service not found");
          navigate("/admin/services");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading service");
      }
    };

    fetchService();
  }, [id, navigate]);

  /* 🔧 Handle Change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price" && value < 0) return;
    setForm({ ...form, [name]: value });
  };

  /* 🔁 Array Change */
  const handleArrayChange = (index, field, value) => {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const addField = (field) => {
    setForm({ ...form, [field]: [...form[field], ""] });
  };

  const removeField = (field, index) => {
    const updated = [...form[field]];
    updated.splice(index, 1);
    setForm({ ...form, [field]: updated });
  };

  /* 🖼️ Compress Image */
  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = (event) => (img.src = event.target.result);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 600;
        const scaleSize = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);
    setForm({ ...form, image: compressed });
    setImagePreview(compressed);
  };

  const removeImage = () => {
    setImagePreview("");
    setForm({ ...form, image: "" });
  };

  /* 🧹 Reset Form */
  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      description: "",
      bigDescription: "",
      icon: "Car",
      image: "",
      supportedBrands: [""],
      sparePartsIncluded: [""],
      status: "active",
    });
    setImagePreview("");
    setEditId(null);
  };

  /* ➕ SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      toast.error("Fill required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        price: Number(form.price),
        supportedBrands: form.supportedBrands.filter((b) => b.trim()),
        sparePartsIncluded: form.sparePartsIncluded.filter((p) => p.trim()),
      };

      if (editId) {
        /* 🔄 UPDATE */
        await api.put(`/services/${editId}`, payload);
        toast.success("Service updated");
        navigate("/admin/services");
      } else {
        /* ➕ ADD */
        await api.post("/services", payload);
        toast.success("Service added");
        resetForm();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-300">

        <h2 className="text-2xl font-bold mb-6">
          {editId ? "Update Car Service" : "Add Car Service"}
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">



          {/* 🔹 SERVICE NAME */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Full Car Wash"
              value={form.name}
              onChange={handleChange}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>

          {/* 🔹 PRICE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              name="price"
              placeholder="e.g. 999"
              value={form.price}
              onChange={handleChange}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>

          {/* 🔹 ICON */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Icon
            </label>
            <select
              name="icon"
              value={form.icon}
              onChange={handleChange}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            >
              <option value="">Choose an icon</option>
              {iconOptions.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Short description about the service..."
              value={form.description}
              onChange={handleChange}
              rows={1}
              className="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm  focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>


          {/* 🔹 BIG DESCRIPTION */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Full Service Details
            </label>
            <textarea
              name="bigDescription"
              placeholder="Explain what is included in this service, steps, benefits, etc."
              value={form.bigDescription}
              onChange={handleChange}
              rows={5}
              className="input"
            />
          </div>

          {/* 🔹 IMAGE UPLOAD */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Service Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="input file:mr-3 file:py-2 file:px-4 file:border-0 file:rounded-md
               file:bg-black file:text-white hover:file:bg-gray-900"
            />

            {imagePreview && (
              <div className="mt-3 flex items-center gap-4">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>


          {/* Submit */}
          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/services")}
              className="px-6 py-2 border border-gray-300 rounded-md"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-8 py-2 rounded-md"
            >
              {loading
                ? "Saving..."
                : editId
                  ? "Update Service"
                  : "Add Service"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddCarService;

