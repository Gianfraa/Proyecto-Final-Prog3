import React, { useState } from 'react';
import { simularCompra } from '../../services/gastosService';

const initialValues = {
  producto: '',
  precioTotal: '',
  cantidadCuotas: '',
  tasaInteresMensual: '',
  guardar: false,
};

export default function SimulacionForm({ onResultado }) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const precioTotal = parseFloat(values.precioTotal);
    const cantidadCuotas = parseInt(values.cantidadCuotas, 10);
    const tasaInteresMensual = values.tasaInteresMensual
      ? parseFloat(values.tasaInteresMensual)
      : 0;

    if (!values.producto.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (isNaN(precioTotal) || precioTotal <= 0) {
      setError('Ingresá un precio total válido');
      return;
    }
    if (isNaN(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 48) {
      setError('Cantidad de cuotas: entre 1 y 48');
      return;
    }
    if (isNaN(tasaInteresMensual) || tasaInteresMensual < 0) {
      setError('La tasa de interés no puede ser negativa');
      return;
    }

    setLoading(true);
    try {
      const result = await simularCompra({
        producto: values.producto.trim(),
        precioTotal,
        cantidadCuotas,
        tasaInteresMensual,
        guardar: values.guardar,
      });
      onResultado && onResultado(result.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al simular la compra');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setValues(initialValues);
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Simular compra en cuotas</h3>
        <p className="text-sm text-gray-500">
          Completá los datos para calcular el valor de cada cuota y ver el detalle.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="producto" className="block text-sm font-medium text-gray-700">
            Producto
          </label>
          <input
            id="producto"
            name="producto"
            type="text"
            placeholder="Ej: Notebook Lenovo"
            value={values.producto}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="precioTotal" className="block text-sm font-medium text-gray-700">
            Precio total ($)
          </label>
          <input
            id="precioTotal"
            name="precioTotal"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={values.precioTotal}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cantidadCuotas" className="block text-sm font-medium text-gray-700">
            Cantidad de cuotas
          </label>
          <input
            id="cantidadCuotas"
            name="cantidadCuotas"
            type="number"
            min="1"
            max="48"
            placeholder="12"
            value={values.cantidadCuotas}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tasaInteresMensual" className="block text-sm font-medium text-gray-700">
            Tasa de interés mensual (%)
          </label>
          <input
            id="tasaInteresMensual"
            name="tasaInteresMensual"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={values.tasaInteresMensual}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="guardar"
            name="guardar"
            type="checkbox"
            checked={values.guardar}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="guardar" className="text-sm font-medium text-gray-700">
            Guardar simulación
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Simulando...' : 'Simular'}
        </button>
        <button
          type="button"
          onClick={handleLimpiar}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 font-medium hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}