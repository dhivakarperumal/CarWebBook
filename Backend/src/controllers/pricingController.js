const db = require("../config/db");

/* GET ALL PACKAGES */
const getAllPackages = async (req, res) => {
  try {
    const sql = "SELECT * FROM pricing_packages";
    const [result] = await db.query(sql);
    
    // Parse features JSON
    const packages = result.map(pkg => ({
      ...pkg,
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features
    }));
    
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* GET SINGLE PACKAGE */
const getSinglePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM pricing_packages WHERE id=?";
    const [result] = await db.query(sql, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    const pkg = result[0];
    pkg.features = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features;
    
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* CREATE PACKAGE */
const addPackage = async (req, res) => {
  try {
    const { title, price, features, place, time } = req.body;

    if (!title || !price || !features) {
      return res.status(400).json({ message: "Title, price, and features are required" });
    }

    const sql = "INSERT INTO pricing_packages (title, price, features, place, time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    await db.query(sql, [title, price, JSON.stringify(features), place || 'home', time || '']);
    
    res.status(201).json({ message: "Package created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE PACKAGE */
const editPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, features, place, time } = req.body;

    if (!title || !price || !features) {
      return res.status(400).json({ message: "Title, price, and features are required" });
    }

    const sql = "UPDATE pricing_packages SET title=?, price=?, features=?, place=?, time=?, updated_at=CURRENT_TIMESTAMP WHERE id=?";
    const [result] = await db.query(sql, [title, price, JSON.stringify(features), place || 'home', time || '', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ message: "Package updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* DELETE PACKAGE */
const removePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM pricing_packages WHERE id=?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ message: "Package deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPackages,
  getSinglePackage,
  addPackage,
  editPackage,
  removePackage,
};