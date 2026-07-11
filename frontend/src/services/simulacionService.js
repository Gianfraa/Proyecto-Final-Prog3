// frontend/src/services/simulacionService.js
import api from './api';

// Listar simulaciones guardadas del usuario
export const getSimulaciones = async () => {
    const response = await api.get('/simulaciones');
    return response.data;
};

// Crear y guardar una simulación
export const createSimulacion = async (data) => {
    const response = await api.post('/simulaciones', data);
    return response.data;
};

// Eliminar una simulación
export const deleteSimulacion = async (id) => {
    const response = await api.delete(`/simulaciones/${id}`);
    return response.data;
};

// Simular una compra puntual (sin guardar necesariamente)
export const simularCompra = async (data) => {
    const response = await api.post('/simulador/comprar', data);
    return response.data;
};