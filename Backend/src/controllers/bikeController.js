const db = require('../config/db');

const addBike = async (req, res) => {
  try {
    const data = req.body;
    const [result] = await db.query(
      'INSERT INTO bikes SET ?',
      [data]
    );
    res.status(201).json({ message: "Bike added successfully", id: result.insertId });
  } catch (err) {
    console.error("Error adding bike:", err);
    res.status(500).json({ message: "Error adding bike", error: err.message });
  }
};

const getAllBikes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bikes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bikes", error: err.message });
  }
};

const getBikeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM bikes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Bike not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bike", error: err.message });
  }
};

const updateBike = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await db.query('UPDATE bikes SET ? WHERE id = ?', [data, id]);
    res.json({ message: "Bike updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating bike", error: err.message });
  }
};

const deleteBike = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM bikes WHERE id = ?', [id]);
    res.json({ message: "Bike deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting bike", error: err.message });
  }
};

module.exports = {
  addBike,
  getAllBikes,
  getBikeById,
  updateBike,
  deleteBike
};
