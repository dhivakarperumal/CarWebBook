const express = require('express');
const router = express.Router();
const oc = require('../controllers/orderController');

router.get('/', oc.getAllOrders);
router.get('/:id', oc.getOrderById);
router.put('/:id/status', oc.updateOrderStatus);
router.post('/', oc.createOrder);

module.exports = router;
