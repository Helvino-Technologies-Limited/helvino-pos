const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { success } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');

const nullify = (val) => (val === '' || val === undefined ? null : val);

router.use(authenticate);

// GET all settings for this branch
router.get('/', async (req, res) => {
  const branchId = req.user.branch_id;

  // Get branch info
  const branch = await query(
    `SELECT * FROM branches WHERE id = $1`,
    [branchId]
  );

  // Get or create settings record
  let settings = await query(
    `SELECT * FROM business_settings WHERE branch_id = $1`,
    [branchId]
  );

  if (!settings.rows.length) {
    settings = await query(
      `INSERT INTO business_settings (branch_id) VALUES ($1) RETURNING *`,
      [branchId]
    );
  }

  return success(res, {
    branch: branch.rows[0] || {},
    settings: settings.rows[0],
  });
});

// UPDATE business info
router.put('/business', authorizeMinRole('admin'), async (req, res) => {
  const {
    name, address, phone, email, website, county, town
  } = req.body;

  const updates = [];
  const params = [];
  let i = 1;

  if (name)    { updates.push(`name = $${i++}`);    params.push(name); }
  if (address) { updates.push(`address = $${i++}`); params.push(address); }
  if (phone)   { updates.push(`phone = $${i++}`);   params.push(phone); }
  if (email !== undefined)   { updates.push(`email = $${i++}`);   params.push(nullify(email)); }
  if (website !== undefined) { updates.push(`website = $${i++}`); params.push(nullify(website)); }
  if (county !== undefined)  { updates.push(`county = $${i++}`);  params.push(nullify(county)); }
  if (town !== undefined)    { updates.push(`town = $${i++}`);    params.push(nullify(town)); }

  if (!updates.length) {
    const branch = await query(`SELECT * FROM branches WHERE id = $1`, [req.user.branch_id]);
    return success(res, branch.rows[0]);
  }

  params.push(req.user.branch_id);
  const result = await query(
    `UPDATE branches SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    params
  );
  return success(res, result.rows[0], 'Business info updated');
});

// UPDATE receipt settings
router.put('/receipt', authorizeMinRole('admin'), async (req, res) => {
  const {
    receipt_header, receipt_footer, receipt_show_logo,
    receipt_show_address, receipt_show_phone, receipt_show_email,
    receipt_show_website, receipt_width, receipt_copies,
    currency_symbol, tax_rate, tax_name, tax_inclusive
  } = req.body;

  const branchId = req.user.branch_id;

  // Upsert settings
  const result = await query(
    `INSERT INTO business_settings (
      branch_id, receipt_header, receipt_footer, receipt_show_logo,
      receipt_show_address, receipt_show_phone, receipt_show_email,
      receipt_show_website, receipt_width, receipt_copies,
      currency_symbol, tax_rate, tax_name, tax_inclusive
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (branch_id) DO UPDATE SET
      receipt_header      = EXCLUDED.receipt_header,
      receipt_footer      = EXCLUDED.receipt_footer,
      receipt_show_logo   = EXCLUDED.receipt_show_logo,
      receipt_show_address = EXCLUDED.receipt_show_address,
      receipt_show_phone  = EXCLUDED.receipt_show_phone,
      receipt_show_email  = EXCLUDED.receipt_show_email,
      receipt_show_website = EXCLUDED.receipt_show_website,
      receipt_width       = EXCLUDED.receipt_width,
      receipt_copies      = EXCLUDED.receipt_copies,
      currency_symbol     = EXCLUDED.currency_symbol,
      tax_rate            = EXCLUDED.tax_rate,
      tax_name            = EXCLUDED.tax_name,
      tax_inclusive       = EXCLUDED.tax_inclusive,
      updated_at          = NOW()
    RETURNING *`,
    [
      branchId,
      nullify(receipt_header),
      nullify(receipt_footer),
      receipt_show_logo   ?? true,
      receipt_show_address ?? true,
      receipt_show_phone  ?? true,
      receipt_show_email  ?? false,
      receipt_show_website ?? false,
      receipt_width  || 80,
      receipt_copies || 1,
      nullify(currency_symbol) || 'KES',
      tax_rate  ?? 0,
      nullify(tax_name) || 'VAT',
      tax_inclusive ?? false,
    ]
  );
  return success(res, result.rows[0], 'Receipt settings updated');
});

module.exports = router;
