import api from './api';

const toCamelConfirmation = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    confirmationNumber: c.confirmation_number,
    customerId: c.customer_id,
    fiscalYear: c.fiscal_year,
    letterDate: c.letter_date,
    salesTaxable: c.sales_taxable,
    salesVat: c.sales_vat,
    salesTotal: c.sales_total,
    purchaseTaxable: c.purchase_taxable,
    purchaseVat: c.purchase_vat,
    purchaseTotal: c.purchase_total,
    openingBalance: c.opening_balance,
    closingBalance: c.closing_balance,
    signedBy: c.signed_by,
    designation: c.designation,
    status: c.status,
    createdBy: c.created_by,
    createdAt: c.created_at,
    confirmationType: c.confirmation_type,
    customerName: c.customer_name,
    customerCompany: c.customer_company,
    customerPan: c.customer_pan,
    customerAddress: c.customer_address,
    ...c,
  };
};

export const fetchConfirmations = async (type) => {
  const response = await api.get('/vat-confirmations', {
    params: type ? { type } : {},
  });
  return (response.data || []).map(toCamelConfirmation);
};

export const fetchConfirmation = async (id) => {
  const response = await api.get(`/vat-confirmations/${id}`);
  return toCamelConfirmation(response.data);
};

export const fetchConfirmationSummary = async (customerId, fiscalYear, type) => {
  const response = await api.get('/vat-confirmations/summary', {
    params: { customer_id: customerId, fiscal_year: fiscalYear, type },
  });
  const data = response.data || {};
  return {
    salesTaxable: data.sales_taxable || 0,
    salesVat: data.sales_vat || 0,
    salesTotal: data.sales_total || 0,
    purchaseTaxable: data.purchase_taxable || 0,
    purchaseVat: data.purchase_vat || 0,
    purchaseTotal: data.purchase_total || 0,
    ...data,
  };
};

export const fetchFiscalYears = async () => {
  const response = await api.get('/vat-confirmations/fiscal-years');
  return response.data;
};

export const createConfirmation = async (payload) => {
  const response = await api.post('/vat-confirmations', payload);
  return response.data;
};
