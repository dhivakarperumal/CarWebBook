const db = require('../config/db.js');

exports.getAllCarServices = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM car_services ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getCarServiceById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM car_services WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.addCarService = async (req, res) => {
  try {
    const { carNumber, customerName, mobileNumber, serviceType, mechanic, status, startTime, endTime, spareParts, estimatedCost, notes } = req.body;

    // Generate ID
    const [countRows] = await db.query('SELECT COUNT(*) as count FROM car_services');
    const nextNum = countRows[0].count + 1;
    const carServiceId = `SEV${String(nextNum).padStart(3, '0')}`;

    const [result] = await db.query(
      `INSERT INTO car_services (carServiceId, carNumber, customerName, mobileNumber, serviceType, mechanic, status, startTime, endTime, spareParts, estimatedCost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [carServiceId, carNumber, customerName, mobileNumber, serviceType, mechanic, status || 'Pending', startTime, endTime, spareParts, Number(estimatedCost || 0), notes]
    );

    res.status(201).json({ message: 'Car service added', id: result.insertId, carServiceId });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.updateCarService = async (req, res) => {
  try {
    const { carNumber, customerName, mobileNumber, serviceType, mechanic, status, startTime, endTime, spareParts, estimatedCost, notes } = req.body;
    await db.query(
      `UPDATE car_services SET carNumber=?, customerName=?, mobileNumber=?, serviceType=?, mechanic=?, status=?, startTime=?, endTime=?, spareParts=?, estimatedCost=?, notes=? WHERE id=?`,
      [carNumber, customerName, mobileNumber, serviceType, mechanic, status, startTime, endTime, spareParts, Number(estimatedCost || 0), notes, req.params.id]
    );
    res.json({ message: 'Car service updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.deleteCarService = async (req, res) => {
  try {
    await db.query('DELETE FROM car_services WHERE id=?', [req.params.id]);
    res.json({ message: 'Car service deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
