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
      bookingId, uid, name, email, phone, altPhone, 
      brand, model, issue, otherIssue, address, 
      location, latitude, longitude, status 
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO bookings 
      (bookingId, uid, name, email, phone, altPhone, brand, model, issue, otherIssue, address, location, latitude, longitude, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, uid, name, email, phone, altPhone, brand, model, issue, otherIssue, address, location, latitude, longitude, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Booking created' });
  } catch (error) {
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
               bookingId, bookingDocId, uid, name, phone, email, brand, model, issue, otherIssue, location, address, trackNumber
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           `, [b.bookingId, b.id, b.uid, b.name, b.phone, b.email, b.brand, b.model, b.issue, b.otherIssue, b.location, b.address, trackNumber || '']);
         }
       }
    }
    
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
};