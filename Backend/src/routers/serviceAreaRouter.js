const express = require('express');
const router = express.Router();
const serviceAreaController = require('../controllers/serviceAreaController');

router.get('/', serviceAreaController.getServiceAreas);
router.post('/', serviceAreaController.addServiceArea);
router.put('/:id', serviceAreaController.updateServiceArea);
router.patch('/:id/status', serviceAreaController.toggleStatus);
router.delete('/:id', serviceAreaController.deleteServiceArea);

module.exports = router;
