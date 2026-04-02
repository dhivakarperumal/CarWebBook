const db = require('./src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        photoURL LONGTEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);

    // Add column if not exists
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photoURL LONGTEXT AFTER role`);
      console.log('✅ Added photoURL column to users');
    } catch (err) {
      console.log('photoURL column may already exist');
    }
    console.log("Table 'users' created or verified.");

    // Add test user
    const email = 'test@example.com';
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length === 0) {
      const uid = crypto.randomUUID();
      const pass = await bcrypt.hash('password123', 10);
      await db.query(
        'INSERT INTO users (uid, username, email, mobile, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [uid, 'Test User', email, '1234567890', pass, 'admin']
      );
      console.log("Added test user 'test@example.com' with password 'password123' as admin");
    } else {
      console.log("Test user already exists.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
