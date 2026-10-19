import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Tag, Sparkles, ZoomIn, ChevronLeft, ChevronRight, Check,
  Ruler, Minus, Plus, ShoppingBag, Gift, Package, ChevronDown,
  ChevronUp, ShieldCheck, Truck, Gem, Share2
} from 'lucide-react';
import { formatGsInput } from '../../currency';
import {
  isCustomizableProduct,
  getColorSwatchStyle,
  getAroPrecios,
  copyToClipboard
} from '../../utils/storefrontHelpers';

export default function ProductDetailModal({
  activeModalProduct,
  onClose,
  modalImages = [],
  activeImageIndex = 0,
  setActiveImageIndex,
  selectedVariant,
  setSelectedVariant,
  earringOption,
  setEarringOption,
  modalQuantity,
  setModalQuantity,
  customEngravingText,
  engravingFace1,
  setEngravingFace1,
  engravingFace2,
  setEngravingFace2,
  activeEngravingFace,
  setActiveEngravingFace,
  engravingFont,
  setEngravingFont,
  openAccordion,
  setOpenAccordion,
  cart = [],
  removeCartItem,
  onAddToCart,
  onOpenSizeGuide,
  onOpenLightbox,
  onSetPreviewImage,
  matchedDbPackaging,
  crossSellProducts = [],
  onOpenAnotherProduct
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const crossSellScrollRef = useRef(null);

  if (!activeModalProduct) return null;

  const handleShareProduct = async () => {
    const shareUrl = `${window.location.origin}/producto/${activeModalProduct.id}`;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${activeModalProduct.nombre} | GUTSY`,
          text: `Mirá esta pieza en GUTSY: ${activeModalProduct.nombre}`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback a copiar al portapapeles
      }
    }
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="product-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          key="product-modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[92vh] my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Botón Cerrar Desktop en la esquina derecha del panel */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ─── COLUMNA IZQUIERDA: GALERÍA & FOTOS CON ZOOM ────── */}
          <div className="md:w-1/2 bg-zinc-50/80 dark:bg-zinc-900/50 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-center">
            <div className="w-full max-w-md">
              {/* Contenedor Principal de la Foto */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-inner group">
                {/* Badges sobre la foto */}
                {isCustomizableProduct(activeModalProduct) && (
                  <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      <span>Grabado Láser</span>
                    </span>
                  </div>
                )}

                {/* Barra de Herramientas Superior Derecha de la Imagen: Compartir y Cerrar */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 sm:gap-2">
                  {/* Botón Compartir */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareProduct();
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/75 hover:bg-black/90 border border-white/10 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition backdrop-blur-md ${
                      copiedLink ? 'text-emerald-400' : 'text-white'
                    }`}
                    title={copiedLink ? "¡Enlace copiado!" : "Compartir este accesorio"}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  {/* Botón Cerrar (en móvil visible siempre sobre la imagen) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition backdrop-blur-md md:hidden"
                    title="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Toast de enlace copiado */}
                {copiedLink && (
                  <div className="absolute top-14 right-3 z-30 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3 h-3" />
                    <span>¡Enlace copiado!</span>
                  </div>
                )}

                {/* Foto Activa con Click para Expandir */}
                <div
                  className="w-full h-full cursor-zoom-in flex items-center justify-center"
                  onClick={onOpenLightbox}
                >
                  {modalImages.length > 0 && (modalImages[activeImageIndex] || modalImages[0])?.url ? (
                    <img
                      key={(modalImages[activeImageIndex] || modalImages[0]).url}
                      src={(modalImages[activeImageIndex] || modalImages[0]).url}
                      alt={activeModalProduct.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      decoding="async"
                    />
                  ) : activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url ? (
                    <img
                      src={activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url}
                      alt={activeModalProduct.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Gem className="w-12 h-12 stroke-[1.5] mb-2" />
                      <span className="text-xs font-bold tracking-widest uppercase">GUTSY</span>
                    </div>
                  )}
                </div>

                {/* Flechas de Navegación de Fotos */}
                {modalImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev > 0 ? prev - 1 : modalImages.length - 1));
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition hover:scale-105 shadow-md"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev < modalImages.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition hover:scale-105 shadow-md"
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-mono font-bold backdrop-blur-sm shadow-sm">
                      {activeImageIndex + 1} / {modalImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Tira de Miniaturas (Thumbnails) */}
              {modalImages.length > 1 && (
                <div className="w-full flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar justify-center">
                  {modalImages.map((img, idx) => {
                    const isActive = activeImageIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          isActive
                            ? 'border-black dark:border-white scale-105 shadow-md ring-2 ring-black/10 dark:ring-white/20'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Material del Artículo */}
            <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-400 px-1">
              <div className="flex items-center gap-2" title={activeModalProduct.materiales?.map(m => m.nombre).join(', ') || 'Acero Quirúrgico'}>
                <Gem className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-xs">
                  {activeModalProduct.materiales && activeModalProduct.materiales.length > 0
                    ? activeModalProduct.materiales.map(m => m.nombre).join(', ')
                    : 'Acero Quirúrgico'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── COLUMNA DERECHA: DETALLES, SELECTORES & ACORDEÓN ───────── */}
          <div className="md:w-1/2 p-5 sm:p-6 md:p-8 md:overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              {/* Categoría, Género & Referencia (con padding derecho en desktop para no colisionar con el botón cerrar) */}
              <div className="md:pr-12">
                <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                    <Tag className="w-3 h-3 text-zinc-400" />
                    <span>{activeModalProduct.categoria_display || 'Accesorio'}</span>
                  </span>

                  {selectedVariant?.sku && (
                    <span className="font-mono text-zinc-400 text-[9px] bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                      SKU: {selectedVariant.sku}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-serif text-black dark:text-white leading-tight">
                  {activeModalProduct.nombre}
                </h2>

                {/* Precios & Estado */}
                <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                    Gs. {formatGsInput(
                      activeModalProduct.categoria === 'AR'
                        ? (earringOption === 'par'
                            ? getAroPrecios(activeModalProduct).precioPar
                            : getAroPrecios(activeModalProduct).precioUnidad)
                        : (selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0)
                    )}
                  </span>
                  {activeModalProduct.categoria === 'AR' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 self-center">
                      {earringOption === 'par' ? 'Por Par (2 un.)' : 'Por Unidad (1 un.)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Selector de Presentación (Par vs Unidad) para Aros & Aretes */}
              {activeModalProduct.categoria === 'AR' && (() => {
                const currentStock = selectedVariant != null ? (selectedVariant.stock ?? 0) : (activeModalProduct.stock_total ?? 0);
                const canBuyPair = currentStock >= 2;
                const { precioPar, precioUnidad } = getAroPrecios(activeModalProduct);

                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider block text-zinc-700 dark:text-zinc-300">
                      Selecciona Presentación:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={!canBuyPair}
                        onClick={() => setEarringOption('par')}
                        className={`p-3 rounded-xl border text-left transition relative ${
                          earringOption === 'par' && canBuyPair
                            ? 'border-black dark:border-white bg-white dark:bg-zinc-800 shadow-md ring-2 ring-black dark:ring-white'
                            : canBuyPair
                              ? 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white/50 dark:bg-zinc-950/50'
                              : 'border-zinc-200 dark:border-zinc-800 opacity-40 cursor-not-allowed bg-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-black dark:text-white">Par Completo</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            2 un.
                          </span>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                          Gs. {formatGsInput(precioPar)}
                        </span>
                        {!canBuyPair && (
                          <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">Stock insuf. para par</span>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={currentStock <= 0}
                        onClick={() => setEarringOption('unidad')}
                        className={`p-3 rounded-xl border text-left transition relative ${
                          earringOption === 'unidad' || !canBuyPair
                            ? 'border-black dark:border-white bg-white dark:bg-zinc-800 shadow-md ring-2 ring-black dark:ring-white'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white/50 dark:bg-zinc-950/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-black dark:text-white">Individual</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            1 un.
                          </span>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                          Gs. {formatGsInput(precioUnidad)}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Selector de Variantes (Colores & Talles) */}
              {activeModalProduct.variantes && activeModalProduct.variantes.length > 0 && (() => {
                const talleNum = (v) => {
                  const n = parseFloat((v.talle_medida || '').toString().replace(/[^0-9.]/g, ''));
                  return isNaN(n) ? 9999 : n;
                };

                const colorList = [];
                const seenColors = new Set();
                activeModalProduct.variantes.forEach(v => {
                  const c = (v.color || '').trim();
                  if (c && !seenColors.has(c.toLowerCase())) {
                    seenColors.add(c.toLowerCase());
                    colorList.push(c);
                  }
                });

                const currentColor = (selectedVariant?.color || '').trim() || (colorList.length > 0 ? colorList[0] : '');
                const filteredVariants = colorList.length > 0
                  ? activeModalProduct.variantes.filter(v => (v.color || '').trim().toLowerCase() === currentColor.toLowerCase())
                  : activeModalProduct.variantes;

                const disp = filteredVariants.filter(v => (v.stock || 0) > 0).sort((a, b) => talleNum(a) - talleNum(b));
                const agot = filteredVariants.filter(v => (v.stock || 0) <= 0).sort((a, b) => talleNum(a) - talleNum(b));
                const currentVariants = [...disp, ...agot];

                const isNoSizeProduct = activeModalProduct.categoria === 'AR' || activeModalProduct.categoria === 'PQ';
                const hasSizes = !isNoSizeProduct && currentVariants.some(v => v.talle_medida && v.talle_medida.trim() !== '' && v.talle_medida.toLowerCase() !== 'único');

                return (
                  <div className="space-y-4">
                    {/* Selector de Color */}
                    {colorList.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Color: <span className="font-black text-black dark:text-white capitalize">{currentColor || 'Estándar'}</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          {colorList.map((colName) => {
                            const isColorActive = currentColor.toLowerCase() === colName.toLowerCase();
                            const swatch = getColorSwatchStyle(colName);
                            const hasStockInColor = activeModalProduct.variantes.some(
                              v => (v.color || '').trim().toLowerCase() === colName.toLowerCase() && (v.stock || 0) > 0
                            );

                            return (
                              <button
                                key={colName}
                                type="button"
                                onClick={() => {
                                  const nextVariants = activeModalProduct.variantes.filter(
                                    v => (v.color || '').trim().toLowerCase() === colName.toLowerCase()
                                  );
                                  const currentTalle = selectedVariant?.talle_medida;
                                  let matchVar = nextVariants.find(v => v.talle_medida === currentTalle && (v.stock || 0) > 0);
                                  if (!matchVar) {
                                    matchVar = nextVariants.find(v => (v.stock || 0) > 0) || nextVariants[0];
                                  }
                                  if (matchVar) {
                                    setSelectedVariant(matchVar);
                                    setActiveImageIndex(0);
                                  }
                                }}
                                className={`relative w-8 h-8 rounded-full border transition-all flex items-center justify-center ${swatch.borderClass} ${swatch.bgClass} ${
                                  isColorActive
                                    ? 'ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-md'
                                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                                }`}
                                title={`${colName}${!hasStockInColor ? ' (Agotado)' : ''}`}
                              >
                                {isColorActive && (
                                  <Check className={`w-3.5 h-3.5 stroke-[3] ${swatch.isLight ? 'text-black' : 'text-white'}`} />
                                )}
                                {!hasStockInColor && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-zinc-900" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Selector de Talle con Botón Guía de Talles */}
                    {hasSizes && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Talle / Medida: {selectedVariant?.talle_medida ? (
                              <span className="font-extrabold text-black dark:text-white ml-1">
                                {selectedVariant.talle_medida}
                              </span>
                            ) : null}
                          </label>

                          <button
                            type="button"
                            onClick={() => onOpenSizeGuide(activeModalProduct.categoria)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline"
                          >
                            <Ruler className="w-3.5 h-3.5 text-amber-500" />
                            <span>Guía de Talles</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {currentVariants.map(v => {
                            const isSelected = selectedVariant?.id === v.id;
                            const hasVarStock = (v.stock || 0) > 0;
                            const displayNum = (v.talle_medida || '').replace(/^talle\s*/i, '').trim() || 'Único';

                            return (
                              <button
                                key={v.id}
                                type="button"
                                disabled={!hasVarStock}
                                onClick={() => setSelectedVariant(v)}
                                title={!hasVarStock ? 'Agotado' : `Talle ${displayNum} (Stock: ${v.stock} un.)`}
                                className={`min-w-[42px] h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                                  isSelected
                                    ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-md scale-105'
                                    : hasVarStock
                                      ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-black dark:hover:border-white'
                                      : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 opacity-40 cursor-not-allowed line-through'
                                }`}
                              >
                                {displayNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Personalización / Grabado Láser con Previsualizador Multi-Cara */}
              {isCustomizableProduct(activeModalProduct) && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Personalización Láser Gratis</span>
                    </label>
                    <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                      {activeEngravingFace === 'face1' ? engravingFace1.length : engravingFace2.length}/15 chars (Max 15 por cara)
                    </span>
                  </div>

                  {/* Selector de Caras (Frente / Dorso) */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveEngravingFace('face1')}
                      className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                        activeEngravingFace === 'face1'
                          ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span>Cara 1 (Frente)</span>
                      {engravingFace1.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEngravingFace('face2')}
                      className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                        activeEngravingFace === 'face2'
                          ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span>Cara 2 (Dorso)</span>
                      {engravingFace2.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                  </div>

                  {/* Selector de Estilo de Tipografía */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-medium block">Estilo de grabado:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'cursiva', label: 'Cursiva' },
                        { id: 'clasica', label: 'Clásica' },
                        { id: 'romana', label: 'Romanos' }
                      ].map(font => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setEngravingFont(font.id)}
                          className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                            engravingFont === font.id
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs ring-1 ring-black dark:ring-white'
                              : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Previsualizador Gráfico En Vivo */}
                  <div className="relative p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-0.5">
                      Simulación — {activeEngravingFace === 'face1' ? 'Cara 1 (Frente)' : 'Cara 2 (Dorso)'}
                    </span>
                    <div
                      className={`text-sm sm:text-base text-zinc-900 dark:text-zinc-100 transition-all select-none truncate max-w-full px-2 py-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${
                        engravingFont === 'cursiva'
                          ? 'font-serif italic font-medium tracking-wide'
                          : engravingFont === 'clasica'
                            ? 'font-sans font-black tracking-widest uppercase'
                            : 'font-serif font-bold tracking-widest uppercase'
                      }`}
                    >
                      {(activeEngravingFace === 'face1' ? engravingFace1 : engravingFace2).trim() || 'Escribe tu grabado'}
                    </div>
                  </div>

                  {/* Campo de Texto para la Cara Seleccionada */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      maxLength={15}
                      value={activeEngravingFace === 'face1' ? engravingFace1 : engravingFace2}
                      onChange={e => {
                        if (activeEngravingFace === 'face1') setEngravingFace1(e.target.value);
                        else setEngravingFace2(e.target.value);
                      }}
                      placeholder={activeEngravingFace === 'face1' ? "Ej: Lucas, Inicial A, Fecha..." : "Ej: 15.08.2024, Coordenadas..."}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white transition text-black dark:text-white placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Ejemplos de Inserción Rápida */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-400 font-medium">Sugerencias:</span>
                    {[
                      '15.08.2024',
                      'Lucas ♡',
                      'A ♾️ B',
                      '25°45\'S 56°W'
                    ].map(example => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          if (activeEngravingFace === 'face1') setEngravingFace1(example.slice(0, 15));
                          else setEngravingFace2(example.slice(0, 15));
                        }}
                        className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
                      >
                        +{example}
                      </button>
                    ))}
                  </div>

                  {/* Resumen del Grabado Completo */}
                  {customEngravingText && (
                    <div className="text-[11px] p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-semibold shrink-0">Resumen final:</span>
                      <span className="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 break-words">{customEngravingText}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    💡 Max 15 caracteres por cara para garantizar máxima claridad física en el grabado láser. Para fotos/dibujos personalizados, coordina en WhatsApp al finalizar.
                  </p>
                </div>
              )}

              {/* Selector de Cantidad y Botón Comprar */}
              {(() => {
                const currentStock = selectedVariant != null
                  ? (selectedVariant.stock ?? 0)
                  : (activeModalProduct.stock_total ?? 0);

                const isEarring = activeModalProduct.categoria === 'AR';
                const maxAllowedQty = isEarring
                  ? (earringOption === 'par' ? Math.floor(currentStock / 2) : currentStock)
                  : currentStock;

                const isAvailable = activeModalProduct.activo !== false && (
                  isEarring ? (earringOption === 'par' ? currentStock >= 2 : currentStock >= 1) : currentStock > 0
                );

                const currentUnitEffectivePrice = isEarring
                  ? (earringOption === 'par' ? getAroPrecios(activeModalProduct).precioPar : getAroPrecios(activeModalProduct).precioUnidad)
                  : (selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0);

                return (
                  <div className="space-y-3 pt-2">
                    {/* Selector de Cantidad */}
                    {isAvailable && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Cantidad {isEarring && (earringOption === 'par' ? '(Pares)' : '(Unidades)')}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                            className="w-8 h-8 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold hover:scale-105 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black w-6 text-center">{modalQuantity}</span>
                          <button
                            onClick={() => {
                              if (modalQuantity < maxAllowedQty) {
                                setModalQuantity(modalQuantity + 1);
                              } else {
                                alert(`Solo hay disponible para ${maxAllowedQty} ${isEarring && earringOption === 'par' ? 'par(es)' : 'unidad(es)'}.`);
                              }
                            }}
                            className="w-8 h-8 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold hover:scale-105 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botón Principal de Compra */}
                    <button
                      onClick={() => {
                        if (!isAvailable) return;
                        
                        const finalCustom = customEngravingText.trim()
                          ? `[GRABADO ${engravingFont.toUpperCase()}]: ${customEngravingText.trim()}`
                          : '';

                        onAddToCart(
                          activeModalProduct,
                          selectedVariant,
                          modalQuantity,
                          finalCustom,
                          isEarring ? earringOption : null
                        );
                      }}
                      disabled={!isAvailable}
                      className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                        isAvailable
                          ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-[1.01] active:scale-98 cursor-pointer'
                          : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-75'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>
                            AGREGAR AL PEDIDO • Gs. {formatGsInput(currentUnitEffectivePrice * modalQuantity)}
                          </span>
                        </>
                      ) : (
                        <span>Producto Agotado</span>
                      )}
                    </button>
                  </div>
                );
              })()}

              {/* ─── DESPLEGABLES & SECCIONES ADICIONALES ────────────── */}
              <div className="mt-6 space-y-4">
                {/* Desplegable Opcional "¿Es para regalo?" */}
                <div className="border-t border-b border-zinc-200 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === 'gift' ? null : 'gift')}
                    className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>¿Es para regalo?</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-normal text-zinc-400">
                        Personaliza tu regalo
                      </span>
                      {openAccordion === 'gift' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {openAccordion === 'gift' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pb-3.5 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Selecciona cómo te gustaría presentar tu joya para sorprender a esa persona especial:
                        </p>

                        <div className="space-y-2 pt-1">
                          {/* Opción 1: Empaque Estándar */}
                          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                  Empaque Estándar de Regalo
                                </h5>
                                <span className="text-[11px] font-medium text-emerald-500 block mt-0.5">
                                  Gratis 
                                </span>
                              </div>
                            </div>

                            {(() => {
                              const giftInCart = cart.some(i => i.productId === 'pkg-standard-gift');
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (giftInCart) {
                                      const giftItem = cart.find(i => i.productId === 'pkg-standard-gift');
                                      if (giftItem) removeCartItem(giftItem.key);
                                    } else {
                                      onAddToCart(
                                        {
                                          id: 'pkg-standard-gift',
                                          nombre: 'Empaque Estándar de Regalo',
                                          precio_venta: 0
                                        },
                                        null,
                                        1,
                                        '',
                                        null,
                                        false
                                      );
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                                    giftInCart
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white'
                                  }`}
                                  title={giftInCart ? 'Quitar empaque de regalo' : 'Agregar empaque de regalo gratis'}
                                >
                                  {giftInCart ? '✓ Agregado' : '+ Agregar'}
                                </button>
                              );
                            })()}
                          </div>

                          {/* Opción 2: Cajita Especial de Regalo */}
                          {(() => {
                            if (!matchedDbPackaging) return null;

                            const gCode = (activeModalProduct.genero || '').toUpperCase();
                            const gDisp = (activeModalProduct.genero_display || '').toLowerCase();
                            const isDama = gCode === 'MUJ' || gDisp.includes('dama') || gDisp.includes('mujer');

                            const dbBoxTitle = matchedDbPackaging.nombre || 'Cajita Especial de Regalo';
                            const isHeartBox = (dbBoxTitle || '').toLowerCase().includes('coraz');

                            if (isHeartBox && !isDama) return null;

                            const dbBoxImg = matchedDbPackaging.imagen_url_completa || matchedDbPackaging.imagen_url || matchedDbPackaging.variantes?.[0]?.imagen_url;
                            const dbBoxPrice = matchedDbPackaging.precio_venta || 30000;
                            const targetBoxProduct = matchedDbPackaging;

                            return (
                              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                                <div className="flex items-center gap-3 min-w-0">
                                  {dbBoxImg ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSetPreviewImage({ url: dbBoxImg, title: dbBoxTitle });
                                      }}
                                      className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900 group/box cursor-zoom-in focus:outline-none"
                                      title="Ver foto en tamaño completo"
                                    >
                                      <img src={dbBoxImg} alt={dbBoxTitle} className="w-full h-full object-cover group-hover/box:scale-110 transition duration-300" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/box:opacity-100 flex items-center justify-center transition backdrop-blur-[1px]">
                                        <ZoomIn className="w-4 h-4 text-white" />
                                      </div>
                                    </button>
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                                      <Gift className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                      {dbBoxTitle}
                                    </h5>
                                    <span className="text-[11px] font-medium text-zinc-400 block mt-0.5">
                                      Gs. {formatGsInput(dbBoxPrice)}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onAddToCart(targetBoxProduct, targetBoxProduct.variantes?.[0] || null, 1, '', null, false)}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-black dark:hover:bg-white transition shrink-0"
                                  title="Agregar cajita especial de regalo"
                                >
                                  + Agregar
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Módulo "Completa tu Look" (Carrusel de Sugerencias) */}
                {crossSellProducts.length > 0 && (
                  <div className="py-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Combiná con</span>
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (crossSellScrollRef.current) {
                              crossSellScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition"
                          title="Anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (crossSellScrollRef.current) {
                              crossSellScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition"
                          title="Siguiente"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={crossSellScrollRef}
                      className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 pt-0.5 scroll-smooth"
                    >
                      {crossSellProducts.map(item => {
                        const itemImg = item.imagen_url_completa || item.imagen_url || (item.variantes?.[0]?.imagen_url);
                        return (
                          <div
                            key={item.id}
                            className="w-[160px] sm:w-[180px] shrink-0 snap-start p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 transition group"
                          >
                            <div>
                              <div
                                className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer mb-2 relative"
                                onClick={() => onOpenAnotherProduct(item)}
                              >
                                {itemImg ? (
                                  <img src={itemImg} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <Gem className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <h5
                                onClick={() => onOpenAnotherProduct(item)}
                                className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline"
                                title={item.nombre}
                              >
                                {item.nombre}
                              </h5>
                            </div>

                            <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                              <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                                Gs. {formatGsInput(item.precio_venta || 0)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onAddToCart(item, item.variantes?.[0] || null, 1, '', null, false)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium hover:scale-105 transition shrink-0"
                                title="Agregar al pedido"
                              >
                                + Agregar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Acordeones Minimalistas */}
                <div className="border-t border-b border-zinc-200 dark:border-zinc-800/80 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {/* Cuidados de la Joya */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                      className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>Cuidados & Durabilidad</span>
                      </span>
                      {openAccordion === 'care' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>

                    <AnimatePresence>
                      {openAccordion === 'care' && (() => {
                        const matNames = (activeModalProduct.materiales || []).map(m => (m.nombre || '').toLowerCase());
                        const isAcero = matNames.some(m => m.includes('acero'));
                        const isPlata = matNames.some(m => m.includes('plata'));

                        return (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pb-3.5 px-1 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed"
                          >
                            {isAcero ? (
                              <>
                                <p>
                                  • <strong>Resistencia al agua:</strong> Las piezas de Acero Quirúrgico son altamente resistentes al agua y sudor. No manchan la piel ni se oscurecen.
                                </p>
                                <p>
                                  • <strong>Mantenimiento:</strong> Limpia periódicamente tu joya con un paño de microfibra seco para mantener su acabado brillante original.
                                </p>
                              </>
                            ) : isPlata ? (
                              <>
                                <p>
                                  • <strong>Cuidado de la Plata 925:</strong> Guardar en un lugar seco y proteger de la humedad constante para evitar deslustre.
                                </p>
                                <p>
                                  • <strong>Restauración de brillo:</strong> Si la plata se opaca naturalmente con el tiempo, frotar suavemente con un paño limpio especial para joyas de plata.
                                </p>
                              </>
                            ) : (
                              <>
                                <p>
                                  • <strong>Cuidado del acabado:</strong> Evitar contacto directo con agua, humedad constante, sudor excesivo o químicos para prolongar el brillo y durabilidad del acabado.
                                </p>
                                <p>
                                  • <strong>Almacenamiento:</strong> Guardar por separado en su estuche o bolsa protectora en un ambiente seco.
                                </p>
                              </>
                            )}
                            <p>
                              • <strong>Perfumes y lociones:</strong> Aplica lociones, cosméticos o perfumes antes de colocarte los accesorios para proteger el acabado.
                            </p>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* Logística de Envíos & Medios de Pago */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                      className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>Envíos & Medios de Pago</span>
                      </span>
                      {openAccordion === 'shipping' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>

                    <AnimatePresence>
                      {openAccordion === 'shipping' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pb-3.5 px-1 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed"
                        >
                          <p>
                            • <strong>Villarrica:</strong> Delivery local a domicilio (Gs. 15.000) o retiro acordado.
                          </p>
                          <p>
                            • <strong>Envíos Nacionales:</strong> A todo el Paraguay vía encomienda / transportadora.
                          </p>
                          <p>
                            • <strong>Medios de Pago:</strong> Transferencias SIPAP, pagos QR (débito/crédito) o efectivo al recibir (solo Villarrica).
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
