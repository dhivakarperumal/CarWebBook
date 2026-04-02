const db = require('../config/db');

exports.createAppointment = async (req, res) => {
  try {
    const { 
      uid, name, email, phone, address, city, pincode,
      vehicleType, brand, model, registrationNumber, fuelType,
      yearOfManufacture, currentMileage, serviceType, otherIssue,
      pickupDrop, preferredDate, preferredTimeSlot, serviceMode,
      pickupAddress, location, latitude, longitude, paymentMode,
      estimatedCost, couponCode, notes, emergencyService, termsAccepted
    } = req.body;

    const tempId = `TEMP-${Date.now()}`;
    const [result] = await db.query(
      `INSERT INTO appointments 
      (appointmentId, uid, name, email, phone, address, city, pincode,
      vehicleType, brand, model, registrationNumber, fuelType,
      yearOfManufacture, currentMileage, serviceType, otherIssue,
      pickupDrop, preferredDate, preferredTimeSlot, serviceMode,
      pickupAddress, location, latitude, longitude, paymentMode,
      estimatedCost, couponCode, notes, emergencyService, termsAccepted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tempId, uid, name, email, phone, address || null, city || null, pincode || null,
        vehicleType, brand || null, model || null, registrationNumber, fuelType,
        yearOfManufacture ? parseInt(yearOfManufacture) : null,
        currentMileage ? parseInt(currentMileage) : null,
        serviceType, otherIssue || null,
        pickupDrop, preferredDate, preferredTimeSlot, serviceMode,
        pickupAddress || null, location || null,
        latitude || null, longitude || null,
        paymentMode,
        estimatedCost || 0, couponCode || null, notes || null,
        emergencyService ? 1 : 0, termsAccepted ? 1 : 0
      ]
    );

    const insertId = result.insertId;
    const generatedAppointmentId = `APT${String(insertId).padStart(3, '0')}`;

    await db.query('UPDATE appointments SET appointmentId = ? WHERE id = ?', [generatedAppointmentId, insertId]);

    res.status(201).json({ id: insertId, appointmentId: generatedAppointmentId, message: 'Appointment created successfully' });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ message: 'UID required' });
    
    const [rows] = await db.query('SELECT * FROM appointments WHERE uid = ? ORDER BY created_at DESC', [uid]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appointments ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedEmployeeId, assignedEmployeeName, preferredTimeSlot } = req.body;
    
    let query = 'UPDATE appointments SET ';
    const params = [];
    const updates = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assignedEmployeeId !== undefined) {
      updates.push('assignedEmployeeId = ?');
      params.push(assignedEmployeeId);
    }
    if (assignedEmployeeName !== undefined) {
      updates.push('assignedEmployeeName = ?');
      params.push(assignedEmployeeName);
    }
    if (preferredTimeSlot) {
      updates.push('preferredTimeSlot = ?');
      params.push(preferredTimeSlot);
    }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
};
