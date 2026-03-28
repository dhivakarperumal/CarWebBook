import { useEffect, useMemo, useState } from "react";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaBox,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/* ========================
   HELPERS
======================== */

const groupByMonth = (data, dateKey = "createdAt") => {
  const map = {};
  data.forEach(item => {
    if (!item[dateKey]) return;
    const month = dayjs(item[dateKey].toDate()).format("YYYY-MM");
    if (!map[month]) map[month] = [];
    map[month].push(item);
  });
  return map;
};

const getDownloadRows = (report) => {
  switch (report.type) {

    /* ===== APPOINTMENTS ===== */
    case "Appointments":
      return report.items.map(a => ({
        Customer: a.name,
        Phone: a.phone,
        Vehicle: a.vehicle,
        ServiceType: a.serviceType,
        Location: a.location,
        Date: a.date,
        Time: a.time,
        Status: a.status,
      }));

    /* ===== INVENTORY ===== */
    case "Inventory":
      return report.items.map(i => ({
        PartName: i.partName,
        Category: i.category,
        StockQty: i.stockQty,
        MinStock: i.minStock,
        Vendor: i.vendor,
        UpdatedAt: dayjs(i.updatedAt?.toDate()).format("DD MMM YYYY"),
      }));

    /* ===== BILLING ===== */
    case "Billing":
      return report.items.map(b => ({
        InvoiceNo: b.invoiceNo,
        Customer: b.customerName,
        Phone: b.mobileNumber,
        CarNumber: b.carNumber,
        Mechanic: b.mechanic,
        SubTotal: b.subTotal,
        GST: `${b.gstPercent}%`,
        GSTAmount: b.gstAmount,
        PartsTotal: b.partsTotal,
        GrandTotal: b.grandTotal,
        PaymentStatus: b.paymentStatus,
        Status: b.status,
        Date: dayjs(b.createdAt?.toDate()).format("DD MMM YYYY"),
      }));

    default:
      return [];
  }
};

/* ========================
   COMPONENT
======================== */

const Reports = () => {
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [billings, setBillings] = useState([]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  /* ========================
     FIRESTORE REALTIME
  ======================== */
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "appointments"), s =>
      setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const u2 = onSnapshot(collection(db, "carInventory"), s =>
      setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const u3 = onSnapshot(collection(db, "billings"), s =>
      setBillings(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { u1(); u2(); u3(); };
  }, []);

  /* ========================
     MONTHLY REPORTS
  ======================== */
  const reports = useMemo(() => {
    const rows = [];

    const push = (grouped, type, title) => {
      Object.entries(grouped).forEach(([month, items]) => {
        rows.push({
          name: `${title} (${dayjs(month).format("MMM YYYY")})`,
          type,
          month,
          items,
        });
      });
    };

    push(groupByMonth(appointments), "Appointments", "Appointments Report");
    push(groupByMonth(inventory, "updatedAt"), "Inventory", "Inventory Report");
    push(groupByMonth(billings), "Billing", "Billing Report");

    return rows.sort((a, b) => b.month.localeCompare(a.month));
  }, [appointments, inventory, billings]);

  /* ========================
     AVAILABLE MONTHS
  ======================== */
  const availableMonths = useMemo(() => {
    return [...new Set(reports.map(r => r.month))].sort((a, b) =>
      b.localeCompare(a)
    );
  }, [reports]);

  const filteredReports = reports.filter(r => {
    const typeMatch = typeFilter === "All" || r.type === typeFilter;
    const monthMatch = monthFilter === "All" || r.month === monthFilter;
    return typeMatch && monthMatch;
  });

  /* ========================
     DOWNLOAD PDF
  ======================== */
  const downloadPDF = (report) => {
    const rows = getDownloadRows(report);
    if (!rows.length) return;

    const doc = new jsPDF();
    doc.text(report.name, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [Object.keys(rows[0])],
      body: rows.map(r => Object.values(r)),
    });

    doc.save(`${report.name}.pdf`);
  };

  /* ========================
     DOWNLOAD EXCEL
  ======================== */
  const downloadExcel = (report) => {
    const rows = getDownloadRows(report);
    if (!rows.length) return;

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${report.name}.xlsx`);
  };

  /* ========================
     UI
  ======================== */
  return (
    <div className="min-h-screen">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Stat title="Appointments" value={appointments.length} icon={<FaCalendarAlt />} />
        <Stat title="Billing Records" value={billings.length} icon={<FaFileAlt />} />
        <Stat title="Inventory Items" value={inventory.length} icon={<FaBox />} />
      </div>

      {/* FILTER */}
      <div className=" mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* LEFT SIDE – TYPE FILTER */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-300 px-4 py-3 rounded-md shadow-sm w-full sm:w-40"
          >
            <option value="All">All Types</option>
            <option value="Appointments">Appointments</option>
            <option value="Inventory">Inventory</option>
            <option value="Billing">Billing</option>
          </select>

          {/* RIGHT SIDE – MONTH FILTER */}
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="border border-gray-300 px-4 py-3 rounded-md shadow-sm w-full sm:w-40"
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {dayjs(m).format("MMM YYYY")}
              </option>
            ))}
          </select>

        </div>
      </div>


      {/* TABLE */}
      <div className="bg-white rounded-2xl mt-15 shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-black to-cyan-400 text-white">
            <tr>
              <th className="p-4">S No</th>
              <th className="p-4">Report Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Month</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r, i) => (
              <tr key={i} className="border-t border-gray-300 hover:bg-gray-50">
                <td className="p-4">{i + 1}</td>
                <td className="p-4">{r.name}</td>
                <td className="p-4 text-center">{r.type}</td>
                <td className="p-4 text-center">
                  {dayjs(r.month).format("MMM YYYY")}
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex gap-2 items-center"
                  >
                    <FaEye /> View
                  </button>
                  <button
                    onClick={() => downloadPDF(r)}
                    className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-xs"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => downloadExcel(r)}
                    className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs"
                  >
                    Excel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReports.length === 0 && (
          <p className="text-center py-6 text-gray-500">No reports found</p>
        )}
      </div>

      {/* MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[90%] max-w-4xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedReport.name}</h2>
              <button onClick={() => setSelectedReport(null)}>
                <FaTimes />
              </button>
            </div>

            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3">S No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {selectedReport.items.map((i, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">
                      {dayjs(
                        i.createdAt?.toDate() || i.updatedAt?.toDate()
                      ).format("DD MMM YYYY")}
                    </td>
                    <td className="p-3">
                      {i.customerName || i.partName || i.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      )}
    </div>
  );
};

/* ========================
   STAT CARD
======================== */
const Stat = ({ title, value, icon }) => (
  <div className="bg-white rounded-md border border-gray-300 shadow p-5 flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-xl">
      {icon}
    </div>
  </div>
);

export default Reports;
