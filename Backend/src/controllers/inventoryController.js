const db = require('../config/db.js');

exports.addItem = async (req, res) => {
  const { partName, category, vendor, stockQty, minStock } = req.body;
  const sql = `
    INSERT INTO inventory 
    (partName, category, vendor, stockQty, minStock)
    VALUES (?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await db.query(sql, [partName, category, vendor, stockQty, minStock]);
    res.status(201).json({ message: "Item added successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Failed to add item", error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  const id = req.params.id;
  const { partName, category, vendor, stockQty, minStock } = req.body;
  const sql = `
    UPDATE inventory SET 
    partName=?, category=?, vendor=?, stockQty=?, minStock=?
    WHERE id=?
  `;
  try {
    await db.query(sql, [partName, category, vendor, stockQty, minStock, id]);
    res.json({ message: "Item updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update item", error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  const id = req.params.id;
  try {
    const [data] = await db.query("SELECT * FROM inventory WHERE id=?", [id]);
    if (data.length > 0) res.json(data[0]);
    else res.status(404).json({ message: "Item not found" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch item", error: err.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM inventory");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch items", error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM inventory WHERE id=?", [id]);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item", error: err.message });
  }
};
