import React from 'react';
import { Filter } from 'lucide-react';
import { COLOR_FILTER_OPTIONS } from '../../constants/storefrontConstants';

export default function StorefrontFilters({
  activeCategories = [],
  selectedCategory,
  onSelectCategory,
  selectedGender,
  setSelectedGender,
  selectedMaterial,
  setSelectedMaterial,
  materialFilterOptions = [],
  selectedColor,
  setSelectedColor,
  sortBy,
  setSortBy,
  activeFilterCount,
  onResetFilters,
  onOpenMobileFilters
}) {
  return (
    <section
      id="catalogo"
      className="sticky top-20 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          {/* Pestañas de Categoría en Cápsulas Editoriales */}
          <div className="relative w-full">
            {/* Desvanecido sutil a los bordes para indicar scroll en móvil */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-black to-transparent z-10 md:hidden" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-black to-transparent z-10 md:hidden" />

            <div className="flex items-center md:justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-3 sm:px-0 scroll-smooth">
              {activeCategories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={(e) => {
                      onSelectCategory(cat.id);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold tracking-widest uppercase transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black font-black shadow-xs border border-black dark:border-white'
                        : 'bg-zinc-100/90 dark:bg-zinc-900/90 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros Secundarios Desktop: Género, Material, Color, Ordenar */}
          <div className="hidden md:flex items-center justify-center gap-3 flex-wrap text-xs pt-1">
            {/* Selector Género */}
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                selectedGender !== 'ALL'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
              }`}
            >
              <option value="ALL">TODOS LOS GÉNEROS</option>
              <option value="F">DAMA</option>
              <option value="M">CABALLERO</option>
              <option value="U">UNISEX</option>
            </select>

            {/* Selector Material */}
            <select
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                selectedMaterial !== 'ALL'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
              }`}
            >
              {materialFilterOptions.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            {/* Selector Color */}
            <select
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                selectedColor !== 'ALL'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
              }`}
            >
              {COLOR_FILTER_OPTIONS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            {/* Ordenar por */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor Precio</option>
              <option value="price-desc">Mayor Precio</option>
              <option value="name">Nombre A-Z</option>
            </select>

            {/* Botón limpiar si hay filtros activos */}
            {(activeFilterCount > 0 || selectedCategory !== 'ALL') && (
              <button
                onClick={onResetFilters}
                className="text-[11px] font-bold text-zinc-500 hover:text-black dark:hover:text-white underline ml-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Filtros Secundarios Mobile: Botón FILTRAR + Ordenar */}
          <div className="flex md:hidden items-center justify-between gap-2.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
            <button
              onClick={onOpenMobileFilters}
              className={`flex-1 py-2 px-3.5 rounded-full border text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition active:scale-95 ${
                activeFilterCount > 0
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-zinc-100/90 dark:bg-zinc-900/90 border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 rounded-full px-3.5 py-2 font-semibold tracking-wide text-xs focus:outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor Precio</option>
              <option value="price-desc">Mayor Precio</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
