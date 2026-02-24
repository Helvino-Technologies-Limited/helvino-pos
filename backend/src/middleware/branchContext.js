/**
 * For super_admin: if request contains X-Branch-ID header,
 * override req.user.branch_id so all queries filter correctly.
 * Regular users always use their own branch_id — cannot override.
 */
const branchContext = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    const headerBranch = req.headers['x-branch-id'];
    if (headerBranch && headerBranch !== 'null' && headerBranch !== 'undefined') {
      req.user.branch_id = headerBranch;
      req.user.branch_overridden = true;
    } else {
      // super_admin with no branch = sees all (null = no filter)
      req.user.branch_id = null;
    }
  }
  next();
};

module.exports = { branchContext };
