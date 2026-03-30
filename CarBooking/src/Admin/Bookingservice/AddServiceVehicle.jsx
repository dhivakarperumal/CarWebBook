import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

const VEHICLE_TYPES = ["Two Wheeler", "Four Wheeler", "Three Wheeler", "Heavy Vehicle"];

const ISSUE_OPTIONS = [
  "Engine Problem",
  "Brake Issue",
  "Tyre / Wheel",
  "Electrical Problem",
  "AC Not Working",
  "Battery Issue",
  "Oil Leak",
  "Suspension / Steering",
  "Others",
];

const baseInput =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 placeholder:text-gray-400";

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block mb-1.5 text-sm font-medium text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const AddServiceVehicle = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    vehicleType: "",
    vehicleNumber: "",
    brand: "",
    model: "",
    issue: "",
    otherIssue: "",
  });

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Customer name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (form.phone && !/^\d{6,15}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid phone number";
    if (!form.email.trim()) errs.email = "Email is required for creating customer login";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address";
    if (!form.vehicleType) errs.vehicleType = "Vehicle type is required";
    if (!form.vehicleNumber.trim()) errs.vehicleNumber = "Vehicle number is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const now = new Date();
    const serviceData = {
      bookingId: `BKG${now.getTime()}`, // Generate unique ID
      uid: "admin-created",
      name: form.name,
      phone: form.phone,
      email: form.email || "N/A",
      address: form.address || "Shop Address",
      location: "Shop",
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      brand: form.brand || "Unknown",
      model: form.model || "Unknown",
      issue: form.issue === "Others" ? form.otherIssue : form.issue || "General Service",
      status: "Booked",
      createdDate: now.toLocaleDateString("en-GB"),
      createdTime: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      setSubmitting(true);
      
      // 1. Create Booking
      const bookRes = await api.post("/bookings/create", serviceData);
      const bookingId = serviceData.bookingId;

      // 2. Automatically Create User Account (ignore error if already exists)
      if (form.email && form.phone) {
        try {
          await api.post("/auth/register", {
            username: form.name,
            email: form.email,
            mobile: form.phone,
            password: form.phone, // Phone number is password
            role: "customer"
          });
          toast.success("Customer account created automatically");
        } catch (authErr) {
          // If email exists, we just skip account creation
          console.log("Account already exists or failed to create", authErr);
        }
      }

      setSuccess(bookingId);
      toast.success(`Service added! ID: ${bookingId}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add service vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== SUCCESS STATE ===== */
  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Service Vehicle Added!</h2>
          <p className="text-gray-500 text-sm mb-1">Booking ID</p>
          <span className="text-2xl font-extrabold text-sky-600">{success}</span>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => { setSuccess(null); setForm({ name: "", phone: "", email: "", address: "", vehicleType: "", vehicleNumber: "", brand: "", model: "", issue: "", otherIssue: "" }); }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-black to-cyan-400 text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Add Another
          </button>
          <button
            onClick={() => navigate("/admin/bookings")}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
          >
            View All Bookings
          </button>
        </div>
      </div>
    );
  }

  /* ===== FORM ===== */
  return (
    <div className="max-w-4xl mx-auto p-4 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-black to-cyan-400 flex items-center justify-center shadow">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">Add Service Vehicle</h1>
            <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line">Register a new vehicle for service (Auto-creates login using Email & Phone)</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CUSTOMER DETAILS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">1</span>
            Customer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Customer Name" required error={errors.name}>
              <input
                className={baseInput}
                placeholder="e.g. Rajan Kumar"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone}>
              <input
                className={baseInput}
                placeholder="e.g. 9876543210"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Field>

            <Field label="Customer Email (User Login)" required error={errors.email}>
              <input
                className={baseInput}
                placeholder="customer@email.com"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Field>

            <Field label="Service Address">
              <input
                className={baseInput}
                placeholder="House / Street / Area"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">2</span>
            Vehicle Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Vehicle Type" required error={errors.vehicleType}>
              <select
                className={baseInput}
                value={form.vehicleType}
                onChange={(e) => handleChange("vehicleType", e.target.value)}
              >
                <option value="">Select Vehicle Type</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Vehicle Number" required error={errors.vehicleNumber}>
              <input
                className={`${baseInput} uppercase`}
                placeholder="e.g. TN01AB1234"
                value={form.vehicleNumber}
                onChange={(e) => handleChange("vehicleNumber", e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="Brand">
              <input
                className={baseInput}
                placeholder="e.g. Honda, Hyundai, BMW"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </Field>

            <Field label="Model">
              <input
                className={baseInput}
                placeholder="e.g. City, Creta, 3 Series"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ISSUE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">3</span>
            Issue / Complaint
          </h3>
          <div className="space-y-4">
            <Field label="Select Issue">
              <select
                className={baseInput}
                value={form.issue}
                onChange={(e) => handleChange("issue", e.target.value)}
              >
                <option value="">Select Issue</option>
                {ISSUE_OPTIONS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </Field>

            {form.issue === "Others" && (
              <Field label="Describe the Issue">
                <textarea
                  className={`${baseInput} resize-none`}
                  rows={3}
                  placeholder="Describe the problem in detail..."
                  value={form.otherIssue}
                  onChange={(e) => handleChange("otherIssue", e.target.value)}
                />
              </Field>
            )}
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-black to-cyan-400 text-white font-semibold text-sm shadow-md hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding Service..." : "🚗 Add Service Vehicle"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="sm:w-36 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddServiceVehicle;
