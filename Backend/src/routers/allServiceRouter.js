const express = require('express');
const router = express.Router();
const asc = require('../controllers/allServiceController');

router.get('/', asc.getAllServices);
router.get('/booking/:bookingId/parts', asc.getPartsByBookingId);
router.get('/:id', asc.getServiceById);
router.put('/:id/status', asc.updateServiceStatus);
router.put('/:id/assign', asc.assignMechanic);
router.put('/:id/issue', asc.updateServiceIssue);
router.post('/:id/parts', asc.addServiceParts);
router.put('/:serviceId/parts/:partId/approve', asc.approveServicePart);
router.delete('/:id', asc.deleteService);

module.exports = router;
