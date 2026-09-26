import React from 'react';
import { motion } from 'framer-motion';
import { Gem, ChevronRight } from 'lucide-react';

/**
 * CampaignBanner — Sección editorial full-bleed estilo Apodemia + contadores Outribe.
 *
 * Props configurables (cambiar sin tocar código):
 * @param {string}   eyebrow   — Texto pequeño superior (ej: "Nueva Colección")
 * @param {string}   title     — Título principal grande (ej: "Colección Acero 316L")
 * @param {string}   ctaLabel  — Texto del botón CTA (ej: "Ver Colección")
 * @param {string}   ctaTarget — Selector CSS del ancla destino (ej: "#catalogo")
 * @param {Array}    stats     — Array de { value: string, label: string }
 * @param {string}   [imageUrl] — URL de imagen de fondo (opcional, usa placeholder si no se pasa)
 */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function CampaignBanner({
  eyebrow = 'Nueva Colección',
  title = 'Colección Acero 316L',
  ctaLabel = 'Ver Colección',
  ctaTarget = '#catalogo',
  stats = [
    { value: '500+', label: 'Clientas Satisfechas' },
    { value: '4.9★', label: 'Satisfacción' },
    { value: '24h', label: 'Delivery Villarrica' },
  ],
  imageUrl,
}) {
  const handleScrollTo = () => {
    const el = document.querySelector(ctaTarget);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden min-h-[320px] sm:min-h-[360px] md:min-h-[390px] flex items-center justify-center bg-zinc-950">
      {/* ─── Imagen de Fondo o Placeholder ─────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-zinc-950 flex items-center justify-center relative">
            {/* Marca de agua Gem de fondo centrado */}
            <Gem className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 text-zinc-600 opacity-20 stroke-[1]" />
            
            {/* Indicador sutil de imagen próximamente */}
            <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium backdrop-blur-sm">
              Imagen próximamente
            </span>
          </div>
        )}

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>

      {/* ─── Contenido Superpuesto ─────────────────────────────────── */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto py-10 sm:py-12 md:py-14 px-4 sm:px-6 flex flex-col items-center justify-center text-center text-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {/* Eyebrow */}
        <motion.span
          variants={itemVariants}
          className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/80 mb-3 sm:mb-4"
        >
          {eyebrow}
        </motion.span>

        {/* Title */}
        <motion.h2
          variants={itemVariants}
          className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase font-serif leading-tight max-w-4xl"
        >
          {title}
        </motion.h2>

        {/* CTA Button */}
        <motion.button
          variants={itemVariants}
          onClick={handleScrollTo}
          className="mt-5 sm:mt-6 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white text-black text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <span>{ctaLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>

        {/* Stats Counters (Outribe style) */}
        {stats && stats.length > 0 && (
          <motion.div
            variants={containerVariants}
            className="mt-6 sm:mt-7 grid grid-cols-3 gap-4 sm:gap-8 md:gap-12"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center"
              >
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight block leading-none">
                  {stat.value}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70 font-semibold mt-1 block">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
