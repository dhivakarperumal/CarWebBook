import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import toast from "react-hot-toast";
import { saveUserAddress } from "./saveUserAddress";
import { reduceStockAfterPurchase } from "./reduceStockAfterPurchase";

/* 🔥 ORDER COUNTER */
const generateOrderNumber = async () => {
  const ref = doc(db, "counters", "current");

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists() ? snap.data().current : 0) + 1;
    tx.set(ref, { current: next }, { merge: true });
    return `ORD${String(next).padStart(3, "0")}`;
  });
};

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

  const buyNowProduct = location.state?.product;
  const isBuyNow = location.state?.isBuyNow;

  /* ================= AUTH ================= */
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  /* ================= CART ================= */
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!uid) return;

    // BUY NOW FLOW
    if (isBuyNow && buyNowProduct) {
      setItems([{ id: "buynow", ...buyNowProduct }]);
      return;
    }

    // NORMAL CART FLOW
    getDocs(collection(db, "users", uid, "cart")).then((snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  /* ================= ADDRESSES ================= */
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (!uid) return;
    getDocs(collection(db, "users", uid, "addresses")).then((snap) => {
      setSavedAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  /* ================= SHIPPING FORM ================= */
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

  const selectAddress = (addr) => {
    setShipping({
      name: addr.fullName,
      email: addr.email || "",
      phone: addr.phone,
      address: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.pinCode,
      country: addr.country || "India",
    });
    setSelectedAddressId(addr.id);
  };

  /* ================= ORDER STATE ================= */
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [orderType] = useState("DELIVERY");

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const total = subtotal;

  /* ================= CLEAR CART ================= */
  const clearCart = async () => {
    const snap = await getDocs(collection(db, "users", uid, "cart"));
    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db, "users", uid, "cart", d.id))),
    );
  };

  /* ================= RAZORPAY LOADER ================= */
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  /* ================= SAVE ORDER ================= */
  const saveOrder = async (paymentId = null) => {
    if (!uid) throw new Error("User not logged in");

    await reduceStockAfterPurchase(items);

    const orderNumber = await generateOrderNumber();
    const orderRef = doc(collection(db, "orders"));
    const userOrderRef = doc(db, "users", uid, "orders", orderRef.id);

    const orderData = {
      docId: orderRef.id,
      orderId: orderNumber,
      uid,
      items,
      orderType,
      shipping,
      subtotal,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "CASH" ? "Pending" : "Paid",
      status: "orderplaced",
      paymentId,
      createdAt: Timestamp.now(),
    };

    try {
      await saveUserAddress(uid, {
        fullName: shipping.name,
        email: shipping.email,
        phone: shipping.phone,
        street: shipping.address,
        city: shipping.city,
        state: shipping.state,
        pinCode: shipping.zip,
        country: shipping.country,
      });
    } catch (err) {
      if (err.message !== "DUPLICATE_ADDRESS") throw err;
    }

    await Promise.all([
      setDoc(orderRef, orderData),
      setDoc(userOrderRef, orderData),
    ]);

    if (!isBuyNow) {
      await clearCart();
    }

    toast.success(`Order ${orderNumber} placed 🎉`);
    navigate("/account", { state: { tab: "orders" } });
  };

  /* ================= PLACE ORDER ================= */
  const placeOrder = async () => {
    if (!items.length) return toast.error("Cart is empty");

    if (
      !shipping.name ||
      !shipping.phone ||
      !shipping.address ||
      !shipping.state
    ) {
      return toast.error("Fill all delivery details");
    }

    setPlacing(true);

    try {
      if (paymentMethod === "CASH") {
        await saveOrder();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed");

      // Validate amount
      const amountPaise = Math.round(Number(total) * 100);
      if (!amountPaise || amountPaise < 100) {
        throw new Error("Invalid order amount for payment");
      }

      const options = {
        key: "rzp_test_SGj8n5SyKSE10b",
        amount: amountPaise,
        currency: "INR",
        name: "Your Store",
        handler: async (res) => {
          try {
            await saveOrder(res.razorpay_payment_id);
          } catch (e) {
            console.error("Failed to save order after payment:", e);
            toast.error("Payment was successful but saving the order failed. Contact support.");
          }
        },
        prefill: {
          name: shipping.name,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: { color: "#38bdf8" },
        modal: {
          ondismiss: function () {
            toast('Payment cancelled', { icon: '⚠️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Better failure handling to map Razorpay messages to user-friendly text
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response);

        // Extract message
        const errMsg = response?.error?.description || response?.error?.reason || response?.error || 'Payment failed';

        // Map common gateway message to helpful guidance
        const mapped = (typeof errMsg === 'string' && errMsg.toLowerCase().includes('please use another method'))
          ? 'Payment declined by gateway. Try a different card/UPI or choose Cash on Delivery.'
          : errMsg;

        toast.error(mapped);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <PageHeader title="Checkout" />

      <PageContainer>
        <div className="grid lg:grid-cols-2 gap-12 py-16">
          {/* LEFT */}
          <div className="border border-sky-400/40 bg-black/80 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.25)]">
            {savedAddresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sky-400 text-sm tracking-widest">
                  SAVED ADDRESSES
                </h3>

                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className={`p-4 rounded-xl border cursor-pointer
                      ${
                        selectedAddressId === addr.id
                          ? "border-sky-400 bg-sky-400/10"
                          : "border-sky-400/30"
                      }`}
                  >
                    <p className="font-semibold text-sm">{addr.fullName}</p>
                    <p className="text-xs text-gray-300">
                      {addr.street}, {addr.city}
                    </p>
                    <p className="text-xs text-gray-400">
                      {addr.state} - {addr.pinCode}
                    </p>
                    <p className="text-xs mt-1">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-sky-400 text-xl mb-4 tracking-widest">
              SHIPPING
            </h2>

            {["name", "email", "phone", "city", "zip"].map((k) => (
              <input
                key={k}
                value={shipping[k]}
                onChange={(e) =>
                  setShipping({ ...shipping, [k]: e.target.value })
                }
                placeholder={k.toUpperCase()}
                className="w-full mb-4 bg-black border border-sky-400/40 px-4 py-3 rounded-xl"
              />
            ))}

            <textarea
              value={shipping.address}
              onChange={(e) =>
                setShipping({ ...shipping, address: e.target.value })
              }
              placeholder="ADDRESS"
              className="w-full mb-4 bg-black border border-sky-400/40 px-4 py-3 rounded-xl"
            />

            <select
              value={shipping.state}
              onChange={(e) =>
                setShipping({ ...shipping, state: e.target.value })
              }
              className="w-full bg-black border border-sky-400/40 px-4 py-3 rounded-xl"
            >
              <option value="">Select State</option>
              {indianStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* RIGHT */}
          <div className="border border-sky-400/40 bg-black/80 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.25)]">
            <h2 className="text-sky-400 text-xl mb-6 tracking-widest">
              SUMMARY
            </h2>

            {items.map((i) => (
              <div key={i.id} className="flex justify-between mb-3">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>₹{i.price * i.quantity}</span>
              </div>
            ))}

            <div className="border-t border-sky-400/40 mt-6 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-sky-400">₹{total}</span>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sky-400 text-sm tracking-widest">
                PAYMENT METHOD
              </h3>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                  className="accent-sky-400"
                />
                Cash on Delivery
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="accent-sky-400"
                />
                Online Payment (Razorpay)
              </label>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full mt-6 py-3 rounded-full
              bg-gradient-to-r from-sky-500 to-cyan-400
              text-black font-semibold tracking-widest
              hover:scale-105 transition
              shadow-[0_0_30px_rgba(56,189,248,0.6)] cursor-pointer"
            >
              {placing ? "Processing..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
