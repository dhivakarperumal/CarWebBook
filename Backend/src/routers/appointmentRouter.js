const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/create', appointmentController.createAppointment);
router.get('/my', appointmentController.getMyAppointments);
router.get('/all', appointmentController.getAllAppointments);
router.put('/:id', appointmentController.updateAppointment);

module.exports = router;
