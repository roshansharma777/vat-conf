const xlsx = require('xlsx');
const path = require('path');

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  return String(value).trim();
};

const findHeaderRowIndex = (rows) => {
  return rows.findIndex((row) => {
    if (!Array.isArray(row)) return false;
    const normalized = row.map((cell) => (cell === undefined || cell === null ? '' : String(cell).trim().toLowerCase()));
    return normalized.includes('date') && normalized.includes('bill no') && normalized.includes('name of party');
  });
};

const testSheet = (sheetName) => {
  const filePath = path.resolve(__dirname, '..', '..', 'Purchase Sales - BS Int 82-83.xlsx');
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });
  const headerIndex = findHeaderRowIndex(rows);
  console.log('Sheet:', sheetName);
  console.log('Rows total:', rows.length);
  console.log('Header index:', headerIndex);
  if (headerIndex >= 0) {
    console.log('Header row:', JSON.stringify(rows[headerIndex]));
    console.log('First data row:', JSON.stringify(rows[headerIndex + 1]));
    const headerRow = rows[headerIndex].map((cell) => (cell === undefined || cell === null ? '' : String(cell).trim().toLowerCase()));
    const row = rows[headerIndex + 1];
    const rowMap = {};
    headerRow.forEach((columnName, index) => {
      rowMap[columnName] = row[index] !== undefined ? row[index] : null;
    });
    console.log('Row map sample:', JSON.stringify(rowMap));
  }
};

testSheet('Purchase');
testSheet('Sales');
