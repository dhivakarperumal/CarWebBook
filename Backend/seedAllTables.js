const db = require('./src/config/db.js');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Seeding started...');
        const pass = await bcrypt.hash('password123', 10);

        // 1. Users
        await db.query(`INSERT IGNORE INTO users (uid, username, email, mobile, password, role) VALUES 
            ('user1_uid', 'John Doe', 'john@example.com', '9876543210', '${pass}', 'user'),
            ('user2_uid', 'Jane Smith', 'jane@example.com', '9876543211', '${pass}', 'user'),
            ('admin_uid_seed', 'Admin User', 'admin@car.com', '8888888888', '${pass}', 'admin')`);
        console.log('✅ Users seeded');

        // 2. Staff
        await db.query(`INSERT IGNORE INTO staff (uid, employee_id, name, email, phone, role, salary, joining_date) VALUES 
            ('staff_uid_1', 'EMP001', 'Staff One', 'staff1@car.com', '1234567890', 'Technician', 25000, '2025-01-01'),
            ('staff_uid_2', 'EMP002', 'Staff Two', 'staff2@car.com', '1234567891', 'Manager', 45000, '2025-01-15')`);
        console.log('✅ Staff seeded');

        // 3. Products
        await db.query(`INSERT IGNORE INTO products (id, name, brand, mrp, offerPrice, totalStock) VALUES 
            ('prod1', 'Engine Oil', 'Castrol', 1500, 1200, 50),
            ('prod2', 'Brake Pads', 'Bosch', 2500, 2000, 30)`);
        console.log('✅ Products seeded');

        // 4. Inventory
        await db.query(`INSERT IGNORE INTO inventory (partName, category, stockQty, minStock) VALUES 
            ('Oil Filter', 'Engine', 100, 10),
            ('Air Filter', 'Engine', 80, 5)`);
        console.log('✅ Inventory seeded');

        // 5. Bookings
        await db.query(`INSERT IGNORE INTO bookings (bookingId, uid, name, email, phone, brand, model, issue, address, location, status, created_at) VALUES 
            ('BS001', 'user1_uid', 'John Doe', 'john@example.com', '9876543210', 'Honda', 'City', 'Engine Noise', '123 Main St', 'Chennai', 'Booked', '2026-03-20 10:00:00'),
            ('BS002', 'user2_uid', 'Jane Smith', 'jane@example.com', '9876543211', 'Hyundai', 'Verna', 'Brake Issue', '456 West St', 'Chennai', 'Approved', '2026-03-21 11:30:00')`);
        console.log('✅ Bookings seeded');

        // 6. All Services
        await db.query(`INSERT IGNORE INTO all_services (id, bookingId, uid, name, phone, brand, model, serviceStatus, createdAt) VALUES 
            (1, 'BS001', 'user1_uid', 'John Doe', '9876543210', 'Honda', 'City', 'Processing', '2026-03-21 09:00:00'),
            (2, 'BS002', 'user2_uid', 'Jane Smith', '9876543211', 'Hyundai', 'Verna', 'Booked', '2026-03-22 10:00:00')`);
        console.log('✅ All Services seeded');

        // 7. Attendance
        await db.query(`INSERT IGNORE INTO attendance (staff_id, date, login_time, logout_time, status) VALUES 
            (1, '2026-03-28', '2026-03-28 09:00:00', '2026-03-28 18:00:00', 'Present'),
            (2, '2026-03-28', '2026-03-28 09:30:00', NULL, 'Present')`);
        console.log('✅ Attendance seeded');

        // 8. Billings
        await db.query(`INSERT IGNORE INTO billings (invoiceNo, serviceId, bookingId, customerName, grandTotal, status, createdAt) VALUES 
            ('INV001', 1, 'BS001', 'John Doe', 5500, 'Paid', '2026-03-25 14:00:00'),
            ('INV002', 2, 'BS002', 'Jane Smith', 3200, 'Pending', '2026-03-26 15:30:00')`);
        console.log('✅ Billings seeded');

        // 9. Product Orders
        await db.query(`INSERT IGNORE INTO product_orders (orderId, uid, customerName, total, status, createdAt) VALUES 
            ('ORD001', 'user1_uid', 'John Doe', 2400, 'OrderPlaced', '2026-03-24 12:00:00'),
            ('ORD002', 'user2_uid', 'Jane Smith', 4000, 'OrderPlaced', '2026-03-27 16:00:00')`);
        console.log('✅ Product Orders seeded');

        // 10. Service Types
        await db.query(`INSERT IGNORE INTO service_types (name) VALUES 
            ('General Service'),
            ('Deep Cleaning')`);
        console.log('✅ Service Types seeded');

        // 11. Pricing Packages
        await db.query(`INSERT IGNORE INTO pricing_packages (title, price, features) VALUES 
            ('Basic', 999, '["Oil Change", "Wash"]'),
            ('Premium', 2999, '["Full Service", "Scanning"]')`);
        console.log('✅ Pricing Packages seeded');

        console.log('All tables seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
