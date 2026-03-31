const db = require('../config/db.js');

const ensureAddressTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userUid VARCHAR(100) NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(255),
      street VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      pinCode VARCHAR(16) NOT NULL,
      state VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'India',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_uid (userUid)
    )
  `);
};

exports.getAddressesByUser = async (req, res) => {
  const { userUid } = req.params;

  try {
    await ensureAddressTable();
    const [rows] = await db.query('SELECT * FROM addresses WHERE userUid = ? ORDER BY createdAt DESC', [userUid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching addresses', error: err.message });
  }
};

exports.addAddress = async (req, res) => {
  const { userUid, fullName, phone, email, street, city, pinCode, state, country } = req.body;

  if (!userUid || !fullName || !phone || !street || !city || !pinCode || !state) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await ensureAddressTable();

    // Avoid duplicates for same user by key fields (phone+street+pinCode)
    const [existing] = await db.query(
      'SELECT * FROM addresses WHERE userUid=? AND phone=? AND street=? AND pinCode=? LIMIT 1',
      [userUid, phone, street, pinCode]
    );

    if (existing.length > 0) {
      const address = existing[0];
      await db.query(
        'UPDATE addresses SET fullName=?, email=?, city=?, state=?, country=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
        [fullName, email || '', city, state, country || 'India', address.id]
      );
      return res.json({ message: 'Address updated', id: address.id });
    }

    const [result] = await db.query(
      'INSERT INTO addresses (userUid, fullName, phone, email, street, city, pinCode, state, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userUid, fullName, phone, email || '', street, city, pinCode, state, country || 'India']
    );
    res.status(201).json({ message: 'Address added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error adding address', error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, email, street, city, pinCode, state, country } = req.body;

  if (!fullName || !phone || !street || !city || !pinCode || !state) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await ensureAddressTable();
    await db.query(
      'UPDATE addresses SET fullName=?, phone=?, email=?, street=?, city=?, pinCode=?, state=?, country=? WHERE id=?',
      [fullName, phone, email || '', street, city, pinCode, state, country || 'India', id]
    );
    res.json({ message: 'Address updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating address', error: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureAddressTable();
    await db.query('DELETE FROM addresses WHERE id=?', [id]);
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting address', error: err.message });
  }
};