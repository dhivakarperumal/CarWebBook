const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    // 1. Create all_services table
    await db.query(`
      CREATE TABLE IF NOT EXISTS all_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId VARCHAR(100),
        bookingDocId INT,
        uid VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        brand VARCHAR(100),
        model VARCHAR(100),
        issue VARCHAR(255),
        otherIssue TEXT,
        location VARCHAR(255),
        address TEXT,
        trackNumber VARCHAR(100),
        vehicleNumber VARCHAR(50),
        addVehicle TINYINT(1) DEFAULT 0,
        serviceStatus VARCHAR(100) DEFAULT 'Booked',
        estimatedCost DECIMAL(10,2) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ all_services table created');

    // Add missing columns if they don't exist
    try {
      await db.query(`ALTER TABLE all_services ADD COLUMN IF NOT EXISTS vehicleNumber VARCHAR(50)`);
      await db.query(`ALTER TABLE all_services ADD COLUMN IF NOT EXISTS addVehicle TINYINT(1) DEFAULT 0`);
      await db.query(`ALTER TABLE all_services ADD COLUMN IF NOT EXISTS assignedEmployeeId INT`);
      await db.query(`ALTER TABLE all_services ADD COLUMN IF NOT EXISTS assignedEmployeeName VARCHAR(255)`);
      console.log("Added missing columns to all_services table.");
    } catch (alterError) {
      console.log("Columns may already exist or ALTER failed:", alterError.message);
    }

    // 2. Create service_parts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_parts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        all_service_id INT NOT NULL,
        partName VARCHAR(255),
        qty INT DEFAULT 1,
        price DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        approvedBy VARCHAR(255),
        approvalNotes TEXT,
        approvalDate TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (all_service_id) REFERENCES all_services(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ service_parts table created');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

migrate();
