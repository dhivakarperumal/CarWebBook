const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehicleBookingController');

router.post('/', controller.addBooking);
router.get('/user/:uid', controller.getBookingsByUser);
router.get('/', controller.getAllBookings);

module.exports = router;
