require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    const branchResult = await query(`
      INSERT INTO branches (name, address, phone, email)
      VALUES ('Main Branch', 'Nairobi, Kenya', '0703445756', 'helvinotechltd@gmail.com')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    let branchId;
    if (branchResult.rows.length > 0) {
      branchId = branchResult.rows[0].id;
    } else {
      const b = await query('SELECT id FROM branches LIMIT 1');
      branchId = b.rows[0].id;
    }

    const password = process.env.ADMIN_PASSWORD || 'HelvinoAdmin@2024!';
    const hash = await bcrypt.hash(password, 12);

    await query(`
      INSERT INTO employees (branch_id, name, email, phone, role, password_hash)
      VALUES ($1, 'Super Admin', 'admin@helvino.org', '0703445756', 'super_admin', $2)
      ON CONFLICT (email) DO NOTHING
    `, [branchId, hash]);

    await query(`
      INSERT INTO categories (name, category_type) VALUES
      ('Books', 'product'),
      ('Stationery', 'product'),
      ('School Supplies', 'product'),
      ('Computer Accessories', 'product'),
      ('Internet Services', 'service'),
      ('Printing Services', 'service'),
      ('Scanning Services', 'service'),
      ('Typing Services', 'service'),
      ('Lamination Services', 'service'),
      ('Binding Services', 'service')
      ON CONFLICT DO NOTHING
    `);

    await query(`
      INSERT INTO services (branch_id, name, service_type, rate, rate_unit, b_and_w_rate, color_rate)
      VALUES
      ($1, 'Internet Browsing', 'internet', 30.00, 'per_hour', NULL, NULL),
      ($1, 'Printing B&W', 'printing', 3.00, 'per_page', 3.00, NULL),
      ($1, 'Printing Color', 'printing', 10.00, 'per_page', NULL, 10.00),
      ($1, 'Scanning', 'scanning', 20.00, 'per_page', NULL, NULL),
      ($1, 'Typing Per Page', 'typing', 50.00, 'per_page', NULL, NULL),
      ($1, 'Lamination A4', 'lamination', 50.00, 'per_job', NULL, NULL),
      ($1, 'Photocopy B&W', 'photocopy', 3.00, 'per_page', 3.00, NULL),
      ($1, 'Book Binding', 'binding', 100.00, 'per_job', NULL, NULL)
      ON CONFLICT DO NOTHING
    `, [branchId]);

    await query(`
      INSERT INTO settings (branch_id, key, value, description) VALUES
      ($1, 'currency', 'KES', 'Default currency'),
      ($1, 'tax_rate', '16', 'VAT rate percentage'),
      ($1, 'loyalty_points_per_shilling', '1', 'Points earned per shilling spent'),
      ($1, 'loyalty_redemption_rate', '100', 'Shillings value per 100 points'),
      ($1, 'receipt_footer', 'Thank you for visiting Helvino! Contact: 0703445756', 'Receipt footer text'),
      ($1, 'internet_rate_per_hour', '30', 'Default internet rate per hour (KES)'),
      ($1, 'credit_interest_rate', '0', 'Monthly credit interest rate'),
      ($1, 'shop_name', 'Helvino Cyber & Bookshop', 'Business name'),
      ($1, 'shop_address', 'Nairobi, Kenya', 'Business address'),
      ($1, 'shop_phone', '0703445756', 'Business phone')
      ON CONFLICT (branch_id, key) DO NOTHING
    `, [branchId]);

    logger.info('✅ Seed completed successfully');
    logger.info(`📧 Admin email: admin@helvino.org`);
    logger.info(`🔑 Admin password: ${password}`);
  } catch (err) {
    logger.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedAdmin();
