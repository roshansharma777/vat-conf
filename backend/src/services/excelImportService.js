const xlsx = require('xlsx');
const { normalizeFiscalYear } = require('../utils/fiscalYear');

const normalizePan = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === '0') return null;
  return text.replace(/\s+/g, '').replace(/-/g, '');
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  return String(value).trim();
};

const normalizePartyName = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(String(value).replace(/[,]/g, ''));
  return Number.isFinite(number) ? number : 0;
};

const fiscalYearFromDate = (dateValue) => {
  const value = normalizeText(dateValue);
  if (!value) return null;
  const match = value.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return normalizeFiscalYear(`${year}/${String(year + 1).slice(-2)}`);
};

const findHeaderRowIndex = (rows) => {
  return rows.findIndex((row) => {
    if (!Array.isArray(row)) return false;
    const normalized = row.map((cell) => (cell === undefined || cell === null ? '' : String(cell).trim().toLowerCase()));
    return normalized.includes('date') && normalized.includes('bill no') && normalized.includes('name of party');
  });
};

const getCustomerId = async (connection, pan, name) => {
  const normalizedPan = normalizePan(pan);
  const normalizedName = normalizeText(name);
  const cleanPartyName = normalizePartyName(normalizedName);

  if (normalizedPan) {
    const [rows] = await connection.query('SELECT id FROM customers WHERE pan_number = ? LIMIT 1', [normalizedPan]);
    if (rows.length > 0) return rows[0].id;
  }

  if (cleanPartyName) {
    const [rows] = await connection.query('SELECT id, customer_name, company_name FROM customers');
    const matched = rows.find(
      (c) => normalizePartyName(c.customer_name) === cleanPartyName || normalizePartyName(c.company_name) === cleanPartyName
    );
    if (matched) return matched.id;
  }

  const result = await connection.run(
    'INSERT INTO customers (customer_name, company_name, pan_number) VALUES (?, ?, ?)',
    [normalizedName || 'Unknown Customer', normalizedName || 'Unknown Customer', normalizedPan]
  );
  return result.lastID;
};

const getOrCreateProductId = async (connection, productName) => {
  const name = normalizeText(productName);
  if (!name) return null;

  const [existing] = await connection.query('SELECT id FROM products WHERE LOWER(product_name) = ? LIMIT 1', [name.toLowerCase()]);
  if (existing.length > 0) return existing[0].id;

  const result = await connection.run(
    'INSERT INTO products (product_name, status) VALUES (?, ?)',
    [name, 'Active']
  );
  return result.lastID;
};

const processSheetRows = async (connection, sheetName, sheet, isDryRun = false) => {
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });
  const headerIndex = findHeaderRowIndex(rows);
  if (headerIndex < 0) {
    return { imported: 0, updated: 0, skipped: 0, message: `Header row not found in ${sheetName}` };
  }

  const headerRow = rows[headerIndex].map((cell) => (cell === undefined || cell === null ? '' : String(cell).trim().toLowerCase()));
  const dataRows = rows.slice(headerIndex + 1);
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of dataRows) {
    if (!Array.isArray(row) || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
      skippedCount += 1;
      continue;
    }

    const rowMap = {};
    headerRow.forEach((columnName, index) => {
      rowMap[columnName] = row[index] !== undefined ? row[index] : null;
    });

    const dateValue = normalizeText(rowMap.date);
    const billNo = normalizeText(rowMap['bill no'] || rowMap['bill no #'] || rowMap.bill_no || rowMap.billnumber);
    const customerName = normalizeText(rowMap['name of party'] || rowMap['party name'] || rowMap.name);
    const panNumber = normalizePan(rowMap.pan);
    const itemDescription = normalizeText(rowMap['particulars'] || rowMap['description'] || rowMap['item'] || rowMap['product']);
    const taxable = parseNumber(rowMap.taxable);
    const vatAmount = parseNumber(rowMap.vat);
    const total = parseNumber(rowMap.total);

    if (!dateValue || (!billNo && !customerName)) {
      skippedCount += 1;
      continue;
    }

    const billNumber = billNo ? `${sheetName}-${billNo}` : `${sheetName}-${dateValue}-${importedCount + updatedCount + 1}`;
    const fiscalYear = fiscalYearFromDate(dateValue) || '2082/83';
    const status = 'Imported';
    const transactionType = sheetName;
    const paymentMethod = sheetName;
    const nowIso = new Date().toISOString();

    const [existingBills] = await connection.query('SELECT id FROM bills WHERE bill_number = ? LIMIT 1', [billNumber]);
    const isExisting = existingBills.length > 0;

    if (isDryRun) {
      if (isExisting) updatedCount += 1;
      else importedCount += 1;
      continue;
    }

    const customerId = await getCustomerId(connection, panNumber, customerName);
    const taxRate = taxable > 0 ? parseNumber((vatAmount / taxable) * 100) : 0;
    const productId = itemDescription ? await getOrCreateProductId(connection, itemDescription) : null;
    const productName = itemDescription || 'Imported transaction';

    if (isExisting) {
      const billId = existingBills[0].id;
      await connection.run(
        `UPDATE bills SET fiscal_year=?, customer_id=?, subtotal=?, discount=?, taxable_amount=?, vat_amount=?, grand_total=?, round_off=?, net_total=?, payment_method=?, transaction_type=?, bill_date=?, status=?, last_imported_at=? WHERE id=?`,
        [fiscalYear, customerId, taxable, 0, taxable, vatAmount, total, 0, total, paymentMethod, transactionType, dateValue, status, nowIso, billId]
      );

      await connection.run('DELETE FROM bill_items WHERE bill_id=?', [billId]);
      await connection.run(
        'INSERT INTO bill_items (bill_id, product_id, product_name, product_code, hs_code, unit, quantity, rate, discount, taxable_amount, vat_rate, vat_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billId, productId, productName, billNumber, null, null, 1, total, 0, taxable, taxRate, vatAmount, total]
      );
      updatedCount += 1;
    } else {
      const billResult = await connection.run(
        'INSERT INTO bills (bill_number, fiscal_year, customer_id, subtotal, discount, taxable_amount, vat_amount, grand_total, round_off, net_total, payment_method, transaction_type, bill_date, status, last_imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billNumber, fiscalYear, customerId, taxable, 0, taxable, vatAmount, total, 0, total, paymentMethod, transactionType, dateValue, status, nowIso]
      );

      await connection.run(
        'INSERT INTO bill_items (bill_id, product_id, product_name, product_code, hs_code, unit, quantity, rate, discount, taxable_amount, vat_rate, vat_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [billResult.lastID, productId, productName, billNumber, null, null, 1, total, 0, taxable, taxRate, vatAmount, total]
      );
      importedCount += 1;
    }
  }

  return { imported: importedCount, updated: updatedCount, skipped: skippedCount };
};

module.exports = {
  normalizePan,
  normalizeText,
  normalizePartyName,
  parseNumber,
  fiscalYearFromDate,
  findHeaderRowIndex,
  getCustomerId,
  getOrCreateProductId,
  processSheetRows,
};
