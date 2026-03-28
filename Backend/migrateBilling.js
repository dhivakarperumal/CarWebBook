const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    // 1. Create billings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS billings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoiceNo VARCHAR(100) UNIQUE,
        serviceId INT,
        bookingId VARCHAR(100),
        uid VARCHAR(255),
        customerName VARCHAR(255),
        mobileNumber VARCHAR(20),
        car VARCHAR(255),
        partsTotal DECIMAL(10,2) DEFAULT 0,
        labour DECIMAL(10,2) DEFAULT 0,
        gstPercent INT DEFAULT 18,
        gstAmount DECIMAL(10,2) DEFAULT 0,
        subTotal DECIMAL(10,2) DEFAULT 0,
        grandTotal DECIMAL(10,2) DEFAULT 0,
        paymentStatus VARCHAR(50) DEFAULT 'Pending',
        paymentMode VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Generated',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ billings table created');

    // 2. Create billing_items table (for parts/items in the invoice)
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        billing_id INT NOT NULL,
        partName VARCHAR(255),
        qty INT DEFAULT 1,
        price DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ billing_items table created');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

migrate();
