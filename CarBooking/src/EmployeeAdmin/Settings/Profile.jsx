import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaUserShield,
  FaCalendarAlt,
  FaSave,
  FaArrowLeft
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EmpProfileSettings = () => {
  const { profileName: userProfile } = useAuth();
  const uid = userProfile?.uid;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    mobile: "",
    email: "",
    role: "",
    active: false,
    created_at: null,
  });

  useEffect(() => {
    if (!uid) return;

    const loadProfile = async () => {
      try {
        const res = await api.get(`/auth/profile/${uid}`);
        setForm(res.data);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/auth/profile/${uid}`, {
        username: form.username,
        mobile: form.mobile,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-black/5 max-w-xl mx-auto animate-pulse border border-gray-100 mt-10">
        <div className="h-10 bg-gray-100 rounded-2xl w-1/3 mb-10" />
        <div className="space-y-6">
          <div className="h-14 bg-gray-50 rounded-2xl w-full" />
          <div className="h-14 bg-gray-50 rounded-2xl w-full" />
          <div className="h-14 bg-gray-50 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn mt-6">
      {/* 🔙 BACK ACTION */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-black text-white font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
      </div>

      {/* 👤 MAIN FORM CARD */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100 overflow-hidden">
        {/* 🎨 HEADER SECTION */}
        <div className="bg-gradient-to-br from-black to-gray-800 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-3xl font-black shadow-2xl">
              {form.username?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">{form.username}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-500/30 flex items-center gap-2">
                  <FaUserShield size={12} /> {form.role}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                  form.active
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                    : "bg-red-500/20 text-red-200 border-red-500/30"
                }`}>
                  {form.active ? "Account Active" : "Account Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 FORM FIELDS */}
        <div className="p-10 space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Workforce Name</label>
            <div className="relative group">
              <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-bold text-gray-800 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                placeholder="Enter workforce name"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
            <div className="relative group">
              <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 font-bold text-gray-800 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                placeholder="Enter contact number"
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={form.email}
                disabled
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-dashed border-gray-200 bg-gray-100 font-bold text-gray-400 cursor-not-allowed italic"
              />
            </div>
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Staff Joined Since</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                disabled
                value={form.created_at ? new Date(form.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-dashed border-gray-200 bg-gray-100 font-bold text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* 🚀 SAVE ACTION */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full group flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all shadow-2xl
                ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black hover:bg-gray-800 shadow-black/20 active:scale-[0.98]"
                }`}
            >
              <FaSave className={`${saving ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} />
              {saving ? "Synchronizing Changes..." : "Push Profile Updates"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpProfileSettings;
