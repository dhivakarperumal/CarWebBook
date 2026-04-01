import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  Plus,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../Components/Pagination";

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
const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-md border border-gray-300 shadow p-5">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
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

  /* =========================
     FILTER + SORT
  ========================= */
  const filtered = useMemo(() => {
    let data = bills.filter((b) => {
      const text = `${b.invoiceNo} ${b.customerName} ${b.car} ${b.bookingId}`.toLowerCase();
      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "all" || b.paymentStatus?.toLowerCase() === statusFilter)
      );
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
  }, [search, statusFilter, amountSort]);

  /* =========================
     DELETE
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
        <p><b>Customer:</b> ${bill.customerName}</p>
        <p><b>Car Number:</b> ${bill.carNumber}</p>
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
             hover:bg-gray-900 transition flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Revenue" value={`₹${totalRevenue}`} />
        <StatCard title="Pending Invoices" value={pendingCount} />
      </div>

      {/* FILTER BAR */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* LEFT : SEARCH */}
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
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
                <th className="px-4 py-4 text-left">S No</th>
                <th className="px-4 py-4 text-left">Invoice</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">Car No</th>
                <th className="px-4 py-4 text-left">Total</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedBills.map((b, i) => (
                <tr key={b.id} className="border-b border-gray-300">
                  <td className="px-4 py-4">{i + 1}</td>
                  <td className="px-4 py-4">{b.invoiceNo}</td>
                  <td className="px-4 py-4">{b.customerName}</td>
                  <td className="px-4 py-4">{b.bookingId}</td>
                  <td className="px-4 py-4">₹{b.grandTotal}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={b.paymentStatus} />
                  </td>
                  <td className="px-4 py-4 flex gap-2">
                    <button onClick={() => fetchAndPrint(b.id)} className="bg-gray-700 text-white px-2 py-1 rounded">
                      <Printer size={14} />
                    </button>
                    <button onClick={() => deleteInvoice(b.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                      <Trash2 size={14} />
                    </button>
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



