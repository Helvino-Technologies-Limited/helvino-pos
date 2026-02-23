const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  if (err.code === '23505') {
    const match = err.detail?.match(/Key \((.+)\)=\((.+)\) already exists/);
    const field = match ? match[1] : 'field';
    return res.status(409).json({
      status: 'error',
      message: `Duplicate entry: ${field} already exists`,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      status: 'error',
      message: 'Referenced record does not exist',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === '23502') {
    return res.status(400).json({
      status: 'error',
      message: `Required field missing: ${err.column}`,
      timestamp: new Date().toISOString(),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, notFoundHandler, AppError };
