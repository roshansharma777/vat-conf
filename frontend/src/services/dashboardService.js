import api from './api';

export const fetchDashboardStats = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};
