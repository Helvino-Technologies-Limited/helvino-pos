const { query } = require('../config/db');
const { success, created, notFound, badRequest, paginated } = require('../utils/response');
const { getPaginationParams, buildPagination, sanitizePhone } = require('../utils/helpers');

const getCustomers = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, customer_group, is_student, is_active = 'true' } = req.query;

  let conditions = ['1=1'];
  let params = [];
  let i = 1;

  if (req.user.branch_id) { conditions.push(`branch_id = $${i++}`); params.push(req.user.branch_id); }
  if (search) {
    conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }
  if (customer_group) { conditions.push(`customer_group = $${i++}`); params.push(customer_group); }
  if (is_student !== undefined) { conditions.push(`is_student = $${i++}`); params.push(is_student === 'true'); }
  if (is_active !== 'all') { conditions.push(`is_active = $${i++}`); params.push(is_active === 'true'); }

  const where = conditions.join(' AND ');
  const countResult = await query(`SELECT COUNT(*) FROM customers WHERE ${where}`, params);
  const result = await query(
    `SELECT * FROM customers WHERE ${where} ORDER BY name ASC LIMIT $${i} OFFSET $${i+1}`,
    [...params, limit, offset]
  );

  return paginated(res, result.rows, buildPagination(countResult.rows[0].count, page, limit));
};

const getCustomer = async (req, res) => {
  const result = await query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return notFound(res, 'Customer not found');

  const transactions = await query(
    'SELECT * FROM customer_transactions WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20',
    [req.params.id]
  );

  return success(res, { ...result.rows[0], recent_transactions: transactions.rows });
};

const createCustomer = async (req, res) => {
  const {
    name, phone, email, id_number, address,
    is_student = false, institution, customer_group = 'walk_in',
    credit_limit = 0, notes
  } = req.body;

  const cleanPhone = sanitizePhone(phone);

  const result = await query(
    `INSERT INTO customers
     (branch_id, name, phone, email, id_number, address, is_student, institution, customer_group, credit_limit, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [req.user.branch_id, name, cleanPhone, email, id_number, address, is_student, institution, customer_group, credit_limit, notes]
  );
  return created(res, result.rows[0], 'Customer created');
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const fields = ['name','phone','email','id_number','address','is_student','institution','customer_group','credit_limit','is_active','notes'];

  const updates = [];
  const params = [];
  let i = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      const val = field === 'phone' ? sanitizePhone(req.body[field]) : req.body[field];
      updates.push(`${field} = $${i++}`);
      params.push(val);
    }
  });

  if (!updates.length) return badRequest(res, 'No fields to update');
  params.push(id);

  const result = await query(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params
  );
  if (!result.rows.length) return notFound(res, 'Customer not found');
  return success(res, result.rows[0], 'Customer updated');
};

const topUpAccount = async (req, res) => {
  const { id } = req.params;
  const { amount, description, reference } = req.body;

  const customer = await query('SELECT * FROM customers WHERE id = $1', [id]);
  if (!customer.rows.length) return notFound(res, 'Customer not found');

  const c = customer.rows[0];
  const newBalance = parseFloat(c.account_balance) + parseFloat(amount);

  await query('UPDATE customers SET account_balance = $1 WHERE id = $2', [newBalance, id]);
  await query(
    `INSERT INTO customer_transactions
     (customer_id, employee_id, transaction_type, amount, balance_before, balance_after, description, reference)
     VALUES ($1,$2,'credit',$3,$4,$5,$6,$7)`,
    [id, req.user.id, amount, c.account_balance, newBalance, description || 'Account top-up', reference]
  );

  return success(res, { balance: newBalance }, 'Account topped up');
};

const getCustomerStatement = async (req, res) => {
  const { start_date, end_date } = req.query;
  let conditions = ['customer_id = $1'];
  let params = [req.params.id];
  let i = 2;

  if (start_date) { conditions.push(`created_at >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`created_at <= $${i++}`); params.push(end_date + ' 23:59:59'); }

  const result = await query(
    `SELECT ct.*, e.name as employee_name FROM customer_transactions ct
     LEFT JOIN employees e ON ct.employee_id = e.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ct.created_at DESC`,
    params
  );
  return success(res, result.rows);
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, topUpAccount, getCustomerStatement };
