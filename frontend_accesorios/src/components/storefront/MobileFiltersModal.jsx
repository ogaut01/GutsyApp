import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { COLOR_FILTER_OPTIONS } from '../../constants/storefrontConstants';

export default function MobileFiltersModal({
  isOpen,
  onClose,
  activeFilterCount,
  selectedGender,
  setSelectedGender,
  selectedMaterial,
  setSelectedMaterial,
  materialFilterOptions = [],
  selectedColor,
  setSelectedColor,
  sortBy,
  setSortBy,
  onResetFilters,
  totalResults
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-filters-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="mobile-filters-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-black dark:text-white" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-serif">
                  Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:scale-105 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido scrolleable de filtros */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* 1. Género */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Público / Género</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'F', label: 'Dama' },
                    { id: 'M', label: 'Caballero' },
                    { id: 'U', label: 'Unisex' }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGender(g.id)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                        selectedGender === g.id
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Material */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Material</span>
                <div className="grid grid-cols-2 gap-2">
                  {materialFilterOptions.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterial(m.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                        selectedMaterial === m.id
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Color */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Color</span>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_FILTER_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                        selectedColor === c.id
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Ordenar */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Ordenar por</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'featured', label: 'Destacados' },
                    { id: 'price-asc', label: 'Menor Precio' },
                    { id: 'price-desc', label: 'Mayor Precio' },
                    { id: 'name', label: 'Nombre A-Z' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                        sortBy === s.id
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer con botones de acción */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center gap-3">
              <button
                onClick={onResetFilters}
                className="px-4 py-3 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold uppercase tracking-wider hover:opacity-80 transition"
              >
                Limpiar
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition"
              >
                Ver {totalResults} producto{totalResults !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
