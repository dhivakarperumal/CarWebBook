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
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        photoURL: user.photoURL || "",
        hasPassword: !!(user.password && user.password.length > 0)
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

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

const getProfile = async (req, res) => {
  const { uid } = req.params;
  try {
    const [users] = await db.query('SELECT uid, username, email, mobile, role, active, created_at FROM users WHERE uid = ?', [uid]);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { uid } = req.params;
  const { username, mobile } = req.body;
  try {
    await db.query('UPDATE users SET username = ?, mobile = ? WHERE uid = ?', [username, mobile, uid]);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name, picture, sub: uid } = ticket.getPayload();

    // Check if user exists
    let [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      // Create new user if not exists
      const username = name || email.split('@')[0];
      const [result] = await db.query(
        'INSERT INTO users (uid, username, email, mobile, password, role, active, photoURL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uid, username, email, '', '', 'user', true, picture]
      );
      
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];

      // Update photo if changed OR if it was empty
      if (!user.photoURL || user.photoURL !== picture) {
        await db.query('UPDATE users SET photoURL = ? WHERE id = ?', [picture, user.id]);
        user.photoURL = picture;
      }
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ message: "Account is disabled. Please contact admin." });
    }

    // Create token
    const token = jwt.sign(
      { uid: user.uid, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '1d' }
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        photoURL: user.photoURL,
        hasPassword: !!(user.password && user.password.length > 0)
      }
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(400).json({ message: "Invalid Google token", error: err.message });
  }
};

const updatePassword = async (req, res) => {
  const { uid } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    // Get current user
    const [users] = await db.query('SELECT * FROM users WHERE uid = ?', [uid]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const isGoogleUser = !user.password || user.password === '';

    if (!isGoogleUser) {
      // Verify current password for non-Google users
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE uid = ?', [hashedNewPassword, uid]);

    // After password is set, update hasPassword in localStorage
    res.json({ 
      message: isGoogleUser ? "Password set successfully" : "Password updated successfully",
      hasPassword: true
    });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getProfile,
  updateProfile,
  updatePassword
};
