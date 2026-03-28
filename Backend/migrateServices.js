const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        bigDescription TEXT,
        icon VARCHAR(255),
        image LONGTEXT,
        supportedBrands JSON,
        sparePartsIncluded JSON,
        status VARCHAR(50) DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ services table created');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

migrate();
