import api from './api';

export const fetchCompany = async () => {
  const response = await api.get('/company');
  return response.data;
};

export const updateCompany = async (payload) => {
  const response = await api.put('/company', payload);
  return response.data;
};
