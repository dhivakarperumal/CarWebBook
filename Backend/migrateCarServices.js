const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS car_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        carServiceId VARCHAR(50) UNIQUE,
        carNumber VARCHAR(50),
        customerName VARCHAR(255),
        mobileNumber VARCHAR(20),
        serviceType VARCHAR(100),
        mechanic VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        startTime VARCHAR(50),
        endTime VARCHAR(50),
        spareParts TEXT,
        estimatedCost DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ car_services table created');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

migrate();
