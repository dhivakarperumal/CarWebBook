const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.get('/:userUid', addressController.getAddressesByUser);
router.post('/', addressController.addAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;