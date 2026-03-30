require('dotenv').config();
const db = require('./src/config/db');

async function checkSchema() {
  const [columns] = await db.query('DESCRIBE billings');
  console.log('Billings Schema:');
  columns.forEach(col => console.log(`${col.Field}: ${col.Type}`));
  process.exit(0);
}

checkSchema();
