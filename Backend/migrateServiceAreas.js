const db = require('./src/config/db');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS service_areas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pincode VARCHAR(20) NOT NULL UNIQUE,
        area_name VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);
    console.log("Table 'service_areas' created or verified successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
