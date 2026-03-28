const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Define Routes
router.get('/', inventoryController.getAllItems);
router.post('/', inventoryController.addItem);
router.get('/:id', inventoryController.getItemById);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

module.exports = router;
