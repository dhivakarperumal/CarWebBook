import React from "react";
import { useNavigate } from "react-router-dom";

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group relative bg-[#0b0f14]
      border border-white/10
      transition-all duration-500
      hover:scale-[1]
      hover:border-sky-400
      hover:shadow-[0_25px_70px_rgba(56,189,248,0.35)]
      flex flex-col h-full"
    >
      <div className="p-6 flex flex-col h-full text-center">

        {/* TITLE */}
        <h3 className="text-white text-2xl font-bold mb-4">
          {service.name}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3">
          {service.description}
        </p>

        {/* IMAGE */}
        <div className="relative mb-8">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-[180px] object-cover rounded-md
            transition duration-500 group-hover:scale-110"
          />

          {/* ICON */}
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2
            w-14 h-14 rounded-full
            flex items-center justify-center
            bg-black
            border-2 border-sky-400
            transition-all duration-300
            group-hover:bg-sky-400
            group-hover:border-black"
          >
            <span
              className="text-sky-400 text-xl font-bold
              transition-all duration-300
              group-hover:text-black"
            >
              ⚙
            </span>
          </div>
        </div>

        {/* BUTTON (PUSHED TO BOTTOM) */}
        <button
          onClick={() => navigate(`/services/${service.id}`)}
          className="mt-auto w-full py-2 text-xs font-bold tracking-[0.25em]
          text-sky-400 border border-sky-400/40
          cursor-pointer
          transition-all duration-300
          group-hover:bg-sky-400
          group-hover:text-black
          group-hover:border-sky-400
          hover:shadow-[0_0_25px_rgba(56,189,248,0.6)]"
        >
          READ MORE
        </button>

      </div>
    </div>
  );
};

export default ServiceCard;