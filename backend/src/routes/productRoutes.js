const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.product_name, p.product_code, p.hs_code, p.purchase_price, p.selling_price, p.stock, p.description, p.status,
             pc.category_name AS category,
             pu.unit_name AS unit,
             tr.rate_percent AS vat_rate
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN product_units pu ON pu.id = p.unit_id
      LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

const resolveProductLookups = async (dbInstance, { category, unit, vat_rate }) => {
  const categoryName = category || 'General';
  const unitName = unit || 'PCS';
  const vatRateValue = Number(vat_rate || 13);

  const [categoryRows] = await dbInstance.query('SELECT id FROM product_categories WHERE category_name = ?', [categoryName]);
  let categoryId = categoryRows[0]?.id;
  if (!categoryId) {
    const result = await dbInstance.run('INSERT INTO product_categories (category_name) VALUES (?)', [categoryName]);
    categoryId = result.lastID;
  }

  const [unitRows] = await dbInstance.query('SELECT id FROM product_units WHERE unit_name = ?', [unitName]);
  let unitId = unitRows[0]?.id;
  if (!unitId) {
    const result = await dbInstance.run('INSERT INTO product_units (unit_name) VALUES (?)', [unitName]);
    unitId = result.lastID;
  }

  const [taxRows] = await dbInstance.query('SELECT id FROM tax_rates WHERE rate_percent = ?', [vatRateValue]);
  let taxRateId = taxRows[0]?.id;
  if (!taxRateId) {
    const result = await dbInstance.run('INSERT INTO tax_rates (rate_name, rate_percent) VALUES (?, ?)', [`VAT ${vatRateValue}%`, vatRateValue]);
    taxRateId = result.lastID;
  }

  return { categoryId, unitId, taxRateId };
};

router.post('/', async (req, res) => {
  try {
    const { product_name, product_code, hs_code, category, unit, purchase_price, selling_price, vat_rate, stock, description, status } = req.body;
    const { categoryId, unitId, taxRateId } = await resolveProductLookups(db, { category, unit, vat_rate });

    const result = await db.run(
      'INSERT INTO products (product_name, product_code, hs_code, category_id, unit_id, purchase_price, selling_price, tax_rate_id, stock, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product_name, product_code, hs_code, categoryId, unitId, purchase_price || 0, selling_price || 0, taxRateId, stock || 0, description, status || 'Active']
    );
    res.status(201).json({ id: result.lastID, message: 'Product created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, product_code, hs_code, category, unit, purchase_price, selling_price, vat_rate, stock, description, status } = req.body;
    const { categoryId, unitId, taxRateId } = await resolveProductLookups(db, { category, unit, vat_rate });

    await db.run(
      'UPDATE products SET product_name=?, product_code=?, hs_code=?, category_id=?, unit_id=?, purchase_price=?, selling_price=?, tax_rate_id=?, stock=?, description=?, status=? WHERE id=?',
      [product_name, product_code, hs_code, categoryId, unitId, purchase_price || 0, selling_price || 0, taxRateId, stock || 0, description, status || 'Active', id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM products WHERE id=?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

module.exports = router;
