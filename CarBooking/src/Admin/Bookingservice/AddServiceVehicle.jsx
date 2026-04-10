import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

const VEHICLE_TYPES = ["Car", "Bike"];

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
  "w-full bg-white rounded-lg border px-5 py-3 text-gray-900 shadow-sm outline-none transition focus:ring-2 focus:ring-black";

const errorClass = "border-red-400";
const normalClass = "border-gray-300";

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block mb-2 text-sm text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    <p className="mt-1 h-4 text-xs text-red-500">{error || ""}</p>
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
    vehicleType: "Car",
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
      const bookingId = bookRes.data.bookingId;

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

  /* ===== SUCCESS STATE (Moved to popup below) ===== */

  /* ===== FORM ===== */
  return (
    <section className="relative py-4 text-gray-800 overflow-hidden">
      {/* Header */}
      <div className="relative max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Add Service Vehicle</h1>
            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">Register a new vehicle for service (Auto-creates login using Email & Phone)</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Form Card */}
        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-300 bg-white/5 backdrop-blur-xl p-10 space-y-2">
        {/* CUSTOMER DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Customer Name" required error={errors.name}>
              <input
                className={`${baseInput} ${errors.name ? errorClass : normalClass}`}
                placeholder="e.g. Rajan Kumar"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone}>
              <input
                className={`${baseInput} ${errors.phone ? errorClass : normalClass}`}
                placeholder="e.g. 9876543210"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Field>

            <Field label="Customer Email (User Login)" required error={errors.email}>
              <input
                className={`${baseInput} ${errors.email ? errorClass : normalClass}`}
                placeholder="customer@email.com"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Field>

            <Field label="Service Address">
              <input
                className={`${baseInput} ${errors.address ? errorClass : normalClass}`}
                placeholder="House / Street / Area"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </Field>
          </div>

          {/* VEHICLE DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Vehicle Type" required error={errors.vehicleType}>
              <select
                className={`${baseInput} ${errors.vehicleType ? errorClass : normalClass}`}
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
                className={`${baseInput} uppercase ${errors.vehicleNumber ? errorClass : normalClass}`}
                placeholder="e.g. TN01AB1234"
                value={form.vehicleNumber}
                onChange={(e) => handleChange("vehicleNumber", e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="Brand">
              <input
                className={`${baseInput} ${errors.brand ? errorClass : normalClass}`}
                placeholder="e.g. Honda, Hyundai, BMW"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </Field>

            <Field label="Model">
              <input
                className={`${baseInput} ${errors.model ? errorClass : normalClass}`}
                placeholder="e.g. City, Creta, 3 Series"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
              />
            </Field>
          </div>

          {/* ISSUE */}
          <div className="space-y-4">
            <Field label="Select Issue">
              <select
                className={`${baseInput} ${errors.issue ? errorClass : normalClass}`}
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
                  className={`${baseInput} resize-none ${errors.otherIssue ? errorClass : normalClass}`}
                  rows={3}
                  placeholder="Describe the problem in detail..."
                  value={form.otherIssue}
                  onChange={(e) => handleChange("otherIssue", e.target.value)}
                />
              </Field>
            )}
          </div>
        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-10 py-4 rounded-full font-semibold text-white
bg-gradient-to-r from-black to-cyan-400
hover:scale-105 transition-all duration-300
shadow-lg shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding Service..." : " Add Service Vehicle →"}
          </button>
        </div>
      </form>
    </div>

    {/* SUCCESS POPUP OVERLAY */}
    {success && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center transform transition-all scale-100">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-500 text-sm mb-1">Service Vehicle Added</p>
          <p className="text-gray-500 text-sm mb-4">
            Booking ID: <span className="text-lg font-extrabold text-sky-600 ml-1">{success}</span>
          </p>
          
          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              onClick={() => { setSuccess(null); setForm({ name: "", phone: "", email: "", address: "", vehicleType: "", vehicleNumber: "", brand: "", model: "", issue: "", otherIssue: "" }); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-black to-cyan-400 text-white font-semibold text-sm hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
            >
              Add Another
            </button>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              View All Bookings
            </button>
          </div>
        </div>
      </div>
    )}
  </section>
  );
};

export default AddServiceVehicle;
