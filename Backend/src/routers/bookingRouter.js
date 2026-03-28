const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Define Routes
router.get('/', bookingController.getAllBookings);
router.post('/create', bookingController.createBooking);
router.put('/status/:id', bookingController.updateBookingStatus);

module.exports = router;
