import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccessModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h3 className="text-lg font-black uppercase font-serif tracking-wide">
          ¡Pedido Enviado a WhatsApp!
        </h3>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Tu pedido fue generado con éxito. En instantes nos pondremos en contacto contigo por WhatsApp para coordinar la entrega y el pago.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
        >
          Entendido, volver a la tienda
        </button>
      </div>
    </div>
  );
}
