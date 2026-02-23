const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success, created, notFound } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  const branchId = req.user.branch_id;
  const result = await query(
    `SELECT s.*, c.name as category_name FROM services s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.is_active = true ${branchId ? 'AND s.branch_id = $1' : ''}
     ORDER BY s.service_type, s.name`,
    branchId ? [branchId] : []
  );
  return success(res, result.rows);
});

router.post('/', authorizeMinRole('manager'), async (req, res) => {
  const { category_id, name, description, service_type, rate, rate_unit = 'per_job', b_and_w_rate, color_rate, notes } = req.body;
  const result = await query(
    `INSERT INTO services (branch_id, category_id, name, description, service_type, rate, rate_unit, b_and_w_rate, color_rate, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.branch_id, category_id, name, description, service_type, rate, rate_unit, b_and_w_rate, color_rate, notes]
  );
  return created(res, result.rows[0]);
});

router.put('/:id', authorizeMinRole('manager'), async (req, res) => {
  const fields = ['name','description','service_type','rate','rate_unit','b_and_w_rate','color_rate','is_active','notes'];
  const updates = []; const params = []; let i = 1;
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }});
  params.push(req.params.id);
  const result = await query(`UPDATE services SET ${updates.join(',')} WHERE id = $${i} RETURNING *`, params);
  if (!result.rows.length) return notFound(res, 'Service not found');
  return success(res, result.rows[0]);
});

module.exports = router;
