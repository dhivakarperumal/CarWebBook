const express = require('express');
const router = express.Router();
const ac = require('../controllers/attendanceController');

router.get('/', ac.getAttendanceByDate);
router.get('/check', ac.checkTodayAttendance);
router.post('/punch-in', ac.punchIn);
router.patch('/punch-out/:id', ac.punchOut);

module.exports = router;
