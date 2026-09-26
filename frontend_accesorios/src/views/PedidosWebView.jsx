import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Search, CheckCircle2, XCircle, Clock, Truck,
  MapPin, Phone, MessageCircle, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, Check, X, ShieldAlert, Sparkles
} from 'lucide-react';
import { fetchPedidosWeb, confirmarPedidoWeb, cancelarPedidoWeb } from '../services/api';
import { formatGsInput } from '../currency';

export default function PedidosWebView({ onReloadParent }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('PENDIENTE'); // 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'ALL'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Acciones
  const [actionLoading, setActionLoading] = useState(null); // id del pedido que se está procesando
  const [confirmModal, setConfirmModal] = useState(null); // pedido a confirmar
  const [cancelModal, setCancelModal] = useState(null); // pedido a cancelar
  const [metodoPagoVenta, setMetodoPagoVenta] = useState('TR');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await fetchPedidosWeb();
      setPedidos(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Error cargando pedidos web:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const handleConfirmar = async () => {
    if (!confirmModal) return;
    try {
      setActionLoading(confirmModal.id);
      const res = await confirmarPedidoWeb(confirmModal.id, metodoPagoVenta);
      setFeedback({ type: 'success', text: `✅ Pedido #${confirmModal.id} confirmado. Venta registrada y stock descontado.` });
      setConfirmModal(null);
      await loadPedidos();
      if (onReloadParent) onReloadParent();
    } catch (err) {
      setFeedback({ type: 'error', text: `❌ Error: ${err.message}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleCancelar = async () => {
    if (!cancelModal) return;
    try {
      setActionLoading(cancelModal.id);
      await cancelarPedidoWeb(cancelModal.id);
      setFeedback({ type: 'success', text: `Pedido #${cancelModal.id} cancelado.` });
      setCancelModal(null);
      await loadPedidos();
    } catch (err) {
      setFeedback({ type: 'error', text: `❌ Error: ${err.message}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      const matchEstado = filterEstado === 'ALL' || p.estado === filterEstado;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        p.cliente_nombre?.toLowerCase().includes(term) ||
        p.cliente_telefono?.includes(term) ||
        p.cliente_ciudad?.toLowerCase().includes(term) ||
        String(p.id).includes(term);
      return matchEstado && matchSearch;
    });
  }, [pedidos, filterEstado, searchTerm]);

  const pendientesCount = useMemo(() => {
    return pedidos.filter(p => p.estado === 'PENDIENTE').length;
  }, [pedidos]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
              Pedidos Web (WhatsApp)
            </h1>
            {pendientesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-black animate-pulse">
                {pendientesCount} {pendientesCount === 1 ? 'pendiente' : 'pendientes'}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Revisá los pedidos recibidos desde la tienda. Al confirmar, el stock se descuenta automáticamente.
          </p>
        </div>

        <button
          onClick={loadPedidos}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Pills de estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'PENDIENTE', label: 'Pendientes', count: pendientesCount },
            { id: 'CONFIRMADO', label: 'Confirmados' },
            { id: 'CANCELADO', label: 'Cancelados' },
            { id: 'ALL', label: 'Todos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterEstado(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterEstado === f.id
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              {f.count !== undefined && f.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, tel, ciudad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-black dark:focus:border-white"
          />
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Cargando pedidos web...
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <ShoppingBag className="w-10 h-10 stroke-[1.2] mx-auto mb-2 text-zinc-400" />
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            No hay pedidos en esta sección
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPedidos.map(pedido => {
            const isExpanded = expandedId === pedido.id;
            const isPendiente = pedido.estado === 'PENDIENTE';
            const isConfirmado = pedido.estado === 'CONFIRMADO';
            const isCancelado = pedido.estado === 'CANCELADO';

            return (
              <div
                key={pedido.id}
                className={`bg-white dark:bg-zinc-950 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isPendiente
                    ? 'border-amber-400/40 dark:border-amber-500/30 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Cabecera de la tarjeta */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  {/* Info básica */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isPendiente && <Clock className="w-4 h-4 text-amber-500" />}
                      {isConfirmado && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {isCancelado && <XCircle className="w-4 h-4 text-zinc-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold">#{pedido.id}</span>
                        <span className="font-black text-sm">{pedido.cliente_nombre}</span>
                        {/* Badge de estado */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPendiente
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : isConfirmado
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                        >
                          {pedido.estado_display}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                        <span>{new Date(pedido.fecha_pedido).toLocaleString('es-PY')}</span>
                        <span>·</span>
                        <span>{pedido.tipo_envio_display}</span>
                        {pedido.cliente_ciudad && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pedido.cliente_ciudad}
                            </span>
                          </>
                        )}
                        {pedido.cliente_telefono && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {pedido.cliente_telefono}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monto y Botones */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-900">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total</span>
                      <span className="font-mono font-black text-sm sm:text-base">
                        Gs. {formatGsInput(pedido.total_pedido)}
                      </span>
                    </div>

                    {isPendiente && (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setConfirmModal(pedido)}
                          disabled={actionLoading === pedido.id}
                          className="px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-black transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          onClick={() => setCancelModal(pedido)}
                          disabled={actionLoading === pedido.id}
                          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-rose-500 transition"
                          title="Cancelar pedido"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Detalle Expandido */}
                {isExpanded && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    {/* Datos de envío completos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {pedido.cliente_ci && (
                        <div>
                          <span className="text-zinc-400 font-bold block text-[10px] uppercase">C.I. / RUC</span>
                          <span className="font-mono">{pedido.cliente_ci}</span>
                        </div>
                      )}
                      {pedido.cliente_telefono && (
                        <div>
                          <span className="text-zinc-400 font-bold block text-[10px] uppercase">WhatsApp</span>
                          <a
                            href={`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {pedido.cliente_telefono}
                          </a>
                        </div>
                      )}
                      {pedido.cliente_ciudad && (
                        <div>
                          <span className="text-zinc-400 font-bold block text-[10px] uppercase">Ciudad</span>
                          <span>{pedido.cliente_ciudad}</span>
                        </div>
                      )}
                      {pedido.cliente_direccion && (
                        <div className="sm:col-span-2">
                          <span className="text-zinc-400 font-bold block text-[10px] uppercase">Dirección / Sucursal</span>
                          <span>{pedido.cliente_direccion}</span>
                        </div>
                      )}
                    </div>

                    {pedido.notas && (
                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs">
                        <span className="font-bold text-amber-500 block text-[10px] uppercase">Nota del cliente:</span>
                        <span>{pedido.notas}</span>
                      </div>
                    )}

                    {/* Ítems del pedido */}
                    <div>
                      <span className="text-zinc-400 font-bold block text-[10px] uppercase mb-2">
                        Productos ({pedido.detalles?.length || 0})
                      </span>
                      <div className="space-y-2">
                        {pedido.detalles?.map(det => (
                          <div
                            key={det.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {det.imagen_url && (
                                <img
                                  src={det.imagen_url}
                                  alt={det.nombre_producto}
                                  className="w-10 h-10 rounded-lg object-cover bg-zinc-100"
                                />
                              )}
                              <div>
                                <span className="font-bold block">{det.nombre_producto}</span>
                                <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                                  {det.variante_color && <span>Color: {det.variante_color}</span>}
                                  {det.variante_talle && <span>· Talle: {det.variante_talle}</span>}
                                </div>
                                {det.grabado_texto && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                    Grabado: "{det.grabado_texto}"
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono text-zinc-500 text-[11px] block">
                                {det.cantidad} un. x Gs. {formatGsInput(det.precio_unitario)}
                              </span>
                              <span className="font-mono font-bold">
                                Gs. {formatGsInput(det.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desglose de totales */}
                    <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="w-64 space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-500">
                          <span>Subtotal:</span>
                          <span className="font-mono">Gs. {formatGsInput(pedido.subtotal_productos)}</span>
                        </div>
                        {pedido.costo_envio > 0 && (
                          <div className="flex justify-between text-zinc-500">
                            <span>Delivery:</span>
                            <span className="font-mono">Gs. {formatGsInput(pedido.costo_envio)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-200 dark:border-zinc-800">
                          <span>Total:</span>
                          <span className="font-mono">Gs. {formatGsInput(pedido.total_pedido)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirmar Pago */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="font-black text-lg uppercase tracking-wider">
                Confirmar Pago de Pedido #{confirmModal.id}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Cliente: <strong className="text-black dark:text-white">{confirmModal.cliente_nombre}</strong> · Total: <strong className="text-black dark:text-white font-mono">Gs. {formatGsInput(confirmModal.total_pedido)}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <strong className="block mb-0.5">⚠️ Acción irreversible:</strong>
              Al confirmar, se creará la Venta correspondiente y se <strong>descontará automáticamente el stock</strong> de cada producto del pedido.
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Método de Pago para registrar en Venta:
              </label>
              <select
                value={metodoPagoVenta}
                onChange={e => setMetodoPagoVenta(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none"
              >
                <option value="TR">🏦 Transferencia Bancaria (SIPAP)</option>
                <option value="QRD">📲 Pago QR (Débito)</option>
                <option value="QRC">📲 Pago QR (Crédito)</option>
                <option value="GT">📱 Giros Tigo / Billetera Móvil</option>
                <option value="EF">💵 Efectivo (Contra Entrega)</option>
                <option value="TD">💳 Tarjeta Débito (POS)</option>
                <option value="TC">💳 Tarjeta Crédito (POS)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-black transition flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{actionLoading ? 'Confirmando...' : 'Confirmar y Descontar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar Pedido */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="font-black text-lg uppercase tracking-wider text-rose-500">
                ¿Cancelar Pedido #{cancelModal.id}?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Cliente: <strong className="text-black dark:text-white">{cancelModal.cliente_nombre}</strong>
              </p>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              El pedido se marcará como <strong>Cancelado</strong>. No se creará ninguna venta ni se afectará el stock.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-xs font-bold transition"
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-black transition"
              >
                {actionLoading ? 'Cancelando...' : 'Sí, Cancelar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
