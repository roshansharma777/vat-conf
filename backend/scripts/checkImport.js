const db = require('../src/config/db');
(async () => {
  try {
    const [billCount] = await db.query('SELECT COUNT(*) AS count FROM bills');
    const [customerCount] = await db.query('SELECT COUNT(*) AS count FROM customers');
    const [sampleBills] = await db.query('SELECT bill_number, fiscal_year, customer_id, subtotal, vat_amount, net_total, payment_method, status FROM bills ORDER BY id DESC LIMIT 5');
    const [sampleCustomers] = await db.query('SELECT id, customer_name, pan_number FROM customers ORDER BY id DESC LIMIT 5');
    console.log('billCount', billCount[0].count);
    console.log('customerCount', customerCount[0].count);
    console.log('sampleBills', sampleBills);
    console.log('sampleCustomers', sampleCustomers);
  } catch (error) {
    console.error(error);
  }
})();
