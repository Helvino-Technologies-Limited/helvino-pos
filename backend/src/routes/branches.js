const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success, created, notFound, badRequest } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole, authorize } = require('../middleware/rbac');

const nullify = (v) => (v === '' || v === undefined ? null : v);

router.use(authenticate);

// GET all branches — managers+ can list, but only super_admin sees all
router.get('/', authorizeMinRole('manager'), async (req, res) => {
  const result = await query(
    `SELECT id, name, address, phone, email, website, county, town, is_active, created_at
     FROM branches ORDER BY created_at ASC`
  );
  return success(res, result.rows);
});

// GET single branch
router.get('/:id', authorizeMinRole('manager'), async (req, res) => {
  const result = await query('SELECT * FROM branches WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return notFound(res, 'Branch not found');
  return success(res, result.rows[0]);
});

// CREATE branch — super_admin only
router.post('/', authorize('super_admin'), async (req, res) => {
  const { name, address, phone, email, website, county, town } = req.body;
  if (!name) return badRequest(res, 'Branch name is required');
  const result = await query(
    `INSERT INTO branches (name, address, phone, email, website, county, town)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, nullify(address), nullify(phone), nullify(email),
     nullify(website), nullify(county), nullify(town)]
  );
  return created(res, result.rows[0], 'Branch created');
});

// UPDATE branch — super_admin only
router.put('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  const fields = ['name','address','phone','email','website','county','town','is_active'];
  const updates = []; const params = []; let i = 1;
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${i++}`);
      params.push(f === 'is_active' ? req.body[f] : nullify(req.body[f]));
    }
  });
  if (!updates.length) return badRequest(res, 'No fields to update');
  params.push(req.params.id);
  const result = await query(
    `UPDATE branches SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${i} RETURNING *`, params
  );
  if (!result.rows.length) return notFound(res, 'Branch not found');
  return success(res, result.rows[0], 'Branch updated');
});

// GET branch summary stats (for super_admin dashboard)
router.get('/:id/summary', authorizeMinRole('manager'), async (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [branch, todaySales, monthSales, stock, employees, sessions] = await Promise.all([
    query('SELECT id, name, town, phone FROM branches WHERE id = $1', [id]),
    query(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
           FROM sales WHERE DATE(created_at) = $1 AND branch_id = $2
           AND payment_status != 'cancelled'`, [today, id]),
    query(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
           FROM sales WHERE DATE(created_at) >= $1 AND branch_id = $2
           AND payment_status != 'cancelled'`, [monthStart, id]),
    query(`SELECT COUNT(*) as total,
           SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
           SUM(CASE WHEN quantity > 0 AND quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock
           FROM products WHERE branch_id = $1 AND is_active = true`, [id]),
    query(`SELECT COUNT(*) as total FROM employees WHERE branch_id = $1 AND is_active = true`, [id]),
    query(`SELECT COUNT(*) as active FROM internet_sessions
           WHERE branch_id = $1 AND status = 'active'`, [id]),
  ]);

  if (!branch.rows.length) return notFound(res, 'Branch not found');

  return success(res, {
    branch: branch.rows[0],
    today_sales: { total: parseFloat(todaySales.rows[0].total), count: parseInt(todaySales.rows[0].count) },
    month_sales: { total: parseFloat(monthSales.rows[0].total), count: parseInt(monthSales.rows[0].count) },
    stock: {
      total: parseInt(stock.rows[0].total),
      out_of_stock: parseInt(stock.rows[0].out_of_stock),
      low_stock: parseInt(stock.rows[0].low_stock),
    },
    employees: parseInt(employees.rows[0].total),
    active_sessions: parseInt(sessions.rows[0].active),
  });
});

module.exports = router;
