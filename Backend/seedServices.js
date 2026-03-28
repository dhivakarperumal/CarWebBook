const db = require('./src/config/db.js');

const seed = async () => {
  try {
    await db.query(`INSERT IGNORE INTO services 
      (code, name, price, description, status, supportedBrands, sparePartsIncluded) 
      VALUES 
      ('SE001', 'Full Service', 2500, 'All includes', 'active', '[]', '[]'), 
      ('SE002', 'Oil Change', 1200, 'Basic maintenance', 'active', '[]', '[]')`);
    console.log('✅ Services seeded');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
};

seed();
