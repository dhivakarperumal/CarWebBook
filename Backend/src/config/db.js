const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'car_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🛠️ [db] config', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'car_booking',
});

const promisePool = pool.promise();

module.exports = promisePool;
