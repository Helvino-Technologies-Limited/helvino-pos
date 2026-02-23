require('dotenv').config();
const { pool } = require('../config/db');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    logger.info('🚀 Running database migrations...');
    await client.query('BEGIN');

    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);

    await client.query('COMMIT');
    logger.info('✅ Migrations completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();
