const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/expensesController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', ctrl.getExpenses);
router.get('/summary', ctrl.getExpenseSummary);

router.post('/', [
  body('category').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('amount').isNumeric({ min: 0.01 }),
  validate,
], ctrl.createExpense);

router.put('/:id', authorizeMinRole('cashier'), ctrl.updateExpense);
router.delete('/:id', authorizeMinRole('manager'), ctrl.deleteExpense);

module.exports = router;
