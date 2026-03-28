const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginController || authController.loginUser);
router.get('/users', authController.getAllUsers);
router.put('/users/:id/role', authController.updateUserRole);
router.put('/users/:id/status', authController.toggleUserStatus);

module.exports = router;
