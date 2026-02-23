const crypto = require('crypto');

const generateReceiptNumber = () => {
  const date = new Date();
  const prefix = 'RCP';
  const datePart = date.toISOString().slice(0,10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${datePart}-${random}`;
};

const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'ORD';
  const datePart = date.toISOString().slice(0,10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${datePart}-${random}`;
};

const generateTicketNumber = () => {
  const prefix = 'TKT';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

const generateSKU = (category = 'GEN') => {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${category.substring(0,3).toUpperCase()}-${rand}`;
};

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total: parseInt(total),
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const formatCurrency = (amount) => {
  return `KES ${parseFloat(amount || 0).toFixed(2)}`;
};

const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end - start;
  const diffMins = Math.ceil(diffMs / 60000);
  return diffMins;
};

const calculateSessionCost = (startTime, endTime, ratePerHour) => {
  const minutes = calculateDuration(startTime, endTime);
  const cost = (minutes / 60) * parseFloat(ratePerHour);
  return Math.ceil(cost * 100) / 100;
};

const sanitizePhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
};

const getDateRange = (period) => {
  const now = new Date();
  let start, end;
  switch (period) {
    case 'today':
      start = new Date(now.setHours(0,0,0,0));
      end = new Date(now.setHours(23,59,59,999));
      break;
    case 'week':
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      start = new Date(now.setHours(0,0,0,0));
      end = new Date(now.setHours(23,59,59,999));
  }
  return { start, end };
};

module.exports = {
  generateReceiptNumber,
  generateOrderNumber,
  generateTicketNumber,
  generateSKU,
  getPaginationParams,
  buildPagination,
  formatCurrency,
  calculateDuration,
  calculateSessionCost,
  sanitizePhone,
  getDateRange,
};
