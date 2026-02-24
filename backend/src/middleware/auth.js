const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const { query } = require('../config/db');
const { unauthorized } = require('../utils/response');
const logger = require('../utils/logger');
const { branchContext } = require('./branchContext');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return unauthorized(res, 'Access token required');

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const result = await query(
      `SELECT e.id, e.name, e.email, e.role, e.is_active, e.branch_id,
              b.name as branch_name
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.id = $1 AND e.is_active = true`,
      [decoded.id]
    );

    if (!result.rows.length)
      return unauthorized(res, 'User not found or inactive');

    req.user = result.rows[0];

    // Apply branch context (X-Branch-ID override for super_admin)
    branchContext(req, res, next);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    if (err.name === 'JsonWebTokenError')  return unauthorized(res, 'Invalid token');
    logger.error('Auth middleware error:', err);
    return unauthorized(res, 'Authentication failed');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    const result = await query(
      `SELECT e.id, e.name, e.email, e.role, e.is_active, e.branch_id
       FROM employees e WHERE e.id = $1 AND e.is_active = true`,
      [decoded.id]
    );
    if (result.rows.length > 0) req.user = result.rows[0];
    next();
  } catch { next(); }
};

module.exports = { authenticate, optionalAuth, branchContext };
