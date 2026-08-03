const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const { TX_TYPE_EXPR_PLAIN } = require('../utils/transactionType');

const router = express.Router();
router.use(authMiddleware);

async function migrate() {
  const cols = ['letter_date TEXT', 'signed_by TEXT', 'designation TEXT', "confirmation_type TEXT DEFAULT 'Both'"];
  for (const col of cols) {
    try {
      await db.run(`ALTER TABLE vat_confirmations ADD COLUMN ${col}`);
    } catch (_) {}
  }
}
migrate().catch(() => {});

router.get('/fiscal-years', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT fiscal_year
      FROM bills
      WHERE fiscal_year IS NOT NULL AND fiscal_year != ''
      ORDER BY fiscal_year DESC
    `);
    res.json(rows.map((r) => r.fiscal_year));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch fiscal years', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT vc.*,
             c.customer_name,
             c.company_name  AS customer_company,
             c.pan_number    AS customer_pan,
             COALESCE(ca.address, '') AS customer_address
      FROM vat_confirmations vc
      LEFT JOIN customers c ON vc.customer_id = c.id
      LEFT JOIN customer_addresses ca ON ca.customer_id = c.id AND ca.is_primary = 1
    `;
    const params = [];

    if (type === 'Sales' || type === 'Purchase') {
      query += ` WHERE COALESCE(vc.confirmation_type, 'Both') IN (?, 'Both')`;
      params.push(type);
    }

    query += ' ORDER BY vc.id DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch confirmations', error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { customer_id, fiscal_year, type } = req.query;
    if (!customer_id || !fiscal_year) {
      return res.status(400).json({ message: 'customer_id and fiscal_year are required' });
    }

    const [rows] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Sales' THEN taxable_amount END), 0) AS sales_taxable,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Sales' THEN vat_amount END), 0) AS sales_vat,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Sales' THEN net_total END), 0) AS sales_total,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Purchase' THEN taxable_amount END), 0) AS purchase_taxable,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Purchase' THEN vat_amount END), 0) AS purchase_vat,
        COALESCE(SUM(CASE WHEN ${TX_TYPE_EXPR_PLAIN} = 'Purchase' THEN net_total END), 0) AS purchase_total
      FROM bills
      WHERE customer_id = ? AND fiscal_year = ?
    `, [customer_id, fiscal_year]);

    const summary = rows[0];

    if (type === 'Sales') {
      return res.json({
        ...summary,
        purchase_taxable: 0,
        purchase_vat: 0,
        purchase_total: 0,
      });
    }
    if (type === 'Purchase') {
      return res.json({
        ...summary,
        sales_taxable: 0,
        sales_vat: 0,
        sales_total: 0,
      });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch confirmation summary', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT vc.*,
             c.customer_name,
             c.company_name  AS customer_company,
             c.pan_number    AS customer_pan,
             COALESCE(ca.address, '') AS customer_address
      FROM vat_confirmations vc
      LEFT JOIN customers c ON vc.customer_id = c.id
      LEFT JOIN customer_addresses ca ON ca.customer_id = c.id AND ca.is_primary = 1
      WHERE vc.id = ?
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch confirmation', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      confirmation_number, customer_id, fiscal_year, letter_date,
      sales_taxable, sales_vat, sales_total,
      purchase_taxable, purchase_vat, purchase_total,
      opening_balance, closing_balance,
      signed_by, designation,
      status, created_by, confirmation_type,
    } = req.body;

    const result = await db.run(
      `INSERT INTO vat_confirmations
        (confirmation_number, customer_id, fiscal_year, letter_date,
         sales_taxable, sales_vat, sales_total,
         purchase_taxable, purchase_vat, purchase_total,
         opening_balance, closing_balance,
         signed_by, designation, status, created_by, confirmation_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        confirmation_number,
        customer_id || null,
        fiscal_year,
        letter_date || null,
        sales_taxable || 0,
        sales_vat || 0,
        sales_total || ((sales_taxable || 0) + (sales_vat || 0)),
        purchase_taxable || 0,
        purchase_vat || 0,
        purchase_total || ((purchase_taxable || 0) + (purchase_vat || 0)),
        opening_balance || 0,
        closing_balance || 0,
        signed_by || null,
        designation || null,
        status || 'Draft',
        created_by || null,
        confirmation_type || 'Both',
      ]
    );
    res.status(201).json({ id: result.lastID, message: 'Confirmation created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create confirmation', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      confirmation_number, customer_id, fiscal_year, letter_date,
      sales_taxable, sales_vat, sales_total,
      purchase_taxable, purchase_vat, purchase_total,
      opening_balance, closing_balance,
      signed_by, designation, status, confirmation_type,
    } = req.body;

    await db.run(
      `UPDATE vat_confirmations SET
        confirmation_number=?, customer_id=?, fiscal_year=?, letter_date=?,
        sales_taxable=?, sales_vat=?, sales_total=?,
        purchase_taxable=?, purchase_vat=?, purchase_total=?,
        opening_balance=?, closing_balance=?,
        signed_by=?, designation=?, status=?, confirmation_type=?
       WHERE id=?`,
      [
        confirmation_number, customer_id || null, fiscal_year, letter_date || null,
        sales_taxable || 0, sales_vat || 0, sales_total || 0,
        purchase_taxable || 0, purchase_vat || 0, purchase_total || 0,
        opening_balance || 0, closing_balance || 0,
        signed_by || null, designation || null,
        status || 'Draft', confirmation_type || 'Both',
        id,
      ]
    );
    res.json({ message: 'Confirmation updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update confirmation', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM vat_confirmations WHERE id=?', [req.params.id]);
    res.json({ message: 'Confirmation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete confirmation', error: error.message });
  }
});

module.exports = router;
