import React, { useEffect, useState } from "react";
import PageHeader from "./PageHeader";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaGasPump,
  FaCog,
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

const BuyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bikes");
      // Filter only published vehicles
      const published = res.data.filter((vehicle) => vehicle.status === "published");
      setVehicles(published);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || vehicle.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleContactSeller = (vehicle) => {
    // You can implement contact functionality here
    toast.success("Seller will contact you soon!");
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Buy Vehicles" />
        <section className="relative py-20 bg-black text-white">
          <PageContainer>
            <div className="text-center">
              <p className="text-gray-300">Loading vehicles...</p>
            </div>
          </PageContainer>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Buy Quality Vehicles" />

      <section className="relative py-16 bg-black text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s)",
          }}
        />
        <div className="absolute inset-0 bg-black/80" />

        <PageContainer className="relative z-10">
          {/* Filters */}
          <div className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search by brand, model, title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-sky-400/30 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Filter Type */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-sky-400/30 text-white focus:outline-none focus:border-sky-400"
                >
                  <option value="all" className="bg-slate-900">
                    All Vehicles
                  </option>
                  <option value="Bike" className="bg-slate-900">
                    Bikes
                  </option>
                  <option value="Car" className="bg-slate-900">
                    Cars
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sky-300 font-semibold">
              Found {filteredVehicles.length} vehicle(s)
            </p>
          </div>

          {/* Vehicles Grid */}
          {filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => {
                const images = vehicle.images
                  ? typeof vehicle.images === "string"
                    ? JSON.parse(vehicle.images)
                    : vehicle.images
                  : {};
                const mainImage = images.front || images.back || images.side;

                return (
                  <div
                    key={vehicle.id}
                    className="group rounded-2xl border border-sky-500/30 bg-slate-900/50 overflow-hidden hover:border-sky-400 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/20"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
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

                      {/* Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                          ✓ Available
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {vehicle.title}
                      </h3>

                      {/* Brand & Model */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-400">
                          {vehicle.brand} {vehicle.model}
                        </span>
                        <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded">
                          {vehicle.type}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4 pb-4 border-b border-sky-500/20">
                        <p className="text-3xl font-bold text-sky-400">
                          ₹{Number(vehicle.expected_price).toLocaleString("en-IN")}
                        </p>
                        {vehicle.negotiable && (
                          <p className="text-xs text-yellow-400 mt-1">
                            💬 Negotiable
                          </p>
                        )}
                      </div>

                      {/* Quick Info Grid */}
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

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <FaMapMarkerAlt size={14} className="text-orange-400" />
                        <span>
                          {vehicle.city}
                          {vehicle.area ? `, ${vehicle.area}` : ""}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(vehicle)}
                          className="flex-1 py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 transition text-sm font-semibold"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleContactSeller(vehicle)}
                          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:scale-105 transition text-sm font-semibold"
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                No vehicles found matching your criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="mt-4 px-6 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition"
              >
                Clear Filters
              </button>
            </div>
          )}
        </PageContainer>
      </section>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-sky-400/30 max-w-2xl w-full my-10">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-sky-400/20 bg-slate-900/95 z-10">
              <h2 className="text-2xl font-bold text-white">Vehicle Details</h2>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Gallery */}
              {(() => {
                const images = selectedVehicle.images
                  ? typeof selectedVehicle.images === "string"
                    ? JSON.parse(selectedVehicle.images)
                    : selectedVehicle.images
                  : {};
                const imageList = Object.values(images).filter(Boolean);

                return imageList.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {imageList.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Vehicle ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Basic Info */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-sky-300 mb-4">
                  📋 Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Title</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Brand & Model</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Variant</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.variant || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Type</p>
                    <p className="text-white font-semibold">{selectedVehicle.type}</p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-sky-300 mb-4">
                  ⚙️ Technical Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Engine CC</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.engine_cc || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fuel Type</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.fuel_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Transmission</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.transmission}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mileage</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.mileage || "N/A"} kmpl
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">KM Driven</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.km_driven || 0} km
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Owners</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.owners || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Condition */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-sky-300 mb-4">
                  ✓ Vehicle Condition
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RC Available</span>
                    <span className="text-white font-semibold">
                      {selectedVehicle.rc_available ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Insurance Available</span>
                    <span className="text-white font-semibold">
                      {selectedVehicle.insurance_available ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PUC Available</span>
                    <span className="text-white font-semibold">
                      {selectedVehicle.puc_available ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Road Tax Paid</span>
                    <span className="text-white font-semibold">
                      {selectedVehicle.road_tax_paid ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Loan Status</span>
                    <span className="text-white font-semibold">
                      {selectedVehicle.loan_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Location */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-sky-300 mb-4">
                  💰 Price & Location
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Expected Price</p>
                    <p className="text-2xl text-sky-300 font-bold">
                      ₹{Number(selectedVehicle.expected_price).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                    {selectedVehicle.negotiable && (
                      <p className="text-yellow-400 text-xs mt-1">💬 Negotiable</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">City</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Area</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.area || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Pincode</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.pincode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Color</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.color || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-sky-300 mb-4">
                  👤 Seller Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-sky-400" />
                    <div>
                      <p className="text-gray-400">Name</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.seller_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-sky-400" />
                    <div>
                      <p className="text-gray-400">Phone</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.seller_phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-sky-400" />
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.seller_email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedVehicle.description && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-sky-300 mb-3">
                    📝 Description
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedVehicle.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-6 border-t border-sky-400/20 bg-slate-900/95 flex gap-3">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex-1 py-3 rounded-lg border border-gray-600 text-white hover:bg-white/10 transition font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleContactSeller(selectedVehicle);
                  setSelectedVehicle(null);
                }}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:scale-105 transition font-semibold"
              >
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyVehicles;
