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
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const prices = products.map(p => Number(p.offerPrice || 0)).filter(p => p > 0);
  const [showFilters, setShowFilters] = useState(false);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1000;
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState("");

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    brand: [],
    rating: "",
    stock: "",
    offer: false,
  });

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

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => Number(p.offerPrice || 0)).filter(p => p > 0);
      const max = Math.max(...prices);

      setFilters(prev => ({
        ...prev,
        maxPrice: max
      }));
    }
  }, [products]);

  const filteredProducts = products
    .filter((p) => {
      const searchValue = search.toLowerCase();

      return (
        p.name.toLowerCase().includes(searchValue) ||
        p.brand?.toLowerCase().includes(searchValue) ||
        String(p.offerPrice).includes(searchValue)
      );
    })

    .filter((p) => {
      const price = Number(p.offerPrice || 0);

      // Price Range
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

      // BRAND MULTI SELECT
      if (filters.brand.length > 0 && !filters.brand.includes(p.brand)) {
        return false;
      }

      // Rating
      if (filters.rating && Number(p.rating || 0) < Number(filters.rating))
        return false;

      // Stock
      if (filters.stock === "in" && p.totalStock <= 0) return false;
      if (filters.stock === "out" && p.totalStock > 0) return false;

      // Offer
      if (filters.offer && !p.offerPrice) return false;

      return true;
    })

    .sort((a, b) => {
      if (sort === "low-high") {
        return Number(a.offerPrice) - Number(b.offerPrice);
      }
      if (sort === "high-low") {
        return Number(b.offerPrice) - Number(a.offerPrice);
      }
      if (sort === "a-z") {
        return a.name.localeCompare(b.name);
      }
      if (sort === "z-a") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

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

          <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">

            {/* LEFT — SEARCH */}
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-80 px-4 py-2 rounded-lg bg-[#0a0a0b] border border-white/20 ring-1 text-white outline-none focus:border-sky-400"
            />

            {/* RIGHT — FILTER + SORT */}
            <div className="flex w-full md:w-auto gap-2">

              {/* 🔥 FILTER ICON BUTTON */}
              <button
                onClick={() => setShowFilters(true)}
                className="md:hidden px-3 py-2 bg-sky-500 text-black rounded-lg"
              >
                ☰
              </button>

              {/* SORT */}
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-60 px-4 py-2 rounded-lg bg-[#0a0a0b] border border-white/20 text-white outline-none focus:border-sky-400"
              >
                <option value="">Sort By</option>
                <option value="low-high">Price: Low → High</option>
                <option value="high-low">Price: High → Low</option>
                <option value="a-z">Name: A → Z</option>
                <option value="z-a">Name: Z → A</option>
              </select>

            </div>
          </div>

          {/* Products Section */}
          <div className="flex gap-6">

            {/* 🔥 FILTER + OVERLAY WRAPPER */}
            <>
              {/* 🔥 OVERLAY (MOBILE ONLY) */}
              {showFilters && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setShowFilters(false)}
                />
              )}

              {/* 🔥 FILTER SIDEBAR */}
              <div
                className={`
  fixed md:static top-0 left-0 h-full md:h-auto w-72 md:w-64
  bg-[#0a0a0b] border border-sky-500/20
  rounded-none md:rounded-xl
  p-4 space-y-5 z-50
  overflow-y-auto   // ✅ ADD THIS
  transform transition-transform duration-300
  ${showFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
`}
              >

                {/* 🔥 MOBILE HEADER */}
                <div className="flex justify-between items-center md:hidden mb-3">
                  <h3 className="text-sky-400 font-semibold text-lg">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-white text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* 🔥 DESKTOP TITLE */}
                <h3 className="hidden md:block text-sky-400 font-semibold text-lg">
                  Filter Options
                </h3>

                {/* 🔥 PRICE */}
                <div>
                  <p className="text-sm text-sky-300 mb-2">Price Range</p>

                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={filters.maxPrice || maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    ₹{minPrice} - ₹{filters.maxPrice || maxPrice}
                  </p>
                </div>

                {/* BRAND (CHECKBOX) */}
                <div>
                  <p className="text-sm text-sky-300 mb-2">Brands</p>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                    {brands.map((b) => (
                      <label
                        key={b}
                        className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(b)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                brand: [...filters.brand, b],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                brand: filters.brand.filter((item) => item !== b),
                              });
                            }
                          }}
                          className="accent-sky-400"
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 🔥 RATING */}
                <div>
                  <p className="text-sm text-sky-300 mb-2">Ratings</p>

                  {[
                    { label: "All Ratings", value: "" },
                    { label: "4★ & up", value: "4" },
                    { label: "3★ & up", value: "3" },
                  ].map((r) => (
                    <label
                      key={r.label}
                      className="flex items-center gap-2 text-sm text-gray-300 mb-1 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === r.value}
                        onChange={() =>
                          setFilters({ ...filters, rating: r.value })
                        }
                        className="accent-sky-400"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                {/* 🔥 STOCK */}
                <div>
                  <p className="text-sm text-sky-300 mb-2">Availability</p>

                  {[
                    { label: "All", value: "" },
                    { label: "In Stock", value: "in" },
                    { label: "Out of Stock", value: "out" },
                  ].map((s) => (
                    <label
                      key={s.label}
                      className="flex items-center gap-2 text-sm text-gray-300 mb-1 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="stock"
                        checked={filters.stock === s.value}
                        onChange={() =>
                          setFilters({ ...filters, stock: s.value })
                        }
                        className="accent-sky-400"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>

                {/* 🔥 OFFER */}
                <div className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.offer}
                    onChange={(e) =>
                      setFilters({ ...filters, offer: e.target.checked })
                    }
                    className="accent-sky-400"
                  />
                  <span className="text-sm text-gray-300">Offers Only</span>
                </div>

                {/* 🔥 CLEAR BUTTON */}
                <button
                  onClick={() =>
                    setFilters({
                      minPrice: "",
                      maxPrice: "",
                      brand: [],
                      rating: "",
                      stock: "",
                      offer: false,
                    })
                  }
                  className="w-full bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-black py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Clear Filters
                </button>

              </div>
            </>

            {/* 🔥 PRODUCTS GRID */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.docId}
                    product={product}
                    handleAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>

          </div>
          <div className="flex justify-center items-center mt-10 gap-3 flex-wrap">

            {/* PREV BUTTON */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm
      ${currentPage === 1
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
                className={`px-4 py-2 rounded-md text-sm ${currentPage === i + 1
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
      ${currentPage === totalPages
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
