import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Globe, Plus, Edit2, Trash2, X,
  CheckCircle2, MapPin, Package, Building2
} from 'lucide-react';
import {
  fetchConfiguracion, syncCotizaciones,
  fetchCouriers, createCourier, updateCourier, deleteCourier
} from '../services/api';

// ─── Formas vacías ────────────────────────────────────────────────────────────
const EMPTY_IMPORT_FORM = {
  es_transportadora_local: false,
  nombre: '',
  tipo_servicio: 'AER',
  cubre_eeuu_china: false,
  cubre_brasil: false,
  cubre_argentina: false,
  cubre_local_py: false,
  tarifa_aerea_usd_kg: '0.00',
  tarifa_maritima_usd_kg: '0.00',
  tarifa_terrestre_kg: '0.00',
  moneda_tarifa: 'USD',
  tiempo_entrega_estimado_dias: 7,
  contacto: '',
  ciudades_cobertura: '',
};

const EMPTY_LOCAL_FORM = {
  es_transportadora_local: true,
  nombre: '',
  tipo_servicio: 'LOC',
  contacto: '',
  ciudades_cobertura: '',
};

// ─── Componente de tarjeta de courier de importación ─────────────────────────
function ImportCourierCard({ c, onEdit, onDelete }) {
  const tipoLabel = { AER: 'Aéreo', MAR: 'Marítimo', TER: 'Terrestre BR', ARG: 'Terrestre AR' }[c.tipo_servicio] || c.tipo_servicio;
  const tipoColor = {
    AER: 'bg-amber-500/15 text-black dark:text-white',
    MAR: 'bg-cyan-500/15 text-cyan-400',
    TER: 'bg-emerald-500/15 text-emerald-400',
    ARG: 'bg-blue-500/15 text-blue-400',
  }[c.tipo_servicio] || 'bg-zinc-800 text-stone-500 dark:text-zinc-400';
  const sym = c.moneda_tarifa === 'PYG' ? 'Gs.' : c.moneda_tarifa === 'BRL' ? 'R$' : '$';

  const rutas = [
    c.cubre_eeuu_china && 'EE.UU./China',
    c.cubre_brasil && 'Brasil',
    c.cubre_argentina && 'Argentina',
  ].filter(Boolean);

  return (
    <div className="bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">{c.nombre}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${tipoColor}`}>
              {tipoLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-black dark:text-white border border-neutral-200 dark:border-zinc-800 transition" title="Editar">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-500 hover:text-rose-400 border border-neutral-200 dark:border-zinc-800 transition" title="Eliminar">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {rutas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {rutas.map(r => (
              <span key={r} className="text-[10px] bg-zinc-800 text-stone-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">{r}</span>
            ))}
          </div>
        )}

        <div className="space-y-1.5 text-xs mt-3">
          {parseFloat(c.tarifa_aerea_usd_kg) > 0 && (
            <div className="flex justify-between text-stone-500 dark:text-zinc-400">
              <span>Aéreo:</span>
              <span className="font-bold text-stone-900 dark:text-white">{sym} {c.tarifa_aerea_usd_kg} / kg</span>
            </div>
          )}
          {parseFloat(c.tarifa_maritima_usd_kg) > 0 && (
            <div className="flex justify-between text-stone-500 dark:text-zinc-400">
              <span>Marítimo:</span>
              <span className="font-bold text-stone-900 dark:text-white">{sym} {c.tarifa_maritima_usd_kg} / kg</span>
            </div>
          )}
          {parseFloat(c.tarifa_terrestre_kg) > 0 && (
            <div className="flex justify-between text-stone-500 dark:text-zinc-400">
              <span>Terrestre:</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">{sym} {c.tarifa_terrestre_kg} / kg</span>
            </div>
          )}
          <div className="flex justify-between text-stone-500 dark:text-zinc-400 pt-1 border-t border-zinc-900">
            <span>Entrega:</span>
            <span className="text-stone-700 dark:text-zinc-300 font-semibold">
              {c.tiempo_entrega_estimado_dias <= 2
                ? `${c.tiempo_entrega_estimado_dias} día${c.tiempo_entrega_estimado_dias === 1 ? '' : 's'} (Express)`
                : `${c.tiempo_entrega_estimado_dias} días aprox.`}
            </span>
          </div>
        </div>
      </div>

      {c.contacto && (
        <p className="text-[10px] text-stone-400 dark:text-zinc-500 italic border-t border-zinc-900 pt-2">{c.contacto}</p>
      )}
    </div>
  );
}

// ─── Componente de tarjeta de transportadora local ───────────────────────────
function LocalTransporterCard({ c, onEdit, onDelete }) {
  const ciudades = c.ciudades_cobertura
    ? c.ciudades_cobertura.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">{c.nombre}</h3>
            <span className="text-[10px] bg-purple-500/15 text-purple-400 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
              Transportadora Nacional / Local
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-black dark:text-white border border-neutral-200 dark:border-zinc-800 transition" title="Editar">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-500 hover:text-rose-400 border border-neutral-200 dark:border-zinc-800 transition" title="Eliminar">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-400" />
            Ciudades / Zonas de Cobertura ({ciudades.length})
          </span>
          {ciudades.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
              {ciudades.map(ciudad => (
                <span key={ciudad} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-medium">
                  {ciudad}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 italic">Sin ciudades registradas aún. Haz clic en editar para agregar.</p>
          )}
        </div>
      </div>

      {c.contacto && (
        <p className="text-[11px] text-stone-500 dark:text-zinc-400 border-t border-zinc-900 pt-2 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/40 px-2.5 py-1.5 rounded-lg">
          {c.contacto}
        </p>
      )}
    </div>
  );
}

// ─── Componente de input de tags (ciudades) ───────────────────────────────────
function CiudadTagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const ciudades = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const addCiudad = (ciudad) => {
    const trimmed = ciudad.trim();
    if (!trimmed || ciudades.includes(trimmed)) return;
    onChange([...ciudades, trimmed].join(', '));
    setInput('');
  };

  const removeCiudad = (ciudad) => {
    onChange(ciudades.filter(c => c !== ciudad).join(', '));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCiudad(input);
    }
    if (e.key === 'Backspace' && !input && ciudades.length > 0) {
      removeCiudad(ciudades[ciudades.length - 1]);
    }
  };

  return (
    <div className="w-full min-h-[44px] px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl flex flex-wrap gap-1.5 items-center focus-within:border-purple-500 transition">
      {ciudades.map(ciudad => (
        <span key={ciudad} className="flex items-center gap-1 text-[11px] bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full">
          {ciudad}
          <button type="button" onClick={() => removeCiudad(ciudad)} className="text-purple-400 hover:text-stone-900 dark:text-white font-bold leading-none ml-0.5">×</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addCiudad(input)}
        placeholder={ciudades.length === 0 ? 'Ej: Yhú, Asunción, CDE (Enter para agregar)...' : '+ escribir ciudad...'}
        className="flex-1 min-w-[140px] bg-transparent text-xs text-stone-900 dark:text-white outline-none placeholder-zinc-600"
      />
    </div>
  );
}

// ─── Vista Principal ──────────────────────────────────────────────────────────
export default function SettingsView({ onSyncSuccess }) {
  const [config, setConfig] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  // Buscador de ciudad para consulta rápida
  const [citySearch, setCitySearch] = useState('');

  // Modal unificado — tipo determina qué form mostrar
  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState('import'); // 'import' | 'local'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_IMPORT_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [configData, couriersData] = await Promise.all([fetchConfiguracion(), fetchCouriers()]);
      setConfig(configData);
      setCouriers(couriersData);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSyncRates = async () => {
    setSyncing(true); setMessage('');
    try {
      await syncCotizaciones();
      setMessage('Cotizaciones actualizadas correctamente');
      loadData();
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally { setSyncing(false); }
  };

  const openCreate = (tipo) => {
    setEditingId(null);
    setModalTipo(tipo);
    setForm(tipo === 'local' ? { ...EMPTY_LOCAL_FORM } : { ...EMPTY_IMPORT_FORM });
    setShowModal(true);
  };

  const openEdit = (c) => {
    const tipo = c.es_transportadora_local ? 'local' : 'import';
    setEditingId(c.id);
    setModalTipo(tipo);
    setForm({
      es_transportadora_local: c.es_transportadora_local || false,
      nombre: c.nombre || '',
      tipo_servicio: c.tipo_servicio || (tipo === 'local' ? 'LOC' : 'AER'),
      cubre_eeuu_china: c.cubre_eeuu_china || false,
      cubre_brasil: c.cubre_brasil || false,
      cubre_argentina: c.cubre_argentina || false,
      cubre_local_py: c.cubre_local_py || false,
      tarifa_aerea_usd_kg: c.tarifa_aerea_usd_kg || '0.00',
      tarifa_maritima_usd_kg: c.tarifa_maritima_usd_kg || '0.00',
      tarifa_terrestre_kg: c.tarifa_terrestre_kg || '0.00',
      moneda_tarifa: c.moneda_tarifa || 'USD',
      tiempo_entrega_estimado_dias: c.tiempo_entrega_estimado_dias || 7,
      contacto: c.contacto || '',
      ciudades_cobertura: c.ciudades_cobertura || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre) return;
    setSaving(true);
    try {
      const payload = modalTipo === 'local'
        ? {
            es_transportadora_local: true,
            nombre: form.nombre,
            tipo_servicio: 'LOC',
            ciudades_cobertura: form.ciudades_cobertura || '',
            contacto: form.contacto || '',
          }
        : {
            es_transportadora_local: false,
            nombre: form.nombre,
            tipo_servicio: form.tipo_servicio || 'AER',
            cubre_eeuu_china: form.cubre_eeuu_china,
            cubre_brasil: form.cubre_brasil,
            cubre_argentina: form.cubre_argentina,
            cubre_local_py: form.cubre_local_py,
            tarifa_aerea_usd_kg: parseFloat(form.tarifa_aerea_usd_kg) || 0,
            tarifa_maritima_usd_kg: parseFloat(form.tarifa_maritima_usd_kg) || 0,
            tarifa_terrestre_kg: parseFloat(form.tarifa_terrestre_kg) || 0,
            moneda_tarifa: form.moneda_tarifa || 'USD',
            tiempo_entrega_estimado_dias: parseInt(form.tiempo_entrega_estimado_dias) || 7,
            contacto: form.contacto || '',
          };

      if (editingId) await updateCourier(editingId, payload);
      else await createCourier(payload);

      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.nombre}"?`)) return;
    try { await deleteCourier(c.id); loadData(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  if (!config) return <div className="text-center py-20 text-stone-400 dark:text-zinc-500 text-xs">Cargando configuración...</div>;

  const importCouriers = couriers.filter(c => !c.es_transportadora_local);
  const localTransporters = couriers.filter(c => c.es_transportadora_local);

  // Filtrado de transportadoras por ciudad en consulta rápida
  const filteredLocal = citySearch.trim()
    ? localTransporters.filter(t => {
        const query = citySearch.toLowerCase();
        const cities = (t.ciudades_cobertura || '').toLowerCase();
        const name = (t.nombre || '').toLowerCase();
        return cities.includes(query) || name.includes(query);
      })
    : localTransporters;

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-6">

      {/* ── SECCIÓN 1: Cotizaciones ── */}
      <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-black dark:text-white" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">Cotizaciones Multimoneda</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">Valores de referencia para costear compras de EE.UU., Brasil, China y Argentina</p>
          </div>
          <button
            onClick={handleSyncRates} disabled={syncing}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Actualizando...' : 'Actualizar Cotizaciones'}
          </button>
        </div>

        {message && <div className="p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-neutral-700 dark:text-neutral-300">{message}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: '1 Dólar (USD)', value: config.tipo_cambio_usd, sub: 'China / AliExpress / Shein', color: 'text-black dark:text-white' },
            { label: '1 Real (BRL)', value: config.tipo_cambio_brl, sub: 'Brasil / Brás / Shopee', color: 'text-emerald-400' },
            { label: '1 Yuan (CNY)', value: config.tipo_cambio_cny, sub: 'Fábricas 1688 / Taobao', color: 'text-stone-500 dark:text-zinc-400' },
            { label: '1 Peso (ARS)', value: config.tipo_cambio_ars, sub: 'Mayoristas Argentina', color: 'text-cyan-400' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 block uppercase">{label}</span>
              <p className="text-lg font-black text-stone-900 dark:text-white mt-1">Gs. {value?.toLocaleString('es-PY')}</p>
              <span className={`text-[10px] ${color}`}>{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN 2: Couriers de Importación ── */}
      <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-black dark:text-white" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">Couriers de Importación</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">Saspy, Sendit, Globalbox y otros — usados al registrar y costear lotes del exterior</p>
          </div>
          <button
            onClick={() => openCreate('import')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-stone-900 dark:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-[#d6cebf] dark:border-zinc-700 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nuevo Courier
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {importCouriers.map(c => (
            <ImportCourierCard key={c.id} c={c} onEdit={openEdit} onDelete={handleDelete} />
          ))}
          {importCouriers.length === 0 && (
            <div className="col-span-full text-center py-8 text-zinc-600 text-xs italic">
              No hay couriers de importación registrados. Agregá Saspy, Sendit, Globalbox...
            </div>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 3: Transportadoras Locales PY (Consulta Informativa) ── */}
      <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">Transportadoras Locales Paraguay</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">MC Group, Guaireña, TSI, Aguila Express — consulta rápida de ciudades para responder a clientes</p>
          </div>
          <button
            onClick={() => openCreate('local')}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-purple-500/30 active:scale-95 transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nueva Transportadora
          </button>
        </div>

        {/* Buscador de cobertura para consultas inmediatas */}
        {localTransporters.length > 0 && (
          <div className="bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/80 border border-purple-500/20 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-purple-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold">¿Envían a...?</span>
            </div>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Escribí una ciudad para verificar qué transportadora llega (ej: Yhú, Caaguazú, CDE)..."
              className="w-full bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white placeholder-zinc-600 outline-none"
            />
            {citySearch && (
              <button
                onClick={() => setCitySearch('')}
                className="text-xs text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:text-zinc-300 whitespace-nowrap px-2"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Grid de Transportadoras Locales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLocal.map(c => (
            <LocalTransporterCard key={c.id} c={c} onEdit={openEdit} onDelete={handleDelete} />
          ))}
          {filteredLocal.length === 0 && localTransporters.length > 0 && (
            <div className="col-span-full text-center py-6 text-stone-400 dark:text-zinc-500 text-xs italic bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-2xl border border-neutral-200 dark:border-zinc-800/80">
              Ninguna transportadora registrada tiene cobertura en "{citySearch}".
            </div>
          )}
          {localTransporters.length === 0 && (
            <div className="col-span-full text-center py-8 text-zinc-600 text-xs italic">
              No hay transportadoras locales registradas. Agregá MC Group, Guaireña, TSI...
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL UNIFICADO ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                {modalTipo === 'local'
                  ? <><Building2 className="w-4 h-4 text-purple-400" /> {editingId ? 'Editar Transportadora Local' : 'Nueva Transportadora Local'}</>
                  : <><Package className="w-4 h-4 text-black dark:text-white" /> {editingId ? 'Editar Courier de Importación' : 'Nuevo Courier de Importación'}</>
                }
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Nombre de la Empresa</label>
                <input
                  type="text" required
                  placeholder={modalTipo === 'local' ? 'Ej: MC Group, Empresa Guaireña, TSI, Aguila Express...' : 'Ej: Saspy, Sendit, Globalbox...'}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              {modalTipo === 'import' ? (
                <>
                  {/* Rutas */}
                  <div className="p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-2xl border border-neutral-200 dark:border-zinc-800 space-y-2">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">Rutas que cubre</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'cubre_eeuu_china', label: 'EE.UU. / China' },
                        { key: 'cubre_brasil', label: 'Brasil' },
                        { key: 'cubre_argentina', label: 'Argentina' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => setForm({ ...form, [key]: !form[key] })}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${form[key] ? 'bg-amber-500 border-amber-500' : 'border-[#d6cebf] dark:border-zinc-700 bg-zinc-900'}`}
                          >
                            {form[key] && <CheckCircle2 className="w-3 h-3 text-zinc-950 stroke-[3]" />}
                          </div>
                          <span className="text-xs text-stone-700 dark:text-zinc-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Moneda + días */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Moneda</label>
                      <select
                        value={form.moneda_tarifa}
                        onChange={(e) => setForm({ ...form, moneda_tarifa: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="BRL">BRL (R$)</option>
                        <option value="ARS">ARS ($)</option>
                        <option value="PYG">PYG (Gs.)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Días Estimados</label>
                      <input
                        type="number" placeholder="7"
                        value={form.tiempo_entrega_estimado_dias}
                        onChange={(e) => setForm({ ...form, tiempo_entrega_estimado_dias: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Tarifas */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'tarifa_aerea_usd_kg', label: 'Aérea / kg' },
                      { key: 'tarifa_maritima_usd_kg', label: 'Marítima / kg' },
                      { key: 'tarifa_terrestre_kg', label: 'Terrestre / kg' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">{label}</label>
                        <input
                          type="number" step="0.01" placeholder="0.00"
                          value={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full px-2.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Contacto / Notas */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Sitio web / WhatsApp / Notas</label>
                    <input
                      type="text" placeholder='Ej: www.saspy.com.py · +595...'
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-700 dark:text-zinc-300 placeholder-zinc-600 focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Ciudades de cobertura */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                      Ciudades / Zonas de Cobertura en Paraguay
                    </label>
                    <CiudadTagInput
                      value={form.ciudades_cobertura}
                      onChange={(val) => setForm({ ...form, ciudades_cobertura: val })}
                    />
                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 block mt-1">Escribí el nombre de la ciudad (ej: Yhú, Caaguazú, CDE) y presioná Enter o coma para añadirla.</span>
                  </div>

                  {/* Contacto / Info de precios de referencia */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                      Información de Tarifas / Teléfono / Ubicación
                    </label>
                    <input
                      type="text"
                      placeholder='Ej: "Gs. 30.000 paquete mediano · Sucursal Gral Díaz c/ Bicentenario · 098x..."'
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-700 dark:text-zinc-300 placeholder-zinc-600 focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs">
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs disabled:opacity-50 transition text-zinc-950
                    ${modalTipo === 'local' ? 'bg-purple-400 hover:bg-purple-300' : 'bg-amber-500 hover:bg-amber-400'}`}
                >
                  {saving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Transportadora')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
