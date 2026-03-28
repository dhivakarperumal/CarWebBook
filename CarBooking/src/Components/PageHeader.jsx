import React from "react";
import { Link } from "react-router-dom";

const PageHeader = ({
  title = "Page Title",
  bgImage = "/images/Home4.webp",
}) => {
  return (
    <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">

      {/* Background Image */}
      <img
        src={bgImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center header-zoom"
      />

      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />

      {/* CENTER TITLE */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">

        <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight">
          {title}
        </h1>

        {/* Accent */}
        <div className="w-16 h-[3px] bg-blue-500 mt-4" />

      </div>

      {/* BREADCRUMB */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">

        <nav className="flex items-center gap-2 text-sm uppercase tracking-widest
          text-gray-300 bg-black/50 px-6 py-2 rounded-full backdrop-blur">

          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Home
          </Link>

          <span>/</span>

          <span className="text-gray-200">{title}</span>

        </nav>

      </div>

    </section>
  );
};

export default PageHeader;
