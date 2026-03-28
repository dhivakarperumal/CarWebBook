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
