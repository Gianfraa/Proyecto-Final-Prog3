import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import SimulacionForm from '../components/common/SimulacionForm';
import TablaCuotas from '../components/common/TablaCuotas';
import { getSimulaciones, deleteSimulacion } from '../services/simulacionService';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(n ?? 0);

export default function Simulador() {
  const [simulaciones, setSimulaciones] = useState([]);
  const [loadingSimulaciones, setLoadingSimulaciones] = useState(false);
  const [resultado, setResultado] = useState(null); // resultado de la simulación en vivo

  const cargarSimulaciones = useCallback(async () => {
    setLoadingSimulaciones(true);
    try {
      const data = await getSimulaciones();
      setSimulaciones(data.simulaciones || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudieron cargar las simulaciones');
    } finally {
      setLoadingSimulaciones(false);
    }
  }, []);

  useEffect(() => {
    cargarSimulaciones();
  }, [cargarSimulaciones]);

  const handleResultado = (data) => {
    setResultado(data);
    // Si se guardó, recargar la lista
    if (data.guardada) {
      toast.success('Simulación guardada');
      cargarSimulaciones();
    }
  };

  const handleEliminar = async (id) => {
    const ok = window.confirm('¿Eliminar esta simulación?');
    if (!ok) return;
    try {
      await deleteSimulacion(id);
      toast.success('Simulación eliminada');
      cargarSimulaciones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la simulación');
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Simulador de compras</h2>
          <p className="text-sm text-gray-500">
            Simulá compras en cuotas, con o sin interés, y guardá las simulaciones para el balance.
          </p>
        </div>
      </div>

      {/* Formulario de simulación */}
      <SimulacionForm onResultado={handleResultado} />

      {/* Resultado de la simulación */}
      {resultado && (
        <div className="space-y-4">
          {/* Cards resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-medium text-blue-700 mb-1">Valor de cada cuota</p>
              <p className="text-xl font-bold text-blue-700">{fmt(resultado.valorCuota)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-medium text-blue-700 mb-1">Total financiado</p>
              <p className="text-xl font-bold text-blue-700">{fmt(resultado.totalFinanciado)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-medium text-blue-700 mb-1">Producto</p>
              <p className="text-lg font-bold text-blue-700 truncate">{resultado.producto}</p>
            </div>
          </div>

          {/* Tabla de cuotas */}
          {resultado.cuotas && <TablaCuotas cuotas={resultado.cuotas} />}
        </div>
      )}

      {/* Lista de simulaciones guardadas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Simulaciones guardadas</h3>
          <p className="text-sm text-gray-500">
            Estas simulaciones impactan en el balance consolidado.
          </p>
        </div>

        {loadingSimulaciones ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">Cargando...</div>
        ) : simulaciones.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No tenés simulaciones guardadas. Usá el formulario de arriba y marcá "Guardar simulación".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Producto</th>
                  <th className="px-6 py-3 text-right font-medium">Precio</th>
                  <th className="px-6 py-3 text-right font-medium">Cuotas</th>
                  <th className="px-6 py-3 text-right font-medium">Tasa</th>
                  <th className="px-6 py-3 text-right font-medium">Valor cuota</th>
                  <th className="px-6 py-3 text-right font-medium">Total financiado</th>
                  <th className="px-6 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {simulaciones.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{sim.producto}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{fmt(sim.precioTotal)}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{sim.cantidadCuotas}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{sim.tasaInteresMensual}%</td>
                    <td className="px-6 py-4 text-right text-gray-900">{fmt(sim.valorCuota)}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{fmt(sim.totalFinanciado)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEliminar(sim.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}