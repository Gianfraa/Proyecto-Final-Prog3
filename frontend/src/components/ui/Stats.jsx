import React, { useEffect, useState } from 'react';
import { getEstadisticas } from '../../services/dashboardService';

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

const COLORES_BARRAS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-rose-500',
];

function GraficoGastosPorCategoria({ gastosPorCategoria }) {
  const categorias = Object.entries(gastosPorCategoria || {}).sort((a, b) => b[1] - a[1]);
  const max = categorias.length ? Math.max(...categorias.map(([, monto]) => monto)) : 1;

  if (categorias.length === 0) {
    return <p className="text-sm text-gray-500">Sin gastos registrados.</p>;
  }

  return (
    <div className="flex items-end gap-4 h-48 pt-2">
      {categorias.map(([nombre, monto], i) => (
        <div key={nombre} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-xs font-medium text-gray-700 mb-1">{fmt(monto)}</span>
          <div
            className={`w-full max-w-12 rounded-t ${COLORES_BARRAS[i % COLORES_BARRAS.length]}`}
            style={{ height: `${Math.max((monto / max) * 100, 4)}%` }}
            title={`${nombre}: ${fmt(monto)}`}
          />
          <span className="text-xs text-gray-500 mt-2 text-center break-words w-full">
            {nombre}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Estadisticas() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getEstadisticas();
        setEstadisticas(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const evolucion = estadisticas ? Object.entries(estadisticas.evolucionMensual) : [];
  const maxEvol = evolucion.length
    ? Math.max(...evolucion.flatMap(([, v]) => [v.ingresos, v.gastos]))
    : 1;

  return (
    <div className="bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas generales</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && !estadisticas ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        estadisticas && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Transacciones totales</p>
                <p className="text-lg font-bold text-gray-800">{estadisticas.totalTransacciones}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Gasto promedio</p>
                <p className="text-lg font-bold text-gray-800">{fmt(estadisticas.promedioGasto)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Categoría top</p>
                <p className="text-lg font-bold text-gray-800">
                  {estadisticas.categoriaTopGasto?.nombre || '—'}
                </p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-3">Gastos por categoría</p>
            <GraficoGastosPorCategoria gastosPorCategoria={estadisticas.gastosPorCategoria} />

            <p className="text-sm font-medium text-gray-700 mb-3 mt-6">Evolución mensual</p>
            <div className="space-y-2">
              {evolucion.map(([mesKey, v]) => (
                <div key={mesKey} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-gray-500 shrink-0">{monthLabel(mesKey)}</span>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="bg-green-500 h-3 rounded"
                      style={{ width: `${(v.ingresos / maxEvol) * 100}%` }}
                      title={`Ingresos: ${fmt(v.ingresos)}`}
                    />
                    <div
                      className="bg-red-500 h-3 rounded"
                      style={{ width: `${(v.gastos / maxEvol) * 100}%` }}
                      title={`Gastos: ${fmt(v.gastos)}`}
                    />
                  </div>
                </div>
              ))}
              {evolucion.length === 0 && (
                <p className="text-sm text-gray-500">Sin datos históricos.</p>
              )}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" /> Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" /> Gastos
              </span>
            </div>
          </>
        )
      )}
    </div>
  );
}