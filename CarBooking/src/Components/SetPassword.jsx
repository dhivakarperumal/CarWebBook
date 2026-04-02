import React, { useContext, useState } from "react";
import { AuthContext } from "../PrivateRouter/AuthContext";
import api from "../api";
import toast from "react-hot-toast";
import { FiLock, FiKey, FiLoader } from "react-icons/fi";

const SetPassword = () => {
  const { user } = useContext(AuthContext);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!currentPwd.trim()) {
      toast.error("Enter current password");
      return;
    }

    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/auth/profile/${user?.uid}/password`, {
        currentPassword: currentPwd,
        newPassword: newPwd
      });

      toast.success("Password updated successfully");

      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <FiLock className="text-sky-400" />
        Set / Change Password
      </h2>

      <div className="space-y-4">
        <input
          type="password"
          placeholder="Current Password"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          className="w-full border border-sky-400/30 bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          className="w-full border border-sky-400/30 bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          className="w-full border border-sky-400/30 bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <button
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <FiKey />
              Update Password
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SetPassword;