import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaClipboardList,
  FaBoxOpen,
} from "react-icons/fa";

/* ================= STATUS BADGE ================= */
const statusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "processing":
      return "bg-amber-100 text-amber-700";
    case "shipped":
    case "outfordelivery":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* ================= HELPERS ================= */
const normalizeKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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
  return map[k] || status;
};

const trackIcon = (status) => {
  const k = normalizeKey(status);
  if (k === "orderplaced") return <FaClock />;
  if (k === "processing") return <FaClipboardList />;
  if (k === "packing") return <FaBoxOpen />;
  if (k === "outfordelivery") return <FaTruck />;
  if (k === "delivered") return <FaCheckCircle />;
  if (k === "cancelled") return <FaTimesCircle />;
  return <FaClock />;
};

/* ================= PAGE ================= */
const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
       try {
          const res = await api.get(`/orders/${id}`);
          setOrder(res.data);
       } catch {
          toast.error("Failed to load order");
       }
    };
    fetchOrder();
  }, [id]);

  if (!order) {
    return <div className="p-6">Loading order details...</div>;
  }

  return (
    <div className="space-y-8">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-100"
        >
          <FaArrowLeft />
        </button>

        <div>
          <h2 className="text-2xl font-bold">{order.orderId}</h2>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* ================= ORDER TRACK ================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <FaTruck /> Order Tracking (Syncing...)
        </h3>

        <div className="flex flex-col md:flex-row md:items-center">
          {(() => {
            const stepKeys = [
              "orderplaced",
              "processing",
              "packing",
              "outfordelivery",
              "delivered",
            ];

            const currentKey = normalizeKey(order.status);
            const currentIndex = stepKeys.indexOf(currentKey);

            return stepKeys.map((stepKey, idx, arr) => {
              const completed = currentIndex >= 0 && idx <= currentIndex;
              const connectorCompleted = currentIndex > idx;
              const isLast = idx === arr.length - 1;

              return (
                <div
                  key={stepKey}
                  className="flex items-start md:items-center md:flex-1 mb-4 md:mb-0"
                >
                  <div className="flex flex-col items-center text-center w-full md:w-28">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg ${
                        completed
                          ? "bg-yellow-400 text-black"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {completed ? <FaCheckCircle /> : trackIcon(stepKey)}
                    </div>

                    <div
                      className={`mt-3 font-semibold text-sm capitalize ${
                        completed ? "text-black" : "text-gray-500"
                      }`}
                    >
                      {formatStatusLabel(stepKey)}
                    </div>
                  </div>

                  {!isLast && (
                    <>
                      <div className="hidden md:flex-1 md:flex md:items-center md:mx-3">
                        <div
                          className={`h-1 rounded-full w-full ${
                            connectorCompleted
                              ? "bg-yellow-400"
                              : "bg-gray-200"
                          }`}
                        />
                      </div>

                      <div className="md:hidden w-px h-6 bg-gray-200 mx-auto mt-2" />
                    </>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ================= CUSTOMER + ADDRESS ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FaUser /> Customer
          </h3>

          <p>{order.shippingName || order.customerName || "-"}</p>

          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <FaPhone />
            {order.shippingPhone || order.customerPhone || "-"}
          </p>

          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <FaEnvelope />
            {order.customerEmail || "-"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FaMapMarkerAlt /> Shipping Address
          </h3>

          {order.orderType === "shop" ? (
            <p className="text-sm text-gray-400">
              In-Store Sale (No Shipping)
            </p>
          ) : (
            <>
              <p>{order.shippingAddress || "-"}</p>
              <p>
                {order.shippingCity || "-"},{" "}
                {order.shippingState || "-"}
              </p>
              <p>
                {order.shippingZip || "-"},{" "}
                {order.shippingCountry || "-"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ================= ITEMS ================= */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-[640px] w-full text-sm">
      
      <thead className="bg-gradient-to-r from-black to-cyan-400 text-white text-left">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Image</th>
                <th className="px-4 py-3 text-center">Variant</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((i, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="px-4 py-3">
                    <p className="font-bold">{i.name}</p>
                    <p className="text-[10px] text-gray-400">{i.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {i.image ? (
                      <img src={i.image} className="w-12 h-12 object-cover rounded-lg mx-auto border border-gray-100 shadow-sm" alt="item" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto">
                        <FaBoxOpen className="text-gray-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{i.variant}</td>
                  <td className="px-4 py-3 text-center">{i.qty}</td>
                  <td className="px-4 py-3 text-right">₹ {i.price}</td>
                  <td className="px-4 py-3 text-right">₹ {i.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* ================= REFERENCE IMAGES ================= */}
      {order.images && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
            <FaClock className="text-cyan-500" /> Order Time Reference Images
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(() => {
              try {
                const imgList = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
                if (!Array.isArray(imgList)) return null;
                return imgList.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                    <img 
                      src={img} 
                      className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-500" 
                      alt="Ref"
                      onClick={() => window.open(img, '_blank')}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 text-[8px] text-white px-2 py-0.5 rounded-full font-black">
                      #{idx}
                    </div>
                  </div>
                ));
              } catch (e) {
                return <p className="text-xs text-gray-400">Unable to load images</p>;
              }
            })()}
          </div>
        </div>
      )}

      {/* ================= TOTAL ================= */}
      <div className="flex justify-end">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full md:w-1/3 shadow-sm">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₹ {order.subtotal}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹ {order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
