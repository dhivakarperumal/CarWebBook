import React, { useState, useRef, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageHeader from "./PageHeader";
import PageContainer from "./PageContainer";
import api from "../api";
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

const baseClass =
  "w-full bg-white/10 rounded-xl border px-5 py-3 text-white shadow-sm outline-none transition focus:ring-2 focus:ring-sky-400 border-white/20 placeholder:text-gray-500";

const errorClass = "border-red-400";
const normalClass = "border-white/20";

export const Input = forwardRef(({ label, required, error, ...props }, ref) => (
  <div>
    <label className="block mb-2 text-sm text-gray-300 font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>

    <input
      ref={ref}
      {...props}
      className={`${baseClass} ${error ? errorClass : normalClass}`}
    />

    <p className="mt-1 h-4 text-xs text-red-500">{error || ""}</p>
  </div>
));

export const Textarea = forwardRef(
  ({ label, required, error, ...props }, ref) => (
    <div>
      <label className="block mb-2 text-sm text-gray-300 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        ref={ref}
        {...props}
        className={`${baseClass} ${error ? errorClass : normalClass}`}
      />

      <p className="mt-1 h-4 text-xs text-red-500">{error || ""}</p>
    </div>
  ),
);

export const Select = forwardRef(
  ({ label, required, error, children, ...props }, ref) => (
    <div>
      <label className="block mb-2 text-sm text-gray-300 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        ref={ref}
        {...props}
        style={{ colorScheme: 'dark' }}
        className={`${baseClass} ${error ? errorClass : normalClass} bg-[#0a0a0b] text-white`}
      >
        {children}
      </select>

      <p className="mt-1 h-4 text-xs text-red-500">{error || ""}</p>
    </div>
  ),
);

const BookService = () => {
  const [vehicleType, setVehicleType] = useState("car");
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

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || "",
        email: currentUser.email || "",
      }));
    }
  }, [currentUser]);

  const searchTimeoutRef = useRef(null);
  const searchLocation = async (query) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query || query.length < 3) {
      setLocationResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`,
        );
        if (res.status === 429) {
          toast.error("Search is busy. Please type slower.");
          return;
        }
        const data = await res.json();
        setLocationResults(data);
      } catch (error) {
        console.error("Search failed");
      }
    }, 600); // 600ms debounce
  };

  const handleSelectLocation = (place) => {
    setFormData((prev) => ({
      ...prev,
      location: place.display_name,
    }));
    setLocationQuery(place.display_name);
    setCoords({ lat: place.lat, lng: place.lon });
    setLocationResults([]);
  };

  const [locationLoading, setLocationLoading] = useState(false);
  const [isChennai, setIsChennai] = useState(true);
  const [errors, setErrors] = useState({});

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
              ? "Location service is busy. Please wait 2nd and try." 
              : `Service error: ${res.status}`;
            toast.error(errorMsg);
            setTimeout(() => setLocationLoading(false), 2000);
            return;
          }
          const data = await res.json();
          setFormData((prev) => ({ ...prev, location: data.display_name }));
          setLocationQuery(data.display_name);
          setCoords({ lat: latitude, lng: longitude });
        } catch (err) {
          toast.error(`Fetch error: ${err.message}`);
        } finally {
          setTimeout(() => setLocationLoading(false), 2000);
        }
      },
      (error) => {
        toast.error("Location permission denied");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please login to book a service");
      navigate("/login");
      return;
    }

    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.issue) newErrors.issue = "Issue is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.address) newErrors.address = "Address is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      const bookingId = `BS${Math.floor(100000 + Math.random() * 900000)}`;
      const bookingData = {
        ...formData,
        bookingId,
        uid: currentUser.uid,
        vehicleType,
        latitude: coords.lat,
        longitude: coords.lng,
        status: BOOKING_STATUS.BOOKED,
      };

      await api.post("/bookings/create", bookingData);
      toast.success("Booking successful!");
      navigate("/account");
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader title="Quick Service Booking" />
      <PageContainer>
        <section className="py-12 max-w-4xl mx-auto">
          <form className="rounded-3xl border border-sky-500/20 bg-white/5 backdrop-blur-xl p-8 md:p-12 space-y-6">
            <h2 className="text-3xl font-black text-sky-400 mb-8">Service Booking</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Full Name" name="name" placeholder="John Doe" required error={errors.name} value={formData.name} onChange={handleChange} />
              <Input label="Email Address" name="email" placeholder="john@example.com" disabled value={formData.email} onChange={handleChange} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Phone Number" name="phone" placeholder="+91 00000 00000" required error={errors.phone} onChange={handleChange} />
              <Input label="Alternative Phone" name="altPhone" placeholder="Optional" onChange={handleChange} />
            </div>

            <div className="flex gap-6 py-4 border-y border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="car" checked={vehicleType === "car"} onChange={() => setVehicleType("car")} className="accent-sky-400 w-5 h-5" />
                <span className="font-bold">Car</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="bike" checked={vehicleType === "bike"} onChange={() => setVehicleType("bike")} className="accent-sky-400 w-5 h-5" />
                <span className="font-bold">Bike</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Select label="Brand" name="brand" required error={errors.brand} onChange={handleChange}>
                <option className="bg-[#0a0a0b]" value="">Select Brand</option>
                {vehicleType === "car" ? ["Honda", "Hyundai", "BMW", "Audi"].map(b => <option className="bg-[#0a0a0b]" key={b}>{b}</option>) : ["Yamaha", "Royal Enfield", "Bajaj"].map(b => <option className="bg-[#0a0a0b]" key={b}>{b}</option>)}
              </Select>
              <Input label="Model" name="model" placeholder="Model Name" required error={errors.model} onChange={handleChange} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Select label="Issue" name="issue" required error={errors.issue} onChange={handleChange}>
                <option className="bg-[#0a0a0b]" value="">Select Issue</option>
                {["Engine Problem", "Brake Issue", "Electrical", "Others"].map(i => <option className="bg-[#0a0a0b]" key={i}>{i}</option>)}
              </Select>
              <Input label="Vehicle Number" name="vehicleNumber" placeholder="TN 01 AB 1234" onChange={handleChange} />
            </div>

            {formData.issue === "Others" && <Input label="Describe Issue" name="otherIssue" onChange={handleChange} />}

            <div className="space-y-4">
              <label className="block text-sm text-gray-300 font-medium ml-1">Search Location *</label>
              <input type="text" value={locationQuery} placeholder="Search area..." onChange={(e) => { setLocationQuery(e.target.value); searchLocation(e.target.value); }} className="w-full bg-white/10 rounded-xl border border-white/20 px-5 py-3 text-white focus:ring-2 focus:ring-sky-400 outline-none" />
              {locationResults.length > 0 && (
                <div className="mt-2 rounded-xl bg-black border border-white/20 max-h-56 overflow-y-auto">
                  {locationResults.map(p => <div key={p.place_id} onClick={() => handleSelectLocation(p)} className="px-4 py-3 cursor-pointer text-sm hover:bg-white/10">{p.display_name}</div>)}
                </div>
              )}
              <button type="button" onClick={handleUseCurrentLocation} className="px-6 py-2 rounded-lg bg-sky-500 font-bold hover:bg-sky-600 transition tracking-wide text-xs">USE CURRENT LOCATION</button>
            </div>

            <Textarea label="Service Address" name="address" required error={errors.address} onChange={handleChange} />

            <div className="flex justify-end pt-8">
              <button onClick={handleSubmit} disabled={submitting} className="w-full md:w-auto px-12 py-4 rounded-full font-black text-white bg-gradient-to-r from-blue-600 to-cyan-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all">
                {submitting ? "BOOKING..." : "BOOK SERVICE →"}
              </button>
            </div>
          </form>
        </section>
      </PageContainer>
    </div>
  );
};

export default BookService;
