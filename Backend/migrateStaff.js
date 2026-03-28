const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) NOT NULL UNIQUE,
        employee_id VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(100),
        department VARCHAR(100),
        gender VARCHAR(20),
        blood_group VARCHAR(10),
        dob DATE,
        joining_date DATE,
        qualification VARCHAR(255),
        experience VARCHAR(100),
        shift VARCHAR(100),
        salary DECIMAL(10,2),
        address TEXT,
        emergency_name VARCHAR(255),
        emergency_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        time_in VARCHAR(10),
        time_out VARCHAR(10),
        photo LONGTEXT,
        aadhar_doc LONGTEXT,
        id_doc LONGTEXT,
        certificate_doc LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Staff table created');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

migrate();
