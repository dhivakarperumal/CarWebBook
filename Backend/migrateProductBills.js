const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        billId VARCHAR(100) UNIQUE,
        customerName VARCHAR(255),
        customerPhone VARCHAR(20),
        orderType VARCHAR(50),
        paymentMethod VARCHAR(50),
        paymentStatus VARCHAR(50),
        status VARCHAR(50),
        items JSON,
        totalItems INT DEFAULT 0,
        subTotal DECIMAL(10,2) DEFAULT 0,
        grandTotal DECIMAL(10,2) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ product_bills table created');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

migrate();
