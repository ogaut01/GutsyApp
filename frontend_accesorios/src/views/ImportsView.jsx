import React, { useState, useEffect } from 'react';
import {
  Package, Plane, Ship, Truck, CheckCircle2, Clock,
  Calculator, ArrowRight, ExternalLink, X, Plus, Sparkles, MapPin, Eye,
  ChevronDown, ChevronUp, Layers, Tag, Trash2, ShoppingBag, Edit2, Coins
} from 'lucide-react';
import {
  updateLoteFlete, createLote, updateLote, deleteLote,
  fetchCouriers, fetchProveedores, fetchProductos, fetchConfiguracion,
  createItemLote, updateItemLote, deleteItemLote
} from '../services/api';

const STATUS_FLOW = ['COMPRADO', 'EN_CASILLA', 'EN_TRANSITO', 'EN_COURIER_PY', 'RECIBIDO'];

const STATUS_BADGES = {
  COMPRADO: { label: '1. Comprado', color: 'bg-zinc-800 text-stone-700 dark:text-zinc-300' },
  EN_CASILLA: { label: '2. Recibido en Casilla', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  EN_TRANSITO: { label: '3. En Tránsito', color: 'bg-amber-500/20 text-black dark:text-white border border-amber-500/30' },
  EN_COURIER_PY: { label: '4. Disponible para Retiro', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  RECIBIDO: { label: '5. Retirado', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  CANCELADO: { label: 'Cancelado', color: 'bg-rose-500/20 text-rose-400' },
};

const STATE_NAMES = {
  COMPRADO: 'Comprado',
  EN_CASILLA: 'Recibido en Casilla',
  EN_TRANSITO: 'En Tránsito',
  EN_COURIER_PY: 'Disponible para Retiro',
  RECIBIDO: 'Retirado'
};

const MONEDAS = [
  { id: 'USD', label: 'USD (Dólares)', symbol: '$' },
  { id: 'BRL', label: 'BRL (Reales)', symbol: 'R$' },
  { id: 'CNY', label: 'CNY (Yuanes)', symbol: '¥' },
  { id: 'ARS', label: 'ARS (Pesos Arg)', symbol: '$' },
  { id: 'PYG', label: 'PYG (Guaraníes)', symbol: 'Gs.' },
];

export default function ImportsView({ lotes = [], onReload }) {
  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Estado para expandir productos del lote
  const [expandedLoteId, setExpandedLoteId] = useState(null);

  // Liquidación modal
  const [selectedLote, setSelectedLote] = useState(null);
  const [pesoGramos, setPesoGramos] = useState('');
  const [fletePyg, setFletePyg] = useState('');
  const [savingLiquidacion, setSavingLiquidacion] = useState(false);

  // Configuración de tasas
  const [config, setConfig] = useState(null);

  // Nuevo / Editar Lote modal
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [editingLoteId, setEditingLoteId] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productosList, setProductosList] = useState([]);
  const [loteForm, setLoteForm] = useState({
    nombre_referencia: '',
    tipo_envio: 'AER',
    tracking: '',
    courier: '',
    proveedor_principal: '',
  });
  const [savingLote, setSavingLote] = useState(false);

  // Modal para Asignar / Editar Producto en Lote
  const [loteToAddItem, setLoteToAddItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemCantidad, setItemCantidad] = useState(1);
  const [selectedItemProveedor, setSelectedItemProveedor] = useState('');
  const [itemMoneda, setItemMoneda] = useState('USD');
  const [itemCostoFob, setItemCostoFob] = useState('');
  const [savingItemLote, setSavingItemLote] = useState(false);

  // Cargar datos auxiliares
  const loadAuxData = async () => {
    try {
      const [couriersData, provsData, prodsData, configData] = await Promise.all([
        fetchCouriers(),
        fetchProveedores(),
        fetchProductos(),
        fetchConfiguracion().catch(() => null),
      ]);
      const importCouriers = (couriersData || []).filter(c => !c.es_transportadora_local);
      setCouriers(importCouriers);
      setProveedores(provsData);
      setProductosList(prodsData);
      setConfig(configData);
      if (importCouriers.length > 0) setLoteForm(f => ({ ...f, courier: importCouriers[0].id }));
      if (provsData.length > 0) setLoteForm(f => ({ ...f, proveedor_principal: provsData[0].id }));
    } catch (err) {
      console.error('Error cargando datos auxiliares:', err);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, []);

  const getShippingIcon = (tipo) => {
    if (tipo === 'MAR') return <Ship className="w-4 h-4 text-cyan-400" />;
    if (tipo === 'TER') return <Truck className="w-4 h-4 text-emerald-400" />;
    return <Plane className="w-4 h-4 text-black dark:text-white" />;
  };

  const handleOpenLiquidacion = (lote) => {
    setSelectedLote(lote);
    setPesoGramos(lote.peso_total_gramos || '');
    setFletePyg(lote.costo_flete_total_pyg || '');
  };

  const handleSaveLiquidacion = async (e) => {
    e.preventDefault();
    if (!selectedLote) return;
    setSavingLiquidacion(true);

    try {
      await updateLoteFlete(selectedLote.id, {
        peso_total_gramos: parseInt(pesoGramos) || 0,
        costo_flete_total_pyg: parseInt(fletePyg) || 0,
        estado: 'RECIBIDO',
      });
      setSelectedLote(null);
      showToast('Flete liquidado y costos de productos actualizados');
      if (onReload) onReload();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingLiquidacion(false);
    }
  };

  // Abrir Modal para Crear Lote
  const handleOpenCreateLote = () => {
    setEditingLoteId(null);
    setLoteForm({
      nombre_referencia: '',
      tipo_envio: 'AER',
      tracking: '',
      courier: couriers[0]?.id || '',
      proveedor_principal: proveedores[0]?.id || '',
    });
    setShowLoteModal(true);
  };

  // Abrir Modal para Editar Lote
  const handleOpenEditLote = (lote) => {
    setEditingLoteId(lote.id);
    setLoteForm({
      nombre_referencia: lote.nombre_referencia || '',
      tipo_envio: lote.tipo_envio || 'AER',
      tracking: lote.tracking_courier || lote.tracking_origen || '',
      courier: lote.courier || couriers[0]?.id || '',
      proveedor_principal: lote.proveedor_principal || '',
    });
    setShowLoteModal(true);
  };

  // Eliminar Lote
  const handleDeleteLote = async (lote) => {
    const confirmName = window.confirm(`¿Estás seguro de eliminar el lote "${lote.nombre_referencia || 'Pedido #' + lote.id}"?`);
    if (!confirmName) return;

    try {
      await deleteLote(lote.id);
      showToast('Lote eliminado correctamente');
      if (onReload) onReload();
    } catch (err) {
      alert('Error al eliminar lote: ' + err.message);
    }
  };

  // Guardar Lote (Crear o Editar)
  const handleSaveLoteSubmit = async (e) => {
    e.preventDefault();
    if (!loteForm.nombre_referencia) return;
    setSavingLote(true);

    try {
      const payload = {
        nombre_referencia: loteForm.nombre_referencia,
        tipo_envio: loteForm.tipo_envio,
        tracking_origen: loteForm.tracking,
        tracking_courier: loteForm.tracking,
        courier: loteForm.courier ? parseInt(loteForm.courier) : null,
        proveedor_principal: loteForm.proveedor_principal ? parseInt(loteForm.proveedor_principal) : null,
      };

      if (editingLoteId) {
        await updateLote(editingLoteId, payload);
        showToast('Datos del lote actualizados');
      } else {
        payload.estado = 'COMPRADO';
        await createLote(payload);
        showToast('Nuevo lote creado exitosamente');
      }

      setShowLoteModal(false);
      setEditingLoteId(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar lote: ' + err.message);
    } finally {
      setSavingLote(false);
    }
  };

  // Cambiar de estado rápido (Timeline stepper)
  const handleQuickStatusChange = async (lote, nuevoEstado) => {
    if (nuevoEstado === 'RECIBIDO') {
      handleOpenLiquidacion(lote);
      return;
    }

    try {
      await updateLoteFlete(lote.id, {
        estado: nuevoEstado,
        peso_total_gramos: lote.peso_total_gramos,
        costo_flete_total_pyg: lote.costo_flete_total_pyg,
      });
      const stateName = STATE_NAMES[nuevoEstado] || nuevoEstado;
      showToast(`Avance actualizado: "${stateName}"`);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  // Abrir modal para asignar producto nuevo
  const handleOpenAddProduct = (lote) => {
    setLoteToAddItem(lote);
    setEditingItemId(null);
    if (productosList.length > 0) {
      const firstProd = productosList[0];
      setSelectedProductId(firstProd.id);
      setItemCostoFob(firstProd.costo_moneda_origen || '');
      setItemMoneda(firstProd.moneda_compra || 'USD');
    } else {
      setItemMoneda('USD');
    }
    if (proveedores.length > 0) {
      setSelectedItemProveedor(proveedores[0].id);
    }
    setItemCantidad(1);
  };

  // Abrir modal para EDITAR ítem existente
  const handleOpenEditProduct = (lote, item) => {
    setLoteToAddItem(lote);
    setEditingItemId(item.id);
    setSelectedProductId(item.producto || item.producto_id);
    setItemCantidad(item.cantidad || 1);
    setSelectedItemProveedor(item.proveedor_historico || '');
    setItemCostoFob(item.costo_moneda_origen_historico || '');
    setItemMoneda(item.moneda_compra_historica || 'USD');
  };

  // Guardar (Crear o Actualizar) asignación de producto al lote
  const handleSaveItemLote = async (e) => {
    e.preventDefault();
    if (!loteToAddItem || !selectedProductId) return;
    setSavingItemLote(true);

    try {
      const payload = {
        lote: loteToAddItem.id,
        producto: parseInt(selectedProductId),
        cantidad: parseInt(itemCantidad) || 1,
        proveedor_historico: selectedItemProveedor ? parseInt(selectedItemProveedor) : null,
        costo_moneda_origen_historico: itemCostoFob ? parseFloat(itemCostoFob) : null,
        moneda_compra_historica: itemMoneda || 'USD',
      };

      if (editingItemId) {
        await updateItemLote(editingItemId, payload);
        showToast('Producto actualizado en el lote');
      } else {
        await createItemLote(payload);
        showToast('Producto asignado a la caja con éxito');
      }

      setLoteToAddItem(null);
      setEditingItemId(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar producto: ' + err.message);
    } finally {
      setSavingItemLote(false);
    }
  };

  // Eliminar producto del lote
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Deseas quitar este producto de este lote?')) return;
    try {
      await deleteItemLote(itemId);
      showToast('Producto quitado del lote');
      if (onReload) onReload();
    } catch (err) {
      alert('Error al quitar ítem: ' + err.message);
    }
  };

  // Cálculo de estimación en Guaraníes en vivo para el modal
  const getConvertedPyg = () => {
    const val = parseFloat(itemCostoFob) || 0;
    if (val === 0) return 0;
    if (itemMoneda === 'PYG') return val;
    if (!config) return val * (itemMoneda === 'USD' ? 7950 : itemMoneda === 'BRL' ? 1480 : itemMoneda === 'CNY' ? 1100 : 7);
    
    let rate = 7950;
    if (itemMoneda === 'USD') rate = config.tipo_cambio_usd || 7950;
    if (itemMoneda === 'BRL') rate = config.tipo_cambio_brl || 1480;
    if (itemMoneda === 'CNY') rate = config.tipo_cambio_cny || 1100;
    if (itemMoneda === 'ARS') rate = config.tipo_cambio_ars || 7;
    return Math.round(val * rate);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4 relative">
      
      {/* Toast Notification Flotante */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-amber-500/50 text-stone-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-3 fade-in duration-300">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-black dark:text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-zinc-100">{toast}</span>
        </div>
      )}

      {/* Encabezado y botón nuevo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-black dark:text-white" />
            Envíos Internacionales & Lotes
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Control de logística y recepción de mercaderías</p>
        </div>

        <button
          onClick={handleOpenCreateLote}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Lista de Lotes */}
      <div className="space-y-3.5">
        {lotes.map((lote) => {
          const badge = STATUS_BADGES[lote.estado] || { label: lote.estado, color: 'bg-zinc-800 text-stone-700 dark:text-zinc-300' };
          const currentStatusIdx = STATUS_FLOW.indexOf(lote.estado);

          return (
            <div
              key={lote.id}
              className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 space-y-3"
            >
              {/* Header Lote con botón editar */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800">
                      {getShippingIcon(lote.tipo_envio)}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                      {lote.nombre_referencia || `Pedido #${lote.id}`}
                    </h3>
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Courier: <b className="text-zinc-200">{lote.courier_nombre || 'No asignado'}</b> • {lote.tipo_envio_display}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.color}`}>
                    {badge.label}
                  </span>

                  {/* Botón Editar Lote */}
                  <button
                    onClick={() => handleOpenEditLote(lote)}
                    className="p-1.5 rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-black dark:text-white border border-neutral-200 dark:border-zinc-800 transition"
                    title="Editar nombre, tracking o courier de este lote"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Botón Eliminar Lote */}
                  <button
                    onClick={() => handleDeleteLote(lote)}
                    className="p-1.5 rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-rose-500/20 text-stone-400 dark:text-zinc-500 hover:text-rose-400 border border-neutral-200 dark:border-zinc-800 transition"
                    title="Eliminar este lote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tracking */}
              <div className="bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800/80 text-xs">
                <span className="text-[9px] text-stone-400 dark:text-zinc-500 block uppercase font-bold tracking-wider">Número de Tracking (Código de Guía)</span>
                <span className="font-mono text-black dark:text-white font-bold truncate block">{lote.tracking_courier || lote.tracking_origen || 'Sin tracking asignado'}</span>
              </div>

              {/* Barra de progreso limpia de 5 pasos */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">Avance del paquete:</span>
                <div className="grid grid-cols-5 gap-1 text-[10px]">
                  {STATUS_FLOW.map((state, sIdx) => {
                    const isPassed = sIdx <= currentStatusIdx;
                    const isCurrent = sIdx === currentStatusIdx;

                    return (
                      <button
                        key={state}
                        onClick={() => handleQuickStatusChange(lote, state)}
                        className={`py-1.5 px-1 rounded-lg font-bold transition text-center leading-tight ${
                          isCurrent
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm shadow-md shadow-amber-500/20'
                            : isPassed
                            ? 'bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-zinc-700'
                            : 'bg-zinc-950 text-zinc-600 hover:text-stone-500 dark:text-zinc-400'
                        }`}
                      >
                        {STATE_NAMES[state]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Métricas de Flete y Botones */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-zinc-800/80 text-xs">
                <div>
                  <span className="text-[9px] text-stone-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Flete y Peso</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {lote.costo_flete_total_pyg > 0 ? (
                      `Gs. ${lote.costo_flete_total_pyg.toLocaleString('es-PY')} (${(lote.peso_total_gramos / 1000).toFixed(2)} kg)`
                    ) : (
                      <span className="text-stone-400 dark:text-zinc-500">Pendiente de liquidación</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedLoteId(expandedLoteId === lote.id ? null : lote.id)}
                    className="px-3 py-1.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 hover:border-[#d6cebf] dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Ver {lote.items_detalle?.length || 0} ítems</span>
                    {expandedLoteId === lote.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => handleOpenLiquidacion(lote)}
                    className="px-3.5 py-1.5 bg-zinc-850 border border-zinc-850 hover:border-amber-500/50 text-black dark:text-white text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 transition"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Liquidación
                  </button>
                </div>
              </div>

              {/* Desglose de Productos y Proveedores de este Lote */}
              {expandedLoteId === lote.id && (
                <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 space-y-3 text-xs animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                      Productos & Tiendas en esta Caja ({lote.items_detalle?.reduce((acc, it) => acc + (it.cantidad || 0), 0) || 0} u.)
                    </span>

                    <button
                      onClick={() => handleOpenAddProduct(lote)}
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500 text-neutral-700 dark:text-neutral-300 hover:text-zinc-950 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-amber-500/30 transition active:scale-95"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Asignar Producto</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {lote.items_detalle?.map((it, itIdx) => (
                      <div
                        key={it.id || itIdx}
                        className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/60 hover:border-[#d6cebf] dark:border-zinc-700 transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-white text-xs">{it.producto_nombre}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-black dark:text-white font-semibold">
                              {it.producto_categoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-stone-400 dark:text-zinc-500" />
                              Tienda: <b className="text-zinc-200">{it.proveedor_nombre}</b>
                            </span>
                            {it.costo_moneda_origen_historico && (
                              <span className="text-stone-400 dark:text-zinc-500">
                                • FOB: {it.moneda_compra_historica || 'USD'} {it.costo_moneda_origen_historico}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-black dark:text-white font-bold text-xs">
                              {it.cantidad} u.
                            </span>
                            {it.costo_unitario_final > 0 && (
                              <span className="block text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                                Gs. {it.costo_unitario_final.toLocaleString('es-PY')}/u.
                              </span>
                            )}
                          </div>

                          {/* Botón Editar Ítem */}
                          <button
                            onClick={() => handleOpenEditProduct(lote, it)}
                            className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-amber-500/20 text-stone-500 dark:text-zinc-400 hover:text-neutral-700 dark:text-neutral-300 transition"
                            title="Editar cantidad, moneda o costo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar Ítem */}
                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-rose-500/20 text-stone-400 dark:text-zinc-500 hover:text-rose-400 transition"
                            title="Quitar de este lote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!lote.items_detalle || lote.items_detalle.length === 0) && (
                      <div className="text-center py-4 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800/80 space-y-2">
                        <p className="text-stone-400 dark:text-zinc-500 text-xs italic">
                          No hay productos asignados a este lote todavía.
                        </p>
                        <button
                          onClick={() => handleOpenAddProduct(lote)}
                          className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-md active:scale-95 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar Primer Producto</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {lotes.length === 0 && (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-3xl">
            <Package className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-zinc-700" />
            <p className="text-sm font-semibold text-stone-400 dark:text-zinc-500">No hay envíos registrados aún</p>
            <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">Hacé clic en "Nuevo Pedido" para ingresar uno.</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Asignar / Editar Producto al Lote
      ══════════════════════════════════════════════════════ */}
      {loteToAddItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-black dark:text-white" />
                  {editingItemId ? 'Editar Producto en Lote' : 'Asignar Producto al Lote'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Caja: <b className="text-black dark:text-white">{loteToAddItem.nombre_referencia || `Pedido #${loteToAddItem.id}`}</b>
                </p>
              </div>
              <button
                onClick={() => {
                  setLoteToAddItem(null);
                  setEditingItemId(null);
                }}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemLote} className="space-y-3.5">
              {/* Seleccionar Producto */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Producto del Catálogo</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = productosList.find(p => p.id === parseInt(e.target.value));
                    if (prod) {
                      setItemCostoFob(prod.costo_moneda_origen || '');
                      setItemMoneda(prod.moneda_compra || 'USD');
                    }
                  }}
                  required
                  disabled={Boolean(editingItemId)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none disabled:opacity-60"
                >
                  {productosList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.categoria_nombre || 'Accesorio'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Cantidad de Unidades</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={itemCantidad}
                  onChange={(e) => setItemCantidad(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              {/* Tienda Proveedora */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Tienda / Proveedor</label>
                <select
                  value={selectedItemProveedor}
                  onChange={(e) => setSelectedItemProveedor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                >
                  <option value="">Sin asignar / Proveedor por defecto</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre} ({prov.plataforma_nombre || 'Tienda'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Moneda de Compra & Costo FOB */}
              <div className="space-y-1.5 p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-2xl border border-neutral-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Costo de Compra en Origen
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">Moneda</label>
                    <select
                      value={itemMoneda}
                      onChange={(e) => setItemMoneda(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    >
                      {MONEDAS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">Costo Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={itemCostoFob}
                      onChange={(e) => setItemCostoFob(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-black dark:text-white font-bold focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                </div>

                {/* Previsualización en Guaraníes */}
                {parseFloat(itemCostoFob) > 0 && (
                  <div className="pt-2 mt-1 border-t border-neutral-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-stone-400 dark:text-zinc-500 text-[11px]">Conversión estimada:</span>
                    <span className="font-bold text-emerald-400">
                      ≈ Gs. {getConvertedPyg().toLocaleString('es-PY')} / u.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoteToAddItem(null);
                    setEditingItemId(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingItemLote}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-xs disabled:opacity-50 transition"
                >
                  {savingItemLote ? 'Guardando...' : (editingItemId ? 'Guardar Cambios' : 'Asignar al Lote')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Crear o Editar Lote
      ══════════════════════════════════════════════════════ */}
      {showLoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-black dark:text-white" />
                {editingLoteId ? 'Editar Datos del Lote' : 'Registrar Nuevo Lote / Pedido'}
              </h3>
              <button
                onClick={() => {
                  setShowLoteModal(false);
                  setEditingLoteId(null);
                }}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoteSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Nombre / Referencia de la Caja</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Caja Shein Agosto o Pedido Flashbox #849"
                  value={loteForm.nombre_referencia}
                  onChange={(e) => setLoteForm({ ...loteForm, nombre_referencia: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Vía de Envío</label>
                  <select
                    value={loteForm.tipo_envio}
                    onChange={(e) => setLoteForm({ ...loteForm, tipo_envio: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="AER">Aéreo (Miami / China)</option>
                    <option value="TER">Terrestre (Local PY / Brasil / Argentina)</option>
                    <option value="MAR">Marítimo (Carga Pesada)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Courier / Transportadora</label>
                  <select
                    value={loteForm.courier}
                    onChange={(e) => setLoteForm({ ...loteForm, courier: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="">Sin Courier (Compra Local PY / Retiro Directo)</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Tracking (Código de Guía)</label>
                <input
                  type="text"
                  placeholder="Ej: 9400111899562534..."
                  value={loteForm.tracking}
                  onChange={(e) => setLoteForm({ ...loteForm, tracking: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoteModal(false);
                    setEditingLoteId(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLote}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-xs disabled:opacity-50 transition"
                >
                  {savingLote ? 'Guardando...' : (editingLoteId ? 'Guardar Cambios' : 'Crear Lote')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Liquidación de Flete (Limpio & sin estado redundant)
      ══════════════════════════════════════════════════════ */}
      {selectedLote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-black dark:text-white" />
                  Liquidar Flete de Caja
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Lote: <b className="text-black dark:text-white">{selectedLote.nombre_referencia || `Pedido #${selectedLote.id}`}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedLote(null)}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLiquidacion} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Peso Total Facturado (Gramos)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 2500 (para 2.5 kg)"
                  value={pesoGramos}
                  onChange={(e) => setPesoGramos(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
                <span className="text-[10px] text-stone-400 dark:text-zinc-500 block mt-1">1 kilo = 1.000 gramos</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Flete Total Pagado al Courier / Encomienda (Gs.)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 337500"
                  value={fletePyg}
                  onChange={(e) => setFletePyg(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              {/* Cálculo en Vivo del Flete */}
              {parseInt(pesoGramos) > 0 && parseInt(fletePyg) > 0 && (
                <div className="p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-2xl border border-neutral-200 dark:border-zinc-800 space-y-1 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-zinc-400">Costo de flete por gramo:</span>
                    <span className="font-bold text-black dark:text-white">
                      Gs. {Math.round(parseInt(fletePyg) / parseInt(pesoGramos)).toLocaleString('es-PY')} / g
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-500">
                    <span>Costo equivalente por kilo:</span>
                    <span className="text-stone-700 dark:text-zinc-300 font-semibold">
                      Gs. {Math.round((parseInt(fletePyg) / parseInt(pesoGramos)) * 1000).toLocaleString('es-PY')} / kg
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLote(null)}
                  className="flex-1 py-3 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLiquidacion}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingLiquidacion ? 'Guardando...' : 'Guardar y Prorratear Costos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
