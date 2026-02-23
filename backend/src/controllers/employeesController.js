const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { success, created, notFound, badRequest, paginated } = require('../utils/response');
const { getPaginationParams, buildPagination } = require('../utils/helpers');

const getEmployees = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, role, is_active = 'true' } = req.query;

  let conditions = ['1=1'];
  let params = [];
  let i = 1;

  if (req.user.branch_id && req.user.role !== 'super_admin') {
    conditions.push(`e.branch_id = $${i++}`);
    params.push(req.user.branch_id);
  }
  if (search) {
    conditions.push(`(e.name ILIKE $${i} OR e.email ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }
  if (role) { conditions.push(`e.role = $${i++}`); params.push(role); }
  if (is_active !== 'all') { conditions.push(`e.is_active = $${i++}`); params.push(is_active === 'true'); }

  const where = conditions.join(' AND ');
  const countResult = await query(`SELECT COUNT(*) FROM employees e WHERE ${where}`, params);
  const result = await query(
    `SELECT e.id, e.name, e.email, e.phone, e.role, e.branch_id, e.is_active, e.last_login, e.created_at,
            b.name as branch_name
     FROM employees e
     LEFT JOIN branches b ON e.branch_id = b.id
     WHERE ${where}
     ORDER BY e.name ASC
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return paginated(res, result.rows, buildPagination(countResult.rows[0].count, page, limit));
};

const getEmployee = async (req, res) => {
  const result = await query(
    `SELECT e.id, e.name, e.email, e.phone, e.role, e.branch_id, e.is_active, e.last_login, e.created_at,
            b.name as branch_name
     FROM employees e
     LEFT JOIN branches b ON e.branch_id = b.id
     WHERE e.id = $1`,
    [req.params.id]
  );
  if (!result.rows.length) return notFound(res, 'Employee not found');
  return success(res, result.rows[0]);
};

const createEmployee = async (req, res) => {
  const { name, email, phone, role, branch_id, password } = req.body;
  const hash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO employees (name, email, phone, role, branch_id, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, phone, role, branch_id, is_active, created_at`,
    [name, email.toLowerCase().trim(), phone, role, branch_id || req.user.branch_id, hash]
  );
  return created(res, result.rows[0], 'Employee created');
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const fields = ['name','phone','role','branch_id','is_active'];

  const updates = [];
  const params = [];
  let i = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      params.push(req.body[field]);
    }
  });

  if (!updates.length) return badRequest(res, 'No fields to update');
  params.push(id);

  const result = await query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = $${i}
     RETURNING id, name, email, phone, role, is_active`,
    params
  );
  if (!result.rows.length) return notFound(res, 'Employee not found');
  return success(res, result.rows[0], 'Employee updated');
};

const resetEmployeePassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  const hash = await bcrypt.hash(new_password, 12);
  const result = await query(
    'UPDATE employees SET password_hash = $1 WHERE id = $2 RETURNING id',
    [hash, id]
  );
  if (!result.rows.length) return notFound(res, 'Employee not found');
  return success(res, {}, 'Password reset successful');
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, resetEmployeePassword };
