const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success } = require('../utils/response');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const branchId = req.user.branch_id;
  const isSuperAdmin = req.user.role === 'super_admin';
  const bf = branchId && !isSuperAdmin ? branchId : null;

  const notifications = [];

  const [lowStock, outOfStock, unpaidSessions, openShifts, unpaidSales] = await Promise.all([
    // Low stock products
    query(
      `SELECT id, name, quantity, reorder_level, branch_id,
              b.name as branch_name
       FROM products p
       LEFT JOIN branches b ON p.branch_id = b.id
       WHERE p.is_active = true
       AND p.quantity > 0
       AND p.quantity <= p.reorder_level
       ${bf ? 'AND p.branch_id = $1' : ''}
       ORDER BY p.quantity ASC LIMIT 10`,
      bf ? [bf] : []
    ),
    // Out of stock
    query(
      `SELECT id, name, branch_id, b.name as branch_name
       FROM products p
       LEFT JOIN branches b ON p.branch_id = b.id
       WHERE p.is_active = true AND p.quantity = 0
       ${bf ? 'AND p.branch_id = $1' : ''}
       LIMIT 10`,
      bf ? [bf] : []
    ),
    // Internet sessions unpaid > 1 hour
    query(
      `SELECT i.id, i.computer_name, i.actual_duration_minutes,
              i.cost, c.name as customer_name,
              b.name as branch_name
       FROM internet_sessions i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN branches b ON i.branch_id = b.id
       WHERE i.status = 'unpaid'
       AND i.end_time IS NOT NULL
       ${bf ? 'AND i.branch_id = $1' : ''}
       ORDER BY i.end_time ASC LIMIT 5`,
      bf ? [bf] : []
    ),
    // Shifts open > 12 hours
    query(
      `SELECT s.id, s.start_time, e.name as employee_name,
              b.name as branch_name,
              EXTRACT(EPOCH FROM (NOW() - s.start_time))/3600 as hours_open
       FROM shifts s
       LEFT JOIN employees e ON s.employee_id = e.id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.end_time IS NULL
       AND s.start_time < NOW() - INTERVAL '12 hours'
       ${bf ? 'AND s.branch_id = $1' : ''}
       LIMIT 5`,
      bf ? [bf] : []
    ),
    // Unpaid/credit sales today
    query(
      `SELECT s.id, s.receipt_number, s.total,
              c.name as customer_name,
              b.name as branch_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.payment_status = 'partial'
       AND DATE(s.created_at) >= CURRENT_DATE - INTERVAL '7 days'
       ${bf ? 'AND s.branch_id = $1' : ''}
       ORDER BY s.created_at DESC LIMIT 5`,
      bf ? [bf] : []
    ),
  ]);

  // Build notification objects
  outOfStock.rows.forEach(p => notifications.push({
    id:       `oos-${p.id}`,
    type:     'error',
    category: 'stock',
    title:    'Out of Stock',
    message:  `${p.name} is out of stock`,
    branch:   p.branch_name,
    link:     '/products',
  }));

  lowStock.rows.forEach(p => notifications.push({
    id:       `low-${p.id}`,
    type:     'warning',
    category: 'stock',
    title:    'Low Stock',
    message:  `${p.name} — only ${p.quantity} left (reorder at ${p.reorder_level})`,
    branch:   p.branch_name,
    link:     '/products',
  }));

  unpaidSessions.rows.forEach(s => notifications.push({
    id:       `sess-${s.id}`,
    type:     'warning',
    category: 'internet',
    title:    'Unpaid Session',
    message:  `${s.computer_name} — KES ${parseFloat(s.cost).toFixed(0)} unpaid`,
    branch:   s.branch_name,
    link:     '/internet',
  }));

  openShifts.rows.forEach(s => notifications.push({
    id:       `shift-${s.id}`,
    type:     'info',
    category: 'shifts',
    title:    'Shift Still Open',
    message:  `${s.employee_name}'s shift open for ${Math.round(s.hours_open)}h`,
    branch:   s.branch_name,
    link:     '/shifts',
  }));

  unpaidSales.rows.forEach(s => notifications.push({
    id:       `sale-${s.id}`,
    type:     'info',
    category: 'sales',
    title:    'Partial Payment',
    message:  `${s.receipt_number} — KES ${parseFloat(s.total).toFixed(0)} from ${s.customer_name || 'Walk-in'}`,
    branch:   s.branch_name,
    link:     '/sales',
  }));

  return success(res, {
    count: notifications.length,
    notifications,
  });
});

module.exports = router;
