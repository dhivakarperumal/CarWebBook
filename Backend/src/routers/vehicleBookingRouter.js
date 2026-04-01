const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehicleBookingController');

router.post('/', controller.addBooking);
router.get('/user/:uid', controller.getBookingsByUser);
router.get('/', controller.getAllBookings);
router.delete('/:id', controller.cancelBooking);

module.exports = router;
