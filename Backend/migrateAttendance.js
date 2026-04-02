const db = require('./src/config/db.js');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        date DATE NOT NULL,
        login_time TIMESTAMP NULL,
        logout_time TIMESTAMP NULL,
        status VARCHAR(50) DEFAULT 'Present',
        duration VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
      )
    `);

    // Add columns if they don't exist
    try {
      await db.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)`);
      await db.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)`);
      console.log('✅ Added GPS columns to attendance');
    } catch (err) {
      console.log('GPS columns might already exist');
    }
    console.log('✅ Attendance table created');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

migrate();
