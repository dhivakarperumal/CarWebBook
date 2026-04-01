const db = require('../config/db.js');

/* 📋 GET ALL ATTENDANCE FOR A DATE */
exports.getAttendanceByDate = async (req, res) => {
  const { date } = req.query;
  try {
    const sql = `
      SELECT a.*, s.name, s.role, s.department
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.date = ?
      ORDER BY a.login_time DESC
    `;
    const [rows] = await db.query(sql, [date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance', error: err.message });
  }
};

/* 🕒 CHECK TODAY'S ATTENDANCE */
exports.checkTodayAttendance = async (req, res) => {
  const { staff_id, date } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT id, login_time, logout_time FROM attendance WHERE staff_id = ? AND date = ?',
      [staff_id, date]
    );
    res.json({ isPresent: rows.length > 0, record: rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Error checking attendance', error: err.message });
  }
};

/* 🕒 PUNCH IN */
exports.punchIn = async (req, res) => {
  const { staff_id, date, status, latitude, longitude } = req.body;
  try {
    const login_time = new Date();
    // Check if already punched in
    const [existing] = await db.query('SELECT id FROM attendance WHERE staff_id = ? AND date = ?', [staff_id, date]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already punched in for today' });
    }

    const sql = 'INSERT INTO attendance (staff_id, date, login_time, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [staff_id, date, login_time, status || 'Present', latitude, longitude]);
    res.status(201).json({ message: 'Punched in successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error punching in', error: err.message });
  }
};

/* 🕒 PUNCH OUT */
exports.punchOut = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT login_time FROM attendance WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Attendance record not found' });

    const logout_time = new Date();
    const login_time = new Date(rows[0].login_time);
    
    // Calculate duration
    const diffMs = logout_time - login_time;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${hours}h ${minutes}m`;

    const sql = 'UPDATE attendance SET logout_time = ?, duration = ? WHERE id = ?';
    await db.query(sql, [logout_time, duration, id]);
    
    res.json({ message: 'Punched out successfully', duration });
  } catch (err) {
    res.status(500).json({ message: 'Error punching out', error: err.message });
  }
};
