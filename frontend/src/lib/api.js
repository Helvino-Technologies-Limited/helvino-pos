import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- Auth ----
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
  refresh: () => api.post('/auth/refresh'),
};

// ---- Dashboard ----
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  revenueChart: (period) => api.get(`/dashboard/revenue-chart?period=${period}`),
};

// ---- Products ----
export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  adjustStock: (id, data) => api.post(`/products/${id}/adjust-stock`, data),
  lowStock: () => api.get('/products/low-stock'),
  byBarcode: (code) => api.get(`/products/barcode/${code}`),
};

// ---- Categories ----
export const categoriesApi = {
  list: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
};

// ---- Sales ----
export const salesApi = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  dailySummary: (date) => api.get(`/sales/daily-summary${date ? `?date=${date}` : ''}`),
};

// ---- Customers ----
export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  topUp: (id, data) => api.post(`/customers/${id}/topup`, data),
  statement: (id, params) => api.get(`/customers/${id}/statement`, { params }),
};

// ---- Internet Sessions ----
export const internetApi = {
  active: () => api.get('/internet/active'),
  computers: () => api.get('/internet/computers'),
  history: (params) => api.get('/internet/history', { params }),
  start: (data) => api.post('/internet/start', data),
  end: (id, data) => api.put(`/internet/${id}/end`, data),
  pay: (id, data) => api.post(`/internet/${id}/pay`, data),
};

// ---- Computers ----
export const computersApi = {
  list: () => api.get('/computers'),
  create: (data) => api.post('/computers', data),
  update: (id, data) => api.put(`/computers/${id}`, data),
};

// ---- Employees ----
export const employeesApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  resetPassword: (id, data) => api.put(`/employees/${id}/reset-password`, data),
};

// ---- Shifts ----
export const shiftsApi = {
  current: () => api.get('/shifts/current'),
  history: (params) => api.get('/shifts/history', { params }),
  open: (data) => api.post('/shifts/open', data),
  close: (data) => api.put('/shifts/close', data),
};

// ---- Expenses ----
export const expensesApi = {
  list: (params) => api.get('/expenses', { params }),
  summary: (params) => api.get('/expenses/summary', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// ---- Reports ----
export const reportsApi = {
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  topProducts: (params) => api.get('/reports/top-products', { params }),
  topServices: (params) => api.get('/reports/top-services', { params }),
  internetUsage: (params) => api.get('/reports/internet-usage', { params }),
  stock: () => api.get('/reports/stock'),
};

// ---- Suppliers ----
export const suppliersApi = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

// ---- Services ----
export const servicesApi = {
  list: () => api.get('/services'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
};

// ---- M-Pesa ----
export const mpesaApi = {
  stkPush: (data) => api.post('/payments/mpesa/stk-push', data),
  checkStatus: (id) => api.get(`/payments/mpesa/status/${id}`),
};

// ── Profile ──────────────────────────────────────────────────
export const profileApi = {
  get:            ()     => api.get('/auth/profile'),
  update:         (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Settings ─────────────────────────────────────────────────
export const settingsApi = {
  get:            ()     => api.get('/settings'),
  updateBusiness: (data) => api.put('/settings/business', data),
  updateReceipt:  (data) => api.put('/settings/receipt', data),
};

// ── Branches ──────────────────────────────────────────────────
export const branchesApi = {
  list:       ()     => api.get('/branches'),
  get:        (id)   => api.get(`/branches/${id}`),
  create:     (data) => api.post('/branches', data),
  update:     (id, data) => api.put(`/branches/${id}`, data),
  summary:    (id)   => api.get(`/branches/${id}/summary`),
  comparison: (p)    => api.get('/reports/branches/comparison', { params: p }),
};
