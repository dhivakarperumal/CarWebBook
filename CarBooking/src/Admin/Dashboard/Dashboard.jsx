import React, { useEffect, useState, useMemo } from "react";
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

import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

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
      <p className="text-xs font-semibold opacity-90 tracking-wide">
        {title}
      </p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
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

// Global cache for instant dashboard loading
let dashboardCache = null;

const Dashboard = () => {
  const navigate = useNavigate();

  const [topStats, setTopStats] = useState(dashboardCache?.topStats || {
    todayBookings: 0,
    todayCustomers: 0,
    totalServices: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalOrders: 0,
    totalDeliveryOrders: 0,
    totalProducts: 0,
    totalEarnings: 0,
    totalBilling: 0,
    totalCars: 0,
    totalBikes: 0,
    totalVehicleBookings: 0,
  });

  const [appointmentData, setAppointmentData] = useState(dashboardCache?.appointmentData || []);
  const [counts, setCounts] = useState(dashboardCache?.counts || {
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [revenueData, setRevenueData] = useState(dashboardCache?.revenueData || []);
  const [monthlyTotal, setMonthlyTotal] = useState(dashboardCache?.monthlyTotal || 0);

  const [patients, setPatients] = useState(dashboardCache?.patients || []);
  const [stats1, setStats1] = useState(dashboardCache?.stats1 || {});
  const [total, setTotal] = useState(dashboardCache?.total || 0);
  const [rows, setRows] = useState(dashboardCache?.rows || []);
  const [loading, setLoading] = useState(!dashboardCache);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!dashboardCache) setLoading(true);
      // Due to the absence of a unified dashboard backend route,
      // we'll parallel fetch from the MySQL APIs we have available.
      // We will catch individual errors to prevent complete dashboard crash if one API is missing
      const fetchSafe = async (endpoint) => {
        try {
          const res = await api.get(endpoint);
          return res.data;
        } catch (err) {
          console.warn(`Failed to fetch ${endpoint} for dashboard`, err);
          return [];
        }
      };

      const [
        bookingsData,
        servicesData,
        staffData,
        ordersData,
        billingsData,
        productsData,
        inventoryData,
        bikesData,
        vehicleBookingsData,
      ] = await Promise.all([
        fetchSafe("/bookings"),
        fetchSafe("/all-services"),
        fetchSafe("/staff"),
        fetchSafe("/orders"),
        fetchSafe("/billings"),
        fetchSafe("/products"),
        fetchSafe("/inventory"),
        fetchSafe("/bikes"),
        fetchSafe("/vehicle-bookings"),
      ]);

      // Users might be available indirectly from bookings or a direct users endpoint.
      // We'll estimate from bookings for now if users endpoint doesn't exist
      const usersData = await fetchSafe("/auth/users") || []; 

      // Date calculations
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= todayStart && d <= todayEnd;
      };

      // 1. TOP STATS
      
      const todayBookingsCount = bookingsData.filter(b => isToday(b.created_at || b.createdAt) && (b.status || "").toLowerCase() === "booked").length;
      
      // Calculate total earnings & billing
      let earnings = 0;
      let totalBilling = 0;
      billingsData.forEach((b) => {
        const grandTotal = Number(b.grandTotal || 0);
        totalBilling += grandTotal;
        
        const status = (b.paymentStatus || "").toLowerCase();
        if (status === "paid") earnings += grandTotal;
        if (status === "partial") earnings += Number(b.paidAmount || 0);
      });

      const todayCustomers = new Set();
      const allCustomers = new Set();

      bookingsData.forEach(b => {
        if (b.phone) {
          allCustomers.add(b.phone);
          if (isToday(b.created_at || b.createdAt)) todayCustomers.add(b.phone);
        }
      });

      // 2. APPOINTMENTS CHART
      const getWeekRange = (offset = 0) => {
        const today = new Date();
        const day = today.getDay() || 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - day + 1 - offset * 7);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { start: monday, end: sunday };
      };

      const thisWeek = getWeekRange(0);
      const lastWeek = getWeekRange(1);
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const baseData = days.map((d) => ({
        day: d,
        thisWeek: 0,
        lastWeek: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
      }));

      const tempCounts = { pending: 0, completed: 0, cancelled: 0 };
      const pieCounts = {};
      let pieSum = 0;

      bookingsData.forEach((data) => {
        const rawStatus = String(data.status || "").toLowerCase().trim();
        let status = "pending";
        if (rawStatus === "service completed") status = "completed";
        if (rawStatus === "cancelled") status = "cancelled";

        const baseDateStr = (status === "completed" || status === "cancelled")
            ? (data.updatedAt || data.updated_at || data.createdAt || data.created_at)
            : (data.createdAt || data.created_at);

        if (baseDateStr) {
          const date = new Date(baseDateStr);
          date.setHours(0, 0, 0, 0);
          const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

          if (date.getTime() === todayStart.getTime()) {
            if (status === "pending") tempCounts.pending++;
            if (status === "completed") tempCounts.completed++;
            if (status === "cancelled") tempCounts.cancelled++;
          }

          if (date >= thisWeek.start && date <= thisWeek.end) {
            baseData[dayIndex].thisWeek++;
            if (status === "pending") baseData[dayIndex].pending++;
            if (status === "completed") baseData[dayIndex].completed++;
            if (status === "cancelled") baseData[dayIndex].cancelled++;
          }
          if (date >= lastWeek.start && date <= lastWeek.end) baseData[dayIndex].lastWeek++;
        }
        if (rawStatus !== "cancelled") {
          const brand = data.brand || data.model || "Unknown";
          pieCounts[brand] = (pieCounts[brand] || 0) + 1;
          pieSum += 1;
        }
      });

      // 3. REVENUE CHART
      const now = new Date();
      const currentMonth = now.getMonth();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthly = months.map((m) => ({ month: m, revenue: 0 }));
      let thisMonthTotal = 0;

      billingsData.forEach((data) => {
        const billedAmount = Number(data.grandTotal || 0);
        if (billedAmount > 0) {
          const date = new Date(data.created_at || data.createdAt);
          if (date.getFullYear() === now.getFullYear()) {
            const monthIndex = date.getMonth();
            monthly[monthIndex].revenue += billedAmount;
            if (monthIndex === currentMonth) thisMonthTotal += billedAmount;
          }
        }
      });

      const sortedBookings = [...bookingsData].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
      const sortedInventory = [...inventoryData].sort((a, b) => new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0));

      const newCache = {
        topStats: {
          todayBookings: todayBookingsCount,
          todayCustomers: todayCustomers.size,
          totalServices: servicesData.length,
          totalCustomers: allCustomers.size > 0 ? allCustomers.size : usersData.length,
          totalEmployees: staffData.length,
          totalOrders: ordersData.length,
          totalDeliveryOrders: ordersData.filter(o => ["delivered", "shipped", "completed"].includes((o.status || "").toLowerCase())).length,
          totalProducts: productsData.length,
          totalEarnings: earnings,
          totalBilling: totalBilling,
          totalCars: (bikesData || []).filter(b => b.type === "Car").length,
          totalBikes: (bikesData || []).filter(b => b.type === "Bike").length,
          totalVehicleBookings: (vehicleBookingsData || []).length, 
        },
        appointmentData: baseData,
        counts: tempCounts,
        revenueData: monthly,
        monthlyTotal: thisMonthTotal,
        patients: sortedBookings.slice(0, 5),
        stats1: pieCounts,
        total: pieSum,
        rows: sortedInventory.slice(0, 5)
      };

      setTopStats(newCache.topStats);
      setAppointmentData(newCache.appointmentData);
      setCounts(newCache.counts);
      setRevenueData(newCache.revenueData);
      setMonthlyTotal(newCache.monthlyTotal);
      setPatients(newCache.patients);
      setStats1(newCache.stats1);
      setTotal(newCache.total);
      setRows(newCache.rows);
      
      dashboardCache = newCache;

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const BRAND_COLORS = {
    BMW: "#2563eb",        
    Audi: "#111827",       
    Benz: "#6b7280",       
    Mercedes: "#6b7280",
    Toyota: "#dc2626",     
    Honda: "#16a34a",      
    Hyundai: "#0891b2",    
    Kia: "#7c3aed",        
    Ford: "#1d4ed8",       
    Tata: "#0f766e",       
    Mahindra: "#92400e",   
    Renault: "#f59e0b",    
    Nissan: "#374151",     
    Volkswagen: "#0ea5e9", 
    Skoda: "#15803d",      
  };

  const colors = [
    "#2563eb", "#16a34a", "#f97316", "#dc2626",
    "#7c3aed", "#0891b2", "#db2777", "#65a30d",
  ];

  const getColor = (name, index) => {
    if (BRAND_COLORS[name]) return BRAND_COLORS[name];
    return colors[index % colors.length];
  };

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

  const { profileName: userProfile } = useAuth();
  
  const quickActions = [
    { label: "Add Service Vehicle", icon: "🚗", path: "/admin/addservicevehicle", color: "from-sky-500 to-cyan-400" },
    { label: "Add Booking", icon: "📅", path: "/admin/addbooking", color: "from-blue-500 to-indigo-400" },
    { label: "Add Billing", icon: "🧾", path: "/admin/addbillings", color: "from-emerald-500 to-green-400" },
    { label: "Add Staff", icon: "👨‍🔧", path: "/admin/addstaff", color: "from-violet-500 to-purple-400" },
    { label: "Add Inventory", icon: "📦", path: "/admin/additemsinventory", color: "from-orange-500 to-amber-400" },
    { label: "Add Product", icon: "🛒", path: "/admin/addproducts", color: "from-rose-500 to-pink-400" },
  ];

  return (
    <div className="min-h-screen p-2">
      {/* ===== QUICK ACCESS ===== */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
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
          title="TOTAL BILLING"
          value={`₹ ${(topStats.totalBilling || 0).toLocaleString("en-IN")}`}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-green-600 to-emerald-500"
        />
        <GradientStatCard
          title="TOTAL EARNINGS (PAID)"
          value={`₹ ${(topStats.totalEarnings || 0).toLocaleString("en-IN")}`}
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
        <GradientStatCard
          title="TOTAL CARS"
          value={topStats.totalCars}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-emerald-600 to-teal-400"
        />
        <GradientStatCard
          title="TOTAL BIKES"
          value={topStats.totalBikes}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-blue-600 to-sky-400"
        />
        <GradientStatCard
          title="TOTAL VEHICLE BOOKINGS"
          value={topStats.totalVehicleBookings}
          change="+"
          isUp={true}
          gradient="bg-gradient-to-r from-orange-400 to-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* APPOINTMENTS */}
        <div className="bg-white rounded-2xl mb-9 shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
            <h4 className="font-semibold text-gray-800 text-lg">Booking Services</h4>
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentData || []} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, "dataMax + 2"]} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="thisWeek" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="lastWeek" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="pending" fill="#eab308" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="completed" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="cancelled" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

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

        {/* REVENUE */}
        <div className="bg-white rounded-2xl mb-9 shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Financial Overview</h4>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">This Year</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ₹ {(monthlyTotal || 0).toLocaleString("en-IN")}
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${Number(v || 0).toLocaleString("en-IN")}`} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`} cursor={{ fill: "rgba(14,165,233,0.08)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }} />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} barSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* PATIENT/BOOKING LIST */}
        <div className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Booking List</h3>
            <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/admin/bookings")}>
              View All
            </span>
          </div>

          <div className="bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 border-collapse">
                <thead className="bg-[#020617] text-white">
                  <tr>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Customer</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Contact</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Car</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Booking Date</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/services/${item.id}`)}
                    >
                      <td className="px-3 py-3 font-semibold">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{item.name || "-"}</div>
                        <div className="text-xs text-gray-500">{item.bookingId || "-"}</div>
                      </td>
                      <td className="px-3 py-3">
                        {item.phone || "-"}
                        {item.altPhone && <div className="text-xs text-gray-400">Alt: {item.altPhone}</div>}
                      </td>
                      <td className="px-3 py-3">{item.brand || "-"} {item.model || ""}</td>
                      <td className="px-3 py-3">{item.created_at || item.createdAt ? formatDate(item.created_at || item.createdAt) : "-"}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-400">No bookings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CAR MODELS STATS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Bookings by Car Model</h3>
          <div className="flex-1 w-full space-y-3 text-sm">
            {Object.entries(stats1).map(([brand, stock], index) => {
              const percent = total ? Math.round((stock / total) * 100) : 0;
              return (
                <div key={brand} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(brand, index) }} />
                    <span className="font-medium text-gray-700">{brand}</span>
                  </div>
                  <span className="text-gray-600">{stock} • {percent}%</span>
                </div>
              );
            })}
            {total === 0 && <div className="text-center text-gray-400 py-6">No data found</div>}
          </div>

          <div className="relative flex mt-10 items-center justify-center">
            <div className="w-40 h-40 rounded-full" style={{ background: gradient }} />
            <div className="absolute w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
              <p className="text-2xl font-bold text-white leading-none">{total}</p>
              <p className="text-[10px] text-gray-300 leading-none">Total Bookings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INVENTORY PREVIEW */}
        <div className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Inventory Status</h3>
            <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/admin/inventory")}>
              View All
            </span>
          </div>

          <div className="bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-[#020617] text-white">
                  <tr>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Item</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Category</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Stock</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Min</th>
                    <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-400">No inventory found</td>
                    </tr>
                  )}
                  {rows.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-300 ${(r.stockQty || r.quantity) <= (r.minStock || 0) ? "bg-red-50 text-red-700" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-3 py-4">{index + 1}</td>
                      <td className="px-3 py-4">{r.partName || r.name}</td>
                      <td className="px-3 py-4">{r.category}</td>
                      <td className="px-3 py-4">{r.stockQty || r.quantity}</td>
                      <td className="px-3 py-4">{r.minStock || 0}</td>
                      <td className="px-3 py-4">{r.vendor || r.supplier || '-'}</td>
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
