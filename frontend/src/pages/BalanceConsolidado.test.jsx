// frontend/src/pages/BalanceConsolidado.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BalanceConsolidado from './BalanceConsolidado';

jest.mock('../services/gastosService', () => ({
    getBalanceConsolidado: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const mockData = {
    data: {
        balanceActual: 80000,
        ingresosFijosMensuales: 150000,
        gastosFijosMensuales: 50000,
        gastosVariablesMesActual: 20000,
        simulacionesActivas: [],
        proyeccionMensual: [
            {
                mes: '2026-07',
                ingresosFijos: 150000,
                gastosFijos: 50000,
                cuotasSimuladas: 0,
                balanceProyectado: 100000,
            },
            {
                mes: '2026-08',
                ingresosFijos: 150000,
                gastosFijos: 50000,
                cuotasSimuladas: 0,
                balanceProyectado: 100000,
            },
        ],
        balanceNetoProyectado: 600000,
    },
};

const renderBalanceConsolidado = () =>
    render(
        <MemoryRouter>
            <BalanceConsolidado />
        </MemoryRouter>
    );

describe('BalanceConsolidado — renderizado', () => {
    test('muestra el título correctamente', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue(mockData);

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('Balance Consolidado')).toBeInTheDocument();
        });
    });

    test('muestra los 4 cards de resumen con los valores correctos', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue(mockData);

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('Balance actual')).toBeInTheDocument();
            expect(screen.getByText('Ingresos fijos mensuales')).toBeInTheDocument();
            expect(screen.getByText('Gastos fijos mensuales')).toBeInTheDocument();
            expect(screen.getByText('Gastos variables (mes actual)')).toBeInTheDocument();
        });
    });

    test('muestra "No hay simulaciones activas" cuando la lista está vacía', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue(mockData);

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('No hay simulaciones activas.')).toBeInTheDocument();
        });
    });

    test('muestra la tabla de proyección mensual', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue(mockData);

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('Proyección a 6 meses')).toBeInTheDocument();
            expect(screen.getByText('2026-07')).toBeInTheDocument();
            expect(screen.getByText('2026-08')).toBeInTheDocument();
        });
    });

    test('muestra el balance neto proyectado', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue(mockData);

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('Balance neto proyectado:')).toBeInTheDocument();
        });
    });
});

describe('BalanceConsolidado — simulaciones activas', () => {
    test('muestra las simulaciones activas cuando las hay', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        getBalanceConsolidado.mockResolvedValue({
            data: {
                ...mockData.data,
                simulacionesActivas: [
                    {
                        id: 1,
                        producto: 'Notebook',
                        cuotaMensual: 22520.19,
                        cuotasRestantes: 5,
                        totalRestante: 112600.95,
                    },
                ],
            },
        });

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(screen.getByText('Notebook')).toBeInTheDocument();
        });
    });
});

describe('BalanceConsolidado — manejo de errores', () => {
    test('muestra toast de error si el endpoint falla', async () => {
        const { getBalanceConsolidado } = require('../services/gastosService');
        const { toast } = require('react-hot-toast');
        getBalanceConsolidado.mockRejectedValue(new Error('Error de red'));

        renderBalanceConsolidado();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al cargar el balance consolidado');
        });
    });
});