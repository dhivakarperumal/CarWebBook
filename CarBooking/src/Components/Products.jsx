import React, { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import PageHeader from "./PageHeader";

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(
        collection(db, "products"),
        where("isActive", "==", true),
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));

      setProducts(data);
    };

    fetchProducts();
  }, []);

const handleAddToCart = async (product, e) => {
  e.stopPropagation();

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  // 🚫 Out of stock protection
  if (!product.totalStock || product.totalStock <= 0) {
    alert("Product is out of stock");
    return;
  }

  // 🔑 assume first variant (same as ProductDetails)
  const variant = product.variants?.[0];
  if (!variant?.sku) {
    alert("Invalid product variant");
    return;
  }

  const cartRef = doc(db, "users", user.uid, "cart", product.docId);
  const existing = await getDoc(cartRef);

  if (existing.exists()) {
    await updateDoc(cartRef, {
      quantity: existing.data().quantity + 1,
    });
  } else {
    await setDoc(cartRef, {
      docId: product.docId,          
      sku: variant.sku,              
      name: product.name,
      price: product.offerPrice,
      image: product.thumbnail,
      quantity: 1,
      createdAt: serverTimestamp(),  // ✅ SAFE
    });
  }

  alert("Added to cart!");
};

  return (
    <>
      <PageHeader title="Our Products" />
      <section className="bg-black py-24">
        <PageContainer>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.docId}
                onClick={() => navigate(`/products/${product.slug}`)}
                className="group relative bg-[#050b14]

/* Default (Mobile) — Always glowing */
border border-sky-400
shadow-[0_30px_90px_rgba(56,189,248,0.45)]
before:absolute before:inset-0 before:rounded-2xl
before:bg-gradient-to-tr before:from-sky-500/10 before:to-cyan-400/5
before:opacity-100

md:border-2 md:border-white/30
md:shadow-none
md:before:opacity-0
md:hover:border-sky-400
md:hover:shadow-[0_30px_90px_rgba(56,189,248,0.45)]
md:hover:before:opacity-100

rounded-2xl overflow-hidden cursor-pointer
transition-all duration-500
md:hover:-translate-y-2
flex flex-col"
              >
                {/* OFFER RIBBON */}
                {product.offer && (
                  <span
                    className="absolute top-0 left-0 z-20 bg-gradient-to-r from-sky-500 to-cyan-400
        text-black text-xs font-bold px-4 py-1 rounded-br-xl"
                  >
                    {product.offer}% OFF
                  </span>
                )}

                {/* IMAGE */}
                <div className="relative h-[260px] overflow-hidden">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-[0.3deg]"
                  />

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-3">
                  {/* BRAND */}
                  <p className="text-gray-400 text-xs uppercase tracking-widest">
                    {product.brand}
                  </p>

                  {/* NAME + STOCK */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-white text-lg font-bold leading-tight">
                      {product.name}
                    </h3>

                    <span
                      className={`text-[10px] px-3 py-1 rounded-full whitespace-nowrap
          ${
            product.totalStock > 0
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
                    >
                      {product.totalStock > 0 ? "In Stock" : "Out"}
                    </span>
                  </div>

                  {/* PRICE */}
                  <div className="flex items-center gap-3">
                    <span className="text-white text-2xl font-extrabold">
                      ₹{product.offerPrice}
                    </span>

                    <span className="line-through text-gray-500 font-bold text-sm">
                      ₹{product.mrp}
                    </span>
                  </div>

                  {/* RATING + VIEW DETAILS */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
                    {/* RATING */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) =>
                        star <= Number(product.rating || 0) ? (
                          <FaStar key={star} className="text-sky-400 text-sm" />
                        ) : (
                          <FaRegStar
                            key={star}
                            className="text-gray-500 text-sm"
                          />
                        ),
                      )}
                    </div>

                    {/* VIEW DETAILS BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product.slug}`);
                      }}
                      className="relative overflow-hidden group
  text-xs font-semibold uppercase tracking-wider
  px-5 py-2.5 rounded-full mt-2 md:mt-0 self-start md:self-auto

  bg-gradient-to-r from-sky-500 to-cyan-400
  text-black
  shadow-lg shadow-sky-400/40

  md:bg-gradient-to-r md:from-sky-500/10 md:to-cyan-400/10
  md:text-sky-400
  md:border md:border-sky-400/40
  md:shadow-none

  backdrop-blur transition-all duration-300 cursor-pointer

  md:hover:text-black
  md:hover:from-sky-500 md:hover:to-cyan-400
  md:hover:shadow-lg md:hover:shadow-sky-400/40
  "
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        View Details
                        <span className="transition-transform duration-300 md:group-hover:translate-x-1">
                          →
                        </span>
                      </span>

                      {/* Shine effect (desktop only animation) */}
                      <span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
    translate-x-[-120%] md:group-hover:translate-x-[120%]
    transition duration-700 ease-out"
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
