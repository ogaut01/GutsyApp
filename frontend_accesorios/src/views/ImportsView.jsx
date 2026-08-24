import React, { useState, useEffect } from 'react';
import {
  Package, Plane, Ship, Truck, CheckCircle2, Clock,
  Calculator, ArrowRight, ExternalLink, X, Plus, Sparkles, MapPin, Eye
} from 'lucide-react';
import {
  updateLoteFlete, createLote, fetchCouriers, fetchProveedores
} from '../services/api';

const STATUS_FLOW = ['COMPRADO', 'EN_CASILLA', 'EN_TRANSITO', 'EN_COURIER_PY', 'RECIBIDO'];

const STATUS_BADGES = {
  COMPRADO: { label: '1. Comprado', color: 'bg-zinc-800 text-zinc-300' },
  EN_CASILLA: { label: '2. En Casilla Miami', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  EN_TRANSITO: { label: '3. En Vuelo / Tránsito', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  EN_COURIER_PY: { label: '4. En Sucursal PY (Listo)', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  RECIBIDO: { label: '5. Retirado en Depósito', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  CANCELADO: { label: 'Cancelado', color: 'bg-rose-500/20 text-rose-400' },
};

export default function ImportsView({ lotes, onReload }) {
  // Liquidación modal
  const [selectedLote, setSelectedLote] = useState(null);
  const [pesoGramos, setPesoGramos] = useState('');
  const [fletePyg, setFletePyg] = useState('');
  const [estado, setEstado] = useState('RECIBIDO');
  const [savingLiquidacion, setSavingLiquidacion] = useState(false);

  // Nuevo Lote modal
  const [showNuevoLoteModal, setShowNuevoLoteModal] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loteForm, setLoteForm] = useState({
    nombre_referencia: '',
    tipo_envio: 'AER',
    tracking: '',
    courier: '',
    proveedor_principal: '',
  });
  const [savingLote, setSavingLote] = useState(false);

  // Cargar datos auxiliares para el modal de Nuevo Lote
  const loadAuxData = async () => {
    try {
      const [couriersData, provsData] = await Promise.all([
        fetchCouriers(),
        fetchProveedores(),
      ]);
      setCouriers(couriersData);
      setProveedores(provsData);
      if (couriersData.length > 0) setLoteForm(f => ({ ...f, courier: couriersData[0].id }));
      if (provsData.length > 0) setLoteForm(f => ({ ...f, proveedor_principal: provsData[0].id }));
    } catch (err) {
      console.error('Error cargando couriers/proveedores:', err);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, []);

  const getShippingIcon = (tipo) => {
    if (tipo === 'MAR') return <Ship className="w-4 h-4 text-cyan-400" />;
    if (tipo === 'TER') return <Truck className="w-4 h-4 text-emerald-400" />;
    return <Plane className="w-4 h-4 text-amber-400" />;
  };

  const handleOpenLiquidacion = (lote) => {
    setSelectedLote(lote);
    setPesoGramos(lote.peso_total_gramos || '');
    setFletePyg(lote.costo_flete_total_pyg || '');
    setEstado(lote.estado || 'RECIBIDO');
  };

  const handleSaveLiquidacion = async (e) => {
    e.preventDefault();
    if (!selectedLote) return;
    setSavingLiquidacion(true);

    try {
      await updateLoteFlete(selectedLote.id, {
        peso_total_gramos: parseInt(pesoGramos) || 0,
        costo_flete_total_pyg: parseInt(fletePyg) || 0,
        estado: estado,
      });
      setSelectedLote(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingLiquidacion(false);
    }
  };

  // Crear Lote nuevo
  const handleCreateLoteSubmit = async (e) => {
    e.preventDefault();
    if (!loteForm.nombre_referencia) return;
    setSavingLote(true);

    try {
      await createLote({
        nombre_referencia: loteForm.nombre_referencia,
        tipo_envio: loteForm.tipo_envio,
        tracking_origen: loteForm.tracking,
        tracking_courier: loteForm.tracking,
        courier: parseInt(loteForm.courier) || null,
        proveedor_principal: parseInt(loteForm.proveedor_principal) || null,
        estado: 'COMPRADO',
      });
      setShowNuevoLoteModal(false);
      setLoteForm({
        nombre_referencia: '',
        tipo_envio: 'AER',
        tracking: '',
        courier: couriers[0]?.id || '',
        proveedor_principal: proveedores[0]?.id || '',
      });
      if (onReload) onReload();
    } catch (err) {
      alert('Error al crear lote: ' + err.message);
    } finally {
      setSavingLote(false);
    }
  };

  // Cambiar de estado rápido (Timeline stepper)
  const handleQuickStatusChange = async (lote, nuevoEstado) => {
    if (nuevoEstado === 'RECIBIDO') {
      // Si pasa a retirado, obligar a liquidar flete
      handleOpenLiquidacion(lote);
      return;
    }

    try {
      await updateLoteFlete(lote.id, {
        peso_total_gramos: lote.peso_total_gramos || 0,
        costo_flete_total_pyg: lote.costo_flete_total_pyg || 0,
        estado: nuevoEstado,
      });
      if (onReload) onReload();
    } catch (err) {
      alert('Error al cambiar de estado: ' + err.message);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* Encabezado y botón nuevo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-400" />
            Envíos Internacionales & Lotes
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Controla tu logística desde Miami a Asunción</p>
        </div>

        <button
          onClick={() => setShowNuevoLoteModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Lista de Lotes */}
      <div className="space-y-3.5">
        {lotes.map((lote) => {
          const badge = STATUS_BADGES[lote.estado] || { label: lote.estado, color: 'bg-zinc-800 text-zinc-300' };
          const fletePorGramo = lote.peso_total_gramos > 0 ? (lote.costo_flete_total_pyg / lote.peso_total_gramos) : 0;
          const currentStatusIdx = STATUS_FLOW.indexOf(lote.estado);

          return (
            <div
              key={lote.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3"
            >
              {/* Header Lote */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      {getShippingIcon(lote.tipo_envio)}
                    </span>
                    <h3 className="font-bold text-sm text-white">
                      {lote.nombre_referencia || `Pedido #${lote.id}`}
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Courier: <b className="text-zinc-200">{lote.courier_nombre || 'No asignado'}</b> • {lote.tipo_envio_display}
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              {/* Tracking */}
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Número de Tracking (Código de Guía)</span>
                <span className="font-mono text-amber-400 font-bold truncate block">{lote.tracking_courier || lote.tracking_origen || 'Sin tracking asignado'}</span>
              </div>

              {/* Barra de progreso rápida */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Avance del paquete:</span>
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  {STATUS_FLOW.map((state, sIdx) => {
                    const isPassed = sIdx <= currentStatusIdx;
                    const isCurrent = sIdx === currentStatusIdx;
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => handleQuickStatusChange(lote, state)}
                        className={`flex-1 py-1 rounded-lg font-bold border transition text-center truncate ${
                          isCurrent
                            ? 'bg-amber-500 border-amber-500 text-zinc-950'
                            : isPassed
                            ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-650 hover:text-zinc-400'
                        }`}
                      >
                        {state === 'EN_CASILLA' ? 'Casilla' :
                         state === 'EN_TRANSITO' ? 'Vuelo' :
                         state === 'EN_COURIER_PY' ? 'Sucursal PY' :
                         state === 'RECIBIDO' ? 'Retirado' : 'Comprado'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flete e info de costos */}
              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Flete y Peso</span>
                  <span className="font-bold text-white">
                    {lote.peso_total_gramos > 0 ? (
                      `${(lote.peso_total_gramos / 1000).toFixed(2)} kg • Gs. ${lote.costo_flete_total_pyg.toLocaleString('es-PY')} (${fletePorGramo.toFixed(1)} Gs./g)`
                    ) : (
                      'Pendiente de liquidación'
                    )}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenLiquidacion(lote)}
                  className="px-3.5 py-1.5 bg-zinc-850 border border-zinc-850 hover:border-amber-500/50 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 transition"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Liquidación
                </button>
              </div>
            </div>
          );
        })}

        {lotes.length === 0 && (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-3xl">
            <Package className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-500">No hay envíos registrados aún</p>
            <p className="text-xs text-zinc-500 mt-1">Hacé clic en "Nuevo Pedido" para ingresar uno.</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Nuevo Pedido / Lote
      ══════════════════════════════════════════════════════ */}
      {showNuevoLoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-white">Registrar Lote de Importación</h3>
              <button
                onClick={() => setShowNuevoLoteModal(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoteSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nombre / Referencia de Compra</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lote #6 - Anillos Shein"
                  value={loteForm.nombre_referencia}
                  onChange={e => setLoteForm(f => ({ ...f, nombre_referencia: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Proveedor Principal</label>
                  <select
                    value={loteForm.proveedor_principal}
                    onChange={e => setLoteForm(f => ({ ...f, proveedor_principal: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Courier</label>
                  <select
                    value={loteForm.courier}
                    onChange={e => setLoteForm(f => ({ ...f, courier: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {couriers.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Vía de Envío</label>
                  <select
                    value={loteForm.tipo_envio}
                    onChange={e => setLoteForm(f => ({ ...f, tipo_envio: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="AER">✈️ Aéreo Courier</option>
                    <option value="MAR">🚢 Marítimo Courier</option>
                    <option value="TER">🚛 Terrestre / Encomienda</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Número de Tracking</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FLASH-882299"
                    value={loteForm.tracking}
                    onChange={e => setLoteForm(f => ({ ...f, tracking: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingLote}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingLote ? 'Guardando...' : 'REGISTRAR PEDIDO'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Liquidar Flete / Cambiar Estado
      ══════════════════════════════════════════════════════ */}
      {selectedLote && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Liquidar Flete del Paquete</h3>
                <p className="text-[11px] text-amber-400">{selectedLote.nombre_referencia || `Lote #${selectedLote.id}`}</p>
              </div>
              <button
                onClick={() => setSelectedLote(null)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLiquidacion} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Peso Total Cobrado por el Courier (en Gramos):
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 2400 (para 2.4 kg)"
                  value={pesoGramos}
                  onChange={(e) => setPesoGramos(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {pesoGramos ? `${(pesoGramos / 1000).toFixed(2)} kilogramos` : '1 kg = 1000 gramos'}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Monto Total Pagado de Flete (en Guaraníes):
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 405000"
                  value={fletePyg}
                  onChange={(e) => setFletePyg(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Estado del Lote:
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="EN_CASILLA">2. En Casilla Miami</option>
                  <option value="EN_TRANSITO">3. En Vuelo / Tránsito</option>
                  <option value="EN_COURIER_PY">4. En Sucursal PY</option>
                  <option value="RECIBIDO">5. Retirado en Depósito (Ingresado)</option>
                </select>
              </div>

              {pesoGramos > 0 && fletePyg > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  ⚡ <b>Prorrateo resultante:</b> Gs. {(fletePyg / pesoGramos).toFixed(1)} por cada gramo de joya.
                </div>
              )}

              <button
                type="submit"
                disabled={savingLiquidacion}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {savingLiquidacion ? 'Guardando y Recalculando...' : 'GUARDAR Y ACTUALIZAR PRODUCTOS'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
