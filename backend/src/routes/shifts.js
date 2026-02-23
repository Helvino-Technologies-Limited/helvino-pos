const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/shiftsController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/current', ctrl.getMyShift);
router.get('/history', authorizeMinRole('manager'), ctrl.getShiftHistory);

router.post('/open', [
  body('opening_cash').optional().isNumeric({ min: 0 }),
  validate,
], ctrl.openShift);

router.put('/close', [
  body('closing_cash').isNumeric({ min: 0 }),
  validate,
], ctrl.closeShift);

module.exports = router;
