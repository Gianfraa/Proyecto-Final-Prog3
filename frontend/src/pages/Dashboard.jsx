import React, { useEffect, useState, useCallback } from 'react';
import { getBalance, getResumen } from '../services/dashboardService';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(n ?? 0);

const monthLabel = (yyyyMm) => {
  if (!yyyyMm) return '';
  const [y, m] = yyyyMm.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
};

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async (selectedMonth) => {
    setLoading(true);
    setError('');
    try {
      const [balanceData, resumenData] = await Promise.all([
        getBalance(),
        getResumen(selectedMonth),
      ]);
      setBalance(balanceData);
      setResumen(resumenData);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(mes);
  }, [mes, cargarDatos]);

  const categorias = resumen
    ? Object.entries(resumen.gastosPorCategoria).sort((a, b) => b[1] - a[1])
    : [];
  const maxCategoria = categorias.length ? categorias[0][1] : 1;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Balance general */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Balance general</h2>
          {loading && !balance ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-green-700 mb-1">Ingresos</p>
                <p className="text-xl font-bold text-green-700">{fmt(balance?.totalIngresos)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-red-700 mb-1">Gastos</p>
                <p className="text-xl font-bold text-red-700">{fmt(balance?.totalGastos)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-blue-700 mb-1">Balance</p>
                <p className="text-xl font-bold text-blue-700">{fmt(balance?.balance)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Resumen mensual */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Resumen mensual</h2>
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading && !resumen ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            resumen && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {resumen.cantidadTransacciones} transacciones en {monthLabel(resumen.mes)}
                </p>

                <p className="text-sm font-medium text-gray-700 mb-2">Gastos por categoría</p>
                <div className="space-y-3">
                  {categorias.map(([nombre, monto]) => (
                    <div key={nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{nombre}</span>
                        <span className="font-medium text-gray-800">{fmt(monto)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.max((monto / maxCategoria) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {categorias.length === 0 && (
                    <p className="text-sm text-gray-500">Sin gastos registrados este mes.</p>
                  )}
                </div>
              </>
            )
          )}
        </div>

      </div>
    </div>
  );
}
