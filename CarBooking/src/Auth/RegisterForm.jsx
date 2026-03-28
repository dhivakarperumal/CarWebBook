import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { MdPerson, MdPhone, MdEmail, MdLock, MdAdminPanelSettings } from "react-icons/md";
import { Eye, EyeOff } from "lucide-react";

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [adminCode, setAdminCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            const role = isAdmin ? "admin" : "user";

            await api.post("/auth/register", {
                username,
                email,
                mobile,
                password,
                role,
            });

            toast.success("Account created successfully");
            onSuccess?.(); // ✅ close popup
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="w-full max-w-md mx-auto text-white
               flex flex-col
               max-h-[85vh] border border-sky-400"
        >
            {/* ===== HEADER (STICKY) ===== */}
            <div className="sticky top-0 z-10 bg-black px-6 pt-6 pb-4">
                {/* LOGO */}
                <div className="flex justify-center mb-3">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-14 w-auto object-contain
                     drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]"
                    />
                </div>

                <h2 className="text-2xl font-bold text-center">
                    Create Account
                </h2>

                <p className="text-center text-slate-400 text-sm mt-1">
                    Register to access car service features
                </p>
            </div>

            {/* ===== SCROLLABLE FORM FIELDS ===== */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 space-y-3">

                {/* USERNAME */}
                <div className="relative">
                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 p-2.5 rounded-lg bg-slate-900
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                </div>

                {/* MOBILE */}
                <div className="relative">
                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        maxLength={10}
                        className="w-full pl-10 p-2.5 rounded-lg bg-slate-900
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                </div>

                {/* EMAIL */}
                <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 p-2.5 rounded-lg bg-slate-900
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                </div>


                {/* PASSWORD */}
                <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 p-2.5 rounded-lg bg-slate-900
                     border border-slate-700
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

                {/* CONFIRM PASSWORD */}
                <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-11 p-2.5 rounded-lg bg-slate-900
                     border border-slate-700
                     focus:ring-2 focus:ring-sky-500 outline-none "
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                     text-slate-400 hover:text-sky-400 cursor-pointer"
                    >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* ===== FOOTER (STICKY) ===== */}
            <div className="sticky bottom-0 z-10 bg-black px-6 pt-3 pb-5">

                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold
                   bg-gradient-to-r from-sky-500 to-cyan-400
                   text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]
                   transition disabled:opacity-50 cursor-pointer"
                >
                    {loading ? "Creating..." : "Register"}
                </button>

                <p className="text-xs mt-3 text-center text-slate-400">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-sky-400 font-semibold hover:underline cursor-pointer"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;