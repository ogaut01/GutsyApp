import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ChevronDown,DollarSign, Plus, ArrowUpRight, ArrowDownRight,
  Clock, ShieldCheck, X, AlertTriangle, FileText, ShoppingBag, Trash2, Calendar
} from 'lucide-react';
import {
  fetchDashboardStats, fetchGastos, createGasto,
  fetchVentas, deleteVenta
} from '../services/api';

export default function DashboardView({ onActionSuccess }) {
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal para agregar gasto
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [categoriaGasto, setCategoriaGasto] = useState('ADS');
  const [montoGasto, setMontoGasto] = useState('');
  const [descGasto, setDescGasto] = useState('');
  const [savingGasto, setSavingGasto] = useState(false);

  // Modal/Confirmación de Anulación
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voiding, setVoiding] = useState(false);

  // Venta expandida
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, gastosData, ventasData] = await Promise.all([
        fetchDashboardStats(),
        fetchGastos(),
        fetchVentas(),
      ]);
      setStats(statsData);
      setGastos(gastosData);
      setVentas(ventasData);
    } catch (err) {
      console.error('Error cargando métricas y ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGasto = async (e) => {
    e.preventDefault();
    if (!montoGasto || !descGasto) return;
    setSavingGasto(true);

    try {
      await createGasto({
        categoria: categoriaGasto,
        monto_pyg: parseInt(montoGasto),
        descripcion: descGasto,
      });
      setShowGastoModal(false);
      setMontoGasto('');
      setDescGasto('');
      loadData();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al registrar gasto: ' + err.message);
    } finally {
      setSavingGasto(false);
    }
  };

  const handleVoidSale = async () => {
    if (!saleToVoid) return;
    setVoiding(true);
    try {
      await deleteVenta(saleToVoid.id);
      setSaleToVoid(null);
      loadData();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al anular la venta: ' + err.message);
    } finally {
      setVoiding(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="text-center py-20 text-zinc-500 text-xs">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Cargando resumen de negocio...
      </div>
    );
  }

  const fin = stats.resumen_financiero;

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-5">
      {/* ── 1. Tarjeta Principal: Utilidad Neta ── */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Utilidad Neta Real
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
            Mes Actual
          </span>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-4">
          Gs. {fin.utilidad_neta_mes_pyg?.toLocaleString('es-PY')}
        </h2>

        {/* Desglose */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px]">Ventas</span>
            <span className="font-bold text-white">Gs. {fin.total_ventas_mes_pyg?.toLocaleString('es-PY')}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Margen Bruto</span>
            <span className="font-bold text-emerald-400">Gs. {fin.ganancia_bruta_mes_pyg?.toLocaleString('es-PY')}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Gastos</span>
            <span className="font-bold text-rose-400">- Gs. {fin.total_gastos_mes_pyg?.toLocaleString('es-PY')}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Sección: Historial de Ventas & POS ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            Últimas Ventas Realizadas
          </h3>
          <span className="text-[10px] text-zinc-500">{ventas.length} cobros</span>
        </div>

        <div className="space-y-2">
          {ventas.slice(0, 10).map((v) => {
            const isExpanded = expandedSaleId === v.id;
            const fechaFormateada = new Date(v.fecha_venta).toLocaleDateString('es-PY', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={v.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 space-y-2"
              >
                <div
                  onClick={() => setExpandedSaleId(isExpanded ? null : v.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Venta #{v.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 font-semibold">
                        {v.metodo_pago_display}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fechaFormateada}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="font-black text-emerald-400 text-xs block">
                        Gs. {v.total_cobrado?.toLocaleString('es-PY')}
                      </span>
                      <span className="text-[9px] text-zinc-500 block">
                        Ganancia: +Gs. {v.ganancia_real?.toLocaleString('es-PY')}
                      </span>
                    </div>
                    <span className="text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Detalles desplegables con botón Anular */}
                {isExpanded && (
                  <div className="pt-2 border-t border-zinc-800 text-xs space-y-2.5 animate-in fade-in-50">
                    {/* Lista de accesorios comprados */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Detalle del Pedido:</span>
                      {v.detalles?.map((det, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-300 bg-zinc-950 p-2 rounded-lg">
                          <span>
                            {det.variante_info?.producto_nombre} ({det.variante_info?.color} / {det.variante_info?.talle_medida}) x{det.cantidad}
                          </span>
                          <span className="font-semibold text-zinc-200">
                            Gs. {det.subtotal?.toLocaleString('es-PY')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Información de cliente */}
                    {(v.cliente_nombre || v.cliente_telefono) && (
                      <div className="bg-zinc-950 p-2 rounded-lg text-zinc-400 space-y-0.5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Cliente:</span>
                        {v.cliente_nombre && <p className="text-zinc-300">{v.cliente_nombre}</p>}
                        {v.cliente_telefono && <p className="text-zinc-300">{v.cliente_telefono}</p>}
                      </div>
                    )}

                    {/* Botón anular */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSaleToVoid(v)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Anular e Incrementar Stock
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {ventas.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-900">
              No hay ventas registradas aún. ¡Abre la pestaña Vender para empezar!
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Sección: Gastos Operativos ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-rose-500" />
            Gastos de Pauta & Packaging
          </h3>
          <button
            onClick={() => setShowGastoModal(true)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Gasto
          </button>
        </div>

        {/* Lista Gastos */}
        <div className="space-y-2">
          {gastos.slice(0, 5).map((g) => (
            <div
              key={g.id}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between text-xs"
            >
              <div>
                <span className="text-[9px] font-bold text-amber-500 uppercase block">
                  {g.categoria_display}
                </span>
                <p className="font-semibold text-zinc-200">{g.descripcion}</p>
                <span className="text-[9px] text-zinc-500">{g.fecha}</span>
              </div>
              <span className="font-black text-rose-400 text-sm">
                - Gs. {g.monto_pyg?.toLocaleString('es-PY')}
              </span>
            </div>
          ))}

          {gastos.length === 0 && (
            <div className="text-center py-6 text-zinc-600 text-xs">
              No hay gastos registrados este mes.
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Registrar Gasto
      ══════════════════════════════════════════════════════ */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-white">Registrar Gasto Operativo</h3>
              <button
                onClick={() => setShowGastoModal(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGasto} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Categoría del Gasto:</label>
                <select
                  value={categoriaGasto}
                  onChange={(e) => setCategoriaGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="ADS">📢 Publicidad y Meta Ads</option>
                  <option value="EMP">📦 Packaging (Bolsitas, cajas)</option>
                  <option value="ENV">🛵 Delivery y Envíos</option>
                  <option value="POS">💳 Comisiones POS / Tarjetas</option>
                  <option value="INS">💎 Insumos de Tienda</option>
                  <option value="VAR">📋 Otros Gastos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Monto en Guaraníes (Gs.):</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 150000"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Descripción / Proveedor:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pauta Instagram Anillos Acero"
                  value={descGasto}
                  onChange={(e) => setDescGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingGasto}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingGasto ? 'Guardando...' : 'REGISTRAR GASTO'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmar Anulación de Venta
      ══════════════════════════════════════════════════════ */}
      {saleToVoid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">¿Anular Venta #{saleToVoid.id}?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Se anulará el cobro de <b className="text-zinc-200">Gs. {saleToVoid.total_cobrado?.toLocaleString('es-PY')}</b>. Las unidades de stock volverán al inventario de inmediato. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSaleToVoid(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleVoidSale}
                disabled={voiding}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                {voiding ? 'Anulando...' : 'Sí, anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
