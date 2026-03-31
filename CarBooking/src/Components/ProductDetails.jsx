import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import PageHeader from "./PageHeader";
import PageContainer from "./PageContainer";
import api from "../api";
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        console.debug("ProductDetails fetching", slug);
        const res = await api.get(`/products/slug/${slug}`);
        console.debug("ProductDetails response", res.data);
        setProduct(res.data);
        setSelectedVariantIndex(0);
        setActiveImage(0);
      } catch (err) {
        if (err?.response?.status === 404) {
          // 1) try trailing-dash trimmed slug
          const trimmed = slug?.replace(/-+$/, "");
          if (trimmed && trimmed !== slug) {
            try {
              const res2 = await api.get(`/products/slug/${trimmed}`);
              console.debug("ProductDetails fallback trim response", res2.data);
              setProduct(res2.data);
              setSelectedVariantIndex(0);
              setActiveImage(0);
              return;
            } catch (innerErr) {
              console.warn("ProductDetails fallback trim failed", innerErr);
            }
          }

          // 2) try full product list auto-match
          try {
            const list = await api.get('/products');
            const match = (list.data || []).find((p) => {
              if (!p.slug) return false;
              return [slug, trimmed, p.slug].some((v) => v && v.toLowerCase() === p.slug.toLowerCase());
            });
            if (match) {
              console.debug('ProductDetails fallback list match', match.slug);
              setProduct(match);
              setSelectedVariantIndex(0);
              setActiveImage(0);
              return;
            }
          } catch (listErr) {
            console.warn('ProductDetails fallback list failed', listErr);
          }

          setError('Product not found');
          setProduct(null);
        } else {
          setError('Unable to load product details');
          console.error('Failed to load product', err);
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  const productImages = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images;
    if (product?.thumbnail) return [product.thumbnail];
    return ["https://via.placeholder.com/600x400?text=No+Image+Available"];
  }, [product]);

  useEffect(() => {
    setActiveImage((prev) => {
      if (!productImages.length) return 0;
      return Math.min(Math.max(prev, 0), productImages.length - 1);
    });
  }, [productImages.length]);

  const currentStock = product?.variants?.[selectedVariantIndex]?.stock || 0;

  const increaseQty = () => {
    if (qty < currentStock) setQty((q) => q + 1);
  };

  const decreaseQty = () => {
    if (qty > 1) setQty((q) => q - 1);
  };

  const handleAddToCart = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Please login first");
      return;
    }

    // ✅ pick selected variant
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

    try {
      await api.post("/cart/add", {
        userId: user.id,
        productId: product.docId,
        sku: variant.sku,
        name: product.name,
        price: product.offerPrice,
        image: product.images?.[0] || product.thumbnail,
        quantity: qty,
      });

      toast.success("Added to cart 🛒");
      navigate("/cart");
    } catch (err) {
      console.error("Cart error", err);
      alert("Error adding to cart");
    }
  };

  const handleBuyNow = () => {
    const user = JSON.parse(localStorage.getItem("user"));

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

  if (loading)
    return <div className="text-white text-center py-40">Loading...</div>;

  if (error)
    return (
      <div className="text-white text-center py-40">
        <p className="text-2xl mb-4">{error}</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 rounded-full bg-sky-400 text-black font-semibold"
        >
          Back to Products
        </button>
      </div>
    );

  if (!product)
    return <div className="text-white text-center py-40">Product not found</div>;

  const activeSrc = productImages[activeImage] || productImages[0];

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
                src={activeSrc}
                className="w-full h-[360px] md:h-[420px] object-contain"
              />
            </div>

            {/* THUMBNAILS */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              {productImages.slice(-4).map((img, i) => {
                const index = productImages.length > 4 ? productImages.length - 4 + i : i;

                return (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`bg-[#050b14] rounded-xl p-2 border transition
            ${
              activeImage === index
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
