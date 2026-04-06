import React from "react";
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaGasPump,
  FaCog,
  FaTachometerAlt,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";

export default function VehicleCard({
  vehicle,
  handleViewDetails,
  handleBookNow,
  bookingInProgress,
}) {
  const images = vehicle.images
    ? typeof vehicle.images === "string"
      ? JSON.parse(vehicle.images)
      : vehicle.images
    : {};

  const mainImage = images.front || images.back || images.side;

  return (
    <div
      className={`relative group rounded-2xl border border-sky-500/30 bg-slate-900/50 overflow-hidden transition-all duration-300 ${
        vehicle.status === "booked"
          ? "grayscale-[20%] opacity-75 cursor-not-allowed"
          : "hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-500/20"
      }`}
    >
      {/* SOLD OUT OVERLAY */}
      {vehicle.status === "booked" && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center p-4">
          <div className="px-8 py-4 border-4 border-red-500 rounded-2xl transform -rotate-12 bg-black/60 shadow-2xl text-center">
            <span className="text-4xl font-black text-red-500 uppercase tracking-tighter">
              Sold Out
            </span>
          </div>
        </div>
      )}

      {/* IMAGE */}
      <div className="relative h-40 bg-slate-800 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={vehicle.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}

        {/* STATUS BADGE */}
        <div className="absolute top-3 right-3">
          {vehicle.status === "booked" ? (
            <span className="px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold border border-red-400/30 flex items-center gap-1">
              <FaTimes size={10} /> Sold Out
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
              <FaCheckCircle size={10} /> Available
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* TITLE */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
          {vehicle.title}
        </h3>

        {/* BRAND + TYPE */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-400">
            {vehicle.brand} {vehicle.model}
          </span>

          <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded">
            {vehicle.type}
          </span>
        </div>

        {/* PRICE */}
        <div className="mb-3 pb-3 border-b border-sky-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Price
            </p>
            <p className="text-xl font-bold text-sky-400">
              ₹{Number(vehicle.expected_price).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Advance
            </p>

            <p className="text-sm font-bold text-sky-300">
              ₹
              {Number(vehicle.advance_amount_paid || 5000).toLocaleString(
                "en-IN",
              )}
            </p>
          </div>
        </div>

        {/* QUICK INFO */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1 text-gray-300">
            <FaCalendarAlt size={12} className="text-sky-400" />
            <span>{vehicle.yom || "N/A"}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300">
            <FaTachometerAlt size={12} className="text-sky-400" />
            <span>{vehicle.km_driven || 0} km</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300">
            <FaGasPump size={12} className="text-sky-400" />
            <span>{vehicle.fuel_type}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300">
            <FaCog size={12} className="text-sky-400" />
            <span>{vehicle.transmission}</span>
          </div>
        </div>

        {/* LOCATION */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <FaMapMarkerAlt size={14} className="text-orange-400" />

          <span>
            {vehicle.city}
            {vehicle.area ? `, ${vehicle.area}` : ""}
          </span>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2">
          {vehicle.status === "booked" ? (
            <button
              disabled
              className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 font-bold text-center uppercase tracking-widest cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <>
              <button
                onClick={() => handleViewDetails(vehicle)}
                className="flex-1 py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 transition text-sm font-semibold cursor-pointer"
              >
                View Details
              </button>

              <button
                onClick={() => handleBookNow(vehicle)}
                disabled={bookingInProgress === vehicle.id}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:scale-102 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {bookingInProgress === vehicle.id ? "Loading..." : "Book Now"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
