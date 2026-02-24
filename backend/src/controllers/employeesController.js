const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { success, created, notFound, badRequest, forbidden } = require('../utils/response');
const { getPaginationParams, buildPagination } = require('../utils/helpers');
const { CROSS_BRANCH_ROLES } = require('../middleware/rbac');

const getEmployees = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, role, is_active = 'true' } = req.query;

  // Branch scoping: admins/accountants see all, others see own branch
  const canSeeAll = CROSS_BRANCH_ROLES.includes(req.user.role);
  const branchId  = canSeeAll ? (req.query.branch_id || null) : req.user.branch_id;

  let conditions = ['1=1'];
  let params = [];
  let i = 1;

  if (branchId) { conditions.push(`e.branch_id = $${i++}`); params.push(branchId); }
  if (search) {
    conditions.push(`(e.name ILIKE $${i} OR e.email ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }
  if (role) { conditions.push(`e.role = $${i++}`); params.push(role); }
  if (is_active !== 'all') { conditions.push(`e.is_active = $${i++}`); params.push(is_active === 'true'); }

  const where = conditions.join(' AND ');
  const countResult = await query(`SELECT COUNT(*) FROM employees e WHERE ${where}`, params);
  const result = await query(
    `SELECT e.id, e.name, e.email, e.phone, e.role, e.branch_id,
            e.is_active, e.last_login, e.created_at, b.name as branch_name
     FROM employees e
     LEFT JOIN branches b ON e.branch_id = b.id
     WHERE ${where} ORDER BY e.name ASC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return success(res, {
    data: result.rows,
    pagination: buildPagination(countResult.rows[0].count, page, limit),
  });
};

const getEmployee = async (req, res) => {
  const result = await query(
    `SELECT e.id, e.name, e.email, e.phone, e.role, e.branch_id,
            e.is_active, e.last_login, e.created_at, b.name as branch_name
     FROM employees e LEFT JOIN branches b ON e.branch_id = b.id
     WHERE e.id = $1`,
    [req.params.id]
  );
  if (!result.rows.length) return notFound(res, 'Employee not found');
  const emp = result.rows[0];
  // Non-admin can only view their own branch
  const canSeeAll = CROSS_BRANCH_ROLES.includes(req.user.role);
  if (!canSeeAll && emp.branch_id !== req.user.branch_id)
    return forbidden(res, 'Access denied');
  return success(res, emp);
};

const createEmployee = async (req, res) => {
  const { name, email, phone, role, branch_id, password } = req.body;

  if (!name || !email || !role || !password)
    return badRequest(res, 'Name, email, role and password are required');

  // Determine which branch to assign
  const canSeeAll = CROSS_BRANCH_ROLES.includes(req.user.role);
  let targetBranch = branch_id || req.user.branch_id;

  // Non-admin cannot create employees for other branches
  if (!canSeeAll && targetBranch !== req.user.branch_id)
    return forbidden(res, 'You can only add employees to your own branch');

  // Must have a branch (except super_admin)
  if (!targetBranch && role !== 'super_admin')
    return badRequest(res, 'Branch is required for this employee');

  // Prevent creating super_admin from non-super_admin
  if (role === 'super_admin' && req.user.role !== 'super_admin')
    return forbidden(res, 'Only super admins can create super admin accounts');

  const hash = await bcrypt.hash(password, 8);
  const result = await query(
    `INSERT INTO employees (name, email, phone, role, branch_id, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, email, phone, role, branch_id, is_active, created_at`,
    [name, email.toLowerCase().trim(), phone || null, role,
     targetBranch || null, hash]
  );
  return created(res, result.rows[0], 'Employee created');
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;

  // Check the employee exists and is accessible
  const empResult = await query('SELECT * FROM employees WHERE id = $1', [id]);
  if (!empResult.rows.length) return notFound(res, 'Employee not found');
  const emp = empResult.rows[0];

  const canSeeAll = CROSS_BRANCH_ROLES.includes(req.user.role);
  if (!canSeeAll && emp.branch_id !== req.user.branch_id)
    return forbidden(res, 'Access denied');

  const allowed = ['name', 'phone', 'role', 'branch_id', 'is_active'];
  // Only super_admin can change branch assignment
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    allowed.splice(allowed.indexOf('branch_id'), 1);
  }

  const updates = []; const params = []; let i = 1;
  allowed.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
  });
  if (!updates.length) return badRequest(res, 'No fields to update');

  params.push(id);
  const result = await query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = $${i}
     RETURNING id, name, email, phone, role, branch_id, is_active`,
    params
  );
  return success(res, result.rows[0], 'Employee updated');
};

const resetEmployeePassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  const empResult = await query('SELECT branch_id FROM employees WHERE id = $1', [id]);
  if (!empResult.rows.length) return notFound(res, 'Employee not found');

  const canSeeAll = CROSS_BRANCH_ROLES.includes(req.user.role);
  if (!canSeeAll && empResult.rows[0].branch_id !== req.user.branch_id)
    return forbidden(res, 'Access denied');

  const hash = await bcrypt.hash(new_password, 8);
  await query('UPDATE employees SET password_hash = $1 WHERE id = $2', [hash, id]);
  return success(res, {}, 'Password reset successful');
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, resetEmployeePassword };
