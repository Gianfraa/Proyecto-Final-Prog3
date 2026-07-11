// frontend/src/services/gastosService.js
import api from './api';

// Obtener balance consolidado con proyección mensual
export const getBalanceConsolidado = async () => {
    const response = await api.get('/balance-consolidado');
    return response.data;
};