// frontend/src/pages/Login.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

// Mock del hook useAuth
const mockLogin = jest.fn();
jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

// Mock de react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const renderLogin = () =>
    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );

describe('Login — renderizado', () => {
    beforeEach(() => jest.clearAllMocks());

    test('muestra el título correctamente', () => {
        renderLogin();
        expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    });

    test('muestra los campos de email y contraseña', () => {
        renderLogin();
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('muestra el botón de ingresar', () => {
        renderLogin();
        expect(screen.getByText('Ingresar')).toBeInTheDocument();
    });

    test('muestra el link para registrarse', () => {
        renderLogin();
        expect(screen.getByText('Registrate')).toBeInTheDocument();
    });
});

describe('Login — interacción', () => {
    beforeEach(() => jest.clearAllMocks());

    test('permite completar el formulario', () => {
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: '123456' },
        });

        expect(screen.getByPlaceholderText('tu@email.com').value).toBe('gian@test.com');
        expect(screen.getByPlaceholderText('••••••••').value).toBe('123456');
    });

    test('llama a login con los datos correctos al enviar', async () => {
        mockLogin.mockResolvedValue({});
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByText('Ingresar'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('gian@test.com', '123456');
        });
    });

    test('redirige al dashboard después de login exitoso', async () => {
        mockLogin.mockResolvedValue({});
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByText('Ingresar'));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('muestra error si el login falla', async () => {
        mockLogin.mockRejectedValue({
            response: { data: { error: 'Credenciales inválidas' } },
        });
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: 'mal_password' },
        });
        fireEvent.click(screen.getByText('Ingresar'));

        await waitFor(() => {
            expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
        });
    });

    test('muestra "Ingresando..." mientras espera la respuesta', async () => {
        mockLogin.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'gian@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByText('Ingresar'));

        expect(screen.getByText('Ingresando...')).toBeInTheDocument();
    });
});