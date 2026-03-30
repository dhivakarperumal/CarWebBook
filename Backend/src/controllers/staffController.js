const db = require('../config/db.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/* 📋 GET ALL */
exports.getAllStaff = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching staff', error: err.message });
  }
};

/* 🔍 GET ONE */
exports.getStaffById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Staff not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching staff', error: err.message });
  }
};

/* 🔑 GENERATE EMPLOYEE ID */
exports.generateEmployeeId = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM staff');
    const count = rows[0].count + 1;
    const employeeId = `EMP${String(count).padStart(4, '0')}`;
    res.json({ employeeId });
  } catch (err) {
    res.status(500).json({ message: 'Error generating ID', error: err.message });
  }
};

/* ➕ ADD STAFF */
exports.addStaff = async (req, res) => {
  try {
    const {
      employee_id, name, username, email, password, phone,
      role, department, gender, blood_group, dob, joining_date,
      qualification, experience, shift, salary, address,
      emergency_name, emergency_phone, status, time_in, time_out,
      photo, aadhar_doc, id_doc, certificate_doc
    } = req.body;

    // Hash password
    // 🔹 Fallback: Auto-set password to phone number if missing
    const finalPassword = password || phone;
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    
    // Generate unique user ID
    const uid = crypto.randomUUID();

    // 1. Insert into users table for login
    await db.query(
      'INSERT INTO users (uid, username, email, mobile, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [uid, name, email, phone, hashedPassword, role || 'staff']
    );

    // 2. Insert into staff table
    const sql = `
      INSERT INTO staff (
        uid, employee_id, name, username, email, password, phone,
        role, department, gender, blood_group, dob, joining_date,
        qualification, experience, shift, salary, address,
        emergency_name, emergency_phone, status, time_in, time_out,
        photo, aadhar_doc, id_doc, certificate_doc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      uid, employee_id, name, username, email, hashedPassword, phone,
      role, department || '', gender, blood_group,
      dob || null, joining_date || null,
      qualification || '', experience || '', shift || '', salary || null, address || '',
      emergency_name || '', emergency_phone || '', status || 'active', time_in || null, time_out || null,
      photo || null, aadhar_doc || null, id_doc || null, certificate_doc || null
    ]);

    res.status(201).json({ message: 'Staff added successfully', id: result.insertId, uid: uid });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or Employee ID already exists' });
    }
    res.status(500).json({ message: 'Error adding staff', error: err.message });
  }
};

/* ✏️ UPDATE STAFF */
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, username, email, phone,
      role, department, gender, blood_group, dob, joining_date,
      qualification, experience, shift, salary, address,
      emergency_name, emergency_phone, status, time_in, time_out,
      photo, aadhar_doc, id_doc, certificate_doc
    } = req.body;

    // Get current staff email to update the user account too
    const [existing] = await db.query('SELECT email, uid FROM staff WHERE id=?', [id]);
    if (existing.length) {
      const oldEmail = existing[0].email;
      const uid = existing[0].uid;
      // Update users table too
      await db.query(
        'UPDATE users SET username=?, email=?, mobile=?, role=? WHERE email=? OR uid=?',
        [name, email, phone, role || 'staff', oldEmail, uid]
      );
    }

    const sql = `
      UPDATE staff SET
        name=?, username=?, email=?, phone=?,
        role=?, department=?, gender=?, blood_group=?, dob=?, joining_date=?,
        qualification=?, experience=?, shift=?, salary=?, address=?,
        emergency_name=?, emergency_phone=?, status=?, time_in=?, time_out=?,
        photo=?, aadhar_doc=?, id_doc=?, certificate_doc=?
      WHERE id=?
    `;

    await db.query(sql, [
      name, username, email, phone,
      role, department, gender, blood_group,
      dob || null, joining_date || null,
      qualification, experience, shift, salary || null, address,
      emergency_name, emergency_phone, status, time_in, time_out,
      photo || null, aadhar_doc || null, id_doc || null, certificate_doc || null,
      id
    ]);

    res.json({ message: 'Staff updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating staff', error: err.message });
  }
};

/* ❌ DELETE STAFF */
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get staff email or uid first
    const [rows] = await db.query('SELECT email, uid FROM staff WHERE id=?', [id]);
    if (rows.length) {
      const { email, uid } = rows[0];
      // Delete from users too
      await db.query('DELETE FROM users WHERE email=? OR uid=?', [email, uid]);
    }

    await db.query('DELETE FROM staff WHERE id=?', [id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting staff', error: err.message });
  }
};
