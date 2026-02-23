-- ========================================
-- HELVINO POS - PRODUCTION DATABASE SCHEMA
-- ========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- BRANCHES / LOCATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- EMPLOYEES / USERS
-- ========================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(30) NOT NULL CHECK (role IN (
    'super_admin','admin','manager','cashier',
    'internet_operator','shift_supervisor','accountant'
  )),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  pin_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SHIFTS
-- ========================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  branch_id UUID REFERENCES branches(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2),
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_cash DECIMAL(12,2) DEFAULT 0,
  total_mpesa DECIMAL(12,2) DEFAULT 0,
  total_card DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','closed','reconciled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CUSTOMERS
-- ========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  id_number VARCHAR(30),
  address TEXT,
  is_student BOOLEAN DEFAULT false,
  institution VARCHAR(100),
  account_balance DECIMAL(12,2) DEFAULT 0,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  customer_group VARCHAR(30) DEFAULT 'walk_in' CHECK (customer_group IN (
    'walk_in','student','staff','vip','regular'
  )),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SUPPLIERS
-- ========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  tax_pin VARCHAR(30),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CATEGORIES
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(80) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_type VARCHAR(20) DEFAULT 'product' CHECK (category_type IN ('product','service')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PRODUCTS
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit_of_measure VARCHAR(20) DEFAULT 'piece',
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  student_price DECIMAL(12,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  max_stock INTEGER,
  track_serial BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  image_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SERVICES
-- ========================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  service_type VARCHAR(30) NOT NULL CHECK (service_type IN (
    'internet','printing','scanning','typing',
    'lamination','binding','fax','photocopy','other'
  )),
  rate DECIMAL(12,2) NOT NULL,
  rate_unit VARCHAR(20) DEFAULT 'per_job' CHECK (rate_unit IN (
    'per_hour','per_minute','per_page','per_job','per_item'
  )),
  b_and_w_rate DECIMAL(12,2),
  color_rate DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- COMPUTERS / INTERNET STATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS computers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(50) NOT NULL,
  station_number INTEGER NOT NULL,
  ip_address VARCHAR(20),
  mac_address VARCHAR(20),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
    'available','in_use','maintenance','offline'
  )),
  specs TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, station_number)
);

-- ========================================
-- INTERNET SESSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS internet_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  computer_id UUID REFERENCES computers(id),
  customer_id UUID REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  ticket_number VARCHAR(30) UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  scheduled_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  rate_per_hour DECIMAL(10,2) NOT NULL,
  cost DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN (
    'cash','mpesa','card','account','credit'
  )),
  mpesa_ref VARCHAR(30),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active','completed','terminated','paused','unpaid'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SALES
-- ========================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  receipt_number VARCHAR(30) UNIQUE NOT NULL,
  sale_type VARCHAR(20) DEFAULT 'retail' CHECK (sale_type IN ('retail','service','mixed')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  discount_type VARCHAR(20),
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  change_given DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
    'cash','mpesa','card','bank_transfer','account','credit','split'
  )),
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN (
    'paid','partial','credit','refunded','cancelled'
  )),
  mpesa_ref VARCHAR(30),
  mpesa_amount DECIMAL(12,2) DEFAULT 0,
  cash_amount DECIMAL(12,2) DEFAULT 0,
  card_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  is_refunded BOOLEAN DEFAULT false,
  refund_ref UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SALE ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  item_type VARCHAR(20) NOT NULL DEFAULT 'product' CHECK (item_type IN ('product','service')),
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50),
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PURCHASE ORDERS
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  employee_id UUID REFERENCES employees(id),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  expected_date DATE,
  received_date TIMESTAMPTZ,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending','approved','ordered','partial','received','cancelled'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PURCHASE ORDER ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- EXPENSES
-- ========================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  employee_id UUID REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  category VARCHAR(60) NOT NULL,
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  reference VARCHAR(60),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES employees(id),
  receipt_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STOCK ADJUSTMENTS
-- ========================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  employee_id UUID REFERENCES employees(id),
  adjustment_type VARCHAR(30) NOT NULL CHECK (adjustment_type IN (
    'add','remove','damage','return','correction','transfer'
  )),
  quantity_before INTEGER NOT NULL,
  quantity_adjusted INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  reference VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CUSTOMER TRANSACTIONS (CREDIT/DEBIT)
-- ========================================
CREATE TABLE IF NOT EXISTS customer_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
    'credit','debit','loyalty_add','loyalty_redeem'
  )),
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(30),
  reference_id UUID,
  description VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- M-PESA TRANSACTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100) UNIQUE,
  mpesa_receipt_number VARCHAR(30),
  transaction_type VARCHAR(20) DEFAULT 'payment',
  phone_number VARCHAR(20),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending','success','failed','cancelled','timeout'
  )),
  result_code VARCHAR(10),
  result_desc TEXT,
  reference_type VARCHAR(30),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ACTIVITY LOGS
-- ========================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  branch_id UUID REFERENCES branches(id),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(40),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- NOTIFICATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  branch_id UUID REFERENCES branches(id),
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN (
    'info','warning','error','success','alert'
  )),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SETTINGS
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  key VARCHAR(80) NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES employees(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, key)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_shift ON sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON internet_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_computer ON internet_sessions(computer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_shift ON internet_sessions(shift_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON internet_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);

CREATE INDEX IF NOT EXISTS idx_activity_employee ON activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- ========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'branches','employees','shifts','customers','suppliers',
    'products','services','computers','internet_sessions',
    'sales','purchase_orders','expenses','mpesa_transactions','settings'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated ON %s;
      CREATE TRIGGER trg_%s_updated
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t, t, t);
  END LOOP;
END;
$$;
