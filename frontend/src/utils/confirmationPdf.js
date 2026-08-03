import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const buildConfirmationPdf = (confirmation, companyInfo) => {
  const customerName = confirmation.customer_name || confirmation.customerName || 'Customer Name';
  const customerCompany = confirmation.customer_company || confirmation.customerCompany || '';
  const customerPan = confirmation.customer_pan || confirmation.customerPan || '';
  const customerAddress = confirmation.customer_address || confirmation.customerAddress || '';
  const letterDate = confirmation.letter_date || confirmation.letterDate || new Date().toISOString().slice(0, 10);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 40;
  let y = 40;

  const compName = companyInfo?.company_name || companyInfo?.companyName || 'B.S. International Pvt. Ltd.';
  const compPan = (companyInfo?.pan_number || companyInfo?.panNumber) ? `PAN NO: ${companyInfo.pan_number || companyInfo.panNumber}` : 'PAN NO: 606002732';
  const compReg = (companyInfo?.registration_number || companyInfo?.registrationNumber) ? `REG NO: ${companyInfo.registration_number || companyInfo.registrationNumber}` : 'REG NO: 163279/073/074';
  const compAddr = companyInfo?.address || 'Dhapakhel-23, Lalitpur';
  const compPhone = (companyInfo?.phone || companyInfo?.mobile) ? `Phone: ${companyInfo.phone || ''} ${(companyInfo.mobile ? '| Mobile: ' + companyInfo.mobile : '')}` : 'Phone: 01-5275083 | Mobile: 9851158989';

  const formatAmount = (value) => `रू ${Number(value || 0).toLocaleString('en-IN')}`;

  doc.setFontSize(12);
  doc.text(compName, left, y);
  y += 18;
  doc.text(compPan, left, y);
  y += 16;
  doc.text(compReg, left, y);
  y += 16;
  doc.text(compAddr, left, y);
  y += 16;
  doc.text(compPhone, left, y);
  y += 24;

  doc.setFontSize(14);
  doc.text('To,', left, y);
  y += 18;
  doc.setFontSize(12);
  doc.text(`${customerCompany || customerName}`, left, y);
  y += 16;
  if (customerAddress) {
    doc.text(customerAddress, left, y);
    y += 16;
  }
  if (customerPan) {
    doc.text(`PAN No: ${customerPan}`, left, y);
    y += 16;
  }
  y += 12;

  doc.setFontSize(12);
  doc.text(`Date: ${letterDate}`, left, y);
  y += 24;
  doc.setFontSize(14);
  doc.text('Subject: Confirmation of Business Transaction for the FY ' + (confirmation.fiscal_year || confirmation.fiscalYear), left, y);
  y += 24;

  const body = `Dear Sir/Madam,

We hope this letter finds you well. As part of our statutory audit process and to ensure accuracy in our accounting records, we request your confirmation of the transactions conducted during the fiscal year ${confirmation.fiscal_year || confirmation.fiscalYear} as per our records below:
`;
  const splitBody = doc.splitTextToSize(body, 520);
  doc.setFontSize(11);
  y += doc.getTextDimensions(splitBody).h;
  doc.text(splitBody, left, y - doc.getTextDimensions(splitBody).h);
  y += 16;

  const salesTaxable = confirmation.sales_taxable ?? confirmation.salesTaxable;
  const salesVat = confirmation.sales_vat ?? confirmation.salesVat;
  const salesTotal = confirmation.sales_total ?? confirmation.salesTotal;
  const purchaseTaxable = confirmation.purchase_taxable ?? confirmation.purchaseTaxable;
  const purchaseVat = confirmation.purchase_vat ?? confirmation.purchaseVat;
  const purchaseTotal = confirmation.purchase_total ?? confirmation.purchaseTotal;

  const rows = [
    ['Particulars', 'Taxable Amount', 'VAT Amount', 'Total Amount'],
    ['Sales', formatAmount(salesTaxable), formatAmount(salesVat), formatAmount(salesTotal)],
    ['Purchased', formatAmount(purchaseTaxable), formatAmount(purchaseVat), formatAmount(purchaseTotal)],
  ];
  y += 10;
  doc.autoTable({
    startY: y,
    head: [rows[0]],
    body: rows.slice(1),
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left },
  });
  y = doc.lastAutoTable.finalY + 20;

  const openingBalance = confirmation.opening_balance ?? confirmation.openingBalance;
  const closingBalance = confirmation.closing_balance ?? confirmation.closingBalance;

  const closing = `Opening Balance: ${formatAmount(openingBalance)}\nClosing Balance: ${formatAmount(closingBalance)}\n
If there is any mistake, please provide the correct transaction details on your official letterhead within 15 days of receiving this letter. Otherwise, the above details will be considered confirmed and accepted.

We appreciate your cooperation and prompt response in helping us maintain accurate records.
`;
  const splitClosing = doc.splitTextToSize(closing, 520);
  doc.text(splitClosing, left, y);
  y += doc.getTextDimensions(splitClosing).h + 20;

  doc.text('Sender', left, y);
  y += 16;
  doc.text(`Signature: ________________________`, left, y);
  y += 20;
  doc.text(`Signed By: ${confirmation.signed_by || confirmation.signedBy || 'N/A'}`, left, y);
  y += 16;
  doc.text(`Designation: ${confirmation.designation || 'N/A'}`, left, y);

  return doc;
};
