import React from 'react';
import {
  MapPin, CreditCard, Building2, QrCode, Banknote,
  Truck, Package, ShieldCheck, MessageCircle, Clock, Instagram
} from 'lucide-react';
import GutsyLogo from '../GutsyLogo';
import { STORE_WHATSAPP, STORE_WHATSAPP_DISPLAY } from '../../constants/storefrontConstants';

export default function StorefrontFooter() {
  return (
    <footer className="bg-zinc-950 text-white border-t border-zinc-900 pt-14 pb-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 lg:gap-12">
          {/* Columna 1: Marca */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <GutsyLogo className="w-8 h-8 shrink-0" forceWhite={true} />
              <span className="text-lg font-black uppercase tracking-widest font-serif text-white">GUTSY</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-light max-w-xs">
              Accesorios y detalles seleccionados para potenciar tu estilo y esencia.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Villarrica, Guairá, Paraguay</span>
            </div>
          </div>

          {/* Columna 2: Medios de Pago */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Medios de Pago</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Tarjetas de Crédito y Débito</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Transferencia SIPAP</span>
              </li>
              <li className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Pagos por QR</span>
              </li>
              <li className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Efectivo al recibir (Villarrica)</span>
              </li>
            </ul>
          </div>

          {/* Columna 3: Envíos */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Logística & Envíos</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-200 font-medium">Villarrica:</span> Delivery local
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-200 font-medium">Interior del País:</span> Vía encomienda
                </div>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Entrega garantizada</span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Contacto</h4>
            
            <a
              href={`https://wa.me/${STORE_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-zinc-200 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 transition text-xs font-medium"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp: {STORE_WHATSAPP_DISPLAY}</span>
            </a>

            <div className="space-y-2 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Lun a Dom: 08:00 - 19:00 hs</span>
              </div>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition"
              >
                <Instagram className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Instagram: @gutsy.py</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
