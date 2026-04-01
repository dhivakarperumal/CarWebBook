const db = require('./src/config/db');

async function checkBikesSchema() {
  try {
    const [columns] = await db.query('DESCRIBE bikes');
    console.log('Bikes Schema:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default} ${col.Extra}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBikesSchema();
