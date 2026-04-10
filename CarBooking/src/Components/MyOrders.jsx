import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  orderplaced: { label: "Order Placed", step: 0 },
  processing: { label: "Processing", step: 1 },
  packing: { label: "Packing", step: 2 },
  outfordelivery: { label: "Out for Delivery", step: 3 },
  delivered: { label: "Delivered", step: 4 },
  cancelled: { label: "Cancelled", step: -1 },
};

const STATUS_STEPS = ["Order Placed", "Processing", "Packing", "Out for Delivery", "Delivered"];

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuth();
  const location = useLocation();

  const fetchOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/orders/user/${user.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Fetch orders error", err);
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  useEffect(() => {
    if (location.state?.highlightOrderId && orders.length) {
      const found = orders.find(o => o.orderId === location.state.highlightOrderId || o.id === location.state.highlightOrderId);
      if (found) setSelectedOrder(found);
    }
  }, [orders, location.state]);

  if (loading) return <p className="text-slate-400">Loading orders...</p>;

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-sky-400">My Orders</h2>
      {orders.length === 0 ? (
        <p className="text-slate-400">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusKey = (order.status || "orderplaced").toLowerCase();
            const statusLabel = STATUS_CONFIG[statusKey]?.label || "Order Placed";
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="cursor-pointer bg-black border border-slate-700 rounded-xl p-4 hover:border-sky-400 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">Order ID: {order.orderId}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Placed on: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      statusKey === "cancelled" ? "bg-red-900 text-red-400" :
                      statusKey === "delivered" ? "bg-green-900 text-green-400" :
                      statusKey === "outfordelivery" ? "bg-yellow-900 text-yellow-400" :
                      "bg-sky-900 text-sky-400"
                    }`}>
                      {statusLabel}
                    </span>
                    <p className="text-sky-400 font-bold">Total: ₹{order.total}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </>
  );
};

const OrderModal = ({ order, onClose }) => {
  const statusKey = (order.status || "orderplaced").toLowerCase();
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.orderplaced;
  const currentStepIndex = statusInfo.step;

  // Adapt database fields to modal display
  const shipping = {
    name: order.shippingName || order.customerName,
    phone: order.shippingPhone || order.customerPhone,
    email: order.shippingEmail || order.customerEmail,
    address: order.shippingAddress,
    city: order.shippingCity,
    state: order.shippingState,
    zip: order.shippingZip,
    country: order.shippingCountry
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3 sm:px-6">
      <div className="bg-slate-900 w-full max-w-3xl rounded-2xl p-6 relative border border-sky-400 max-h-[85vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">✕</button>
        <h3 className="text-xl font-bold text-sky-400 mb-2">Order ID: {order.orderId}</h3>
        <p className="text-slate-400 mb-6">Placed on: {new Date(order.createdAt).toLocaleString()}</p>
        
        <div className="space-y-4 mb-6">
          {order.items?.map((item, i) => (
            <div key={i} className="flex gap-4 items-center border-b border-slate-700 pb-3">
              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="text-white">{item.name}</p>
                <p className="text-slate-400 text-sm">Qty: {item.qty || item.quantity} × ₹{item.price}</p>
              </div>
              <p className="text-sky-400 font-semibold">₹{(item.price * (item.qty || item.quantity))}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8 pt-4 border-t border-slate-700">
          <span className="text-slate-300 font-bold">Total</span>
          <span className="text-sky-400 text-xl font-black">₹{order.total}</span>
        </div>

        <div className="mb-8">
          <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">Shipping Details</h4>
          <div className="bg-black border border-slate-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-white font-bold">{shipping.name}</p>
                <p className="text-slate-400 text-sm">📞 {shipping.phone}</p>
                {shipping.email && <p className="text-slate-400 text-sm">✉️ {shipping.email}</p>}
              </div>
              <div className="text-slate-300 text-sm leading-relaxed">
                <p>{shipping.address}</p>
                <p>{shipping.city}, {shipping.state} – {shipping.zip}</p>
                <p>{shipping.country}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Order Status</h4>
          {statusKey === "cancelled" ? (
            <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-xl p-4 font-semibold text-center">
              ❌ This order has been cancelled
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="flex justify-between items-start mb-4">
                  {STATUS_STEPS.map((step, index) => (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index <= currentStepIndex ? "bg-sky-400 text-black" : "bg-slate-700 text-slate-400"
                      }`}>{index + 1}</div>
                      <p className={`text-[10px] mt-2 text-center font-bold ${index <= currentStepIndex ? "text-sky-400" : "text-slate-500"}`}>{step}</p>
                    </div>
                  ))}
                </div>
                <div className="relative h-1 bg-slate-700 rounded-full mx-6">
                  <div className="h-1 bg-sky-400 rounded-full absolute top-0 left-0 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="md:hidden space-y-4">
                {STATUS_STEPS.map((step, index) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index <= currentStepIndex ? "bg-sky-400 text-black" : "bg-slate-700 text-slate-400"
                      }`}>{index + 1}</div>
                      {index !== STATUS_STEPS.length - 1 && <div className={`w-1 h-8 mt-1 ${index < currentStepIndex ? "bg-sky-400" : "bg-slate-700"}`} />}
                    </div>
                    <p className={`text-sm mt-1 ${index <= currentStepIndex ? "text-sky-400 font-bold" : "text-slate-400"}`}>{step}</p>
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

export default MyOrders;