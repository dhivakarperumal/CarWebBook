import React, { useState } from "react";
import PageContainer from "./PageContainer";
import { useRef } from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";

import { forwardRef } from "react";
import PageHeader from "./PageHeader";
import { createBooking } from "../api";
import toast from "react-hot-toast";

const BOOKING_STATUS = {
  BOOKED: "Booked",
  CALL_VERIFIED: "Call Verified",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  WAITING_SPARE: "Waiting for Spare",
  SERVICE_GOING: "Service Going on",
  BILL_PENDING: "Bill Pending",
  BILL_COMPLETED: "Bill Completed",
  SERVICE_COMPLETED: "Service Completed",
};

const Input = forwardRef(({ label, required, error, ...props }, ref) => (
  <div>
    <label className="block mb-2 text-sm text-gray-200">
      {label} {required && <span className="text-red-400">*</span>}
    </label>

    <input
      ref={ref}
      {...props}
      className={`w-full rounded-xl bg-black/60 border px-4 py-3 text-white
      focus:outline-none
      ${error ? "border-red-400" : "border-sky-200/70 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"}`}
    />

    <p className="mt-1 h-4 text-xs text-red-400">{error || ""}</p>
  </div>
));

const Textarea = forwardRef(({ label, required, error, ...props }, ref) => (
  <div>
    <label className="block mb-2 text-sm text-gray-200">
      {label} {required && <span className="text-red-400">*</span>}
    </label>

    <textarea
      ref={ref}
      {...props}
      className={`w-full rounded-xl bg-black/60 border px-4 py-3 text-white
      focus:outline-none
      ${error ? "border-red-400" : "border-sky-200/70 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"}`}
    />

    <p className="mt-1 h-4 text-xs text-red-400">{error || ""}</p>
  </div>
));

const Select = forwardRef(
  ({ label, required, error, children, ...props }, ref) => (
    <div>
      <label className="block mb-2 text-sm text-gray-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <select
        ref={ref}
        {...props}
        className={`w-full rounded-xl bg-black/60 border px-4 py-3 text-white
      focus:outline-none
      ${error ? "border-red-400" : "border-sky-200/70 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"}`}
      >
        {children}
      </select>

      <p className="mt-1 h-4 text-xs text-red-400">{error || ""}</p>
    </div>
  ),
);

const BookService = () => {
  const [vehicleType, setVehicleType] = useState("car");
  const [selectedPincode, setSelectedPincode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    altPhone: "",
    brand: "",
    model: "",
    issue: "",
    otherIssue: "",
    vehicleNumber: "",
    address: "",
    location: "",
  });

  const refs = {
    name: useRef(),
    phone: useRef(),
    email: useRef(),
    brand: useRef(),
    model: useRef(),
    issue: useRef(),
    location: useRef(),
    address: useRef(),
  };

  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setLocationResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`,
      );
      const data = await res.json();
      setLocationResults(data);
    } catch (error) {
      console.error("Search failed");
    }
  };

  const handleSelectLocation = (place) => {
    setFormData((prev) => ({
      ...prev,
      location: place.display_name,
    }));

    setLocationQuery(place.display_name);

    setCoords({
      lat: place.lat,
      lng: place.lon,
    });

    const city =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      "";

    const pincode = place.address?.postcode || "";
    setSelectedPincode(pincode);

    setIsChennai(["chennai", "tirupattur"].includes(city.toLowerCase()));

    setLocationResults([]);
  };

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [isChennai, setIsChennai] = useState(true);
  const [submitError, setSubmitError] = useState("");

  const [errors, setErrors] = useState({});

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setSubmitError("");

    if (!navigator.geolocation) {
      setSubmitError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "";

          setFormData((prev) => ({
            ...prev,
            location: data.display_name,
          }));

          setLocationQuery(data.display_name);

          setCoords({
            lat: latitude,
            lng: longitude,
          });

          const pincode = data.address?.postcode || "";
          setSelectedPincode(pincode);

          setIsChennai(["chennai", "tirupattur"].includes(city.toLowerCase()));
        } catch (err) {
          console.error(err);
          setSubmitError("Unable to fetch address from location");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        if (error.code === 1) {
          setSubmitError("Location permission denied");
        } else if (error.code === 2) {
          setSubmitError("Location unavailable");
        } else if (error.code === 3) {
          setSubmitError("Location request timed out");
        }

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* -------------------------------------------------
           1️⃣ BLOCK IF USER NOT LOGGED IN
        -------------------------------------------------- */
    if (!user) {
      setSubmitError("Please login to book a service");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

      return;
    }

    /* -------------------------------------------------
           2️⃣ FORM VALIDATION
        -------------------------------------------------- */
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.issue) newErrors.issue = "Issue is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.address) newErrors.address = "Service address is required";

    if (!coords.lat || !coords.lng) {
      newErrors.location = "Please select location or use current location";
    } else if (!isChennai) {
      newErrors.location = "Service available only in Chennai & Tirupattur";
    }

    setErrors(newErrors);

    /* -------------------------------------------------
           3️⃣ SCROLL TO FIRST ERROR
        -------------------------------------------------- */
    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey && refs[firstErrorKey]?.current) {
      refs[firstErrorKey].current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      refs[firstErrorKey].current.focus();
      return;
    }

    /* -------------------------------------------------
           4️⃣ SYNC WITH MYSQL BACKEND
        -------------------------------------------------- */
    try {
      setSubmitting(true);

      const bookingData = {
        uid: user.uid,
        vehicleType: vehicleType,

        // User details
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        altPhone: formData.altPhone || "",

        // Vehicle & service details
        brand: formData.brand,
        model: formData.model,
        issue: formData.issue,
        otherIssue: formData.otherIssue || "",
        vehicleNumber: formData.vehicleNumber,
        address: formData.address,
        location: formData.location,
        latitude: coords.lat,
        longitude: coords.lng,

        // Status tracking
        status: BOOKING_STATUS.BOOKED,
      };

      // CHECK SERVICE AREA PINCODE
      const res = await fetch(`${import.meta.env.VITE_API_URL}/service-areas`);
      const areas = await res.json();

      const validArea = areas.find(
        (area) =>
          String(area.pincode).trim() === String(selectedPincode).trim() &&
          area.status === "active",
      );

      if (!validArea) {
        toast.error("Service not available for your area");
        setSubmitting(false);
        return;
      }

      const response = await createBooking(bookingData);
      console.log("✅ Booking Successful:", response.data.bookingId);

      setFormData({
        name: "",
        phone: "",
        email: "",
        altPhone: "",
        brand: "",
        model: "",
        issue: "",
        otherIssue: "",
        address: "",
        location: "",
      });

      setErrors({});
      setSubmitError("");

      /* -------------------------------------------------
               5️⃣ REDIRECT TO SUCCESS PAGE
            -------------------------------------------------- */
      navigate(`/account`);
    } catch (error) {
      console.error("❌ Booking failed:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Book Your Service" />
      <section className="relative py-24 bg-black text-white overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s)",
          }}
        />
        <div className="absolute inset-0 bg-black/80" />

        <PageContainer>
          <div className="relative max-w-3xl mx-auto">
            {/* Form Card */}
            <form className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 space-y-2 shadow-2xl">
              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  ref={refs.name}
                  label="Full Name"
                  name="name"
                  required
                  error={errors.name}
                  onChange={handleChange}
                />

                <Input
                  ref={refs.email}
                  label="Email Address"
                  name="email"
                  required
                  error={errors.email}
                  onChange={handleChange}
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  ref={refs.phone}
                  label="Phone Number"
                  name="phone"
                  required
                  error={errors.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Alternative Phone (Optional)"
                  name="altPhone"
                  onChange={handleChange}
                />
              </div>

              {/* Vehicle Type */}
              <div className="flex gap-6 mb-6">
                <label
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all
    ${
      vehicleType === "car"
        ? "border-sky-400 bg-sky-400/10 shadow-md shadow-sky-400/20"
        : "border-white/20 hover:border-sky-400/40"
    }`}
                >
                  <input
                    type="radio"
                    value="car"
                    checked={vehicleType === "car"}
                    onChange={() => setVehicleType("car")}
                    className="accent-sky-400"
                  />
                  <span className="text-gray-200 font-medium">Car</span>
                </label>

                <label
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all
    ${
      vehicleType === "bike"
        ? "border-sky-400 bg-sky-400/10 shadow-md shadow-sky-400/20"
        : "border-white/20 hover:border-sky-400/40"
    }`}
                >
                  <input
                    type="radio"
                    value="bike"
                    checked={vehicleType === "bike"}
                    onChange={() => setVehicleType("bike")}
                    className="accent-sky-400"
                  />
                  <span className="text-gray-200 font-medium">Bike</span>
                </label>
              </div>

              {/* Brand & Model */}
              <div className="grid md:grid-cols-2 gap-6 cursor-pointer">
                <Select
                  ref={refs.brand}
                  label={vehicleType === "car" ? "Car Brand" : "Bike Brand"}
                  name="brand"
                  required
                  error={errors.brand}
                  onChange={handleChange}
                >
                  <option value="">Select Brand</option>

                  {vehicleType === "car" ? (
                    <>
                      <option>Honda</option>
                      <option>Hyundai</option>
                      <option>BMW</option>
                      <option>Audi</option>
                    </>
                  ) : (
                    <>
                      <option>Yamaha</option>
                      <option>Royal Enfield</option>
                      <option>Honda</option>
                      <option>Bajaj</option>
                      <option>TVS</option>
                    </>
                  )}
                </Select>

                <Input
                  ref={refs.model}
                  label={vehicleType === "car" ? "Car Model" : "Bike Model"}
                  name="model"
                  required
                  error={errors.model}
                  onChange={handleChange}
                />
              </div>

              {/* Issue + Vehicle Number */}
              <div className="grid md:grid-cols-2 gap-6">
                <Select
                  ref={refs.issue}
                  label="Issue"
                  name="issue"
                  className="cursor-pointer"
                  required
                  error={errors.issue}
                  onChange={handleChange}
                >
                  <option value="">Select Issue</option>
                  <option>Engine Problem</option>
                  <option>Brake Issue</option>
                  <option>Electrical</option>
                  <option>Others</option>
                </Select>

                <Input
                  label="Vehicle Number"
                  name="vehicleNumber"
                  placeholder="TN 01 AB 1234"
                  onChange={handleChange}
                />
              </div>

              {formData.issue === "Others" && (
                <Input
                  label="Describe the Issue"
                  name="otherIssue"
                  onChange={handleChange}
                />
              )}

              <div>
                <div>
                  <label className="block mb-2 text-sm text-gray-200">
                    Location <span className="text-red-400">*</span>
                  </label>

                  {/* SEARCH INPUT */}
                  <input
                    ref={refs.location}
                    type="text"
                    value={locationQuery}
                    placeholder="Search your area..."
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setCoords({ lat: null, lng: null });
                      searchLocation(e.target.value);
                    }}
                    className="w-full rounded-xl bg-black/60 border px-4 py-3 text-white border-sky-200/70 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />

                  {/* SEARCH RESULTS */}
                  {locationResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-white/10 bg-black max-h-56 overflow-y-auto relative z-50">
                      {locationResults.map((place) => (
                        <div
                          key={place.place_id}
                          onClick={() => handleSelectLocation(place)}
                          className="px-4 py-3 cursor-pointer text-sm hover:bg-white/10"
                        >
                          {place.display_name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CURRENT LOCATION BUTTON (UNCHANGED) */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="mt-4 px-6 py-3 cursor-pointer rounded-xl font-semibold text-black
    bg-gradient-to-r from-sky-500 to-cyan-400"
                  >
                    {locationLoading ? "Fetching..." : "Use Current Location"}
                  </button>

                  <p className="mt-1 h-4 text-xs text-red-400">
                    {errors.location || ""}
                  </p>
                </div>
              </div>

              {/* Address */}
              <Textarea
                ref={refs.address}
                label="Service Address"
                name="address"
                required
                error={errors.address}
                onChange={handleChange}
              />
              {submitError && (
                <p className="text-red-400 text-sm text-center">
                  {submitError}
                </p>
              )}

              {/* submit button */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!user || submitting}
                className="w-full py-4 cursor-pointer rounded-full font-semibold text-black
  bg-gradient-to-r from-sky-500 to-cyan-400
  hover:scale-105 transition-all duration-300
  shadow-lg shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Booking..." : "Book Service →"}
              </button>
            </form>
          </div>
        </PageContainer>
      </section>
    </>
  );
};

export default BookService;
