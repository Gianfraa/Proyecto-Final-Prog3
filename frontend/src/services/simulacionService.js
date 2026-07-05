import api from './api';

export const getSimulaciones = async () => {
  const response = await api.get('/simulaciones');
  return response.data;
};

export const createSimulacion = async (data) => {
  const response = await api.post('/simulaciones', data);
  return response.data;
};

export const deleteSimulacion = async (id) => {
  const response = await api.delete(`/simulaciones/${id}`);
  return response.data;
};