import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';

// Placeholder para que las otras personas puedan conectar sus páginas
const Placeholder = ({ nombre }) => (
  <div className="p-8 text-gray-500 text-sm">Página "{nombre}" — en construcción</div>
);

// Layout para rutas autenticadas: Navbar + Sidebar + contenido
function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Ruta protegida: si no hay token, redirige a /login
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Cargando...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Ruta pública: si ya está logueado, redirige al dashboard
function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Rutas protegidas con layout */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Placeholder nombre="Dashboard" />} />
          <Route path="/transacciones" element={<Placeholder nombre="Transacciones" />} />
          <Route path="/categorias" element={<Placeholder nombre="Categorías" />} />
          <Route path="/simulador" element={<Placeholder nombre="Simulador" />} />
          <Route path="/balance" element={<Placeholder nombre="Balance Consolidado" />} />
        </Route>
      </Route>

      {/* Redirigir raíz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes>
        </AppRoutes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;