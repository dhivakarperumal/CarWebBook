import React, { useEffect, useState } from "react";
import api from "../api";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import PageHeader from "./PageHeader";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 8;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");

        const activeProducts = (res.data || []).filter(
          (p) => p.isActive === 1 || p.isActive === true,
        );

        setProducts(activeProducts);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!product.totalStock || product.totalStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const variant = product.variants?.[0];

    if (!variant?.sku) {
      toast.error("Invalid product variant");
      return;
    }

    try {
      await api.post("/cart/add", {
        userId: user.id || null,
        userUid: user.uid || null,
        productId: product.docId,
        sku: variant.sku,
        name: product.name,
        price: Number(product.offerPrice) || 0,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : product.thumbnail || "",
        quantity: 1,
      });

      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart!");
    } catch (err) {
      console.error("Cart error", err);
      toast.error("Error adding to cart");
    }
  };

  return (
    <>
      <PageHeader title="Our Products" />
      <section className="bg-black py-24">
        <PageContainer>

          <div className="mb-8 flex justify-between items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-80 px-4 py-2 rounded-lg bg-[#0a0a0b] border border-white/20 text-white outline-none focus:border-sky-400"
            />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.docId}
                product={product}
                handleAddToCart={handleAddToCart}
              />
            ))}
          </div>
         <div className="flex justify-center items-center mt-10 gap-3 flex-wrap">

  {/* PREV BUTTON */}
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm
      ${
        currentPage === 1
          ? "bg-white/5 text-gray-500 cursor-not-allowed"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
  >
    <FiChevronLeft />
  </button>

  {/* PAGE NUMBERS */}
  {[...Array(totalPages)].map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-4 py-2 rounded-md text-sm ${
        currentPage === i + 1
          ? "bg-sky-400 text-black"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {i + 1}
    </button>
  ))}

  {/* NEXT BUTTON */}
  <button
    onClick={() =>
      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }
    disabled={currentPage === totalPages}
    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm
      ${
        currentPage === totalPages
          ? "bg-white/5 text-gray-500 cursor-not-allowed"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
  >
    <FiChevronRight />
  </button>

</div>
        </PageContainer>
      </section>
    </>
  );
}
