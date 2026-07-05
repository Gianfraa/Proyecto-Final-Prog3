import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getBalanceConsolidado } from '../services/gastosService';

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
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};

export default function BalanceConsolidado() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarBalance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getBalanceConsolidado();
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el balance consolidado');
      toast.error(err.response?.data?.error || 'Error al cargar el balance consolidado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarBalance();
  }, [cargarBalance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando balance consolidado...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm">
          {error}
        </div>
        <button
          onClick={cargarBalance}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Balance consolidado</h2>
          <p className="text-sm text-gray-500">
            Proyección a 6 meses basada en tus ingresos, gastos fijos y simulaciones activas.
          </p>
        </div>
        <button
          onClick={cargarBalance}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      {/* Cards de resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Balance actual</p>
          <p className={`text-2xl font-bold ${data.balanceActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(data.balanceActual)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Ingresos fijos mensuales</p>
          <p className="text-2xl font-bold text-green-600">{fmt(data.ingresosFijosMensuales)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Gastos fijos mensuales</p>
          <p className="text-2xl font-bold text-red-600">{fmt(data.gastosFijosMensuales)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Gastos variables del mes</p>
          <p className="text-2xl font-bold text-red-600">{fmt(data.gastosVariablesMesActual)}</p>
        </div>
      </div>

      {/* Simulaciones activas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Cuotas pendientes</h3>
          <p className="text-sm text-gray-500">
            Simulaciones activas que impactan en los próximos meses.
          </p>
        </div>

        {!data.simulacionesActivas || data.simulacionesActivas.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No hay cuotas pendientes. Creá simulaciones en el{' '}
            <a href="/simulador" className="text-blue-600 hover:underline">
              Simulador
            </a>{' '}
            para ver su impacto acá.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Producto</th>
                  <th className="px-6 py-3 text-right font-medium">Cuota mensual</th>
                  <th className="px-6 py-3 text-right font-medium">Cuotas restantes</th>
                  <th className="px-6 py-3 text-right font-medium">Total restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.simulacionesActivas.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{sim.producto}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{fmt(sim.cuotaMensual)}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{sim.cuotasRestantes}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{fmt(sim.totalRestante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proyección a 6 meses */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Proyección a 6 meses</h3>
          <p className="text-sm text-gray-500">
            Estimación mes a mes del balance proyectado, combinando ingresos fijos, gastos fijos y cuotas simuladas.
          </p>
        </div>

        {!data.proyeccionMensual || data.proyeccionMensual.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No hay datos para proyectar. Registrá transacciones fijas para ver la proyección.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Mes</th>
                  <th className="px-6 py-3 text-right font-medium">Ingresos fijos</th>
                  <th className="px-6 py-3 text-right font-medium">Gastos fijos</th>
                  <th className="px-6 py-3 text-right font-medium">Cuotas</th>
                  <th className="px-6 py-3 text-right font-medium">Balance proyectado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.proyeccionMensual.map((proy) => (
                  <tr
                    key={proy.mes}
                    className={
                      proy.balanceProyectado >= 0
                        ? 'hover:bg-green-50'
                        : 'hover:bg-red-50'
                    }
                  >
                    <td className="px-6 py-4 text-gray-900 font-medium capitalize">
                      {monthLabel(proy.mes)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-700">{fmt(proy.ingresosFijos)}</td>
                    <td className="px-6 py-4 text-right text-red-700">{fmt(proy.gastosFijos)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{fmt(proy.cuotasSimuladas)}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block font-semibold px-3 py-1 rounded-full text-xs ${
                          proy.balanceProyectado >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {fmt(proy.balanceProyectado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Balance neto proyectado (suma de 6 meses) */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Balance neto proyectado (6 meses)</p>
          <p
            className={`text-xl font-bold ${
              data.balanceNetoProyectado >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {fmt(data.balanceNetoProyectado)}
          </p>
        </div>
      </div>
    </div>
  );
}