import React from "react";
import { useNavigate } from "react-router-dom";

const BookingBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <div className="relative w-full overflow-hidden min-h-[250px] md:min-h-[310px] object-top flex items-center">
        
        {/* BLUE CAR IMAGE */}
        <img
          src="/images/booking bg.jpg"
          alt="Blue Car"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />

        {/* DARK BLUE OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/30 via-sky-400/20 to-sky-300/30" />

        {/* CONTENT */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center gap-5 px-6 md:px-12 py-8">
          
          {/* TEXT */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-white text-xl md:text-4xl font-bold leading-tight">
              Premium Car Service at Your Doorstep
            </h2>

            <p className="text-gray-300 hidden md:block text-sm md:text-base mt-2">
              Fast, reliable and professional service tailored for your vehicle.
            </p>
          </div>

          {/* BUTTON */}
          <button
            onClick={() => navigate("/bookservice", { state: { selectedPackage: { title: "Premium Car Service", price: "Pending Quote" } } })}
            className="
              px-6 py-3
              rounded-full
              text-sm md:text-base font-semibold
              bg-gradient-to-r from-sky-500 to-blue-600
              text-white
              hover:scale-105
              hover:shadow-[0_0_25px_rgba(56,189,248,0.7)]
              transition-all duration-300
              active:scale-95
            "
          >
            Book Service
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookingBanner;