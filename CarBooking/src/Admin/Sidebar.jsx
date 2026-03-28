import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Wrench,
  Users,
  UserCog,
  Receipt,
  PackageSearch,
  CalendarCheck,
  BarChart3,
  Home,
  Settings,
  FileText,
  CarFront,
  ShieldCheck,
  Fuel,
  X, ChevronDown, ChevronLeft,
  Boxes,
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },

  { path: "/admin/bookings", label: "Service Bookings", icon: CalendarCheck },
  { path: "/admin/services", label: "Service", icon: Wrench },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/billing", label: "Billing", icon: Receipt },


  { path: "/admin/serviceslist", label: "Service Packages", icon: ShieldCheck },
  { path: "/admin/priceslist", label: "Service Pricing", icon: BarChart3 },

  {
    label: "Products",
    icon: Car,
    children: [
      { path: "/admin/allProducts", label: "Products", icon: CarFront },
      { path: "/admin/productbilling", label: "Product Billing", icon: Receipt },
      { path: "/admin/stockdetails", label: "Spare Parts Stock", icon: Boxes },
    ],
  },

  { path: "/admin/orders", label: "Orders", icon: ClipboardList },







  { path: "/admin/employees", label: "Technicians", icon: UserCog },


  { path: "/admin/inventory", label: "Parts Inventory", icon: PackageSearch },

  {
    path: "/admin/overall-attendance",
    label: "Staff Attendance",
    icon: ClipboardList,
  },

  { path: "/admin/reports", label: "Service Reports", icon: FileText },

  { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= HELPERS ================= */

  // ✅ exact route match only
  const isRouteActive = (path) => location.pathname === path;

  // ✅ check if any child is active (for auto open only)
  const isChildActive = (children) =>
    children?.some((child) => location.pathname === child.path);

  /* ===== AUTO OPEN DROPDOWN WHEN CHILD ACTIVE ===== */
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setOpenMenu(item.label);
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full
        bg-white text-blue-900 border-r border-white/10
        shadow-[0_25px_30px_rgba(0,0,0,0.18)]
        flex flex-col transition-all duration-300 backdrop-blur-xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* ========== LOGO ========== */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
          <div
            className="w-11 h-11 rounded-2xl 
            bg-gradient-to-br from-black to-gray-800
            flex items-center justify-center
            shadow-lg shadow-blue-500/30
            shrink-0 border border-white/10"
          >
            <img
              src="/logo_no_bg.png"
              alt="Logo"
              className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
            />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-black">
                Services Booking
              </h1>
              <p className="text-xs text-black truncate">
                Welcome {userProfile?.displayName?.split(" ")[0] || "Admin"}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-gray-500 hover:bg-white/20 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;
              const hasActiveChild = isChildActive(item.children);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                    ${hasActiveChild
                        ? "text-black font-semibold"
                        : "text-black/80 hover:bg-white/20"
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== SUB MENU ===== */}
                  <div
                    className={`ml-10 mt-1 space-y-1 overflow-hidden transition-all duration-300
                    ${isMenuOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                      }`}
                  >
                    {item.children.map((sub) => {
                      const SubIcon = sub.icon;
                      const isActive = isRouteActive(sub.path);

                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => isOpen && onClose()}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded transition-all duration-300
  ${isActive
                              ? "bg-gradient-to-r from-black to-cyan-400 text-white"
                              : "text-black/80 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-black/30 hover:text-white"
                            }`}
                        >

                          <SubIcon className="w-4 h-4 shrink-0" />
                          <span>{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            }

            /* ===== NORMAL ITEM ===== */
            const isActive = isRouteActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => isOpen && onClose()}
                className={`flex items-center gap-3 px-4 py-2.5 rounded transition-all duration-300
  ${isActive
                    ? "bg-gradient-to-r from-black to-cyan-400 text-white"
                    : "text-black/80 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-black/30 hover:text-white"
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2
          w-9 h-9 rounded-full
          bg-gradient-to-br from-black to-sky-500
          shadow-xl shadow-orange-500/40
          items-center justify-center
          text-black hover:scale-110 transition-all"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""
              }`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
