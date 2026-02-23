const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/salesController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', ctrl.getSales);
router.get('/daily-summary', ctrl.getDailySummary);
router.get('/:id', ctrl.getSale);

router.post('/', authorizeMinRole('cashier'), [
  body('items').isArray({ min: 1 }),
  body('payment_method').notEmpty(),
  body('paid_amount').isNumeric(),
  validate,
], ctrl.createSale);

module.exports = router;
