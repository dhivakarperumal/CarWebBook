import { useState } from "react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { FaCar, FaGoogle } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";

const LoginForm = ({ onSuccess, onOpenRegister }) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    // 🔹 Email / Username Login
    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);

        try {
            const res = await api.post("/auth/login", {
                identifier,
                password,
            });

            login(res.data.user, res.data.token);

            onSuccess?.(res.data.user.role || "user");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Google Login
    const handleGoogleLogin = async () => {
        toast.error("Google Login is disabled. Please use standard login.");
    };

    return (
        <div
            className="w-full max-w-md mx-auto text-white
               bg-black rounded-2xl
               max-h-[85vh] overflow-y-auto
               px-6 py-6 border border-sky-400"
        >
            {/* LOGO */}
            <div className="flex justify-center mb-4">
                <img
                    src="/logo.png"   // 🔁 change path if needed
                    alt="Logo"
                    className="h-14 w-auto object-contain
               drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]"
                />
            </div>

            <h2 className="text-2xl font-bold text-center">
                Car Service Login
            </h2>

            <p className="text-center text-slate-400 text-sm mt-1 mb-5">
                Sign in to manage services & bookings
            </p>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-3">

                {/* EMAIL / USERNAME */}
                <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2
                           text-slate-400" />
                    <input
                        type="text"
                        placeholder="Email or Username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full pl-10 p-2.5 rounded-lg
                     bg-slate-900 border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                </div>

                {/* PASSWORD */}
                <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2
                          text-slate-400" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-11 p-2.5 rounded-lg
                     bg-slate-900 border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                     text-slate-400 hover:text-sky-400 cursor-pointer"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* LOGIN BUTTON */}
                <button
                    disabled={loading}
                    className="w-full py-2.5 mt-2 rounded-lg font-semibold
                   bg-gradient-to-r from-sky-500 to-sky-500
                   cursor-pointer
                   transition disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>

            {/* OR */}
            <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* GOOGLE */}
            <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 rounded-lg border border-slate-700
                 flex items-center justify-center gap-3
                 hover:bg-slate-800 transition cursor-pointer"
            >
                <FaGoogle className="text-blue-500 text-base" />
                <span className="font-medium text-slate-300 text-sm">
                    Continue with Google
                </span>
            </button>

            {/* REGISTER LINK */}
            <p className="text-xs mt-4 text-center text-slate-400">
                Don’t have an account?{" "}
                <button
                    type="button"
                    onClick={onOpenRegister}
                    className="text-sky-400 font-semibold hover:underline cursor-pointer"
                >
                    Register
                </button>
            </p>
        </div>
    );
};

export default LoginForm;