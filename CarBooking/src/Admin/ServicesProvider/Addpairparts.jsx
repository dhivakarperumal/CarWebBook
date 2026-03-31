import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const AddServiceParts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingService = location.state?.service;

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(existingService || null);
  const [search, setSearch] = useState("");

  const [parts, setParts] = useState([
    { partName: "", qty: 1, price: 0 },
  ]);

  const [loading, setLoading] = useState(false);

  /* =======================
     FETCH SERVICES
  ======================= */
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/all-services');
        setServices(res.data);
      } catch (err) {
        toast.error("Failed to load services");
      }
    };

    fetchServices();
  }, []);

  /* =======================
     FILTER SERVICES
  ======================= */
  const filteredServices = services.filter((s) => {
    const text = `
      ${s.bookingId || ""}
      ${s.name || ""}
      ${s.phone || ""}
      ${s.brand || ""}
      ${s.model || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  /* =======================
     PART HANDLERS
  ======================= */
  const handlePartChange = (i, field, value) => {
    const copy = [...parts];
    copy[i][field] = value;
    setParts(copy);
  };

  const addPartRow = () => {
    setParts([...parts, { partName: "", qty: 1, price: 0 }]);
  };

  const removePartRow = (i) => {
    setParts(parts.filter((_, idx) => idx !== i));
  };

  const totalPartsCost = parts.reduce(
    (sum, p) => sum + Number(p.qty) * Number(p.price),
    0
  );

  /* =======================
     SAVE PARTS
  ======================= */
  const handleSave = async () => {
    if (!selectedService) {
      toast.error("Select a service");
      return;
    }

    const validParts = parts.filter((p) => p.partName);

    if (validParts.length === 0) {
      toast.error("Add at least one part");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/all-services/${selectedService.id}/parts`, { parts: validParts });
      toast.success("Parts added successfully");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to save parts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl bg-white shadow rounded-lg mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add Service Parts</h2>
      </div>

      {/* 🔍 SEARCH SERVICE - Only show if no service passed in state */}
      {!existingService && (
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            Search Assigned Booking
          </label>
          <input
            placeholder="Booking ID / Customer Name / Phone..."
            className="w-full border border-gray-200 px-4 py-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {search && (
        <div className="border rounded max-h-52 overflow-auto">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedService(s);
                setSearch("");
              }}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="font-semibold">
                {s.bookingId || "-"}
              </div>
              <div className="text-sm text-gray-500">
                {s.name} • {s.phone} • {s.brand} {s.model}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📋 SELECTED SERVICE */}
      {selectedService && (
        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Booking ID</p>
            <p className="font-bold text-blue-900">{selectedService.bookingId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Customer</p>
            <p className="font-bold text-blue-900">{selectedService.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Vehicle</p>
            <p className="font-bold text-blue-900">{selectedService.brand} {selectedService.model}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Reg Number</p>
            <p className="font-bold text-blue-900">{selectedService.vehicleNumber || "N/A"}</p>
          </div>
        </div>
      )}

      {/* 🧾 PARTS TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-4 py-3 text-left">Part Name</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {parts.map((p, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3">
                  <input
                    className="border px-3 py-2 rounded w-full"
                    placeholder="Part name"
                    value={p.partName}
                    onChange={(e) =>
                      handlePartChange(i, "partName", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-20"
                    value={p.qty}
                    onChange={(e) =>
                      handlePartChange(i, "qty", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-24"
                    value={p.price}
                    onChange={(e) =>
                      handlePartChange(i, "price", e.target.value)
                    }
                  />
                </td>

                <td className="px-4 py-3 font-semibold">
                  ₹{p.qty * p.price}
                </td>

                <td className="px-4 py-3">
                  {parts.length > 1 && (
                    <button
                      onClick={() => removePartRow(i)}
                      className="text-red-600"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addPartRow}
          className="bg-black text-white mt-3 flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <FaPlus /> Add Part
        </button>
      </div>

      {/* 💰 FOOTER */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Parts Valuation</p>
          <div className="text-3xl font-black text-white">
            ₹{totalPartsCost.toLocaleString()}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "SAVING DATA..." : "CONFIRM & SAVE PARTS"}
        </button>
      </div>
    </div>
  );
};

export default AddServiceParts;

