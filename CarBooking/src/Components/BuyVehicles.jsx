import React, { useEffect, useState } from "react";
import PageHeader from "./PageHeader";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
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
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";

const BuyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bikes");
      // Filter only published and booked vehicles
      const published = res.data.filter(
        (vehicle) => vehicle.status === "published" || vehicle.status === "booked"
      );
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
    setSelectedImage(null);
    setFullscreenImage(null);
    document.body.style.overflow = "hidden";
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handleBookNow = async (vehicle) => {
    if (!user) {
      toast.error("Please login to book a vehicle");
      navigate("/login");
      return;
    }

    setBookingInProgress(vehicle.id);
    try {
      const advanceAmount = Number(vehicle.advance_amount_paid) || 5000;
      const amountPaise = Math.round(advanceAmount * 100);

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load script");

      const options = {
        key: "rzp_test_SGj8n5SyKSE10b",
        amount: amountPaise,
        currency: "INR",
        name: "Car Store",
        description: `Advance Payment for ${vehicle.brand} ${vehicle.model}`,
        handler: async (response) => {
          try {
            // Store the booking in the vehicle_bookings table
            const bookingData = {
              uid: user.id || user.uid,
              customerName: user.username || "Guest",
              customerPhone: user.mobile || "",
              customerEmail: user.email || "",
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.brand} ${vehicle.model}`,
              vehicleType: vehicle.type || "Vehicle",
              paymentMethod: "ONLINE_RAZORPAY",
              paymentStatus: `Paid`,
              paymentId: response.razorpay_payment_id,
              status: "Booked",
              advanceAmount: advanceAmount,
              pickupAddress: `Vehicle Pickup at ${vehicle.city}, ${vehicle.pincode}`
            };

            const res = await api.post("/vehicle-bookings", bookingData);
            const newBookingId = res.data.bookingId;

            toast.success(`Vehicle Booking successful! Booking ID: ${newBookingId}`);
            closeModal();
            // Navigate to /account on the vehicle-bookings tab
            navigate("/account", { 
              state: { 
                tab: "vehicle-bookings",
                highlightBookingId: newBookingId
              } 
            });
          } catch (err) {
            console.error("Booking save error:", err);
            toast.error("Payment succeeded but booking tracking failed. Please contact support.");
          } finally {
            setBookingInProgress(null);
          }
        },
        prefill: {
          name: user.username || "",
          email: user.email || "",
          contact: user.mobile || "",
        },
        theme: { color: "#38bdf8" },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment cancelled or failed.");
        setBookingInProgress(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment");
      setBookingInProgress(null);
    }
  };

  const closeModal = () => {
    setSelectedVehicle(null);
    setSelectedImage(null);
    setFullscreenImage(null);
    document.body.style.overflow = "auto";
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
                    className={`relative group rounded-2xl border border-sky-500/30 bg-slate-900/50 overflow-hidden transition-all duration-300 ${
                      vehicle.status === "booked" 
                        ? "grayscale-[20%] opacity-75 cursor-not-allowed" 
                        : "hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-500/20"
                    }`}
                  >
                    {/* Full Card Sold Out Overlay */}
                    {vehicle.status === "booked" && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center p-4">
                        <div className="px-8 py-4 border-4 border-red-500 rounded-2xl transform -rotate-12 bg-black/60 shadow-2xl text-center">
                          <span className="text-4xl font-black text-red-500 uppercase tracking-tighter">
                            Sold Out
                          </span>
                        </div>
                      </div>
                    )}

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
                        {vehicle.status === "booked" ? (
                          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-400/30 flex items-center gap-1">
                            <FaTimes size={10} /> Sold Out
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
                            <FaCheckCircle size={10} /> Available
                          </span>
                        )}
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
                        <div className="flex items-center justify-between mt-2">
                          {vehicle.negotiable && (
                            <p className="text-xs text-yellow-400">
                              Negotiable Price
                            </p>
                          )}
                          <div className="text-right">
                             <p className="text-[10px] text-gray-400 uppercase tracking-wider">Advance</p>
                             <p className="text-sm font-bold text-sky-300">
                               ₹{Number(vehicle.advance_amount_paid || 5000).toLocaleString("en-IN")}
                             </p>
                          </div>
                        </div>
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
                              className="flex-1 py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 transition text-sm font-semibold"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleBookNow(vehicle)}
                              disabled={bookingInProgress === vehicle.id}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:scale-105 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {bookingInProgress === vehicle.id ? "Loading..." : "Book Now"}
                            </button>
                          </>
                        )}
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

      {/* Premium Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-sky-400/40 w-full max-w-5xl shadow-2xl shadow-sky-500/30 my-8">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl flex items-center justify-between p-8 border-b border-sky-400/20 z-10 rounded-t-3xl">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h2>
                <p className="text-sky-300 text-sm">{selectedVehicle.title}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-full transition"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
              <div className="p-8 space-y-8">
                {/* Image Gallery Section - Premium */}
                {(() => {
                  const images = selectedVehicle.images
                    ? typeof selectedVehicle.images === "string"
                      ? JSON.parse(selectedVehicle.images)
                      : selectedVehicle.images
                    : {};
                  const imageList = Object.values(images).filter(Boolean);

                  return imageList.length > 0 ? (
                    <div className="space-y-4">
                      {/* Main Image with Zoom Overlay */}
                      <div
                        className="relative rounded-2xl overflow-hidden bg-slate-700 cursor-pointer group"
                        onClick={() => setFullscreenImage(selectedImage || imageList[0])}
                      >
                        <img
                          src={selectedImage || imageList[0]}
                          alt="Main Vehicle"
                          className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <div className="text-white text-center">
                            <h4 className="text-lg font-semibold mb-2">Click to zoom</h4>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail Gallery */}
                      {imageList.length > 1 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-3">
                            Click thumbnail to view ({imageList.length} images)
                          </p>
                          <div className="grid grid-cols-5 md:grid-cols-6 gap-3">
                            {imageList.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedImage(img)}
                                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition transform hover:scale-105 ${
                                  selectedImage === img
                                    ? "border-sky-400 shadow-lg shadow-sky-400/50"
                                    : "border-slate-600 hover:border-sky-400"
                                }`}
                              >
                                <img
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className="w-full h-20 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Price Section - Premium Gradient */}
                <div className="bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-sky-500/15 border border-sky-400/40 rounded-2xl p-8">
                  <div className="flex items-end justify-between gap-6">
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm mb-3 uppercase tracking-wider">
                        Expected Price
                      </p>
                      <p className="text-5xl font-bold text-sky-300">
                        ₹{Number(selectedVehicle.expected_price).toLocaleString("en-IN")}
                      </p>
                      {selectedVehicle.negotiable && (
                        <p className="text-amber-400 text-sm mt-3 font-semibold">
                          Negotiable Price Available
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-gray-300 text-xs mb-2 uppercase tracking-wider">
                        Advance Booking Amount
                      </p>
                      <span className="inline-block px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 text-xl font-bold border border-sky-400/40">
                        ₹{Number(selectedVehicle.advance_amount_paid || 5000).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaCheckCircle className="text-sky-400" /> Basic Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Title</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Brand & Model</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Variant</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.variant || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Type</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Color</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.color || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Year</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.yom || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaCog className="text-sky-400" /> Technical Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-gray-400 text-xs uppercase mb-2">Engine CC</p>
                      <p className="text-white font-semibold text-xl">
                        {selectedVehicle.engine_cc || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                      <FaGasPump className="text-orange-400 text-2xl" />
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Fuel Type</p>
                        <p className="text-white font-semibold">
                          {selectedVehicle.fuel_type}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                      <FaCog className="text-cyan-400 text-2xl" />
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Transmission</p>
                        <p className="text-white font-semibold">
                          {selectedVehicle.transmission}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-gray-400 text-xs uppercase mb-2">Mileage</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.mileage || "N/A"} kmpl
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                      <FaTachometerAlt className="text-green-400 text-2xl" />
                      <div>
                        <p className="text-gray-400 text-xs uppercase">KM Driven</p>
                        <p className="text-white font-semibold">
                          {selectedVehicle.km_driven || 0} km
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                      <FaUsers className="text-purple-400 text-2xl" />
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Owners</p>
                        <p className="text-white font-semibold">
                          {selectedVehicle.owners || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-gray-400 text-xs uppercase mb-2">Registration</p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.reg_year || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-gray-400 text-xs uppercase mb-2">Loan Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          selectedVehicle.loan_status === "Clear"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {selectedVehicle.loan_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Condition */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-400" /> Vehicle Condition
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "RC Available", value: selectedVehicle.rc_available },
                      {
                        label: "Insurance",
                        value: selectedVehicle.insurance_available,
                      },
                      { label: "PUC Available", value: selectedVehicle.puc_available },
                      { label: "Road Tax Paid", value: selectedVehicle.road_tax_paid },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border font-semibold text-center ${
                          item.value
                            ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                            : "bg-red-500/10 border-red-400/30 text-red-300"
                        }`}
                      >
                        {item.value ? "✓ Yes" : "✗ No"}
                        <p className="text-xs text-gray-400 mt-2">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-orange-400" /> Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">City</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Area</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.area || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Pincode</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedVehicle.pincode || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seller Information - Premium Cards */}
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaUser className="text-cyan-400" /> Seller Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-sky-400/30 transition">
                      <FaUser className="text-sky-400 text-2xl flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Name</p>
                        <p className="text-white font-semibold text-lg">
                          {selectedVehicle.seller_name || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-green-400/30 transition">
                      <FaPhone className="text-green-400 text-2xl flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Phone</p>
                        <p className="text-white font-semibold text-lg">
                          {selectedVehicle.seller_phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-400/30 transition">
                      <FaEnvelope className="text-purple-400 text-2xl flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Email</p>
                        <p className="text-white font-semibold text-lg break-all">
                          {selectedVehicle.seller_email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedVehicle.description && (
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <FaFileAlt className="text-yellow-400" /> Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {selectedVehicle.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Footer */}
            <div className="sticky bottom-0 p-6 border-t border-sky-400/20 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl flex gap-3 rounded-b-3xl">
              {selectedVehicle.status === "booked" ? (
                <button
                  disabled
                  className="w-full py-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 font-bold text-center uppercase tracking-widest cursor-not-allowed text-lg"
                >
                  Sold Out
                </button>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-lg border border-gray-600 text-white hover:bg-white/10 transition font-semibold text-lg"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleBookNow(selectedVehicle)}
                    disabled={bookingInProgress === selectedVehicle.id}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:scale-105 transition font-semibold text-lg shadow-lg shadow-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingInProgress === selectedVehicle.id ? "Processing..." : "Book Now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[60] p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(null);
            }}
            className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition text-3xl z-[61]"
          >
            <FaTimes />
          </button>
          <img
            src={fullscreenImage}
            alt="Full view"
            className="max-w-4xl max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.5);
          border-radius: 10px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.8);
        }
      `}</style>
    </>
  );
};

export default BuyVehicles;
