import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Gem } from 'lucide-react';

export default function ProductLightbox({ isOpen, onClose, images = [], activeIndex = 0, onSelectIndex, title = '' }) {
  if (!isOpen || images.length === 0) return null;

  const currentImg = images[activeIndex] || images[0];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-5xl h-[85vh] flex flex-col items-center justify-between"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between px-2 py-3 text-white border-b border-white/10">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest truncate max-w-md">
                {title || 'Vista Detallada'}
              </span>
              {currentImg?.label && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-zinc-300 ml-2">
                  {currentImg.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">
                {activeIndex + 1} / {images.length}
              </span>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div className="relative flex-1 w-full flex items-center justify-center p-4 overflow-hidden">
            {images.length > 1 && (
              <button
                onClick={() => onSelectIndex((activeIndex > 0 ? activeIndex - 1 : images.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-sm transition hover:scale-105"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <motion.img
              key={currentImg?.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={currentImg?.url}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-2xl cursor-zoom-out"
              onClick={onClose}
            />

            {images.length > 1 && (
              <button
                onClick={() => onSelectIndex((activeIndex < images.length - 1 ? activeIndex + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-sm transition hover:scale-105"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnails Navigation Bottom */}
          {images.length > 1 && (
            <div className="w-full py-3 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      isActive ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt={img.label || `Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
