import React from 'react';
import { ShoppingBag, RefreshCw, Sparkles } from 'lucide-react';

export default function Header({ activeTab, cartCount, onOpenCart, onQuickSync, syncing }) {
  const titles = {
    dashboard: 'Inicio & Resumen',
    pos: 'Punto de Venta',
    inventory: 'Catálogo & Stock',
    imports: 'Envíos & Casilla',
    settings: 'Cotizaciones & Config',
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              {titles[activeTab] || 'Accesorios PY'}
            </h1>
            <p className="text-[11px] text-zinc-400">Tienda & Joyería</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pos' && (
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-amber-500 text-zinc-950 font-semibold flex items-center gap-1.5 active:scale-95 transition shadow-md shadow-amber-500/25"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-zinc-950 text-amber-400 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {activeTab === 'settings' && (
            <button
              onClick={onQuickSync}
              disabled={syncing}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-medium flex items-center gap-1.5 text-xs transition border border-zinc-700 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
