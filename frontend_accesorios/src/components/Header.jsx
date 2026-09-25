import React from 'react';
import { ShoppingBag, Sun, Moon, Gem, LogOut } from 'lucide-react';

export default function Header({ activeTab, cartCount, onOpenCart, theme, onToggleTheme, user, onLogout }) {
  const titles = {
    dashboard: 'PANEL DE CONTROL',
    pos: 'PUNTO DE VENTA',
    storefront: 'TIENDA PÚBLICA',
    inventory: 'CATÁLOGO & STOCK',
    imports: 'LOGÍSTICA & ENVÍOS',
    clientes: 'CARTERA DE CLIENTES',
    settings: 'AJUSTES & TARIFAS',
  };

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Marca & Título estilo Minimalista Blanco y Negro */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-sm border border-neutral-200 dark:border-neutral-800">
            <Gem className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase block font-sans">
              GUTSY • ACCESORIOS
            </span>
            <h1 className="text-sm font-bold tracking-wider text-black dark:text-white uppercase font-serif leading-none mt-0.5">
              {titles[activeTab] || 'SISTEMA DE GESTIÓN'}
            </h1>
          </div>
        </div>

        {/* Acciones: Carrito (POS), Selector Claro/Oscuro y Logout */}
        <div className="flex items-center gap-2">
          {activeTab === 'pos' && (
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold flex items-center gap-1.5 active:scale-95 transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white rounded-full font-black">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Botón selector de Modo Claro / Oscuro */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white hover:border-black dark:hover:border-white shadow-sm transition active:scale-95 flex items-center gap-1.5"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-white stroke-[2.2] animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-black stroke-[2.2] animate-in spin-in-180 duration-300" />
            )}
            <span className="hidden sm:inline text-[10px] font-bold tracking-wider uppercase font-sans">
              {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          {/* Logout Mobile */}
          {user && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-rose-500 shadow-sm transition active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
