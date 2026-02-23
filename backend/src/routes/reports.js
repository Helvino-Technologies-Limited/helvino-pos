const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');

router.use(authenticate, authorizeMinRole('accountant'));

router.get('/profit-loss', ctrl.getProfitAndLoss);
router.get('/top-products', ctrl.getTopProducts);
router.get('/top-services', ctrl.getTopServices);
router.get('/internet-usage', ctrl.getInternetUsageReport);
router.get('/stock', ctrl.getStockReport);

module.exports = router;
