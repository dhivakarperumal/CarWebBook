const db = require('./src/config/db');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointmentId VARCHAR(100) NOT NULL UNIQUE,
        uid VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        pincode VARCHAR(20),
        
        vehicleType VARCHAR(50),
        brand VARCHAR(100),
        model VARCHAR(100),
        registrationNumber VARCHAR(50),
        fuelType VARCHAR(50),
        yearOfManufacture INT,
        currentMileage INT,
        
        serviceType VARCHAR(255),
        otherIssue TEXT,
        pickupDrop VARCHAR(10),
        
        preferredDate DATE,
        preferredTimeSlot VARCHAR(100),
        
        serviceMode VARCHAR(100),
        pickupAddress TEXT,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        
        paymentMode VARCHAR(100),
        estimatedCost DECIMAL(10, 2),
        
        couponCode VARCHAR(100),
        notes TEXT,
        emergencyService BOOLEAN DEFAULT FALSE,
        termsAccepted BOOLEAN DEFAULT FALSE,
        assignedEmployeeId INT,
        assignedEmployeeName VARCHAR(255),
        
        status VARCHAR(100) DEFAULT 'Appointment Booked',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);
    console.log("Table 'appointments' created or verified successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
