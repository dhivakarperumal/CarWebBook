require('dotenv').config();
const db = require('./src/config/db');

async function checkCounts() {
  const tables = [
    'bookings',
    'all_services',
    'staff',
    'product_orders',
    'billings',
    'products',
    'inventory',
    'users'
  ];

  console.log('Table Counts:');
  for (const table of tables) {
    try {
      const [rows] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${rows[0].count}`);
    } catch (err) {
      console.log(`${table}: ERROR - ${err.message}`);
    }
  }
  process.exit(0);
}

checkCounts();
