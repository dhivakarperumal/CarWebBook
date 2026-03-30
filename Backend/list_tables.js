const db = require('./src/config/db');

async function listTables() {
  try {
    const [rows] = await db.query('SHOW TABLES');
    console.log('Tables in database:');
    rows.forEach(row => {
      console.log(Object.values(row)[0]);
    });
  } catch (err) {
    console.error('Error listing tables:', err.message);
  }
  process.exit(0);
}

listTables();
