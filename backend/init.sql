PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  logo TEXT,
  pan_number TEXT,
  registration_number TEXT,
  address TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  fiscal_year TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  pan_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  is_primary INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  phone TEXT,
  email TEXT,
  contact_type TEXT DEFAULT 'primary',
  is_primary INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_name TEXT NOT NULL DEFAULT 'VAT',
  rate_percent REAL NOT NULL DEFAULT 13.00,
  UNIQUE (rate_name, rate_percent)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name TEXT NOT NULL,
  product_code TEXT,
  hs_code TEXT,
  category_id INTEGER,
  unit_id INTEGER,
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  tax_rate_id INTEGER,
  stock INTEGER DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'Active',
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  FOREIGN KEY (unit_id) REFERENCES product_units(id),
  FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(id)
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT NOT NULL UNIQUE,
  fiscal_year TEXT,
  customer_id INTEGER,
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  net_total REAL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'Draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER,
  product_id INTEGER,
  product_name TEXT,
  product_code TEXT,
  hs_code TEXT,
  unit TEXT,
  quantity REAL DEFAULT 0,
  rate REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  vat_rate REAL DEFAULT 13.00,
  vat_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  FOREIGN KEY (bill_id) REFERENCES bills(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS vat_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  confirmation_number TEXT,
  customer_id INTEGER,
  fiscal_year TEXT,
  sales_taxable REAL DEFAULT 0,
  sales_vat REAL DEFAULT 0,
  sales_total REAL DEFAULT 0,
  purchase_taxable REAL DEFAULT 0,
  purchase_vat REAL DEFAULT 0,
  purchase_total REAL DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  closing_balance REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

INSERT OR IGNORE INTO company (id, company_name, pan_number, registration_number, address, phone, mobile, email, website, fiscal_year) VALUES (1, 'Nepal VAT Solutions', '123456789', 'REG-001', 'Kathmandu, Nepal', '+977-1-4444444', '+977-9800000000', 'info@vat.com', 'https://vat.example.com', '2081/82');
INSERT OR IGNORE INTO product_categories (category_name) VALUES ('General');
INSERT OR IGNORE INTO product_units (unit_name) VALUES ('PCS');
INSERT OR IGNORE INTO tax_rates (rate_name, rate_percent) VALUES ('VAT 13%', 13.00);
