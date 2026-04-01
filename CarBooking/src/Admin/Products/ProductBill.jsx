import React, { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const ProductBilling = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);

  /* CUSTOMER (for SHOP) */
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  /* ORDER TYPE */
  const [orderType, setOrderType] = useState("shop");

  /* SHIPPING (for ONLINE) */
  const [shipping, setShipping] = useState({
    name: "", phone: "", address: "", city: "", pincode: "",
  });

  /* FETCH PRODUCTS */
  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Failed to load products"));
  }, []);

  const selectedProduct = products.find((p) => String(p.docId) === String(selectedProductId));
  const selectedVariant = selectedProduct?.variants?.[selectedVariantIndex];
  const price = selectedProduct?.offerPrice || selectedProduct?.mrp || 0;

  /* ADD TO CART */
  const addToCart = () => {
    if (!selectedProduct || selectedVariantIndex === "") {
      toast.error("Select product & variant");
      return;
    }
    if (qty <= 0) { toast.error("Enter valid quantity"); return; }
    if (qty > selectedVariant.stock) { toast.error("Not enough stock"); return; }

    const item = {
      productId: selectedProduct.docId,
      name: selectedProduct.name,
      variant: `${selectedVariant.position} | ${selectedVariant.material}`,
      sku: selectedVariant.sku,
      price,
      qty: Number(qty),
      total: price * qty,
      variantIndex: selectedVariantIndex,
    };

    setCart((prev) => [...prev, item]);
    setQty(1);
  };

  const removeItem = (index) => setCart(cart.filter((_, i) => i !== index));

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  /* ORDER ID */
  const generateOrderId = async () => {
    const res = await api.get("/orders");
    const count = (res.data?.length || 0) + 1;
    return `ORD${String(count).padStart(3, "0")}`;
  };

  /* PRINT */
  const handlePrint = (billData) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f4f4f4; }
            .total { text-align: right; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h2>INVOICE</h2>
          <p><strong>Order No:</strong> ${billData.orderId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <h3>Customer</h3>
          <p>Name: ${billData.customer.name}</p>
          <p>Phone: ${billData.customer.phone}</p>
          ${billData.orderType === "online" ? `
            <h3>Shipping</h3>
            <p>${billData.shipping.name}</p>
            <p>${billData.shipping.phone}</p>
            <p>${billData.shipping.address}</p>
            <p>${billData.shipping.city} - ${billData.shipping.pincode}</p>
          ` : ""}
          <table>
            <thead>
              <tr><th>Product</th><th>Variant</th><th>Price</th><th>Qty</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${billData.items.map((item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.variant}</td>
                  <td>₹ ${item.price}</td>
                  <td>${item.qty}</td>
                  <td>₹ ${item.total}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="total">Grand Total: ₹ ${billData.total}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  /* SAVE ORDER */
  const handleSaveBill = async () => {
    const isOnline = orderType === "online";

    if (
      (isOnline && (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode)) ||
      (!isOnline && (!customer.name || !customer.phone))
    ) {
      toast.error("Enter required details");
      return;
    }
    if (cart.length === 0) { toast.error("Cart is empty"); return; }

    try {
      const orderId = await generateOrderId();

      /* UPDATE STOCK for each cart item */
      for (const item of cart) {
        const product = products.find((p) => String(p.docId) === String(item.productId));
        const updatedVariants = product.variants.map((v, i) => {
          if (i === Number(item.variantIndex)) {
            return { ...v, stock: Number(v.stock) - item.qty };
          }
          return v;
        });
        const totalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
        await api.put(`/products/stock/${product.docId}`, { variants: updatedVariants, totalStock });
      }

      const orderData = {
        orderId,
        customer: isOnline ? shipping : customer,
        orderType,
        shipping: isOnline ? shipping : null,
        items: cart,
        subtotal: grandTotal,
        total: grandTotal,
        paymentMethod: isOnline ? "ONLINE" : "CASH",
        paymentStatus: isOnline ? "Paid" : "Pending",
        status: "OrderPlaced",
      };

      await api.post("/orders", orderData);

      toast.success("Order saved ✅");
      handlePrint(orderData);

      /* RESET */
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setShipping({ name: "", phone: "", address: "", city: "", pincode: "" });
      setOrderType("shop");
      /* Refresh products stock */
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Order failed ❌");
    }
  };

  const inputClass = "w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-black outline-none transition";
  const btnClass = "bg-gradient-to-r from-black to-cyan-400 text-white px-6 py-3 rounded hover:from-cyan-400 hover:to-black transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg";

  return (
    <div className="max-w-6xl mx-auto bg-white p-4 rounded-2xl shadow space-y-6">
      <h2 className="text-2xl font-bold">Billing</h2>

      {/* CUSTOMER (SHOP) */}
      {orderType === "shop" && (
        <div className="grid md:grid-cols-3 gap-3">
          <input placeholder="Customer Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputClass} />
          <input placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputClass} />
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className={inputClass}>
            <option value="shop">Shop</option>
            <option value="online">Online</option>
          </select>
        </div>
      )}

      {/* SHIPPING (ONLINE) */}
      {orderType === "online" && (
        <div className="grid md:grid-cols-2 gap-3">
          <input placeholder="Shipping Name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} className={inputClass} />
          <input placeholder="Shipping Phone" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} className={inputClass} />
          <input placeholder="Address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className={`${inputClass} md:col-span-2`} />
          <input placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className={inputClass} />
          <input placeholder="Pincode" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} className={inputClass} />
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className={inputClass}>
            <option value="online">Online</option>
            <option value="shop">Shop</option>
          </select>
        </div>
      )}

      {/* PRODUCT SELECT */}
      <div className="grid md:grid-cols-4 gap-3">
        <select
          value={selectedProductId}
          onChange={(e) => { setSelectedProductId(e.target.value); setSelectedVariantIndex(""); }}
          className={inputClass}
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.docId} value={p.docId}>{p.name}</option>
          ))}
        </select>

        <select
          value={selectedVariantIndex}
          onChange={(e) => setSelectedVariantIndex(e.target.value)}
          className={inputClass}
        >
          <option value="">Select Variant</option>
          {selectedProduct?.variants?.map((v, i) => (
            <option key={i} value={i}>
              {v.position} | {v.material} (Stock: {v.stock})
            </option>
          ))}
        </select>

        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={inputClass} placeholder="Qty" />

        <button onClick={addToCart} className={btnClass}>Add</button>
      </div>

      {/* CART TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl mt-4 shadow">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gradient-to-r from-black to-cyan-400 text-white text-left">
            <tr>
              <th className="px-4 py-4">S No</th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">Variant</th>
              <th className="px-4 py-4">Price</th>
              <th className="px-4 py-4">Qty</th>
              <th className="px-4 py-4">Total</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">Cart is empty</td></tr>
            ) : cart.map((item, i) => (
              <tr key={i} className="border-t border-gray-300">
                <td className="px-4 py-4">{i + 1}</td>
                <td className="px-4 py-4">{item.name}</td>
                <td className="px-4 py-4">{item.variant}</td>
                <td className="px-4 py-4">₹ {item.price}</td>
                <td className="px-4 py-4">{item.qty}</td>
                <td className="px-4 py-4 font-semibold">₹ {item.total}</td>
                <td className="px-4 py-4">
                  <button onClick={() => removeItem(i)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end text-xl font-bold">Grand Total: ₹ {grandTotal}</div>

      <div className="flex justify-end">
        <button onClick={handleSaveBill} className={btnClass}>
          Save Order & Print
        </button>
      </div>
    </div>
  );
};

export default ProductBilling;
