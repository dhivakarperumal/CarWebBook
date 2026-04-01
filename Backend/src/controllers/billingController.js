const db = require('../config/db.js');

/* 📋 GET ALL BILLINGS */
exports.getAllBillings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM billings ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ➕ CREATE INVOICE */
exports.createInvoice = async (req, res) => {
  const {
    invoiceNo,
    serviceId,
    bookingId,
    customerName,
    mobileNumber,
    car,
    parts,
    partsTotal,
    labour,
    gstPercent,
    gstAmount,
    subTotal,
    grandTotal,
    paymentStatus,
    paymentMode,
    status
  } = req.body;

  try {
    // 1. Insert into billings table
    const [result] = await db.query(`
      INSERT INTO billings (
        invoiceNo, serviceId, bookingId, customerName, mobileNumber, car, 
        partsTotal, labour, gstPercent, gstAmount, subTotal, grandTotal, 
        paymentStatus, paymentMode, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNo, serviceId, bookingId, customerName, mobileNumber, car,
      partsTotal, labour, gstPercent, gstAmount, subTotal, grandTotal,
      paymentStatus, paymentMode, status
    ]);

    const billing_id = result.insertId;

    // 2. Insert parts into billing_items
    if (parts && parts.length) {
      for (const p of parts) {
        await db.query(`
          INSERT INTO billing_items (billing_id, partName, qty, price, total)
          VALUES (?, ?, ?, ?, ?)
        `, [billing_id, p.partName, p.qty, p.price, p.total]);
      }
    }

    // 3. Mark service as "Bill Completed"
    if (serviceId) {
      await db.query('UPDATE all_services SET serviceStatus = ? WHERE id = ?', ['Bill Completed', serviceId]);
    }

    res.json({ id: billing_id, message: 'Invoice generated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* ❌ DELETE INVOICE */
exports.deleteInvoice = async (req, res) => {
  try {
    await db.query('DELETE FROM billings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ✏️ UPDATE INVOICE STATUS */
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ message: 'paymentStatus is required' });
    }
    
    // Update the paymentStatus in the billings table
    await db.query('UPDATE billings SET paymentStatus = ? WHERE id = ?', [paymentStatus, req.params.id]);
    
    // Check if billing document exists
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔍 GET ONE INVOICE IN DETAIL */
exports.getInvoiceById = async (req, res) => {
  try {
    const [bills] = await db.query('SELECT * FROM billings WHERE id = ?', [req.params.id]);
    if (!bills.length) return res.status(404).json({ message: 'Not found' });
    
    const [items] = await db.query('SELECT * FROM billing_items WHERE billing_id = ?', [req.params.id]);
    res.json({ ...bills[0], parts: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
