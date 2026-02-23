const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/internetSessionsController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/active', ctrl.getActiveSessions);
router.get('/computers', ctrl.getComputerStatus);
router.get('/history', ctrl.getSessionHistory);

router.post('/start', authorizeMinRole('internet_operator'), [
  body('computer_id').isUUID(),
  body('rate_per_hour').optional().isNumeric(),
  validate,
], ctrl.startSession);

router.put('/:id/end', authorizeMinRole('internet_operator'), ctrl.endSession);
router.post('/:id/pay', authorizeMinRole('internet_operator'), [
  body('amount').isNumeric({ min: 0 }),
  validate,
], ctrl.paySession);

module.exports = router;
