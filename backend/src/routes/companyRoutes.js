const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// GET company info
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM company WHERE id = 1 LIMIT 1');
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch company info', error: error.message });
  }
});

// PUT update company info
router.put('/', async (req, res) => {
  try {
    const { company_name, pan_number, registration_number, address, phone, mobile, email, website, fiscal_year } = req.body;
    await db.run(
      `UPDATE company SET company_name=?, pan_number=?, registration_number=?, address=?, phone=?, mobile=?, email=?, website=?, fiscal_year=? WHERE id=1`,
      [company_name, pan_number, registration_number, address, phone, mobile, email, website, fiscal_year]
    );
    res.json({ message: 'Company info updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update company info', error: error.message });
  }
});

module.exports = router;
