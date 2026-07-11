// frontend/src/pages/Register.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

const mockRegister = jest.fn();
jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        register: mockRegister,
    }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const renderRegister = () =>
    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

describe('Register — renderizado', () => {
    beforeEach(() => jest.clearAllMocks());

    test('muestra el título correctamente', () => {
        renderRegister();
        expect(screen.getByText('Crear cuenta')).toBeInTheDocument();
    });

    test('muestra todos los campos del formulario', () => {
        renderRegister();
        expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
    });

    test('muestra el botón de registrarse', () => {
        renderRegister();
        expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();
    });

    test('muestra el link para iniciar sesión', () => {
        renderRegister();
        expect(screen.getByText('Iniciá sesión')).toBeInTheDocument();
    });
});

describe('Register — interacción', () => {
    beforeEach(() => jest.clearAllMocks());

    test('permite completar el formulario', () => {
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
            target: { value: 'Gian' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: '123456' },
        });

        expect(screen.getByPlaceholderText('Tu nombre').value).toBe('Gian');
        expect(screen.getByPlaceholderText('tu@email.com').value).toBe('gian@test.com');
        expect(screen.getByPlaceholderText('Mínimo 6 caracteres').value).toBe('123456');
    });

    test('llama a register con los datos correctos al enviar', async () => {
        mockRegister.mockResolvedValue({});
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
            target: { value: 'Gian' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith('Gian', 'gian@test.com', '123456');
        });
    });

    test('redirige al dashboard después de registrarse', async () => {
        mockRegister.mockResolvedValue({});
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
            target: { value: 'Gian' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('muestra error si el registro falla', async () => {
        mockRegister.mockRejectedValue({
            response: { data: { error: 'El email ya está registrado' } },
        });
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
            target: { value: 'Gian' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

        await waitFor(() => {
            expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
        });
    });

    test('muestra "Registrando..." mientras espera la respuesta', async () => {
        mockRegister.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
            target: { value: 'Gian' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

        expect(screen.getByText('Registrando...')).toBeInTheDocument();
    });
});