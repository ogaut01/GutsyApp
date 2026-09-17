import React from 'react';
import { Gem, Sun, Moon, ShoppingBag, LogOut, User as UserIcon } from 'lucide-react';
import { getNavItems } from '../config/navigation';

export default function Sidebar({ activeTab, setActiveTab, cartCount, theme, onToggleTheme, onOpenCart, user, onLogout }) {
  const navItems = getNavItems(cartCount);

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 z-40 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 p-5 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-sm">
          <Gem className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase block font-sans">
            GUTSY • ACCESORIOS
          </span>
          <h2 className="text-xs font-bold tracking-wider text-black dark:text-white uppercase font-serif">
            SISTEMA DE GESTIÓN
          </h2>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="font-sans">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  isActive
                    ? 'bg-white text-black dark:bg-black dark:text-white'
                    : 'bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer del Sidebar: User Profile, Carrito (en POS), Selector Claro/Oscuro y Logout */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        {activeTab === 'pos' && (
          <button
            onClick={onOpenCart}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Carrito</span>
            </div>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white rounded-full font-black">
                {cartCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white hover:border-black dark:hover:border-white transition active:scale-95"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-white stroke-[2.2] animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-black stroke-[2.2] animate-in spin-in-180 duration-300" />
            )}
            <span className="font-sans uppercase tracking-wider">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono uppercase">
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </span>
        </button>

        {/* Usuario & Logout */}
        {user && (
          <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-black dark:text-white block truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">
                  {user.is_superuser ? 'Admin' : 'Operador'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl hover:bg-rose-500/15 text-neutral-500 hover:text-rose-500 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}