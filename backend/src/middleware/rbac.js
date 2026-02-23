const { forbidden } = require('../utils/response');

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  INTERNET_OPERATOR: 'internet_operator',
  SHIFT_SUPERVISOR: 'shift_supervisor',
  ACCOUNTANT: 'accountant',
};

const ROLE_HIERARCHY = {
  super_admin: 7,
  admin: 6,
  manager: 5,
  shift_supervisor: 4,
  accountant: 3,
  cashier: 2,
  internet_operator: 1,
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Access denied');
    if (allowedRoles.includes(req.user.role)) return next();
    return forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
  };
};

const authorizeMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Access denied');
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel >= minLevel) return next();
    return forbidden(res, 'Insufficient permissions');
  };
};

const isSelf = (paramField = 'id') => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Access denied');
    const isAdmin = ['super_admin', 'admin', 'manager'].includes(req.user.role);
    if (isAdmin || req.user.id === req.params[paramField]) return next();
    return forbidden(res, 'You can only access your own data');
  };
};

module.exports = { authorize, authorizeMinRole, isSelf, ROLES };
