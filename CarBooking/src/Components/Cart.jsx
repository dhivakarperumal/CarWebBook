import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import PageHeader from "./PageHeader";

export default function Cart() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      collection(db, "users", user.uid, "cart"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setItems(data);
      },
    );

    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-black text-white py-40 text-center">
        Please login to view cart
      </div>
    );
  }

  const increase = async (item) => {
    await updateDoc(doc(db, "users", user.uid, "cart", item.id), {
      quantity: item.quantity + 1,
    });
  };

  const decrease = async (item) => {
    if (item.quantity <= 1) return;
    await updateDoc(doc(db, "users", user.uid, "cart", item.id), {
      quantity: item.quantity - 1,
    });
  };

  const remove = async (item) => {
    await deleteDoc(doc(db, "users", user.uid, "cart", item.id));
  };

  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);

  return (
    <>
    <PageHeader title="Cart" />
    <section className="bg-black text-white py-24">
      <PageContainer>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate("/products")}
              className="px-10 py-4 rounded-full bg-sky-400 text-black font-semibold cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* LEFT — ITEMS */}
            <div className="lg:col-span-2 ">
              {/* Desktop Header */}
              <div
                className="hidden md:grid grid-cols-6 gap-8 items-center
bg-[#0c192c]/80 backdrop-blur-xl p-6 rounded-2xl
border border-white/10
shadow-[0_0_0_rgba(0,0,0,0)]
hover:border-sky-400/40
hover:shadow-[0_25px_80px_rgba(56,189,248,0.35)]
transition-all duration-500"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
bg-gradient-to-r from-sky-500/5 to-cyan-400/5 transition pointer-events-none"
                />

                <span className="col-span-2">Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Subtotal</span>
                <span>Action</span>
              </div>

              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-6 mt-3 gap-8 items-center
        bg-[#0c192c] p-6 rounded-2xl border border-white/10"
                  >
                    {/* PRODUCT */}
                    <div className="md:col-span-2 flex items-center gap-5">
                      <img
                        src={item.image}
                        className="w-20 h-20 object-cover rounded-xl shrink-0
transition-transform duration-500 group-hover:scale-110"
                      />

                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="text-sky-400 font-semibold">
                      ₹{item.price}
                    </div>

                    {/* QUANTITY */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decrease(item)}
                        className="w-9 h-9 rounded-full bg-gray-800"
                      >
                        −
                      </button>

                      <span className="font-bold">{item.quantity}</span>

                      <button
                        onClick={() => increase(item)}
                        className="w-9 h-9 rounded-full bg-gray-800"
                      >
                        +
                      </button>
                    </div>

                    {/* SUBTOTAL */}
                    <div className="text-white font-bold">
                      ₹{item.price * item.quantity}
                    </div>

                    {/* TRASH */}
                    <div className="flex md:justify-center">
                      <button
                        onClick={() => remove(item)}
                        className="text-red-400 hover:text-red-500
hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]
transition-all duration-300 cursor-pointer"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — SUMMARY */}
            <div className="bg-[#050b14] rounded-2xl p-8 border border-sky-400/30 h-fit">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>

              <div className="space-y-4 text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>

                <div className="h-px bg-white/10 my-4" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-sky-400">₹{subtotal}</span>
                </div>
              </div>

              <button
  onClick={() => navigate("/checkout")}
  className="w-full mt-8 py-4 rounded-xl font-semibold text-black
  bg-gradient-to-r from-sky-400 to-cyan-300
  hover:scale-105 transition-all duration-300 cursor-pointer"
>
  Proceed To Checkout
</button>
            </div>
          </div>
        )}
      </PageContainer>
    </section>
    </>
  );
}
