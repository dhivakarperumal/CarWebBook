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
    const { id } = req.params;
    console.log(`\n🔍 [getServiceById] Fetching service ID: ${id}`);
    
    const [rows] = await db.query('SELECT * FROM all_services WHERE id = ?', [id]);
    console.log(`📊 [getServiceById] Service found:`, rows.length > 0 ? 'YES' : 'NO');
    
    if (!rows.length) {
      console.log(`❌ [getServiceById] Service ${id} not found in database`);
      return res.status(404).json({ message: 'Not found' });
    }
    
    // Get parts
    console.log(`🔍 [getServiceById] Querying service_parts for all_service_id=${id}...`);
    const [parts] = await db.query('SELECT * FROM service_parts WHERE all_service_id = ?', [id]);
    console.log(`✅ [getServiceById] Found ${parts.length} parts for service ${id}`);
    if (parts.length > 0) {
      parts.forEach((p, i) => console.log(`     Part ${i+1}: ${p.partName} x${p.qty} = ₹${p.total} (status: ${p.status})`));
    }
    
    const response = { ...rows[0], parts };
    res.json(response);
  } catch (err) {
    console.error(`❌ [getServiceById] Error:`, err);
    res.status(500).json({ message: 'Error fetching', error: err.message });
  }
};

/* � GET PARTS BY BOOKING ID */
exports.getPartsByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(`\n📦 [getPartsByBookingId] Fetching parts for booking ID: ${bookingId}`);
    
    // First, find the all_services record with this bookingDocId
    const [services] = await db.query('SELECT id FROM all_services WHERE bookingDocId = ?', [bookingId]);
    
    if (!services.length) {
      console.log(`⚠️ [getPartsByBookingId] No service record found for booking ${bookingId}`);
      return res.json({ parts: [] });
    }
    
    const serviceId = services[0].id;
    console.log(`✅ [getPartsByBookingId] Found service ID: ${serviceId}`);
    
    // Now get parts for this service
    const [parts] = await db.query('SELECT * FROM service_parts WHERE all_service_id = ?', [serviceId]);
    console.log(`✅ [getPartsByBookingId] Found ${parts.length} parts for service ${serviceId}`);
    
    res.json({ parts });
  } catch (err) {
    console.error(`❌ [getPartsByBookingId] Error:`, err);
    res.status(500).json({ message: 'Error fetching parts', error: err.message });
  }
};

/* �🔄 UPDATE STATUS */
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
  const { parts } = req.body;

  console.log(`\n➕ [addServiceParts] Adding parts to service ID: ${id}`);
  console.log(`📦 [addServiceParts] Parts data received:`, parts);

  if (!Array.isArray(parts)) {
    console.error(`❌ [addServiceParts] Invalid payload - parts is not an array`);
    return res.status(400).json({ message: "Invalid payload: parts must be an array" });
  }

  try {
    // Ensure schema has required columns
    await ensureServicePartsSchema();

    // Verify service exists
    const [serviceCheck] = await db.query('SELECT * FROM all_services WHERE id = ?', [id]);
    console.log(`🔍 [addServiceParts] Service ${id} exists?`, serviceCheck.length > 0);
    
    if (!serviceCheck.length) {
      console.error(`❌ [addServiceParts] Service ${id} not found`);
      return res.status(404).json({ message: 'Service not found' });
    }

    let totalAddedCost = 0;
    let insertCount = 0;
    
    for (let p of parts) {
      if (!p.partName) {
        console.log(`⚠️ [addServiceParts] Skipping part with no name`);
        continue;
      }
      const qty = Number(p.qty || 0);
      const price = Number(p.price || 0);
      const total = qty * price;

      console.log(`📝 [addServiceParts] Inserting: ${p.partName} x${qty} @ ₹${price} = ₹${total}`);

      await db.query(
        'INSERT INTO service_parts (all_service_id, partName, qty, price, total, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, p.partName, qty, price, total, p.status || 'pending']
      );
      totalAddedCost += total;
      insertCount++;
    }
    
    console.log(`✅ [addServiceParts] Inserted ${insertCount} parts, total cost: ₹${totalAddedCost}`);
    
    // Update estimatedCost in all_services
    await db.query(
      'UPDATE all_services SET estimatedCost = estimatedCost + ? WHERE id = ?',
      [totalAddedCost, id]
    );

    // Verify insertion
    const [verifyParts] = await db.query('SELECT * FROM service_parts WHERE all_service_id = ?', [id]);
    console.log(`✅ [addServiceParts] Verification: Service ${id} now has ${verifyParts.length} total parts`);

    res.json({ message: 'Parts added successfully', totalAddedCost, insertedCount: insertCount });
  } catch (err) {
    console.error("❌ [addServiceParts] Error:", err);
    res.status(500).json({ message: 'Error saving parts', error: err.message });
  }
};

async function ensureServicePartsSchema() {
  const [columns] = await db.query('SHOW COLUMNS FROM service_parts');
  const colNames = columns.map((c) => c.Field);

  if (!colNames.includes('status')) {
    await db.query("ALTER TABLE service_parts ADD COLUMN status VARCHAR(50) DEFAULT 'pending'");
  }
  if (!colNames.includes('approvedBy')) {
    await db.query("ALTER TABLE service_parts ADD COLUMN approvedBy VARCHAR(255) NULL");
  }
  if (!colNames.includes('approvalNotes')) {
    await db.query("ALTER TABLE service_parts ADD COLUMN approvalNotes TEXT NULL");
  }
  if (!colNames.includes('approvalDate')) {
    await db.query("ALTER TABLE service_parts ADD COLUMN approvalDate TIMESTAMP NULL");
  }
}

/* ✅ APPROVE/REJECT SERVICE PART */
exports.approveServicePart = async (req, res) => {
  const { serviceId, partId } = req.params;
  const { status, approvedBy, approvalNotes } = req.body; // status: "approved" or "rejected"

  console.log(`\n✅ [approveServicePart] Approving part ${partId} for service ${serviceId}`);
  console.log(`📝 [approveServicePart] Status: ${status}, Approved by: ${approvedBy}`);

  try {
    // Ensure required columns exist to avoid Unknown column errors in older DBs
    const columns = await db.query("SHOW COLUMNS FROM service_parts");
    const colNames = columns[0].map((c) => c.Field);

    if (!colNames.includes('status')) {
      await db.query("ALTER TABLE service_parts ADD COLUMN status VARCHAR(50) DEFAULT 'pending'");
      console.log('✅ [approveServicePart] Added missing column service_parts.status');
    }
    if (!colNames.includes('approvedBy')) {
      await db.query("ALTER TABLE service_parts ADD COLUMN approvedBy VARCHAR(255) NULL");
      console.log('✅ [approveServicePart] Added missing column service_parts.approvedBy');
    }
    if (!colNames.includes('approvalNotes')) {
      await db.query("ALTER TABLE service_parts ADD COLUMN approvalNotes TEXT NULL");
      console.log('✅ [approveServicePart] Added missing column service_parts.approvalNotes');
    }
    if (!colNames.includes('approvalDate')) {
      await db.query("ALTER TABLE service_parts ADD COLUMN approvalDate TIMESTAMP NULL");
      console.log('✅ [approveServicePart] Added missing column service_parts.approvalDate');
    }

    const approvalDate = status === 'approved' ? new Date() : null;

    // Update the specific part's status
    const [updateResult] = await db.query(
      'UPDATE service_parts SET status = ?, approvedBy = ?, approvalNotes = ?, approvalDate = ? WHERE id = ? AND all_service_id = ?',
      [status, approvedBy, approvalNotes, approvalDate, partId, serviceId]
    );

    if (updateResult.affectedRows === 0) {
      console.warn(`⚠️ [approveServicePart] No part found for id=${partId}, all_service_id=${serviceId}`);
      return res.status(404).json({ message: 'Part not found' });
    }

    console.log(`✅ [approveServicePart] Updated rows: ${updateResult.affectedRows}`);

    // Check if all parts are now approved or rejected
    const [pendingParts] = await db.query(
      'SELECT COUNT(*) as count FROM service_parts WHERE all_service_id = ? AND status = "pending"',
      [serviceId]
    );

    console.log(`✅ [approveServicePart] Pending parts count: ${pendingParts[0].count}`);

    res.json({ message: `Part ${status} successfully` });
  } catch (err) {
    console.error("❌ [approveServicePart] Error:", err);
    res.status(500).json({ message: 'Error updating part status', error: err.message });
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
