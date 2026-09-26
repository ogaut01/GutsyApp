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
    <section className="relative w-full overflow-hidden">
      {/* ─── Imagen de Fondo o Placeholder ─────────────────────────────── */}
      <div className="relative aspect-[4/5] sm:aspect-[16/7] md:aspect-[21/9] w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3">
            <Gem className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-700 stroke-[1]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-600 font-semibold">
              Imagen próximamente
            </span>
          </div>
        )}

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

        {/* ─── Contenido Superpuesto ─────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 sm:px-6"
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
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase font-serif leading-tight max-w-4xl"
          >
            {title}
          </motion.h2>

          {/* CTA Button */}
          <motion.button
            variants={itemVariants}
            onClick={handleScrollTo}
            className="mt-6 sm:mt-8 px-7 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <span>{ctaLabel}</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* Stats Counters (Outribe style) */}
          {stats && stats.length > 0 && (
            <motion.div
              variants={containerVariants}
              className="mt-8 sm:mt-10 grid grid-cols-3 gap-6 sm:gap-10 md:gap-14"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="text-center"
                >
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight block leading-none">
                    {stat.value}
                  </span>
                  <span className="text-[9px] sm:text-[11px] uppercase tracking-widest text-white/70 font-semibold mt-1 block">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
