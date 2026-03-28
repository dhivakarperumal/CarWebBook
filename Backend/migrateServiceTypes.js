const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ service_types table created');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

migrate();
