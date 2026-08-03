const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const { TX_TYPE_EXPR } = require('../utils/transactionType');

const router = express.Router();
router.use(authMiddleware);

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const transactionType = req.query.transaction_type || null;
    const fiscalYear = req.query.fiscal_year || null;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(b.bill_number LIKE ? OR c.customer_name LIKE ? OR c.pan_number LIKE ?)');
      params.push(search, search, search);
    }
    if (transactionType) {
      conditions.push(`${TX_TYPE_EXPR} = ?`);
      params.push(transactionType);
    }
    if (fiscalYear) {
      conditions.push('b.fiscal_year = ?');
      params.push(fiscalYear);
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      ${whereClause}
    `;
    const dataQuery = `
      SELECT b.*, c.customer_name, c.pan_number,
             ${TX_TYPE_EXPR} AS resolved_transaction_type
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      ${whereClause}
      ORDER BY b.id DESC LIMIT ? OFFSET ?
    `;

    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0]?.total || 0;
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bills WHERE id=?', [req.params.id]);
    const [items] = await db.query('SELECT * FROM bill_items WHERE bill_id=?', [req.params.id]);
    res.json({ bill: rows[0], items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bill', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { bill_number, fiscal_year, customer_id, discount, payment_method, transaction_type, bill_date, status, items } = req.body;

    let computedTaxable = 0;
    let computedVat = 0;
    const itemList = items || [];

    for (const item of itemList) {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const itemDiscount = Number(item.discount || 0);
      const vatRate = Number(item.vat_rate || 13);
      const itemTaxable = Math.max(0, qty * rate - itemDiscount);
      const itemVat = (itemTaxable * vatRate) / 100;
      computedTaxable += itemTaxable;
      computedVat += itemVat;
    }

    const billDiscount = Number(discount || 0);
    const finalTaxable = Math.max(0, computedTaxable - billDiscount);
    const finalVat = computedVat;
    const finalGrandTotal = finalTaxable + finalVat;

    const result = await db.run(
      `INSERT INTO bills (bill_number, fiscal_year, customer_id, subtotal, discount, taxable_amount, vat_amount, grand_total, round_off, net_total, payment_method, transaction_type, bill_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bill_number, fiscal_year, customer_id || null, computedTaxable, billDiscount,
        finalTaxable, finalVat, finalGrandTotal, 0, finalGrandTotal,
        payment_method, transaction_type || null, bill_date || null, status || 'Draft',
      ]
    );

    const billId = result.lastID;
    for (const item of itemList) {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const itemDiscount = Number(item.discount || 0);
      const vatRate = Number(item.vat_rate || 13);
      const itemTaxable = Math.max(0, qty * rate - itemDiscount);
      const itemVat = (itemTaxable * vatRate) / 100;
      const itemTotal = itemTaxable + itemVat;

      await db.run(
        'INSERT INTO bill_items (bill_id, product_id, product_name, product_code, hs_code, unit, quantity, rate, discount, taxable_amount, vat_rate, vat_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billId, item.product_id || null, item.product_name, item.product_code, item.hs_code, item.unit, qty, rate, itemDiscount, itemTaxable, vatRate, itemVat, itemTotal]
      );
    }

    res.status(201).json({ id: billId, message: 'Bill created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bill', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.run('UPDATE bills SET status=? WHERE id=?', [status, id]);
    res.json({ message: 'Bill updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bill', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM bill_items WHERE bill_id=?', [id]);
    await db.run('DELETE FROM bills WHERE id=?', [id]);
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete bill', error: error.message });
  }
});

module.exports = router;
