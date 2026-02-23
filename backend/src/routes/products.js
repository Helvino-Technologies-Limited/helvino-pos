const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/productsController');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeMinRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', ctrl.getProducts);
router.get('/low-stock', ctrl.getLowStockProducts);
router.get('/barcode/:code', ctrl.getProductByBarcode);
router.get('/:id', ctrl.getProduct);

router.post('/', authorizeMinRole('cashier'), [
  body('name').notEmpty().trim(),
  body('cost_price').isNumeric(),
  body('selling_price').isNumeric(),
  validate,
], ctrl.createProduct);

router.put('/:id', authorizeMinRole('cashier'), ctrl.updateProduct);

router.post('/:id/adjust-stock', authorizeMinRole('cashier'), [
  body('adjustment_type').isIn(['add','remove','damage','return','correction','transfer']),
  body('quantity').isInt({ min: 1 }),
  body('reason').notEmpty(),
  validate,
], ctrl.adjustStock);

module.exports = router;
