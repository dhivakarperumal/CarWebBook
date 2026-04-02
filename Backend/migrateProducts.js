const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    const productsSql = `
      CREATE TABLE IF NOT EXISTS products (
        docId INT AUTO_INCREMENT PRIMARY KEY,
        id VARCHAR(100) UNIQUE,
        name VARCHAR(255),
        slug VARCHAR(255),
        brand VARCHAR(255),
        description TEXT,
        mrp DECIMAL(10,2),
        offer DECIMAL(10,2),
        offerPrice DECIMAL(10,2),
        tags JSON,
        warranty JSON,
        returnPolicy JSON,
        isFeatured BOOLEAN DEFAULT false,
        isActive BOOLEAN DEFAULT true,
        rating VARCHAR(50),
        variants JSON,
        images LONGTEXT,
        thumbnail LONGTEXT,
        totalStock INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(productsSql);
    console.log('Products table created successfully');

    // For bills
    const billsSql = `
      CREATE TABLE IF NOT EXISTS product_bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        billId VARCHAR(100) UNIQUE,
        customerName VARCHAR(255),
        customerPhone VARCHAR(20),
        orderType VARCHAR(100) DEFAULT 'shop',
        paymentMethod VARCHAR(100),
        paymentStatus VARCHAR(100) DEFAULT 'Pending',
        status VARCHAR(100) DEFAULT 'Pending',
        items JSON,
        totalItems INT,
        subTotal DECIMAL(10,2),
        discount DECIMAL(10,2) DEFAULT 0,
        grandTotal DECIMAL(10,2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(billsSql);
    
    // Add columns if they don't exist
    try {
      await db.query(`ALTER TABLE product_bills ADD COLUMN IF NOT EXISTS orderType VARCHAR(100) DEFAULT 'shop'`);
      await db.query(`ALTER TABLE product_bills ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(100)`);
      await db.query(`ALTER TABLE product_bills ADD COLUMN IF NOT EXISTS paymentStatus VARCHAR(100) DEFAULT 'Pending'`);
      await db.query(`ALTER TABLE product_bills ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending'`);
      console.log('✅ Added missing columns to product_bills');
    } catch (err) {
      console.log('product_bills columns may already exist');
    }
    console.log('Bills table created successfully');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
