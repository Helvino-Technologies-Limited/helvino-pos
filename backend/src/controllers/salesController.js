const { query, transaction } = require('../config/db');
const { success, created, notFound, badRequest, paginated } = require('../utils/response');
const { getPaginationParams, buildPagination, generateReceiptNumber } = require('../utils/helpers');

const createSale = async (req, res) => {
  const {
    customer_id, items, payment_method, paid_amount,
    mpesa_ref, mpesa_amount = 0, cash_amount = 0, card_amount = 0,
    discount_amount = 0, discount_type, notes
  } = req.body;

  if (!items || items.length === 0) return badRequest(res, 'Sale must have at least one item');

  const result = await transaction(async (client) => {
    let subtotal = 0;

    const processedItems = [];
    for (const item of items) {
      let unitPrice = parseFloat(item.unit_price);
      let itemDiscount = parseFloat(item.discount_amount || 0);
      let totalPrice = (unitPrice * parseFloat(item.quantity)) - itemDiscount;
      subtotal += totalPrice;

      if (item.item_type === 'product' && item.product_id) {
        const prod = await client.query(
          'SELECT quantity, selling_price, student_price, cost_price, name, sku FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );
        if (!prod.rows.length) throw { statusCode: 404, message: `Product ${item.product_id} not found`, isOperational: true };
        if (prod.rows[0].quantity < item.quantity) {
          throw { statusCode: 400, message: `Insufficient stock for ${prod.rows[0].name}`, isOperational: true };
        }

        await client.query(
          'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        processedItems.push({
          ...item,
          cost_price: prod.rows[0].cost_price,
          name: item.name || prod.rows[0].name,
          sku: prod.rows[0].sku,
          total_price: totalPrice,
        });
      } else {
        processedItems.push({ ...item, total_price: totalPrice });
      }
    }

    const total = subtotal - parseFloat(discount_amount);
    const balanceDue = Math.max(0, total - parseFloat(paid_amount));
    const changeGiven = Math.max(0, parseFloat(paid_amount) - total);
    const paymentStatus = balanceDue > 0 ? 'partial' : 'paid';

    const receiptNumber = generateReceiptNumber();

    let saleType = 'retail';
    const hasProducts = processedItems.some(i => i.item_type === 'product');
    const hasServices = processedItems.some(i => i.item_type === 'service');
    if (hasProducts && hasServices) saleType = 'mixed';
    else if (hasServices) saleType = 'service';

    const saleResult = await client.query(
      `INSERT INTO sales (
        branch_id, customer_id, employee_id, shift_id, receipt_number,
        sale_type, subtotal, discount_amount, discount_type, total,
        paid_amount, change_given, balance_due, payment_method, payment_status,
        mpesa_ref, mpesa_amount, cash_amount, card_amount, notes
      ) VALUES ($1,$2,$3,
        (SELECT id FROM shifts WHERE employee_id = $3 AND status = 'open' ORDER BY start_time DESC LIMIT 1),
        $4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        req.user.branch_id, customer_id, req.user.id,
        receiptNumber, saleType, subtotal, discount_amount, discount_type,
        total, paid_amount, changeGiven, balanceDue, payment_method,
        paymentStatus, mpesa_ref, mpesa_amount, cash_amount, card_amount, notes
      ]
    );

    const sale = saleResult.rows[0];

    for (const item of processedItems) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, service_id, item_type, name, sku, quantity, unit_price, discount_amount, total_price, cost_price, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          sale.id, item.product_id || null, item.service_id || null,
          item.item_type || 'product', item.name, item.sku || null,
          item.quantity, item.unit_price, item.discount_amount || 0,
          item.total_price, item.cost_price || 0, item.notes || null
        ]
      );
    }

    // Update shift totals
    await client.query(
      `UPDATE shifts SET
        total_sales = total_sales + $1,
        total_cash = total_cash + $2,
        total_mpesa = total_mpesa + $3,
        total_card = total_card + $4
       WHERE employee_id = $5 AND status = 'open'`,
      [total, cash_amount, mpesa_amount, card_amount, req.user.id]
    );

    // Update customer balance if credit
    if (customer_id && balanceDue > 0) {
      await client.query(
        'UPDATE customers SET account_balance = account_balance - $1 WHERE id = $2',
        [balanceDue, customer_id]
      );
    }

    return sale;
  });

  const fullSale = await query(
    `SELECT s.*, array_agg(row_to_json(si)) as items
     FROM sales s
     LEFT JOIN sale_items si ON s.id = si.sale_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [result.id]
  );

  return created(res, fullSale.rows[0], 'Sale completed successfully');
};

const getSales = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { start_date, end_date, payment_method, payment_status, customer_id } = req.query;

  let conditions = ['1=1'];
  let params = [];
  let i = 1;

  if (req.user.branch_id) {
    conditions.push(`s.branch_id = $${i++}`);
    params.push(req.user.branch_id);
  }
  if (start_date) { conditions.push(`s.created_at >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`s.created_at <= $${i++}`); params.push(end_date + ' 23:59:59'); }
  if (payment_method) { conditions.push(`s.payment_method = $${i++}`); params.push(payment_method); }
  if (payment_status) { conditions.push(`s.payment_status = $${i++}`); params.push(payment_status); }
  if (customer_id) { conditions.push(`s.customer_id = $${i++}`); params.push(customer_id); }

  const where = conditions.join(' AND ');
  const countResult = await query(`SELECT COUNT(*) FROM sales s WHERE ${where}`, params);

  const result = await query(
    `SELECT s.*, c.name as customer_name, e.name as cashier_name
     FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     WHERE ${where}
     ORDER BY s.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );

  return paginated(res, result.rows, buildPagination(countResult.rows[0].count, page, limit));
};

const getSale = async (req, res) => {
  const result = await query(
    `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
            e.name as cashier_name,
            json_agg(si.*) as items
     FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN employees e ON s.employee_id = e.id
     LEFT JOIN sale_items si ON s.id = si.sale_id
     WHERE s.id = $1 OR s.receipt_number = $1
     GROUP BY s.id, c.name, c.phone, e.name`,
    [req.params.id]
  );
  if (!result.rows.length) return notFound(res, 'Sale not found');
  return success(res, result.rows[0]);
};

const getDailySummary = async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0,10);
  const branchFilter = req.user.branch_id ? 'AND branch_id = $2' : '';
  const params = req.user.branch_id ? [date, req.user.branch_id] : [date];

  const result = await query(
    `SELECT
      COUNT(*) as total_transactions,
      SUM(total) as total_revenue,
      SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_revenue,
      SUM(CASE WHEN payment_method = 'mpesa' THEN total ELSE 0 END) as mpesa_revenue,
      SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_revenue,
      SUM(CASE WHEN payment_status = 'credit' THEN total ELSE 0 END) as credit_revenue,
      SUM(CASE WHEN sale_type = 'retail' THEN total ELSE 0 END) as retail_revenue,
      SUM(CASE WHEN sale_type = 'service' THEN total ELSE 0 END) as service_revenue,
      SUM(CASE WHEN sale_type = 'mixed' THEN total ELSE 0 END) as mixed_revenue
     FROM sales
     WHERE DATE(created_at) = $1 AND payment_status != 'cancelled' ${branchFilter}`,
    params
  );

  return success(res, result.rows[0]);
};

module.exports = { createSale, getSales, getSale, getDailySummary };
