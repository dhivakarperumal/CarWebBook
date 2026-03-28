const express = require('express');
const router = express.Router();
const c = require('../controllers/carServiceController');

router.get('/', c.getAllCarServices);
router.post('/', c.addCarService);
router.get('/:id', c.getCarServiceById);
router.put('/:id', c.updateCarService);
router.delete('/:id', c.deleteCarService);

module.exports = router;
