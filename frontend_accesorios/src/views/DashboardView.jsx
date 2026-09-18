import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpRight, ArrowDownRight,
  Clock, ShieldCheck, X, AlertTriangle, FileText, ShoppingBag, Trash2, Calendar,
  Package, Plane, Truck, Tag, Layers, RefreshCw, BarChart3, PieChart, Sparkles,
  ExternalLink, Eye, CheckCircle2, ChevronRight, AlertCircle, Info, ChevronDown,
  Trophy, Gem, CreditCard, Receipt, Boxes, Wallet, Target, Scale, Flame,
  Pencil, Settings
} from 'lucide-react';
import {
  fetchDashboardStats, fetchGastos, createGasto,
  fetchVentas, deleteVenta, updateConfiguracion
} from '../services/api';
import SalesHistoryView from './SalesHistoryView';
import ExpensesView from './ExpensesView';

const PERIODOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7 Días' },
  { id: '30d', label: '30 Días' },
  { id: '3m', label: '3 Meses' },
  { id: '6m', label: '6 Meses' },
  { id: '12m', label: '12 Meses' },
];

const CATEGORIAS_GASTO = [
  { id: 'ADS', label: 'Publicidad & Meta Ads (Instagram/TikTok)' },
  { id: 'ENV', label: 'Delivery & Envíos Locales' },
  { id: 'EMP', label: 'Empaques, Cajas & Bolsas' },
  { id: 'HER', label: 'Insumos de Grabado Láser & Herramientas' },
  { id: 'SRV', label: 'Software, Hosting & Dominio' },
  { id: 'VAR', label: 'Gastos Operativos Varios' },
];

export default function DashboardView({ onActionSuccess, onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('metricas'); // 'metricas' | 'ventas' | 'gastos'
  const [periodo, setPeriodo] = useState('30d');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab de inventario activo (bajo, agotado, sin_movimiento)
  const [stockTab, setStockTab] = useState('bajo');

  // Modal para agregar gasto
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [categoriaGasto, setCategoriaGasto] = useState('ADS');
  const [montoGasto, setMontoGasto] = useState('');
  const [descGasto, setDescGasto] = useState('');
  const [savingGasto, setSavingGasto] = useState(false);

  // Modal de Anulación de venta
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voiding, setVoiding] = useState(false);

  // Modal de Edición de Metas & Punto de Equilibrio
  const [showMetasModal, setShowMetasModal] = useState(false);
  const [metasForm, setMetasForm] = useState({
    meta_deuda_mensual_pyg: 1332000,
    meta_ads_mensual_pyg: 800000,
    meta_sueldo_libre_pyg: 800000,
    margen_sugerido_porcentaje: 60,
  });
  const [savingMetas, setSavingMetas] = useState(false);
  const [showMobileMetaDetails, setShowMobileMetaDetails] = useState(false);

  // Tooltip de gráfico
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const handleOpenEditMetas = () => {
    if (stats?.punto_equilibrio_meta) {
      setMetasForm({
        meta_deuda_mensual_pyg: stats.punto_equilibrio_meta.cuota_deudas ?? 1332000,
        meta_ads_mensual_pyg: stats.punto_equilibrio_meta.meta_ads ?? 800000,
        meta_sueldo_libre_pyg: stats.punto_equilibrio_meta.sueldo_libre ?? 800000,
        margen_sugerido_porcentaje: stats.punto_equilibrio_meta.margen_comercial_pct ?? 60,
      });
    }
    setShowMetasModal(true);
  };

  const handleSaveMetas = async (e) => {
    e.preventDefault();
    try {
      setSavingMetas(true);
      await updateConfiguracion({
        meta_deuda_mensual_pyg: parseInt(metasForm.meta_deuda_mensual_pyg, 10) || 0,
        meta_ads_mensual_pyg: parseInt(metasForm.meta_ads_mensual_pyg, 10) || 0,
        meta_sueldo_libre_pyg: parseInt(metasForm.meta_sueldo_libre_pyg, 10) || 0,
        margen_sugerido_porcentaje: parseInt(metasForm.margen_sugerido_porcentaje, 10) || 60,
      });
      setShowMetasModal(false);
      await loadData();
    } catch (err) {
      alert('Error al actualizar metas: ' + err.message);
    } finally {
      setSavingMetas(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (showCustomDate && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      } else {
        params.periodo = periodo;
      }

      const [statsData, gastosData, ventasData] = await Promise.all([
        fetchDashboardStats(params),
        fetchGastos(),
        fetchVentas(),
      ]);
      setStats(statsData);
      setGastos(gastosData);
      setVentas(ventasData);
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodo]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    loadData();
  };

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

  const formatGs = (val) => `Gs. ${(val || 0).toLocaleString('es-PY')}`;

  const goTo = (tab, alertFilter = null) => {
    if (onNavigate) onNavigate(tab, alertFilter);
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-stone-400 dark:text-zinc-500 text-xs">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Analizando métricas del negocio...</span>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const grafico = stats?.grafico_evolucion || [];
  const rankings = stats?.rankings || { mas_vendidos: [], mas_rentables: [] };
  const inventario = stats?.inventario_salud || { stock_bajo: [], agotados: [], sin_movimiento: [] };
  const ventasRes = stats?.ventas_resumen || { desglose_pagos: [] };
  const importaciones = stats?.importaciones || { lotes_recientes: [] };
  const gastosRes = stats?.gastos_resumen || { desglose_categorias: [] };
  const alertas = stats?.alertas || [];
  const getAlertNavigationFilter = (tipo) => {
    const variantsByAlert = {
      agotados: inventario.agotados,
      stock_bajo: inventario.stock_bajo,
      sin_movimiento: inventario.sin_movimiento,
    };
    return {
      type: tipo,
      variantIds: (variantsByAlert[tipo] || []).map((item) => item.variante_id),
    };
  };
  const maxChartVal = Math.max(...grafico.map(d => Math.max(d.facturacion, d.ganancia)), 1);
  const stockMarginPct = (kpis?.valor_inventario_venta > 0)
    ? Math.round(((kpis.valor_inventario_venta - kpis.valor_inventario_costo) / kpis.valor_inventario_venta) * 100)
    : 74;
  const mostrarFacturacionNetaEnMovil = Number(kpis.facturacion_bruta) !== Number(kpis.facturacion_neta);

  return (
    <div className="pb-28 pt-2 px-3 sm:px-6 max-w-6xl mx-auto space-y-6">

      {/* HEADER — Períodos & Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/60 border border-neutral-200 dark:border-zinc-800/80 p-4 rounded-3xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-black dark:text-white" />
              Panel de Control Financiero
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En Vivo
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Período: <b className="text-zinc-200">{stats?.periodo?.label}</b> ({stats?.periodo?.duracion_dias} días analizados)
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => goTo('pos')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nueva Venta</span>
          </button>

          <button
            onClick={() => setShowGastoModal(true)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-[#d6cebf] dark:border-zinc-700 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Gasto</span>
          </button>

          <button
            onClick={() => goTo('imports')}
            className="px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white rounded-xl text-xs flex items-center gap-1.5 border border-neutral-200 dark:border-zinc-800 transition"
            title="Ir a Envíos & Lotes"
          >
            <Package className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Lotes</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white rounded-xl border border-neutral-200 dark:border-zinc-800 transition"
            title="Recargar Métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUB-TABS — Métricas | Historial Ventas | Gastos */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl">
        {[
          { id: 'metricas', label: 'Métricas', icon: BarChart3 },
          { id: 'ventas', label: 'Historial Ventas', icon: Receipt },
          { id: 'gastos', label: 'Gastos Operativos', icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TAB: MÉTRICAS ===== */}
      {activeSubTab === 'metricas' && (<>

      {/* Selector de Períodos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {PERIODOS.map((p) => {
            const isSelected = !showCustomDate && periodo === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setShowCustomDate(false);
                  setPeriodo(p.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900/80 text-stone-500 dark:text-zinc-400 hover:text-zinc-200 border border-neutral-200 dark:border-zinc-800/80'
                }`}
              >
                {p.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              showCustomDate
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 text-stone-500 dark:text-zinc-400 hover:text-zinc-200 border border-neutral-200 dark:border-zinc-800/80'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Personalizado</span>
          </button>
        </div>

        {/* Input de Rango Personalizado */}
        {showCustomDate && (
          <form onSubmit={handleApplyCustomDates} className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 p-2 rounded-2xl border border-amber-500/30 animate-in fade-in-50">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-lg text-xs text-stone-900 dark:text-white outline-none focus:border-black dark:focus:border-white"
            />
            <span className="text-stone-400 dark:text-zinc-500 text-xs">a</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-lg text-xs text-stone-900 dark:text-white outline-none focus:border-black dark:focus:border-white"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold rounded-lg text-xs active:scale-95 transition"
            >
              Filtrar
            </button>
          </form>
        )}
      </div>

      {/* FILA 1 — 5 TARJETAS PRINCIPALES (KPIs Ejecutivos) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

        {/* 1. Facturación Bruta */}
        <div className={`${mostrarFacturacionNetaEnMovil ? 'flex' : 'hidden'} sm:flex bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex-col justify-between space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Facturación Bruta</span>
            {kpis.diff_facturacion_bruta_pct !== null && kpis.diff_facturacion_bruta_pct !== undefined && kpis.facturacion_bruta > 0 ? (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                kpis.diff_facturacion_bruta_pct >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {kpis.diff_facturacion_bruta_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpis.diff_facturacion_bruta_pct > 0 ? `+${kpis.diff_facturacion_bruta_pct}%` : `${kpis.diff_facturacion_bruta_pct}%`}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 font-sans">—</span>
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              {kpis.facturacion_bruta > 0 ? formatGs(kpis.facturacion_bruta) : 'Gs. 0'}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">Total cobrado en ventas</p>
          </div>
        </div>

        {/* 2. Facturación Neta */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Facturación Neta</span>
            {kpis.diff_facturacion_neta_pct !== null && kpis.diff_facturacion_neta_pct !== undefined && kpis.facturacion_neta > 0 ? (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                kpis.diff_facturacion_neta_pct >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {kpis.diff_facturacion_neta_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpis.diff_facturacion_neta_pct > 0 ? `+${kpis.diff_facturacion_neta_pct}%` : `${kpis.diff_facturacion_neta_pct}%`}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 font-sans">—</span>
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              {kpis.facturacion_neta > 0 ? formatGs(kpis.facturacion_neta) : 'Gs. 0'}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">Tras descuentos y devoluciones</p>
          </div>
        </div>

        {/* 3. Ganancia Neta (STAR CARD) */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-2 border-neutral-900 dark:border-white rounded-3xl p-4 flex flex-col justify-between space-y-2 relative shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-black dark:text-white" />
              Ganancia Neta Real
            </span>
            {kpis.diff_ganancia_neta_pct !== null && kpis.diff_ganancia_neta_pct !== undefined && kpis.ganancia_neta !== 0 ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                kpis.diff_ganancia_neta_pct >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}>
                {kpis.diff_ganancia_neta_pct > 0 ? `+${kpis.diff_ganancia_neta_pct}%` : `${kpis.diff_ganancia_neta_pct}%`}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 font-sans">—</span>
            )}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
              {formatGs(kpis.ganancia_neta)}
            </h3>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 font-medium">
              Ventas - Costos FOB - Fletes - Gastos
            </p>
          </div>
        </div>

        {/* 4. Margen Neto % */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Margen Neto</span>
            {kpis.diff_margen_puntos !== null && kpis.diff_margen_puntos !== undefined && kpis.facturacion_neta > 0 ? (
              <span className={`text-[10px] font-bold ${
                kpis.diff_margen_puntos >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {kpis.diff_margen_puntos > 0 ? `+${kpis.diff_margen_puntos} pts` : `${kpis.diff_margen_puntos} pts`}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 font-sans">—</span>
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
              {kpis.facturacion_neta > 0 ? `${kpis.margen_neto_pct}%` : '—'}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">Rentabilidad sobre ventas</p>
          </div>
        </div>

        {/* 5. Valor del Inventario */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Inventario Total</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200">
              {kpis.total_unidades_stock} u.
            </span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">{formatGs(kpis.valor_inventario_costo)}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
              Valor venta: <b className="text-stone-700 dark:text-zinc-300">{formatGs(kpis.valor_inventario_venta)}</b>
            </p>
            {stockMarginPct > 0 && (
              <div className="mt-1.5">
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {stockMarginPct}% margen promedio
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* TARJETA DE META MENSUAL & PUNTO DE EQUILIBRIO */}
      {stats?.punto_equilibrio_meta && (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-black dark:text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-black text-base text-stone-900 dark:text-white tracking-wide">
                    <span className="sm:hidden">Meta Mensual</span>
                    <span className="hidden sm:inline">Meta Mensual & Punto de Equilibrio</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 font-sans text-stone-600 dark:text-zinc-300 font-bold uppercase tracking-wider">
                    Mes Actual
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Obligaciones: <b className="text-stone-700 dark:text-zinc-200">Deudas ({formatGs(stats.punto_equilibrio_meta.cuota_deudas)})</b> + <b className="text-stone-700 dark:text-zinc-200">Meta Ads ({formatGs(stats.punto_equilibrio_meta.meta_ads)})</b> + <b className="text-stone-900 dark:text-white font-bold">Meta Libre ({formatGs(stats.punto_equilibrio_meta.sueldo_libre)})</b>
                </p>
                <p className="sm:hidden text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                  Equilibrio: <b className="text-stone-700 dark:text-zinc-200">{formatGs(stats.punto_equilibrio_meta.costos_fijos_mes)}</b>
                </p>
              </div>
            </div>

            {/* Badge de Estado & Botón Editar */}
            <div className="flex items-center gap-2">
              {stats.punto_equilibrio_meta.estado_meta === 'CUBRIENDO_COSTOS' && (
                <div className="px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-500 dark:text-rose-400 animate-pulse" />
                  <span className="sm:hidden">Faltan {formatGs(stats.punto_equilibrio_meta.faltante_equilibrio)}</span>
                  <span className="hidden sm:inline">Cubriendo Costos Fijos (Faltan {formatGs(stats.punto_equilibrio_meta.faltante_equilibrio)})</span>
                </div>
              )}
              {stats.punto_equilibrio_meta.estado_meta === 'EQUILIBRIO_ALCANZADO' && (
                <div className="px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-black dark:text-white" />
                  <span className="sm:hidden">Equilibrio alcanzado</span>
                  <span className="hidden sm:inline">¡Equilibrio Alcanzado! (Faltan {formatGs(stats.punto_equilibrio_meta.faltante_meta)} para meta libre)</span>
                </div>
              )}
              {stats.punto_equilibrio_meta.estado_meta === 'META_SUPERADA' && (
                <div className="px-3 py-1.5 rounded-2xl bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="sm:hidden">Meta superada</span>
                  <span className="hidden sm:inline">¡Meta Superada! (+Gs. {formatGs(stats.punto_equilibrio_meta.sueldo_libre)} libres en bolsillo)</span>
                </div>
              )}

              <button
                onClick={handleOpenEditMetas}
                className="p-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 border border-neutral-300 dark:border-zinc-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 flex-shrink-0"
                title="Editar Metas del Mes y Punto de Equilibrio"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Metas</span>
              </button>
            </div>
          </div>

          {/* Barra de Progreso Multifase */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 dark:text-zinc-300">
                Ganancia Bruta este mes: <b className="text-stone-900 dark:text-white text-sm font-black">{formatGs(stats.punto_equilibrio_meta.ganancia_bruta_mes_actual)}</b>
              </span>
              <span className="font-mono font-bold text-stone-900 dark:text-white">
                {stats.punto_equilibrio_meta.pct_meta_real}% de la Meta
              </span>
            </div>

            {/* Barra */}
            <div className="w-full h-4 bg-neutral-200 dark:bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-neutral-300 dark:border-zinc-800 relative">
              {/* Marcador Punto de Equilibrio */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-neutral-500 dark:bg-zinc-400 z-10"
                style={{ left: `${stats.punto_equilibrio_meta.meta_ganancia_bruta > 0 ? (stats.punto_equilibrio_meta.costos_fijos_mes / stats.punto_equilibrio_meta.meta_ganancia_bruta) * 100 : 0}%` }}
                title="Punto de Equilibrio (Deudas + Ads)"
              />
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stats.punto_equilibrio_meta.estado_meta === 'META_SUPERADA'
                    ? 'bg-emerald-500'
                    : stats.punto_equilibrio_meta.estado_meta === 'EQUILIBRIO_ALCANZADO'
                    ? 'bg-black dark:bg-white'
                    : 'bg-neutral-800 dark:bg-zinc-300'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, stats.punto_equilibrio_meta.pct_meta))}%` }}
              />
            </div>

            {/* Leyenda de Hitos de la Barra */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400 pt-1">
              <span>Gs. 0</span>
              <span className="font-medium text-center">
                ⚖️ Punto de Equilibrio: <b>{formatGs(stats.punto_equilibrio_meta.costos_fijos_mes)}</b>
                <span className="hidden sm:inline text-stone-400 dark:text-zinc-500"> (Ventas: {formatGs(stats.punto_equilibrio_meta.ventas_punto_equilibrio)})</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-white text-right">
                🎯 Meta Total: {formatGs(stats.punto_equilibrio_meta.meta_ganancia_bruta)}
                <span className="hidden sm:inline text-stone-400 dark:text-zinc-500"> (Ventas: {formatGs(stats.punto_equilibrio_meta.ventas_meta_mensual)})</span>
              </span>
            </div>
          </div>

          {/* 4 Mini Métricas Desglosadas */}
          <div className={`${showMobileMetaDetails ? 'grid' : 'hidden'} sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1`}>
            <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Deuda Fija Mensual</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {formatGs(stats.punto_equilibrio_meta.cuota_deudas)}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">Cuotas a cubrir / mes</span>
            </div>

            <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Presupuesto Meta Ads</span>
              <span className="text-sm font-black text-stone-900 dark:text-white mt-0.5 block">
                {formatGs(stats.punto_equilibrio_meta.meta_ads)}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">Pauta publicitaria / mes</span>
            </div>

            <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Ganancia Libre Deseada</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {formatGs(stats.punto_equilibrio_meta.sueldo_libre)}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">Limpio a tu bolsillo</span>
            </div>

            <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Ventas Necesarias ({stats.punto_equilibrio_meta.margen_comercial_pct}% mg)</span>
              <span className="text-sm font-black text-stone-900 dark:text-white mt-0.5 block">
                {formatGs(stats.punto_equilibrio_meta.ventas_meta_mensual)}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">Facturación meta del mes</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMobileMetaDetails((visible) => !visible)}
            className="sm:hidden w-full py-2 text-xs font-bold text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800 transition"
            aria-expanded={showMobileMetaDetails}
          >
            {showMobileMetaDetails ? 'Ocultar desglose' : 'Ver desglose de meta'}
          </button>
        </div>
      )}

      {/* FILA 2 — GRÁFICO PRINCIPAL DE EVOLUCIÓN */}
      <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-black dark:text-white" />
              Evolución de Facturación y Ganancia
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">Comportamiento de ventas y utilidad en el tiempo</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-stone-700 dark:text-zinc-300 text-xs">Facturación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-stone-700 dark:text-zinc-300 text-xs">Ganancia Neta</span>
            </div>
          </div>
        </div>

        {/* Gráfico SVG Responsivo */}
        <div className="relative pt-4 pb-2">
          {grafico.length > 0 && grafico.some(p => p.facturacion > 0 || p.ganancia > 0) ? (
            <div className="h-48 sm:h-56 w-full flex items-end gap-1 sm:gap-2">
              {grafico.map((point, idx) => {
                const facHeight = Math.max(4, (point.facturacion / maxChartVal) * 100);
                const ganHeight = Math.max(2, (point.ganancia / maxChartVal) * 100);
                const isHovered = hoveredPoint?.label === point.label;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Barras gemelas */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 max-w-[28px]">
                      <div
                        style={{ height: `${facHeight}%` }}
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered ? 'bg-amber-300 shadow-lg shadow-amber-500/40' : 'bg-amber-500/80 group-hover:bg-amber-400'
                        }`}
                      />
                      <div
                        style={{ height: `${ganHeight}%` }}
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered ? 'bg-emerald-300 shadow-lg shadow-emerald-500/40' : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                        }`}
                      />
                    </div>

                    <span className="text-[9px] sm:text-[10px] text-stone-400 dark:text-zinc-500 truncate mt-2 group-hover:text-zinc-200">
                      {idx % Math.ceil(grafico.length / 8) === 0 ? point.label : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 sm:h-56 w-full flex flex-col items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                <span>Sin datos en este período</span>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                No se registraron ventas ni movimientos para graficar
              </p>
            </div>
          )}

          {/* Tooltip flotante */}
          {hoveredPoint && (
            <div className="absolute top-0 right-4 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 p-3 rounded-2xl shadow-xl text-xs space-y-1 z-10 animate-in fade-in-50">
              <span className="font-bold text-stone-900 dark:text-white block pb-1 border-b border-neutral-200 dark:border-zinc-800">
                {hoveredPoint.label} ({hoveredPoint.pedidos} pedidos)
              </span>
              <div className="flex items-center justify-between gap-4 text-stone-700 dark:text-zinc-300">
                <span className="flex items-center gap-1 text-black dark:text-white">● Facturación:</span>
                <span className="font-bold">{formatGs(hoveredPoint.facturacion)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-stone-700 dark:text-zinc-300">
                <span className="flex items-center gap-1 text-emerald-400">● Ganancia:</span>
                <span className="font-bold">{formatGs(hoveredPoint.ganancia)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILA 3 — SECCIÓN DE PRODUCTOS (2 Rankings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ranking A: Más Vendidos (Volumen) */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-black dark:text-white" />
                Productos Más Vendidos
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Ordenados por cantidad de unidades vendidas</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 text-[10px] font-bold border border-neutral-200 dark:border-zinc-700">
              Por Volumen
            </span>
          </div>

          <div className="space-y-2">
            {rankings.mas_vendidos.length > 0 ? (
              rankings.mas_vendidos.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-black text-white dark:bg-white dark:text-black' :
                      idx === 1 ? 'bg-neutral-300 dark:bg-zinc-700 text-stone-900 dark:text-white' :
                      idx === 2 ? 'bg-neutral-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300' :
                      'bg-neutral-100 dark:bg-zinc-900 text-stone-400 dark:text-zinc-500 border border-neutral-200 dark:border-zinc-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">{p.producto}</h4>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                        {p.color} • {p.talle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-900 dark:text-white font-bold text-xs">
                      {p.unidades} u. vendidas
                    </span>
                    <span className="block text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                      {formatGs(p.facturacion)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                  <span>Sin datos registrados</span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Aún no hay ventas registradas en este período
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ranking B: Más Rentables (Ganancia Real) */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Gem className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Productos Más Rentables
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Los que mayor ganancia neta dejan en caja</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 text-[10px] font-bold border border-neutral-200 dark:border-zinc-700">
              Por Utilidad
            </span>
          </div>

          <div className="space-y-2">
            {rankings.mas_rentables.length > 0 ? (
              rankings.mas_rentables.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-black text-white dark:bg-white dark:text-black' :
                      idx === 1 ? 'bg-neutral-300 dark:bg-zinc-700 text-stone-900 dark:text-white' :
                      idx === 2 ? 'bg-neutral-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300' :
                      'bg-neutral-100 dark:bg-zinc-900 text-stone-400 dark:text-zinc-500 border border-neutral-200 dark:border-zinc-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">{p.producto}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-zinc-400">
                        <span>{p.unidades} u.</span>
                        <span>•</span>
                        <span className="text-stone-700 dark:text-zinc-300 font-bold">{p.margen_pct}% margen</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-stone-900 dark:text-white block">
                      +{formatGs(p.ganancia)}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                      Ventas: {formatGs(p.facturacion)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                  <span>Sin datos registrados</span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Aún no hay ventas registradas en este período
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FILA 4 — INVENTARIO Y ALERTAS vs. VENTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Diagnóstico de Inventario & Stock */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-black dark:text-white" />
                Estado del Inventario & Stock
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Control de unidades y alertas de reposición</p>
            </div>
            <button
              onClick={() => goTo('inventory')}
              className="text-xs text-black dark:text-white hover:underline flex items-center gap-0.5 font-bold"
            >
              Ver Todo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-tabs de inventario */}
          <div className="flex gap-1.5 p-1 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setStockTab('bajo')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                stockTab === 'bajo' ? 'bg-amber-500/20 text-neutral-700 dark:text-neutral-300 border border-amber-500/30' : 'text-stone-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Stock Bajo ({inventario.stock_bajo.length})
            </button>
            <button
              onClick={() => setStockTab('agotado')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                stockTab === 'agotado' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-stone-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Agotados ({inventario.agotados.length})
            </button>
            <button
              onClick={() => setStockTab('sin_mov')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
                stockTab === 'sin_mov' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-stone-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sin Venta ({inventario.sin_movimiento.length})
            </button>
          </div>

          {/* Lista dinámica según tab */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {stockTab === 'bajo' && inventario.stock_bajo.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/60 text-xs">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white block">{item.producto}</span>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">{item.color} • {item.talle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-black dark:text-white font-black text-xs">
                    {item.stock} u.
                  </span>
                  <button
                    onClick={() => goTo('inventory')}
                    className="p-1 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
                    title="Ver en inventario"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {stockTab === 'agotado' && inventario.agotados.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-rose-900/30 text-xs">
                <div>
                  <span className="font-bold text-rose-300 block">{item.producto}</span>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">{item.color} • {item.talle}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-black text-xs">
                  0 u. Agotado
                </span>
              </div>
            ))}

            {stockTab === 'sin_mov' && inventario.sin_movimiento.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/60 text-xs">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white block">{item.producto}</span>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">{item.color} • {item.talle} ({item.stock} u. paradas)</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Hace {item.dias_sin_venta}d sin venta
                </span>
              </div>
            ))}

            {((stockTab === 'bajo' && inventario.stock_bajo.length === 0) ||
              (stockTab === 'agotado' && inventario.agotados.length === 0) ||
              (stockTab === 'sin_mov' && inventario.sin_movimiento.length === 0)) && (
              <div className="py-8 flex flex-col items-center justify-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                  <span>Sin productos en esta condición</span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  El inventario se encuentra al día
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Ventas & Medios de Pago */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black dark:text-white" />
                Métricas de Ventas & Cobros
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Estadísticas de tickets y formas de pago</p>
            </div>
            <button
              onClick={() => goTo('pos')}
              className="text-xs text-black dark:text-white hover:underline flex items-center gap-0.5 font-bold"
            >
              Ir a POS <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Mini Tarjetas de Ventas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase font-bold block">Pedidos</span>
              <span className="text-base font-black text-stone-900 dark:text-white">{ventasRes.pedidos_totales}</span>
            </div>
            <div className="bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase font-bold block">Unidades</span>
              <span className="text-base font-black text-stone-900 dark:text-white">{ventasRes.unidades_vendidas}</span>
            </div>
            <div className="bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase font-bold block">Ticket Prom.</span>
              <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate block">
                {ventasRes.pedidos_totales > 0 ? formatGs(ventasRes.ticket_promedio) : '—'}
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase font-bold block">U. / Pedido</span>
              <span className="text-base font-black text-stone-900 dark:text-white">
                {ventasRes.pedidos_totales > 0 ? ventasRes.unidades_por_pedido : '—'}
              </span>
            </div>
          </div>

          {/* Desglose de Medios de Pago */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">
              Distribución por Medio de Pago:
            </span>
            <div className="space-y-1.5">
              {ventasRes.desglose_pagos.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700 dark:text-zinc-300 font-medium">{p.label} ({p.count} pagos)</span>
                    <span className="font-bold text-stone-900 dark:text-white">{formatGs(p.monto)} ({p.porcentaje}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.porcentaje}%` }}
                      className="h-full bg-black dark:bg-white rounded-full"
                    />
                  </div>
                </div>
              ))}

              {ventasRes.desglose_pagos.length === 0 && (
                <div className="py-6 flex flex-col items-center justify-center gap-1 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                    <span>Sin ventas en este período</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FILA 5 — IMPORTACIONES & GASTOS OPERATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sección Importaciones */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-black dark:text-white" />
                Importaciones & Lotes en Tránsito
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Control de capital en curso y fletes</p>
            </div>
            <button
              onClick={() => goTo('imports')}
              className="text-xs text-black dark:text-white hover:underline flex items-center gap-0.5 font-bold"
            >
              Ver Envíos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tarjeta resumen de importaciones */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-zinc-950 p-3 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 block">En Tránsito</span>
              <span className="font-bold text-stone-900 dark:text-white text-sm">{importaciones.en_transito_count} lotes</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 block">Mercadería FOB</span>
              <span className="font-bold text-stone-900 dark:text-white text-xs truncate block">
                {importaciones.valor_mercaderia_transito_pyg > 0 ? formatGs(importaciones.valor_mercaderia_transito_pyg) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 block">Flete Estimado</span>
              <span className="font-bold text-stone-900 dark:text-white text-xs truncate block">
                {importaciones.flete_estimado_transito_pyg > 0 ? formatGs(importaciones.flete_estimado_transito_pyg) : '—'}
              </span>
            </div>
          </div>

          {/* Lista de últimos lotes */}
          <div className="space-y-2">
            {importaciones.lotes_recientes.map((lote) => (
              <div
                key={lote.id}
                className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-zinc-950 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-white">{lote.nombre}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      lote.estado === 'RECIBIDO' ? 'bg-neutral-200 dark:bg-zinc-800 text-stone-900 dark:text-white' :
                      lote.estado === 'EN_TRANSITO' ? 'bg-neutral-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200' :
                      'bg-neutral-100 dark:bg-zinc-900 text-stone-500 dark:text-zinc-400'
                    }`}>
                      {lote.estado_display}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500 block mt-0.5">
                    Courier: {lote.courier} • {lote.dias_transito} días en curso
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-stone-900 dark:text-white font-bold text-xs block">{lote.tracking}</span>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                    Flete: {lote.flete_pyg > 0 ? formatGs(lote.flete_pyg) : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}

            {importaciones.lotes_recientes.length === 0 && (
              <div className="py-6 flex flex-col items-center justify-center gap-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                  <span>Sin lotes registrados</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección Gastos Operativos */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black dark:text-white" />
                Gastos Operativos del Negocio
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Costos fijos, publicidad y delivery</p>
            </div>
            <button
              onClick={() => setShowGastoModal(true)}
              className="text-xs text-black dark:text-white hover:text-black dark:text-white font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Registrar Gasto
            </button>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 flex items-baseline justify-between">
            <span className="text-xs text-stone-500 dark:text-zinc-400">Total Egresos en este período:</span>
            <span className="text-lg font-black text-stone-900 dark:text-white">{formatGs(gastosRes.total_gastos)}</span>
          </div>

          {/* Categorías de Gastos */}
          <div className="space-y-2">
            {gastosRes.desglose_categorias.map((g, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-700 dark:text-zinc-300">{g.label}</span>
                  <span className="font-bold text-stone-900 dark:text-white">{formatGs(g.monto)} ({g.porcentaje}%)</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${g.porcentaje}%` }}
                    className="h-full bg-black dark:bg-white rounded-full"
                  />
                </div>
              </div>
            ))}

            {gastosRes.desglose_categorias.length === 0 && (
              <div className="py-6 flex flex-col items-center justify-center gap-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                  <span>Sin gastos registrados en este período</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FILA 6 — BLOQUE DE ALERTAS IMPORTANTES (Accionables) */}
      {alertas.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-black dark:text-white" />
              Alertas del Negocio
            </h3>
            <span className="text-[10px] text-stone-400 dark:text-zinc-500">Acciones recomendadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {alertas.map((al, idx) => {
              const isDanger = al.severidad === 'danger';
              const isWarning = al.severidad === 'warning';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 transition ${
                    isDanger ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                    isWarning ? 'bg-amber-500/10 border-amber-500/30 text-neutral-700 dark:text-neutral-300' :
                    'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs leading-tight text-stone-900 dark:text-white mb-1">{al.titulo}</h4>
                    <p className="text-[11px] opacity-80 leading-relaxed">{al.descripcion}</p>
                  </div>

                  <button
                    onClick={() => goTo(al.accion_tab, getAlertNavigationFilter(al.tipo))}
                    className="mt-2 w-full py-1.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/80 hover:bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 text-stone-900 dark:text-white rounded-xl text-[11px] font-bold border border-neutral-200 dark:border-zinc-800 flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <span>{al.accion_label}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </>)} {/* END TAB: MÉTRICAS */}

      {/* ===== TAB: HISTORIAL DE VENTAS ===== */}
      {activeSubTab === 'ventas' && (
        <SalesHistoryView onReload={loadData} onNavigateToPos={() => goTo('pos')} />
      )}

      {/* ===== TAB: GASTOS OPERATIVOS ===== */}
      {activeSubTab === 'gastos' && (
        <ExpensesView onReload={loadData} />
      )}

      {/* MODAL — Registrar Gasto Rápido */}
      {showGastoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-black dark:text-white" />
                Registrar Gasto Operativo
              </h3>
              <button
                onClick={() => setShowGastoModal(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGasto} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Categoría de Gasto</label>
                <select
                  value={categoriaGasto}
                  onChange={(e) => setCategoriaGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                >
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Monto en Guaraníes (Gs.)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 50000"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anuncio Meta Ads o Bolsas Kraft"
                  value={descGasto}
                  onChange={(e) => setDescGasto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGastoModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGasto}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-xs disabled:opacity-50 transition"
                >
                  {savingGasto ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL — Editar Metas & Punto de Equilibrio */}
      {showMetasModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 space-y-5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 flex items-center justify-center">
                  <Target className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-stone-900 dark:text-white">
                    Editar Metas & Punto de Equilibrio
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">Ajusta tus costos fijos y objetivos del mes</p>
                </div>
              </div>
              <button
                onClick={() => setShowMetasModal(false)}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMetas} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cuota de Deudas */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                    💳 Cuota de Deudas (Gs./mes)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={metasForm.meta_deuda_mensual_pyg}
                    onChange={(e) => setMetasForm({ ...metasForm, meta_deuda_mensual_pyg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 focus:border-black dark:focus:border-white outline-none"
                    placeholder="1332000"
                  />
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500">Préstamos / Cuotas fijas</span>
                </div>

                {/* Presupuesto Meta Ads */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                    📢 Presupuesto Ads (Gs./mes)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={metasForm.meta_ads_mensual_pyg}
                    onChange={(e) => setMetasForm({ ...metasForm, meta_ads_mensual_pyg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800 rounded-xl text-sm font-black text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    placeholder="800000"
                  />
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500">Meta Ads / Pauta mensual</span>
                </div>

                {/* Ganancia Libre Deseada */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                    💰 Ganancia Libre (Gs./mes)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={metasForm.meta_sueldo_libre_pyg}
                    onChange={(e) => setMetasForm({ ...metasForm, meta_sueldo_libre_pyg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:border-black dark:focus:border-white outline-none"
                    placeholder="800000"
                  />
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500">Dinero libre en tu bolsillo</span>
                </div>

                {/* Margen Comercial Objetivo */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                    📈 Margen Objetivo (%)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="90"
                    value={metasForm.margen_sugerido_porcentaje}
                    onChange={(e) => setMetasForm({ ...metasForm, margen_sugerido_porcentaje: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800 rounded-xl text-sm font-black text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    placeholder="60"
                  />
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-stone-400 dark:text-zinc-500">
                      Margen real de tu stock: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{stockMarginPct}%</b>
                    </span>
                    {stockMarginPct > 0 && Number(metasForm.margen_sugerido_porcentaje) !== stockMarginPct && (
                      <button
                        type="button"
                        onClick={() => setMetasForm({ ...metasForm, margen_sugerido_porcentaje: stockMarginPct })}
                        className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Usar {stockMarginPct}%
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Previsualización en Vivo de Cálculos */}
              <div className="bg-neutral-100 dark:bg-zinc-950 p-3.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-zinc-400">⚖️ Punto de Equilibrio (Costos Fijos):</span>
                  <b className="text-stone-900 dark:text-white font-mono">
                    {formatGs((Number(metasForm.meta_deuda_mensual_pyg) || 0) + (Number(metasForm.meta_ads_mensual_pyg) || 0))}
                  </b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-zinc-400">🎯 Meta Total de Ganancia Bruta:</span>
                  <b className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatGs((Number(metasForm.meta_deuda_mensual_pyg) || 0) + (Number(metasForm.meta_ads_mensual_pyg) || 0) + (Number(metasForm.meta_sueldo_libre_pyg) || 0))}
                  </b>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-zinc-800">
                  <span className="text-stone-600 dark:text-zinc-400 font-bold">🛒 Ventas Necesarias al {metasForm.margen_sugerido_porcentaje}%:</span>
                  <b className="text-stone-900 dark:text-white font-mono font-black">
                    {formatGs(Math.round(((Number(metasForm.meta_deuda_mensual_pyg) || 0) + (Number(metasForm.meta_ads_mensual_pyg) || 0) + (Number(metasForm.meta_sueldo_libre_pyg) || 0)) / ((Number(metasForm.margen_sugerido_porcentaje) || 60) / 100)))}
                  </b>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMetasModal(false)}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMetas}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-bold rounded-xl text-xs disabled:opacity-50 transition"
                >
                  {savingMetas ? 'Guardando...' : 'Guardar Metas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {saleToVoid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-rose-500/30 rounded-3xl w-full max-w-sm p-5 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">¿Anular esta venta?</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
              Se devolverá el stock de los productos al catálogo y se restará del total de ventas.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSaleToVoid(null)}
                className="flex-1 py-2.5 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Volver
              </button>
              <button
                onClick={handleVoidSale}
                disabled={voiding}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-stone-900 dark:text-white font-bold rounded-xl text-xs disabled:opacity-50 transition"
              >
                {voiding ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
