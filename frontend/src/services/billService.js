import api from './api';

export const fetchBills = async (params = {}) => {
  const response = await api.get('/bills', { params: { limit: 500, ...params } });
  return response.data?.data ?? response.data ?? [];
};

export const fetchFiscalYears = async () => {
  const response = await api.get('/bills/fiscal-years');
  return response.data ?? [];
};

export const createBill = async (payload) => {
  const response = await api.post('/bills', payload);
  return response.data;
};
