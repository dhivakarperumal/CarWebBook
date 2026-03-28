const express = require('express');
const router = express.Router();
const sc = require('../controllers/staffController');

router.get('/generate-employee-id', sc.generateEmployeeId);
router.get('/', sc.getAllStaff);
router.get('/:id', sc.getStaffById);
router.post('/', sc.addStaff);
router.put('/:id', sc.updateStaff);
router.delete('/:id', sc.deleteStaff);

module.exports = router;
