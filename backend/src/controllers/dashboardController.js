const { query } = require('../config/db');
const { success } = require('../utils/response');

const getDashboard = async (req, res) => {
  const branchId = req.user.branch_id;
  const branchFilter = branchId ? 'AND branch_id = $1' : '';
  const params = branchId ? [branchId] : [];

  const [
    todaySales,
    activeSessionsResult,
    lowStockResult,
    outstandingBalances,
    revenueByType,
    expensesToday,
    recentSales,
    openShift,
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total),0) as revenue, COUNT(*) as transactions
       FROM sales WHERE DATE(created_at) = CURRENT_DATE AND payment_status != 'cancelled' ${branchFilter}`,
      params
    ),
    query(
      `SELECT COUNT(*) as active_sessions,
              COALESCE(SUM(EXTRACT(EPOCH FROM (NOW() - start_time))/3600 * rate_per_hour), 0) as potential_revenue
       FROM internet_sessions WHERE status = 'active' ${branchFilter}`,
      params
    ),
    query(
      `SELECT COUNT(*) as count FROM products
       WHERE quantity <= reorder_level AND is_active = true ${branchFilter}`,
      params
    ),
    query(
      `SELECT COUNT(*) as customers_with_debt,
              COALESCE(SUM(ABS(account_balance)),0) as total_debt
       FROM customers WHERE account_balance < 0 AND is_active = true ${branchFilter}`,
      params
    ),
    query(
      `SELECT sale_type, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
       FROM sales WHERE DATE(created_at) = CURRENT_DATE AND payment_status != 'cancelled' ${branchFilter}
       GROUP BY sale_type`,
      params
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM expenses WHERE expense_date = CURRENT_DATE ${branchFilter}`,
      params
    ),
    query(
      `SELECT s.receipt_number, s.total, s.payment_method, s.created_at,
              c.name as customer_name, e.name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN employees e ON s.employee_id = e.id
       WHERE s.payment_status != 'cancelled' ${branchId ? 'AND s.branch_id = $1' : ''}
       ORDER BY s.created_at DESC LIMIT 10`,
      params
    ),
    branchId
      ? query(
          `SELECT sh.*, e.name as employee_name
           FROM shifts sh
           JOIN employees e ON sh.employee_id = e.id
           WHERE sh.status = 'open' AND sh.branch_id = $1 LIMIT 1`,
          params
        )
      : { rows: [] },
  ]);

  const revenueMap = {};
  revenueByType.rows.forEach(r => { revenueMap[r.sale_type] = r; });

  return success(res, {
    today: {
      revenue: parseFloat(todaySales.rows[0].revenue),
      transactions: parseInt(todaySales.rows[0].transactions),
      expenses: parseFloat(expensesToday.rows[0].total),
      net: parseFloat(todaySales.rows[0].revenue) - parseFloat(expensesToday.rows[0].total),
    },
    internet: {
      active_sessions: parseInt(activeSessionsResult.rows[0].active_sessions),
      potential_revenue: parseFloat(activeSessionsResult.rows[0].potential_revenue),
    },
    inventory: {
      low_stock_count: parseInt(lowStockResult.rows[0].count),
    },
    customers: {
      with_debt: parseInt(outstandingBalances.rows[0].customers_with_debt),
      total_debt: parseFloat(outstandingBalances.rows[0].total_debt),
    },
    revenue_by_type: revenueMap,
    recent_sales: recentSales.rows,
    open_shift: openShift.rows[0] || null,
  });
};

const getRevenueChart = async (req, res) => {
  const { period = '7days' } = req.query;
  const branchId = req.user.branch_id;

  let dateFilter;
  if (period === '7days') dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
  else if (period === '30days') dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
  else if (period === '12months') dateFilter = "created_at >= NOW() - INTERVAL '12 months'";
  else dateFilter = "created_at >= NOW() - INTERVAL '7 days'";

  const groupBy = period === '12months' ? "DATE_TRUNC('month', created_at)" : "DATE(created_at)";

  const result = await query(
    `SELECT ${groupBy} as period,
            COALESCE(SUM(total),0) as revenue,
            COUNT(*) as transactions
     FROM sales
     WHERE ${dateFilter} AND payment_status != 'cancelled'
     ${branchId ? 'AND branch_id = $1' : ''}
     GROUP BY ${groupBy}
     ORDER BY period ASC`,
    branchId ? [branchId] : []
  );

  return success(res, result.rows);
};

module.exports = { getDashboard, getRevenueChart };
