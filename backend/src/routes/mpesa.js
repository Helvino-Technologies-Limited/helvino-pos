const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { stkPush, callback, checkStatus } = require('../controllers/mpesaController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/stk-push', authenticate, [
  body('phone').notEmpty(),
  body('amount').isNumeric({ min: 1 }),
  validate,
], stkPush);

router.post('/callback', callback); // No auth - Safaricom calls this
router.get('/status/:checkoutRequestId', authenticate, checkStatus);

module.exports = router;
