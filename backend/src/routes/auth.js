const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, getProfile, updateProfile, changePassword, refreshToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),
  validate,
], login);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/refresh', authenticate, refreshToken);

router.put('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
  validate,
], changePassword);

module.exports = router;
