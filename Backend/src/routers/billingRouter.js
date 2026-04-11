const express = require('express');
const router = express.Router();
const bc = require('../controllers/billingController');

router.get('/', bc.getAllBillings);
router.post('/', bc.createInvoice);
router.get('/:id', bc.getInvoiceById);
router.patch('/:id/payment-status', bc.updatePaymentStatus);
router.patch('/:id', bc.updateInvoiceStatus);
router.delete('/:id', bc.deleteInvoice);

module.exports = router;
