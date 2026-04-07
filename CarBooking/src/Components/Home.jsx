import react, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import api from "../api";
import {
  FaCog,
  FaTachometerAlt,
  FaUsers,
  FaGasPump,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";
import Hero from "./Hero";
import AboutHome from "./AboutHome";
import ServiceSwiper from "./SeviceSwiper";
import PricingSwiper from "./PricingSwiper";
import BrandSwiper from "./BrandSwiper";
import Reviews from "./Reviews";
import BookingBanner from "./BookingBanner";
import ProductSwiper from "./ProductSwiper";
import VehicleSwiper from "./VehicleSwiper";
import PageContainer from "./PageContainer";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);

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
              pickupAddress: `Vehicle Pickup at ${vehicle.city}, ${vehicle.pincode}`,
            };

            const res = await api.post("/vehicle-bookings", bookingData);
            const newBookingId = res.data.bookingId;

            toast.success(
              `Vehicle Booking successful! Booking ID: ${newBookingId}`,
            );
            closeModal();
            navigate("/account", {
              state: {
                tab: "vehicle-bookings",
                highlightBookingId: newBookingId,
              },
            });
          } catch (err) {
            console.error("Booking save error:", err);
            toast.error(
              "Payment succeeded but booking tracking failed. Please contact support.",
            );
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

  return (
    <>
      <h1>
        <Hero />
        <AboutHome />
        <ServiceSwiper />
        <BookingBanner />
        <PricingSwiper />
        <ProductSwiper />
        <VehicleSwiper
          handleViewDetails={handleViewDetails}
          handleBookNow={handleBookNow}
          bookingInProgress={bookingInProgress}
        />
        <BrandSwiper />
        <Reviews />
      </h1>

      {/* VEHICLE DETAILS MODAL */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-4xl mx-auto bg-slate-900 rounded-3xl border border-sky-400/30 shadow-2xl shadow-sky-500/20 mt-8 mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition"
            >
              <FaTimes size={24} />
            </button>

            <div className="p-4 sm:p-8 space-y-8 custom-scrollbar max-h-[calc(100vh-100px)] overflow-y-auto">
              {/* Image Gallery Section */}
              {(() => {
                const images = selectedVehicle.images
                  ? typeof selectedVehicle.images === "string"
                    ? JSON.parse(selectedVehicle.images)
                    : selectedVehicle.images
                  : {};
                const imageList = Object.values(images).filter(Boolean);

                return imageList.length > 0 ? (
                  <div className="space-y-4">
                    <div
                      className="relative rounded-2xl overflow-hidden bg-slate-700 cursor-pointer group"
                      onClick={() =>
                        setFullscreenImage(selectedImage || imageList[0])
                      }
                    >
                      <img
                        src={selectedImage || imageList[0]}
                        alt="Main Vehicle"
                        className="w-full h-[240px] sm:h-[320px] md:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="text-white text-center">
                          <h4 className="text-lg font-semibold mb-2">
                            Click to zoom
                          </h4>
                        </div>
                      </div>
                    </div>

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

              {/* Price Section */}
              <div className="bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-sky-500/15 border border-sky-400/40 rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm mb-3 uppercase tracking-wider">
                      Expected Price
                    </p>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-sky-300">
                      ₹
                      {Number(selectedVehicle.expected_price).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-gray-300 text-xs mb-2 uppercase tracking-wider">
                      Advance Booking Amount
                    </p>
                    <span className="inline-block px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 text-xl font-bold border border-sky-400/40">
                      ₹
                      {Number(
                        selectedVehicle.advance_amount_paid || 5000,
                      ).toLocaleString("en-IN")}
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
                    <p className="text-gray-400 text-sm mb-2">Type</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedVehicle.type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <FaCog className="text-sky-400" /> Technical Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                    <FaGasPump className="text-orange-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-xs uppercase">
                        Fuel Type
                      </p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.fuel_type}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                    <FaCog className="text-cyan-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-xs uppercase">
                        Transmission
                      </p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.transmission}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-3">
                    <FaTachometerAlt className="text-green-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-xs uppercase">
                        KM Driven
                      </p>
                      <p className="text-white font-semibold">
                        {selectedVehicle.km_driven || 0} km
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase mb-2">
                      Year
                    </p>
                    <p className="text-white font-semibold text-lg">
                      {selectedVehicle.yom || "N/A"}
                    </p>
                  </div>
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
                </div>
              </div>

              {/* Description */}
              {selectedVehicle.description && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaFileAlt className="text-yellow-400" /> Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {selectedVehicle.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Buttons */}
            <div className="sticky bottom-0 p-4 sm:p-6 border-t border-sky-400/20 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl flex flex-col sm:flex-row gap-3 rounded-b-3xl">
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
                    {bookingInProgress === selectedVehicle.id
                      ? "Processing..."
                      : "Book Now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
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
}
