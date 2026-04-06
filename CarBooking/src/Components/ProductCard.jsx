import React from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, handleAddToCart }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="group relative bg-[#050b14]

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
      {/* OFFER */}
      {product.offer && (
        <span className="absolute top-0 left-0 z-20 bg-gradient-to-r from-sky-500 to-cyan-400 text-black text-xs font-bold px-4 py-1 rounded-br-xl">
          {product.offer}% OFF
        </span>
      )}

      {/* IMAGE */}
   <div className="relative h-[200px] overflow-hidden rounded-xl bg-[#0a0a0b] flex items-center justify-center">
  <img
    src={
      product.images && product.images.length > 0
        ? product.images[0]
        : product.thumbnail || ""
    }
    alt={product.name}
    className="max-h-full max-w-full object-contain scale-110 transition duration-500 group-hover:scale-115"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src =
        "https://via.placeholder.com/600x400?text=Product+Image";
    }}
  />
</div>

      {/* CONTENT */}
      <div className="p-4 space-y-2">
        {/* BRAND */}
        <p className="text-gray-400 text-xs uppercase tracking-widest">
          {product.brand}
        </p>

        {/* NAME + STOCK */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-white text-base font-bold leading-tight">
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
          <span className="text-white text-xl font-extrabold">
            ₹{product.offerPrice}
          </span>

          <span className="line-through text-gray-500 font-bold text-sm">
            ₹{product.mrp}
          </span>
        </div>

        {/* RATING + BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">

          {/* RATING */}
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((star) =>
              star <= Number(product.rating || 0) ? (
                <FaStar key={star} className="text-sky-400 text-sm"/>
              ) : (
                <FaRegStar key={star} className="text-gray-500 text-sm"/>
              )
            )}
          </div>

          {/* VIEW DETAILS */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${product.slug}`);
            }}
            className="relative overflow-hidden group
            text-xs font-semibold uppercase tracking-wider
            px-4 py-2 rounded-full mt-2 md:mt-0 self-start md:self-auto

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
            md:hover:shadow-lg md:hover:shadow-sky-400/40"
          >
            <span className="relative z-10 flex items-center gap-2">
              View 
              <span className="transition-transform duration-300 md:group-hover:translate-x-1">
                →
              </span>
            </span>

            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-120%] md:group-hover:translate-x-[120%] transition duration-700 ease-out"/>
          </button>
        </div>
      </div>
    </div>
  );
}