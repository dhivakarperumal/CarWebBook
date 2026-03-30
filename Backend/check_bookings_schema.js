require('dotenv').config();
const db = require('./src/config/db');

async function checkSchema() {
  const [columns] = await db.query('DESCRIBE bookings');
  console.log('Bookings Schema:');
  columns.forEach(col => console.log(`${col.Field}: ${col.Type}`));
  process.exit(0);
}

checkSchema();
