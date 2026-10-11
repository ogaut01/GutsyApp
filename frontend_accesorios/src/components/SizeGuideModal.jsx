import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Sparkles, Check, ChevronRight, Info } from 'lucide-react';

const RING_SIZES = [
  { talle: '6', diametro: '16.5 mm', circunferencia: '51.8 mm' },
  { talle: '7', diametro: '17.3 mm', circunferencia: '54.4 mm' },
  { talle: '8', diametro: '18.2 mm', circunferencia: '57.0 mm' },
  { talle: '9', diametro: '19.0 mm', circunferencia: '59.5 mm' },
  { talle: '10', diametro: '19.8 mm', circunferencia: '62.1 mm' },
  { talle: '11', diametro: '20.6 mm', circunferencia: '64.6 mm' },
  { talle: '12', diametro: '21.4 mm', circunferencia: '67.2 mm' },
  { talle: '13', diametro: '22.2 mm', circunferencia: '69.7 mm' },
];

const CHAIN_LENGTHS = [
  { length: '45 cm (18")', desc: 'Gargantilla / Base del cuello', fit: 'Queda ceñida en la base del cuello, visible con cualquier escote o remera abierta.' },
  { length: '50 cm (20")', desc: 'Clavícula (El más popular)', fit: 'Cae sobre la clavícula. Es la medida estándar ideal tanto para dama como para caballero.' },
  { length: '55 cm (22")', desc: 'Pecho superior', fit: 'Cae unos centímetros bajo la clavícula. Perfecto para combinar con dijes medianos o grandes.' },
  { length: '60 cm (24")', desc: 'Pecho medio', fit: 'Cae sobre el esternón. Ideal para llevar por fuera de remeras, buzos o superposición de cadenas (layering).' },
  { length: '70 cm (28")', desc: 'Largo libre', fit: 'Largo extra que cae en la parte inferior del pecho, look urbano o dijes llamativos.' },
];

export default function SizeGuideModal({ isOpen, onClose, initialTab = 'anillos' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-sm">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Guía Oficial de Talles & Medidas</h3>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
                  Encuentra tu medida exacta para cada joya
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:scale-105 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/30 px-4 pt-2 gap-2">
            {[
              { id: 'anillos', label: 'Anillos' },
              { id: 'cadenas', label: 'Cadenas & Collares' },
              { id: 'pulseras', label: 'Pulseras' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative rounded-t-xl ${
                  activeTab === tab.id
                    ? 'text-black dark:text-white bg-white dark:bg-zinc-950 border-t border-l border-r border-zinc-200 dark:border-zinc-800'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* ANILLOS */}
            {activeTab === 'anillos' && (
              <div className="space-y-6">
                {/* Paso a paso */}
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>¿Cómo saber tu talle de anillo en 2 minutos?</span>
                  </div>
                  <ol className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                    <li>
                      <strong className="text-black dark:text-white">Con un anillo que ya te quede bien:</strong> Mide con una regla el <em>diámetro interior</em> en milímetros (de borde interno a borde interno, sin incluir el grosor del metal).
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">Con una tira de papel o hilo:</strong> Envuélvela alrededor de la base del dedo, marca el punto de cruce con un bolígrafo y mide el largo con una regla (circunferencia).
                    </li>
                  </ol>
                  <div className="flex items-start gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
                    <Info className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                    <span>Si estás entre dos talles, siempre recomendamos elegir el talle superior para mayor comodidad.</span>
                  </div>
                </div>

                {/* Tabla de Equivalencias */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-2.5">
                    Tabla de Medidas (Estándar Internacional)
                  </h4>
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Talle</th>
                          <th className="py-2.5 px-3">Diámetro Interior</th>
                          <th className="py-2.5 px-3">Circunferencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {RING_SIZES.map(item => (
                          <tr key={item.talle} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                            <td className="py-2 px-3 font-bold text-black dark:text-white">Talle {item.talle}</td>
                            <td className="py-2 px-3 font-mono text-zinc-700 dark:text-zinc-300">{item.diametro}</td>
                            <td className="py-2 px-3 font-mono text-zinc-500 dark:text-zinc-400">{item.circunferencia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CADENAS & COLLARES */}
            {activeTab === 'cadenas' && (
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-1">
                    Guía Visual de Caída en Pecho
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                    La caída depende de la contextura física y el grosor del cuello. A continuación las medidas estándar de referencia:
                  </p>

                  <div className="space-y-2.5">
                    {CHAIN_LENGTHS.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                        <div className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-black font-mono">
                          {item.length.split(' ')[0]}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-bold text-black dark:text-white">{item.desc}</h5>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.fit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PULSERAS */}
            {activeTab === 'pulseras' && (
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                    ¿Cómo medir tu muñeca?
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    1. Pasa una cinta métrica o tira de papel justo por detrás del hueso de la muñeca (sin apretar demasiado).<br />
                    2. Para un ajuste cómodo que permita movimiento natural, súmale <strong>1.5 cm a 2.0 cm</strong> a tu medida real.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="font-bold text-black dark:text-white block">Dama (Estándar)</span>
                      <span className="text-[11px] text-zinc-500 font-mono">16 cm - 19 cm (ajustable)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="font-bold text-black dark:text-white block">Caballero (Estándar)</span>
                      <span className="text-[11px] text-zinc-500 font-mono">19 cm - 22 cm (ajustable)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">
              ¿Dudas sobre tu talle? Te asesoramos en WhatsApp.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:scale-105 transition shadow-sm"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
