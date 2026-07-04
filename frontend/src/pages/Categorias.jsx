import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CategoriaForm from '../components/common/CategoriaForm';
import {
  createCategoria,
  deleteCategoria,
  getCategorias,
  updateCategoria,
} from '../services/categoriaService';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleNew = () => {
    setEditingCategoria(null);
    setIsFormOpen(true);
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setIsFormOpen(true);
  };

  const handleDelete = async (categoria) => {
    const ok = window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`);
    if (!ok) return;

    try {
      await deleteCategoria(categoria.id);
      toast.success('Categoría eliminada');
      await cargarCategorias();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la categoría');
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (editingCategoria?.id) {
        await updateCategoria(editingCategoria.id, values);
        toast.success('Categoría actualizada');
      } else {
        await createCategoria(values);
        toast.success('Categoría creada');
      }
      setIsFormOpen(false);
      setEditingCategoria(null);
      await cargarCategorias();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <p className="text-sm text-gray-500">Gestiona las categorías disponibles para tus transacciones.</p>
        </div>

        <button
          onClick={handleNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Nueva categoría
        </button>
      </div>

      {isFormOpen && (
        <CategoriaForm
          initialValues={editingCategoria || { nombre: '' }}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCategoria(null);
          }}
          loading={saving}
        />
      )}

      <div className="text-sm text-gray-500">
        Podés crear, editar y eliminar categorías desde esta misma pantalla.
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Cargando categorías...</div>
        ) : categorias.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No hay categorías cargadas.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{categoria.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(categoria)}
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
        )}
      </div>
    </div>
  );
}