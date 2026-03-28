import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AddServiceParts = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
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
      <h2 className="text-xl font-semibold">Add Service Parts</h2>

      {/* 🔍 SEARCH SERVICE */}
      <input
        placeholder="Search Booking ID / Name / Phone / Car"
        className="w-full border border-gray-200 px-4 py-3 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900/40"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
        <div className="bg-gray-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-2">
          <div><b>Booking ID:</b> {selectedService.bookingId}</div>
          <div><b>Customer:</b> {selectedService.name}</div>
          <div><b>Mobile:</b> {selectedService.phone}</div>
          <div><b>Car:</b> {selectedService.brand} {selectedService.model}</div>
          <div><b>Issue:</b> {selectedService.issue || selectedService.otherIssue}</div>
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Total Parts Cost: ₹{totalPartsCost}
        </h3>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-500"
        >
          {loading ? "Saving..." : "Save Parts"}
        </button>
      </div>
    </div>
  );
};

export default AddServiceParts;

