import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Search, Calendar, DollarSign, MessageCircle, Trash2,
  ChevronDown, ChevronUp, AlertTriangle, X, Sparkles, Filter,
  ShoppingBag, CheckCircle2, Phone, User, QrCode, Banknote,
  Smartphone, Building2, CreditCard, ArrowUpRight
} from 'lucide-react';
import { fetchVentas, deleteVenta } from '../services/api';

const METODOS_PAGO = [
  { id: 'ALL', label: 'Todos los pagos' },
  { id: 'QRD', label: 'QR Débito', icon: QrCode },
  { id: 'QRC', label: 'QR Crédito', icon: QrCode },
  { id: 'EF', label: 'Efectivo', icon: Banknote },
  { id: 'GT', label: 'Giros Tigo', icon: Smartphone },
  { id: 'TR', label: 'SIPAP / Transferencia', icon: Building2 },
  { id: 'TD', label: 'Tarjeta Débito', icon: CreditCard },
  { id: 'TC', label: 'Tarjeta Crédito', icon: CreditCard },
];

export default function SalesHistoryView({ onReload, onNavigateToPos }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('30d'); // 'hoy', '7d', '30d', 'all'
  
  // Modal Anulación de venta
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voiding, setVoiding] = useState(false);

  // Venta expandida
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchVentas();
      setVentas(data || []);
    } catch (err) {
      console.error('Error cargando historial de ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVoidSale = async () => {
    if (!saleToVoid) return;
    setVoiding(true);
    try {
      await deleteVenta(saleToVoid.id);
      setSaleToVoid(null);
      await loadData();
      if (onReload) onReload();
    } catch (err) {
      alert('Error al anular venta: ' + err.message);
    } finally {
      setVoiding(false);
    }
  };

  // Generar comprobante WhatsApp
  const generateWhatsAppReceipt = (v) => {
    let msg = `*COMPROBANTE DE COMPRA — GUTSY ACCESORIOS* 💎\n`;
    msg += `--------------------------------------\n`;
    const f = new Date(v.fecha_venta);
    msg += `📅 Fecha: ${f.toLocaleDateString('es-PY')} ${f.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (v.cliente_nombre) msg += `👤 Cliente: ${v.cliente_nombre}\n`;
    msg += `💳 Pago: ${v.metodo_pago_display || v.metodo_pago}\n`;
    if (v.notas) msg += `✍️ Notas: ${v.notas}\n`;
    msg += `--------------------------------------\n`;
    (v.detalles || []).forEach((it, i) => {
      msg += `${i + 1}. *${it.variante_info?.producto_nombre || 'Accesorio'}*\n`;
      msg += `   (${it.variante_info?.color || 'Único'} - ${it.variante_info?.talle_medida || 'Ajustable'}) x${it.cantidad}\n`;
      msg += `   Gs. ${(it.subtotal || 0).toLocaleString('es-PY')}\n`;
    });
    msg += `--------------------------------------\n`;
    msg += `*TOTAL PAGADO: Gs. ${(v.total_cobrado || 0).toLocaleString('es-PY')}*\n\n`;
    msg += `¡Muchas gracias por tu compra! ✨`;
    return encodeURIComponent(msg);
  };

  const getWhatsAppUrl = (v) => {
    const text = generateWhatsAppReceipt(v);
    const phone = v.cliente_telefono || v.cliente_info?.telefono;
    if (phone) {
      let clean = phone.replace(/[^\d+]/g, '');
      if (clean.startsWith('0')) clean = '595' + clean.slice(1);
      else if (!clean.startsWith('+') && !clean.startsWith('595')) clean = '595' + clean;
      clean = clean.replace('+', '');
      return `https://wa.me/${clean}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  };

  // Filtrado de ventas
  const filtered = useMemo(() => {
    const now = new Date();
    const term = searchTerm.trim().toLowerCase();

    return ventas.filter((v) => {
      // Filtro de texto
      const matchesSearch = !term ||
        v.id?.toString().includes(term) ||
        v.cliente_nombre?.toLowerCase().includes(term) ||
        v.cliente_telefono?.toLowerCase().includes(term) ||
        v.notas?.toLowerCase().includes(term) ||
        v.detalles?.some(d =>
          d.variante_info?.producto_nombre?.toLowerCase().includes(term) ||
          d.variante_info?.sku?.toLowerCase().includes(term) ||
          d.variante_info?.color?.toLowerCase().includes(term)
        );

      if (!matchesSearch) return false;

      // Filtro de método de pago
      if (selectedMethod !== 'ALL' && v.metodo_pago !== selectedMethod) {
        return false;
      }

      // Filtro de fecha
      if (dateFilter !== 'all') {
        const saleDate = new Date(v.fecha_venta);
        const diffDays = (now - saleDate) / (1000 * 60 * 60 * 24);

        if (dateFilter === 'hoy' && saleDate.toDateString() !== now.toDateString()) {
          return false;
        }
        if (dateFilter === '7d' && diffDays > 7) {
          return false;
        }
        if (dateFilter === '30d' && diffDays > 30) {
          return false;
        }
      }

      return true;
    });
  }, [ventas, searchTerm, selectedMethod, dateFilter]);

  // Cálculos agregados del período filtrado
  const totalFacturado = filtered.reduce((acc, v) => acc + (v.total_cobrado || 0), 0);
  const totalGanancia = filtered.reduce((acc, v) => acc + (v.ganancia_real || 0), 0);
  const totalItemsVendidos = filtered.reduce((acc, v) => acc + (v.detalles?.reduce((s, d) => s + d.cantidad, 0) || 0), 0);
  const ticketPromedio = filtered.length > 0 ? Math.round(totalFacturado / filtered.length) : 0;

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-black dark:text-white" />
            Historial de Ventas & Pedidos
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Mostrando <b className="text-stone-900 dark:text-white">{filtered.length}</b> de {ventas.length} ventas registradas
          </p>
        </div>
        {onNavigateToPos && (
          <button
            onClick={onNavigateToPos}
            className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Nueva Venta</span>
          </button>
        )}
      </div>

      {/* ── Tarjetas de Resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Facturado */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            Total Cobrado
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {totalFacturado.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">{filtered.length} pedidos</p>
          </div>
        </div>

        {/* Ganancia Real */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Ganancia Bruta
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              +Gs. {totalGanancia.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">
              {totalFacturado > 0 ? `${Math.round((totalGanancia / totalFacturado) * 100)}% margen` : '—'}
            </p>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            Ticket Promedio
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {ticketPromedio.toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">Por compra</p>
          </div>
        </div>

        {/* Unidades Vendidas */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-1 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            Unidades
          </span>
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 dark:text-white truncate">
              {totalItemsVendidos} u.
            </h3>
            <p className="text-[9px] text-stone-400 dark:text-zinc-500">
              {filtered.length > 0 ? `${(totalItemsVendidos / filtered.length).toFixed(1)} u./pedido` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, accesorio, teléfono o nota... (Esc para limpiar)"
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

        {/* Filtro de Fechas */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: '7d', label: '7 Días' },
              { id: '30d', label: '30 Días' },
              { id: 'all', label: 'Todo el Historial' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  dateFilter === d.id
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Selector de Método de Pago */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-white border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none"
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Lista de Ventas ── */}
      {loading && ventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs">
          <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-2" />
          <span>Cargando ventas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-stone-300 dark:text-zinc-700" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {searchTerm ? 'No se encontraron ventas con ese criterio' : 'Sin ventas en este período'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Probá cambiando el filtro de fecha o buscando otro término.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const isExpanded = expandedSaleId === v.id;
            const waUrl = getWhatsAppUrl(v);
            const totalUnitsInSale = v.detalles?.reduce((s, d) => s + d.cantidad, 0) || 0;

            return (
              <div
                key={v.id}
                className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 transition hover:border-neutral-300 dark:hover:border-zinc-700"
              >
                {/* ── Fila Principal ── */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-black dark:text-white px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800">
                        #{v.id}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                        {new Date(v.fecha_venta).toLocaleDateString('es-PY', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-stone-900 dark:text-white text-[10px] font-bold">
                        {v.metodo_pago_display || v.metodo_pago}
                      </span>
                      {v.cliente_nombre && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {v.cliente_nombre}
                        </span>
                      )}
                    </div>

                    {/* Resumen rápido de artículos */}
                    <div className="text-xs text-stone-600 dark:text-zinc-300 line-clamp-1">
                      {v.detalles?.map((d, idx) => (
                        <span key={d.id}>
                          {idx > 0 && ', '}
                          <b>{d.cantidad}x</b> {d.variante_info?.producto_nombre || 'Accesorio'} ({d.variante_info?.color})
                        </span>
                      ))}
                    </div>

                    {v.notas && (
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 italic truncate">
                        "{v.notas}"
                      </p>
                    )}
                  </div>

                  {/* ── Monto y Acciones ── */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-white block">
                        Gs. {(v.total_cobrado || 0).toLocaleString('es-PY')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        +Gs. {(v.ganancia_real || 0).toLocaleString('es-PY')} ganancia
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
                        title="Reenviar comprobante por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      </a>

                      <button
                        onClick={() => setSaleToVoid(v)}
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        title="Anular venta (Devolver stock)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedSaleId(isExpanded ? null : v.id)}
                        className={`p-2 rounded-xl border border-neutral-200 dark:border-zinc-800 transition ${
                          isExpanded
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800'
                        }`}
                        title="Ver detalle del pedido"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Detalle de Ítems Desplegable ── */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-zinc-800 space-y-2 text-xs animate-in fade-in-50">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-stone-500 dark:text-zinc-400 block">
                      Artículos incluidos ({totalUnitsInSale} unidades):
                    </span>

                    <div className="space-y-1.5">
                      {v.detalles?.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-800/80"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-black text-stone-900 dark:text-white">{d.cantidad}x</span>
                            <div>
                              <span className="font-bold text-stone-900 dark:text-white block">
                                {d.variante_info?.producto_nombre || 'Accesorio'}
                              </span>
                              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                                {d.variante_info?.color} • {d.variante_info?.talle_medida} • SKU: {d.variante_info?.sku}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-stone-900 dark:text-white block">
                              Gs. {(d.subtotal || 0).toLocaleString('es-PY')}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                              (Gs. {(d.precio_unitario || 0).toLocaleString('es-PY')} c/u)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {v.cliente_telefono && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-500">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>Teléfono / WhatsApp: <b className="text-stone-900 dark:text-white">{v.cliente_telefono}</b></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmar Anulación de Venta
      ══════════════════════════════════════════════════════ */}
      {saleToVoid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 border-rose-500/30 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                ¿Anular Venta #{saleToVoid.id}?
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Esta acción devolverá automáticamente las <b>{saleToVoid.detalles?.reduce((s, d) => s + d.cantidad, 0)} unidades</b> al stock disponible y descontará <b>Gs. {saleToVoid.total_cobrado?.toLocaleString('es-PY')}</b> de la facturación.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToVoid(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVoidSale}
                disabled={voiding}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {voiding ? 'Anulando...' : 'Sí, Anular y Devolver Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
