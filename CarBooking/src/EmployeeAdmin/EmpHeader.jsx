import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import api from "../api";

const pageTitles = {
  "/employee": "Employee Dashboard",
  "/employee/cars": "Vehicle Management",
  "/employee/assignservices": "Assign Services",
  "/employee/services": "Service",
  "/employee/billing": "Billing",
  "/employee/addbillings": "Add Billing",
  "/employee/reports": "Reports",
  "/employee/settings": "Settings",
};




const Header = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const searchInputRef = useRef(null);

  const [todayBookings, setTodayBookings] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);

  const { profileName, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();


  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const sidebarMenus = [
    { title: "Dashboard", path: "/employee" },
    { title: "Assign Services", path: "/employee/assignservices" },
    { title: "Vehicle Management", path: "/employee/cars" },
    { title: "Service", path: "/employee/services" },
    { title: "Billing", path: "/employee/billing" },
  ];

  const searchResults = searchTerm
    ? [
      // Menus
      ...sidebarMenus
        .filter((m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((m) => ({ type: "menu", ...m })),

      // Bookings
      ...bookings
        .filter(
          (b) =>
            b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.phone?.includes(searchTerm) ||
            b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((b) => ({ type: "booking", ...b })),

      // Customers
      ...customers
        .filter(
          (c) =>
            (c.username || c.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.mobile || c.phone)?.includes(searchTerm)
        )
        .map((c) => ({ type: "customer", ...c })),

      // Orders
      ...orders
        .filter(
          (o) =>
            o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.shipping?.phone?.includes(searchTerm) ||
            o.shipping?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
        .map((o) => ({ type: "order", ...o })),
    ]
    : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, ordersRes, customersRes] = await Promise.all([
          api.get("/bookings"),
          api.get("/orders"),
          api.get("/auth/users")
        ]);
        setBookings(bookingsRes.data || []);
        setOrders(ordersRes.data || []);
        setCustomers(customersRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);





  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };


  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // update every 1 min

    return () => clearInterval(interval);
  }, []);


  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const [bookingsRes, ordersRes] = await Promise.all([
          api.get("/bookings"),
          api.get("/orders")
        ]);
        const bData = bookingsRes.data || [];
        const oData = ordersRes.data || [];
        setTodayBookings(bData.filter((b) => isToday(b.created_at || b.createdAt)));
        setTodayOrders(oData.filter((o) => isToday(o.created_at || o.createdAt)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTodayData();
  }, [location.pathname]); // Refetch on navigation to update counts

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }
    return "Dashboard";
  };

  // 🔐 Firebase Logout
  const handleLogout = async () => {
    try {
      await logout(); // ✅ from AuthContext
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      toast.error("Logout failed");
      console.error(err);
    }
  };



  return (
    <header className="sticky top-0 z-30 shadow-[0_10px_10px_rgba(0,0,0,0.18)] bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="leading-tight">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 truncate">
              {getPageTitle()}
            </h1>

            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
              {greeting} {profileName?.displayName || "Staff"}
            </p>
          </div>

        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Search */}
          <div className="relative">
            {/* SEARCH POPUP */}
            {showSearch && (
              <>
                {/* Overlay */}
                <div
                  onClick={() => setShowSearch(false)}
                  className="fixed inset-0 z-40"
                />

                <div
                  className="fixed top-16 left-1/2 -translate-x-1/2
    w-[94vw] max-w-md

    sm:absolute sm:top-full sm:mt-2
    sm:right-0 sm:left-auto sm:translate-x-0 sm:w-80

    bg-white border border-slate-200 rounded-lg shadow-xl
    flex flex-col z-50 animate-fadeIn overflow-hidden 
                  "
                >

                  {/* Input Row */}
                  <div className="flex items-center border-b border-slate-100">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search menus, customers, bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                      autoFocus
                      className="flex-1 px-4 py-3 text-sm outline-none placeholder-slate-400"
                    />

                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchTerm("");
                      }}
                      className="p-3 text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* RESULTS */}
                  {searchTerm && (
                    <div className="max-h-[65vh] overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((item, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchTerm("");

                              if (item.type === "menu") navigate(item.path);
                              if (item.type === "booking")
                                navigate(`/employee/assignservices`);
                              if (item.type === "customer")
                                navigate(`/employee/assignservices`);
                              if (item.type === "order")
                                navigate(`/employee/billing`);
                            }}
                            className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {item.title ||
                                item.username ||
                                item.name ||
                                item.shipping?.name ||
                                "Result"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.type === "menu" && "Menu"}
                              {item.type === "booking" &&
                                `Booking ID: ${item.bookingId}`}
                              {item.type === "customer" &&
                                `Phone: ${item.mobile || item.phone}`}
                              {item.type === "order" &&
                                `Order ID: ${item.orderId}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-400 text-center">
                          No results found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SEARCH BUTTON */}
            <button
              onClick={() => setShowSearch((p) => !p)}
              className={`p-2 rounded-sm transition-all duration-200
      ${showSearch
                  ? "text-sky-600 bg-sky-50"
                  : "text-slate-500 hover:bg-slate-100"
                }`}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>



          {/* Notifications */}
          <div className="relative">
            {/* Bell Button */}
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setNotificationsSeen(true);
              }}
              className={`relative p-2 rounded-xl transition-all duration-200 ${showNotifications
                ? "bg-sky-100 text-sky-600 shadow-inner"
                : "hover:bg-slate-100 text-slate-600"
                }`}
            >
              <Bell className={`w-5 h-5 ${showNotifications ? "fill-sky-600" : ""}`} />

              {/* Count Badge */}
              {!notificationsSeen && todayBookings.length + todayOrders.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] text-[10px] font-bold flex items-center justify-center bg-red-500 text-white rounded-full border-2 border-white shadow-sm px-0.5 animate-pulse">
                  {todayBookings.length + todayOrders.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Overlay */}
                <div
                  onClick={() => setShowNotifications(false)}
                  className="fixed inset-0 z-40"
                />

                {/* Dropdown Box */}
                <div
                  className="
    fixed top-16 left-1/2 -translate-x-1/2
    w-[94vw] max-w-sm

    sm:left-auto sm:right-40 sm:translate-x-0 sm:w-80

    bg-white border border-slate-200 rounded-2xl shadow-xl
    z-50 overflow-hidden animate-fadeIn
  "
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Notifications
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                      {todayBookings.length + todayOrders.length} New
                    </span>
                  </div>

                  {/* LIST */}
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">

                    {/* BOOKINGS */}
                    {todayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          navigate("/employee/bookings");
                          setShowNotifications(false);
                        }}
                        className="px-4 py-4 border-b border-slate-50 hover:bg-sky-50/50 cursor-pointer transition-colors relative group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                            {b.name}
                          </p>
                          {!notificationsSeen && <div className="w-2 h-2 rounded-full bg-sky-500 shadow-sm" />}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {b.bookingId}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">Booking</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate opacity-80 italic">
                          {b.address || b.location || "No address provided"}
                        </p>
                      </div>
                    ))}

                    {/* ORDERS */}
                    {todayOrders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          navigate(`/employee/billing`);
                          setShowNotifications(false);
                        }}
                        className="px-4 py-4 border-b border-slate-50 hover:bg-sky-50/50 cursor-pointer transition-colors relative group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                            {o.shipping?.name || "Unknown Customer"}
                          </p>
                          {!notificationsSeen && <div className="w-2 h-2 rounded-full bg-sky-500 shadow-sm" />}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {o.orderId || o.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 uppercase">Order</span>
                        </p>
                        <p className="text-[11px] text-sky-600 font-bold">
                          Amount: {o.total}
                        </p>
                      </div>
                    ))}


                    {/* EMPTY STATE */}
                    {todayBookings.length + todayOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                        <Bell className="w-10 h-10 text-slate-300" />
                        <p className="text-sm text-slate-500 font-medium">
                          You're all caught up
                        </p>
                        <p className="text-xs text-slate-400">
                          No new notifications right now
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>



          {/* User */}
          <div className="relative">
            {/* PROFILE BUTTON */}
            <button
              onClick={() => setShowDropdown((p) => !p)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden shadow-sm">
                {profileName?.photoURL ? (
                  <img
                    src={profileName.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileName?.displayName?.[0]?.toUpperCase() || "A"
                )}
              </div>

              {/* Name & Role */}
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">
                  {profileName?.displayName || "Staff"}
                </p>
                <p className="text-xs text-slate-500">
                  {profileName?.role || "Employee"}
                </p>
              </div>

              {/* Arrow */}
              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* OVERLAY */}
            {showDropdown && (
              <>
                <div
                  onClick={() => setShowDropdown(false)}
                  className="fixed inset-0 z-40"
                />

                {/* DROPDOWN */}
                <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1 animate-fadeIn">
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      {profileName?.displayName || "Admin"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profileName?.email || "staff@carbooking.com"}
                    </p>
                  </div>

                  {/* Menu */}
                  <Link
                    to="/admin/settings/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-700 transition"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-700 transition"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <hr className="my-1 border-slate-100" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 w-full transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;


// import { useState, useEffect } from "react";
// import { useNavigate, Link, useLocation } from "react-router-dom";
// import {
//   Menu,
//   Bell,
//   Settings,
//   User,
//   LogOut,
//   ChevronDown,
// } from "lucide-react";
// import { useAuth } from "../PrivateRouter/AuthContext";
// import { collection, onSnapshot } from "firebase/firestore";
// import { db } from "../firebase";
// import toast from "react-hot-toast";

// const pageTitles = {
//   "/admin": "Dashboard",
//   "/admin/services": "Services",
//   "/admin/bookings": "Bookings Service",
//   "/admin/orders": "Orders",
// };

// const Header = ({ onMenuClick }) => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const [todayBookings, setTodayBookings] = useState([]);
//   const [todayOrders, setTodayOrders] = useState([]);

//   const { profileName, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // 📅 check today
//   const isToday = (timestamp) => {
//     if (!timestamp) return false;
//     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//     const today = new Date();
//     return (
//       date.getDate() === today.getDate() &&
//       date.getMonth() === today.getMonth() &&
//       date.getFullYear() === today.getFullYear()
//     );
//   };

//   // 🔔 Firestore listeners
//   useEffect(() => {
//     const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
//       const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setTodayBookings(data.filter((b) => isToday(b.createdAt)));
//     });

//     const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
//       const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setTodayOrders(data.filter((o) => isToday(o.createdAt)));
//     });

//     return () => {
//       unsubBookings();
//       unsubOrders();
//     };
//   }, []);

//   const totalTodayNotifications =
//     todayBookings.length + todayOrders.length;

//   const getPageTitle = () => {
//     if (pageTitles[location.pathname]) return pageTitles[location.pathname];
//     return "Dashboard";
//   };

//   const handleLogout = async () => {
//     try {
//       await logout();
//       toast.success("Logged out successfully");
//       navigate("/login");
//     } catch {
//       toast.error("Logout failed");
//     }
//   };

//   return (
//     <header className="sticky top-0 z-30 shadow bg-white">
//       <div className="flex items-center justify-between px-4 py-3 sm:px-6">

//         {/* LEFT */}
//         <div className="flex items-center gap-3 min-w-0">
//           <button
//             onClick={onMenuClick}
//             className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
//           >
//             <Menu className="w-6 h-6" />
//           </button>

//           <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 truncate">
//             {getPageTitle()}
//           </h1>
//         </div>

//         {/* RIGHT */}
//         <div className="flex items-center gap-2">

//           {/* 🔔 NOTIFICATIONS */}
//           <div className="relative">
//             <button
//               onClick={() => setShowNotifications((p) => !p)}
//               className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100"
//             >
//               <Bell className="w-5 h-5" />

//               {totalTodayNotifications > 0 && (
//                 <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1 rounded-full">
//                   {totalTodayNotifications}
//                 </span>
//               )}
//             </button>

//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow z-50 max-h-96 overflow-y-auto">

//                 <div className="px-4 py-3 border-b font-semibold text-sm">
//                   Today Notifications ({totalTodayNotifications})
//                 </div>

//                 {/* BOOKINGS */}
//                 {todayBookings.map((b) => (
//                   <div
//                     key={b.id}
//                     onClick={() => {
//                       navigate(`/admin/bookings/${b.id}`);
//                       setShowNotifications(false);
//                     }}
//                     className="px-4 py-3 border-b hover:bg-slate-50 cursor-pointer"
//                   >
//                     <p className="text-sm font-semibold">{b.name}</p>
//                     <p className="text-xs text-slate-500">
//                       Booking ID: {b.bookingId}
//                     </p>
//                     <p className="text-xs text-slate-400 truncate">
//                       {b.address || b.location}
//                     </p>
//                   </div>
//                 ))}

//                 {/* ORDERS */}
//                 {todayOrders.map((o) => (
//                   <div
//                     key={o.id}
//                     onClick={() => {
//                       navigate(`/admin/orders/${o.id}`);
//                       setShowNotifications(false);
//                     }}
//                     className="px-4 py-3 border-b hover:bg-slate-50 cursor-pointer"
//                   >
//                     <p className="text-sm font-semibold">
//                       {o.customerName}
//                     </p>
//                     <p className="text-xs text-slate-500">
//                       Order ID: {o.orderId}
//                     </p>
//                     <p className="text-xs text-slate-400 truncate">
//                       {o.address}
//                     </p>
//                   </div>
//                 ))}

//                 {totalTodayNotifications === 0 && (
//                   <p className="text-center text-sm py-6 text-slate-400">
//                     No new notifications today
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* 👤 USER */}
//           <div className="relative">
//             <button
//               onClick={() => setShowDropdown((p) => !p)}
//               className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100"
//             >
//               <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center font-semibold">
//                 {profileName?.displayName?.[0]?.toUpperCase() || "A"}
//               </div>
//               <ChevronDown className="w-4 h-4 text-slate-400" />
//             </button>

//             {showDropdown && (
//               <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow z-50">
//                 <Link
//                   to="/admin/settings"
//                   className="block px-4 py-2 hover:bg-slate-50 text-sm"
//                 >
//                   Settings
//                 </Link>

//                 <button
//                   onClick={handleLogout}
//                   className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
//                 >
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>

//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
