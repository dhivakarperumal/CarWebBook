const db = require('../config/db.js');

/* 📋 GET ALL ORDERS */
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_orders ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔍 GET ORDER BY ID */
exports.getOrderById = async (req, res) => {
  try {
    const order_id = req.params.id;
    // We can fetch by orderId or internal id
    const [orders] = await db.query('SELECT * FROM product_orders WHERE id = ? OR orderId = ?', [order_id, order_id]);
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });
    
    const [items] = await db.query('SELECT * FROM product_order_items WHERE order_internal_id = ?', [orders[0].id]);
    res.json({ ...orders[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔄 UPDATE STATUS */
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, cancelledReason } = req.body;
  try {
    await db.query('UPDATE product_orders SET status = ?, cancelledReason = ? WHERE id = ?', [status, cancelledReason, id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ➕ CREATE ORDER */
exports.createOrder = async (req, res) => {
  const {
    orderId, uid, customerName, customerPhone, customerEmail,
    orderType, paymentMethod, paymentStatus, status,
    shipping, subtotal, tax, shippingFee, total, items
  } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO product_orders (
        orderId, uid, customerName, customerPhone, customerEmail,
        orderType, paymentMethod, paymentStatus, status,
        shippingName, shippingPhone, shippingAddress, shippingCity,
        shippingState, shippingZip, shippingCountry,
        subtotal, tax, shippingFee, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, uid, customerName, customerPhone, customerEmail,
      orderType, paymentMethod, paymentStatus || 'Pending', status || 'OrderPlaced',
      shipping?.name, shipping?.phone, shipping?.address, shipping?.city,
      shipping?.state, shipping?.zip, shipping?.country,
      subtotal, tax, shippingFee, total
    ]);

    const order_internal_id = result.insertId;

    if (items && items.length) {
      for (const i of items) {
        await db.query(`
          INSERT INTO product_order_items (order_internal_id, productId, name, variant, sku, price, qty, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [order_internal_id, i.productId, i.name, i.variant, i.sku, i.price, i.qty || i.quantity, i.total]);
      }
    }

    res.json({ id: order_internal_id, message: 'Order created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
