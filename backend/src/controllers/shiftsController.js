const { query } = require('../config/db');
const { success, created, notFound, badRequest } = require('../utils/response');

const openShift = async (req, res) => {
  const { opening_cash = 0, notes } = req.body;

  const existing = await query(
    "SELECT id FROM shifts WHERE employee_id = $1 AND status = 'open'",
    [req.user.id]
  );
  if (existing.rows.length) return badRequest(res, 'You already have an open shift');

  const result = await query(
    `INSERT INTO shifts (employee_id, branch_id, opening_cash, notes)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, req.user.branch_id, opening_cash, notes]
  );
  return created(res, result.rows[0], 'Shift opened');
};

const closeShift = async (req, res) => {
  const { closing_cash, notes } = req.body;

  const shift = await query(
    "SELECT * FROM shifts WHERE employee_id = $1 AND status = 'open' ORDER BY start_time DESC LIMIT 1",
    [req.user.id]
  );
  if (!shift.rows.length) return notFound(res, 'No open shift found');

  const s = shift.rows[0];
  const result = await query(
    `UPDATE shifts SET
       end_time = NOW(), closing_cash = $1, status = 'closed', notes = $2
     WHERE id = $3 RETURNING *`,
    [closing_cash, notes || s.notes, s.id]
  );
  return success(res, result.rows[0], 'Shift closed');
};

const getMyShift = async (req, res) => {
  const result = await query(
    `SELECT sh.*, e.name as employee_name, b.name as branch_name
     FROM shifts sh
     JOIN employees e ON sh.employee_id = e.id
     LEFT JOIN branches b ON sh.branch_id = b.id
     WHERE sh.employee_id = $1 AND sh.status = 'open'
     ORDER BY sh.start_time DESC LIMIT 1`,
    [req.user.id]
  );
  return success(res, result.rows[0] || null);
};

const getShiftHistory = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const offset = parseInt(req.query.offset) || 0;
  const branchFilter = req.user.branch_id && req.user.role !== 'super_admin'
    ? 'AND sh.branch_id = $3' : '';

  const result = await query(
    `SELECT sh.*, e.name as employee_name
     FROM shifts sh
     JOIN employees e ON sh.employee_id = e.id
     WHERE 1=1 ${branchFilter}
     ORDER BY sh.start_time DESC
     LIMIT $1 OFFSET $2`,
    req.user.branch_id && req.user.role !== 'super_admin'
      ? [limit, offset, req.user.branch_id]
      : [limit, offset]
  );
  return success(res, result.rows);
};

module.exports = { openShift, closeShift, getMyShift, getShiftHistory };
