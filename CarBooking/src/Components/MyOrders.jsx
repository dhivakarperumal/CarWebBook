import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { useLocation } from "react-router-dom";

const STATUS_CONFIG = {
  orderplaced: {
    label: "Order Placed",
    step: 0,
  },
  processing: {
    label: "Processing",
    step: 1,
  },
  packing: {
    label: "Packing",
    step: 2,
  },
  outfordelivery: {
    label: "Out for Delivery",
    step: 3,
  },
  delivered: {
    label: "Delivered",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    step: -1,
  },
};

const STATUS_STEPS = [
  "Order Placed",
  "Processing",
  "Packing",
  "Out for Delivery",
  "Delivered",
];

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const location = useLocation();

useEffect(() => {
  if (location.state?.highlightOrderId && orders.length) {
    const found = orders.find(
      (o) => o.id === location.state.highlightOrderId
    );
    if (found) setSelectedOrder(found);
  }
}, [orders]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "orders"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p className="text-slate-400">Loading orders...</p>;
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-sky-400">My Orders</h2>

      {orders.length === 0 ? (
        <p className="text-slate-400">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusKey = order.status || "orderplaced";
            const statusLabel =
              STATUS_CONFIG[statusKey]?.label || "Order Placed";

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="
          cursor-pointer
          bg-black
          border border-slate-700
          rounded-xl
          p-4
          hover:border-sky-400
          transition
        "
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  {/* ===== LEFT ===== */}
                  <div>
                    <p className="text-white font-semibold">
                      Order ID: {order.orderId}
                    </p>

                    <p className="text-slate-400 text-sm mt-1">
                      Placed on:{" "}
                      {order.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>

                  {/* ===== RIGHT (ONE COLUMN) ===== */}
                  <div className="flex flex-col items-start md:items-end gap-2">

                    {/* STATUS */}
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold
                ${statusKey === "cancelled"
                          ? "bg-red-900 text-red-400"
                          : statusKey === "delivered"
                            ? "bg-green-900 text-green-400"
                            : statusKey === "outfordelivery"
                              ? "bg-yellow-900 text-yellow-400"
                              : "bg-sky-900 text-sky-400"
                        }
              `}
                    >
                      {statusLabel}
                    </span>

                    {/* TOTAL */}
                    <p className="text-sky-400 font-bold whitespace-nowrap">
                      Total: ₹{order.total}
                    </p>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL ===== */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
};

export default MyOrders;

const OrderModal = ({ order, onClose }) => {
  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.orderplaced;
  const currentStepIndex = statusInfo.step;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3 sm:px-6">
      <div className="bg-slate-900 w-full max-w-3xl rounded-2xl p-6 relative border border-sky-400 max-h-[85vh] overflow-y-auto hide-scrollbar">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        {/* Header */}
        <h3 className="text-xl font-bold text-sky-400 mb-2">
          Order ID: {order.orderId}
        </h3>
        <p className="text-slate-400 mb-6">
          Placed on: {order.createdAt?.toDate().toLocaleString()}
        </p>

        {/* ===== ITEMS ===== */}
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex gap-4 items-center border-b border-slate-700 pb-3"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}

              <div className="flex-1">
                <p className="text-white">{item.name}</p>
                <p className="text-slate-400 text-sm">
                  Qty: {item.quantity} × ₹{item.price}
                </p>
              </div>

              <p className="text-sky-400 font-semibold">
                ₹{item.price * item.quantity}
              </p>
            </div>
          ))}
        </div>

        {/* ===== TOTAL ===== */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
          <span className="text-slate-300">Total</span>
          <span className="text-white text-lg font-bold">
            ₹{order.total}
          </span>
        </div>



        {/* ===== SHIPPING ADDRESS ===== */}
        <div className="mb-8">
          <h4 className="text-white font-semibold mb-3">
            Shipping Details
          </h4>

          <div className="bg-black border border-slate-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ===== LEFT COLUMN ===== */}
              <div className="space-y-2">
                <p className="text-white font-medium">
                  {order.shipping?.name}
                </p>

                <p className="text-slate-400 text-sm">
                  📞 {order.shipping?.phone}
                </p>

                <p className="text-slate-400 text-sm">
                  ✉️ {order.shipping?.email}
                </p>
              </div>

              {/* ===== RIGHT COLUMN ===== */}
              <div className="text-slate-300 text-sm leading-relaxed space-y-1">
                <p>{order.shipping?.address}</p>
                <p>
                  {order.shipping?.city}, {order.shipping?.state} –{" "}
                  {order.shipping?.zip}
                </p>
                <p>{order.shipping?.country}</p>
              </div>

            </div>
          </div>
        </div>

        {/* ===== ORDER TRACKING ===== */}
<div className="mb-8">
  <h4 className="text-white font-semibold mb-4">
    Order Status
  </h4>

  {/* CANCELLED */}
  {order.status === "cancelled" ? (
    <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-xl p-4 font-semibold">
      ❌ This order has been cancelled
    </div>
  ) : (
    <>
      {/* ===== DESKTOP (HORIZONTAL) ===== */}
<div className="hidden md:block">
  {/* Steps */}
  <div className="flex justify-between items-start">
    {STATUS_STEPS.map((step, index) => (
      <div
        key={step}
        className="flex flex-col items-center flex-1"
      >
        {/* Circle */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${
              index <= currentStepIndex
                ? "bg-sky-500 text-black"
                : "bg-slate-700 text-slate-400"
            }`}
        >
          {index + 1}
        </div>

        {/* Label */}
        <p
          className={`text-xs mt-2 text-center
            ${
              index <= currentStepIndex
                ? "text-sky-400"
                : "text-slate-500"
            }`}
        >
          {step}
        </p>
      </div>
    ))}
  </div>

  {/* Progress Line (BELOW TEXT) */}
  <div className="relative mt-6">
    {/* Base line */}
    <div className="h-1 bg-slate-700 rounded-full w-full" />

    {/* Active progress */}
    <div
      className="h-1 bg-sky-500 rounded-full absolute top-0 left-0 transition-all"
      style={{
        width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
      }}
    />
  </div>
</div>

      {/* ===== MOBILE (VERTICAL) ===== */}
      <div className="md:hidden  space-y-4">
        {STATUS_STEPS.map((step, index) => (
          <div key={step} className="flex items-start gap-4">
            {/* Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${
                    index <= currentStepIndex
                      ? "bg-sky-500 text-black"
                      : "bg-slate-700 text-slate-400"
                  }`}
              >
                {index + 1}
              </div>

              {index !== STATUS_STEPS.length - 1 && (
                <div
                  className={`w-1 h-8 mt-1
                    ${
                      index < currentStepIndex
                        ? "bg-sky-500"
                        : "bg-slate-700"
                    }`}
                />
              )}
            </div>

            {/* Label */}
            <p
              className={`text-sm mt-1
                ${
                  index <= currentStepIndex
                    ? "text-sky-400 font-medium"
                    : "text-slate-400"
                }`}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </>
  )}
</div>
      </div>
    </div>
  );
};