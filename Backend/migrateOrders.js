const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    // 1. Create product_orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(100) UNIQUE,
        uid VARCHAR(255),
        customerName VARCHAR(255),
        customerPhone VARCHAR(20),
        customerEmail VARCHAR(255),
        orderType VARCHAR(50) DEFAULT 'shop', -- 'shop', 'online', 'pickup'
        paymentMethod VARCHAR(50),
        paymentStatus VARCHAR(50) DEFAULT 'Pending',
        status VARCHAR(50) DEFAULT 'OrderPlaced',
        
        -- Shipping Info
        shippingName VARCHAR(255),
        shippingPhone VARCHAR(20),
        shippingAddress TEXT,
        shippingCity VARCHAR(100),
        shippingState VARCHAR(100),
        shippingZip VARCHAR(20),
        shippingCountry VARCHAR(100),
        
        -- Totals
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        shippingFee DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        
        cancelledReason TEXT,
        orderTrack JSON, -- To store history steps
        
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ product_orders table created');

    // 2. Create product_order_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_internal_id INT NOT NULL,
        productId VARCHAR(100),
        name VARCHAR(255),
        variant VARCHAR(255),
        sku VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        qty INT DEFAULT 1,
        total DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (order_internal_id) REFERENCES product_orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ product_order_items table created');

    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

migrate();
