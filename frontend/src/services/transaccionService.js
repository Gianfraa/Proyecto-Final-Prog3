import api from './api';

export const getTransacciones = async (params = {}) => {
  const response = await api.get('/transacciones', { params });
  return response.data;
};

export const getHistorial = async () => {
  const response = await api.get('/transacciones/historial');
  return response.data;
};

export const createTransaccion = async (payload) => {
  const response = await api.post('/transacciones', payload);
  return response.data;
};

export const updateTransaccion = async (id, payload) => {
  const response = await api.put(`/transacciones/${id}`, payload);
  return response.data;
};

export const deleteTransaccion = async (id) => {
  const response = await api.delete(`/transacciones/${id}`);
  return response.data;
};