const db = require('../config/db');

const addBooking = async (req, res) => {
  try {
    const data = req.body;
    data.bookingId = 'VB' + Date.now();
    const [result] = await db.query('INSERT INTO vehicle_bookings SET ?', [data]);
    res.status(201).json({ message: "Vehicle booked successfully", bookingId: data.bookingId });
  } catch (err) {
    console.error("Error adding vehicle booking:", err);
    res.status(500).json({ message: "Error booking vehicle", error: err.message });
  }
};

const getBookingsByUser = async (req, res) => {
  const { uid } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM vehicle_bookings WHERE uid = ? ORDER BY createdAt DESC', [uid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicle_bookings ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
};

module.exports = {
  addBooking,
  getBookingsByUser,
  getAllBookings
};
