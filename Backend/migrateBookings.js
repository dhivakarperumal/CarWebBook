const db = require('./src/config/db');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId VARCHAR(100) NOT NULL UNIQUE,
        uid VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        altPhone VARCHAR(20),
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        issue VARCHAR(255) NOT NULL,
        issueAmount DECIMAL(10,2) DEFAULT 0,
        issueStatus VARCHAR(50) DEFAULT 'pending',
        otherIssue TEXT,
        address TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(100) DEFAULT 'Booked',
        vehicleType VARCHAR(50),
        vehicleNumber VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);
    console.log("Table 'bookings' created or verified successfully.");

    // Add missing columns if they don't exist
    try {
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicleType VARCHAR(50)`);
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicleNumber VARCHAR(50)`);
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignedEmployeeId INT`);
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignedEmployeeName VARCHAR(255)`);
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS issueAmount DECIMAL(10,2) DEFAULT 0`);
      await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS issueStatus VARCHAR(50) DEFAULT 'pending'`);
      console.log("Added missing columns to bookings table.");
    } catch (alterError) {
      console.log("Columns may already exist or ALTER failed:", alterError.message);
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
