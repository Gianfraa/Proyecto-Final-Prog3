import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import TransaccionForm from '../components/common/TransaccionForm';
import TransaccionList from '../components/common/TransaccionList';
import {
  createTransaccion,
  deleteTransaccion,
  getHistorial,
  getTransacciones,
  updateTransaccion,
} from '../services/transaccionService';
import { getCategorias } from '../services/categoriaService';

const initialFilters = {
  tipo: '',
  categoria: '',
  desde: '',
  hasta: '',
};

export default function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [filterDraft, setFilterDraft] = useState(initialFilters);

  const cargarCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudieron cargar las categorías');
    }
  };

  const cargarDatos = async (currentFilters = filters, currentPage = page) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (currentFilters.tipo) params.tipo = currentFilters.tipo;
      if (currentFilters.categoria) params.categoria = currentFilters.categoria;
      if (currentFilters.desde) params.desde = currentFilters.desde;
      if (currentFilters.hasta) params.hasta = currentFilters.hasta;

      const [transaccionesResponse, historialResponse] = await Promise.all([
        getTransacciones(params),
        getHistorial(),
      ]);

      setTransacciones(transaccionesResponse.data || []);
      setMeta(transaccionesResponse.meta || null);
      setHistorial(historialResponse.historial || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [filters, page]);

  const handleNew = () => {
    setEditingTransaccion(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaccion) => {
    setEditingTransaccion(transaccion);
    setIsFormOpen(true);
  };

  const handleDelete = async (transaccion) => {
    const ok = window.confirm(`¿Eliminar la transacción "${transaccion.descripcion}"?`);
    if (!ok) return;

    try {
      await deleteTransaccion(transaccion.id);
      toast.success('Transacción eliminada');
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la transacción');
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (editingTransaccion?.id) {
        await updateTransaccion(editingTransaccion.id, values);
        toast.success('Transacción actualizada');
      } else {
        await createTransaccion(values);
        toast.success('Transacción creada');
      }

      setIsFormOpen(false);
      setEditingTransaccion(null);
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo guardar la transacción');
    } finally {
      setSaving(false);
    }
  };

  const aplicarFiltros = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...filterDraft });
  };

  const limpiarFiltros = () => {
    setFilterDraft(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transacciones</h2>
          <p className="text-sm text-gray-500">
            Gestiona ingresos y gastos, con filtros por tipo, categoría y fecha.
          </p>
        </div>

        <button
          onClick={handleNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Nueva transacción
        </button>
      </div>

      <form onSubmit={aplicarFiltros} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDraft.tipo}
              onChange={(e) => setFilterDraft((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDraft.categoria}
              onChange={(e) => setFilterDraft((prev) => ({ ...prev, categoria: e.target.value }))}
            >
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Desde</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDraft.desde}
              onChange={(e) => setFilterDraft((prev) => ({ ...prev, desde: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Hasta</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDraft.hasta}
              onChange={(e) => setFilterDraft((prev) => ({ ...prev, hasta: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      <TransaccionList
        transacciones={transacciones}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {meta && meta.totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-600">
            Página {meta.pagina} de {meta.totalPaginas} · {meta.total} registros
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.pagina <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={meta.pagina >= meta.totalPaginas}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <TransaccionForm
          initialValues={editingTransaccion || {}}
          categorias={categorias}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTransaccion(null);
          }}
          loading={saving}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Historial mensual</h3>
          <p className="text-sm text-gray-500">Resumen agrupado por mes, según ingresos y gastos.</p>
        </div>

        {historial.length === 0 ? (
          <div className="text-sm text-gray-500">No hay datos en el historial.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {historial.map((item) => (
              <div key={item.mes} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.mes}</h4>
                    <p className="text-xs text-gray-500">Balance mensual</p>
                  </div>
                  <div className={`text-sm font-semibold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.balance >= 0 ? '+' : ''}
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.balance)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-xs text-green-700">Ingresos</div>
                    <div className="font-semibold text-green-900">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.ingresos)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="text-xs text-red-700">Gastos</div>
                    <div className="font-semibold text-red-900">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.gastos)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-700">Movimientos</div>
                    <div className="font-semibold text-gray-900">
                      {item.cantidadIngresos + item.cantidadGastos}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}