import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    // 🔍 Validations
    if (!username.trim()) return toast.error("Username is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!mobile.trim()) return toast.error("Mobile number is required");
    if (mobile.length !== 10)
      return toast.error("Enter valid 10 digit mobile number");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);

    try {
      const isAdmin = adminCode === "ADMIN123DENTAL";
      const userRole = isAdmin ? "admin" : "user";

      await api.post("/auth/register", {
        username,
        email,
        mobile,
        password,
        role: userRole,
      });

      toast.success(`Account created successfully as ${userRole}`);
      // If there's an onSuccess prop, we can call it. Otherwise navigate to login.
      // onSuccess?.();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT – INFO */}
        <div className="hidden md:flex flex-col justify-center px-14
                        bg-gradient-to-br from-sky-600 to-cyan-500 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Join DentalCare 🦷
          </h1>

          <p className="text-lg text-sky-100">
            Create an account to manage appointments,
            access patient services, and stay connected
            with our dental clinic.
          </p>

          <ul className="mt-8 space-y-3 text-sky-100 text-sm">
            <li>✔ Secure patient registration</li>
            <li>✔ Appointment & treatment tracking</li>
            <li>✔ Trusted clinic platform</li>
          </ul>
        </div>

        {/* RIGHT – FORM */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-sky-100
                              flex items-center justify-center text-sky-600 text-2xl">
                🦷
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-slate-800">
              Create Account
            </h2>

            <p className="text-center text-slate-500 mb-6">
              Register to access DentalCare services
            </p>

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-slate-300 p-3 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              {/* Mobile */}
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                required
                className="w-full border border-slate-300 p-3 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-300 p-3 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              {/* Admin Code (Optional) */}
              <input
                type="text"
                placeholder="Admin Code (Optional - leave blank for user account)"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-slate-300 p-3 pr-12 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center
                               text-slate-500 hover:text-sky-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border border-slate-300 p-3 pr-12 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute inset-y-0 right-3 flex items-center
                               text-slate-500 hover:text-sky-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-sky-600 text-white py-3 rounded-lg
                           font-semibold hover:bg-sky-700 transition
                           disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="text-sm mt-6 text-center text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-sky-600 font-medium hover:underline"
              >
                Login
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
