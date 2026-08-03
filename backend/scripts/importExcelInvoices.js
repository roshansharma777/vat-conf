const xlsx = require('xlsx');
const path = require('path');
const db = require('../src/config/db');
const { processSheetRows } = require('../src/services/excelImportService');

const workbookPath = path.resolve(
  __dirname,
  '..',
  '..',
  process.argv[2] || 'Purchase Sales - BS Int 82-83.xlsx'
);

const main = async () => {
  console.log('Reading workbook:', workbookPath);
  const workbook = xlsx.readFile(workbookPath, { cellDates: true });
  const sheetNames = ['Purchase', 'Sales'];
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.warn(`Workbook missing sheet: ${sheetName}`);
        continue;
      }

      const result = await processSheetRows(connection, sheetName, sheet, false);
      totalImported += result.imported;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      console.log(`Sheet ${sheetName}: imported=${result.imported}, updated=${result.updated}, skipped=${result.skipped}`);
    }

    await connection.commit();
    await connection.release();
    console.log(`Import complete: totalImported=${totalImported}, totalUpdated=${totalUpdated}, totalSkipped=${totalSkipped}`);
  } catch (error) {
    await connection.rollback();
    await connection.release();
    console.error('Import failed:', error.message);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unexpected failure:', error.message);
  process.exit(1);
});
