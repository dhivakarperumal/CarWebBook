import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";

const indianStates = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Delhi",
  "Maharashtra",
  "Gujarat",
  "Punjab",
  "Rajasthan",
  "West Bengal",
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const buyNowProduct = location.state?.product;
  const isBuyNow = location.state?.isBuyNow;

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        name: user.username || "",
        email: user.email || "",
        phone: user.mobile || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    if (isBuyNow && buyNowProduct) {
      setItems([{ ...buyNowProduct, qty: buyNowProduct.quantity, total: buyNowProduct.price * buyNowProduct.quantity }]);
      setLoadingItems(false);
      return;
    }

    const fetchCart = async () => {
      try {
        setLoadingItems(true);
        const res = await api.get(`/cart/${user.id}`);
        const cartItems = (res.data || []).map(i => ({
          ...i,
          qty: i.quantity,
          total: Number(i.price) * i.quantity
        }));
        setItems(cartItems);
      } catch (err) {
        console.error("Cart fetch error", err);
        toast.error("Failed to load items");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchCart();
  }, [user?.id, isBuyNow, buyNowProduct]);

  const subtotal = items.reduce((a, c) => a + Number(c.price) * c.qty, 0);
  const total = subtotal;

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const placeOrder = async () => {
    if (!items.length) return toast.error("Cart is empty");
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.state) {
      return toast.error("Fill all delivery details");
    }

    setLoading(true);

    try {
      if (paymentMethod === "ONLINE") {
        const loaded = await loadRazorpay();
        if (!loaded) throw new Error("Razorpay failed to load");

        const amountPaise = Math.round(Number(total) * 100);
        if (amountPaise < 100) throw new Error("Order amount too low for online payment");

        const options = {
          key: "rzp_test_SGj8n5SyKSE10b",
          amount: amountPaise,
          currency: "INR",
          name: "Car Store",
          handler: async (response) => {
            await submitOrder(response.razorpay_payment_id);
          },
          prefill: {
            name: shipping.name,
            email: shipping.email,
            contact: shipping.phone,
          },
          theme: { color: "#38bdf8" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      await submitOrder();
    } catch (err) {
      console.error("Order error", err);
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const reduceStockAfterPurchase = async (items) => {
    try {
      await api.post("/products/reduce-stock", { items });
    } catch (err) {
      console.error("Stock reduction error", err);
    }
  };

  const submitOrder = async (paymentId = null) => {
    try {
      setLoading(true);

      const orderData = {
        uid: user.id,
        customerName: shipping.name,
        customerPhone: shipping.phone,
        customerEmail: shipping.email,
        orderType: "DELIVERY",
        paymentMethod,
        paymentStatus: paymentId ? "Paid" : "Pending",
        status: "orderplaced",
        shipping,
        subtotal,
        total,
        items: items.map(i => ({
          ...i,
          variant: i.variant || "" 
        }))
      };

      const res = await api.post("/orders", orderData);
      const newOrderId = res.data.orderId;

      // Reduce stock
      await reduceStockAfterPurchase(items);

      // Clear cart
      await api.delete(`/cart/user/${user.id}`);

      toast.success(`Order Placed Successfully! ID: ${newOrderId}`);
      navigate("/account", { state: { tab: "orders", highlightOrderId: newOrderId } });
    } catch (err) {
      console.error("Submit order error", err);
      throw new Error("Could not save your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="bg-black text-white py-40 text-center">Please login to checkout</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <PageHeader title="Checkout" />
      <PageContainer>
        <div className="grid lg:grid-cols-2 gap-12 py-16">
          {/* LEFT — SHIPPING */}
          <div className="border border-sky-400/40 bg-[#050b14] p-8 rounded-3xl shadow-[0_0_40px_rgba(56,189,248,0.15)]">
            <h2 className="text-sky-400 text-xl mb-6 tracking-widest font-black uppercase">Shipping Details</h2>
            
            <div className="space-y-4">
              {["name", "email", "phone", "city", "zip"].map((k) => (
                <div key={k}>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">{k}</label>
                  <input
                    value={shipping[k]}
                    onChange={(e) => setShipping({ ...shipping, [k]: e.target.value })}
                    placeholder={`Enter your ${k}`}
                    className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
                  />
                </div>
              ))}
              
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Address</label>
                <textarea
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  placeholder="Full delivery address"
                  className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl focus:border-sky-400 focus:outline-none h-24"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">State</label>
                <select
                  value={shipping.state}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Select State</option>
                  {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT — SUMMARY */}
          <div className="border border-sky-400/40 bg-[#050b14] p-8 rounded-3xl shadow-[0_0_40px_rgba(56,189,248,0.15)] h-fit">
            <h2 className="text-sky-400 text-xl mb-6 tracking-widest font-black uppercase">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <div>
                    <p className="font-bold">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.sku} × {i.qty}</p>
                  </div>
                  <p className="font-black text-sky-400">₹{i.price * i.qty}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-white text-xl font-black pt-2">
                <span>Total Amount</span>
                <span className="text-sky-400">₹{total}</span>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <h3 className="text-sky-400 text-[10px] font-black uppercase tracking-widest mb-2">Payment Method</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 rounded-2xl border text-sm font-bold transition-all ${
                    paymentMethod === "CASH" ? "border-sky-400 bg-sky-400/10 text-sky-400" : "border-white/10 text-gray-500"
                  }`}
                >
                  Cash on Delivery
                </button>
                <button
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`p-4 rounded-2xl border text-sm font-bold transition-all ${
                    paymentMethod === "ONLINE" ? "border-sky-400 bg-sky-400/10 text-sky-400" : "border-white/10 text-gray-500"
                  }`}
                >
                  Online Payment
                </button>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={loading || loadingItems}
              className="w-full mt-8 py-4 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-black font-black tracking-widest hover:scale-[1.02] transition shadow-[0_0_40px_rgba(56,189,248,0.4)] disabled:opacity-50"
            >
              {loading ? "PLACING ORDER..." : "CONFIRM ORDER"}
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
