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

/* 🕒 PUNCH IN */
exports.punchIn = async (req, res) => {
  const { staff_id, date, status } = req.body;
  try {
    const login_time = new Date();
    const sql = 'INSERT INTO attendance (staff_id, date, login_time, status) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [staff_id, date, login_time, status || 'Present']);
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
