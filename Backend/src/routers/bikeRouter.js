const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');

router.get('/', bikeController.getAllBikes);
router.get('/:id', bikeController.getBikeById);
router.post('/', bikeController.addBike);
router.put('/:id', bikeController.updateBike);
router.delete('/:id', bikeController.deleteBike);

module.exports = router;
