import React, { useState, useEffect, useRef, forwardRef } from "react";
import PageContainer from "./PageContainer";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { createAppointment } from "../api";
import toast from "react-hot-toast";
import { FiChevronDown } from "react-icons/fi";

const APPOINTMENT_STATUS = {
  BOOKED: "Appointment Booked",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const SERVICE_PRICES = {
  "General Service": 2499,
  "Full Service": 4999,
  "Oil Change": 1499,
  "Brake Repair": 1999,
  "Engine Check": 2999,
  "AC Service": 2499,
  "Wheel Alignment": 999,
  "Custom Issue": 499,
};

// --- Reusable Styled Components ---

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-6 mt-8">
    <span className="text-2xl">{icon}</span>
    <h3 className="text-xl font-bold text-sky-400 uppercase tracking-wider">{title}</h3>
    <div className="flex-1 h-px bg-gradient-to-r from-sky-400/50 to-transparent ml-4"></div>
  </div>
);

const CustomSelect = ({ label, name, value, onChange, options, required, error, openDropdown, setOpenDropdown }) => {
  const isOpen = openDropdown === name;

  return (
    <div className="space-y-1.5"> {/* ✅ SAME as Input */}

      {/* LABEL */}
      <label className="block text-sm font-medium text-gray-300 ml-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* SELECT BOX */}
      <div className="relative group">
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : name);
          }}
          className={`w-full rounded-xl bg-white/5 border px-4 py-3 text-white
          transition-all duration-300 backdrop-blur
          flex items-center justify-between cursor-pointer
          
          ${error
              ? "border-red-500/50 ring-1 ring-red-500/20"
              : "border-white/10 group-focus-within:border-sky-500/50 group-focus-within:ring-4 group-focus-within:ring-sky-500/10"
            }`}
        >
          <span className={`${!value ? "text-gray-500" : "text-white"}`}>
            {value || "Select option"}
          </span>

          <FiChevronDown
            className={`w-4 h-4 text-gray-400 transition ${open ? "rotate-180" : ""
              }`}
          />
        </div>

        {/* DROPDOWN */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl bg-[#0a0a0b] border border-white	 overflow-hidden">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange({ target: { name, value: opt.value } });
                  setOpenDropdown(null);
                }}
                className={`px-4 py-3 text-sm cursor-pointer transition
                  ${value === opt.value
                    ? "bg-sky-400 text-black"
                    : "text-white hover:bg-sky-400/20"
                  }`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 ml-1 mt-1">{error}</p>}
    </div>
  );
};

const Input = forwardRef(({ label, required, error, icon, ...props }, ref) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-300 ml-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-400 transition-colors">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl bg-white/5 border px-4 py-3 text-white transition-all duration-300
        placeholder:text-gray-500 focus:outline-none focus:bg-white/10
        ${icon ? "pl-11" : ""}
        ${error ? "border-red-500/50 ring-1 ring-red-500/20" : "border-white/10 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"}`}
      />
    </div>
    {error && <p className="text-xs text-red-400 ml-1 mt-1">{error}</p>}
  </div>
));


const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    vehicleType: "Car",
    brand: "",
    model: "",
    registrationNumber: "",
    fuelType: "Petrol",
    yearOfManufacture: "",
    currentMileage: "",
    serviceType: "",
    otherIssue: "",
    pickupDrop: "No",
    preferredDate: "",
    preferredTimeSlot: "Morning (9AM–12PM)",
    serviceMode: "At Service Center",
    pickupAddress: "",
    location: "",
    paymentMode: "Pay After Service",
    couponCode: "",
    notes: "",
    emergencyService: false,
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    let cost = SERVICE_PRICES[formData.serviceType] || 0;
    if (formData.emergencyService) cost += 500;
    if (formData.pickupDrop === "Yes") cost += 300;
    setEstimatedCost(cost);
  }, [formData.serviceType, formData.emergencyService, formData.pickupDrop]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) {
            const errorMsg = res.status === 429
              ? "Location service is busy. Please wait 2 seconds."
              : `Service error: ${res.status}`;
            toast.error(errorMsg);
            setTimeout(() => setLocationLoading(false), 2000);
            return;
          }
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const pincode = data.address?.postcode || "";

          setFormData((prev) => ({
            ...prev,
            location: data.display_name,
            city: city,
            pincode: pincode
          }));
          setLocationQuery(data.display_name);
          setCoords({ lat: latitude, lng: longitude });
        } catch (err) {
          toast.error(`Fetch error: ${err.message}`);
        } finally {
          setTimeout(() => setLocationLoading(false), 2000); // 2 second cooldown
        }
      },
      (error) => {
        toast.error("Location permission denied");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const searchTimeoutRef = useRef(null);
  const searchLocation = async (query) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.length < 3) {
      setLocationResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`);
        if (res.status === 429) {
          toast.error("Location search is busy. Please try again in 1 second.");
          return;
        }
        const data = await res.json();
        setLocationResults(data);
      } catch (e) { console.error("Search failed"); }
    }, 600);
  };

  const handleSelectLocation = (place) => {
    const city = place.address?.city || place.address?.town || place.address?.village || "";
    const pincode = place.address?.postcode || "";

    setFormData(prev => ({
      ...prev,
      location: place.display_name,
      city: city,
      pincode: pincode
    }));
    setLocationQuery(place.display_name);
    setCoords({ lat: place.lat, lng: place.lon });
    setLocationResults([]);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.phone) newErrors.phone = "Mobile number is required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    if (!formData.serviceType) newErrors.serviceType = "Please select a service type";
    if (!formData.preferredDate) newErrors.preferredDate = "Please select a date";
    if (!formData.termsAccepted) newErrors.termsAccepted = "You must accept terms and conditions";

    if (formData.serviceMode === "Doorstep Service" && !formData.pickupAddress) {
      newErrors.pickupAddress = "Pickup address is required for doorstep service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to book an appointment");
      navigate("/login");
      return;
    }

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      const firstError = Object.keys(errors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setSubmitting(true);
      const appointmentData = {
        ...formData,
        uid: user.uid,
        latitude: coords.lat || null,
        longitude: coords.lng || null,
        estimatedCost: estimatedCost || 0,
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
        status: APPOINTMENT_STATUS.BOOKED,
      };

      await createAppointment(appointmentData);
      toast.success("Service Appointment Scheduled Successfully!");
      navigate("/account");
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <PageHeader title="Service Appointment" />

      <section className="py-16">
        <PageContainer>
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:p-8"
          >
            {/* ===== ROW 1 ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              {/* CUSTOMER */}
              <div className="space-y-4">
                <SectionTitle icon="🧾" title="Customer Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" name="name" required placeholder="Enter your full name" value={formData.name} onChange={handleChange} error={errors.name} />
                  <Input label="Mobile Number" name="phone" required placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} error={errors.phone} />
                  <Input label="Email Address" name="email" placeholder="example@email.com" value={formData.email} onChange={handleChange} />
                  <Input label="City" name="city" placeholder="Enter your city" value={formData.city} onChange={handleChange} />

                  <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <Input
                      label="Address"
                      name="address"
                      required
                      placeholder="Enter complete address"
                      value={formData.address}
                      onChange={handleChange}
                      error={errors.address}
                    />

                    <Input
                      label="Pincode"
                      name="pincode"
                      placeholder="635802"
                      value={formData.pincode}
                      onChange={handleChange}
                    />

                  </div>
                </div>
              </div>

              {/* VEHICLE */}
              <div className="space-y-4">
                <SectionTitle icon="🚘" title="Vehicle Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Vehicle Type"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    required
                    options={[
                      { value: "Car", label: "Car" },
                      { value: "Bike", label: "Bike" },
                      { value: "SUV", label: "SUV" },
                    ]}
                  />

                  <Input label="Brand" name="brand" placeholder="Toyota, Hyundai..." value={formData.brand} onChange={handleChange} />
                  <Input label="Model" name="model" placeholder="i20, Innova..." value={formData.model} onChange={handleChange} />

                  <Input label="Registration Number" name="registrationNumber" required placeholder="TN 01 AB 1234" value={formData.registrationNumber} onChange={handleChange} error={errors.registrationNumber} />

                  {/* <Select label="Fuel Type" name="fuelType" value={formData.fuelType} onChange={handleChange}>
                    <option value="" disabled className="text-gray-400">Select Fuel Type</option>
                    <option value="Petrol" className="bg-[#0a0a0b]">Petrol</option>
                    <option value="Diesel" className="bg-[#0a0a0b]">Diesel</option>
                    <option value="EV" className="bg-[#0a0a0b]">EV</option>
                    <option value="Hybrid" className="bg-[#0a0a0b]">Hybrid</option>
                  </Select>

                  <Input label="Year of Manufacture" name="yearOfManufacture" placeholder="2023" type="number" value={formData.yearOfManufacture} onChange={handleChange} />
                  <Input label="Current Mileage" name="currentMileage" placeholder="500 km" type="number" value={formData.currentMileage} onChange={handleChange} /> */}
                </div>
              </div>
            </div>

            {/* ===== ROW 2 ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

              {/* SERVICE */}
              <div className="space-y-4">
                <SectionTitle icon="🛠️" title="Service Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Service Type"
                    name="serviceType"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={formData.serviceType}
                    onChange={handleChange}
                    required
                    error={errors.serviceType}
                    options={Object.keys(SERVICE_PRICES).map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />

                  <CustomSelect
                    label="Pickup & Drop"
                    name="pickupDrop"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={formData.pickupDrop}
                    onChange={handleChange}
                    options={[
                      { value: "No", label: "No" },
                      { value: "Yes", label: "Yes (+ ₹300)" },
                    ]}
                  />

                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-sm text-gray-300">Describe Problem</label>
                    <textarea
                      name="otherIssue"
                      value={formData.otherIssue}
                      onChange={handleChange}
                      placeholder="Explain your issue clearly..."
                      className="w-full rounded-xl bg-[#0a0a0b] border border-white/10 px-4 py-3 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* APPOINTMENT */}
              <div className="space-y-4">
                <SectionTitle icon="📅" title="Appointment Scheduling" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Preferred Date"
                    name="preferredDate"
                    min={new Date().toISOString().split("T")[0]} 
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={handleChange}
                    error={errors.preferredDate}
                  />

                  <CustomSelect
                    label="Time Slot"
                    name="preferredTimeSlot"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={formData.preferredTimeSlot}
                    onChange={handleChange}
                    required
                    options={[
                      { value: "Morning (9AM–12PM)", label: "Morning (9AM–12PM)" },
                      { value: "Afternoon (12PM–4PM)", label: "Afternoon (12PM–4PM)" },
                      { value: "Evening (4PM–7PM)", label: "Evening (4PM–7PM)" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 accent-sky-500 transition-all cursor-pointer"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                  I agree to the <span className="text-sky-400 hover:underline">Terms & Conditions</span> for service booking.
                </span>
                {errors.termsAccepted && <p className="text-xs text-red-400">{errors.termsAccepted}</p>}
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-12 py-4 rounded-full font-black text-white bg-gradient-to-r from-sky-600 to-cyan-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {submitting ? "Processing..." : "Schedule Appointment →"}
              </button>
            </div>
          </form>
        </PageContainer>
      </section>
    </div>
  );
};

export default BookAppointment;
