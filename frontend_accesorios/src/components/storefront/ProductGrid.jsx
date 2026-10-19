import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { ALL_STORE_CATEGORIES } from '../../constants/storefrontConstants';

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-pulse"
        >
          <div className="aspect-square bg-zinc-200 dark:bg-zinc-800" />
          <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
              <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({
  products = [],
  displayedProducts = [],
  filteredProducts = [],
  isLoading = false,
  isShimmering = false,
  selectedCategory = 'ALL',
  selectedGender = 'ALL',
  selectedMaterial = 'ALL',
  selectedColor = 'ALL',
  sortBy = 'featured',
  searchTerm = '',
  hasMoreProducts = false,
  onShowAll,
  onResetFilters,
  onOpenProductModal
}) {
  const currentCategory = ALL_STORE_CATEGORIES.find(c => c.id === selectedCategory);
  const categoryLabel = currentCategory ? currentCategory.label : 'Catálogo';

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Encabezado del listado */}
      <div className="flex items-center justify-between mb-6 pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-serif">
              {categoryLabel}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              {displayedProducts.length}{hasMoreProducts ? ` / ${filteredProducts.length}` : ''}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {filteredProducts.length === 1 ? '1 modelo disponible' : `${filteredProducts.length} modelos disponibles`}
          </p>
        </div>

        {(searchTerm || selectedCategory !== 'ALL' || selectedGender !== 'ALL' || selectedMaterial !== 'ALL' || selectedColor !== 'ALL') && (
          <button
            onClick={onResetFilters}
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-white underline font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Renderizado de Skeleton Wireframes de Carga o Grilla Real */}
      {isLoading || isShimmering ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 px-4 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800">
            <Search className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-widest font-serif">
            NO ENCONTRAMOS PRODUCTOS
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Prueba modificando alguno de tus filtros de categoría, material o color.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-6 px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition"
          >
            VER TODOS LOS PRODUCTOS
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategory}-${selectedGender}-${sortBy}-${searchTerm}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.035, delayChildren: 0.02 }
              },
              exit: { opacity: 0, transition: { duration: 0.1 } }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {displayedProducts.map((product, productIndex) => (
              <ProductCard
                key={product.id}
                product={product}
                productIndex={productIndex}
                selectedColor={selectedColor}
                onOpenModal={onOpenProductModal}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Botón "Ver catálogo completo" */}
      {hasMoreProducts && (
        <div className="flex justify-center mt-10 mb-4">
          <button
            onClick={onShowAll}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            Ver catálogo completo ({filteredProducts.length} productos)
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </main>
  );
}
