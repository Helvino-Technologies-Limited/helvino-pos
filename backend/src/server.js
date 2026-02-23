require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { PORT, frontendUrl, rateLimit: rateLimitConfig, NODE_ENV } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/db');

// Ensure logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const app = express();

// ============================
// SECURITY MIDDLEWARE
// ============================
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
}));

app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));

app.use(rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: { status: 'error', message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit on auth endpoints
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many login attempts. Try again in 15 minutes.' },
}));

// ============================
// GENERAL MIDDLEWARE
// ============================
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ============================
// ROUTES
// ============================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'Helvino POS API',
      version: '1.0.0',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/internet',   require('./routes/internet'));
app.use('/api/computers',  require('./routes/computers'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/shifts',     require('./routes/shifts'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/services',   require('./routes/services'));
app.use('/api/payments/mpesa', require('./routes/mpesa'));

// ============================
// ERROR HANDLERS
// ============================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================
// START
// ============================
const server = app.listen(PORT, () => {
  logger.info(`🚀 Helvino POS API running on port ${PORT} [${NODE_ENV}]`);
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
  logger.info(`🏢 Powered by Helvino Technologies Limited`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    logger.info('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
