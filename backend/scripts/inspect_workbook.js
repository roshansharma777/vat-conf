const xlsx = require('xlsx');
const path = require('path');
const filePath = path.resolve(__dirname, '..', '..', 'Purchase Sales - BS Int 82-83.xlsx');
console.log('Inspecting file:', filePath);
const wb = xlsx.readFile(filePath, { cellDates: true });
console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const range = sheet['!ref'];
  console.log('\nSheet:', name, 'range', range);
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    console.log(i + 1, rows[i]);
  }
}
