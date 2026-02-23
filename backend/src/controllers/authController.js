const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { jwt: jwtConfig } = require('../config/env');
const { success, unauthorized, badRequest } = require('../utils/response');
const logger = require('../utils/logger');

const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    `SELECT e.*, b.name as branch_name
     FROM employees e
     LEFT JOIN branches b ON e.branch_id = b.id
     WHERE e.email = $1`,
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0) {
    return unauthorized(res, 'Invalid email or password');
  }

  const employee = result.rows[0];

  if (!employee.is_active) {
    return unauthorized(res, 'Account is inactive. Contact administrator.');
  }

  const isValid = await bcrypt.compare(password, employee.password_hash);
  if (!isValid) {
    return unauthorized(res, 'Invalid email or password');
  }

  await query(
    'UPDATE employees SET last_login = NOW() WHERE id = $1',
    [employee.id]
  );

  const payload = {
    id: employee.id,
    role: employee.role,
    branch_id: employee.branch_id,
  };

  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

  const { password_hash, pin_hash, ...safeEmployee } = employee;

  logger.info(`User logged in: ${employee.email} [${employee.role}]`);

  return success(res, { token, user: safeEmployee }, 'Login successful');
};

const getProfile = async (req, res) => {
  const result = await query(
    `SELECT e.id, e.name, e.email, e.phone, e.role, e.branch_id,
            e.is_active, e.last_login, e.created_at, b.name as branch_name
     FROM employees e
     LEFT JOIN branches b ON e.branch_id = b.id
     WHERE e.id = $1`,
    [req.user.id]
  );
  return success(res, result.rows[0]);
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  const result = await query(
    'SELECT password_hash FROM employees WHERE id = $1',
    [req.user.id]
  );

  const isValid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!isValid) return badRequest(res, 'Current password is incorrect');

  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE employees SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

  return success(res, {}, 'Password changed successfully');
};

const refreshToken = async (req, res) => {
  const payload = {
    id: req.user.id,
    role: req.user.role,
    branch_id: req.user.branch_id,
  };
  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  return success(res, { token }, 'Token refreshed');
};

module.exports = { login, getProfile, changePassword, refreshToken };
