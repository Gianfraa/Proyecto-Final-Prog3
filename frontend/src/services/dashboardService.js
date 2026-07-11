import api from './api';

export const getBalance = async () => {
  const response = await api.get('/balance');
  return response.data; // { balance, totalIngresos, totalGastos }
};

export const getResumen = async (mes) => {
  const response = await api.get('/resumen', { params: { mes } });
  return response.data; // { mes, totalIngresos, totalGastos, balance, cantidadTransacciones, gastosPorCategoria }
};

export const getEstadisticas = async () => {
  const response = await api.get('/estadisticas');
  return response.data; // { totalTransacciones, totalIngresos, totalGastos, balance, promedioGasto, categoriaTopGasto, gastosPorCategoria, evolucionMensual }
};
