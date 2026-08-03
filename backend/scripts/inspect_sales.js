const xlsx = require('xlsx');  
const path = require('path');  
const filePath = path.resolve(__dirname, '..', '..', 'Purchase Sales - BS Int 82-83.xlsx');  
const wb = xlsx.readFile(filePath, { cellDates: true });  
console.log('Inspecting file:', filePath);  
console.log('Sheets:', wb.SheetNames);  
const sheet = wb.Sheets['Sales'];  
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });  
console.log('Sales rows', rows.length);  for (let i = 0; i < Math.min(rows.length, 30); i++) {
  console.log(i + 1, rows[i]);
}