import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldCheck, RotateCcw, FileText, Truck, Phone,
  CheckCircle2, AlertCircle, HelpCircle, MessageCircle, MapPin, Mail, Instagram,
  Sparkles, CreditCard, Clock, PackageCheck
} from 'lucide-react';
import {
  STORE_WHATSAPP,
  STORE_WHATSAPP_DISPLAY
} from '../../constants/storefrontConstants';

const POLICY_TABS = [
  { id: 'reembolso', label: 'Cambios & Garantía', shortLabel: 'Cambios & Garantía', icon: RotateCcw },
  { id: 'envio', label: 'Envíos & Entrega', shortLabel: 'Envíos & Entrega', icon: Truck },
  { id: 'terminos', label: 'Pagos & Términos', shortLabel: 'Pagos & Términos', icon: FileText },
  { id: 'privacidad', label: 'Privacidad', shortLabel: 'Privacidad', icon: ShieldCheck },
  { id: 'contacto', label: 'Contacto Directo', shortLabel: 'Contacto', icon: Phone },
];

export default function StorePoliciesModal({
  isOpen = false,
  initialTab = 'reembolso',
  onClose
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'reembolso');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/90 dark:bg-zinc-900/40">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400">
                Transparencia & Confianza
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase font-serif">
                Políticas de la Tienda
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas (Pills horizontales elegantes con scroll suave) */}
          <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/20 px-3 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 sm:gap-2 py-2.5 min-w-max">
              {POLICY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido con scroll interno */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-light">
            
            {/* 1. CAMBIOS & GARANTÍA */}
            {activeTab === 'reembolso' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-serif">
                    <RotateCcw className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Garantía, Cambios y Devoluciones</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Queremos que compres con total tranquilidad y que cada pieza te quede impecable.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* Tarjeta: Garantía por falla */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/25 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <h4>Garantía por rotura o falla de fábrica (7 días)</h4>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300">
                      Revisamos cada accesorio a mano antes de empaquetarlo. Si al recibir tu paquete notas alguna falla de fabricación, broche roto o daño en el viaje, avísanos dentro de los <strong>7 días</strong> por WhatsApp con una foto o video. Te enviamos una pieza nueva de inmediato y <strong>el flete corre 100% por nuestra cuenta</strong>.
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-amber-500/15">
                      <em>Nota transparente:</em> Como en toda joyería, no cubre daños por tirones accidentales, caídas fuertes o si expones piezas que no sean de acero puro a perfumes o químicos abrasivos.
                    </p>
                  </div>

                  {/* Tarjeta: Cambio de talle */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                      <PackageCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h4>¿Te equivocaste con el talle o la medida? (7 días)</h4>
                    </div>
                    <p>
                      Si compraste un anillo o una pulsera y no te quedó bien la medida, no te preocupes: podés pedir el cambio dentro de los <strong>7 días</strong> posteriores a la entrega.
                    </p>
                    <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 pt-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>La pieza debe estar <strong>sin uso</strong> y con su empaque o bolsita original.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Los gastos de traslado por cambio de medida o modelo corren por cuenta del cliente.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tarjeta: Grabados Personalizados */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <h4>Accesorios con grabado láser personalizado</h4>
                    </div>
                    <p className="text-xs">
                      Las piezas grabadas con nombres, iniciales o fechas especiales se hacen exclusivamente a pedido tuyo, por lo que <strong>no tienen cambio por error en el texto solicitado</strong>. Sí cuentan con garantía total si presentasen alguna falla física en el material o armado.
                    </p>
                  </div>

                  {/* Tarjeta: Devolución / Reembolso */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <h4>Reembolso de dinero</h4>
                    </div>
                    <p className="text-xs">
                      Si un producto llegó con falla y no tenemos otra unidad en stock para reponértelo (o preferís no cambiarlo), te devolvemos el <strong>100% de tu dinero</strong> por transferencia bancaria en el mismo día en que recibamos la pieza de regreso.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ENVÍOS & ENTREGA */}
            {activeTab === 'envio' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-serif">
                    <Truck className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Envíos y Formas de Entrega</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Despachamos desde Villarrica a cualquier rincón de Paraguay de forma rápida y segura.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mb-2">
                        Villarrica
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1.5">
                        Delivery en el día
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Te lo llevamos directo a tu casa, trabajo o negocio en el casco urbano. Podés abonar por transferencia, QR o en efectivo cuando recibís el paquete en mano.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Coordinación en minutos por WhatsApp</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mb-2">
                        Interior del País
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1.5">
                        24 a 72 hs por Encomienda
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Enviamos a Asunción, Gran Asunción, CDE, Encarnación y todo el interior mediante empresas seguras como <strong>MC Group, TSI o La Guaireña</strong> (a domicilio o sucursal).
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Foto de guía y seguimiento por WhatsApp</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">
                    ¿Cómo funciona el pago del flete?
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span><strong>En Villarrica:</strong> Se incluye un costo accesible de delivery local en el total de tu pedido.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span><strong>En el interior:</strong> El costo del flete suele abonarse en destino directamente a la empresa de transporte al retirar o recibir tu caja. Si la agencia requiere pago previo, te lo informamos antes de despachar.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. PAGOS & TÉRMINOS */}
            {activeTab === 'terminos' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-serif">
                    <CreditCard className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Medios de Pago y Condiciones</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Operaciones claras en moneda local, sin comisiones sorpresa.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                      Formas de pago aceptadas
                    </h4>
                    <p className="text-xs">
                      Todos los precios del catálogo están en <strong>Guaraníes (Gs.)</strong>. Podés pagar con el método que te resulte más cómodo:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold block text-zinc-900 dark:text-white">Transferencia SIPAP</span>
                        <span className="text-zinc-500 text-[11px]">ueno bank, Banco Continental y Banco Itaú con alias directo.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold block text-zinc-900 dark:text-white">Pago con QR</span>
                        <span className="text-zinc-500 text-[11px]">Te pasamos el QR con el monto exacto para pagar desde cualquier app.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold block text-zinc-900 dark:text-white">Tarjetas Crédito / Débito</span>
                        <span className="text-zinc-500 text-[11px]">Link de pago seguro de Bancard para pagar con tu tarjeta favorita.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold block text-zinc-900 dark:text-white">Efectivo contra entrega</span>
                        <span className="text-zinc-500 text-[11px]">Disponible exclusivamente para entregas dentro de Villarrica.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                      Confirmación y preparación de tu pedido
                    </h4>
                    <p className="text-xs">
                      Una vez que recibimos tu comprobante de transferencia o pago por WhatsApp, reservamos físicamente tus accesorios, los grabamos a láser (si solicitaste grabado) y preparamos tu empaque con tarjeta de dedicatoria si es para regalo.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                      Fotos reales del producto
                    </h4>
                    <p className="text-xs">
                      Todas las fotografías son de los accesorios reales que vendemos. El tono de los metales o brillos puede presentar mínimas variaciones según la iluminación o la pantalla de tu teléfono, pero la pieza que recibes es exactamente el modelo publicado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVACIDAD */}
            {activeTab === 'privacidad' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-serif">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Tu Privacidad y Seguridad</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Cero spam, cero venta de información. Tus datos están seguros con nosotros.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Solo lo necesario para tu entrega
                    </h4>
                    <p className="text-xs">
                      Cuando hacés un pedido por la web o WhatsApp, solo te pedimos tu nombre, número de celular y dirección de entrega o sucursal de encomienda. Nada más.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      Uso 100% exclusivo
                    </h4>
                    <p className="text-xs">
                      Tus datos no salen de GUTSY ni se comparten con nadie ajeno. Solo se le brindan al chofer o a la empresa de encomiendas para que puedan ubicar tu casa o avisarte cuando el paquete esté listo para retirar.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      Control total
                    </h4>
                    <p className="text-xs">
                      Si alguna vez querés consultar o pedirnos que borremos tu contacto o historial de envíos de nuestra base de datos, con un simple mensaje al WhatsApp te lo resolvemos al instante.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CONTACTO DIRECTO */}
            {activeTab === 'contacto' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-serif">
                    <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Hablemos Directamente</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Atención personalizada por personas reales. Si tenés dudas sobre talles o querés asesoramiento para un regalo, escribinos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <a
                    href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola GUTSY, tengo una consulta sobre sus accesorios.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 transition flex items-start gap-3.5 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        WhatsApp Oficial
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                        {STORE_WHATSAPP_DISPLAY}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Lunes a Domingo: 08:00 a 19:00 hs
                      </p>
                    </div>
                  </a>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Base de Operaciones
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                        Villarrica, Guairá
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Tienda online con envíos a todo Paraguay
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://instagram.com/gutsy.py"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition flex items-start gap-3.5 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-sm">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Comunidad en Instagram
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:underline">
                        @gutsy.py
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Fotos de clientes, novedades y lanzamientos
                      </p>
                    </div>
                  </a>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Correo de Contacto
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                        gutsypy@gmail.com
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Consultas especiales y corporativas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer del Modal */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
              <span>¿Tenés alguna duda puntual sobre un modelo o tu envío?</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola GUTSY, tengo una consulta sobre mi compra.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hablar por WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
