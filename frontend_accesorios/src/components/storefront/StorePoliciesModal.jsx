import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldCheck, RotateCcw, FileText, Truck, Phone,
  CheckCircle2, AlertCircle, HelpCircle, ArrowRight, MessageCircle, MapPin, Mail, Instagram
} from 'lucide-react';
import {
  STORE_WHATSAPP,
  STORE_WHATSAPP_DISPLAY
} from '../../constants/storefrontConstants';

const POLICY_TABS = [
  { id: 'privacidad', label: 'Política de privacidad', shortLabel: 'Privacidad', icon: ShieldCheck },
  { id: 'reembolso', label: 'Política de reembolso', shortLabel: 'Reembolso & Cambios', icon: RotateCcw },
  { id: 'terminos', label: 'Términos del servicio', shortLabel: 'Términos', icon: FileText },
  { id: 'envio', label: 'Política de envío', shortLabel: 'Envíos', icon: Truck },
  { id: 'contacto', label: 'Información de contacto', shortLabel: 'Contacto', icon: Phone },
];

export default function StorePoliciesModal({
  isOpen = false,
  initialTab = 'privacidad',
  onClose
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'privacidad');

  // Sincronizar tab activo cuando se abre con una pestaña específica
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Cerrar con Escape
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-zinc-900/50">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 dark:text-zinc-300">
                Información para Clientes
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase font-serif">
                Políticas de la Tienda
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas (Horizontal scroll en móviles) */}
          <div className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-100/60 dark:bg-zinc-900/30 px-3 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 sm:gap-2 py-2 min-w-max">
              {POLICY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
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
            
            {/* 1. POLÍTICA DE PRIVACIDAD */}
            {activeTab === 'privacidad' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Política de Privacidad</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    En GUTSY nos comprometemos a cuidar tu privacidad y proteger la información que compartes con nosotros.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      1. Datos que solicitamos
                    </h4>
                    <p>
                      Al solicitar un pedido a través de nuestra tienda online o WhatsApp, te solicitamos los datos necesarios para concretar la entrega:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
                      <li><strong>Nombre y apellido:</strong> para identificar al destinatario del paquete.</li>
                      <li><strong>Número de celular:</strong> para coordinar la entrega y avisarte del despacho.</li>
                      <li><strong>Ciudad, barrio y dirección completa:</strong> con referencias claras para el repartidor o la empresa de envíos.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      2. Uso exclusivo de tu información
                    </h4>
                    <p>
                      Utilizamos tu información exclusivamente para preparar tu pedido, despacharlo a tu localidad y mantenerte al tanto del estado del paquete. No vendemos, no alquilamos ni cedemos tus datos personales a terceros con fines publicitarios.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-500" />
                      3. Con quién se comparten tus datos
                    </h4>
                    <p>
                      Tus datos de entrega (nombre, teléfono y dirección) únicamente son proporcionados al repartidor local o a la empresa de encomiendas encargada del traslado para que puedan concretar la entrega en tu puerta o sucursal.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-zinc-500" />
                      4. Tus derechos
                    </h4>
                    <p>
                      Si en algún momento deseas consultar, actualizar o solicitar que borremos tus datos de contacto de nuestros registros, puedes solicitárnoslo directamente a través de nuestro WhatsApp oficial de atención.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. POLÍTICA DE REEMBOLSO Y CAMBIOS */}
            {activeTab === 'reembolso' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Política de Reembolso, Garantía y Cambios</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Cuidamos cada pieza para que disfrutes de una compra segura y confiable.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Garantía por fallas de origen (7 días)
                    </h4>
                    <p className="text-zinc-700 dark:text-zinc-300">
                      Todos los accesorios son inspeccionados antes de ser empaquetados. Si recibes un producto con algún desperfecto de fabricación, rotura al llegar o fallo en el broche/cierre, dispones de <strong>hasta 7 días corridos</strong> desde la recepción para notificarnos por WhatsApp con una foto o video. Te lo cambiamos o reponemos sin costo adicional de flete.
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-2">
                      *La garantía no cubre daños ocasionados por golpes fuertes, tirones, desgaste propio por fricción o contacto con productos químicos/abrasivos en materiales no resistentes.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-indigo-500" />
                      Cambios de modelo o talle (7 días)
                    </h4>
                    <p>
                      Si te equivocaste con la medida (por ejemplo de un anillo o pulsera), puedes solicitar el cambio dentro de los <strong>7 días corridos</strong> posteriores a la entrega.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
                      <li>El accesorio debe encontrarse <strong>completamente nuevo, sin señales de uso y con su empaque original</strong>.</li>
                      <li>Los costos de envío generados por cambios de talla o preferencia corren por cuenta del cliente.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Reembolsos
                    </h4>
                    <p>
                      En caso de que corresponda un reembolso (por ejemplo, si el producto llegó con falla y no contamos con stock para reposición), coordinaremos la devolución del monto abonado vía transferencia bancaria una vez verificado el retorno del artículo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TÉRMINOS DEL SERVICIO */}
            {activeTab === 'terminos' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Términos del Servicio</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Condiciones aplicables al consultar y comprar accesorios en GUTSY.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">1. Precios y Moneda</h4>
                    <p>
                      Todos los precios del catálogo web se encuentran expresados en <strong>Guaraníes (Gs.)</strong>. El monto indicado es el precio final del producto a transferir al momento de la compra.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">2. Medios de Pago y Confirmación de Pedidos</h4>
                    <p>
                      Aceptamos pagos a través de los siguientes canales bancarios habilitados:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
                      <li><strong>Transferencia Bancaria:</strong> ueno bank, Banco Continental y Banco Itaú.</li>
                      <li><strong>Pago con QR:</strong> generado con el monto exacto de tu pedido.</li>
                      <li><strong>Contra Entrega:</strong> abono en efectivo al recibir en puerta (disponible exclusivamente en la ciudad de Villarrica).</li>
                      <li><strong>Pagos con tarjetas CREDITO/DEBITO:</strong> Mediante un link generado con el monto exacto de tu pedido.</li>
                    </ul>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      *El pedido se considera confirmado y pasa a empaquetado una vez recibido y acreditado el comprobante de transferencia bancaria.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">3. Disponibilidad de Stock</h4>
                    <p>
                      Actualizamos continuamente la disponibilidad de nuestras piezas. Si por alta demanda simultánea algún accesorio no tuviese stock físico al momento de preparar el paquete, nos pondremos en contacto contigo de inmediato para coordinar el reemplazo por otra pieza o el reintegro total del importe.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">4. Fotografías y Detalles</h4>
                    <p>
                      Mostramos imágenes reales de cada accesorio. Ten en cuenta que la tonalidad puede presentar leves variaciones según la iluminación o la configuración de pantalla de tu dispositivo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. POLÍTICA DE ENVÍO */}
            {activeTab === 'envio' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Política de Envío y Entregas</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Hacemos llegar tus accesorios a cualquier rincón de Paraguay con cobertura garantizada.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mb-2">
                      Villarrica (Local)
                    </span>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">
                      Delivery en el día.
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Entregas directas en puerta en la ciudad de Villarrica. Puedes optar por transferencia previa o pago contra entrega en efectivo.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mb-2">
                      Interior del País
                    </span>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">
                      24 a 72 hs hábiles
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Envíos a todas las ciudades del país a través de empresas de encomienda reconocidas como MC GROUP, TSI, Empresas Guaireña, entre otras.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80">
                  <h4 className="font-semibold text-zinc-900 dark:text-white">Costos de flete y despacho</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300 text-xs">
                    <li><strong>Villarrica:</strong> costo fijo de delivery local sumado al total del pedido.</li>
                    <li><strong>Interior del país:</strong> el flete se abona habitualmente en destino al retirar o recibir el paquete por encomienda, o bien se incluye previamente si la empresa lo requiere.</li>
                    <li><strong>Coordinación:</strong> Una vez despachado el paquete, te enviamos el número de guía o comprobante por WhatsApp para que puedas realizar el seguimiento.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 5. INFORMACIÓN DE CONTACTO */}
            {activeTab === 'contacto' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Información de Contacto</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Canales directos para resolver dudas, coordinar entregas o solicitar asesoramiento.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <a
                    href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi pedido.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 transition flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Atención WhatsApp
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                        {STORE_WHATSAPP_DISPLAY}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Lunes a Domingo: 08:00 a 19:00 hs
                      </p>
                    </div>
                  </a>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Ubicación de la Tienda
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                        Villarrica, Guairá
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Tienda online con envíos a todo Paraguay
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-400 transition flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-600 text-white flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Redes Sociales
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                        @gutsy.py
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Lanzamientos y novedades en Instagram
                      </p>
                    </div>
                  </a>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Correo de Contacto
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                        gutsypy@gmail.com
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Consultas y atención
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer del Modal */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-medium">¿Tienes alguna duda sobre tu compra?</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola GUTSY, tengo una consulta sobre las políticas de la tienda.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Escribir al WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
