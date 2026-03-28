import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
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
      try {
        // 🔹 Service
        const serviceRef = doc(db, "carServices", id);
        const serviceSnap = await getDoc(serviceRef);

        if (!serviceSnap.exists()) {
          toast.error("Service not found");
          navigate("/admin/services");
          return;
        }

        setService({ id: serviceSnap.id, ...serviceSnap.data() });

        // 🔹 Parts
        const partsRef = collection(db, "carServices", id, "parts");
        const partsSnap = await getDocs(partsRef);

        const safeParts = partsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          qty: Number(d.data().qty || 0),
          price: Number(d.data().price || 0),
        }));

        setParts(safeParts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load service details");
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
          <Detail label="Service ID" value={service.carServiceId || "-"} />
          <Detail label="Customer Name" value={service.customerName || "-"} />
          <Detail label="Mobile" value={service.customerMobile || "-"} />
          <Detail label="Car Number" value={service.carNumber || "-"} />
        </Grid>
      </Section>

      {/* MECHANIC INFO */}
      <Section title="Mechanic & Repair">
        <Grid>
          <Detail label="Mechanic" value={service.mechanic || "-"} />
          <Detail
            label="Status"
            value={
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  service.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : service.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {service.status || "N/A"}
              </span>
            }
          />
          <Detail label="Service Type" value={service.serviceType || "-"} />
          <Detail label="Repair Time" value={service.repairTime || "-"} />
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
