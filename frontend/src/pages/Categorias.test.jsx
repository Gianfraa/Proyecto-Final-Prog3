// frontend/src/pages/Categorias.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Categorias from './Categorias';

jest.mock('../services/categoriaService', () => ({
    getCategorias: jest.fn(),
    createCategoria: jest.fn(),
    updateCategoria: jest.fn(),
    deleteCategoria: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.mock('../components/common/CategoriaForm', () => {
    return function MockCategoriaForm({ onSubmit, onCancel }) {
        return (
            <div data-testid="categoria-form">
                <button onClick={() => onSubmit({ nombre: 'Nueva categoria' })}>
                    Confirmar
                </button>
                <button onClick={onCancel}>Cancelar</button>
            </div>
        );
    };
});

const renderCategorias = () =>
    render(
        <MemoryRouter>
            <Categorias />
        </MemoryRouter>
    );

describe('Categorias — renderizado', () => {
    beforeEach(() => jest.clearAllMocks());

    test('muestra el título correctamente', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([]);

        renderCategorias();

        expect(screen.getByText('Categorías')).toBeInTheDocument();
    });

    test('muestra el botón de nueva categoría', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([]);

        renderCategorias();

        expect(screen.getByText('Nueva categoría')).toBeInTheDocument();
    });

    test('muestra "No hay categorías cargadas" cuando la lista está vacía', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([]);

        renderCategorias();

        await waitFor(() => {
            expect(screen.getByText('No hay categorías cargadas.')).toBeInTheDocument();
        });
    });

    test('muestra las categorías cuando las hay', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([
            { id: 1, nombre: 'Comida' },
            { id: 2, nombre: 'Transporte' },
        ]);

        renderCategorias();

        await waitFor(() => {
            expect(screen.getByText('Comida')).toBeInTheDocument();
            expect(screen.getByText('Transporte')).toBeInTheDocument();
        });
    });
});

describe('Categorias — crear', () => {
    beforeEach(() => jest.clearAllMocks());

    test('abre el formulario al hacer click en Nueva categoría', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([]);

        renderCategorias();

        fireEvent.click(screen.getByText('Nueva categoría'));

        expect(screen.getByTestId('categoria-form')).toBeInTheDocument();
    });

    test('cierra el formulario al cancelar', async () => {
        const { getCategorias } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([]);

        renderCategorias();

        fireEvent.click(screen.getByText('Nueva categoría'));
        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByTestId('categoria-form')).not.toBeInTheDocument();
        });
    });

    test('llama a createCategoria al confirmar el formulario', async () => {
        const { getCategorias, createCategoria } = require('../services/categoriaService');
        const { toast } = require('react-hot-toast');
        getCategorias.mockResolvedValue([]);
        createCategoria.mockResolvedValue({});

        renderCategorias();

        fireEvent.click(screen.getByText('Nueva categoría'));
        fireEvent.click(screen.getByText('Confirmar'));

        await waitFor(() => {
            expect(createCategoria).toHaveBeenCalledWith({ nombre: 'Nueva categoria' });
            expect(toast.success).toHaveBeenCalledWith('Categoría creada');
        });
    });
});

describe('Categorias — eliminar', () => {
    beforeEach(() => jest.clearAllMocks());

    test('llama a deleteCategoria al confirmar la eliminación', async () => {
        const { getCategorias, deleteCategoria } = require('../services/categoriaService');
        const { toast } = require('react-hot-toast');
        getCategorias.mockResolvedValue([{ id: 1, nombre: 'Comida' }]);
        deleteCategoria.mockResolvedValue({});
        window.confirm = jest.fn().mockReturnValue(true);

        renderCategorias();

        await waitFor(() => {
            expect(screen.getByText('Comida')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Eliminar'));

        await waitFor(() => {
            expect(deleteCategoria).toHaveBeenCalledWith(1);
            expect(toast.success).toHaveBeenCalledWith('Categoría eliminada');
        });
    });

    test('no elimina si el usuario cancela la confirmación', async () => {
        const { getCategorias, deleteCategoria } = require('../services/categoriaService');
        getCategorias.mockResolvedValue([{ id: 1, nombre: 'Comida' }]);
        window.confirm = jest.fn().mockReturnValue(false);

        renderCategorias();

        await waitFor(() => {
            expect(screen.getByText('Comida')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Eliminar'));

        expect(deleteCategoria).not.toHaveBeenCalled();
    });
});