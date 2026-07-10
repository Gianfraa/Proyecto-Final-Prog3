// frontend/src/pages/BalanceConsolidado.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getBalanceConsolidado } from '../services/gastosService';

const fmt = (n) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(n ?? 0);

export default function BalanceConsolidado() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const response = await getBalanceConsolidado();
            setData(response.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cargar el balance consolidado');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-500">Cargando balance consolidado...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Balance Consolidado</h2>
                <p className="text-sm text-gray-500">
                    Situación financiera actual y proyección a 6 meses considerando ingresos y gastos fijos
                    y simulaciones activas.
                </p>
            </div>

            {/* Resumen general */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Balance actual</p>
                    <p className={`text-xl font-bold ${data.balanceActual >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {fmt(data.balanceActual)}
                    </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Ingresos fijos mensuales</p>
                    <p className="text-xl font-bold text-green-700">{fmt(data.ingresosFijosMensuales)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Gastos fijos mensuales</p>
                    <p className="text-xl font-bold text-red-700">{fmt(data.gastosFijosMensuales)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Gastos variables (mes actual)</p>
                    <p className="text-xl font-bold text-orange-700">{fmt(data.gastosVariablesMesActual)}</p>
                </div>
            </div>

            {/* Simulaciones activas */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Simulaciones activas</h3>

                {data.simulacionesActivas.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay simulaciones activas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Producto</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Cuota mensual</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Cuotas restantes</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Total restante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {data.simulacionesActivas.map((sim) => (
                                    <tr key={sim.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium text-gray-900">{sim.producto}</td>
                                        <td className="px-3 py-2 text-right text-blue-700 font-medium">{fmt(sim.cuotaMensual)}</td>
                                        <td className="px-3 py-2 text-right text-gray-700">{sim.cuotasRestantes}</td>
                                        <td className="px-3 py-2 text-right text-orange-700">{fmt(sim.totalRestante)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Proyección mensual */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Proyección a 6 meses</h3>
                    <p className="text-sm text-gray-500">
                        Balance neto proyectado:{' '}
                        <span className={`font-bold ${data.balanceNetoProyectado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {fmt(data.balanceNetoProyectado)}
                        </span>
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Mes</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Ingresos fijos</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Gastos fijos</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Cuotas simuladas</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Balance proyectado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.proyeccionMensual.map((mes) => (
                                <tr key={mes.mes} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{mes.mes}</td>
                                    <td className="px-3 py-2 text-right text-green-700">{fmt(mes.ingresosFijos)}</td>
                                    <td className="px-3 py-2 text-right text-red-700">{fmt(mes.gastosFijos)}</td>
                                    <td className="px-3 py-2 text-right text-orange-700">{fmt(mes.cuotasSimuladas)}</td>
                                    <td className={`px-3 py-2 text-right font-semibold ${mes.balanceProyectado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {fmt(mes.balanceProyectado)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}