import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Lock, Sun, Moon, ShoppingBag, Phone } from 'lucide-react';
import GutsyLogo from '../GutsyLogo';
import {
  ANNOUNCEMENT_ITEMS,
  STORE_WHATSAPP,
  STORE_WHATSAPP_DISPLAY
} from '../../constants/storefrontConstants';

export default function StorefrontNavbar({
  searchTerm,
  setSearchTerm,
  user,
  onGoToAdmin,
  theme,
  onToggleTheme,
  onOpenCart,
  cartBounce,
  totalCartItems
}) {
  return (
    <>
      {/* ─── BANNER SUPERIOR DE BENEFICIOS (Marquesina Infinita) ────────── */}
      <div className="bg-black dark:bg-zinc-900 text-white text-[11px] sm:text-xs py-2 border-b border-zinc-800 overflow-hidden relative select-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Pista de la marquesina con desvanecimiento en bordes */}
          <div className="flex-1 overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div className="animate-marquee flex items-center gap-6">
              {[...ANNOUNCEMENT_ITEMS, ...ANNOUNCEMENT_ITEMS].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 flex-shrink-0 text-zinc-300">
                    <IconComponent className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="font-medium tracking-wide whitespace-nowrap">{item.text}</span>
                    <span className="text-zinc-600 font-bold">•</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teléfono de contacto fijo a la derecha (pantallas grandes) */}
          <div className="hidden lg:flex items-center flex-shrink-0 pl-4 text-zinc-400 border-l border-zinc-800">
            <a
              href={`https://wa.me/${STORE_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1.5 text-zinc-300 font-semibold"
            >
              <Phone className="w-3 h-3 text-zinc-400" />
              <span>{STORE_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── HEADER / NAVBAR PRINCIPAL ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Slogan de Gutsy */}
          <div className="flex items-center gap-3">
            <GutsyLogo className="w-9 h-9 shrink-0" />
            <span className="text-xl sm:text-2xl font-black tracking-[0.22em] uppercase font-serif block leading-none">
              GUTSY
            </span>
          </div>

          {/* Barra de Búsqueda Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar collares, anillos, pulseras..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:border-black dark:focus:border-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Acciones: Carrito, Modo Claro/Oscuro y Panel Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Acceso admin solo visible si ya está autenticado */}
            {user && (
              <button
                onClick={onGoToAdmin}
                className="p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white transition"
                title="Panel"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Selector de Tema */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-black dark:hover:border-white transition"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            {/* Botón Carrito de Compras */}
            <button
              onClick={onOpenCart}
              className={`relative px-4 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
                cartBounce ? 'scale-110 ring-4 ring-black/20 dark:ring-white/20' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Carrito</span>
              {totalCartItems > 0 && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={totalCartItems}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                      mass: 0.6,
                    }}
                    className="px-2 py-0.5 text-[10px] bg-white text-black dark:bg-black dark:text-white rounded-full font-black"
                  >
                    {totalCartItems}
                  </motion.span>
                </AnimatePresence>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Mobile */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar joyas, accesorios..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
