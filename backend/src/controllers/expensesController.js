const { query } = require('../config/db');
const { success, created, notFound, badRequest, paginated } = require('../utils/response');
const { getPaginationParams, buildPagination } = require('../utils/helpers');

const getExpenses = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { start_date, end_date, category } = req.query;

  let conditions = ['1=1'];
  let params = [];
  let i = 1;

  if (req.user.branch_id) { conditions.push(`ex.branch_id = $${i++}`); params.push(req.user.branch_id); }
  if (start_date) { conditions.push(`ex.expense_date >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`ex.expense_date <= $${i++}`); params.push(end_date); }
  if (category) { conditions.push(`ex.category = $${i++}`); params.push(category); }

  const where = conditions.join(' AND ');
  const countResult = await query(`SELECT COUNT(*) FROM expenses ex WHERE ${where}`, params);
  const result = await query(
    `SELECT ex.*, e.name as employee_name FROM expenses ex
     LEFT JOIN employees e ON ex.employee_id = e.id
     WHERE ${where} ORDER BY ex.expense_date DESC, ex.created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );
  return paginated(res, result.rows, buildPagination(countResult.rows[0].count, page, limit));
};

const createExpense = async (req, res) => {
  const { category, description, amount, payment_method = 'cash', reference, expense_date, notes } = req.body;

  const result = await query(
    `INSERT INTO expenses (branch_id, employee_id, category, description, amount, payment_method, reference, expense_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      req.user.branch_id, req.user.id, category, description,
      amount, payment_method, reference, expense_date || new Date().toISOString().slice(0,10), notes
    ]
  );
  return created(res, result.rows[0], 'Expense recorded');
};

const updateExpense = async (req, res) => {
  const { id } = req.params;
  const fields = ['category','description','amount','payment_method','reference','expense_date','notes'];

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
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params
  );
  if (!result.rows.length) return notFound(res, 'Expense not found');
  return success(res, result.rows[0]);
};

const deleteExpense = async (req, res) => {
  const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return notFound(res, 'Expense not found');
  return success(res, {}, 'Expense deleted');
};

const getExpenseSummary = async (req, res) => {
  const { start_date, end_date } = req.query;
  const today = new Date().toISOString().slice(0,10);
  const from = start_date || today;
  const to = end_date || today;

  const result = await query(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM expenses
     WHERE expense_date BETWEEN $1 AND $2
     ${req.user.branch_id ? 'AND branch_id = $3' : ''}
     GROUP BY category ORDER BY total DESC`,
    req.user.branch_id ? [from, to, req.user.branch_id] : [from, to]
  );
  return success(res, result.rows);
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary };
