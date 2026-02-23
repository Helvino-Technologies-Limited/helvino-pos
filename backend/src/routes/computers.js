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
    `SELECT * FROM computers WHERE 1=1 ${branchId ? 'AND branch_id = $1' : ''} ORDER BY station_number`,
    branchId ? [branchId] : []
  );
  return success(res, result.rows);
});

router.post('/', authorizeMinRole('manager'), async (req, res) => {
  const { name, station_number, ip_address, mac_address, specs } = req.body;
  const result = await query(
    `INSERT INTO computers (branch_id, name, station_number, ip_address, mac_address, specs)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.branch_id, name, station_number, ip_address, mac_address, specs]
  );
  return created(res, result.rows[0]);
});

router.put('/:id', authorizeMinRole('manager'), async (req, res) => {
  const fields = ['name','status','ip_address','mac_address','specs'];
  const updates = []; const params = []; let i = 1;
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }});
  params.push(req.params.id);
  const result = await query(`UPDATE computers SET ${updates.join(',')} WHERE id = $${i} RETURNING *`, params);
  if (!result.rows.length) return notFound(res, 'Computer not found');
  return success(res, result.rows[0]);
});

module.exports = router;
