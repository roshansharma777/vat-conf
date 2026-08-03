const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./src/config/db');

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

async function initializeDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'User',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
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
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        company_name TEXT,
        pan_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        address TEXT NOT NULL,
        is_primary INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        phone TEXT,
        email TEXT,
        contact_type TEXT DEFAULT 'primary',
        is_primary INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL UNIQUE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS product_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_name TEXT NOT NULL UNIQUE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rate_name TEXT NOT NULL DEFAULT 'VAT',
        rate_percent REAL NOT NULL DEFAULT 13.00,
        UNIQUE (rate_name, rate_percent)
      )
    `);

    await db.query(`
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
      )
    `);

    await db.query(`
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
        last_imported_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);
    try {
      await db.run('ALTER TABLE bills ADD COLUMN last_imported_at DATETIME');
    } catch (_) {}
    try {
      await db.run('ALTER TABLE bills ADD COLUMN transaction_type TEXT');
    } catch (_) {}
    try {
      await db.run('ALTER TABLE bills ADD COLUMN bill_date TEXT');
    } catch (_) {}
    await db.run(
      `UPDATE bills SET transaction_type = payment_method
       WHERE payment_method IN ('Sales', 'Purchase')
         AND (transaction_type IS NULL OR transaction_type = '')`
    ).catch(() => {});

    try {
      await db.run("ALTER TABLE vat_confirmations ADD COLUMN confirmation_type TEXT DEFAULT 'Both'");
    } catch (_) {}

    await db.query(`
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
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS vat_confirmations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        confirmation_number TEXT,
        customer_id INTEGER,
        fiscal_year TEXT,
        letter_date TEXT,
        sales_taxable REAL DEFAULT 0,
        sales_vat REAL DEFAULT 0,
        sales_total REAL DEFAULT 0,
        purchase_taxable REAL DEFAULT 0,
        purchase_vat REAL DEFAULT 0,
        purchase_total REAL DEFAULT 0,
        opening_balance REAL DEFAULT 0,
        closing_balance REAL DEFAULT 0,
        signed_by TEXT,
        designation TEXT,
        status TEXT DEFAULT 'Draft',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    const passwordHash = bcrypt.hashSync('admin123', 10);
    await db.run(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name=excluded.name, password=excluded.password, role=excluded.role`,
      ['Admin User', 'admin@vat.com', passwordHash, 'Admin']
    );
    await db.run(
      `INSERT INTO company (id, company_name, pan_number, registration_number, address, phone, mobile, email, website, fiscal_year)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      ['Nepal VAT Solutions', '123456789', 'REG-001', 'Kathmandu, Nepal', '+977-1-4444444', '+977-9800000000', 'info@vat.com', 'https://vat.example.com', '2081/82']
    );
    await db.run(
      `INSERT INTO product_categories (category_name) VALUES (?) ON CONFLICT(category_name) DO NOTHING`,
      ['General']
    );
    await db.run(
      `INSERT INTO product_units (unit_name) VALUES (?) ON CONFLICT(unit_name) DO NOTHING`,
      ['PCS']
    );
    await db.run(
      `INSERT INTO tax_rates (rate_name, rate_percent) VALUES (?, ?) ON CONFLICT(rate_name, rate_percent) DO NOTHING`,
      ['VAT 13%', 13.00]
    );
  } catch (error) {
    console.error('Database initialization warning:', error.message);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VAT billing system backend is running' });
});

const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const productRoutes = require('./src/routes/productRoutes');
const billRoutes = require('./src/routes/billRoutes');
const confirmationRoutes = require('./src/routes/confirmationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const importRoutes = require('./src/routes/importRoutes');
const companyRoutes = require('./src/routes/companyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/vat-confirmations', confirmationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/company', companyRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API route not found' });
    return;
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
