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

const ProfileSettings = () => {
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
      <div className="bg-white rounded-2xl p-6 shadow max-w-xl animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  return (
    <>
    
    <div className="flex items-center gap-4">
                      <button
                          onClick={() => navigate(-1)}
                          className="text-white bg-black rounded-full px-3 py-2 hover:underline flex items-center gap-1"
                      >
                          <FaArrowLeft /> Back
                      </button>
      
                  </div>
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg mt-6 p-6">


      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
          {form.username?.charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{form.username}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <FaUserShield /> {form.role}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                form.active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {form.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Username</label>
        <div className="relative">
          <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="border rounded-xl pl-11 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mobile */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Mobile</label>
        <div className="relative">
          <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="border rounded-xl pl-11 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Email (Read Only) */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Email</label>
        <div className="relative">
          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={form.email}
            disabled
            className="border rounded-xl pl-11 pr-4 py-3 w-full bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Created At */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-1 block">Account Created</label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            disabled
            value={
              form.created_at ? new Date(form.created_at).toLocaleString() : ""
            }
            className="border rounded-xl pl-11 pr-4 py-3 w-full bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium
          ${
            saving
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-black hover:bg-orange-500"
          }`}
      >
        <FaSave />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
    </>
  );
};

export default ProfileSettings;
