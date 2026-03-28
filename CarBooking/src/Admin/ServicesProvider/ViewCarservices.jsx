import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const ViewService = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =======================
     FETCH SERVICE + PARTS
  ======================= */
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/all-services/${id}`);
        const data = res.data;
        setService(data);
        setParts(data.parts || []);
      } catch (err) {
        toast.error("Failed to load service details");
        navigate("/admin/services");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading service details...
      </div>
    );
  }

  if (!service) return null;

  const totalPartsCost = parts.reduce(
    (sum, p) => sum + p.qty * p.price,
    0
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow space-y-8">
   <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-blue-700">
        Service Details
      </h2>

      <button
        onClick={() => navigate(`/admin/addbillings/${service.id}`)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition"
      >
        Create Invoice
      </button>
    </div>
      {/* CUSTOMER INFO */}
      <Section title="Customer Information">
        <Grid>
          <Detail label="Booking ID" value={service.bookingId || "-"} />
          <Detail label="Customer Name" value={service.name || "-"} />
          <Detail label="Mobile" value={service.phone || "-"} />
          <Detail label="Car" value={`${service.brand || ""} ${service.model || ""}`.trim() || "-"} />
        </Grid>
      </Section>

      {/* MECHANIC INFO */}
      <Section title="Mechanic & Repair">
        <Grid>
          <Detail label="Mechanic" value={service.mechanic || "-"} />
          <Detail
            label="Service Status"
            value={
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  service.serviceStatus === "Service Completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {service.serviceStatus || "Booked"}
              </span>
            }
          />
          <Detail label="Issue" value={service.issue || service.otherIssue || "-"} />
          <Detail label="Address" value={service.address || "-"} />
        </Grid>
      </Section>

      {/* SPARE PARTS */}
      <Section title="Spare Parts Used">
        {parts.length > 0 ? (
          <>
               <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-4 text-left">Part</th>
                    <th className="px-4 py-4 text-center">Qty</th>
                    <th className="px-4 py-4 text-center">Price</th>
                    <th className="px-4 py-4 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id} className="border-t border-gray-300">
                      <td className="px-4 py-4">{p.partName || "-"}</td>
                      <td className="px-4 py-4 text-center">{p.qty}</td>
                      <td className="px-4 py-4 text-center">₹{p.price}</td>
                      <td className="px-4 py-4 text-center font-medium">
                        ₹{p.qty * p.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right mt-3 font-semibold text-lg">
              Parts Total: ₹{totalPartsCost}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No spare parts added</p>
        )}
      </Section>

     

     
    </div>
  );
};

/* =======================
   UI HELPERS
======================= */
const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="font-semibold text-lg text-gray-700">{title}</h3>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <div className="font-medium">{value}</div>
  </div>
);

export default ViewService;
