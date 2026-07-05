import api from './api';

export const simularCompra = async (data) => {
  const response = await api.post('/simulador/comprar', data);
  return response.data;
};

export const getBalanceConsolidado = async () => {
  const response = await api.get('/balance-consolidado');
  return response.data;
};