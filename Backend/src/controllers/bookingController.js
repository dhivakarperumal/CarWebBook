const db = require('../config/db');

exports.getAllBookings = async (req, res) => {
  try {
    const { uid } = req.query;
    let query = 'SELECT * FROM bookings';
    const params = [];

    if (uid) {
      query += ' WHERE uid = ?';
      params.push(uid);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { 
      uid, name, email, phone, altPhone, 
      brand, model, issue, otherIssue, address, 
      location, latitude, longitude, status, vehicleType = 'car', vehicleNumber 
    } = req.body;

    // 1. Insert the record first (without bookingId or with a temp one if needed, but we'll update it)
    const [result] = await db.query(
      `INSERT INTO bookings 
      (bookingId, uid, name, email, phone, altPhone, brand, model, issue, otherIssue, address, location, latitude, longitude, status, vehicleType, vehicleNumber) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['TEMP', uid, name, email, phone, altPhone, brand, model, issue, otherIssue, address, location, latitude, longitude, status || 'Booked', vehicleType, vehicleNumber]
    );

    const insertId = result.insertId;
    const generatedBookingId = `BS${String(insertId).padStart(3, '0')}`;

    // 2. Update with the real sequential ID
    await db.query('UPDATE bookings SET bookingId = ? WHERE id = ?', [generatedBookingId, insertId]);
    
    // Auto cascade admin walk-ins dynamically to all_services for the Services layout
    if (uid === 'admin-created') {
      await db.query(`
        INSERT INTO all_services (
          bookingId, bookingDocId, uid, name, phone, email, brand, model, issue, otherIssue, location, address, trackNumber, vehicleNumber, addVehicle, serviceStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [generatedBookingId, insertId, uid, name, phone, email, brand, model, issue, otherIssue, location, address, '', vehicleNumber || '', 1, 'Booked']);
    }

    res.status(201).json({ id: insertId, bookingId: generatedBookingId, message: 'Booking created' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, serviceCreated, trackNumber, cancelReason } = req.body;
    
    let query = 'UPDATE bookings SET status = ?';
    const params = [status];

    // Check if we need to add a serviceCreated property in bookings. Since it doesn't exist yet, we won't add it to the MySQL bookings table unless we alter it.
    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    
    if (status === 'Approved') {
       const [booking] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
       if (booking.length > 0) {
         const b = booking[0];
         const [existing] = await db.query('SELECT * FROM all_services WHERE bookingDocId = ?', [id]);
          if (existing.length === 0) {
           await db.query(`
             INSERT INTO all_services (
               bookingId, bookingDocId, uid, name, phone, email, brand, model, issue, otherIssue, location, address, trackNumber, vehicleNumber, addVehicle
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           `, [b.bookingId, b.id, b.uid, b.name, b.phone, b.email, b.brand, b.model, b.issue, b.otherIssue, b.location, b.address, trackNumber || '', b.vehicleNumber || '', b.vehicleType ? 1 : 0]);
         }
       }
    }
    
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
};

exports.assignEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedEmployeeId, assignedEmployeeName } = req.body;
    
    await db.query('UPDATE bookings SET assignedEmployeeId = ?, assignedEmployeeName = ?, status = ? WHERE id = ?', [assignedEmployeeId, assignedEmployeeName, 'Approved', id]);
    
    const [booking] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (booking.length > 0) {
      const b = booking[0];
      const [existing] = await db.query('SELECT * FROM all_services WHERE bookingDocId = ?', [id]);
      if (existing.length === 0) {
        await db.query(`
          INSERT INTO all_services (
            bookingId, bookingDocId, uid, name, phone, email, brand, model, issue, otherIssue, location, address, trackNumber, vehicleNumber, addVehicle, assignedEmployeeId, assignedEmployeeName, serviceStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [b.bookingId, b.id, b.uid, b.name, b.phone, b.email, b.brand, b.model, b.issue, b.otherIssue, b.location, b.address, '', b.vehicleNumber || '', b.vehicleType ? 1 : 0, assignedEmployeeId, assignedEmployeeName, 'Approved']);
      } else {
        await db.query('UPDATE all_services SET assignedEmployeeId = ?, assignedEmployeeName = ?, serviceStatus = ? WHERE bookingDocId = ?', [assignedEmployeeId, assignedEmployeeName, 'Approved', id]);
      }
    }
    
    res.json({ message: 'Mechanic assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning mechanic', error: error.message });
  }
};