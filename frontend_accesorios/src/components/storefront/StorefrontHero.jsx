import React from 'react';
import { Truck, PenTool, CreditCard, Layers } from 'lucide-react';

export default function StorefrontHero() {
  return (
    <section className="relative overflow-hidden bg-black text-white py-14 sm:py-20 border-b border-zinc-800">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase font-serif leading-tight">
          TU PROPIO ESTILO,<br />
          <span className="italic font-light tracking-wide text-zinc-300">TU PROPIA ESENCIA.</span>
        </h1>

        <p className="mt-4 text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
          Piezas únicas seleccionadas para acompañar tu día a día.
        </p>

        {/* Cinta de Confianza Minimalista */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400 font-medium tracking-wide">
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-zinc-300" /> Envíos a todo Paraguay</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-zinc-300" /> Grabados Láser Personalizados</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-zinc-300" /> Pagos seguros</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-zinc-300" /> Variedad de modelos</span>
        </div>
      </div>
    </section>
  );
}
