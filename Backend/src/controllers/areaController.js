const db = require('../config/db');

// Get all service areas
exports.getAllAreas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_areas ORDER BY pincode ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving service areas', error: error.message });
  }
};

// Create a new service area
exports.createArea = async (req, res) => {
  try {
    const { pincode, area_name, status } = req.body;
    
    // Check if pincode already exists
    const [existing] = await db.query('SELECT id FROM service_areas WHERE pincode = ?', [pincode]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Pincode already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO service_areas (pincode, area_name, status) VALUES (?, ?, ?)',
      [pincode, area_name, status || 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'Service area created' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating service area', error: error.message });
  }
};

// Update a service area
exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { pincode, area_name, status } = req.body;
    
    await db.query(
      'UPDATE service_areas SET pincode = ?, area_name = ?, status = ? WHERE id = ?',
      [pincode, area_name, status, id]
    );
    res.json({ message: 'Service area updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating service area', error: error.message });
  }
};

// Delete a service area
exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM service_areas WHERE id = ?', [id]);
    res.json({ message: 'Service area deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service area', error: error.message });
  }
};

// Check pincode availability
exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    const [rows] = await db.query('SELECT * FROM service_areas WHERE pincode = ? AND status = "active"', [pincode]);
    
    if (rows.length > 0) {
      res.json({ available: true, area: rows[0] });
    } else {
      res.json({ available: false, message: 'Service not available in your area' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking pincode', error: error.message });
  }
};
