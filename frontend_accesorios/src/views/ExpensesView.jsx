import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Plus, DollarSign, Search, Calendar, Tag, Trash2, Pencil,
  X, AlertTriangle, Filter, ChevronRight, TrendingDown, Layers
} from 'lucide-react';
import { fetchGastos, createGasto, deleteGasto } from '../services/api';
import { formatGsInput, parseGsInput } from '../currency';

const CATEGORIAS_GASTO = [
  { id: 'ADS', label: '📢 Publicidad & Meta Ads (Instagram/TikTok)', short: 'Meta Ads' },
  { id: 'ENV', label: '🛵 Delivery & Envíos Locales / Interior', short: 'Delivery & Envíos' },
  { id: 'EMP', label: '📦 Packaging & Empaque (Bolsas, cajas, cintas)', short: 'Packaging' },
  { id: 'INS', label: '💎 Insumos de Tienda & Exhibidores', short: 'Insumos' },
  { id: 'POS', label: '💳 Comisiones POS / Bancarias', short: 'Comisiones' },
  { id: 'VAR', label: '📋 Otros Gastos Operativos', short: 'Varios' },
];

export default function ExpensesView({ onReload }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal Crear / Editar Gasto
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    categoria: 'ADS',
    monto_pyg: '',
    descripcion: '',
    comprobante: '',
    fecha: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  // Modal Confirmar Eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchGastos();
      setGastos(data || []);
    } catch (err) {
      console.error('Error cargando gastos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      categoria: 'ADS',
      monto_pyg: '',
      descripcion: '',
      comprobante: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.monto_pyg || !formData.descripcion.trim()) {
      alert('Completá el monto y la descripción del gasto');
      return;
    }
    setSaving(true);
    try {
      await createGasto({
        categoria: formData.categoria,
        monto_pyg: parseGsInput(formData.monto_pyg),
        descripcion: formData.descripcion.trim(),
        comprobante: formData.comprobante.trim() || undefined,
        fecha: formData.fecha || undefined,
      });

      setShowModal(false);
      await loadData();
      if (onReload) onReload();
    } catch (err) {
      alert('Error al registrar gasto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteGasto(confirmDelete.id);
      setConfirmDelete(null);
      await loadData();
      if (onReload) onReload();
    } catch (err) {
      alert('Error al eliminar gasto: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filtrado de gastos
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return gastos.filter((g) => {
      const matchesSearch = !term ||
        g.descripcion?.toLowerCase().includes(term) ||
        g.comprobante?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (selectedCategory !== 'ALL' && g.categoria !== selectedCategory) return false;
      return true;
    });
  }, [gastos, searchTerm, selectedCategory]);

  const totalGastos = filtered.reduce((acc, g) => acc + (g.monto_pyg || 0), 0);
  const totalAds = filtered.filter(g => g.categoria === 'ADS').reduce((acc, g) => acc + (g.monto_pyg || 0), 0);
  const totalEnvios = filtered.filter(g => g.categoria === 'ENV').reduce((acc, g) => acc + (g.monto_pyg || 0), 0);
  const totalEmpaques = filtered.filter(g => g.categoria === 'EMP').reduce((acc, g) => acc + (g.monto_pyg || 0), 0);

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-black dark:text-white" />
            Control de Gastos Operativos
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Mostrando <b className="text-stone-900 dark:text-white">{filtered.length}</b> de {gastos.length} gastos registrados
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* ── Tarjetas de Resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Gastos */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Total Egresos
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 truncate">
              Gs. {totalGastos.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">{filtered.length} registros</p>
          </div>
        </div>

        {/* Publicidad Meta Ads */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            📢 Meta Ads
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {totalAds.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">
              {totalGastos > 0 ? `${Math.round((totalAds / totalGastos) * 100)}% del total` : '—'}
            </p>
          </div>
        </div>

        {/* Delivery & Envíos */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            🛵 Delivery
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {totalEnvios.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">
              {totalGastos > 0 ? `${Math.round((totalEnvios / totalGastos) * 100)}% del total` : '—'}
            </p>
          </div>
        </div>

        {/* Packaging */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            📦 Packaging
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {totalEmpaques.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">
              {totalGastos > 0 ? `${Math.round((totalEmpaques / totalGastos) * 100)}% del total` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador y Categorías ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por concepto o comprobante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl text-sm placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-white rounded-full transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros por Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
            }`}
          >
            Todos ({gastos.length})
          </button>
          {CATEGORIAS_GASTO.map((c) => {
            const count = gastos.filter(g => g.categoria === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === c.id
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
                }`}
              >
                {c.short} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista de Gastos ── */}
      {loading && gastos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs">
          <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-2" />
          <span>Cargando gastos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-stone-300 dark:text-zinc-700" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {searchTerm ? 'No se encontraron gastos con ese criterio' : 'Sin gastos registrados'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Registrá tus gastos operativos para calcular tu ganancia neta real a fin de mes.
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primer Gasto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition hover:border-neutral-300 dark:hover:border-zinc-700"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-[10px] font-bold text-stone-700 dark:text-zinc-300">
                    {g.categoria_display || g.categoria}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-zinc-500">
                    {new Date(g.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {g.comprobante && (
                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                      Nro: {g.comprobante}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                  {g.descripcion}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                  -Gs. {(g.monto_pyg || 0).toLocaleString('es-PY')}
                </span>

                <button
                  onClick={() => setConfirmDelete(g)}
                  className="p-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  title="Eliminar gasto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Registrar Gasto
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black dark:text-white" />
                Registrar Gasto Operativo
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Categoría de Gasto *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                >
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Monto en Guaraníes (Gs.) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Ej: 50000"
                  value={formData.monto_pyg}
                  onChange={(e) => setFormData(f => ({ ...f, monto_pyg: formatGsInput(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Descripción / Concepto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 50 Bolsitas de Pana, Campaña Meta Ads 3 días"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Fecha del Gasto
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Nro. Comprobante / Recibo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: F-1029 (Opcional)"
                    value={formData.comprobante}
                    onChange={(e) => setFormData(f => ({ ...f, comprobante: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-bold rounded-xl text-xs disabled:opacity-50 transition"
                >
                  {saving ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmar Eliminación de Gasto
      ══════════════════════════════════════════════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 border-rose-500/30 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                ¿Eliminar este gasto?
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5">
                Se eliminará el registro de <b>{confirmDelete.descripcion}</b> por <b>Gs. {confirmDelete.monto_pyg?.toLocaleString('es-PY')}</b>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
