const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success, created, notFound } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { type } = req.query;
  let q = 'SELECT * FROM categories WHERE is_active = true';
  const params = [];
  if (type) { q += ' AND category_type = $1'; params.push(type); }
  q += ' ORDER BY name';
  const result = await query(q, params);
  return success(res, result.rows);
});

router.post('/', authorizeMinRole('manager'), async (req, res) => {
  const { name, parent_id, category_type = 'product', description } = req.body;
  const result = await query(
    'INSERT INTO categories (name, parent_id, category_type, description) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, parent_id || null, category_type, description]
  );
  return created(res, result.rows[0]);
});

module.exports = router;
