// frontend/src/pages/Simulador.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { simularCompra } from '../services/simulacionService';
import { getSimulaciones, deleteSimulacion, createSimulacion } from '../services/simulacionService';

const fmt = (n) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(n ?? 0);

const initialForm = {
    producto: '',
    precioTotal: '',
    cantidadCuotas: '',
    tasaInteresMensual: '',
};

export default function Simulador() {
    const [form, setForm] = useState(initialForm);
    const [resultado, setResultado] = useState(null);
    const [simulaciones, setSimulaciones] = useState([]);
    const [loadingSimular, setLoadingSimular] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [loadingLista, setLoadingLista] = useState(false);

    const cargarSimulaciones = async () => {
        setLoadingLista(true);
        try {
            const data = await getSimulaciones();
            setSimulaciones(data.simulaciones || []);
        } catch (err) {
            toast.error(err.response?.data?.error || 'No se pudieron cargar las simulaciones');
        } finally {
            setLoadingLista(false);
        }
    };

    useEffect(() => {
        cargarSimulaciones();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSimular = async (e) => {
        e.preventDefault();
        setLoadingSimular(true);
        setResultado(null);
        try {
            const data = await simularCompra({
                producto: form.producto,
                precioTotal: parseFloat(form.precioTotal),
                cantidadCuotas: parseInt(form.cantidadCuotas),
                tasaInteresMensual: form.tasaInteresMensual ? parseFloat(form.tasaInteresMensual) : 0,
                guardar: false,
            });
            setResultado(data.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al simular la compra');
        } finally {
            setLoadingSimular(false);
        }
    };

    const handleGuardar = async () => {
        if (!resultado) return;
        setLoadingGuardar(true);
        try {
            await createSimulacion({
                producto: form.producto,
                precioTotal: parseFloat(form.precioTotal),
                cantidadCuotas: parseInt(form.cantidadCuotas),
                tasaInteresMensual: form.tasaInteresMensual ? parseFloat(form.tasaInteresMensual) : 0,
            });
            toast.success('Simulación guardada');
            setForm(initialForm);
            setResultado(null);
            await cargarSimulaciones();
        } catch (err) {
            toast.error(err.response?.data?.error || 'No se pudo guardar la simulación');
        } finally {
            setLoadingGuardar(false);
        }
    };

    const handleEliminar = async (simulacion) => {
        const ok = window.confirm(`¿Eliminar la simulación de "${simulacion.producto}"?`);
        if (!ok) return;
        try {
            await deleteSimulacion(simulacion.id);
            toast.success('Simulación eliminada');
            await cargarSimulaciones();
        } catch (err) {
            toast.error(err.response?.data?.error || 'No se pudo eliminar la simulación');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Simulador de compras</h2>
                <p className="text-sm text-gray-500">
                    Calculá el costo real de una compra en cuotas antes de realizarla.
                </p>
            </div>

            {/* Formulario */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva simulación</h3>
                <form onSubmit={handleSimular} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Producto</label>
                        <input
                            name="producto"
                            type="text"
                            required
                            value={form.producto}
                            onChange={handleChange}
                            placeholder="Ej: Notebook"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Precio total ($)</label>
                        <input
                            name="precioTotal"
                            type="number"
                            required
                            min="1"
                            value={form.precioTotal}
                            onChange={handleChange}
                            placeholder="Ej: 120000"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Cantidad de cuotas</label>
                        <input
                            name="cantidadCuotas"
                            type="number"
                            required
                            min="1"
                            max="48"
                            value={form.cantidadCuotas}
                            onChange={handleChange}
                            placeholder="Ej: 12"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Tasa de interés mensual (%) <span className="text-gray-400 font-normal">— opcional</span>
                        </label>
                        <input
                            name="tasaInteresMensual"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.tasaInteresMensual}
                            onChange={handleChange}
                            placeholder="Ej: 3.5 — dejá vacío si es sin interés"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2 flex gap-3">
                        <button
                            type="submit"
                            disabled={loadingSimular}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loadingSimular ? 'Calculando...' : 'Simular'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Resultado */}
            {resultado && (
                <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Resultado — {resultado.producto}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Precio original</p>
                            <p className="text-base font-bold text-gray-800">{fmt(resultado.precioTotal)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600 mb-1">Valor cuota</p>
                            <p className="text-base font-bold text-blue-700">{fmt(resultado.valorCuota)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-xs text-orange-600 mb-1">Total financiado</p>
                            <p className="text-base font-bold text-orange-700">{fmt(resultado.totalFinanciado)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-red-600 mb-1">Impacto mensual</p>
                            <p className="text-base font-bold text-red-700">{fmt(resultado.impactoBalanceMensual)}</p>
                        </div>
                    </div>

                    {/* Tabla de cuotas */}
                    {resultado.cuotas && resultado.cuotas.length > 0 && (
                        <div className="overflow-x-auto mb-6">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Cuota</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Fecha</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Valor cuota</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Interés</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Amortización</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Saldo restante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {resultado.cuotas.map((cuota) => (
                                        <tr key={cuota.mes} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-700">{cuota.mes}</td>
                                            <td className="px-3 py-2 text-gray-500">{cuota.fecha}</td>
                                            <td className="px-3 py-2 text-right text-gray-800">{fmt(cuota.valorCuota)}</td>
                                            <td className="px-3 py-2 text-right text-red-600">{fmt(cuota.interes)}</td>
                                            <td className="px-3 py-2 text-right text-green-600">{fmt(cuota.amortizacion)}</td>
                                            <td className="px-3 py-2 text-right text-gray-700">{fmt(cuota.saldoRestante)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <button
                        onClick={handleGuardar}
                        disabled={loadingGuardar}
                        className="rounded-lg bg-green-600 px-5 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        {loadingGuardar ? 'Guardando...' : 'Guardar simulación'}
                    </button>
                </div>
            )}

            {/* Lista de simulaciones guardadas */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Simulaciones guardadas</h3>

                {loadingLista ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                ) : simulaciones.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay simulaciones guardadas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Producto</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Precio total</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Cuotas</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Valor cuota</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Total financiado</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Activa</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {simulaciones.map((sim) => (
                                    <tr key={sim.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium text-gray-900">{sim.producto}</td>
                                        <td className="px-3 py-2 text-right text-gray-700">{fmt(sim.precioTotal)}</td>
                                        <td className="px-3 py-2 text-right text-gray-700">{sim.cantidadCuotas}</td>
                                        <td className="px-3 py-2 text-right text-blue-700 font-medium">{fmt(sim.valorCuota)}</td>
                                        <td className="px-3 py-2 text-right text-orange-700">{fmt(sim.totalFinanciado)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sim.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {sim.activa ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => handleEliminar(sim)}
                                                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
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