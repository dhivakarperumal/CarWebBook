const db = require('../config/db');

const addBooking = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body;
    data.bookingId = 'VB' + Date.now();
    
    // Insert into vehicle_bookings
    await connection.query('INSERT INTO vehicle_bookings SET ?', [data]);

    // Update bikes table status to booked
    if (data.vehicleId) {
      await connection.query('UPDATE bikes SET status = "booked" WHERE id = ?', [data.vehicleId]);
    }

    await connection.commit();
    res.status(201).json({ message: "Vehicle booked successfully", bookingId: data.bookingId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error adding vehicle booking:", err);
    res.status(500).json({ message: "Error booking vehicle", error: err.message });
  } finally {
    if (connection) connection.release();
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

const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get vehicleId from the booking
    const [booking] = await connection.query('SELECT vehicleId FROM vehicle_bookings WHERE id = ?', [id]);
    if (booking.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const vehicleId = booking[0].vehicleId;

    // Update booking status
    await connection.query('UPDATE vehicle_bookings SET status = "Cancelled" WHERE id = ?', [id]);

    // Update bike status back to published
    if (vehicleId) {
      await connection.query('UPDATE bikes SET status = "published" WHERE id = ?', [vehicleId]);
    }

    await connection.commit();
    res.json({ message: "Booking cancelled and vehicle republished successfully" });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error cancelling vehicle booking:", err);
    res.status(500).json({ message: "Error cancelling booking", error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  addBooking,
  getBookingsByUser,
  getAllBookings,
  cancelBooking
};
