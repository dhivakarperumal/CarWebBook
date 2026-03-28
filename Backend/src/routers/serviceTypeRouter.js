const express = require('express');
const router = express.Router();
const stc = require('../controllers/serviceTypeController');

router.get('/', stc.getServiceTypes);
router.post('/', stc.addServiceType);
router.delete('/:id', stc.deleteServiceType);

module.exports = router;
