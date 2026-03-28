const db = require('./src/config/db.js');
const bcrypt = require('bcryptjs');

const run = async () => {
  try {
    const hashedPassword = await bcrypt.hash('9876543210', 10);

    await db.query(`
      INSERT INTO staff (
        employee_id, name, username, email, password, phone,
        role, department, gender, blood_group, dob, joining_date,
        qualification, experience, shift, salary, address,
        emergency_name, emergency_phone, status, time_in, time_out
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name)
    `, [
      'EMP0001', 'Ravi Kumar', 'ravikumar',
      'ravi@carbooking.com', hashedPassword, '9876543210',
      'receptionist', 'Service', 'Male', 'O+',
      '1995-06-15', '2023-01-10',
      'B.Com', '2 years', 'Morning', 28000,
      '12, Gandhi Street, Chennai, Tamil Nadu - 600001',
      'Suresh Kumar', '9123456780',
      'active', '09:00', '18:00'
    ]);

    console.log('✅ Staff EMP0001 - Ravi Kumar added');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
