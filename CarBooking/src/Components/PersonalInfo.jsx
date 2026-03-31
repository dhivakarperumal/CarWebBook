import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";

const PersonalInfo = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser?.uid) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/auth/profile/${storedUser.uid}`);
        setName(res.data.username || "");
        setMobile(res.data.mobile || "");
        setEmail(res.data.email || "");
      } catch (err) {
        toast.error("Failed to load profile");
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!mobile.trim()) return toast.error("Mobile number is required");
    if (mobile.length !== 10) return toast.error("Enter valid 10 digit mobile number");

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser?.uid) return toast.error("User not logged in");

    try {
      setLoading(true);
      await api.put(`/auth/profile/${storedUser.uid}`, {
        username: name,
        mobile,
      });

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-sky-400">
        Personal Information
      </h2>

      <div className="space-y-4">

        {/* NAME (EDITABLE) */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full p-3 rounded-lg bg-black text-white
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
        />

        {/* MOBILE (EDITABLE) */}
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          maxLength={10}
          placeholder="Mobile Number"
          className="w-full p-3 rounded-lg bg-black text-white
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
        />

        {/* EMAIL (READ ONLY) */}
        <input
          value={email}
          disabled
          placeholder="Email Address"
          className="w-full p-3 rounded-lg bg-slate-800
                     border border-slate-700 text-slate-400
                     cursor-not-allowed"
        />

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-lg font-semibold
                     bg-sky-500 text-black
                     hover:bg-sky-400 transition
                     disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Changes"}
        </button>
      </div>
    </div>
  );
};

export default PersonalInfo;