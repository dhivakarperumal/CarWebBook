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

/* 💰 UPDATE PAYMENT STATUS ONLY */
exports.updatePaymentStatus = async (req, res) => {
  const { paymentStatus } = req.body;
  const newStatus = paymentStatus.toLowerCase() === 'paid' ? 'Paid' : 'Generated';
  try {
    await db.query('UPDATE billings SET paymentStatus = ?, status = ? WHERE id = ?', [paymentStatus, newStatus, req.params.id]);
    res.json({ message: 'Payment status updated' });
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
    registrationNumber,
    parts,
    issues,
    partsTotal,
    issueTotal,
    labour,
    gstPercent,
    gstAmount,
    discount,
    subTotal,
    grandTotal,
    paymentStatus,
    paymentMode,
    status,
    billingType
  } = req.body;

  try {
    // 1. Insert into billings table
    const [result] = await db.query(`
      INSERT INTO billings (
        invoiceNo, serviceId, bookingId, customerName, mobileNumber, car,
        registrationNumber, partsTotal, issueTotal, labour, gstPercent, gstAmount,
        discount, subTotal, grandTotal, paymentStatus, paymentMode, status, billingType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNo, serviceId, bookingId, customerName, mobileNumber, car,
      registrationNumber, partsTotal, issueTotal || 0, labour, gstPercent, gstAmount,
      discount || 0, subTotal, grandTotal, paymentStatus, paymentMode, status || 'Generated', billingType || 'online'
    ]);

    const billing_id = result.insertId;

    // 2. Insert spare parts into billing_items
    if (parts && parts.length) {
      for (const p of parts) {
        await db.query(
          'INSERT INTO billing_items (billing_id, partName, qty, price, total) VALUES (?, ?, ?, ?, ?)',
          [billing_id, p.partName, p.qty, p.price, p.total]
        );
      }
    }

    // 3. Insert diagnostic issues into billing_items (as line items)
    if (issues && issues.length) {
      for (const i of issues) {
        await db.query(
          'INSERT INTO billing_items (billing_id, partName, qty, price, total) VALUES (?, ?, ?, ?, ?)',
          [billing_id, `[Issue] ${i.issueName}`, 1, i.amount, i.amount]
        );
      }
    }

    // 4. Mark service as "Bill Completed"
    if (serviceId) {
      await db.query('UPDATE all_services SET serviceStatus = ? WHERE id = ?', ['Bill Completed', serviceId]);
    }

    // 5. Mark booking as "Completed" via bookingId
    if (bookingId && !String(bookingId).startsWith('MANUAL')) {
      await db.query('UPDATE bookings SET status = ? WHERE bookingId = ?', ['Completed', bookingId]);
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

/* ✏️ UPDATE INVOICE (full update) */
exports.updateInvoiceStatus = async (req, res) => {
  const {
    invoiceNo,
    serviceId,
    bookingId,
    customerName,
    mobileNumber,
    car,
    registrationNumber,
    parts,
    issues,
    partsTotal,
    issueTotal,
    labour,
    gstPercent,
    gstAmount,
    discount,
    subTotal,
    grandTotal,
    paymentStatus,
    paymentMode,
    status,
    billingType
  } = req.body;

  try {
    // 1. Update the main billing record — safe numeric defaults to avoid MySQL DECIMAL errors
    await db.query(`
      UPDATE billings SET
        invoiceNo = ?, serviceId = ?, bookingId = ?, customerName = ?, mobileNumber = ?,
        car = ?, registrationNumber = ?, partsTotal = ?, issueTotal = ?, labour = ?,
        gstPercent = ?, gstAmount = ?, discount = ?, subTotal = ?, grandTotal = ?,
        paymentStatus = ?, paymentMode = ?, status = ?, billingType = ?
      WHERE id = ?
    `, [
      invoiceNo || null,
      serviceId || null,
      bookingId || null,
      customerName || null,
      mobileNumber || null,
      car || null,
      registrationNumber || null,
      Number(partsTotal) || 0,
      Number(issueTotal) || 0,
      Number(labour) || 0,
      Number(gstPercent) || 0,
      Number(gstAmount) || 0,
      Number(discount) || 0,
      Number(subTotal) || 0,
      Number(grandTotal) || 0,
      paymentStatus || 'Pending',
      paymentMode || null,
      status || 'Generated',
      billingType || 'manual',
      req.params.id
    ]);

    // 2. Refresh parts — delete old, insert new
    await db.query('DELETE FROM billing_items WHERE billing_id = ?', [req.params.id]);
    if (parts && parts.length) {
      for (const p of parts) {
        await db.query(
          'INSERT INTO billing_items (billing_id, partName, qty, price, total) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, p.partName, Number(p.qty) || 1, Number(p.price) || 0, Number(p.total) || 0]
        );
      }
    }

    // 3. Mark all_services as Bill Completed
    if (serviceId) {
      await db.query('UPDATE all_services SET serviceStatus = ? WHERE id = ?', ['Bill Completed', serviceId]);
    }

    // 4. Mark booking as Completed
    if (bookingId && !String(bookingId).startsWith('MANUAL')) {
      await db.query('UPDATE bookings SET status = ? WHERE bookingId = ?', ['Completed', bookingId]);
    }

    res.json({ message: 'Invoice updated successfully' });
  } catch (err) {
    console.error('updateInvoiceStatus error:', err);
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
