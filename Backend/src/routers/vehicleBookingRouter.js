const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehicleBookingController');

router.post('/', controller.addBooking);
router.get('/user/:uid', controller.getBookingsByUser);
router.get('/', controller.getAllBookings);
router.put('/:id/status', controller.updateBookingStatus);
router.delete('/:id', controller.cancelBooking);

module.exports = router;
