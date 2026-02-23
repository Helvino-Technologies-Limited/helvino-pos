const { Pool } = require('pg');
const { db: dbConfig, NODE_ENV } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  ...dbConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  if (NODE_ENV !== 'production') logger.info('📦 New DB client connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error:', err);
  process.exit(1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (NODE_ENV === 'development') {
      logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 80)}`);
    }
    return res;
  } catch (err) {
    logger.error(`DB Query Error: ${err.message} | Query: ${text.substring(0, 100)}`);
    throw err;
  }
};

const getClient = () => pool.connect();

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, transaction, pool };
