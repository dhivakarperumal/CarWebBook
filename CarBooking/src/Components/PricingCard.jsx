import React from "react";
import { useNavigate } from "react-router-dom";

export default function PricingCard({ pkg }) {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-full rounded-2xl sm:rounded-3xl p-[1px] 
    bg-gradient-to-b from-sky-500/40 to-transparent 
    hover:from-sky-400 transition-all duration-300">

      {/* Inner Card */}
      <div
        className="relative flex flex-col flex-1 rounded-2xl sm:rounded-3xl 
        bg-black/70 backdrop-blur-xl 
        p-4 sm:p-6 md:p-7
        border border-white/10 hover:border-sky-400/40
        transition-all duration-300"
      >
        {/* Plan Title */}
        <h3 className="text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-sky-400 mb-2 sm:mb-3">
          {pkg.title}
        </h3>

        {/* Price */}
        <div className="flex items-end gap-1 sm:gap-2 mb-4 sm:mb-6">
          <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white">
            ₹{pkg.price}
          </span>
          <span className="text-[10px] sm:text-sm text-gray-400 mb-1">
            /service
          </span>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-400/40 to-transparent mb-5 sm:mb-8" />

        {/* Features */}
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300 mb-5 sm:mb-7">
          {pkg.features?.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 sm:gap-3">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full
                bg-sky-500/20 text-sky-400 text-[10px] sm:text-xs">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => navigate("/bookservice")}
          className="mt-auto w-full py-2 sm:py-3 text-[10px] sm:text-sm rounded-xl font-semibold text-black
          bg-gradient-to-r from-sky-400 to-cyan-300
          hover:from-sky-300 hover:to-cyan-200
          transition-all duration-300 shadow-lg shadow-sky-500/30"
        >
          Book Now →
        </button>
      </div>
    </div>
  );
}