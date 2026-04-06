import React, { useContext, useState } from "react";
import { AuthContext } from "../PrivateRouter/AuthContext";
import api from "../api";
import toast from "react-hot-toast";
import { FiLock, FiKey, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";

const SetPassword = () => {
  const { user } = useContext(AuthContext);

  // Detect Google user: they logged in via Google and have no password set
  const isGoogleUser = user?.uid && !user?.hasPassword;

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!isGoogleUser && !currentPwd.trim()) {
      toast.error("Enter your current password");
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

      const res = await api.put(`/auth/profile/${user?.uid}/password`, {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });

      toast.success(isGoogleUser ? "✅ Password set! You can now log in with email too." : "✅ Password updated successfully");

      // Update localStorage so UI reflects the change immediately
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, hasPassword: true }));

      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-sky-400/30 bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 pr-12";

  const PasswordField = ({ placeholder, value, onChange, show, onToggle }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
      >
        {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
        <FiLock className="text-sky-400" />
        {isGoogleUser ? "Set a Password" : "Change Password"}
      </h2>

      {isGoogleUser && (
        <p className="text-sm text-slate-400 mb-6 bg-slate-800 border border-sky-400/20 rounded-xl p-3">
          🔵 You signed in with Google. Set a password below to also be able to log in with your email.
        </p>
      )}

      <div className="space-y-4">
        {/* Current password — only shown for non-Google users */}
        {!isGoogleUser && (
          <PasswordField
            placeholder="Current Password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
        )}

        <PasswordField
          placeholder="New Password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />

        <PasswordField
          placeholder="Confirm New Password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />

        {/* Strength hint */}
        {newPwd.length > 0 && (
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-all ${
                  newPwd.length >= level * 3
                    ? level <= 1
                      ? "bg-red-500"
                      : level <= 2
                      ? "bg-yellow-500"
                      : level <= 3
                      ? "bg-blue-400"
                      : "bg-green-400"
                    : "bg-slate-700"
                }`}
              />
            ))}
            <span className="text-xs text-slate-400 ml-1">
              {newPwd.length < 4 ? "Weak" : newPwd.length < 7 ? "Fair" : newPwd.length < 10 ? "Good" : "Strong"}
            </span>
          </div>
        )}

        <button
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" />
              {isGoogleUser ? "Setting..." : "Updating..."}
            </>
          ) : (
            <>
              <FiKey />
              {isGoogleUser ? "Set Password" : "Update Password"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SetPassword;