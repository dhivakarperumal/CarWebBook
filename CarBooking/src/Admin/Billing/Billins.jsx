import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTrashAlt,
  FaPlus,
  FaPrint,
  FaEdit,
  FaFileInvoiceDollar,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

const formatValue = (num) => {
  if (num >= 100000) return (num / 100000).toFixed(1) + " L";
  if (num >= 1000) return (num / 1000).toFixed(1) + " K";
  return num.toLocaleString();
};

/* =========================
   STATUS BADGE
========================= */
const StatusBadge = ({ status }) => {
  const map = {
    paid: "bg-green-500",
    partial: "bg-orange-400",
    pending: "bg-yellow-400",
  };

  const s = status?.toLowerCase() || "pending";

  return (
    <span
      className={`px-3 py-1 rounded-full text-white text-xs capitalize ${map[s] || "bg-gray-400"}`}
    >
      {s}
    </span>
  );
};

/* =========================
   STAT CARD
========================= */
const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white border border-gray-300 rounded-md p-6 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
      </div>
      <div className={`p-4 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-lg shadow-black/10`}>
        {icon}
      </div>
    </div>
  </div>
);

/* =========================
   MAIN
========================= */
const Billings = () => {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountSort, setAmountSort] = useState("none");
  const [dateFilter, setDateFilter] = useState("today"); // default → today
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================
     LOAD BILLINGS
  ========================= */
  const loadBills = async () => {
    try {
      const res = await api.get('/billings');
      setBills(res.data);
    } catch {
      toast.error("Failed to load bills");
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  /* =========================
     STATS
  ========================= */
  const totalRevenue = bills.reduce(
    (sum, b) => sum + Number(b.grandTotal || 0),
    0
  );

  const pendingCount = bills.filter(
    (b) => b.paymentStatus?.toLowerCase() !== "paid"
  ).length;

  const paidCount = bills.filter(
    (b) => b.paymentStatus?.toLowerCase() === "paid"
  ).length;

  /* ================= HELPERS: parse date ================= */
  const parseBillDate = (raw) => {
    if (!raw) return null;
    if (raw?.toDate) return raw.toDate();
    if (raw?.seconds) return new Date(raw.seconds * 1000);
    return new Date(raw);
  };

  /* =========================
     FILTER + SORT
  ========================= */
  const filtered = useMemo(() => {
    let data = bills.filter((b) => {
      const text = `${b.invoiceNo} ${b.customerName} ${b.car} ${b.bookingId}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || b.paymentStatus?.toLowerCase() === statusFilter;

      let matchDate = true;
      if (dateFilter !== "all") {
        const billDate = parseBillDate(b.createdAt);
        if (!billDate) {
          matchDate = false;
        } else {
          const now = new Date();
          const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

          if (dateFilter === "today") {
            if (startOfDay(billDate).getTime() !== startOfDay(now).getTime()) matchDate = false;
          } else if (dateFilter === "yesterday") {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (startOfDay(billDate).getTime() !== startOfDay(yesterday).getTime()) matchDate = false;
          } else if (dateFilter === "thisweek") {
            const dayOfWeek = now.getDay();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - dayOfWeek);
            if (billDate < startOfDay(weekStart) || billDate > now) matchDate = false;
          } else if (dateFilter === "thismonth") {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            if (billDate < monthStart || billDate > now) matchDate = false;
          } else if (dateFilter === "custom") {
            if (customFrom) {
              const from = new Date(customFrom);
              if (startOfDay(billDate) < from) matchDate = false;
            }
            if (customTo) {
              const to = new Date(customTo);
              to.setHours(23, 59, 59, 999);
              if (billDate > to) matchDate = false;
            }
          }
        }
      }

      return matchSearch && matchStatus && matchDate;
    });

    if (amountSort === "low") {
      data.sort((a, b) => a.grandTotal - b.grandTotal);
    } else if (amountSort === "high") {
      data.sort((a, b) => b.grandTotal - a.grandTotal);
    }

    return data;
  }, [bills, search, statusFilter, amountSort]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedBills = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, amountSort, dateFilter, customFrom, customTo]);

  /* =========================
     DELETE & UPDATE
  ========================= */
  const deleteInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await api.delete(`/billings/${id}`);
      setBills((prev) => prev.filter((b) => b.id !== id));
      toast.success("Invoice deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/billings/${id}`, { paymentStatus: newStatus });
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, paymentStatus: newStatus } : b))
      );
      toast.success("Status updated to " + newStatus);
      loadBills(); // Refresh to ensure stats update
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* =========================
     PRINT (Fetching detail first)
  ========================= */
  const fetchAndPrint = async (id) => {
    try {
      const res = await api.get(`/billings/${id}`);
      printInvoice(res.data);
    } catch {
      toast.error("Failed to load invoice details for printing");
    }
  };

  /* =========================
     PRINT
  ========================= */
  const printInvoice = (bill) => {
    const win = window.open("", "", "width=900,height=650");

    win.document.write(`
      <html>
      <head>
        <title>Invoice ${bill.invoiceNo}</title>
        <style>
          body { font-family: Arial; padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #f3f3f3; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h2>Car Service Invoice</h2>

        <p><b>Invoice:</b> ${bill.invoiceNo}</p>
        <p><b>Source:</b> ${bill.billingType === 'manual' ? 'Manual Entry' : 'Online Booking'}</p>
        <p><b>Customer:</b> ${bill.customerName}</p>
        <p><b>Car:</b> ${bill.car || "-"}</p>
        <p><b>Reg. No:</b> ${bill.registrationNumber || "-"}</p>
        <p><b>Mobile:</b> ${bill.mobileNumber || "-"}</p>

        <table>
          <tr>
            <th>Part</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${(bill.parts || [])
        .map(
          (p) => `
            <tr>
              <td>${p.partName}</td>
              <td>${p.qty}</td>
              <td class="right">₹${p.price}</td>
              <td class="right">₹${p.total}</td>
            </tr>`
        )
        .join("")}
        </table>

        <h3 class="right">Sub Total: ₹${bill.subTotal}</h3>
        <h3 class="right">GST: ₹${bill.gstAmount}</h3>
        <h3 class="right">Grand Total: ₹${bill.grandTotal}</h3>

        <script>
          window.print();
          window.close();
        </script>
      </body>
      </html>
    `);

    win.document.close();
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6 space-y-6  min-h-screen">
      {/* HEADER */}
      <div className="flex justify-end items-center">

        <button
          onClick={() => navigate("/admin/addbillings")}
          className="h-[42px] w-full sm:w-auto bg-black text-white px-5 rounded-md font-bold shadow
             hover:bg-gray-900 transition flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
        >
          <FaPlus size={14} />
          Create Invoice
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹ ${formatValue(totalRevenue)}`} 
          icon={<FaFileInvoiceDollar />}
          gradient="from-emerald-600 to-emerald-400"
        />
        <StatCard 
          title="Paid Invoices" 
          value={paidCount} 
          icon={<FaCheckCircle />}
          gradient="from-blue-600 to-blue-400"
        />
        <StatCard 
          title="Pending Invoices" 
          value={pendingCount} 
          icon={<FaClock />}
          gradient="from-amber-600 to-amber-400"
        />
      </div>

      {/* FILTER BAR */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* LEFT : SEARCH */}
          <div className="relative w-full md:max-w-md">
            <FaSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search invoice customer car"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
          w-full
          rounded-lg
          border border-gray-200
          pl-10 px-4 py-3
          text-sm
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-gray-900/40
          focus:border-gray-500
          transition
          bg-white
        "
            />
          </div>

          {/* RIGHT : FILTERS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

            {/* 📅 DATE PRESET */}
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCustomFrom(""); setCustomTo(""); }}
              className="rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/40 focus:border-gray-500 transition bg-white cursor-pointer"
            >
              <option value="all">All Dates</option>
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
                  className="rounded-lg border border-gray-200 px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/40 focus:border-gray-500 transition bg-white"
                />
                <span className="text-gray-400 text-sm font-semibold">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/40 focus:border-gray-500 transition bg-white"
                />
              </>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
          rounded-lg
          border border-gray-200
          px-4 py-3
          text-sm
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-gray-900/40
          focus:border-gray-500
          transition
          bg-white
        "
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={amountSort}
              onChange={(e) => setAmountSort(e.target.value)}
              className="
          rounded-lg
          border border-gray-200
          px-4 py-3
          text-sm
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-gray-900/40
          focus:border-gray-500
          transition
          bg-white
        "
            >
              <option value="none">Amount Sort</option>
              <option value="low">Low → High</option>
              <option value="high">High → Low</option>
            </select>

          </div>

        </div>
      </div>


      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-[700px] text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
              <tr>
                <th className="px-6 py-4 text-left">S No</th>
                <th className="px-6 py-4 text-left">Invoice</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Vehicle Info</th>
                <th className="px-6 py-4 text-left">Source</th>
                <th className="px-6 py-4 text-left font-bold">Total Amount</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedBills.map((b, i) => (
                <tr key={b.id} className="border-b border-gray-300">
                  <td className="px-6 py-4 font-bold text-gray-600">{i + 1}</td>
                  <td className="px-6 py-4 font-black text-sky-600">{b.invoiceNo}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{b.customerName}</p>
                    <p className="text-[10px] text-gray-500">{b.mobileNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{b.car}</p>
                    <p className="text-[10px] text-sky-600 font-black tracking-wider uppercase">{b.registrationNumber}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{b.bookingId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${b.billingType === 'manual' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                        {b.billingType || 'Online'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900">₹{b.grandTotal}</td>
                  <td className="px-6 py-4">
                    <select
                      value={b.paymentStatus?.toLowerCase() || "pending"}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border-2 border-transparent outline-none cursor-pointer shadow-sm transition-all appearance-none ${
                        b.paymentStatus?.toLowerCase() === "paid" ? "bg-emerald-500" :
                        b.paymentStatus?.toLowerCase() === "partial" ? "bg-orange-500" :
                        "bg-amber-500"
                      }`}
                    >
                      <option value="pending" className="bg-white text-black">Pending</option>
                      <option value="partial" className="bg-white text-black">Partial</option>
                      <option value="paid" className="bg-white text-black">Paid</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => fetchAndPrint(b.id)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition" title="Print">
                          <FaPrint size={14} />
                        </button>
                        <button onClick={() => navigate(`/admin/addbillings/${b.id}`)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition" title="Edit">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => deleteInvoice(b.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" title="Delete">
                          <FaTrashAlt size={14} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-6">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Billings;



