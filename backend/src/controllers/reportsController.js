const { query } = require('../config/db');
const { success } = require('../utils/response');

const getProfitAndLoss = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = end_date || new Date().toISOString().slice(0,10);
  const branchId = req.user.branch_id;
  const bFilter = branchId ? 'AND branch_id = $3' : '';
  const params = branchId ? [from, to, branchId] : [from, to];

  const [salesResult, cogsResult, expensesResult] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total),0) as gross_revenue,
              COALESCE(SUM(discount_amount),0) as total_discounts
       FROM sales WHERE DATE(created_at) BETWEEN $1 AND $2 AND payment_status != 'cancelled' ${bFilter}`,
      params
    ),
    query(
      `SELECT COALESCE(SUM(si.cost_price * si.quantity),0) as cogs
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE DATE(s.created_at) BETWEEN $1 AND $2 AND s.payment_status != 'cancelled'
       AND si.item_type = 'product' ${bFilter.replace('branch_id','s.branch_id')}`,
      params
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) as total_expenses,
              category, SUM(amount) as category_total
       FROM expenses WHERE expense_date BETWEEN $1 AND $2 ${bFilter}
       GROUP BY ROLLUP(category)`,
      params
    ),
  ]);

  const grossRevenue = parseFloat(salesResult.rows[0].gross_revenue);
  const discounts = parseFloat(salesResult.rows[0].total_discounts);
  const cogs = parseFloat(cogsResult.rows[0].cogs);
  const expenseRows = expensesResult.rows.filter(r => r.category !== null);
  const totalExpenses = expensesResult.rows.find(r => r.category === null);
  const expenses = parseFloat(totalExpenses?.total_expenses || 0);

  const netRevenue = grossRevenue - discounts;
  const grossProfit = netRevenue - cogs;
  const netProfit = grossProfit - expenses;

  return success(res, {
    period: { from, to },
    revenue: {
      gross: grossRevenue,
      discounts,
      net: netRevenue,
    },
    cost_of_goods_sold: cogs,
    gross_profit: grossProfit,
    gross_margin: netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(2) : 0,
    expenses: {
      total: expenses,
      by_category: expenseRows,
    },
    net_profit: netProfit,
    net_margin: netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(2) : 0,
  });
};

const getTopProducts = async (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = end_date || new Date().toISOString().slice(0,10);
  const branchId = req.user.branch_id;

  const result = await query(
    `SELECT si.name, si.product_id, si.sku,
            SUM(si.quantity) as units_sold,
            SUM(si.total_price) as revenue,
            SUM(si.total_price - (si.cost_price * si.quantity)) as profit
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE DATE(s.created_at) BETWEEN $1 AND $2
     AND s.payment_status != 'cancelled'
     AND si.item_type = 'product'
     ${branchId ? 'AND s.branch_id = $3' : ''}
     GROUP BY si.name, si.product_id, si.sku
     ORDER BY revenue DESC
     LIMIT ${parseInt(limit)}`,
    branchId ? [from, to, branchId] : [from, to]
  );
  return success(res, result.rows);
};

const getTopServices = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = end_date || new Date().toISOString().slice(0,10);
  const branchId = req.user.branch_id;

  const result = await query(
    `SELECT si.name, si.service_id,
            SUM(si.quantity) as usage_count,
            SUM(si.total_price) as revenue
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE DATE(s.created_at) BETWEEN $1 AND $2
     AND s.payment_status != 'cancelled'
     AND si.item_type = 'service'
     ${branchId ? 'AND s.branch_id = $3' : ''}
     GROUP BY si.name, si.service_id
     ORDER BY revenue DESC`,
    branchId ? [from, to, branchId] : [from, to]
  );
  return success(res, result.rows);
};

const getInternetUsageReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  const from = start_date || new Date().toISOString().slice(0,10);
  const to = end_date || new Date().toISOString().slice(0,10);
  const branchId = req.user.branch_id;

  const result = await query(
    `SELECT
       COUNT(*) as total_sessions,
       SUM(actual_duration_minutes) as total_minutes,
       COALESCE(SUM(cost),0) as total_revenue,
       COALESCE(SUM(paid_amount),0) as collected,
       AVG(actual_duration_minutes) as avg_session_minutes,
       COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_sessions
     FROM internet_sessions
     WHERE DATE(created_at) BETWEEN $1 AND $2 AND status != 'active'
     ${branchId ? 'AND branch_id = $3' : ''}`,
    branchId ? [from, to, branchId] : [from, to]
  );

  const hourly = await query(
    `SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as sessions
     FROM internet_sessions
     WHERE DATE(created_at) BETWEEN $1 AND $2
     ${branchId ? 'AND branch_id = $3' : ''}
     GROUP BY hour ORDER BY hour`,
    branchId ? [from, to, branchId] : [from, to]
  );

  return success(res, { summary: result.rows[0], hourly_distribution: hourly.rows });
};

const getStockReport = async (req, res) => {
  const branchId = req.user.branch_id;
  const result = await query(
    `SELECT p.*, c.name as category_name,
            (p.quantity * p.cost_price) as stock_value,
            (p.quantity * p.selling_price) as retail_value,
            CASE
              WHEN p.quantity = 0 THEN 'out_of_stock'
              WHEN p.quantity <= p.reorder_level THEN 'low_stock'
              ELSE 'in_stock'
            END as stock_status
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true ${branchId ? 'AND p.branch_id = $1' : ''}
     ORDER BY p.name`,
    branchId ? [branchId] : []
  );

  const summary = {
    total_products: result.rows.length,
    out_of_stock: result.rows.filter(p => p.stock_status === 'out_of_stock').length,
    low_stock: result.rows.filter(p => p.stock_status === 'low_stock').length,
    total_stock_value: result.rows.reduce((sum, p) => sum + parseFloat(p.stock_value), 0),
    total_retail_value: result.rows.reduce((sum, p) => sum + parseFloat(p.retail_value), 0),
  };

  return success(res, { summary, products: result.rows });
};

module.exports = { getProfitAndLoss, getTopProducts, getTopServices, getInternetUsageReport, getStockReport };
