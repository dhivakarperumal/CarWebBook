const express = require('express');
const router = express.Router();
const pc = require('../controllers/productController');

router.get('/', pc.getAllProducts);
router.post('/', pc.addProduct);
router.get('/slug/:slug', pc.getProductBySlug);
router.get('/:docId', pc.getProductById);
router.put('/stock/:docId', pc.updateStock);
router.put('/status/:docId', pc.toggleStatus);
router.put('/:docId', pc.updateProduct);
router.delete('/:docId', pc.deleteProduct);

// Bills
router.post('/bills/save', pc.saveBill);
router.get('/bills/all', pc.getAllBills);

module.exports = router;
