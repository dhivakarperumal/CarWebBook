const express = require('express');
const router = express.Router();
const ac = require('../controllers/attendanceController');

router.get('/', ac.getAttendanceByDate);
router.post('/punch-in', ac.punchIn);
router.put('/punch-out/:id', ac.punchOut);

module.exports = router;
