import React from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(n ?? 0);

export default function TablaCuotas({ cuotas }) {
  if (!cuotas || cuotas.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Detalle de cuotas</h3>
        <p className="text-sm text-gray-500">{cuotas.length} cuota{cuotas.length > 1 ? 's' : ''}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Mes</th>
              <th className="px-5 py-3 text-left font-medium">Vencimiento</th>
              <th className="px-5 py-3 text-right font-medium">Cuota</th>
              <th className="px-5 py-3 text-right font-medium">Interés</th>
              <th className="px-5 py-3 text-right font-medium">Amortización</th>
              <th className="px-5 py-3 text-right font-medium">Saldo restante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cuotas.map((cuota, index) => {
              const isLast = index === cuotas.length - 1;
              return (
                <tr
                  key={index}
                  className={`${isLast ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-5 py-3 text-gray-900">
                    {cuota.mes || index + 1}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {cuota.fecha}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900">
                    {fmt(cuota.valorCuota)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {fmt(cuota.interes)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {fmt(cuota.amortizacion)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900">
                    {fmt(cuota.saldoRestante)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}