// frontend/src/pages/Transacciones.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Transacciones from './Transacciones';

jest.mock('../services/transaccionService', () => ({
    getTransacciones: jest.fn(),
    createTransaccion: jest.fn(),
    updateTransaccion: jest.fn(),
    deleteTransaccion: jest.fn(),
    getHistorial: jest.fn(),
}));

jest.mock('../services/categoriaService', () => ({
    getCategorias: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.mock('../components/common/TransaccionForm', () => {
    return function MockTransaccionForm({ onSubmit, onCancel }) {
        return (
            <div data-testid="transaccion-form">
                <button
                    onClick={() =>
                        onSubmit({
                            descripcion: 'Almuerzo',
                            monto: 1500,
                            tipo: 'gasto',
                            naturaleza: 'variable',
                            fecha: '2026-07-10',
                            categoriaId: 1,
                        })
                    }
                >
                    Confirmar
                </button>
                <button onClick={onCancel}>Cancelar</button>
            </div>
        );
    };
});

jest.mock('../components/common/TransaccionList', () => {
    return function MockTransaccionList({ transacciones, onEdit, onDelete }) {
        return (
            <div data-testid="transaccion-list">
                {transacciones.map((t) => (
                    <div key={t.id}>
                        <span>{t.descripcion}</span>
                        <button onClick={() => onEdit(t)}>Editar</button>
                        <button onClick={() => onDelete(t)}>Eliminar</button>
                    </div>
                ))}
            </div>
        );
    };
});

const mockTransacciones = {
    data: [
        {
            id: 1,
            descripcion: 'Almuerzo',
            monto: '1500.00',
            tipo: 'gasto',
            naturaleza: 'variable',
            fecha: '2026-07-10T00:00:00.000Z',
            categoriaId: 1,
        },
    ],
    meta: { pagina: 1, totalPaginas: 1, total: 1 },
};

const mockHistorial = {
    historial: [
        {
            mes: '2026-07',
            ingresos: 0,
            gastos: 1500,
            cantidadIngresos: 0,
            cantidadGastos: 1,
            balance: -1500,
        },
    ],
};

const renderTransacciones = () =>
    render(
        <MemoryRouter>
            <Transacciones />
        </MemoryRouter>
    );

describe('Transacciones — renderizado', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { getCategorias } = require('../services/categoriaService');
        const { getTransacciones, getHistorial } = require('../services/transaccionService');
        getCategorias.mockResolvedValue([{ id: 1, nombre: 'Comida' }]);
        getTransacciones.mockResolvedValue(mockTransacciones);
        getHistorial.mockResolvedValue(mockHistorial);
    });

    test('muestra el título correctamente', () => {
        renderTransacciones();
        expect(screen.getByText('Transacciones')).toBeInTheDocument();
    });

    test('muestra el botón de nueva transacción', () => {
        renderTransacciones();
        expect(screen.getByText('Nueva transacción')).toBeInTheDocument();
    });

    test('muestra los filtros disponibles', () => {
        renderTransacciones();
        expect(screen.getByText('Filtrar')).toBeInTheDocument();
        expect(screen.getByText('Limpiar')).toBeInTheDocument();
    });

    test('muestra las transacciones cargadas', async () => {
        renderTransacciones();

        await waitFor(() => {
            expect(screen.getByText('Almuerzo')).toBeInTheDocument();
        });
    });

    test('muestra el historial mensual', async () => {
        renderTransacciones();

        await waitFor(() => {
            expect(screen.getByText('Historial mensual')).toBeInTheDocument();
            expect(screen.getByText('2026-07')).toBeInTheDocument();
        });
    });
});

describe('Transacciones — crear', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { getCategorias } = require('../services/categoriaService');
        const { getTransacciones, getHistorial } = require('../services/transaccionService');
        getCategorias.mockResolvedValue([{ id: 1, nombre: 'Comida' }]);
        getTransacciones.mockResolvedValue(mockTransacciones);
        getHistorial.mockResolvedValue(mockHistorial);
    });

    test('abre el formulario al hacer click en Nueva transacción', () => {
        renderTransacciones();
        fireEvent.click(screen.getByText('Nueva transacción'));
        expect(screen.getByTestId('transaccion-form')).toBeInTheDocument();
    });

    test('cierra el formulario al cancelar', async () => {
        renderTransacciones();
        fireEvent.click(screen.getByText('Nueva transacción'));
        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByTestId('transaccion-form')).not.toBeInTheDocument();
        });
    });

    test('llama a createTransaccion al confirmar el formulario', async () => {
        const { createTransaccion } = require('../services/transaccionService');
        const { toast } = require('react-hot-toast');
        createTransaccion.mockResolvedValue({});

        renderTransacciones();
        fireEvent.click(screen.getByText('Nueva transacción'));
        fireEvent.click(screen.getByText('Confirmar'));

        await waitFor(() => {
            expect(createTransaccion).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Transacción creada');
        });
    });
});

describe('Transacciones — eliminar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { getCategorias } = require('../services/categoriaService');
        const { getTransacciones, getHistorial } = require('../services/transaccionService');
        getCategorias.mockResolvedValue([{ id: 1, nombre: 'Comida' }]);
        getTransacciones.mockResolvedValue(mockTransacciones);
        getHistorial.mockResolvedValue(mockHistorial);
    });

    test('llama a deleteTransaccion al confirmar la eliminación', async () => {
        const { deleteTransaccion } = require('../services/transaccionService');
        const { toast } = require('react-hot-toast');
        deleteTransaccion.mockResolvedValue({});
        window.confirm = jest.fn().mockReturnValue(true);

        renderTransacciones();

        await waitFor(() => {
            expect(screen.getByText('Almuerzo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Eliminar'));

        await waitFor(() => {
            expect(deleteTransaccion).toHaveBeenCalledWith(1);
            expect(toast.success).toHaveBeenCalledWith('Transacción eliminada');
        });
    });

    test('no elimina si el usuario cancela la confirmación', async () => {
        const { deleteTransaccion } = require('../services/transaccionService');
        deleteTransaccion.mockResolvedValue({});
        window.confirm = jest.fn().mockReturnValue(false);

        renderTransacciones();

        await waitFor(() => {
            expect(screen.getByText('Almuerzo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Eliminar'));

        expect(deleteTransaccion).not.toHaveBeenCalled();
    });
});