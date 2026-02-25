import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s — Render free tier is slow, especially on cold starts
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Inject active branch for super_admin
  try {
    const auth = JSON.parse(localStorage.getItem('helvino-auth') || '{}');
    const state = auth?.state;
    if (state?.user?.role === 'super_admin' && state?.activeBranch?.id) {
      config.headers['X-Branch-ID'] = state.activeBranch.id;
    }
  } catch {}

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

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post('/auth/login', data),
  profile:        ()     => api.get('/auth/profile'),
  update:         (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refresh:        ()     => api.post('/auth/refresh'),
};

// ── Profile ───────────────────────────────────────────────────
export const profileApi = {
  get:            ()     => api.get('/auth/profile'),
  update:         (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  stats: (p) => api.get('/dashboard', { params: p }),
};

// ── Products ──────────────────────────────────────────────────
export const productsApi = {
  list:       (p)        => api.get('/products', { params: p }),
  get:        (id)       => api.get(`/products/${id}`),
  create:     (data)     => api.post('/products', data),
  update:     (id, data) => api.put(`/products/${id}`, data),
  delete:     (id)       => api.delete(`/products/${id}`),
  byBarcode:  (code)     => api.get(`/products/barcode/${code}`),
  categories: ()         => api.get('/categories'),
};

// ── Categories ────────────────────────────────────────────────
export const categoriesApi = {
  list:   ()         => api.get('/categories'),
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id)       => api.delete(`/categories/${id}`),
};

// ── Sales ─────────────────────────────────────────────────────
export const salesApi = {
  list:   (p)    => api.get('/sales', { params: p }),
  get:    (id)   => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  void:   (id)   => api.put(`/sales/${id}/void`),
};

// ── Customers ─────────────────────────────────────────────────
export const customersApi = {
  list:   (p)        => api.get('/customers', { params: p }),
  get:    (id)       => api.get(`/customers/${id}`),
  create: (data)     => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
};

// ── Internet ──────────────────────────────────────────────────
export const internetApi = {
  computers: ()         => api.get('/computers'),
  active:    ()         => api.get('/internet/active'),
  history:   (p)        => api.get('/internet/history', { params: p }),
  start:     (data)     => api.post('/internet/start', data),
  end:       (id, data) => api.put(`/internet/${id}/end`, data),
  pay:       (id, data) => api.post(`/internet/${id}/pay`, data),
};

// ── Computers ─────────────────────────────────────────────────
export const computersApi = {
  list:   ()             => api.get('/computers'),
  create: (data)         => api.post('/computers', data),
  update: (id, data)     => api.put(`/computers/${id}`, data),
};

// ── Employees ─────────────────────────────────────────────────
export const employeesApi = {
  list:          (p)        => api.get('/employees', { params: p }),
  get:           (id)       => api.get(`/employees/${id}`),
  create:        (data)     => api.post('/employees', data),
  update:        (id, data) => api.put(`/employees/${id}`, data),
  resetPassword: (id, data) => api.put(`/employees/${id}/reset-password`, data),
};

// ── Shifts ────────────────────────────────────────────────────
export const shiftsApi = {
  list:   (p)        => api.get('/shifts', { params: p }),
  start:  (data)     => api.post('/shifts/start', data),
  end:    (id, data) => api.put(`/shifts/${id}/end`, data),
  active: ()         => api.get('/shifts/active'),
};

// ── Expenses ──────────────────────────────────────────────────
export const expensesApi = {
  list:   (p)        => api.get('/expenses', { params: p }),
  create: (data)     => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id)       => api.delete(`/expenses/${id}`),
};

// ── Suppliers ─────────────────────────────────────────────────
export const suppliersApi = {
  list:   (p)        => api.get('/suppliers', { params: p }),
  get:    (id)       => api.get(`/suppliers/${id}`),
  create: (data)     => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

// ── Services ──────────────────────────────────────────────────
export const servicesApi = {
  list:   (p)        => api.get('/services', { params: p }),
  create: (data)     => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  profitLoss:    (p) => api.get('/reports/profit-loss',    { params: p }),
  topProducts:   (p) => api.get('/reports/top-products',   { params: p }),
  topServices:   (p) => api.get('/reports/top-services',   { params: p }),
  internetUsage: (p) => api.get('/reports/internet-usage', { params: p }),
  stock:         (p) => api.get('/reports/stock',          { params: p }),
  branchCompare: (p) => api.get('/reports/branches/comparison', { params: p }),
};

// ── Branches ──────────────────────────────────────────────────
export const branchesApi = {
  list:       ()         => api.get('/branches'),
  get:        (id)       => api.get(`/branches/${id}`),
  create:     (data)     => api.post('/branches', data),
  update:     (id, data) => api.put(`/branches/${id}`, data),
  summary:    (id)       => api.get(`/branches/${id}/summary`),
  comparison: (p)        => api.get('/reports/branches/comparison', { params: p }),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  get:            ()     => api.get('/settings'),
  updateBusiness: (data) => api.put('/settings/business', data),
  updateReceipt:  (data) => api.put('/settings/receipt', data),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get('/notifications'),
};
