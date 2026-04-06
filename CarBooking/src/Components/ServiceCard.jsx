import React from "react";
import { useNavigate } from "react-router-dom";

const ServiceCard = ({ service }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group relative bg-[#0b0f14]

  border border-sky-400
  shadow-[0_25px_70px_rgba(56,189,248,0.35)]

md:border-white/20
md:shadow-[0_10px_30px_rgba(56,189,248,0.15)]
  md:hover:border-sky-400
  md:hover:shadow-[0_25px_70px_rgba(56,189,248,0.35)]

  transition-all duration-500
  flex flex-col h-full"
    >
      {/* IMAGE TOP */}
      <div className="relative overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-[160px] object-cover
          transition duration-500 group-hover:scale-110"
        />
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col flex-1 text-center">
        {/* TITLE */}
        <h3 className="text-white text-xl font-bold mb-4">{service.name}</h3>

        {/* DESCRIPTION */}
        <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">
          {service.description}
        </p>

        {/* BUTTON */}
        <button
          onClick={() => navigate(`/services/${service.id}`)}
          className="mt-auto w-full py-1.5 text-xs font-bold tracking-[0.25em]
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
