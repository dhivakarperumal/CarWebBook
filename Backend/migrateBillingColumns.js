const db = require('./src/config/db.js');

const migrate = async () => {
  const alterations = [
    { col: 'registrationNumber', sql: "ADD COLUMN registrationNumber VARCHAR(100) DEFAULT NULL" },
    { col: 'issueTotal',         sql: "ADD COLUMN issueTotal DECIMAL(10,2) DEFAULT 0" },
    { col: 'discount',           sql: "ADD COLUMN discount DECIMAL(10,2) DEFAULT 0" },
    { col: 'billingType',        sql: "ADD COLUMN billingType VARCHAR(50) DEFAULT 'online'" },
  ];

  for (const { col, sql } of alterations) {
    try {
      await db.query(`ALTER TABLE billings ${sql}`);
      console.log(`✅ Added column: ${col}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭️  Column already exists: ${col}`);
      } else {
        console.error(`❌ Error adding ${col}:`, err.message);
      }
    }
  }

  console.log('\n✅ Billing table migration complete.');
  process.exit(0);
};

migrate();
