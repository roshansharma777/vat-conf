const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');
const db = require('../config/db');
const { normalizeFiscalYear } = require('../utils/fiscalYear');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);
const upload = multer({ dest: os.tmpdir() });

const { processSheetRows } = require('../services/excelImportService');

const parseSheetNames = (body) => {
  const raw = body?.sheets;
  if (!raw) return ['Purchase', 'Sales'];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const allowed = ['Purchase', 'Sales'];
    const selected = (Array.isArray(parsed) ? parsed : [parsed]).filter((s) => allowed.includes(s));
    return selected.length ? selected : ['Purchase', 'Sales'];
  } catch (_) {
    return ['Purchase', 'Sales'];
  }
};

// POST preview dry-run
router.post('/excel/preview', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Excel file is required' });
  }

  const filePath = path.resolve(req.file.path);
  let connection;

  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    connection = await db.getConnection();

    const sheetNames = parseSheetNames(req.body);
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const details = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        details.push({ sheet: sheetName, imported: 0, updated: 0, skipped: 0, message: 'Sheet not found' });
        continue;
      }

      const result = await processSheetRows(connection, sheetName, sheet, true);
      totalImported += result.imported;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      details.push({ sheet: sheetName, imported: result.imported, updated: result.updated, skipped: result.skipped, message: result.message || 'Ready' });
    }

    await connection.release();
    res.json({ message: 'Excel preview ready', totalImported, totalUpdated, totalSkipped, details });
  } catch (error) {
    if (connection) await connection.release().catch(() => {});
    res.status(500).json({ message: 'Excel preview failed', error: error.message });
  }
});

// POST execute import
router.post('/excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Excel file is required' });
  }

  const filePath = path.resolve(req.file.path);
  let connection;

  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    connection = await db.getConnection();
    await connection.beginTransaction();

    const sheetNames = parseSheetNames(req.body);
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const details = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        details.push({ sheet: sheetName, imported: 0, updated: 0, skipped: 0, message: 'Sheet not found' });
        continue;
      }

      const result = await processSheetRows(connection, sheetName, sheet, false);
      totalImported += result.imported;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      details.push({ sheet: sheetName, imported: result.imported, updated: result.updated, skipped: result.skipped, message: result.message || 'Imported' });
    }

    await connection.commit();
    await connection.release();

    res.json({ message: 'Excel import completed', totalImported, totalUpdated, totalSkipped, details });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        await connection.release();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
    res.status(500).json({ message: 'Excel import failed', error: error.message });
  }
});

module.exports = router;

