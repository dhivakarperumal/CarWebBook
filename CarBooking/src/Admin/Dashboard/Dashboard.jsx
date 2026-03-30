import React, { useEffect, useState } from "react";
import {
  FaTools,
  FaCalendarCheck,
  FaCogs,
  FaMoneyBillWave,
  FaUserCog,
  FaBoxes

} from "react-icons/fa";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";


import { collection, query, where, onSnapshot, Timestamp, orderBy, limit, } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";


/* -------------------- COMPONENTS -------------------- */

import { ArrowUp, ArrowDown } from "lucide-react";

const GradientStatCard = ({
  title,
  value,
  change,
  isUp,
  gradient,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded text-white p-8 shadow-md ${gradient}`}
    >
      {/* TITLE */}
      <p className="text-xs font-semibold opacity-90 tracking-wide">
        {title}
      </p>

      {/* VALUE */}
      <h2 className="text-2xl font-bold mt-2">{value}</h2>

      {/* CHANGE ROW */}
      <div className="flex items-center justify-between mt-2 text-sm opacity-95">
        <span>Compared to last week</span>

        <span className="flex items-center gap-1 font-semibold">
          {isUp ? (
            <ArrowUp size={16} className="bg-white/20 rounded-full p-1" />
          ) : (
            <ArrowDown size={16} className="bg-white/20 rounded-full p-1" />
          )}
          {change}
        </span>
      </div>

      {/* SPARKLINE */}
      <div className="absolute bottom-0 top-28 left-0 w-full h-16 opacity-30">
        <svg viewBox="0 0 100 30" className="w-full h-full">
          <polyline
            fill="none"
            stroke="white"
            strokeWidth="2"
            points="0,20 10,15 20,18 30,10 40,12 50,8 60,14 70,6 80,12 90,5 100,9"
          />
        </svg>
      </div>
    </div>
  );
};

/* -------------------- DASHBOARD -------------------- */

const Dashboard = () => {

const [topStats, setTopStats] = useState({
  todayBookings: 0,
  todayCustomers: 0,
  totalServices: 0,
  totalCustomers: 0,
  totalEmployees: 0,
  totalOrders: 0,
  totalDeliveryOrders: 0,
  totalProducts: 0,
  totalEarnings: 0,
});

useEffect(() => {
  const start = Timestamp.fromDate(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const end = Timestamp.fromDate(
    new Date(new Date().setHours(23, 59, 59, 999))
  );

  // ✅ TODAY BOOKINGS
  const unsubTodayBookings = onSnapshot(
    query(
      collection(db, "bookings"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    ),
    (snap) =>
      setTopStats((p) => ({ ...p, todayBookings: snap.size }))
  );

  // ✅ TODAY CUSTOMERS (unique mobile created today)
  const unsubTodayCustomers = onSnapshot(
    query(
      collection(db, "users"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    ),
    (snap) => {
      const unique = new Set();
      snap.forEach((d) => {
        const data = d.data();
        if (data.mobileNumber) unique.add(data.mobileNumber);
      });

      setTopStats((p) => ({
        ...p,
        todayCustomers: unique.size,
      }));
    }
  );

  // ✅ TOTAL SERVICES
  const unsubServices = onSnapshot(
    collection(db, "services"),
    (snap) =>
      setTopStats((p) => ({ ...p, totalServices: snap.size }))
  );

  // ✅ TOTAL CUSTOMERS (unique mobile)
  const unsubCustomers = onSnapshot(
  collection(db, "users"),
  (snap) =>
    setTopStats((p) => ({
      ...p,
      totalCustomers: snap.size,
    }))
);


  // ✅ TOTAL EMPLOYEES
  const unsubEmployees = onSnapshot(
    collection(db, "employees"),
    (snap) =>
      setTopStats((p) => ({ ...p, totalEmployees: snap.size }))
  );

  // ✅ TOTAL ORDERS
  const unsubOrders = onSnapshot(
    collection(db, "orders"),
    (snap) =>
      setTopStats((p) => ({ ...p, totalOrders: snap.size }))
  );

// ✅ TOTAL DELIVERY ORDERS (status === "delivered")
const unsubDeliveryOrders = onSnapshot(
  query(
    collection(db, "orders"),
    where("status", "==", "delivered")
  ),
  (snap) =>
    setTopStats((p) => ({
      ...p,
      totalDeliveryOrders: snap.size,
    }))
);


  // ✅ TOTAL EARNINGS (paid + partial)
  const unsubEarnings = onSnapshot(
    collection(db, "billings"),
    (snap) => {
      let total = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        const status = (data.paymentStatus || "").toLowerCase();

        if (status === "paid") {
          total += Number(data.grandTotal || 0);
        }

        if (status === "partial") {
          total += Number(data.paidAmount || 0);
        }
      });

      setTopStats((p) => ({ ...p, totalEarnings: total }));
    }
  );

  // ✅ TOTAL PRODUCTS
  const unsubProducts = onSnapshot(
    collection(db, "products"),
    (snap) =>
      setTopStats((p) => ({ ...p, totalProducts: snap.size }))
  );

  // ✅ CLEANUP
  return () => {
    unsubTodayBookings();
    unsubTodayCustomers();
    unsubServices();
    unsubCustomers();
    unsubEmployees();
    unsubProducts();
    unsubOrders();
    unsubDeliveryOrders();
    unsubEarnings();
  };
}, []);




  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getWeekRange = (offset = 0) => {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1 - offset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: Timestamp.fromDate(monday),
      end: Timestamp.fromDate(sunday),
    };
  };

  const [appointmentData, setAppointmentData] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const q = query(collection(db, "bookings"));

    const unsub = onSnapshot(q, (snap) => {
      const baseData = days.map((d) => ({
        day: d,
        thisWeek: 0,
        lastWeek: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
      }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tempCounts = {
        pending: 0,
        completed: 0,
        cancelled: 0,
      };

      snap.forEach((doc) => {
        const data = doc.data();
        if (!data.status) return;

        const rawStatus = String(data.status).toLowerCase().trim();

        /* 🔹 MAP TO DASHBOARD STATUS */
        let status = "pending";

        if (rawStatus === "service completed") status = "completed";
        if (rawStatus === "cancelled") status = "cancelled";

        /* ✅ SAFE DATE PICK */
        const baseDate =
          status === "completed" || status === "cancelled"
            ? data.updatedAt?.toDate() || data.createdAt?.toDate()
            : data.createdAt?.toDate();

        if (!baseDate) return;

        const date = new Date(baseDate);
        date.setHours(0, 0, 0, 0);

        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

        /* =====================
           TODAY COUNTS
        ===================== */
        if (date.getTime() === today.getTime()) {
          if (status === "pending") tempCounts.pending++;
          if (status === "completed") tempCounts.completed++;
          if (status === "cancelled") tempCounts.cancelled++;
        }

        /* =====================
           THIS WEEK
        ===================== */
        if (
          date >= thisWeek.start.toDate() &&
          date <= thisWeek.end.toDate()
        ) {
          baseData[dayIndex].thisWeek++;

          if (status === "pending") baseData[dayIndex].pending++;
          if (status === "completed") baseData[dayIndex].completed++;
          if (status === "cancelled") baseData[dayIndex].cancelled++;
        }

        /* =====================
           LAST WEEK
        ===================== */
        if (
          date >= lastWeek.start.toDate() &&
          date <= lastWeek.end.toDate()
        ) {
          baseData[dayIndex].lastWeek++;
        }
      });


      setAppointmentData(baseData);
      setCounts(tempCounts);
    });

    return () => unsub();
  }, []);



  const [revenueData, setRevenueData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    const now = new Date();

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const q = query(
      collection(db, "billings"),
      where("createdAt", ">=", Timestamp.fromDate(yearStart)),
      where("createdAt", "<=", Timestamp.fromDate(yearEnd))
    );

    const unsub = onSnapshot(q, (snap) => {
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const monthly = months.map((m) => ({
        month: m,
        revenue: 0,
      }));

      let thisMonthTotal = 0;
      const currentMonth = now.getMonth();

      snap.forEach((doc) => {
        const data = doc.data();

        if (!data.createdAt) return;

        const status = (data.paymentStatus || "").toLowerCase();

        let paidAmount = 0;

        /* ✅ PAID → FULL GRAND TOTAL */
        if (status === "paid") {
          paidAmount = Number(data.grandTotal || 0);
        }

        /* ✅ PARTIAL → USE paidAmount FIELD */
        else if (status === "partial") {
          paidAmount = Number(data.paidAmount || 0);
        }

        /* ❌ PENDING → IGNORE */
        else {
          return;
        }

        if (paidAmount <= 0) return;

        const date = data.createdAt.toDate();
        const monthIndex = date.getMonth();

        monthly[monthIndex].revenue += paidAmount;

        if (monthIndex === currentMonth) {
          thisMonthTotal += paidAmount;
        }
      });

      setRevenueData(monthly);
      setMonthlyTotal(thisMonthTotal);
    });

    return () => unsub();
  }, []);

  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(list);
    });

    return () => unsub();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "-";

    if (ts.seconds) {
      return ts.toDate().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    if (ts instanceof Date) {
      return ts.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return new Date(ts).toLocaleDateString("en-IN");
  };

  const BRAND_COLORS = {
    BMW: "#2563eb",        // blue
    Audi: "#111827",       // black
    Benz: "#6b7280",       // silver
    Mercedes: "#6b7280",
    Toyota: "#dc2626",     // red
    Honda: "#16a34a",      // green
    Hyundai: "#0891b2",    // teal
    Kia: "#7c3aed",        // violet
    Ford: "#1d4ed8",       // dark blue
    Tata: "#0f766e",       // dark teal
    Mahindra: "#92400e",   // brown
    Renault: "#f59e0b",    // yellow
    Nissan: "#374151",     // gray
    Volkswagen: "#0ea5e9", // light blue
    Skoda: "#15803d",      // green
  };


  const getColor = (name, index) => {
    if (BRAND_COLORS[name]) return BRAND_COLORS[name];
    return colors[index % colors.length];
  };


  const [stats1, setStats1] = useState({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "bookings"));

    const unsub = onSnapshot(q, (snap) => {
      const counts = {};
      let sum = 0;

      snap.forEach((doc) => {
        const data = doc.data();

        // ❗ use model instead of brand
        const brand = data.model || "Unknown";

        // ❗ count bookings instead of stock
        const value = 1;

        // ❗ ignore cancelled (optional)
        if (data.status === "Cancelled") return;

        counts[brand] = (counts[brand] || 0) + value;
        sum += value;
      });

      setStats1(counts);
      setTotal(sum);
    });

    return () => unsub();
  }, []);


  const colors = [
    "#2563eb", // royal blue
    "#16a34a", // emerald green
    "#f97316", // vivid orange
    "#dc2626", // crimson red
    "#7c3aed", // rich violet
    "#0891b2", // teal cyan
    "#db2777", // rose pink
    "#65a30d", // lime green
  ];


  const gradient = (() => {
    let current = 0;
    const entries = Object.entries(stats1);

    if (!total || entries.length === 0) {
      return "conic-gradient(#e5e7eb 0% 100%)";
    }

    const gap = 0.4;

    const parts = entries.map(([name, count], i) => {
      const percent = (count / total) * 100;
      const start = current + gap;
      current += percent;
      const end = current - gap;

      return `${getColor(name, i)} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  })();



  const [rows, setRows] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "carInventory"),
      orderBy("updatedAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRows(data);
    });

    return () => unsub();
  }, []);



  return (
    <div className="min-h-screen  p-2">
      {/* ===== QUICK ACCESS ===== */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Add Service Vehicle", icon: "🚗", path: "/admin/addservicevehicle", color: "from-sky-500 to-cyan-400" },
            { label: "Add Booking", icon: "📅", path: "/admin/addbooking", color: "from-blue-500 to-indigo-400" },
            { label: "Add Billing", icon: "🧾", path: "/admin/addbillings", color: "from-emerald-500 to-green-400" },
            { label: "Add Staff", icon: "👨‍🔧", path: "/admin/addstaff", color: "from-violet-500 to-purple-400" },
            { label: "Add Inventory", icon: "📦", path: "/admin/additemsinventory", color: "from-orange-500 to-amber-400" },
            { label: "Add Product", icon: "🛒", path: "/admin/addproducts", color: "from-rose-500 to-pink-400" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 group`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">

        <GradientStatCard
          title="TODAY BOOKINGS"
          value={topStats.todayBookings}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-blue-500 to-blue-300"
        />

        <GradientStatCard
          title="TOTAL SERVICES"
          value={topStats.totalServices}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-300"
        />

        <GradientStatCard
          title="TOTAL CUSTOMERS"
          value={topStats.totalCustomers}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-purple-500 to-violet-400"
        />

        <GradientStatCard
          title="TOTAL EMPLOYEES"
          value={topStats.totalEmployees}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-cyan-500 to-sky-400"
        />

        <GradientStatCard
          title="TOTAL PRODUCTS"
          value={topStats.totalProducts}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-pink-500 to-rose-400"
        />

        <GradientStatCard
          title="TOTAL ORDERS"
          value={topStats.totalOrders}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-orange-500 to-amber-400"
        />

        <GradientStatCard
          title="TOTAL EARNINGS"
          value={`₹ ${topStats.totalEarnings.toLocaleString("en-IN")}`}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-green-500 to-emerald-400"
        />

        <GradientStatCard
          title="DELIVERY ORDERS"
          value={topStats.totalDeliveryOrders}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-pink-500 to-rose-400"
        />

      </div>
      <div >


        {/* TWO COLUMNS INSIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* APPOINTMENTS */}
          <div className="bg-white rounded-2xl mb-9 shadow-sm border border-gray-100 p-5">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
              <h4 className="font-semibold text-gray-800 text-lg">
                Booking Services
              </h4>

              {/* LEGEND */}
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { color: "bg-blue-500", label: "This Week" },
                  { color: "bg-green-500", label: "Last Week" },
                  { color: "bg-yellow-500", label: "Pending" },
                  { color: "bg-emerald-600", label: "Completed" },
                  { color: "bg-red-600", label: "Cancelled" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* BAR CHART */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                    domain={[0, "dataMax + 2"]}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />

                  {/* THIS WEEK */}
                  <Bar
                    dataKey="thisWeek"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />

                  {/* LAST WEEK */}
                  <Bar
                    dataKey="lastWeek"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />

                  {/* PENDING */}
                  <Bar
                    dataKey="pending"
                    fill="#eab308"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />

                  {/* COMPLETED */}
                  <Bar
                    dataKey="completed"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />

                  {/* CANCELLED */}
                  <Bar
                    dataKey="cancelled"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 mt-5 gap-3 text-center">
              <div className="bg-yellow-50 text-yellow-600 rounded-xl py-3 font-semibold shadow-sm">
                Pending: {counts?.pending ?? 0}
              </div>

              <div className="bg-green-50 text-green-600 rounded-xl py-3 font-semibold shadow-sm">
                Completed: {counts?.completed ?? 0}
              </div>

              <div className="bg-red-50 text-red-600 rounded-xl py-3 font-semibold shadow-sm">
                Cancelled: {counts?.cancelled ?? 0}
              </div>
            </div>
          </div>



          <div className="bg-white rounded-2xl mb-9 shadow-sm border border-gray-100 p-6">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">
                Financial Overview
              </h4>

              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                This Year
              </span>
            </div>

            {/* TOTAL */}
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ₹ {(monthlyTotal || 0).toLocaleString("en-IN")}
            </h2>

            {/* CHART */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  {/* GRID */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />

                  {/* X AXIS */}
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* Y AXIS */}
                  <YAxis
                    tickFormatter={(v) =>
                      `₹${Number(v).toLocaleString("en-IN")}`
                    }
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />

                  {/* TOOLTIP */}
                  <Tooltip
                    formatter={(v) =>
                      `₹ ${Number(v).toLocaleString("en-IN")}`
                    }
                    cursor={{ fill: "rgba(14,165,233,0.08)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    }}
                  />

                  {/* GRADIENT */}
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>

                  {/* BAR */}
                  <Bar
                    dataKey="revenue"
                    fill="url(#revenueGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={52}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>
      </div>


      {/* PATIENT + TREATMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* PATIENT LIST */}
        <div className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Booking List</h3>
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/carservies")}
            >
              View All
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 border-collapse">

                {/* TABLE HEAD */}
                <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
                  <tr>
                    <th className="px-3 py-4 text-left font-bold">S No</th>
                    <th className="px-3 py-4 text-left font-bold">Customer</th>
                    <th className="px-3 py-4 text-left font-bold">Contact</th>
                    <th className="px-3 py-4 text-left font-bold">Car</th>
                    <th className="px-3 py-4 text-left font-bold">Last Visit</th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                  {patients.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/services/view/${item.id}`)}
                    >
                      {/* S No */}
                      <td className="px-3 py-3 font-semibold">
                        {index + 1}
                      </td>

                      {/* CUSTOMER NAME + BOOKING ID */}
                      <td className="px-3 py-3">
                        <div className="font-medium">{item.name || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {item.bookingId || "-"}
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-3 py-3">
                        {item.phone || "-"}
                        {item.altPhone && (
                          <div className="text-xs text-gray-400">
                            Alt: {item.altPhone}
                          </div>
                        )}
                      </td>

                      {/* CAR */}
                      <td className="px-3 py-3">
                        {item.brand || "-"} {item.model || ""}
                      </td>

                      {/* LAST VISIT */}
                      <td className="px-3 py-3">
                        {item.createdAt
                          ? formatDate(item.createdAt)
                          : "-"}
                      </td>
                    </tr>
                  ))}

                  {patients.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-6 text-gray-400"
                      >
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>


        {/* TREATMENT STATS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-5">
            Car Products by Brand
          </h3>

          <div className="flex-1 w-full space-y-3 text-sm">
            {Object.entries(stats1).map(([brand, stock], index) => {
              const percent = total
                ? Math.round((stock / total) * 100)
                : 0;

              return (
                <div
                  key={brand}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColor(brand, index),
                      }}
                    />
                    <span className="font-medium text-gray-700">
                      {brand}
                    </span>
                  </div>

                  {/* STOCK + % */}
                  <span className="text-gray-600">
                    {stock} • {percent}%
                  </span>
                </div>
              );
            })}

            {total === 0 && (
              <div className="text-center text-gray-400 py-6">
                No products found
              </div>
            )}
          </div>

          <div className="relative flex mt-10 items-center justify-center">
            {/* OUTER DONUT */}
            <div
              className="w-40 h-40 rounded-full"
              style={{ background: gradient }}
            />

            {/* INNER CIRCLE */}
            <div className="absolute w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
              <p className="text-2xl font-bold text-white leading-none">
                {total}
              </p>
              <p className="text-[10px] text-gray-300 leading-none">
                Total Bookings
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* FOLLOW UPS + EQUIPMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FOLLOW UPS */}


        {/* INVENTORY PREVIEW */}
        <div className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Inventory Status</h3>
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/inventory")}
            >
              View All
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
                  <tr>
                    <th className="px-3 py-4 text-left font-bold">S No</th>
                    <th className="px-3 py-4 text-left font-bold">Item</th>
                    <th className="px-3 py-4 text-left font-bold">Category</th>
                    <th className="px-3 py-4 text-left font-bold">Stock</th>
                    <th className="px-3 py-4 text-left font-bold">Min</th>
                    <th className="px-3 py-4 text-left font-bold">Supplier</th>
                  </tr>
                </thead>

                <tbody>
                  {/* EMPTY STATE */}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-400">
                        No inventory found
                      </td>
                    </tr>
                  )}

                  {/* TABLE ROWS */}
                  {rows.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`border-b  border-gray-300 ${r.stockQty <= r.minStock
                        ? "bg-red-50 text-red-700"
                        : "hover:bg-gray-50"
                        }`}
                    >
                      {/* S No */}
                      <td className="px-3 py-4">{index + 1}</td>

                      {/* PART NAME */}
                      <td className="px-3 py-4">
                        {r.partName}
                      </td>

                      {/* CATEGORY */}
                      <td className="px-3 py-4">
                        {r.category}
                      </td>

                      {/* STOCK QTY */}
                      <td className="px-3 py-4 ">
                        {r.stockQty}
                      </td>

                      {/* MIN STOCK */}
                      <td className="px-3 py-4 ">
                        {r.minStock}
                      </td>

                      {/* VENDOR */}
                      <td className="px-3 py-4">
                        {r.vendor}
                      </td>
                    </tr>
                  ))}
                </tbody>


              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;




