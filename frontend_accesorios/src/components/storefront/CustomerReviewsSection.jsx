import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, Maximize2, X } from 'lucide-react';

const REVIEWS_DATA = [
  {
    id: 1,
    name: 'Camila R.',
    date: '10/10/2026',
    city: 'Asunción',
    rating: 5,
    comment: 'Ya le entregué a mi novio, le encantó, realmente gracias por la paciencia, le quedó súper bien y es muy elegante como dijiste',
    img: '/reviews/1.jpg',
    productTag: 'Dúo Parejas Acero'
  },
  {
    id: 2,
    name: 'Lucas M.',
    date: '08/10/2026',
    city: 'San Lorenzo',
    rating: 5,
    comment: 'Perdón por no agradecerle... Pero me encantó está muy fachero, Gracias por el buen servicio',
    img: '/reviews/2.jpg',
    productTag: 'Cadena Figaro 5mm'
  },
  {
    id: 3,
    name: 'Mariano G.',
    date: '05/10/2026',
    city: 'Capiatá',
    rating: 5,
    comment: 'Que tal rey me acaba de llegar. Muchas gracias, Super. Me encantó',
    img: '/reviews/3.jpg',
    productTag: 'Anillo Calavera Sello'
  },
  {
    id: 4,
    name: 'Sofía B.',
    date: '02/10/2026',
    city: 'Ciudad del Este',
    rating: 5,
    comment: 'Muchísimas gracias, demasiado lindo es, me encantó',
    img: '/reviews/4.jpg',
    productTag: 'Collar Medalla Grabada'
  }
];

export default function CustomerReviewsSection() {
  const [activeReviewModal, setActiveReviewModal] = useState(null);

  return (
    <>
      <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
        {/* Header Reseñas */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase font-serif">
              Feedback de Clientes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Capturas de conversaciones reales en WhatsApp y clientes satisfechos al recibir sus accesorios GUTSY en Paraguay.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> 100% Compras Verificadas
            </span>
          </div>
        </div>

        {/* Grid de Tarjetas de Reseñas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REVIEWS_DATA.map((rev) => (
            <div
              key={rev.id}
              onClick={() => setActiveReviewModal(rev)}
              className="group relative bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-xl cursor-pointer"
            >
              {/* Captura de WhatsApp */}
              <div className="relative aspect-4/3 bg-zinc-900 overflow-hidden flex items-center justify-center">
                <img
                  src={rev.img}
                  alt={`Feedback ${rev.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                  <Maximize2 className="w-4 h-4" />
                  <span>Ver captura real</span>
                </div>
              </div>

              {/* Info de la Reseña */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1">
                      {rev.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{rev.date}</span>
                  </div>
                  <div className="flex items-center text-amber-400 my-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 italic line-clamp-3 leading-snug">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400 truncate max-w-[150px]">
                    {rev.productTag}
                  </span>
                  <span className="text-emerald-500 font-semibold">Verificada</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Lightbox de Reseña en Alta Resolución */}
      <AnimatePresence>
        {activeReviewModal && (
          <motion.div
            key="review-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden p-5 text-white shadow-2xl flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveReviewModal(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-zinc-700 hover:scale-105 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full aspect-auto rounded-2xl overflow-hidden bg-black border border-zinc-800 mb-4 flex items-center justify-center">
                <img
                  src={activeReviewModal.img}
                  alt={`Chat WhatsApp ${activeReviewModal.name}`}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeReviewModal.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Compra Verificada
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">{activeReviewModal.date}</span>
                </div>

                <div className="flex items-center text-amber-400">
                  {[...Array(activeReviewModal.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-zinc-300 italic bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  "{activeReviewModal.comment}"
                </p>

                <div className="text-[11px] text-zinc-500 font-mono pt-1">
                  Producto adquirido: <span className="text-zinc-300 font-semibold">{activeReviewModal.productTag}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
