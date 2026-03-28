const db = require('../config/db.js');

exports.getServiceTypes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_types ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.addServiceType = async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db.query('INSERT INTO service_types (name) VALUES (?)', [name]);
    res.json({ id: result.insertId, message: 'Added' });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteServiceType = async (req, res) => {
  try {
    await db.query('DELETE FROM service_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
};
