import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatCurrency = (amount, currency = 'KES') => {
  const num = parseFloat(amount || 0);
  return `${currency} ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try { return format(new Date(date), fmt); } catch { return '—'; }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy, HH:mm'); } catch { return '—'; }
};

export const formatTime = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'HH:mm'); } catch { return '—'; }
};

export const formatRelative = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isToday(d)) return `Today ${format(d, 'HH:mm')}`;
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return '—'; }
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const paymentMethodColor = (method) => {
  const map = {
    cash: 'badge-green',
    mpesa: 'badge-blue',
    card: 'badge-orange',
    credit: 'badge-red',
    account: 'badge-yellow',
    split: 'badge-gray',
  };
  return map[method] || 'badge-gray';
};

export const statusColor = (status) => {
  const map = {
    paid: 'badge-green', active: 'badge-green', completed: 'badge-green',
    open: 'badge-blue', in_stock: 'badge-green',
    partial: 'badge-yellow', low_stock: 'badge-yellow', pending: 'badge-yellow',
    credit: 'badge-orange', unpaid: 'badge-orange',
    cancelled: 'badge-red', refunded: 'badge-red', out_of_stock: 'badge-red',
    maintenance: 'badge-red', offline: 'badge-gray', available: 'badge-green',
    in_use: 'badge-blue',
  };
  return map[status] || 'badge-gray';
};

export const truncate = (str, len = 30) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

export const getErrorMessage = (error) => {
  return error?.response?.data?.message || error?.message || 'An unexpected error occurred';
};

export const ROLES = ['super_admin','admin','manager','cashier','internet_operator','shift_supervisor','accountant'];
export const EXPENSE_CATEGORIES = ['Rent','Electricity','Water','Internet','Supplies','Salaries','Maintenance','Marketing','Transport','Miscellaneous'];
export const PAYMENT_METHODS = ['cash','mpesa','card','bank_transfer','account','credit','split'];
