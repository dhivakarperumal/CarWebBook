const db = require('./src/config/db.js');
const sql = `
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partName VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  vendor VARCHAR(255),
  stockQty INT DEFAULT 0,
  minStock INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;
db.query(sql).then(() => {
  console.log('Inventory table created successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
