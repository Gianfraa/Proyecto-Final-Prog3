import api from './api';

export const getCategorias = async () => {
  const response = await api.get('/categorias');
  return response.data.categorias || [];
};

export const createCategoria = async (payload) => {
  const response = await api.post('/categorias', payload);
  return response.data;
};

export const updateCategoria = async (id, payload) => {
  const response = await api.put(`/categorias/${id}`, payload);
  return response.data;
};

export const deleteCategoria = async (id) => {
  const response = await api.delete(`/categorias/${id}`);
  return response.data;
};