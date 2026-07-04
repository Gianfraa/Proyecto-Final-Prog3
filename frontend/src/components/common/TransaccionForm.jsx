import React, { useEffect, useState } from 'react';

const today = new Date().toISOString().slice(0, 10);

export default function TransaccionForm({
  initialValues = {},
  categorias = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    tipo: 'gasto',
    naturaleza: 'variable',
    fecha: today,
    categoriaId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      descripcion: initialValues.descripcion || '',
      monto: initialValues.monto ?? '',
      tipo: initialValues.tipo || 'gasto',
      naturaleza: initialValues.naturaleza || 'variable',
      fecha: initialValues.fecha ? String(initialValues.fecha).slice(0, 10) : today,
      categoriaId: initialValues.categoriaId ? String(initialValues.categoriaId) : '',
    });
    setError('');
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    if (form.descripcion.trim().length < 2) {
      setError('La descripción debe tener al menos 2 caracteres');
      return;
    }

    if (!form.monto || Number(form.monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!form.fecha) {
      setError('La fecha es obligatoria');
      return;
    }

    await onSubmit({
      descripcion: form.descripcion.trim(),
      monto: Number(form.monto),
      tipo: form.tipo,
      naturaleza: form.naturaleza,
      fecha: form.fecha,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {initialValues?.id ? 'Editar transacción' : 'Nueva transacción'}
          </h3>
          <p className="text-sm text-gray-500">Carga ingresos o gastos con categoría opcional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Sueldo, Supermercado, Netflix"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Naturaleza</label>
          <select
            name="naturaleza"
            value={form.naturaleza}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="variable">Variable</option>
            <option value="fijo">Fijo</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Categoría</label>
          <select
            name="categoriaId"
            value={form.categoriaId}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}