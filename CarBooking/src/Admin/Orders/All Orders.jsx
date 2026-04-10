import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  FaPrint,
  FaTruck,
  FaClipboardList,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSearch,
  FaTimesCircle,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

/* ================= HELPERS ================= */

const normalizeKey = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const formatStatusLabel = (status) => {
  const k = normalizeKey(status);
  const map = {
    orderplaced: "Order Placed",
    processing: "Processing",
    packing: "Packing",
    outfordelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[k] || status || "-";
};

const ORDER_STATUS_LIST = [
  { id: "orderplaced", label: "Order Placed" },
  { id: "processing", label: "Processing" },
  { id: "packing", label: "Packing" },
  { id: "outfordelivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const getCustomerDetails = (o) => {
  const name = o.customerName || o.customer_name || o.shippingName || o.shipping_name || o.customer?.name || o.shipping?.name || "-";
  return { name };
};

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white border border-gray-300 rounded-md p-6">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-black">{title}</p>
        <h2 className="text-2xl font-bold text-black">{value}</h2>
      </div>
      <div className={`p-3 rounded-xl text-white bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ================= PAGE ================= */
// Global cache for seamless navigation
let ordersCache = null;

const AllOrders = () => {
  const [orders, setOrders] = useState(ordersCache || []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState("today"); // default → today
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [view, setView] = useState("table");
  const navigate = useNavigate();

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  /* ================= LOAD ================= */
  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
      ordersCache = res.data;
    } catch {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(
      (o) => normalizeKey(o.status) === "delivered"
    ).length;
    const cancelled = orders.filter(
      (o) => normalizeKey(o.status) === "cancelled"
    ).length;
    const paid = orders.filter(
      (o) => normalizeKey(o.paymentStatus) === "paid"
    ).length;

    const revenue = orders
      .filter((o) => normalizeKey(o.status) !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return { total, delivered, cancelled, paid, revenue };
  }, [orders]);

  /* ================= HELPERS: parse order date ================= */
  const parseOrderDate = (raw) => {
    if (!raw) return null;
    if (raw?.toDate) return raw.toDate();
    if (raw?.seconds) return new Date(raw.seconds * 1000);
    return new Date(raw);
  };

  /* ================= FILTER ================= */
  const filteredOrders = orders.filter((o) => {
    const customer = getCustomerDetails(o);

    const matchSearch =
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      customer.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      normalizeKey(o.status) === normalizeKey(statusFilter);

    const matchPayment =
      paymentFilter === "all" ||
      normalizeKey(o.paymentStatus) === normalizeKey(paymentFilter);

    // DELIVERY ONLY
    if (deliveryOnly && !normalizeKey(o.status).includes("delivered")) return false;

    // DATE FILTER
    if (dateFilter !== "all") {
      const orderDate = parseOrderDate(o.createdAt);
      if (!orderDate) return false;

      const now = new Date();
      const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (dateFilter === "today") {
        if (startOfDay(orderDate).getTime() !== startOfDay(now).getTime()) return false;
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (startOfDay(orderDate).getTime() !== startOfDay(yesterday).getTime()) return false;
      } else if (dateFilter === "thisweek") {
        const dayOfWeek = now.getDay(); // 0=Sun
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        if (orderDate < startOfDay(weekStart) || orderDate > now) return false;
      } else if (dateFilter === "thismonth") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (orderDate < monthStart || orderDate > now) return false;
      } else if (dateFilter === "custom") {
        if (customFrom) {
          const from = new Date(customFrom);
          if (startOfDay(orderDate) < from) return false;
        }
        if (customTo) {
          const to = new Date(customTo);
          to.setHours(23, 59, 59, 999);
          if (orderDate > to) return false;
        }
      }
    }

    return matchSearch && matchStatus && matchPayment;
  });

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter, deliveryOnly, dateFilter, customFrom, customTo]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (orderId, newStatus) => {
    let reason = null;

    if (newStatus === "cancelled") {
      reason = window.prompt("Enter cancel reason:");
      if (reason === null) return;
    }

    try {
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        cancelledReason: newStatus === "cancelled" ? reason : null
      });
      toast.success("Status updated");
      loadOrders();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  /* ================= PRINT ================= */
  const printOrder = async (orderSummary) => {
    let o = orderSummary;
    
    try {
      toast.loading("Preparing invoice...", { id: "print-load" });
      const res = await api.get(`/orders/${orderSummary.id}`);
      o = res.data;
      toast.dismiss("print-load");
    } catch (err) {
      console.error("Failed to fetch order details for printing", err);
      toast.dismiss("print-load");
    }

    const customer = getCustomerDetails(o);
    const date = parseOrderDate(o.createdAt)?.toLocaleDateString("en-IN") || "-";
    const items = o.items || [];

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    doc.write(`
      <html>
        <head>
          <title>Order Invoice - ${o.orderId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .logo-section img { height: 60px; object-fit: contain; margin-bottom: 10px; }
            .company-info { font-size: 11px; color: #64748b; }
            .company-info h2 { color: #0f172a; margin: 0 0 4px 0; font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: -0.5px; }
            .invoice-label { text-align: right; }
            .invoice-label h1 { margin: 0; font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
            .invoice-label p { margin: 4px 0 0 0; font-weight: 700; color: #64748b; font-size: 12px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; padding: 24px; background: #f8fafc; rounded-2xl; border: 1px solid #f1f5f9; }
            .info-block h4 { margin: 0 0 12px 0; color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; }
            .info-block p { margin: 0 0 4px 0; font-weight: 700; font-size: 14px; color: #0f172a; }
            .info-block .sub-text { font-weight: 400; font-size: 12px; color: #64748b; }
            
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
            th { text-align: left; background: #0f172a; padding: 14px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #fff; letter-spacing: 1px; }
            th:first-child { border-radius: 12px 0 0 0; }
            th:last-child { border-radius: 0 12px 0 0; text-align: right; }
            td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; }
            td:last-child { text-align: right; }
            .item-brand { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
            
            .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
            .total-section { background: #0f172a; padding: 24px; border-radius: 20px; color: #fff; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: #94a3b8; font-weight: 700; }
            .total-row.grand { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; padding-top: 20px; font-weight: 900; font-size: 24px; color: #fff; }
            .total-row.grand span:last-child { color: #22d3ee; }
            
            .notes { font-size: 11px; color: #94a3b8; line-height: 1.6; }
            .notes h4 { color: #0f172a; text-transform: uppercase; font-weight: 900; margin-bottom: 8px; }

            @media print { 
              body { padding: 0; }
              .info-grid { background: #fff !important; border: 1px solid #eee; }
              .total-section { background: #000 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-top">
            <div class="logo-section">
              <img src="/logo_no_bg.png" alt="Logo" />
              <div class="company-info">
                <h2>CARBOOKING HUB</h2>
                <p>123 Service Street, Automotive Zone</p>
                <p>Chennai, Tamil Nadu - 600001</p>
                <p>Contact: +91 98765 43210 | support@carhub.com</p>
              </div>
            </div>
            <div class="invoice-label">
              <h1>INVOICE</h1>
              <p>ID: ${o.orderId}</p>
              <p>DATE: ${date}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <h4>Billed To</h4>
              <p>${customer.name}</p>
              <div class="sub-text">
                ${o.phone || o.mobile || o.shippingPhone || "-"} <br/>
                ${o.shippingAddress || o.address || "-"}
              </div>
            </div>
            <div class="info-block" style="text-align: right">
              <h4>Payment Summary</h4>
              <p style="color: ${o.paymentStatus === "paid" ? "#10b981" : "#f59e0b"}">
                ${(o.paymentStatus || "Pending").toUpperCase()}
              </p>
              <div class="sub-text">VIA ${(o.paymentMethod || "COD").toUpperCase()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center">Qty</th>
                <th style="text-align: right">Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.length > 0 ? items.map(item => `
                <tr>
                  <td>
                    <div>${item.name || "Product"}</div>
                    <div class="item-brand">${item.brand || "Authentic Parts"} ${item.variant ? `• ${item.variant}` : ""}</div>
                  </td>
                  <td style="text-align: center">${item.qty || item.quantity || 1}</td>
                  <td style="text-align: right">₹ ${Number(item.price || 0).toLocaleString("en-IN")}</td>
                  <td>₹ ${Number(item.total || (item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString("en-IN")}</td>
                </tr>
              `).join("") : `
                <tr>
                  <td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px;">No items found in this order manifest.</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="footer-grid">
            <div class="notes">
              <h4>Terms & Conditions</h4>
              <p>1. Please keep this invoice for any warranty claims.<br/>
                 2. Warranty is applicable only on selected spare parts as per manufacturer policy.<br/>
                 3. This is a computer-generated document and does not require a physical signature.</p>
            </div>
            <div class="total-section">
              <div class="total-row">
                <span>SUBTOTAL</span>
                <span>₹ ${Number(o.subtotal || o.total || 0).toLocaleString("en-IN")}</span>
              </div>
              <div class="total-row">
                <span>ESTIMATED TAX (GST 0%)</span>
                <span>₹ 0.00</span>
              </div>
              <div class="total-row grand">
                <span>TOTAL</span>
                <span>₹ ${Number(o.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 80px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            <p style="font-size: 12px; font-weight: 900; color: #0f172a; margin: 0;">THANK YOU FOR YOUR TRUST!</p>
            <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">Visit us again at www.carhubservice.com</p>
          </div>
        </body>
      </html>
    `);

    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 500);
  };

  /* ================= STATUS BADGE ================= */
  const statusBadge = (status) => {
    const key = normalizeKey(status);

    const configs = {
      orderplaced: { bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100", label: "Order Placed" },
      processing: { bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100", label: "Processing" },
      packing: { bg: "bg-purple-50/50", text: "text-purple-600", border: "border-purple-100", label: "Packing" },
      outfordelivery: { bg: "bg-cyan-50/50", text: "text-cyan-600", border: "border-cyan-100", label: "Out Delivery" },
      delivered: { bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100", label: "Delivered" },
      cancelled: { bg: "bg-rose-50/50", text: "text-rose-600", border: "border-rose-100", label: "Cancelled" },
    };

    const config = configs[key] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100", label: status };

    return (
      <span
        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all duration-300 ${config.bg} ${config.text} ${config.border} hover:scale-105 inline-block`}
      >
        {config.label}
      </span>
    );
  };


  return (
    <div className="space-y-8 text-black">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FaClipboardList />} gradient="from-blue-500 to-cyan-500" />
        <StatCard title="Delivered" value={stats.delivered} icon={<FaTruck />} gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle />} gradient="from-red-500 to-rose-500" />
        <StatCard title="Paid" value={stats.paid} icon={<FaCheckCircle />} gradient="from-green-500 to-emerald-500" />
        <StatCard title="Revenue" value={`₹ ${stats.revenue.toLocaleString("en-IN")}`} icon={<FaMoneyBillWave />} gradient="from-indigo-500 to-violet-500" />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between ">

        {/* 🔎 SEARCH */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search Order ID or Member"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-sm
      focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
          />
        </div>

        {/* 🎯 FILTERS */}
        <div className="flex flex-wrap gap-2 items-center">

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[42px] min-w-[150px] rounded-lg bg-white border border-gray-300 px-4 text-sm
      focus:ring-2 focus:ring-indigo-500 outline-none transition"
          >
            <option value="all">All Status</option>
            <option value="orderplaced">Order Placed</option>
            <option value="processing">Processing</option>
            <option value="packing">Packing</option>
            <option value="outfordelivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* PAYMENT */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-[42px] min-w-[150px] rounded-lg bg-white border border-gray-300 px-4 text-sm
      focus:ring-2 focus:ring-emerald-500 outline-none transition"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          {/* 📅 DATE FILTER DROPDOWN */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCustomFrom(""); setCustomTo(""); }}
            className="h-[42px] min-w-[160px] rounded-lg bg-white border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisweek">This Week</option>
            <option value="thismonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* 📅 CUSTOM RANGE PICKERS */}
          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-[42px] rounded-lg bg-white border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
              />
              <span className="self-center text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-[42px] rounded-lg bg-white border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
              />
            </>
          )}

          {/* 🚚 DELIVERY TOGGLE */}
          <button
            onClick={() => setDeliveryOnly((prev) => !prev)}
            className={`px-4 py-2.5 rounded-lg text-sm border flex items-center gap-2 transition font-medium
      ${deliveryOnly
                ? "bg-black text-white border-black shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            <FaTruck /> Delivery Only
          </button>

          {/* 🔄 VIEW TOGGLE */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 transition ${view === "table"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              <FaList />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-3 transition ${view === "grid"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>


      {/* ================= TABLE VIEW ================= */}
      {view === "table" && (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden group/container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap border-separate border-spacing-0">
              <thead className="text-white relative">
                <tr className="relative z-10">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90 first:rounded-tl-[2rem]">Order ID</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Customer</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Amount</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Payment</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Status</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Update Status</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-90 last:rounded-tr-[2rem]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((o) => (
                  <tr 
                    key={o.id} 
                    className="hover:bg-slate-50/80 transition-all duration-300 group/row"
                  >
                    <td 
                      onClick={() => navigate(`/admin/orders/${o.id}`)} 
                      className="px-6 py-5 font-black text-slate-400 group-hover/row:text-cyan-600 cursor-pointer transition-colors"
                    >
                      #{o.orderId}
                    </td>
                    <td 
                      onClick={() => navigate(`/admin/orders/${o.id}`)} 
                      className="px-6 py-5 cursor-pointer"
                    >
                      <div className="font-bold text-slate-800 tracking-tight group-hover/row:translate-x-1 transition-transform">{o.customerName || o.shippingName || "-"}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{o.shippingCity || "Local Order"}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 leading-none">₹ {Number(o.total).toLocaleString("en-IN")}</span>
                        <span className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-tight">{o.items?.length || 0} ITEMS</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${o.paymentStatus === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse'}`} />
                        <span className="font-black text-[11px] uppercase tracking-wider text-slate-600">{o.paymentStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">{statusBadge(o.status)}</td>
                    <td className="px-6 py-5">
                      <div className="relative inline-block w-full max-w-[140px]">
                        <select
                          value={normalizeKey(o.status)}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer transition-all hover:bg-white"
                        >
                          {ORDER_STATUS_LIST.slice(
                            ORDER_STATUS_LIST.findIndex((s) => s.id === normalizeKey(o.status)) === -1
                              ? 0
                              : ORDER_STATUS_LIST.findIndex((s) => s.id === normalizeKey(o.status))
                          )
                          .filter(s => {
                            const current = normalizeKey(o.status);
                            if (current === "outfordelivery" || current === "delivered") {
                              return s.id !== "cancelled";
                            }
                            return true;
                          })
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => printOrder(o)}
                        className="mx-auto flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-cyan-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                      >
                        <FaPrint className="text-cyan-400 group-hover/row:text-white" />
                        Print Invite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= GRID VIEW ================= */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition space-y-3"
            >
              {/* HEADER */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/orders/${o.id}`);
                }}
                className="flex justify-between items-start cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-gray-800">{o.orderId}</h3>
                  <p className="text-xs text-gray-400">
                    {o.createdAt?.toDate?.().toLocaleDateString("en-IN")}
                  </p>
                </div>

                {statusBadge(o.status)}
              </div>

              {/* CUSTOMER */}
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/orders/${o.id}`);
                }}
                className="text-sm text-gray-600 cursor-pointer"
              >
                {o.customerName || o.shippingName || "-"}
              </p>

              {/* META ROW */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {o.items?.length || 0} items
                </span>


              </div>

              {/* TOTAL */}
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/orders/${o.id}`);
                }}
                className="font-semibold text-lg text-gray-900 cursor-pointer"
              >
                ₹ {Number(o.total).toLocaleString("en-IN")}
              </p>

              {/* PAYMENT CHIP */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${o.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                    }`}
                >
                  {o.paymentStatus}
                </span>

                <span className="text-xs text-gray-400">
                  {o.paymentMethod || "COD"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 justify-between">
                <div>
                  <select
                    value={normalizeKey(o.status)}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs w-full
          focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {ORDER_STATUS_LIST.slice(
                      ORDER_STATUS_LIST.findIndex((s) => s.id === normalizeKey(o.status)) === -1
                        ? 0
                        : ORDER_STATUS_LIST.findIndex((s) => s.id === normalizeKey(o.status))
                    )
                    .filter(s => {
                      const current = normalizeKey(o.status);
                      if (current === "outfordelivery" || current === "delivered") {
                        return s.id !== "cancelled";
                      }
                      return true;
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>



                <div>
                  <button
                    onClick={() => printOrder(o)}
                    className="px-3 py-1 bg-gray-800 hover:bg-black text-white rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <FaPrint />Print
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>


      )}

      {/* ================= PAGINATION ================= */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AllOrders;
