const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole, authorize } = require('../middleware/rbac');

router.use(authenticate, authorizeMinRole('accountant'));

router.get('/profit-loss',        ctrl.getProfitAndLoss);
router.get('/top-products',       ctrl.getTopProducts);
router.get('/top-services',       ctrl.getTopServices);
router.get('/internet-usage',     ctrl.getInternetUsageReport);
router.get('/stock',              ctrl.getStockReport);
router.get('/branches/comparison', authorize('super_admin'), ctrl.getBranchComparison);

module.exports = router;
