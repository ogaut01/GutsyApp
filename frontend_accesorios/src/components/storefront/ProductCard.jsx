import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gem, Eye, Plus } from 'lucide-react';
import { formatGsInput } from '../../currency';
import { getOptimizedImageUrl } from '../../utils/formatters';
import { getMatchingColorVariant, getAroPrecios } from '../../utils/storefrontHelpers';

export default function ProductCard({
  product,
  productIndex = 0,
  selectedColor = 'ALL',
  onOpenModal
}) {
  const activeVariantForCard = getMatchingColorVariant(product, selectedColor);
  const rawImageSrc = activeVariantForCard?.imagen_url || product.imagen_url_completa || product.imagen_url || null;
  // Ancho optimizado a 400px (ideal para pantallas Retina móviles sin desperdiciar ancho de banda)
  const imageSrc = getOptimizedImageUrl(rawImageSrc, 400);

  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(imageSrc);
    setHasError(false);
  }, [imageSrc]);

  const handleImageError = () => {
    // Si la URL con transformaciones de Cloudinary falla, reintentar con la URL directa
    if (currentSrc !== rawImageSrc && rawImageSrc) {
      setCurrentSrc(rawImageSrc);
    } else {
      setHasError(true);
    }
  };

  const hasStock = product.activo !== false && (product.stock_total || 0) > 0;
  const isLastUnit = hasStock && (product.stock_total || 0) === 1;
  const variants = product.variantes || [];
  
  const uniqueColors = Array.from(
    new Set(
      variants
        .map(v => (v.color || '').trim())
        .filter(Boolean)
    )
  );
  const uniqueSizes = Array.from(
    new Set(
      variants
        .map(v => (v.talle_medida || '').replace(/^talle\s*/i, '').trim())
        .filter(Boolean)
    )
  );
  const previewBadges = uniqueColors.length > 0
    ? uniqueColors
    : uniqueSizes.length > 0
      ? uniqueSizes
      : variants.map((v, i) => v.sku || `Opción ${i + 1}`);

  const hasPreviewBadges = previewBadges.length > 0 && (variants.length > 1 || previewBadges.length > 1);

  // Primeras 2 tarjetas en móviles son candidatas críticas de LCP
  const isPriority = productIndex < 2;
  const isAboveFold = productIndex < 4;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
        },
        exit: { opacity: 0, transition: { duration: 0.08 } }
      }}
      key={product.id}
      data-testid="product-card"
      className="group relative bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-xl"
    >
      {/* Contenedor de Imagen */}
      <div
        className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
        onClick={() => onOpenModal(product)}
      >
        {currentSrc && !hasError ? (
          <img
            src={currentSrc}
            alt={product.nombre}
            className={`w-full h-full object-cover transition-all duration-300 ${
              hasStock ? 'group-hover:scale-105' : 'opacity-75 grayscale-[20%] group-hover:opacity-100'
            }`}
            loading={isAboveFold ? 'eager' : 'lazy'}
            fetchPriority={isPriority ? 'high' : undefined}
            decoding="async"
            width="300"
            height="300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-4 text-center">
            <Gem className="w-10 h-10 stroke-[1.5] mb-2" />
            <span className="text-[10px] uppercase font-bold tracking-widest">GUTSY</span>
          </div>
        )}

        {/* Badges Flotantes */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10 pointer-events-none">
          {isLastUnit && (
            <span className="w-fit px-2 py-0.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
              ¡Última unidad!
            </span>
          )}
          {!hasStock && (
            <span className="w-fit px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10 text-[9px] font-bold tracking-widest uppercase shadow-sm">
              Agotado
            </span>
          )}
        </div>

        {/* Botón Vista Rápida en hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(product);
          }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-black text-black dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
          title={`Ver detalle de ${product.nombre}`}
          aria-label={`Ver detalle de ${product.nombre}`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Información del Producto */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Categoría & Materiales */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            <span>{product.categoria_display || 'Accesorio'}</span>
            {product.materiales?.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate">{product.materiales[0].nombre}</span>
              </>
            )}
          </div>

          {/* Nombre */}
          <h3
            onClick={() => onOpenModal(product)}
            className="text-xs sm:text-sm font-bold text-black dark:text-white tracking-wide uppercase line-clamp-2 cursor-pointer hover:underline"
          >
            {product.nombre}
          </h3>

          {/* Variantes mini preview */}
          {hasPreviewBadges && (
            <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {previewBadges.map((badge, i) => {
                const matchingVar = product.variantes?.find(v => (v.color || '').trim().toLowerCase() === badge.toLowerCase());
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal(product, matchingVar || null);
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold whitespace-nowrap hover:border-black dark:hover:border-white transition"
                  >
                    {badge}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Precio y Botón de Compra */}
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-medium block leading-none">Precio</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-black dark:text-white tracking-wider">
                Gs. {formatGsInput(product.precio_venta || 0)}
              </span>
              {product.categoria === 'AR' && (
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  / par
                </span>
              )}
            </div>
            {product.categoria === 'AR' && (
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block leading-tight font-medium">
                o Gs. {formatGsInput(getAroPrecios(product).precioUnidad)} c/u
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenModal(product)}
            title={hasStock ? `Comprar ${product.nombre}` : `Producto agotado: ${product.nombre}`}
            aria-label={hasStock ? `Comprar ${product.nombre}` : `Producto agotado: ${product.nombre}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 ${
              hasStock
                ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400'
            }`}
          >
            {hasStock ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comprar</span>
              </>
            ) : (
              <span className="text-[11px]">Agotado</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
