const express = require('express');
const router = express.Router();
const { getDashboard, getRevenueChart } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getDashboard);
router.get('/revenue-chart', getRevenueChart);

module.exports = router;
