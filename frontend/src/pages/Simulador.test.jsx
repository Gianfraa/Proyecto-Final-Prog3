// frontend/src/pages/Simulador.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Simulador from './Simulador';

// Mock de los servicios para no depender del backend
jest.mock('../services/simulacionService', () => ({
    getSimulaciones: jest.fn().mockResolvedValue({ simulaciones: [] }),
    simularCompra: jest.fn(),
    createSimulacion: jest.fn(),
    deleteSimulacion: jest.fn(),
}));

// Mock de react-hot-toast para no renderizar notificaciones en tests
jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const renderSimulador = () =>
    render(
        <MemoryRouter>
            <Simulador />
        </MemoryRouter>
    );

describe('Simulador — renderizado inicial', () => {
    test('muestra el título correctamente', async () => {
        renderSimulador();
        expect(screen.getByText('Simulador de compras')).toBeInTheDocument();
    });

    test('muestra el formulario con todos los campos', async () => {
        renderSimulador();
        expect(screen.getByPlaceholderText('Ej: Notebook')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ej: 120000')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ej: 12')).toBeInTheDocument();
        expect(screen.getByText('Simular')).toBeInTheDocument();
    });

    test('muestra "No hay simulaciones guardadas" cuando la lista está vacía', async () => {
        renderSimulador();
        await waitFor(() => {
            expect(screen.getByText('No hay simulaciones guardadas.')).toBeInTheDocument();
        });
    });
});

describe('Simulador — interacción con el formulario', () => {
    test('permite completar los campos del formulario', () => {
        renderSimulador();

        fireEvent.change(screen.getByPlaceholderText('Ej: Notebook'), {
            target: { value: 'Monitor' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 120000'), {
            target: { value: '259999' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 12'), {
            target: { value: '12' },
        });

        expect(screen.getByPlaceholderText('Ej: Notebook').value).toBe('Monitor');
        expect(screen.getByPlaceholderText('Ej: 120000').value).toBe('259999');
        expect(screen.getByPlaceholderText('Ej: 12').value).toBe('12');
    });

    test('muestra "Calculando..." mientras espera la respuesta', async () => {
        const { simularCompra } = require('../services/simulacionService');
        simularCompra.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
        );

        renderSimulador();

        fireEvent.change(screen.getByPlaceholderText('Ej: Notebook'), {
            target: { value: 'Monitor' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 120000'), {
            target: { value: '259999' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 12'), {
            target: { value: '12' },
        });

        fireEvent.click(screen.getByText('Simular'));

        expect(screen.getByText('Calculando...')).toBeInTheDocument();
    });

    test('muestra el resultado después de simular', async () => {
        const { simularCompra } = require('../services/simulacionService');
        simularCompra.mockResolvedValue({
            data: {
                producto: 'Monitor',
                precioTotal: 259999,
                cantidadCuotas: 12,
                tasaInteresMensual: 0,
                valorCuota: 21666.58,
                totalFinanciado: 259999,
                impactoBalanceMensual: -21666.58,
                cuotas: [
                    {
                        mes: 1,
                        fecha: '2026-08-11',
                        valorCuota: 21666.58,
                        interes: 0,
                        amortizacion: 21666.58,
                        saldoRestante: 238332.42,
                    },
                ],
            },
        });

        renderSimulador();

        fireEvent.change(screen.getByPlaceholderText('Ej: Notebook'), {
            target: { value: 'Monitor' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 120000'), {
            target: { value: '259999' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ej: 12'), {
            target: { value: '12' },
        });

        fireEvent.click(screen.getByText('Simular'));

        await waitFor(() => {
            expect(screen.getByText('Resultado — Monitor')).toBeInTheDocument();
        });

        expect(screen.getByText('Guardar simulación')).toBeInTheDocument();
    });
});

describe('Simulador — lista de simulaciones guardadas', () => {
    test('muestra las simulaciones cuando las hay', async () => {
        const { getSimulaciones } = require('../services/simulacionService');
        getSimulaciones.mockResolvedValue({
            simulaciones: [
                {
                    id: 1,
                    producto: 'Gabinete',
                    precioTotal: 137800,
                    cantidadCuotas: 6,
                    valorCuota: 22966.67,
                    totalFinanciado: 137800,
                    activa: true,
                },
            ],
        });

        renderSimulador();

        await waitFor(() => {
            expect(screen.getByText('Gabinete')).toBeInTheDocument();
        });

        expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });
});