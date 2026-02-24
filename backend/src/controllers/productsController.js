const { query, transaction } = require('../config/db');
const { success, created, notFound, badRequest, paginated } = require('../utils/response');
const { getPaginationParams, buildPagination, generateSKU } = require('../utils/helpers');

const getProducts = async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, category_id, supplier_id, low_stock, is_active = 'true' } = req.query;

  let conditions = ['1=1'];
  let params = [];
  let paramIndex = 1;

  if (req.user.branch_id) {
    conditions.push(`p.branch_id = $${paramIndex++}`);
    params.push(req.user.branch_id);
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (category_id) {
    conditions.push(`p.category_id = $${paramIndex++}`);
    params.push(category_id);
  }
  if (supplier_id) {
    conditions.push(`p.supplier_id = $${paramIndex++}`);
    params.push(supplier_id);
  }
  if (low_stock === 'true') {
    conditions.push(`p.quantity <= p.reorder_level`);
  }
  if (is_active !== 'all') {
    conditions.push(`p.is_active = $${paramIndex++}`);
    params.push(is_active === 'true');
  }

  const where = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM products p WHERE ${where}`,
    params
  );

  const result = await query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE ${where}
     ORDER BY p.name ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return paginated(
    res,
    result.rows,
    buildPagination(countResult.rows[0].count, page, limit)
  );
};

const getProduct = async (req, res) => {
  const result = await query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (!result.rows.length) return notFound(res, 'Product not found');
  return success(res, result.rows[0]);
};

// Convert empty string to null for UUID/optional fields
const nullify = (val) => (val === '' || val === undefined ? null : val);

const createProduct = async (req, res) => {
  const {
    category_id, supplier_id, sku, barcode, name, description,
    unit_of_measure = 'piece', cost_price, selling_price, student_price,
    quantity = 0, reorder_level = 5, max_stock, notes
  } = req.body;

  if (!name) return badRequest(res, 'Product name is required');
  if (!selling_price) return badRequest(res, 'Selling price is required');

  const generatedSKU = nullify(sku) || generateSKU(name.substring(0, 3));

  const result = await query(
    `INSERT INTO products (
      branch_id, category_id, supplier_id, sku, barcode, name, description,
      unit_of_measure, cost_price, selling_price, student_price,
      quantity, reorder_level, max_stock, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      req.user.branch_id,
      nullify(category_id),
      nullify(supplier_id),
      generatedSKU,
      nullify(barcode),
      name,
      nullify(description),
      unit_of_measure,
      cost_price || 0,
      selling_price,
      nullify(student_price),
      quantity || 0,
      reorder_level || 5,
      nullify(max_stock),
      nullify(notes)
    ]
  );

  return created(res, result.rows[0], 'Product created successfully');
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const fields = [
    'category_id', 'supplier_id', 'barcode', 'name', 'description',
    'unit_of_measure', 'cost_price', 'selling_price', 'student_price',
    'reorder_level', 'max_stock', 'is_active', 'notes'
  ];

  // UUID fields that must be nullified
  const uuidFields = ['category_id', 'supplier_id'];

  const updates = [];
  const params = [];
  let i = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      const val = req.body[field];
      params.push(uuidFields.includes(field) ? nullify(val) : val);
    }
  });

  if (!updates.length) return badRequest(res, 'No fields to update');

  params.push(id);
  const result = await query(
    `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
    params
  );

  if (!result.rows.length) return notFound(res, 'Product not found');
  return success(res, result.rows[0], 'Product updated');
};

const adjustStock = async (req, res) => {
  const { id } = req.params;
  const { adjustment_type, quantity, reason, reference } = req.body;

  const result = await transaction(async (client) => {
    const prod = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
    if (!prod.rows.length) throw { statusCode: 404, message: 'Product not found', isOperational: true };

    const product = prod.rows[0];
    let newQty;
    const adjQty = parseInt(quantity);

    if (['add', 'return'].includes(adjustment_type)) {
      newQty = product.quantity + adjQty;
    } else if (['remove', 'damage'].includes(adjustment_type)) {
      if (product.quantity < adjQty) throw { statusCode: 400, message: 'Insufficient stock', isOperational: true };
      newQty = product.quantity - adjQty;
    } else {
      newQty = adjQty;
    }

    await client.query('UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQty, id]);

    await client.query(
      `INSERT INTO stock_adjustments
       (branch_id, product_id, employee_id, adjustment_type, quantity_before, quantity_adjusted, quantity_after, reason, reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.user.branch_id, id, req.user.id, adjustment_type, product.quantity, adjQty, newQty, reason, nullify(reference)]
    );

    return { product_id: id, quantity_before: product.quantity, quantity_after: newQty };
  });

  return success(res, result, 'Stock adjusted successfully');
};

const getLowStockProducts = async (req, res) => {
  const result = await query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.quantity <= p.reorder_level AND p.is_active = true
     ${req.user.branch_id ? 'AND p.branch_id = $1' : ''}
     ORDER BY (p.quantity - p.reorder_level) ASC`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  return success(res, result.rows);
};

const getProductByBarcode = async (req, res) => {
  const result = await query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE (p.barcode = $1 OR p.sku = $1) AND p.is_active = true`,
    [req.params.code]
  );
  if (!result.rows.length) return notFound(res, 'Product not found');
  return success(res, result.rows[0]);
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, adjustStock, getLowStockProducts, getProductByBarcode };
