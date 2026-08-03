import api from './api';

export const fetchCustomers = async (params = {}) => {
  const response = await api.get('/customers', { params });
  return Array.isArray(response.data) ? response.data : (response.data.data || []);
};

export const createCustomer = async (payload) => {
  const response = await api.post('/customers', payload);
  return response.data;
};

export const updateCustomer = async (id, payload) => {
  const response = await api.put(`/customers/${id}`, payload);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};
