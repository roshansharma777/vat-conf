import api from './api';

export const previewExcelImport = async (file, sheets = ['Purchase', 'Sales']) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sheets', JSON.stringify(sheets));

  const response = await api.post('/imports/excel/preview', formData);
  return response.data;
};

export const uploadExcelImport = async (file, sheets = ['Purchase', 'Sales']) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sheets', JSON.stringify(sheets));

  const response = await api.post('/imports/excel', formData);
  return response.data;
};
