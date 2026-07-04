import React, { useEffect, useState } from 'react';

export default function CategoriaForm({
  initialValues = { nombre: '' },
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [nombre, setNombre] = useState(initialValues.nombre || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setNombre(initialValues.nombre || '');
    setError('');
  }, [initialValues]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre es obligatorio');
      return;
    }

    if (nombreLimpio.length < 2) {
      setError('Debe tener al menos 2 caracteres');
      return;
    }

    await onSubmit({ nombre: nombreLimpio });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {initialValues?.id ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          <p className="text-sm text-gray-500">Usa nombres cortos y claros.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Alquiler, Comida, Transporte"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

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