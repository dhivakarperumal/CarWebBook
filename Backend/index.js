const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

    const createReviewsTableSQL = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        productId INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        message TEXT NOT NULL,
        image LONGTEXT,
        status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createReviewsTableSQL);
    console.log('✓ reviews table checked/created');

    const createBikesTableSQL = `
      CREATE TABLE IF NOT EXISTS bikes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        variant VARCHAR(100),
        yom YEAR,
        reg_year YEAR,
        engine_cc INT,
        mileage DECIMAL(10,2),
        fuel_type ENUM('Petrol', 'Electric', 'Hybrid') DEFAULT 'Petrol',
        transmission ENUM('Manual', 'Automatic') DEFAULT 'Manual',
        km_driven INT,
        owners INT,
        color VARCHAR(50),
        city VARCHAR(100),
        area VARCHAR(255),
        pincode VARCHAR(10),
        expected_price DECIMAL(15,2),
        negotiable BOOLEAN DEFAULT FALSE,
        insurance_valid DATE,
        road_tax_paid BOOLEAN DEFAULT FALSE,
        rc_available BOOLEAN DEFAULT FALSE,
        insurance_available BOOLEAN DEFAULT FALSE,
        puc_available BOOLEAN DEFAULT FALSE,
        loan_status ENUM('Clear', 'Active') DEFAULT 'Clear',
        images JSON,
        description TEXT,
        seller_name VARCHAR(100),
        seller_phone VARCHAR(20),
        seller_email VARCHAR(100),
        status ENUM('draft', 'published', 'sold') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(createBikesTableSQL);
    console.log('✓ bikes table checked/created');

    const createCartTableSQL = `
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NULL,
        userUid VARCHAR(100) NULL,
        productId INT NOT NULL,
        sku VARCHAR(100),
        name VARCHAR(255),
        variant LONGTEXT,
        price DECIMAL(10,2),
        image LONGTEXT,
        quantity INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(docId)
      )
    `;
    await db.query(createCartTableSQL);
    console.log('✓ cart table checked/created');

    // Ensure variant column exists in cart (for older tables)
    try {
      await db.query('ALTER TABLE cart ADD COLUMN variant LONGTEXT');
      console.log('✓ cart table updated with variant column');
    } catch (err) {
      // Ignore if already exists
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS product_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(100) UNIQUE,
        uid VARCHAR(255),
        customerName VARCHAR(255),
        customerPhone VARCHAR(20),
        customerEmail VARCHAR(255),
        orderType VARCHAR(50) DEFAULT 'shop',
        paymentMethod VARCHAR(50),
        paymentStatus VARCHAR(50) DEFAULT 'Pending',
        status VARCHAR(50) DEFAULT 'orderplaced',
        shippingName VARCHAR(255),
        shippingPhone VARCHAR(20),
        shippingAddress TEXT,
        shippingCity VARCHAR(100),
        shippingState VARCHAR(100),
        shippingZip VARCHAR(20),
        shippingCountry VARCHAR(100),
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        shippingFee DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        cancelledReason TEXT,
        orderTrack JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ product_orders table checked/created');

    await db.query(`
      CREATE TABLE IF NOT EXISTS product_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_internal_id INT NOT NULL,
        productId VARCHAR(100),
        name VARCHAR(255),
        variant VARCHAR(255),
        sku VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        qty INT DEFAULT 1,
        total DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (order_internal_id) REFERENCES product_orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ product_order_items table checked/created');
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
  }
}

// Routers
const bookingRouter = require('./src/routers/bookingRouter');
// const serviceRoutes = require('./src/routers/serviceRoutes');
const authRoutes = require('./src/routers/authRoutes');
const inventoryRouter = require('./src/routers/inventoryRouter');
const productRouter = require('./src/routers/productRouter');
const staffRouter = require('./src/routers/staffRouter');
const carServiceRouter = require('./src/routers/carServiceRouter');
const attendanceRouter = require('./src/routers/attendanceRouter');
const allServiceRouter = require('./src/routers/allServiceRouter');
const serviceTypeRouter = require('./src/routers/serviceTypeRouter');
const billingRouter = require('./src/routers/billingRouter');
const orderRouter = require('./src/routers/orderRouter');

app.use('/api/bookings', bookingRouter);
// app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRouter);
app.use('/api/products', productRouter);
app.use('/api/staff', staffRouter);
app.use('/api/car-services', carServiceRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/all-services', allServiceRouter);
app.use('/api/service-types', serviceTypeRouter);
app.use('/api/billings', billingRouter);
app.use('/api/orders', orderRouter);
app.use('/api/cart', require('./src/routers/cartRouter'));

const pricingRouter = require('./src/routers/pricingRoutes');
app.use('/api/pricing_packages', pricingRouter);

const servicesRouter = require("./src/routers/servicesRoutes");
app.use('/api/services', servicesRouter);

const reviewRouter = require('./src/routers/reviewRouter');
app.use('/api/reviews', reviewRouter);

const bikeRouter = require('./src/routers/bikeRouter');
app.use('/api/bikes', bikeRouter);

const addressRouter = require('./src/routers/addressRouter');
app.use('/api/addresses', addressRouter);

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
