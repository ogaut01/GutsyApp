import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, X, Gem, Sparkles, Minus, Plus, Trash2, Truck,
  CheckCircle2, MapPin, CreditCard, Building2, QrCode, Banknote,
  Copy, Check, MessageCircle
} from 'lucide-react';
import { formatGsInput } from '../../currency';
import GutsyLogo from '../GutsyLogo';
import { BANK_ACCOUNTS } from '../../constants/storefrontConstants';
import SearchableSelect from './SearchableSelect';
import { PARAGUAY_LOCATIONS, DEPARTAMENTOS_PARAGUAY } from '../../constants/paraguayLocations';

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  totalCartItems = 0,
  cartSubtotal = 0,
  cartTotal = 0,
  deliveryCost = 0,
  updateCartItemQuantity,
  removeCartItem,
  shippingType,
  setShippingType,
  customerFullName,
  setCustomerFullName,
  customerFirstName,
  setCustomerFirstName,
  customerLastName,
  setCustomerLastName,
  customerDoc,
  setCustomerDoc,
  customerPhone,
  setCustomerPhone,
  customerCity,
  setCustomerCity,
  customerDept,
  setCustomerDept,
  customerAddress,
  setCustomerAddress,
  paymentMethod,
  setPaymentMethod,
  selectedBankId,
  setSelectedBankId,
  selectedBank,
  copiedAlias,
  copiedBank,
  copyAliasOnly,
  copyBankDetails,
  isSubmittingOrder,
  formErrors = {},
  setFormErrors = () => {},
  onSendOrderWhatsApp,
  onOpenPolicy
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 h-full flex flex-col border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del Carrito */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <GutsyLogo className="w-7 h-7 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Tu Pedido</h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    {totalCartItems} artículo{totalCartItems !== 1 ? 's' : ''} seleccionado{totalCartItems !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar carrito"
                title="Cerrar carrito"
                className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Carrito */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-wider font-serif">Tu carrito está vacío</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Explora nuestros accesorios y añade tus favoritos para armar tu pedido.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* Lista de Ítems */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Artículos seleccionados
                    </span>
                    {[...cart].sort((a, b) => {
                      const aIsGift = a.productId === 'pkg-standard-gift' ? 1 : 0;
                      const bIsGift = b.productId === 'pkg-standard-gift' ? 1 : 0;
                      return aIsGift - bIsGift;
                    }).map(item => {
                      const isGiftPkg = item.productId === 'pkg-standard-gift';
                      return (
                        <div
                          key={item.key}
                          className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white dark:bg-black overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                width="56"
                                height="56"
                              />
                            ) : (
                              <Gem className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold uppercase tracking-wide truncate">{item.name}</h5>
                            {(item.presentation || item.color || item.size) && (
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                                {[item.presentation, item.color, item.size ? `Talle: ${item.size}` : ''].filter(Boolean).join(' • ')}
                              </span>
                            )}
                            {item.customText && (
                              <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50 font-medium">
                                <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="truncate">Grabado: {item.customText}</span>
                              </div>
                            )}
                            <span className="text-xs font-black text-black dark:text-white mt-0.5 block">
                              {isGiftPkg ? 'Gratis' : `Gs. ${formatGsInput(item.price * item.quantity)}`}
                            </span>
                          </div>

                          {/* Controles de cantidad: ocultos para empaque estándar */}
                          {!isGiftPkg && (
                            <div className="flex items-center gap-1.5 bg-white dark:bg-black p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <button
                                onClick={() => updateCartItemQuantity(item.key, -1)}
                                className="w-6 h-6 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(item.key, 1)}
                                className="w-6 h-6 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => removeCartItem(item.key)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* ─── PASO 1: Destino de Entrega ──────────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      1. Ubicación y Tipo de Envío
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShippingType('villarrica')}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          shippingType === 'villarrica'
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${shippingType === 'villarrica' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${shippingType === 'villarrica' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              <span>Delivery Villarrica y alrededores</span>
                              {shippingType === 'villarrica' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${shippingType === 'villarrica' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>Entrega local en puerta</div>
                          </div>
                        </div>
                        <span className={`font-bold text-xs whitespace-nowrap ${shippingType === 'villarrica' ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>+ Gs. 15.000</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShippingType('interior');
                          if (paymentMethod === 'contraentrega') setPaymentMethod('contimovil');
                        }}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          shippingType === 'interior'
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${shippingType === 'interior' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${shippingType === 'interior' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              <span>Envíos Nacionales</span>
                              {shippingType === 'interior' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${shippingType === 'interior' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              Todo Paraguay vía Transportadora (prom. Gs. 32.000)
                            </div>
                          </div>
                        </div>
                        <span className={`font-bold text-xs whitespace-nowrap ${shippingType === 'interior' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>Flete en destino</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── PASO 2: Datos de Envío / Contacto ────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {shippingType === 'villarrica' ? '2. Datos de Contacto:' : '2. Datos para la Entrega y Rótulo:'}
                    </span>
                    {(() => {
                      const fullNameValue = customerFullName !== undefined ? customerFullName : (customerFirstName || '');
                      const handleFullNameChange = (val) => {
                        if (setCustomerFullName) setCustomerFullName(val);
                        if (setCustomerFirstName) setCustomerFirstName(val);
                      };

                      return (
                        <form onSubmit={e => e.preventDefault()} autoComplete="on" className="space-y-2.5 text-xs">
                          {/* 1. Nombre y Apellido * (ancho completo) */}
                          <div>
                            <input
                              id="customer-fullname"
                              name="name"
                              type="text"
                              autoComplete="name"
                              value={fullNameValue}
                              onChange={e => {
                                handleFullNameChange(e.target.value);
                                if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: undefined }));
                                if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: undefined }));
                              }}
                              placeholder="Nombre y Apellido"
                              aria-label="Nombre y Apellido"
                              className={`w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none transition ${
                                (formErrors.fullName || formErrors.firstName)
                                  ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/10'
                                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50'
                              }`}
                            />
                            {(formErrors.fullName || formErrors.firstName) && (
                              <span className="text-[10px] text-rose-500 font-medium block mt-0.5">
                                {formErrors.fullName || formErrors.firstName}
                              </span>
                            )}
                          </div>

                          {/* 2. Celular | Nro. Cédula (en 2 columnas) */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                id="tel"
                                name="tel"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={customerPhone}
                                onChange={e => {
                                  setCustomerPhone(e.target.value);
                                  if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                                }}
                                placeholder="Numero de celular"
                                aria-label="Celular o WhatsApp"
                                className={`w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none transition ${
                                  formErrors.phone ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/10' : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50'
                                }`}
                              />
                              {formErrors.phone && (
                                <span className="text-[10px] text-rose-500 font-medium block mt-0.5">{formErrors.phone}</span>
                              )}
                            </div>
                            <div>
                              <input
                                id="customer-doc"
                                name="doc"
                                type="text"
                                inputMode="numeric"
                                value={customerDoc}
                                onChange={e => setCustomerDoc(e.target.value)}
                                placeholder="Nro. Cédula"
                                aria-label="Número de Cédula"
                                className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                              />
                            </div>
                          </div>

                          {shippingType === 'villarrica' ? (
                            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1">
                              <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>Coordinación de Entrega en Villarrica</span>
                              </div>
                              <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Al confirmar tu pedido por WhatsApp, te pediremos tu ubicación o referencias exactas para coordinar la entrega a domicilio.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* 3. Departamento * (Buscador / Desplegable) */}
                              <div>
                                <SearchableSelect
                                  id="customer-dept"
                                  name="address-level1"
                                  value={customerDept}
                                  onChange={dept => {
                                    setCustomerDept(dept);
                                    if (formErrors.dept) setFormErrors(prev => ({ ...prev, dept: undefined }));
                                    const citiesForDept = PARAGUAY_LOCATIONS[dept] || [];
                                    if (customerCity && !citiesForDept.includes(customerCity)) {
                                      setCustomerCity('');
                                    }
                                  }}
                                  options={DEPARTAMENTOS_PARAGUAY}
                                  placeholder="Departamento *"
                                  ariaLabel="Departamento"
                                  error={formErrors.dept}
                                />
                              </div>

                              {/* 4. Ciudad de Destino * (Buscador / Desplegable dependiente) */}
                              <div>
                                <SearchableSelect
                                  id="address-level2"
                                  name="address-level2"
                                  value={customerCity}
                                  onChange={city => {
                                    setCustomerCity(city);
                                    if (formErrors.city) setFormErrors(prev => ({ ...prev, city: undefined }));
                                  }}
                                  options={customerDept ? (PARAGUAY_LOCATIONS[customerDept] || []) : []}
                                  placeholder="Ciudad de Destino *"
                                  disabled={!customerDept}
                                  disabledPlaceholder="Primero selecciona un departamento"
                                  ariaLabel="Ciudad de Destino"
                                  error={formErrors.city}
                                />
                              </div>

                              {/* 5. Dirección o indicar si retira de sucursal (dentro del cuadro) */}
                              <div>
                                <textarea
                                  id="street-address"
                                  name="street-address"
                                  rows={2}
                                  autoComplete="street-address"
                                  value={customerAddress}
                                  onChange={e => {
                                    setCustomerAddress(e.target.value);
                                    if (formErrors.address) setFormErrors(prev => ({ ...prev, address: undefined }));
                                  }}
                                  placeholder="Dirección o indicar si retira de sucursal"
                                  aria-label="Dirección o Sucursal de Transportadora"
                                  className={`w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none resize-none transition ${
                                    formErrors.address ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/10' : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50'
                                  }`}
                                />
                                {formErrors.address && (
                                  <span className="text-[10px] text-rose-500 font-medium block mt-0.5">{formErrors.address}</span>
                                )}
                              </div>
                            </>
                          )}
                        </form>
                      );
                    })()}
                  </div>

                  {/* ─── PASO 3: Medio de Pago ──────────────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      3. Medio de Pago
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Link ContiMóvil */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('contimovil')}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all ${
                          paymentMethod === 'contimovil'
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'contimovil' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${paymentMethod === 'contimovil' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              <span>Link de Pago (Tarjetas DÉBITO O CRÉDITO)</span>
                              {paymentMethod === 'contimovil' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${paymentMethod === 'contimovil' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              Te enviamos el link seguro a tu WhatsApp para pagar con tarjeta
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Transferencia SIPAP */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transferencia')}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all ${
                          paymentMethod === 'transferencia'
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'transferencia' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${paymentMethod === 'transferencia' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              <span>Transferencia Bancaria</span>
                              {paymentMethod === 'transferencia' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${paymentMethod === 'transferencia' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              Transferencia directa a bancos habilitados
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Caja desplegable bancos y alias */}
                      {paymentMethod === 'transferencia' && (
                        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs animate-in fade-in">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                              Selecciona tu Banco de preferencia:
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {BANK_ACCOUNTS.map(bank => {
                                const isBankActive = selectedBankId === bank.id;
                                return (
                                  <button
                                    key={bank.id}
                                    type="button"
                                    onClick={() => setSelectedBankId(bank.id)}
                                    className={`py-2 px-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition text-center truncate ${
                                      isBankActive
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                  >
                                    {bank.shortName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-white text-[10px] font-bold tracking-wider uppercase border border-zinc-300 dark:border-zinc-700">
                                  Tipo: {selectedBank.tipoAlias}
                                </span>
                              </div>
                              <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono tracking-tight select-all">
                                {selectedBank.alias}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAliasOnly(selectedBank.alias)}
                              className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition flex-shrink-0"
                              title="Copiar solo el alias"
                            >
                              {copiedAlias ? <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedAlias ? '¡Copiado!' : 'Copiar Alias'}</span>
                            </button>
                          </div>

                          <div className="text-[11px] space-y-0.5 text-zinc-700 dark:text-zinc-300 font-mono bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <div><strong>Banco:</strong> {selectedBank.name}</div>
                            <div><strong>Titular:</strong> {selectedBank.titular}</div>
                            <div><strong>C.I. / RUC:</strong> {selectedBank.documento}</div>
                            <div><strong>Nro. Cuenta:</strong> {selectedBank.cuenta}</div>
                            <div><strong>Tipo:</strong> {selectedBank.tipoCuenta}</div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                              * Adjunta tu comprobante por WhatsApp.
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBankDetails(selectedBank)}
                              className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline flex items-center gap-1"
                            >
                              {copiedBank ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedBank ? '¡Datos Copiados!' : 'Copiar todo el bloque'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* QR Bancario */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qr')}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all ${
                          paymentMethod === 'qr'
                            ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'qr' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${paymentMethod === 'qr' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              <span>Pago con QR</span>
                              {paymentMethod === 'qr' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${paymentMethod === 'qr' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              Te enviaremos el código QR con el monto exacto para escanear y pagar desde tu app bancaria
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Contra Entrega (Solo para Villarrica) */}
                      {shippingType === 'villarrica' && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('contraentrega')}
                          className={`p-3.5 rounded-2xl text-left border text-xs transition-all ${
                            paymentMethod === 'contraentrega'
                              ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'contraentrega' ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                              <Banknote className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`font-bold flex items-center gap-1.5 ${paymentMethod === 'contraentrega' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                <span>Pago Contra Entrega (Villarrica)</span>
                                {paymentMethod === 'contraentrega' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                              </div>
                              <div className={`text-[11px] mt-0.5 ${paymentMethod === 'contraentrega' ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                Abonas en efectivo al recibir tu pedido en puerta
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer del Carrito con Totales y Botón WhatsApp */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal Productos</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Gs. {formatGsInput(cartSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Costo de Envío</span>
                    {shippingType === 'villarrica' ? (
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">Gs. {formatGsInput(deliveryCost)}</span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/40">
                        Flete en destino
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="font-bold text-zinc-900 dark:text-white">Total a Pagar</span>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                        Gs. {formatGsInput(cartTotal)}
                      </span>
                      {shippingType === 'interior' && (
                        <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                          + flete al recibir
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {Object.values(formErrors).some(Boolean) && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️ Completa los campos marcados en rojo para finalizar.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onSendOrderWhatsApp}
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Finalizar Pedido por WhatsApp</span>
                </button>
                <div className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  Atención y coordinación directa por WhatsApp
                </div>
                <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                  Al confirmar tu pedido, aceptas nuestros{' '}
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('terminos')}
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300 font-medium cursor-pointer"
                  >
                    Términos
                  </button>{' '}
                  y{' '}
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('privacidad')}
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300 font-medium cursor-pointer"
                  >
                    Políticas
                  </button>.
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
