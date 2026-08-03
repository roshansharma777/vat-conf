const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const { TX_TYPE_EXPR } = require('../utils/transactionType');

const router = express.Router();
router.use(authMiddleware);

const xlsx = require('xlsx');

router.get('/', async (req, res) => {
  try {
    const { transaction_type, fiscal_year } = req.query;
    const conditions = [];
    const params = [];

    if (transaction_type) {
      conditions.push(`${TX_TYPE_EXPR} = ?`);
      params.push(transaction_type);
    }
    if (fiscal_year) {
      conditions.push('b.fiscal_year = ?');
      params.push(fiscal_year);
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

    const [bills] = await db.query(`
      SELECT b.*, c.customer_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      ${whereClause}
      ORDER BY b.created_at DESC LIMIT 20
    `, params);

    const [customers] = await db.query('SELECT * FROM customers');
    const [products] = await db.query('SELECT * FROM products');

    const [salesSum] = await db.query(`
      SELECT COALESCE(SUM(vat_amount),0) AS totalVat, COALESCE(SUM(net_total),0) AS totalSales
      FROM bills b WHERE ${TX_TYPE_EXPR} = 'Sales'
      ${fiscal_year ? 'AND b.fiscal_year = ?' : ''}
    `, fiscal_year ? [fiscal_year] : []);

    const [purchaseSum] = await db.query(`
      SELECT COALESCE(SUM(vat_amount),0) AS totalVat, COALESCE(SUM(net_total),0) AS totalPurchase
      FROM bills b WHERE ${TX_TYPE_EXPR} = 'Purchase'
      ${fiscal_year ? 'AND b.fiscal_year = ?' : ''}
    `, fiscal_year ? [fiscal_year] : []);

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM bills b ${whereClause}`, params);

    res.json({
      sales: bills.filter((b) => (b.transaction_type || b.payment_method) === 'Sales'),
      purchases: bills.filter((b) => (b.transaction_type || b.payment_method) === 'Purchase'),
      recentBills: bills,
      customers,
      products,
      totalSales: salesSum[0]?.totalSales || 0,
      totalPurchase: purchaseSum[0]?.totalPurchase || 0,
      totalVat: (salesSum[0]?.totalVat || 0) - (purchaseSum[0]?.totalVat || 0),
      totalBills: countRows[0]?.total || bills.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load reports', error: error.message });
  }
});

router.get('/export/excel', async (req, res) => {
  try {
    const { type, fiscal_year } = req.query;
    let queryStr = `
      SELECT b.bill_number, b.fiscal_year, b.bill_date, c.customer_name, c.pan_number,
             b.taxable_amount, b.vat_amount, b.net_total,
             ${TX_TYPE_EXPR} AS transaction_type, b.payment_method, b.created_at
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (type === 'sales') {
      conditions.push(`${TX_TYPE_EXPR} = 'Sales'`);
    } else if (type === 'purchase') {
      conditions.push(`${TX_TYPE_EXPR} = 'Purchase'`);
    }

    if (fiscal_year) {
      conditions.push('b.fiscal_year = ?');
      params.push(fiscal_year);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }
    queryStr += ' ORDER BY b.id DESC';

    const [rows] = await db.query(queryStr, params);
    const workbook = xlsx.utils.book_new();

    if (type === 'combined') {
      const salesRows = rows.filter((r) => r.transaction_type === 'Sales');
      const purchaseRows = rows.filter((r) => r.transaction_type === 'Purchase');
      xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(salesRows), 'Sales');
      xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(purchaseRows), 'Purchase');
    } else {
      const sheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, sheet, type === 'purchase' ? 'Purchase' : 'Sales');
    }

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type || 'report'}_export.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export Excel report', error: error.message });
  }
});

router.get('/vat-summary', async (req, res) => {
  try {
    const { fiscal_year } = req.query;
    let queryStr = `
      SELECT fiscal_year,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Sales' THEN taxable_amount END), 0) AS sales_taxable,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Sales' THEN vat_amount END), 0) AS sales_vat,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Sales' THEN net_total END), 0) AS sales_total,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Purchase' THEN taxable_amount END), 0) AS purchase_taxable,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Purchase' THEN vat_amount END), 0) AS purchase_vat,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR} = 'Purchase' THEN net_total END), 0) AS purchase_total
      FROM bills b
    `;
    const params = [];
    if (fiscal_year) {
      queryStr += ' WHERE fiscal_year = ?';
      params.push(fiscal_year);
    }
    queryStr += ' GROUP BY fiscal_year ORDER BY fiscal_year DESC';

    const [rows] = await db.query(queryStr, params);
    const summary = rows.map((r) => ({
      ...r,
      net_vat_payable: (r.sales_vat || 0) - (r.purchase_vat || 0),
    }));

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch VAT summary', error: error.message });
  }
});

module.exports = router;
