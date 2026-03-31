import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "./PageContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useRef } from "react";
import LoginModal from "../Auth/LoginModal";
import RegisterModal from "../Auth/RegisterModal";
import { FiShoppingCart } from "react-icons/fi";
import api from "../api";

const Navbar = () => {
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user: userData, logout } = useAuth();
  const loadingUser = false;
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = async () => {
    try {
      logout();
      setShowMenu(false);
      setCartCount(0);

      navigate("/", { replace: true });

      setShowLogin(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  // ── FETCH CART COUNT ────────────────────────────────────────────
  const fetchCartCount = useCallback(async () => {
    const userId = userData?.id || userData?.uid;
    if (!userId) { setCartCount(0); return; }
    try {
      const res = await api.get(`/cart/${userId}`);
      const items = res.data || [];
      const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, [userData?.id, userData?.uid]);

  // Fetch on login / route change
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, location.pathname]);

  // Listen for instant updates when items are added/removed from cart
  useEffect(() => {
    window.addEventListener("cart-updated", fetchCartCount);
    return () => window.removeEventListener("cart-updated", fetchCartCount);
  }, [fetchCartCount]);
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);



  const links = [
    { label: "HOME", path: "/" },
    { label: "SERVICES", path: "/services" },
    { label: "PRICING", path: "/pricing" },
    { label: "PRODUCTS", path: "/products" },
    { label: "ABOUT", path: "/about" },
    { label: "CONTACT US", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-black backdrop-blur-md border-b border-sky-400/20">
        <PageContainer>
          <div className="relative flex items-center justify-between h-18">
            {/* LOGO */}
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src="/logo.png"
                alt="DucatiBox Logo"
                className="h-12 w-auto object-contain transition
                           group-hover:scale-105
                           drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
              />
            </div>

            {/* DESKTOP MENU */}
            <nav
              className="hidden md:flex items-center gap-6
             absolute left-1/2 -translate-x-1/2"
            >
              {links.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`relative cursor-pointer text-[14px] font-bold
        transition-all duration-300
        ${location.pathname === item.path
                      ? "text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                      : "text-gray-300 hover:text-sky-400 hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                    }
        after:absolute after:left-1/2 after:-bottom-2
        after:h-[2px] after:-translate-x-1/2
        after:bg-gradient-to-r after:from-sky-400 after:to-cyan-300
        after:transition-all after:duration-300
        ${location.pathname === item.path
                      ? "after:w-full"
                      : "after:w-0 hover:after:w-full"
                    }
      `}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTA + USER */}
            <div className="flex items-center gap-4">
              {/* RIGHT SIDE (DESKTOP + MOBILE) */}
              <div className="flex items-center gap-4">


                {/* CART ICON */}
                <button
                  onClick={() => navigate("/cart")}
                  className="relative cursor-pointer text-sky-400 hover:text-white transition
  md:order-none order-first"
                >
                  <FiShoppingCart size={22} />

                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px]
      w-4 h-4 flex items-center justify-center rounded-full
      shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    >
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* USER AVATAR (SINGLE INSTANCE) */}
                {!loadingUser &&
                  (userData ? (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu((prev) => !prev);
                        }}
                        className="h-9 w-9 cursor-pointer rounded-full flex items-center justify-center
                     bg-gradient-to-r from-blue-600 to-cyan-400
                     text-white hover:text-black font-bold shadow-[0_0_15px_rgba(56,189,248,0.6)]"
                      >
                        {(
                          userData.username ||
                          userData.displayName ||
                          userData.email
                        )
                          ?.charAt(0)
                          .toUpperCase()}
                      </button>

                      {/* DROPDOWN */}
                      {showMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-12 w-52 rounded-xl
                       bg-black border border-sky-400/30
                       shadow-[0_0_30px_rgba(56,189,248,0.25)]
                       overflow-hidden z-50"
                        >
                          {/* USER INFO */}
                          <div className="px-4 py-3 border-b border-sky-400/20">
                            <p className="text-sm font-semibold text-sky-300 truncate">
                              {userData.username || userData.displayName}
                            </p>
                            <p className="text-xs text-sky-400 truncate">
                              {userData.email}
                            </p>
                          </div>

                          {/* ACCOUNT */}
                          <button
                            onClick={() => {
                              navigate("/account");
                              setShowMenu(false);
                            }}
                            className="w-full cursor-pointer px-4 py-3 text-left text-white
                         hover:bg-sky-400/10 hover:text-sky-400 transition"
                          >
                            Account
                          </button>

                          {/* ADMIN PANEL (ONLY FOR ADMIN) */}
                          {userData?.role === "admin" && (
                            <button
                              onClick={() => {
                                navigate("/admin");
                                setShowMenu(false);
                              }}
                              className="w-full cursor-pointer px-4 py-3 text-left
               text-white hover:text-yellow-300
               hover:bg-yellow-400/10 transition font-semibold"
                            >
                              Admin Panel
                            </button>
                          )}

                          {/* LOGOUT */}
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left
                         text-white hover:text-red-400 cursor-pointer hover:bg-red-500/10 transition"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLogin(true)}
                      className="relative px-4 py-2 rounded-full
  font-bold text-sm  
  border border-sky-400/60
  transition-all duration-300
  text-white bg-gradient-to-r from-blue-600 to-cyan-400 hover:text-black 
  hover:shadow-[0_0_25px_rgba(56,189,248,0.7)]
  active:scale-95 cursor-pointer"
                    >
                      Login
                    </button>
                  ))}

                {/* BOOK NOW (DESKTOP ONLY) */}
                <button
                  onClick={() => navigate("/bookservice")}
                  className="hidden md:flex relative px-4 py-2 rounded-full
             font-bold text-sm  
             border border-sky-400/60
             transition-all duration-300
             text-white bg-gradient-to-r from-blue-600 to-cyan-400 hover:text-black 
             hover:shadow-[0_0_25px_rgba(56,189,248,0.7)]
             active:scale-95 cursor-pointer"
                >
                  Book Now
                </button>

                {/* HAMBURGER (MOBILE ONLY) */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="md:hidden flex flex-col gap-1"
                >
                  <span
                    className={`w-6 h-[2px] bg-sky-500 transition ${isOpen && "rotate-45 translate-y-2"}`}
                  />
                  <span
                    className={`w-6 h-[2px] bg-sky-500 transition ${isOpen && "opacity-0"}`}
                  />
                  <span
                    className={`w-6 h-[2px] bg-sky-500 transition ${isOpen && "-rotate-45 -translate-y-2"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      <div className="h-[0.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />

      {/* MOBILE MENU */}
      <div
        className={`md:hidden bg-black/95 backdrop-blur transition-all duration-300 overflow-hidden
        ${isOpen ? "max-h-[420px] border-t border-sky-400/20" : "max-h-0"}`}
      >
        <nav className="flex flex-col px-6 py-6 gap-6">
          {links.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`text-xs font-bold tracking-[0.2em] text-left transition
    ${location.pathname === item.path
                  ? "text-sky-400 pl-3 border-l-2 border-sky-400"
                  : "text-gray-300 hover:text-sky-400"
                }
  `}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => {
              navigate("/bookservice");
              setIsOpen(false);
            }}
            className="mt-4 px-5 py-2.5 rounded-md font-bold text-xs tracking-[0.2em]
                       text-black bg-sky-400
                       shadow-[0_0_25px_rgba(56,189,248,0.6)]"
          >
            BOOK NOW
          </button>
        </nav>
      </div>
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onOpenRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </header>
  );
};

export default Navbar;
