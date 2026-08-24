import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, DollarSign, ExternalLink, ShieldCheck, Globe, Percent } from 'lucide-react';
import { fetchConfiguracion, syncCotizaciones } from '../services/api';

export default function SettingsView({ onSyncSuccess }) {
  const [config, setConfig] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const loadConfig = async () => {
    try {
      const data = await fetchConfiguracion();
      setConfig(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSyncRates = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const res = await syncCotizaciones();
      setMessage('✅ Cotizaciones actualizadas');
      loadConfig();
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!config) {
    return <div className="text-center py-20 text-zinc-500 text-xs">Cargando configuración...</div>;
  }

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* Botón Sincronizar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Cotizaciones Multimoneda</h2>
          </div>
          <span className="text-[10px] text-zinc-400">Actualizado en vivo</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Consulta automáticamente el valor del Dólar, Real, Yuan y Peso Argentino para costear tus importaciones en Guaraníes sin cálculos manuales.
        </p>

        {message && (
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-300">
            {message}
          </div>
        )}

        <button
          onClick={handleSyncRates}
          disabled={syncing}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Consultando API...' : 'SINCRONIZAR COTIZACIONES AHORA'}
        </button>
      </div>

      {/* Grid de Cotizaciones */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase">1 Dólar (USD)</span>
          <p className="text-xl font-black text-white mt-1">Gs. {config.tipo_cambio_usd?.toLocaleString('es-PY')}</p>
          <span className="text-[10px] text-amber-400">Compras Shein / Ali</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase">1 Real (BRL)</span>
          <p className="text-xl font-black text-white mt-1">Gs. {config.tipo_cambio_brl?.toLocaleString('es-PY')}</p>
          <span className="text-[10px] text-emerald-400">Compras Brasil / Brás</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase">1 Yuan (CNY)</span>
          <p className="text-xl font-black text-white mt-1">Gs. {config.tipo_cambio_cny?.toLocaleString('es-PY')}</p>
          <span className="text-[10px] text-zinc-400">Fábricas China</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase">1 Peso (ARS)</span>
          <p className="text-xl font-black text-white mt-1">Gs. {config.tipo_cambio_ars?.toLocaleString('es-PY')}</p>
          <span className="text-[10px] text-cyan-400">Mayoristas Argentina</span>
        </div>
      </div>

      {/* Tarifas de Courier y Margen */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-500" />
          Tarifas de Courier y Margen Deseado
        </h3>

        <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <div>
            <span className="text-zinc-500 block text-[10px]">Aéreo Courier</span>
            <span className="font-bold text-white">${config.costo_kilo_aereo_usd} / kg</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Marítimo Courier</span>
            <span className="font-bold text-white">${config.costo_kilo_maritimo_usd} / kg</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Margen Sugerido</span>
            <span className="font-bold text-amber-400">+{config.margen_sugerido_porcentaje}%</span>
          </div>
        </div>
      </div>

      {/* Acceso Django Admin */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-white">Panel Avanzado (Django Admin)</h4>
          <p className="text-[11px] text-zinc-400">Para importar/exportar Excel masivo y tablas completas.</p>
        </div>
        <a
          href="/admin/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl flex items-center gap-1 text-xs font-semibold transition"
        >
          <span>Abrir</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
