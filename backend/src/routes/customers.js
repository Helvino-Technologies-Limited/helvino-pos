const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/customersController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', ctrl.getCustomers);
router.get('/:id', ctrl.getCustomer);
router.get('/:id/statement', ctrl.getCustomerStatement);

router.post('/', [
  body('name').notEmpty().trim(),
  validate,
], ctrl.createCustomer);

router.put('/:id', ctrl.updateCustomer);

router.post('/:id/topup', authorizeMinRole('cashier'), [
  body('amount').isNumeric({ min: 1 }),
  validate,
], ctrl.topUpAccount);

module.exports = router;
