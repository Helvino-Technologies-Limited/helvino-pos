const { query } = require('../config/db');
const { success } = require('../utils/response');

// Resolve which branch to query:
// - super_admin can pass ?branch_id=X or ?branch_id=all
// - everyone else is locked to their own branch
const resolveBranch = (req) => {
  const isSuperAdmin = req.user.role === 'super_admin';
  const requested = req.query.branch_id;
  if (isSuperAdmin && requested === 'all') return null;        // no filter
  if (isSuperAdmin && requested)           return requested;   // specific branch
  return req.user.branch_id;                                   // own branch
};

const branchFilter = (branchId, alias = '') => {
  if (!branchId) return { sql: '', params: [] };
  const col = alias ? `${alias}.branch_id` : 'branch_id';
  return { sql: `AND ${col} = ?`, params: [branchId] };
};

// Replace ? placeholders with $N starting at offset
const parameterise = (sql, params, offset = 1) => {
  let i = offset;
  return { sql: sql.replace(/\?/g, () => `$${i++}`), params };
};

const getProfitAndLoss = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to   = end_date   || new Date().toISOString().slice(0,10);
  const branchId = resolveBranch(req);

  const bf  = branchFilter(branchId);
  const bfs = branchFilter(branchId, 's');

  const baseParams = [from, to];

  const { sql: bfSql, params: bfParams }   = parameterise(bf.sql,  bf.params,  3);
  const { sql: bfsSql, params: bfsParams } = parameterise(bfs.sql, bfs.params, 3);

  const [salesResult, cogsResult, expensesResult] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total),0) as gross_revenue,
              COALESCE(SUM(discount_amount),0) as total_discounts
       FROM sales WHERE DATE(created_at) BETWEEN $1 AND $2
       AND payment_status != 'cancelled' ${bfSql}`,
      [...baseParams, ...bfParams]
    ),
    query(
      `SELECT COALESCE(SUM(si.cost_price * si.quantity),0) as cogs
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE DATE(s.created_at) BETWEEN $1 AND $2
       AND s.payment_status != 'cancelled'
       AND si.item_type = 'product' ${bfsSql}`,
      [...baseParams, ...bfsParams]
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) as total_expenses,
              category, SUM(amount) as category_total
       FROM expenses WHERE expense_date BETWEEN $1 AND $2 ${bfSql}
       GROUP BY ROLLUP(category)`,
      [...baseParams, ...bfParams]
    ),
  ]);

  const grossRevenue = parseFloat(salesResult.rows[0].gross_revenue);
  const discounts    = parseFloat(salesResult.rows[0].total_discounts);
  const cogs         = parseFloat(cogsResult.rows[0].cogs);
  const expenseRows  = expensesResult.rows.filter(r => r.category !== null);
  const totalExpRow  = expensesResult.rows.find(r => r.category === null);
  const expenses     = parseFloat(totalExpRow?.total_expenses || 0);
  const netRevenue   = grossRevenue - discounts;
  const grossProfit  = netRevenue - cogs;
  const netProfit    = grossProfit - expenses;

  return success(res, {
    period: { from, to },
    branch_id: branchId || 'all',
    revenue: { gross: grossRevenue, discounts, net: netRevenue },
    cost_of_goods_sold: cogs,
    gross_profit: grossProfit,
    gross_margin: netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(2) : 0,
    expenses: { total: expenses, by_category: expenseRows },
    net_profit: netProfit,
    net_margin: netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(2) : 0,
  });
};

const getTopProducts = async (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to   = end_date   || new Date().toISOString().slice(0,10);
  const branchId = resolveBranch(req);
  const { sql, params } = parameterise(branchFilter(branchId, 's').sql, branchFilter(branchId, 's').params, 3);

  const result = await query(
    `SELECT si.name, si.product_id, si.sku,
            SUM(si.quantity) as units_sold,
            SUM(si.total_price) as revenue,
            SUM(si.total_price - (si.cost_price * si.quantity)) as profit
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE DATE(s.created_at) BETWEEN $1 AND $2
     AND s.payment_status != 'cancelled'
     AND si.item_type = 'product' ${sql}
     GROUP BY si.name, si.product_id, si.sku
     ORDER BY revenue DESC LIMIT ${parseInt(limit)}`,
    [from, to, ...params]
  );
  return success(res, result.rows);
};

const getTopServices = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to   = end_date   || new Date().toISOString().slice(0,10);
  const branchId = resolveBranch(req);
  const { sql, params } = parameterise(branchFilter(branchId, 's').sql, branchFilter(branchId, 's').params, 3);

  const result = await query(
    `SELECT si.name, si.service_id,
            SUM(si.quantity) as usage_count,
            SUM(si.total_price) as revenue
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE DATE(s.created_at) BETWEEN $1 AND $2
     AND s.payment_status != 'cancelled'
     AND si.item_type = 'service' ${sql}
     GROUP BY si.name, si.service_id
     ORDER BY revenue DESC`,
    [from, to, ...params]
  );
  return success(res, result.rows);
};

const getInternetUsageReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date().toISOString().slice(0,10);
  const to   = end_date   || new Date().toISOString().slice(0,10);
  const branchId = resolveBranch(req);
  const { sql, params } = parameterise(branchFilter(branchId).sql, branchFilter(branchId).params, 3);

  const [summary, hourly] = await Promise.all([
    query(
      `SELECT COUNT(*) as total_sessions,
              SUM(actual_duration_minutes) as total_minutes,
              COALESCE(SUM(cost),0) as total_revenue,
              COALESCE(SUM(paid_amount),0) as collected,
              AVG(actual_duration_minutes) as avg_session_minutes,
              COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_sessions
       FROM internet_sessions
       WHERE DATE(created_at) BETWEEN $1 AND $2 AND status != 'active' ${sql}`,
      [from, to, ...params]
    ),
    query(
      `SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as sessions
       FROM internet_sessions
       WHERE DATE(created_at) BETWEEN $1 AND $2 ${sql}
       GROUP BY hour ORDER BY hour`,
      [from, to, ...params]
    ),
  ]);

  return success(res, { summary: summary.rows[0], hourly_distribution: hourly.rows });
};

const getStockReport = async (req, res) => {
  const branchId = resolveBranch(req);
  const { sql, params } = parameterise(branchFilter(branchId).sql, branchFilter(branchId).params, 1);

  const result = await query(
    `SELECT p.id, p.name, p.sku, p.quantity, p.reorder_level,
            p.cost_price, p.selling_price, p.branch_id,
            b.name as branch_name,
            c.name as category_name,
            (p.quantity * p.cost_price) as stock_value,
            (p.quantity * p.selling_price) as retail_value,
            CASE
              WHEN p.quantity = 0              THEN 'out_of_stock'
              WHEN p.quantity <= p.reorder_level THEN 'low_stock'
              ELSE 'in_stock'
            END as stock_status
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN branches b   ON p.branch_id   = b.id
     WHERE p.is_active = true ${sql}
     ORDER BY b.name, p.name`,
    params
  );

  const summary = {
    total_products:    result.rows.length,
    out_of_stock:      result.rows.filter(p => p.stock_status === 'out_of_stock').length,
    low_stock:         result.rows.filter(p => p.stock_status === 'low_stock').length,
    total_stock_value: result.rows.reduce((s, p) => s + parseFloat(p.stock_value), 0),
    total_retail_value:result.rows.reduce((s, p) => s + parseFloat(p.retail_value), 0),
  };

  return success(res, { summary, products: result.rows });
};

// New: cross-branch comparison for super_admin
const getBranchComparison = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to   = end_date   || new Date().toISOString().slice(0,10);

  const result = await query(
    `SELECT
       b.id, b.name as branch_name, b.town,
       COUNT(DISTINCT s.id) as total_sales,
       COALESCE(SUM(s.total),0) as revenue,
       COALESCE(SUM(s.discount_amount),0) as discounts,
       COUNT(DISTINCT CASE WHEN s.payment_method = 'mpesa' THEN s.id END) as mpesa_sales,
       COUNT(DISTINCT CASE WHEN s.payment_method = 'cash'  THEN s.id END) as cash_sales,
       (SELECT COUNT(*) FROM products p WHERE p.branch_id = b.id AND p.is_active = true) as products,
       (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id AND e.is_active = true) as employees,
       (SELECT COALESCE(SUM(cost),0) FROM internet_sessions i
        WHERE i.branch_id = b.id AND DATE(i.created_at) BETWEEN $1 AND $2) as internet_revenue
     FROM branches b
     LEFT JOIN sales s ON s.branch_id = b.id
       AND DATE(s.created_at) BETWEEN $1 AND $2
       AND s.payment_status != 'cancelled'
     WHERE b.is_active = true
     GROUP BY b.id, b.name, b.town
     ORDER BY revenue DESC`,
    [from, to]
  );

  return success(res, { period: { from, to }, branches: result.rows });
};

module.exports = {
  getProfitAndLoss, getTopProducts, getTopServices,
  getInternetUsageReport, getStockReport, getBranchComparison,
};
