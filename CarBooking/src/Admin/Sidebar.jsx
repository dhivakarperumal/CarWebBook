import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Wrench,
  Users,
  Receipt,
  Car,
  CarFront,
  Boxes,
  ClipboardList,
  PackageSearch,
  Bike,
  PlusCircle,
  UserCog,
  FileText,
  Home,
  Package,
  CalendarDays,
  Store,
  Briefcase,
  ShoppingCart,
  HandCoins,
  Settings,
  ChevronDown,
  ChevronLeft,
  X,
  UserRound,
  FileBarChart,
  Hammer,
  ShieldCheck,
  BarChart3,
  Fuel
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= ROLE PERMISSIONS ================= */
const ROLE_PERMISSIONS = {
  mechanic: [
    "Dashboard",
    "Service Bookings",
    "Assign Services",
    "Service",
    "Parts Inventory",
    "Service Reports",
    "Back Home"
  ],
  receptionist: [
    "Dashboard",
    "Service Bookings",
    "Assign Services",
    "Service",
    "Customers",
    "Billing",
    "Service Packages",
    "Service Pricing",
    "Products",
    "Orders",
    "Staff Attendance",
    "Back Home"
  ],
  // Admin and Manager see everything
};

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },

  { path: "/admin/bookings", label: "Service Bookings", icon: CalendarCheck },
  { path: "/admin/assignservices", label: "Assign Services", icon: UserCheck },
  { path: "/admin/services", label: "Active Services", icon: Wrench },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/billing", label: "Billing", icon: Receipt },

  // { path: "/admin/serviceslist", label: "Service Packages", icon: ShieldCheck },
  // { path: "/admin/priceslist", label: "Service Pricing", icon: BarChart3 },

  {
    label: "Products",
    icon: Car,
    children: [
      { path: "/admin/allProducts", label: "Products", icon: CarFront },
      { path: "/admin/productbilling", label: "Product Billing", icon: Receipt },
      { path: "/admin/stockdetails", label: "Spare Parts Stock", icon: Boxes },
      { path: "/admin/orders", label: "Orders", icon: ClipboardList },
      { path: "/admin/inventory", label: "Parts Inventory", icon: PackageSearch },
    ],
  },


  {
    label: "Vehicle Marketplace",
    icon: Car, 
    children: [
      { path: "/admin/inventory-list", label: "Vehicle Inventory", icon: ClipboardList },
      { path: "/admin/add-vehicle", label: "Add New Vehicle", icon: PlusCircle },
    ],
  },


  {
    label: "Employees",
    icon: CarFront,
    children: [
      { path: "/admin/employees", label: "Technicians", icon: UserCog },
      {
        path: "/admin/overall-attendance",
        label: "Staff Attendance",
        icon: ClipboardList,
      },
    ],
  },







  { path: "/admin/reports", label: "Service Reports", icon: FileText },

  { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName: userProfile } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= HELPERS ================= */
  const routeMappings = {
    "/admin/addserviceparts": "/admin/services",
    "/admin/addbillings": "/admin/billing",
    "/admin/addprice": "/admin/priceslist",
    "/admin/addproducts": "/admin/allProducts",
    "/admin/addstock": "/admin/stockdetails",
    "/admin/addstaff": "/admin/employees",
    "/admin/addbooking": "/admin/bookings",
    "/admin/additemsinventory": "/admin/inventory",
    "/admin/addcarservies": "/admin/carservies",
    "/admin/addservices": "/admin/serviceslist",
  };

  const isRouteActive = (path, exact) => {
    const currentPath = location.pathname;

    // Direct match
    if (currentPath === path) return true;

    // Mapping match (usually for Add/Edit forms)
    if (routeMappings[currentPath] === path) return true;

    // For non-exact routes (like categories or lists with sub-pages)
    if (!exact && currentPath.startsWith(path + "/")) return true;

    return false;
  };

  const isChildActive = (children) =>
    children?.some((child) => isRouteActive(child.path, false));

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

  /* ===== FILTER NAV BY ROLE ===== */
  const dashboardPath = useMemo(() => {
    const role = (userProfile?.role || "").toLowerCase();
    if (role === "mechanic" || role === "staff") return "/employee";
    return "/admin";
  }, [userProfile?.role]);

  const filteredNavItems = useMemo(() => {
    const role = (userProfile?.role || "").toLowerCase();
    if (role === "admin" || role === "manager") return navItems;

    const allowed = ROLE_PERMISSIONS[role] || [];

    return navItems
      .filter((item) => {
        if (item.children) {
          // If any child is allowed, show the parent
          return item.children.some((child) => allowed.includes(child.label));
        }
        return allowed.includes(item.label);
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) => allowed.includes(child.label)),
          };
        }
        return item;
      });
  }, [userProfile?.role]);

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
        bg-white text-slate-900 border-r border-slate-200
        shadow-[0_0_40px_rgba(0,0,0,0.08)]
        flex flex-col transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* ========== LOGO ========== */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-100">
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
              <h1 className="text-base font-bold text-slate-800 whitespace-nowrap">
                Service Booking
              </h1>
              <p className="text-[10px] text-emerald-600 font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;
              const hasActiveChild = isChildActive(item.children);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${hasActiveChild
                        ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${hasActiveChild ? "text-emerald-600" : ""}`} />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""} ${hasActiveChild ? "text-emerald-600" : ""}`}
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
                              ? "bg-gradient-to-r from-black to-cyan-400 text-white shadow-md shadow-cyan-100"
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
            const itemPath = item.label === "Dashboard" ? dashboardPath : item.path;
            const isActive = isRouteActive(itemPath, item.exact);

            return (
              <NavLink
                key={item.label}
                to={itemPath}
                end={item.exact}
                onClick={() => isOpen && onClose()}
                className={`flex items-center gap-3 px-4 py-2.5 rounded transition-all duration-300
  ${isActive
                    ? "bg-gradient-to-r from-black to-cyan-400 text-white shadow-md shadow-cyan-100"
                    : "text-black/80 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-black/30 hover:text-white"
                  }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2
          w-7 h-7 rounded-full
          bg-gradient-to-br from-black to-sky-500
          shadow-md shadow-slate-200/50
          items-center justify-center
          text-white transition-all"
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
