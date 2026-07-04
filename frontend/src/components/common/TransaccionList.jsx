import React from 'react';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function TransaccionList({ transacciones = [], loading = false, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-sm text-gray-500">
        Cargando transacciones...
      </div>
    );
  }

  if (!transacciones.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-sm text-gray-500">
        No hay transacciones para mostrar.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Naturaleza</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Categoría</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {transacciones.map((transaccion) => (
              <tr key={transaccion.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(transaccion.fecha)}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{transaccion.descripcion}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      transaccion.tipo === 'ingreso'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {transaccion.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      transaccion.naturaleza === 'fijo'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {transaccion.naturaleza}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {transaccion.categoria?.nombre || 'Sin categoría'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                  {money.format(Number(transaccion.monto || 0))}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(transaccion)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(transaccion)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}