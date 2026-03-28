import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useLocation, useNavigate } from "react-router-dom";

const AddProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const [loading, setLoading] = useState(false);

  const [product, setProduct] = useState({
    id: "",
    name: "",
    slug: "",
    brand: "",
    description: "",
    mrp: "",
    offer: "",
    offerPrice: "",
    tags: "",
    warrantyAvailable: false,
    warrantyMonths: "",
    returnAvailable: false,
    returnDays: "",
    isFeatured: false,
    isActive: true,
    rating: "",
  });

  const [variants, setVariants] = useState([
    { sku: "", position: "", material: "", stock: "" },
  ]);

  const [images, setImages] = useState([]);
  const [thumbnail, setThumbnail] = useState("");

  /* AUTO SLUG */
  useEffect(() => {
    if (product.name) {
      setProduct((prev) => ({
        ...prev,
        slug: product.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, ""),
      }));
    }
  }, [product.name]);

  /* AUTO OFFER PRICE */
  useEffect(() => {
    const mrp = Number(product.mrp || 0);
    const offer = Number(product.offer || 0);
    if (mrp && offer >= 0) {
      const offerPrice = mrp - (mrp * offer) / 100;
      setProduct((prev) => ({ ...prev, offerPrice: offerPrice.toFixed(2) }));
    }
  }, [product.mrp, product.offer]);

  /* LOAD EDIT DATA */
  useEffect(() => {
    if (editData) {
      setProduct({
        ...editData,
        tags: Array.isArray(editData.tags)
          ? editData.tags.join(", ")
          : editData.tags || "",
        warrantyAvailable: editData?.warranty?.available || false,
        warrantyMonths: editData?.warranty?.months || "",
        returnAvailable: editData?.returnPolicy?.available || false,
        returnDays: editData?.returnPolicy?.days || "",
        rating: editData?.rating || "",
      });
      setVariants(editData.variants || []);
      setImages(editData.images || []);
      setThumbnail(editData.thumbnail || "");
    }
  }, [editData]);

  /* GENERATE PRODUCT ID from count */
  const generateProductId = async () => {
    const res = await api.get("/products");
    const count = res.data.length + 1;
    return `PR${String(count).padStart(3, "0")}`;
  };

  /* INPUT CHANGE */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "warrantyAvailable") {
      setProduct({ ...product, warrantyAvailable: checked, warrantyMonths: checked ? product.warrantyMonths : "" });
      return;
    }
    if (name === "returnAvailable") {
      setProduct({ ...product, returnAvailable: checked, returnDays: checked ? product.returnDays : "" });
      return;
    }
    setProduct({ ...product, [name]: type === "checkbox" ? checked : value });
  };

  /* VARIANT CHANGE */
  const handleVariantChange = (index, e) => {
    const newVariants = [...variants];
    newVariants[index][e.target.name] = e.target.value;
    setVariants(newVariants);
  };

  const addVariant = () =>
    setVariants([...variants, { sku: "", position: "", material: "", stock: "" }]);

  /* IMAGE BASE64 */
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleMultipleImages = async (files) => {
    const imageArray = [];
    for (let i = 0; i < files.length; i++) {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(files[i], options);
      const base64 = await convertToBase64(compressedFile);
      imageArray.push(base64);
    }
    const updatedImages = [...images, ...imageArray];
    setImages(updatedImages);
    if (!thumbnail && updatedImages.length > 0) setThumbnail(updatedImages[0]);
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (index === 0 && updated.length > 0) setThumbnail(updated[0]);
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let productId = product.id;
      if (!editData) productId = await generateProductId();

      const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      const productData = {
        id: productId,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        description: product.description,
        mrp: Number(product.mrp),
        offer: Number(product.offer),
        offerPrice: Number(product.offerPrice),
        warranty: {
          available: product.warrantyAvailable,
          months: product.warrantyAvailable ? Number(product.warrantyMonths || 0) : 0,
        },
        returnPolicy: {
          available: product.returnAvailable,
          days: product.returnAvailable ? Number(product.returnDays || 0) : 0,
        },
        rating: product.rating || "0",
        variants: variants.map((v) => ({ ...v, stock: Number(v.stock) })),
        images,
        thumbnail,
        tags: Array.isArray(product.tags)
          ? product.tags
          : product.tags
          ? product.tags.split(",").map((t) => t.trim())
          : [],
        totalStock,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
      };

      if (!editData) {
        await api.post("/products", productData);
        toast.success(`✅ Product ${productId} Added`);
      } else {
        await api.put(`/products/${editData.docId}`, productData);
        toast.success(`✏️ Product ${productId} Updated`);
      }

      navigate("/admin/allproducts");
    } catch (error) {
      console.error(error);
      toast.error("❌ Error saving product");
    }

    setLoading(false);
  };

  const inputClass = "w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-black outline-none transition";

  return (
    <div className="max-w-6xl mx-auto bg-white p-2 rounded-2xl shadow space-y-6">
      <form onSubmit={handleSubmit} className="p-6 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">
          {editData ? "Update Product" : "Add Car Spare Product"}
        </h2>

        {/* BASIC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input name="name" value={product.name} onChange={handleChange} placeholder="E.g. Brake Pad Set" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input name="brand" value={product.brand} placeholder="E.g. Bosch" onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" placeholder="Enter product description" value={product.description} onChange={handleChange} className={inputClass} />
        </div>

        {/* PRICE */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">MRP</label>
            <input name="mrp" value={product.mrp} onChange={handleChange} placeholder="Enter Mrp" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Offer %</label>
            <input name="offer" value={product.offer} onChange={handleChange} placeholder="Enter Offer" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Offer Price</label>
            <input name="offerPrice" value={product.offerPrice} readOnly className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating (1–5)</label>
            <input type="number" min="1" max="5" step="0.1" placeholder="Enter Rating" value={product.rating} onChange={(e) => setProduct({ ...product, rating: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* VARIANTS */}
        <div>
          <h3 className="font-semibold mb-2">Variants</h3>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label className="block text-xs mb-1">SKU</label>
                <input name="sku" value={v.sku} onChange={(e) => handleVariantChange(i, e)} placeholder="SKU" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs mb-1">Position</label>
                <input name="position" value={v.position} onChange={(e) => handleVariantChange(i, e)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs mb-1">Material</label>
                <input name="material" value={v.material} onChange={(e) => handleVariantChange(i, e)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs mb-1">Stock</label>
                <input name="stock" value={v.stock} onChange={(e) => handleVariantChange(i, e)} className={inputClass} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="bg-gradient-to-r from-black to-cyan-400 text-white px-6 py-3 rounded hover:from-cyan-400 hover:to-black transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg">
            + Add Variant
          </button>
        </div>

        {/* IMAGES */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Images</label>
          <input type="file" className={inputClass} multiple accept="image/*" onChange={(e) => handleMultipleImages(e.target.files)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="w-full h-32 object-cover rounded border" alt="" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black text-white w-6 h-6 text-xs rounded-full">✕</button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* WARRANTY */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" name="warrantyAvailable" checked={product.warrantyAvailable} onChange={handleChange} />
              Warranty Available
            </label>
            {product.warrantyAvailable && (
              <div>
                <label className="block text-sm font-medium mb-1">Warranty Months</label>
                <input name="warrantyMonths" placeholder="Enter Warranty Months" value={product.warrantyMonths} onChange={handleChange} className={inputClass} />
              </div>
            )}
          </div>

          {/* RETURN */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" name="returnAvailable" checked={product.returnAvailable} onChange={handleChange} />
              Return Available
            </label>
            {product.returnAvailable && (
              <div>
                <label className="block text-sm font-medium mb-1">Return Days</label>
                <input name="returnDays" value={product.returnDays} placeholder="Enter Return Days" onChange={handleChange} className={inputClass} />
              </div>
            )}
          </div>
        </div>

        {/* TAGS */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input name="tags" value={product.tags} onChange={handleChange} placeholder="Enter tags separated by commas" className={inputClass} />
        </div>

        {/* FLAGS */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" checked={product.isFeatured} onChange={handleChange} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={product.isActive} onChange={handleChange} />
            Active
          </label>
        </div>

        <div className="flex justify-end">
          <button disabled={loading} className="bg-gradient-to-r from-black to-cyan-400 text-white px-6 py-3 rounded hover:from-cyan-400 hover:to-black transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg">
            {loading ? "Saving..." : editData ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
