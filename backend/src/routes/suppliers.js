const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success, created, notFound, paginated } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');
const { getPaginationParams, buildPagination } = require('../utils/helpers');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search } = req.query;
  let q = 'SELECT * FROM suppliers WHERE is_active = true';
  const params = [];
  if (search) { q += ' AND (name ILIKE $1 OR contact_person ILIKE $1)'; params.push(`%${search}%`); }
  const count = await query(q.replace('*', 'COUNT(*)'), params);
  q += ` ORDER BY name LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  const result = await query(q, params);
  return paginated(res, result.rows, buildPagination(count.rows[0].count, page, limit));
});

router.get('/:id', async (req, res) => {
  const result = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return notFound(res, 'Supplier not found');
  return success(res, result.rows[0]);
});

router.post('/', authorizeMinRole('manager'), async (req, res) => {
  const { name, contact_person, phone, email, address, tax_pin, payment_terms, credit_limit } = req.body;
  const result = await query(
    `INSERT INTO suppliers (name, contact_person, phone, email, address, tax_pin, payment_terms, credit_limit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, contact_person, phone, email, address, tax_pin, payment_terms || 30, credit_limit || 0]
  );
  return created(res, result.rows[0]);
});

router.put('/:id', authorizeMinRole('manager'), async (req, res) => {
  const fields = ['name','contact_person','phone','email','address','tax_pin','payment_terms','credit_limit','is_active'];
  const updates = []; const params = []; let i = 1;
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }});
  params.push(req.params.id);
  const result = await query(`UPDATE suppliers SET ${updates.join(',')} WHERE id = $${i} RETURNING *`, params);
  if (!result.rows.length) return notFound(res, 'Supplier not found');
  return success(res, result.rows[0]);
});

module.exports = router;
