import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useEffect, useState } from "react";
import PageHeader from "./PageHeader";
import PageContainer from "./PageContainer";
import toast from "react-hot-toast";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setQty(1);
  }, [selectedVariantIndex]);

  useEffect(() => {
    const fetchProduct = async () => {
      const q = query(collection(db, "products"), where("slug", "==", slug));

      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = {
          docId: snap.docs[0].id,
          ...snap.docs[0].data(),
        };

        setProduct(data);
        setSelectedVariantIndex(0);
      }
    };

    fetchProduct();
  }, [slug]);

  const currentStock = product?.variants?.[selectedVariantIndex]?.stock || 0;

  const increaseQty = () => {
    if (qty < currentStock) setQty((q) => q + 1);
  };

  const decreaseQty = () => {
    if (qty > 1) setQty((q) => q - 1);
  };

  const handleAddToCart = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    // ✅ pick first variant (you have only one now)
    const variant = product.variants?.[selectedVariantIndex];

    if (!variant?.sku) {
      alert("Product variant not available");
      return;
    }

    const currentStock = variant.stock || 0;

    if (qty > currentStock) {
      alert("Selected quantity exceeds stock");
      return;
    }

    const cartRef = doc(db, "users", user.uid, "cart", product.docId);
    const existing = await getDoc(cartRef);

    if (existing.exists()) {
      const newQty = existing.data().quantity + qty;

      if (newQty > currentStock) {
        alert("Total quantity exceeds stock");
        return;
      }

      await updateDoc(cartRef, {
        quantity: newQty,
      });
    } else {
      await setDoc(cartRef, {
        docId: product.docId,
        sku: variant.sku,
        name: product.name,
        price: product.offerPrice,
        image: product.images?.[0],
        quantity: qty, // ✅ use selected quantity
        createdAt: serverTimestamp(),
      });
    }
    toast.success("Added to cart 🛒");

    navigate("/cart");
  };

  const handleBuyNow = () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const variant = product.variants?.[selectedVariantIndex];

    if (!variant?.sku) {
      alert("Product variant not available");
      return;
    }

    const currentStock = variant.stock || 0;

    if (qty > currentStock) {
      alert("Selected quantity exceeds stock");
      return;
    }

    // 🔥 Pass product directly to checkout page
    navigate("/checkout", {
      state: {
        isBuyNow: true,
        product: {
          docId: product.docId,
          sku: variant.sku,
          name: product.name,
          price: product.offerPrice,
          image: product.images?.[0],
          quantity: qty,
        },
      },
    });
  };

  if (!product)
    return <div className="text-white text-center py-40">Loading...</div>;

  return (
    <>
    <PageHeader title={product?.name || "Product Details"} />
    <section className="bg-black text-white py-20">
      <PageContainer>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — IMAGE GALLERY */}
          <div className="lg:sticky lg:top-24">
            {/* MAIN IMAGE */}
            <div
              className="bg-[#050b14] rounded-2xl p-6 border border-white/10
          shadow-xl shadow-sky-500/10"
            >
              <img
                src={product.images?.[activeImage]}
                className="w-full h-[360px] md:h-[420px] object-contain"
              />
            </div>

            {/* THUMBNAILS */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              {product.images?.slice(-4).map((img, i) => {
                const originalIndex = product.images.length - 4 + i;

                return (
                  <button
                    key={originalIndex}
                    onClick={() => setActiveImage(originalIndex)}
                    className={`bg-[#050b14] rounded-xl p-2 border transition
            ${
              activeImage === originalIndex
                ? "border-sky-400 shadow-md shadow-sky-400/30"
                : "border-white/10 hover:border-sky-400/50"
            }`}
                  >
                    <img src={img} className="w-full h-20 object-contain" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — PRODUCT INFO */}
          <div className="space-y-8">
            {/* TITLE */}
            <div>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold leading-tight">
                {product.name}
              </h1>

              <p className="text-gray-400 mt-2">{product.brand}</p>
            </div>

            {/* PRICE */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sky-400 text-3xl font-bold">
                ₹{product.offerPrice}
              </span>

              <span className="line-through text-gray-500">₹{product.mrp}</span>

              {product.offer && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold
              bg-green-500/20 text-green-400"
                >
                  {product.offer}% OFF
                </span>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* PRODUCT DETAILS */}
            <div className="mt-6 grid grid-cols-2 gap-y-3 text-xl">
              {/* QUANTITY */}
              <span className="text-gray-400">Quantity</span>

              <div className="flex items-center gap-4">
                <button
                  onClick={decreaseQty}
                  className="w-9 h-9 rounded-full bg-[#050b14] border border-sky-400/40
hover:bg-sky-400 hover:text-black transition"
                >
                  −
                </button>

                <span className="font-bold text-sky-400 min-w-[30px] text-center">
                  {qty}
                </span>

                <button
                  onClick={increaseQty}
                  disabled={qty >= currentStock}
                  className={`w-9 h-9 rounded-full border border-sky-400/40 transition
      ${
        qty >= currentStock
          ? "opacity-40 cursor-not-allowed"
          : "bg-[#050b14] hover:bg-sky-400 hover:text-black"
      }`}
                >
                  +
                </button>
              </div>

              {product.variants?.[selectedVariantIndex]?.stock !==
                undefined && (
                <>
                  <span className="text-gray-400">Stock</span>

                  <span
                    className={`font-medium ${
                      product.variants[selectedVariantIndex].stock > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {product.variants[selectedVariantIndex].stock > 0
                      ? `${product.variants[selectedVariantIndex].stock} Available`
                      : "Out of Stock"}
                  </span>
                </>
              )}

              {/* SKU DROPDOWN */}
              {product.variants?.length > 0 && (
                <>
                  <span className="text-gray-400">SKU</span>

                  <select
                    value={selectedVariantIndex}
                    onChange={(e) =>
                      setSelectedVariantIndex(Number(e.target.value))
                    }
                    className="bg-[#050b14] border border-sky-400/40 rounded-lg px-3 py-2
      text-sky-400 outline-none"
                  >
                    {product.variants.map((v, i) => (
                      <option key={i} value={i} className="bg-black">
                        {v.sku}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {product.variants?.[selectedVariantIndex]?.material && (
                <>
                  <span className="text-gray-400">Material</span>
                  <span className="text-sky-400 font-medium">
                    {product.variants[selectedVariantIndex].material}
                  </span>
                </>
              )}

              {product.variants?.[selectedVariantIndex]?.position && (
                <>
                  <span className="text-gray-400">Position</span>
                  <span className="text-sky-400 font-medium">
                    {product.variants[selectedVariantIndex].position}
                  </span>
                </>
              )}

              {product.warrantyAvailable && product.warrantyMonths && (
                <>
                  <span className="text-gray-400">Warranty</span>
                  <span className="text-sky-400 font-medium">
                    {product.warrantyMonths} Months
                  </span>
                </>
              )}

              {product.returnPolicy?.available &&
                product.returnPolicy?.days && (
                  <>
                    <span className="text-gray-400">Return Policy</span>
                    <span className="text-sky-400 font-medium">
                      {product.returnPolicy.days} Days
                    </span>
                  </>
                )}
            </div>

            {/* CTA BUTTONS */}
            <div className="mt-15 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-10 py-4 rounded-full font-semibold
bg-gradient-to-r from-blue-600 to-cyan-400 text-black
hover:scale-105 transition-all duration-300
shadow-xl shadow-blue-500/40 cursor-pointer"
              >
                Add To Cart
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 px-10 py-4 rounded-full font-semibold
  border border-sky-400 text-sky-400
  hover:bg-sky-400 hover:text-black
  transition-all duration-300 cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
      </PageContainer>
    </section>
    </>
  );
}
