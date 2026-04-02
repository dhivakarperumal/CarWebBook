import React, { useState, useEffect, useRef, forwardRef } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import { createAppointment } from "../../api";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaCar, FaUser, FaPhone, FaMapMarkerAlt, FaToolbox, FaClock, FaArrowLeft } from "react-icons/fa";

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

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-6 mt-8">
    <span className="text-xl text-sky-600">{icon}</span>
    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">{title}</h3>
    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-4"></div>
  </div>
);

const Input = forwardRef(({ label, required, error, icon, ...props }, ref) => (
  <div className="space-y-1.5 text-left">
    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl bg-gray-50 border px-4 py-3 text-gray-900 transition-all duration-300
        placeholder:text-gray-400 focus:outline-none focus:bg-white
        ${icon ? "pl-11" : ""}
        ${error ? "border-red-500 focus:ring-4 focus:ring-red-500/10" : "border-gray-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"}`}
      />
    </div>
    {error && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{error}</p>}
  </div>
));

const Select = forwardRef(({ label, required, error, children, icon, ...props }, ref) => (
  <div className="space-y-1.5 text-left">
    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
          {icon}
        </span>
      )}
      <select
        ref={ref}
        {...props}
        className={`w-full rounded-xl bg-gray-50 border px-4 py-3 text-gray-900 transition-all duration-300
        appearance-none focus:outline-none focus:bg-white
        ${icon ? "pl-11" : ""}
        ${error ? "border-red-500 focus:ring-4 focus:ring-red-500/10" : "border-gray-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"}`}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {error && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{error}</p>}
  </div>
));

const AdminAddAppointment = () => {
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
    serviceType: "General Service",
    otherIssue: "",
    pickupDrop: "No",
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTimeSlot: "Morning (9AM–12PM)",
    serviceMode: "At Service Center",
    pickupAddress: "",
    location: "",
    paymentMode: "Pay After Service",
    couponCode: "",
    notes: "",
    emergencyService: false,
    termsAccepted: true,
    uid: "admin-created",
    status: "Appointment Booked"
  });

  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.phone) newErrors.phone = "Mobile number is required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    if (!formData.serviceType) newErrors.serviceType = "Please select a service type";
    if (!formData.preferredDate) newErrors.preferredDate = "Please select a date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setSubmitting(true);
      const appointmentData = {
        ...formData,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        estimatedCost: estimatedCost || 0,
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
      };

      await createAppointment(appointmentData);
      toast.success("Appointment Created Successfully!");
      navigate("/admin/appointments");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/admin/appointments")}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Appointment</h2>
                <p className="text-sm text-gray-500 font-medium">Add a new service appointment for a customer.</p>
              </div>
           </div>
           
           <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 py-3 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none">Estimated Cost</p>
                <p className="text-2xl font-black text-sky-900 mt-1">₹{estimatedCost}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <FaToolbox />
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: CUSTOMER & VEHICLE */}
            <div className="lg:col-span-2 space-y-8">
              {/* CUSTOMER SECTION */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <SectionTitle icon={<FaUser />} title="Customer Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} error={errors.name} icon={<FaUser className="text-gray-400" />} />
                  <Input label="Mobile Number" name="phone" required value={formData.phone} onChange={handleChange} error={errors.phone} icon={<FaPhone className="text-gray-400" />} />
                  <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} icon={<FaArrowLeft className="text-gray-400 rotate-180" />} />
                  <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                  <div className="md:col-span-2">
                    <Input label="Address" name="address" value={formData.address} onChange={handleChange} icon={<FaMapMarkerAlt className="text-gray-400" />} />
                  </div>
                </div>
              </div>

              {/* VEHICLE SECTION */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <SectionTitle icon={<FaCar />} title="Vehicle Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select label="Vehicle Type" name="vehicleType" value={formData.vehicleType} onChange={handleChange} icon={<FaCar className="text-gray-400" />}>
                    <option>Car</option>
                    <option>Bike</option>
                    <option>SUV</option>
                  </Select>
                  <Input label="Registration Number" name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} error={errors.registrationNumber} placeholder="MH 12 AB 1234" />
                  <Input label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
                  <Input label="Model" name="model" value={formData.model} onChange={handleChange} />
                  <Select label="Fuel Type" name="fuelType" value={formData.fuelType} onChange={handleChange}>
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>EV</option>
                    <option>Hybrid</option>
                  </Select>
                  <Input label="Current Mileage" name="currentMileage" type="number" value={formData.currentMileage} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SERVICE & DATETIME */}
            <div className="space-y-8">
              {/* SERVICE SECTION */}
              <div className="bg-[#87a5b3] rounded-[2.5rem] p-8 shadow-sm border border-sky-400/20 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <FaToolbox className="text-white text-xl" />
                  <h3 className="text-lg font-black uppercase tracking-wider">Service Spec</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-sky-100 uppercase tracking-widest ml-1">Service Type</label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none focus:bg-white/20 transition-all font-bold"
                    >
                      {Object.keys(SERVICE_PRICES).map(type => (
                        <option key={type} className="text-gray-900">{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-sky-100 uppercase tracking-widest ml-1">Pickup & Drop</label>
                    <select
                      name="pickupDrop"
                      value={formData.pickupDrop}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none focus:bg-white/20 transition-all font-bold"
                    >
                      <option className="text-gray-900">No</option>
                      <option className="text-gray-900">Yes (+ ₹300)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                     <input 
                      type="checkbox" 
                      id="emergency" 
                      name="emergencyService" 
                      checked={formData.emergencyService} 
                      onChange={handleChange} 
                      className="w-5 h-5 accent-sky-500"
                     />
                     <label htmlFor="emergency" className="text-sm font-black uppercase tracking-tight cursor-pointer">Emergency Service (+₹500)</label>
                  </div>
                </div>
              </div>

              {/* SCHEDULE SECTION */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <SectionTitle icon={<FaCalendarAlt />} title="Scheduling" />
                <div className="space-y-6">
                  <Input label="Preferred Date" name="preferredDate" type="date" required value={formData.preferredDate} onChange={handleChange} error={errors.preferredDate} icon={<FaCalendarAlt className="text-gray-400" />} />
                  <Select label="Time Slot" name="preferredTimeSlot" value={formData.preferredTimeSlot} onChange={handleChange} icon={<FaClock className="text-gray-400" />}>
                     <option>Morning (9AM–12PM)</option>
                     <option>Afternoon (12PM–4PM)</option>
                     <option>Evening (4PM–7PM)</option>
                  </Select>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Issue Description</label>
                    <textarea 
                      name="otherIssue"
                      value={formData.otherIssue}
                      onChange={handleChange}
                      placeholder="Describe specific problems..."
                      className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-bold text-gray-900 min-h-[120px] focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-gray-800 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm"
              >
                {submitting ? "Processing..." : "Create Appointment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddAppointment;
