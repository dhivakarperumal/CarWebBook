import React from "react";
import { useNavigate } from "react-router-dom";

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group relative bg-[#0b0f14]
      border border-sky-400
      shadow-[0_25px_70px_rgba(56,189,248,0.35)]

      md:border-sky-500/40
      md:shadow-[0_10px_30px_rgba(56,189,248,0.15)]
      md:hover:border-sky-400
      md:hover:shadow-[0_25px_70px_rgba(56,189,248,0.35)]

      transition-all duration-500
      flex flex-col h-full rounded-xl overflow-hidden"
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-[120px] md:h-[160px] object-cover
          transition duration-500 group-hover:scale-110"
        />
      </div>

      {/* CONTENT */}
      <div className="p-3 md:p-4 flex flex-col flex-1 text-center">
        {/* TITLE */}
        <h3 className="text-white text-sm md:text-xl font-bold mb-2 md:mb-4 line-clamp-1">
          {service.name}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3 md:mb-5 line-clamp-2 md:line-clamp-3">
          {service.description}
        </p>

        {/* BUTTON */}
        <button
          onClick={() => navigate(`/services/${service.id}`)}
          className="mt-auto w-full py-1.5 md:py-2 text-[10px] md:text-xs font-bold tracking-[0.2em] md:tracking-[0.25em]
          text-sky-400 border border-sky-400/40
          cursor-pointer
          transition-all duration-300
          group-hover:bg-sky-400
          group-hover:text-black
          group-hover:border-sky-400
          hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] rounded-md"
        >
          READ MORE
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;