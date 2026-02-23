const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/employeesController');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', authorizeMinRole('manager'), ctrl.getEmployees);
router.get('/:id', authorizeMinRole('manager'), ctrl.getEmployee);

router.post('/', authorize('super_admin','admin','manager'), [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['admin','manager','cashier','internet_operator','shift_supervisor','accountant']),
  validate,
], ctrl.createEmployee);

router.put('/:id', authorize('super_admin','admin','manager'), ctrl.updateEmployee);

router.put('/:id/reset-password', authorize('super_admin','admin'), [
  body('new_password').isLength({ min: 8 }),
  validate,
], ctrl.resetEmployeePassword);

module.exports = router;
