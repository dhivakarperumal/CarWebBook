const db = require('../config/db.js');

/* 📋 GET ALL SERVICES */
exports.getAllServices = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM all_services ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching', error: err.message });
  }
};

/* 🔍 GET ONE SERVICE */
exports.getServiceById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM all_services WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    
    // Get parts too
    const [parts] = await db.query('SELECT * FROM service_parts WHERE all_service_id = ?', [req.params.id]);
    res.json({ ...rows[0], parts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching', error: err.message });
  }
};

/* 🔄 UPDATE STATUS */
exports.updateServiceStatus = async (req, res) => {
  const { id } = req.params;
  const { serviceStatus } = req.body;
  try {
    // 1. Update service status
    await db.query('UPDATE all_services SET serviceStatus = ? WHERE id = ?', [serviceStatus, id]);
    
    // 2. Map service status to booking status for consistency
    let bookingStatus = serviceStatus;
    if (serviceStatus === 'Completed') bookingStatus = 'Service Completed';
    else if (serviceStatus === 'Cancelled') bookingStatus = 'Cancelled';
    
    // 3. Update bookings table if linked
    const [service] = await db.query('SELECT bookingDocId, uid FROM all_services WHERE id = ?', [id]);
    if (service.length && service[0].bookingDocId) {
       await db.query('UPDATE bookings SET status = ? WHERE id = ?', [bookingStatus, service[0].bookingDocId]);
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

/* 🧑🔧 ASSIGN MECHANIC */
exports.assignMechanic = async (req, res) => {
  const { id } = req.params;
  const { assignedEmployeeId, assignedEmployeeName, serviceStatus } = req.body;
  try {
    await db.query(
      'UPDATE all_services SET assignedEmployeeId = ?, assignedEmployeeName = ?, serviceStatus = ? WHERE id = ?',
      [assignedEmployeeId, assignedEmployeeName, serviceStatus || 'Processing', id]
    );
    res.json({ message: 'Mechanic assigned' });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning mechanic', error: err.message });
  }
};

/* ⚙️ ADD PARTS */
exports.addServiceParts = async (req, res) => {
  const { id } = req.params;
  const { parts } = req.body; // Array of { partName, qty, price }

  if (!Array.isArray(parts)) {
    return res.status(400).json({ message: "Invalid payload: parts must be an array" });
  }

  try {
    let totalAddedCost = 0;
    for (let p of parts) {
      if (!p.partName) continue;
      const qty = Number(p.qty || 0);
      const price = Number(p.price || 0);
      const total = qty * price;

      await db.query(
        'INSERT INTO service_parts (all_service_id, partName, qty, price, total) VALUES (?, ?, ?, ?, ?)',
        [id, p.partName, qty, price, total]
      );
      totalAddedCost += total;
    }
    
    // Update estimatedCost in all_services
    await db.query(
      'UPDATE all_services SET estimatedCost = estimatedCost + ? WHERE id = ?',
      [totalAddedCost, id]
    );

    res.json({ message: 'Parts added successfully', totalAddedCost });
  } catch (err) {
    console.error("AddServiceParts Error:", err);
    res.status(500).json({ message: 'Error saving parts', error: err.message });
  }
};

/* ❌ DELETE SERVICE */
exports.deleteService = async (req, res) => {
  try {
    await db.query('DELETE FROM all_services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting', error: err.message });
  }
};
