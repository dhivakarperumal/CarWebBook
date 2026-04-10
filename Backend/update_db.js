const db = require('./src/config/db');

async function updateDb() {
  try {
    await db.query("ALTER TABLE pricing_packages ADD COLUMN place VARCHAR(50) DEFAULT 'home'");
    console.log("Added place");
  } catch(e) { console.log(e.message) }
  
  try {
    await db.query("ALTER TABLE pricing_packages ADD COLUMN time VARCHAR(50) DEFAULT ''");
    console.log("Added time");
  } catch(e) { console.log(e.message) }
  
  process.exit(0);
}
updateDb();
