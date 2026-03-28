const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables
async function initializeDatabase() {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS pricing_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        features JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableSQL);
    console.log('✓ pricing_packages table checked/created');
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
  }
}

// Routers
const bookingRouter = require('./src/routers/bookingRouter');
app.use('/api/bookings', bookingRouter);

const pricingRouter = require('./src/routers/pricingRoutes');
app.use('/api/pricing_packages', pricingRouter);

const servicesRouter = require("./src/routers/servicesRoutes");
app.use('/api/services', servicesRouter);

// Basic Route
app.get('/', (req, res) => {
  res.send('Welcome to Car Booking API');
});

// Test Connection
(async () => {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('✓ MySQL Connected Successfully');
    
    // Initialize database tables
    await initializeDatabase();
  } catch (error) {
    console.error('✗ Unable to connect to MySQL:', error.message);
  }
})();

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
