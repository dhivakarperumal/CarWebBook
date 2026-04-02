import React, { useState, useEffect, useRef, forwardRef } from "react";
import PageContainer from "./PageContainer";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { createAppointment } from "../api";
import toast from "react-hot-toast";

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

const Select = forwardRef(({ label, required, error, children, icon, ...props }, ref) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-300 ml-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-400 transition-colors pointer-events-none">
          {icon}
        </span>
      )}
      <select
        ref={ref}
        {...props}
        style={{ colorScheme: 'dark' }}
        className={`w-full rounded-xl bg-white/5 border px-4 py-3 text-white transition-all duration-300
        appearance-none focus:outline-none focus:bg-white/10 bg-[#0a0a0b]
        ${icon ? "pl-11" : ""}
        ${error ? "border-red-500/50 ring-1 ring-red-500/20" : "border-white/10 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"}`}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {error && <p className="text-xs text-red-400 ml-1 mt-1">{error}</p>}
  </div>
));

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

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

      <section className="py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <PageContainer>
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
          >
            {/* HEADER */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Book Appointment
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Professional mechanic support
              </p>
            </div>

            {/* ===== ROW 1 ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CUSTOMER */}
              <div className="space-y-4">
                <SectionTitle icon="🧾" title="Customer Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} error={errors.name} />
                  <Input label="Mobile Number" name="phone" required value={formData.phone} onChange={handleChange} error={errors.phone} />
                  <Input label="Email Address" name="email" value={formData.email} onChange={handleChange} />
                  <Input label="City" name="city" value={formData.city} onChange={handleChange} />

                  <div className="col-span-1 sm:col-span-2">
                    <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
                  </div>

                  <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                </div>
              </div>

              {/* VEHICLE */}
              <div className="space-y-4">
                <SectionTitle icon="🚘" title="Vehicle Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                    <option className="bg-[#0a0a0b] text-white">Car</option>
                    <option className="bg-[#0a0a0b] text-white">Bike</option>
                    <option className="bg-[#0a0a0b] text-white">SUV</option>
                  </Select>

                  <Input label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
                  <Input label="Model" name="model" value={formData.model} onChange={handleChange} />

                  <Input
                    label="Registration Number"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    error={errors.registrationNumber}
                  />

                  <Select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                    <option className="bg-[#0a0a0b] text-white">Petrol</option>
                    <option className="bg-[#0a0a0b] text-white">Diesel</option>
                    <option className="bg-[#0a0a0b] text-white">EV</option>
                    <option className="bg-[#0a0a0b] text-white">Hybrid</option>
                  </Select>

                  <Input name="yearOfManufacture" type="number" value={formData.yearOfManufacture} onChange={handleChange} />
                  <Input name="currentMileage" type="number" value={formData.currentMileage} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* ===== ROW 2 ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

              {/* SERVICE */}
              <div className="space-y-4">
                <SectionTitle icon="🛠️" title="Service Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select name="serviceType" value={formData.serviceType} onChange={handleChange}>
                    <option value="">Select Service</option>
                    {Object.keys(SERVICE_PRICES).map((type) => (
                      <option key={type} className="bg-[#0a0a0b] text-white">
                        {type}
                      </option>
                    ))}
                  </Select>

                  <Select name="pickupDrop" value={formData.pickupDrop} onChange={handleChange}>
                    <option className="bg-[#0a0a0b] text-white">No</option>
                    <option className="bg-[#0a0a0b] text-white">Yes (+ ₹300)</option>
                  </Select>

                  <div className="col-span-1 sm:col-span-2">
                    <textarea
                      name="otherIssue"
                      value={formData.otherIssue}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-[#0a0a0b] border border-white/10 px-4 py-3 text-white"
                      placeholder="Describe issue..."
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
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={handleChange}
                    error={errors.preferredDate}
                  />

                  <Select name="preferredTimeSlot" value={formData.preferredTimeSlot} onChange={handleChange}>
                    <option className="bg-[#0a0a0b] text-white">Morning</option>
                    <option className="bg-[#0a0a0b] text-white">Afternoon</option>
                    <option className="bg-[#0a0a0b] text-white">Evening</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* BUTTON */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 font-bold hover:scale-105 transition"
              >
                {submitting ? "Scheduling..." : "Schedule Appointment →"}
              </button>
            </div>
          </form>
        </PageContainer>
      </section>
    </div>
  );
};

export default BookAppointment;
