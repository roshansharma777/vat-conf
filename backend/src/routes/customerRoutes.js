const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let countQuery = 'SELECT COUNT(*) as total FROM customers c';
    let dataQuery = `
      SELECT c.id, c.customer_name, c.company_name, c.pan_number, c.created_at,
             COALESCE(a.address, '') AS address,
             COALESCE(ct.phone, '') AS phone,
             COALESCE(ct.email, '') AS email
      FROM customers c
      LEFT JOIN customer_addresses a ON a.customer_id = c.id AND a.is_primary = 1
      LEFT JOIN customer_contacts ct ON ct.customer_id = c.id AND ct.is_primary = 1
    `;
    const params = [];

    if (search) {
      const whereClause = ' WHERE c.customer_name LIKE ? OR c.company_name LIKE ? OR c.pan_number LIKE ?';
      countQuery += whereClause;
      dataQuery += whereClause;
      params.push(search, search, search);
    }

    dataQuery += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';

    const [countRows] = await db.query(countQuery, search ? [search, search, search] : []);
    const total = countRows[0]?.total || 0;

    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer_name, company_name, pan_number, address, phone, email } = req.body;

    const result = await db.run(
      'INSERT INTO customers (customer_name, company_name, pan_number) VALUES (?, ?, ?)',
      [customer_name, company_name || null, pan_number || null]
    );
    const customerId = result.lastID;

    if (address) {
      await db.run('INSERT INTO customer_addresses (customer_id, address, is_primary) VALUES (?, ?, 1)', [customerId, address]);
    }
    if (phone || email) {
      await db.run('INSERT INTO customer_contacts (customer_id, phone, email, is_primary) VALUES (?, ?, ?, 1)', [customerId, phone || null, email || null]);
    }

    res.status(201).json({ id: customerId, message: 'Customer created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create customer', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { customer_name, company_name, pan_number, address, phone, email } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.run('UPDATE customers SET customer_name=?, company_name=?, pan_number=? WHERE id=?', [customer_name, company_name || null, pan_number || null, id]);
    await connection.run('DELETE FROM customer_addresses WHERE customer_id=?', [id]);
    await connection.run('DELETE FROM customer_contacts WHERE customer_id=?', [id]);

    if (address) {
      await connection.run('INSERT INTO customer_addresses (customer_id, address, is_primary) VALUES (?, ?, 1)', [id, address]);
    }
    if (phone || email) {
      await connection.run('INSERT INTO customer_contacts (customer_id, phone, email, is_primary) VALUES (?, ?, ?, 1)', [id, phone || null, email || null]);
    }

    await connection.commit();
    await connection.release();

    res.json({ message: 'Customer updated' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        await connection.release();
      } catch (_) {}
    }
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM customers WHERE id=?', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
});

module.exports = router;
