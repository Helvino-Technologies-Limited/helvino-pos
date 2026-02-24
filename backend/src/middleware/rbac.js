const { forbidden } = require('../utils/response');

const ROLE_HIERARCHY = {
  super_admin: 7, admin: 6, manager: 5,
  shift_supervisor: 4, accountant: 3, cashier: 2, internet_operator: 1,
};

// Roles that can see ALL branches (not locked to their own)
const CROSS_BRANCH_ROLES = ['super_admin', 'admin', 'accountant'];

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return forbidden(res, 'Access denied');
  if (allowedRoles.includes(req.user.role)) return next();
  return forbidden(res, `Access denied. Required: ${allowedRoles.join(', ')}`);
};

const authorizeMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return forbidden(res, 'Access denied');
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const minLevel  = ROLE_HIERARCHY[minRole] || 0;
  if (userLevel >= minLevel) return next();
  return forbidden(res, 'Insufficient permissions');
};

const isSelf = (paramField = 'id') => (req, res, next) => {
  if (!req.user) return forbidden(res, 'Access denied');
  const isAdmin = ['super_admin', 'admin', 'manager'].includes(req.user.role);
  if (isAdmin || req.user.id === req.params[paramField]) return next();
  return forbidden(res, 'You can only access your own data');
};

/**
 * Resolves the effective branch_id for a request.
 * - super_admin with X-Branch-ID header → that branch
 * - super_admin with no header           → null (all branches)
 * - admin / accountant                   → null (all branches, read-only cross-branch)
 * - everyone else                        → their own branch_id (strict)
 */
const getEffectiveBranchId = (req) => {
  const role = req.user?.role;
  if (!role) return null;
  if (role === 'super_admin') return req.user.branch_id || null; // already overridden by branchContext
  if (CROSS_BRANCH_ROLES.includes(role)) return null;           // admin/accountant see all
  return req.user.branch_id;                                     // everyone else: own branch only
};

/**
 * Middleware that injects req.effectiveBranchId.
 * Use this on any route that needs branch-scoped data.
 */
const branchScope = (req, res, next) => {
  req.effectiveBranchId = getEffectiveBranchId(req);
  next();
};

/**
 * Strict branch enforcement — used on write operations.
 * Prevents cashiers/operators from writing to a different branch.
 * Admin and super_admin are exempt.
 */
const enforceBranch = (req, res, next) => {
  const role = req.user?.role;
  if (!role) return forbidden(res, 'Access denied');
  if (['super_admin', 'admin'].includes(role)) return next();
  const bodyBranch = req.body?.branch_id;
  if (bodyBranch && bodyBranch !== req.user.branch_id) {
    return forbidden(res, 'You cannot perform operations for another branch');
  }
  // Force branch_id to their own branch on write
  req.body.branch_id = req.user.branch_id;
  next();
};

module.exports = {
  authorize, authorizeMinRole, isSelf,
  branchScope, enforceBranch, getEffectiveBranchId,
  CROSS_BRANCH_ROLES, ROLE_HIERARCHY,
};
