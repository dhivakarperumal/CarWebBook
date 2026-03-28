const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerUser = async (req, res) => {
  const { username, email, mobile, password, role } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique user ID
    const uid = crypto.randomUUID();

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (uid, username, email, mobile, password, role, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uid, username, email, mobile, hashedPassword, role || 'user', true]
    );

    res.status(201).json({ message: "User registered successfully", uid: uid, id: result.insertId });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  try {
    // Check if user exists by email or username
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ message: "Account is disabled. Please contact admin." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { uid: user.uid, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '1d' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        mobile: user.mobile
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, uid, username, email, mobile, role, active, created_at FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating role", error: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    await db.query('UPDATE users SET active = ? WHERE id = ?', [active, id]);
    res.json({ message: "User status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
