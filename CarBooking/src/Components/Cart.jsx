import React, { useEffect, useState } from "react";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import PageHeader from "./PageHeader";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import toast from "react-hot-toast";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchItems = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/cart/${user.id}`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Cart fetch error", err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="bg-black text-white py-40 text-center">
        Please login to view cart
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-black text-white py-40 text-center">
        Loading cart...
      </div>
    );
  }

  const increase = async (item) => {
    try {
      const newQty = item.quantity + 1;
      await api.put(`/cart/item/${item.id}`, { quantity: newQty });
      setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const decrease = async (item) => {
    if (item.quantity <= 1) return;
    try {
      const newQty = item.quantity - 1;
      await api.put(`/cart/item/${item.id}`, { quantity: newQty });
      setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const remove = async (item) => {
    try {
      await api.delete(`/cart/item/${item.id}`);
      setItems(items.filter(i => i.id !== item.id));
      toast.success("Item removed");
    } catch (err) {
      toast.error("Remove failed");
    }
  };

  const subtotal = items.reduce((t, i) => t + Number(i.price) * i.quantity, 0);

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
              <div className="lg:col-span-2">
                <div className="hidden md:grid grid-cols-6 gap-8 items-center bg-[#0c192c]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 transition-all duration-500">
                  <span className="col-span-2">Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Subtotal</span>
                  <span>Action</span>
                </div>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 mt-3 gap-8 items-center bg-[#0c192c] p-6 rounded-2xl border border-white/10">
                      <div className="md:col-span-2 flex items-center gap-5">
                        <img src={item.image || "https://via.placeholder.com/100"} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          {item.variant && <p className="text-xs text-sky-400">Variant: {item.variant}</p>}
                          {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                        </div>
                      </div>
                      <div className="text-sky-400 font-semibold">₹{item.price}</div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => decrease(item)} className="w-9 h-9 rounded-full bg-gray-800">−</button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => increase(item)} className="w-9 h-9 rounded-full bg-gray-800">+</button>
                      </div>
                      <div className="text-white font-bold">₹{item.price * item.quantity}</div>
                      <div className="flex md:justify-center">
                        <button onClick={() => remove(item)} className="text-red-400 hover:text-red-500 transition-all duration-300 cursor-pointer">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="w-full mt-8 py-4 rounded-xl font-semibold text-black bg-gradient-to-r from-sky-400 to-cyan-300 hover:scale-105 transition-all duration-300 cursor-pointer"
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
