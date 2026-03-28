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

const getCustomerDetails = (o) => {
  return { name: o.shippingName || o.customerName || "-" };
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
const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
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
    // DELIVERY ONLY → SHOW DELIVERED ORDERS ONLY
    if (deliveryOnly) {
      if (!normalizeKey(o.status).includes("delivered")) return false;
    }


    return matchSearch && matchStatus && matchPayment;
  });

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

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
  const printOrder = (o) => {
    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked");

    w.document.write(`<h2>Order ${o.orderId}</h2>`);
    w.document.write(
      `<p>Total: ₹ ${Number(o.total).toLocaleString("en-IN")}</p>`
    );
    w.document.close();
    w.print();
  };

  /* ================= STATUS BADGE ================= */
  const statusBadge = (status) => {
    const key = normalizeKey(status);

    let base = "bg-gray-100 text-gray-700";

    if (key === "orderplaced") {
      base = "bg-blue-100 text-blue-700";
    } else if (key === "processing") {
      base = "bg-amber-100 text-amber-700";
    } else if (key === "packing") {
      base = "bg-purple-100 text-purple-700";
    } else if (key === "outfordelivery") {
      base = "bg-cyan-100 text-cyan-700";
    } else if (key === "delivered") {
      base = "bg-emerald-100 text-emerald-700";
    } else if (key === "cancelled") {
      base = "bg-red-100 text-red-700";
    }

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${base}`}
      >
        {formatStatusLabel(status)}
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
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">

          <table className="min-w-full text-sm shadow">
            <thead className="bg-gradient-to-r  from-black to-cyan-400 shadow text-white text-left">
              <tr>
                <th className="px-4 py-4 text-left">Order ID</th>
                <th className="px-4 py-4 text-left">Member</th>
                <th className="px-4 py-4 text-left">Amount</th>
                <th className="px-4 py-4 text-left">Payment</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Actions</th>
                <th className="px-4 py-4 text-left">Print</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-300 ">
                  <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.id}`) }} className="px-4 py-4">{o.orderId}</td>
                  <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.id}`) }} className="px-4 py-4">
                    {o.shipping?.name || o.customer?.name || "-"}
                  </td>
                  <td className="px-4 py-4">
                    ₹ {Number(o.total).toLocaleString("en-IN")}
                  </td>
                  <td onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o.id}`) }} className="px-4 py-4">{o.paymentStatus}</td>
                  <td className="px-4 py-4">{statusBadge(o.status)}</td>
                  <td className="px-4 py-4 flex gap-2">
                    <select
                      value={normalizeKey(o.status)}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="orderplaced">Order Placed</option>
                      <option value="processing">Processing</option>
                      <option value="packing">Packing</option>
                      <option value="outfordelivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>


                  </td>
                  <td>
                    <button
                      onClick={() => printOrder(o)}
                      className="px-2 py-1 bg-black text-white rounded-lg text-xs flex items-center gap-1"
                    >
                      <FaPrint /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                {o.shipping?.name || o.customer?.name || "-"}
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
                    <option value="orderplaced">Order Placed</option>
                    <option value="processing">Processing</option>
                    <option value="packing">Packing</option>
                    <option value="outfordelivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
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
      <div className="flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-lg border ${currentPage === i + 1
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white/10 border-white/20"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllOrders;
