const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [billCount] = await db.query('SELECT COUNT(*) AS total FROM bills');
    const [todayBills] = await db.query("SELECT COUNT(*) AS total FROM bills WHERE DATE(created_at)=DATE('now')");
    const [monthlySales] = await db.query("SELECT COALESCE(SUM(net_total),0) AS total FROM bills WHERE strftime('%Y-%m', created_at)=strftime('%Y-%m','now')");
    const [monthlyVat] = await db.query("SELECT COALESCE(SUM(vat_amount),0) AS total FROM bills WHERE strftime('%Y-%m', created_at)=strftime('%Y-%m','now')");
    const [customerCount] = await db.query('SELECT COUNT(*) AS total FROM customers');
    const [productCount] = await db.query('SELECT COUNT(*) AS total FROM products');
    const [recentBills] = await db.query(`
      SELECT b.*, c.customer_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        totalBills: billCount[0].total,
        todayBills: todayBills[0].total,
        monthlySales: monthlySales[0].total,
        monthlyVat: monthlyVat[0].total,
        customers: customerCount[0].total,
        products: productCount[0].total,
      },
      recentBills,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
});

module.exports = router;
