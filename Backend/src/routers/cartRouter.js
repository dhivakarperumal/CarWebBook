const express = require('express');
const router = express.Router();
const cc = require('../controllers/cartController');

router.post('/add', cc.addToCart);
router.get('/:userId', cc.getCart);
router.put('/item/:id', cc.updateCartItem);
router.delete('/item/:id', cc.removeCartItem);
router.delete('/:userId', cc.clearCart);

module.exports = router;