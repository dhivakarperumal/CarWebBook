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
      
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative z-10 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl">
              
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">Book Appointment</h2>
                <p className="text-gray-400 mt-2">Professional mechanic support, now separate from your regular bookings.</p>
              </div>

              {/* 1. Customer Details */}
              <SectionTitle icon="🧾" title="1. Customer Details" />
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} error={errors.name} placeholder="John Doe" />
                <Input label="Mobile Number" name="phone" required value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="+91 98765 43210" />
                <Input label="Email Address" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Chennai" />
                <div className="md:col-span-2">
                  <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Your complete address" />
                </div>
                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" />
              </div>

              {/* 2. Vehicle Details */}
              <SectionTitle icon="🚘" title="2. Vehicle Details" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Select label="Vehicle Type" name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                  <option className="bg-[#0a0a0b]" value="Car">Car</option>
                  <option className="bg-[#0a0a0b]" value="Bike">Bike</option>
                  <option className="bg-[#0a0a0b]" value="SUV">SUV</option>
                </Select>
                <Input label="Brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="Toyota, Hyundai..." />
                <Input label="Model" name="model" value={formData.model} onChange={handleChange} placeholder="Innova, i20..." />
                <Input label="Registration Number" name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} error={errors.registrationNumber} placeholder="TN 01 AB 1234" />
                <Select label="Fuel Type" name="fuelType" value={formData.fuelType} onChange={handleChange}>
                  <option className="bg-[#0a0a0b]" value="Petrol">Petrol</option>
                  <option className="bg-[#0a0a0b]" value="Diesel">Diesel</option>
                  <option className="bg-[#0a0a0b]" value="EV">EV</option>
                  <option className="bg-[#0a0a0b]" value="Hybrid">Hybrid</option>
                </Select>
                <Input label="Year of Manufacture" name="yearOfManufacture" type="number" value={formData.yearOfManufacture} onChange={handleChange} placeholder="2024" />
                <Input label="Current Mileage (KM)" name="currentMileage" type="number" value={formData.currentMileage} onChange={handleChange} placeholder="50000" />
              </div>

              {/* 3. Service Details */}
              <SectionTitle icon="🛠️" title="3. Service Details" />
              <div className="grid md:grid-cols-2 gap-6">
                <Select label="Service Type" name="serviceType" required value={formData.serviceType} onChange={handleChange} error={errors.serviceType}>
                   <option className="bg-[#0a0a0b]" value="">Select Service</option>
                   {Object.keys(SERVICE_PRICES).map(type => (
                     <option className="bg-[#0a0a0b]" key={type} value={type}>{type}</option>
                   ))}
                </Select>
                <Select label="Pickup & Drop Required?" name="pickupDrop" value={formData.pickupDrop} onChange={handleChange}>
                  <option className="bg-[#0a0a0b]" value="No">No</option>
                  <option className="bg-[#0a0a0b]" value="Yes">Yes (+ ₹300)</option>
                </Select>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 ml-1 mb-2">Describe Problem</label>
                  <textarea 
                    name="otherIssue" 
                    value={formData.otherIssue} 
                    onChange={handleChange}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white transition-all duration-300 focus:outline-none focus:bg-white/10 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 min-h-[100px]"
                    placeholder="Describe any specific issues..."
                  />
                </div>
              </div>

              {/* 4. Appointment Scheduling */}
              <SectionTitle icon="📅" title="4. Appointment Scheduling" />
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Preferred Date" name="preferredDate" type="date" required value={formData.preferredDate} onChange={handleChange} error={errors.preferredDate} />
                <Select label="Preferred Time Slot" name="preferredTimeSlot" value={formData.preferredTimeSlot} onChange={handleChange}>
                   <option className="bg-[#0a0a0b]">Morning (9AM–12PM)</option>
                   <option className="bg-[#0a0a0b]">Afternoon (12PM–4PM)</option>
                   <option className="bg-[#0a0a0b]">Evening (4PM–7PM)</option>
                </Select>
              </div>

              {/* 5. Service Location */}
              <SectionTitle icon="📍" title="5. Service Location" />
              <div className="space-y-6">
                <div className="flex gap-4">
                  {["At Service Center", "Doorstep Service"].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, serviceMode: mode }))}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 font-medium ${
                        formData.serviceMode === mode 
                        ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                
                {formData.serviceMode === "Doorstep Service" && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <Input 
                      label="Pickup Address" 
                      name="pickupAddress" 
                      required 
                      value={formData.pickupAddress} 
                      onChange={handleChange} 
                      error={errors.pickupAddress}
                      placeholder="Specify the exact location for vehicle pickup"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 ml-1">Search & Confirm Location (Map Integrity)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        searchLocation(e.target.value);
                      }}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                      placeholder="Search for area on map..."
                    />
                    {locationResults.length > 0 && (
                      <div className="absolute w-full mt-2 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {locationResults.map(p => (
                           <div key={p.place_id} onClick={() => handleSelectLocation(p)} className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors">
                            {p.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="mt-3 px-6 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold hover:bg-sky-500/20 transition-all text-xs flex items-center gap-2"
                  >
                    {locationLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin"></span>
                        Fetching...
                      </>
                    ) : (
                      <>
                        <span className="text-sm">📍</span> Use Current Location
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 6. Payment Details */}
              <SectionTitle icon="💳" title="6. Payment Details" />
              <div className="grid md:grid-cols-2 gap-8 items-center bg-sky-500/5 rounded-2xl p-6 border border-sky-500/10">
                <Select label="Payment Mode" name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                  <option className="bg-[#0a0a0b]">Pay After Service</option>
                  <option className="bg-[#0a0a0b]">Online Payment</option>
                </Select>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Estimated Total Cost</p>
                  <p className="text-4xl font-black text-sky-400">
                    ₹{estimatedCost.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 italic">*Final cost may vary after inspection</p>
                </div>
              </div>

              {/* 7. Additional Options */}
              <SectionTitle icon="🔔" title="7. Additional Options" />
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Apply Coupon Code" name="couponCode" value={formData.couponCode} onChange={handleChange} placeholder="SAVE10, WELCOME..." />
                <Input label="Add Notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special instructions..." />
                <label className="flex items-center gap-3 p-4 bg-red-500/5 rounded-xl border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors md:col-span-2">
                  <input type="checkbox" name="emergencyService" checked={formData.emergencyService} onChange={handleChange} className="w-5 h-5 accent-red-500" />
                  <div>
                    <p className="text-red-400 font-bold text-sm">Emergency Service Required?</p>
                    <p className="text-red-400/60 text-xs">Priority support. Additional ₹500 applicable.</p>
                  </div>
                </label>
              </div>

              {/* 8. Confirmation */}
              <SectionTitle icon="✅" title="8. Confirmation" />
              <div className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1 w-5 h-5 accent-sky-500" />
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    I agree to the <span className="text-sky-400 underline underline-offset-4 decoration-sky-400/30">Terms & Conditions</span> and authorize the service center to perform the requested repairs.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white font-black text-lg shadow-[0_10px_40px_-10px_rgba(14,165,233,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(14,165,233,0.6)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:translate-y-0 uppercase tracking-widest"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Scheduling...
                    </span>
                  ) : (
                    "Schedule Appointment →"
                  )}
                </button>
              </div>

            </form>
          </div>
        </PageContainer>
      </section>
    </div>
  );
};

export default BookAppointment;
