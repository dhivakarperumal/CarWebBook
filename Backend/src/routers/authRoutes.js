const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginController || authController.loginUser);
router.post('/google-login', authController.googleLogin);
router.get('/users', authController.getAllUsers);
router.put('/users/:id/role', authController.updateUserRole);

router.put('/users/:id/status', authController.toggleUserStatus);
router.delete('/users/:id', authController.deleteUser);
router.get('/profile/:uid', authController.getProfile);
router.put('/profile/:uid', authController.updateProfile);
router.put('/profile/:uid/password', authController.updatePassword);

module.exports = router;
