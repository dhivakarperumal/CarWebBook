const db = require('./src/config/db');

async function checkBikes() {
  const [rows] = await db.query('SELECT id, title, type FROM bikes');
  console.log('--- ALL RECORDS IN BIKES TABLE ---');
  rows.forEach(row => {
    console.log(`[id:${row.id}] ${row.title} (Type: ${row.type})`);
  });
  console.log('--- END OF LIST ---');
  process.exit(0);
}

checkBikes().catch(err => {
    console.error(err);
    process.exit(1);
});
