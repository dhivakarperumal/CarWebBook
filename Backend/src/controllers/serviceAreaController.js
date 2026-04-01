const db = require('../config/db');

// Get all service areas
const getServiceAreas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_areas ORDER BY pincode ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service areas", error: error.message });
  }
};

// Add new service area
const addServiceArea = async (req, res) => {
  const { pincode, area_name } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO service_areas (pincode, area_name) VALUES (?, ?)',
      [pincode, area_name]
    );
    res.status(201).json({ message: "Service area added", id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Pincode already exists" });
    }
    res.status(500).json({ message: "Error adding service area", error: error.message });
  }
};

// Update service area
const updateServiceArea = async (req, res) => {
  const { id } = req.params;
  const { pincode, area_name, status } = req.body;
  try {
    await db.query(
      'UPDATE service_areas SET pincode = ?, area_name = ?, status = ? WHERE id = ?',
      [pincode, area_name, status, id]
    );
    res.json({ message: "Service area updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating service area", error: error.message });
  }
};

// Toggle status
const toggleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE service_areas SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: "Service area status updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};

// Delete service area
const deleteServiceArea = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM service_areas WHERE id = ?', [id]);
    res.json({ message: "Service area deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service area", error: error.message });
  }
};

module.exports = {
  getServiceAreas,
  addServiceArea,
  updateServiceArea,
  toggleStatus,
  deleteServiceArea
};
