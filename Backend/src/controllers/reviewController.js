const db = require('../config/db');

const getReviews = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
};

const addReview = async (req, res) => {
  const { name, rating, message, image } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO reviews (name, rating, message, image, status) VALUES (?, ?, ?, ?, ?)',
      [name, rating, message, image, false]
    );
    res.status(201).json({ message: "Review added successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
};

const updateReview = async (req, res) => {
  const { id } = req.params;
  const { name, rating, message, image } = req.body;
  try {
    await db.query(
      'UPDATE reviews SET name = ?, rating = ?, message = ?, image = ? WHERE id = ?',
      [name, rating, message, image, id]
    );
    res.json({ message: "Review updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating review", error: err.message });
  }
};

const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting review", error: err.message });
  }
};

const toggleReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: "Review status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
};

module.exports = {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  toggleReviewStatus
};
