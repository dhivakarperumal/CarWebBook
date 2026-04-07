import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import {
  Search,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 6;

const StatusBadge = ({ status }) => {
  const map = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    partial: "bg-orange-100 text-orange-700 border-orange-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const s = status?.toLowerCase() || "pending";
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[s] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {s}
    </span>
  );
};

const EmpBilling = () => {
  const { profileName: userProfile } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); 
  const [page, setPage] = useState(1);
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billRes, bookRes] = await Promise.all([
        api.get('/billings'),
        api.get('/bookings')
      ]);

      const userRole = (userProfile?.role || "").toLowerCase();
      const isAdmin = userRole === "admin";
      const mechanicName = userProfile?.displayName || "";

      let myBills = [];
      let assignedBookings = [];

      if (isAdmin) {
        myBills = billRes.data || [];
        assignedBookings = bookRes.data || [];
      } else {
        assignedBookings = (bookRes.data || []).filter(b => 
          (b.assignedEmployeeName || "").toLowerCase() === mechanicName.toLowerCase()
        );
        const assignedBookingIds = new Set(assignedBookings.map(b => b.bookingId));
        myBills = (billRes.data || []).filter(bill => 
          assignedBookingIds.has(bill.bookingId)
        );
      }

      setBills(myBills);
      setMyBookings(assignedBookings);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const text = `${b.invoiceNo} ${b.customerName} ${b.carNumber} ${b.bookingId}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || b.paymentStatus?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, search, statusFilter]);

  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const paginatedBills = filteredBills.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const fetchAndPrint = async (id) => {
    try {
      const res = await api.get(`/billings/${id}`);
      printInvoice(res.data);
    } catch {
      toast.error("Failed to load invoice for printing");
    }
  };

  const showDetails = async (id) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/billings/${id}`);
      setSelectedBillDetail(res.data);
    } catch {
      toast.error("Failed to load bill details");
    } finally {
      setDetailLoading(false);
    }
  };

  const printInvoice = (bill) => {
    const win = window.open("", "", "width=900,height=650");
    win.document.write(`
      <html>
      <head>
        <title>Invoice ${bill.invoiceNo}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #f1f5f9; }
          th { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; }
          .total-box { margin-top: 30px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; gap: 20px; font-weight: 800; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>#${bill.invoiceNo} | Date: ${new Date(bill.createdAt).toLocaleDateString()}</p>
        </div>
        <p><b>Customer:</b> ${bill.customerName}</p>
        <p><b>Vehicle:</b> ${bill.carNumber} (${bill.bookingId})</p>
        
        <table>
          <thead>
            <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${(bill.parts || []).map(p => `
              <tr><td>${p.partName}</td><td>${p.qty}</td><td>₹${p.price}</td><td>₹${p.total}</td></tr>
            `).join("")}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Subtotal:</span> <span>₹${bill.subTotal}</span></div>
          <div class="total-row"><span>GST:</span> <span>₹${bill.gstAmount}</span></div>
          <div class="total-row" style="font-size: 20px; color: #020617; margin-top: 10px;"><span>Grand Total:</span> <span>₹${bill.grandTotal}</span></div>
        </div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <FileText className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium font-inter tracking-wide">Fetching your billing records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
             <FileText className="w-8 h-8 text-blue-600" />
             Job Billing
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Status of payments for your assigned services</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* View Mode Toggle */}
           <div className="hidden sm:flex p-1 bg-gray-100 rounded-xl w-fit">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                title="Card View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                title="Table View"
              >
                <List size={18} />
              </button>
           </div>
           
           <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 min-w-[140px]">
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Total Billings</p>
              <p className="text-2xl font-black text-emerald-600">₹{bills.reduce((sum, b) => sum + Number(b.grandTotal), 0).toLocaleString()}</p>
           </div>
           <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 min-w-[120px]">
              <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-amber-600">{bills.filter(b => b.paymentStatus !== 'Paid').length}</p>
           </div>
           
           <button
             onClick={() => navigate("/employee/addbillings")}
             className="flex flex-col items-center justify-center gap-1 bg-black text-white px-5 py-3 rounded-2.5xl hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 group"
           >
              <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Create<br/>Billing</span>
           </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search invoice, customer or plate..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all font-bold text-gray-700 cursor-pointer"
        >
          <option value="all">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* LIST */}
      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-24 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-800">No Billings Found</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto mt-2">
            {(userProfile?.role || "").toLowerCase() === "admin" 
              ? "All generated invoices across the system will be displayed here."
              : "Once bills are generated for your assigned services, they will appear here."
            }
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBills.map((bill) => (
            <div key={bill.id} className="group bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                 <StatusBadge status={bill.paymentStatus} />
                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">INV: {bill.invoiceNo}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{bill.customerName}</h3>
                <p className="text-sm font-black text-blue-500 mt-1 uppercase tracking-wider">{bill.carNumber || "SERVICE JOB"}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Job ID: {bill.bookingId}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-6">
                 <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                    <span>Parts & Labour</span>
                    <span>₹{bill.subTotal}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                    <span>Service Tax</span>
                    <span>₹{bill.gstAmount}</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-xs font-black text-gray-900 uppercase">Total Amount</span>
                    <span className="text-xl font-black text-emerald-600">₹{Number(bill.grandTotal).toLocaleString()}</span>
                 </div>
              </div>

              <div className="mt-auto flex items-center gap-3">
                 <button 
                  onClick={() => fetchAndPrint(bill.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-gray-200"
                 >
                    <Printer size={16} /> Print Copy
                 </button>
                 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs" title="View Detail">
                    <History size={16} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-6 py-5">Invoice</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5 text-right">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900">#{bill.invoiceNo}</p>
                    <p className="text-[10px] font-bold text-gray-400">ID: {bill.bookingId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800">{bill.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-blue-600">{bill.carNumber || "SERVICE"}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-black text-emerald-600">₹{Number(bill.grandTotal).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={bill.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => showDetails(bill.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                       >
                          <History size={16} />
                       </button>
                       <button 
                        onClick={() => fetchAndPrint(bill.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Print"
                       >
                          <Printer size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* DETAIL MODAL */}
      {selectedBillDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20"><FileText size={24}/></div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Invoice Insight</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">#INV-{selectedBillDetail.invoiceNo} • {new Date(selectedBillDetail.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedBillDetail(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 transition-all shadow-sm"><AlertCircle size={20} /></button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-8">
               <div className="grid grid-cols-2 gap-8 bg-black p-8 rounded-[2rem] text-white">
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Customer Recipient</p>
                    <p className="font-black text-xl uppercase tracking-tight">{selectedBillDetail.customerName}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">{selectedBillDetail.mobileNumber || "Personal Entry"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Vehicle Specification</p>
                    <p className="font-black text-xl uppercase tracking-tight">{selectedBillDetail.car || "General Service"}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">{selectedBillDetail.carNumber || "MH-XX-XXXX"}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Inventory & Service Log</h3>
                  <div className="border border-gray-100 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-xs font-bold">
                      <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4 text-center">Qty</th>
                          <th className="px-6 py-4 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(selectedBillDetail.parts || []).map((p, i) => (
                          <tr key={i} className="text-gray-700">
                            <td className="px-6 py-4">{p.partName}</td>
                            <td className="px-6 py-4 text-center">{p.qty}</td>
                            <td className="px-6 py-4 text-right">₹{p.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {selectedBillDetail.labour > 0 && (
                          <tr className="text-gray-700">
                            <td className="px-6 py-4 italic">Labour & Service Fees</td>
                            <td className="px-6 py-4 text-center">1</td>
                            <td className="px-6 py-4 text-right">₹{Number(selectedBillDetail.labour).toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <StatusBadge status={selectedBillDetail.paymentStatus} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Strategy: {selectedBillDetail.paymentMode || "Unspecified"}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-50">Reconciled Grand Total</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{Number(selectedBillDetail.grandTotal).toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Using History icon from lucide-react, I'll import it */
import { History } from "lucide-react";

export default EmpBilling;
