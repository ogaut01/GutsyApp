import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Sparkles, ShieldCheck, Droplets, Truck,
  Heart, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2,
  Copy, Check, MessageCircle, ChevronRight, Phone, Instagram,
  MapPin, CreditCard, QrCode, Building2, Banknote, Filter,
  Lock, ArrowLeft, Gem, Tag, Eye, RefreshCw
} from 'lucide-react';
import { formatGsInput } from '../currency';
import { fetchMateriales } from '../services/api';

// ============================================================================
// 🏦 CONFIGURACIÓN DE CUENTAS BANCARIAS & ALIAS (EDITABLE)
// Modifica aquí los datos de tus cuentas bancarias vinculadas:
// ============================================================================
export const BANK_ACCOUNTS = [
  {
    id: 'ueno',
    name: 'ueno bank',
    shortName: 'ueno bank',
    tipoAlias: 'Cédula de Identidad (C.I.)',
    tipoAliasBadge: 'C.I.',
    alias: '5554700',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '15782039',
    tipoCuenta: 'Caja de Ahorro',
  },
  {
    id: 'continental',
    name: 'Banco Continental S.A.E.C.A.',
    shortName: 'Continental',
    tipoAlias: 'Correo Electrónico (Email)',
    tipoAliasBadge: 'Email',
    alias: 'ogautom01@gmail.com',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '010045504404',
    tipoCuenta: 'Caja de Ahorro',
  },
  {
    id: 'Itau',
    name: 'Banco Itaú Paraguay S.A.',
    shortName: 'Banco Itaú',
    tipoAlias: 'Número de Celular',
    tipoAliasBadge: 'Celular',
    alias: '0986191356',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '320568978',
    tipoCuenta: 'Caja de Ahorro',
  },
];

// Categorías amigables para el cliente
const ALL_STORE_CATEGORIES = [
  { id: 'ALL', label: 'Todos los Accesorios', icon: Gem },
  { id: 'AN', label: 'Anillos', icon: Tag },
  { id: 'CA', label: 'Cadenas', icon: Tag },
  { id: 'CO', label: 'Collares', icon: Tag },
  { id: 'PU', label: 'Pulseras & Brazaletes', icon: Tag },
  { id: 'AR', label: 'Aros & Aretes', icon: Tag },
  { id: 'ST', label: 'Sets & Combos', icon: Tag },
  { id: 'PA', label: 'Parejas', icon: Tag },
  { id: 'LE', label: 'Lentes', icon: Tag },
  { id: 'TO', label: 'Tobilleras', icon: Tag },
  { id: 'DI', label: 'Dijes & Colgantes', icon: Tag },
  { id: 'OT', label: 'Otros', icon: Tag },
];

// Mensajes para la marquesina infinita superior (CAMBIO 1)
const ANNOUNCEMENT_ITEMS = [
  { text: 'MATERIALES SELECCIONADOS', icon: Sparkles },
  { text: 'GARANTÍA DE CALIDAD', icon: ShieldCheck },
  { text: '+80 MODELOS', icon: Gem },
  { text: 'ENVÍOS A TODO EL PAÍS', icon: Truck },
];

// Opciones de Filtro de Color (CAMBIO 5 - Estructurado en variantes)
const COLOR_FILTER_OPTIONS = [
  { id: 'ALL', label: 'Todos los Colores' },
  { id: 'negro', label: 'Negro' },
  { id: 'plateado', label: 'Plateado' },
  { id: 'dorado', label: 'Dorado' },
  { id: 'rose_gold', label: 'Rose Gold' },
  { id: 'blanco', label: 'Blanco' },
];

export default function StorefrontView({
  productos = [],
  onOpenAdminLogin,
  user,
  onGoToAdmin,
  theme,
  onToggleTheme
}) {
  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'name'
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [customEngravingText, setCustomEngravingText] = useState('');
  const [dbMaterials, setDbMaterials] = useState([]);

  // Carga dinámica de materiales de la BD (CAMBIO 5)
  useEffect(() => {
    fetchMateriales()
      .then(data => {
        if (Array.isArray(data)) setDbMaterials(data);
      })
      .catch(() => {});
  }, []);

  // Opciones de materiales generadas dinámicamente por ID
  const materialFilterOptions = useMemo(() => {
    const map = new Map();
    dbMaterials.forEach(m => {
      if (m && m.id && m.nombre) map.set(m.id, { id: String(m.id), label: m.nombre });
    });
    productos.forEach(p => {
      (p.materiales || []).forEach(m => {
        if (m && m.id && m.nombre && !map.has(m.id)) map.set(m.id, { id: String(m.id), label: m.nombre });
      });
    });
    return [
      { id: 'ALL', label: 'Todos los Materiales' },
      ...Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [dbMaterials, productos]);

  // Carrito de compras público (persistido en localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gutsy_public_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('gutsy_public_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('No se pudo guardar el carrito:', e);
    }
  }, [cart]);

  // Modal de Detalle de Producto
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Formulario de Envío y Checkout
  const [shippingType, setShippingType] = useState('villarrica'); // 'villarrica', 'interior'
  const [paymentMethod, setPaymentMethod] = useState('contimovil'); // 'contimovil', 'transferencia', 'qr', 'contraentrega'
  const [selectedBankId, setSelectedBankId] = useState('continental'); // 'continental', 'ueno', 'itau'
  
  const selectedBank = useMemo(() => {
    return BANK_ACCOUNTS.find(b => b.id === selectedBankId) || BANK_ACCOUNTS[0];
  }, [selectedBankId]);

  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  // Teléfono WhatsApp oficial de Gutsy (Paraguay)
  const STORE_WHATSAPP = '595961370929'; // Formato internacional
  const STORE_WHATSAPP_DISPLAY = '+595 961 370 929';

  // Helper para identificar accesorios de parejas / dúos
  const isCoupleProduct = (p) => {
    if (p.categoria === 'PA') return true;
    const n = (p.nombre || '').toLowerCase();
    return (
      n.includes('par ') ||
      n.includes('par.') ||
      n.includes('pareja') ||
      n.includes('astronautas') ||
      n.includes('deadpool') ||
      n.includes('corazon y llave') ||
      n.includes('chimuelo') ||
      n.includes('eternal lock')
    );
  };

  // Helper para identificar accesorios personalizables / grabados láser
  const isCustomizableProduct = (p) => {
    if (!p || !p.nombre) return false;
    const n = (p.nombre || '').toLowerCase();
    const d = (p.descripcion || '').toLowerCase();
    return (
      n.includes('personaliz') ||
      n.includes('grabado') ||
      n.includes('grabar') ||
      n.includes('inicial') ||
      n.includes('barra 3d') ||
      d.includes('personaliz') ||
      d.includes('grabado')
    );
  };

  // Categorías activas (solo las que tienen productos con stock/activos cargados)
  const activeCategories = useMemo(() => {
    const existingCats = new Set();
    productos.filter(p => p.activo !== false).forEach(p => {
      if (isCoupleProduct(p)) {
        existingCats.add('PA');
      } else {
        existingCats.add(p.categoria);
      }
    });
    return ALL_STORE_CATEGORIES.filter(c => c.id === 'ALL' || existingCats.has(c.id));
  }, [productos]);

  // ─── Filtrado de Productos ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return productos.filter(product => {
      // Filtro por búsqueda
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        product.nombre?.toLowerCase().includes(term) ||
        product.categoria_display?.toLowerCase().includes(term) ||
        product.materiales?.some(m => m.nombre?.toLowerCase().includes(term)) ||
        product.variantes?.some(v => v.color?.toLowerCase().includes(term) || v.sku?.toLowerCase().includes(term));

      // Filtro por categoría (reconoce Sets vs Parejas)
      let matchCategory = true;
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'PA') {
          matchCategory = isCoupleProduct(product);
        } else if (selectedCategory === 'ST') {
          matchCategory = product.categoria === 'ST' && !isCoupleProduct(product);
        } else {
          matchCategory = product.categoria === selectedCategory && !isCoupleProduct(product);
        }
      }

      // Filtro por género
      const matchGender = selectedGender === 'ALL' || product.genero === selectedGender;

      // Filtro por material (ESTRICTO POR ID: evalúa todos los elementos de product.materiales)
      let matchMaterial = true;
      if (selectedMaterial !== 'ALL') {
        if (!product.materiales || product.materiales.length === 0) {
          matchMaterial = false;
        } else {
          const targetId = Number(selectedMaterial);
          matchMaterial = product.materiales.some(m => m.id === targetId);
        }
      }

      // Filtro por color (ESTRICTO: evalúa todas las variantes activas de product.variantes)
      let matchColor = true;
      if (selectedColor !== 'ALL') {
        if (!product.variantes || product.variantes.length === 0) {
          matchColor = false;
        } else {
          matchColor = product.variantes.some(v => {
            if (v.activo === false) return false;
            const c = (v.color || '').toLowerCase();
            if (selectedColor === 'negro') return c.includes('negro') || c.includes('black');
            if (selectedColor === 'plateado') return c.includes('plateado') || c.includes('plata') || c.includes('silver');
            if (selectedColor === 'dorado') return c.includes('dorado') || c.includes('oro') || c.includes('gold');
            if (selectedColor === 'rose_gold') return c.includes('rose') || c.includes('rosado') || c.includes('rosa');
            if (selectedColor === 'blanco') return c.includes('blanco') || c.includes('white');
            return false;
          });
        }
      }

      return matchSearch && matchCategory && matchGender && matchMaterial && matchColor;
    }).sort((a, b) => {
      // Priorizar productos con stock disponible arriba
      const aInStock = (a.activo !== false && (a.stock_total || 0) > 0) ? 1 : 0;
      const bInStock = (b.activo !== false && (b.stock_total || 0) > 0) ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;

      if (sortBy === 'price-asc') return (a.precio_venta || 0) - (b.precio_venta || 0);
      if (sortBy === 'price-desc') return (b.precio_venta || 0) - (a.precio_venta || 0);
      if (sortBy === 'name') return (a.nombre || '').localeCompare(b.nombre || '');
      // featured: mayor stock disponible primero
      return (b.stock_total || 0) - (a.stock_total || 0);
    });
  }, [productos, searchTerm, selectedCategory, selectedGender, selectedMaterial, selectedColor, sortBy]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (selectedGender !== 'ALL') c++;
    if (selectedMaterial !== 'ALL') c++;
    if (selectedColor !== 'ALL') c++;
    return c;
  }, [selectedGender, selectedMaterial, selectedColor]);

  // Total de unidades en el carrito
  const totalCartItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Subtotal en Guaraníes
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
  }, [cart]);

  // Costo de Delivery
  const deliveryCost = useMemo(() => {
    if (shippingType === 'villarrica') return 15000;
    return 0; // Para pickup es 0, para interior se paga a la transportadora o se coordina
  }, [shippingType]);

  const cartTotal = cartSubtotal + deliveryCost;

  // ─── Manejo de Selección de Producto & Modal ──────────────────────────────
  const handleOpenProductModal = (product) => {
    setActiveModalProduct(product);
    setActiveImageIndex(0);
    setModalQuantity(1);
    setCustomEngravingText('');

    // Seleccionar por defecto la primera variante con stock, o la primera disponible
    if (product.variantes && product.variantes.length > 0) {
      const firstWithStock = product.variantes.find(v => v.stock > 0) || product.variantes[0];
      setSelectedVariant(firstWithStock);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleAddToCart = (product, variant, qty = 1, customText = '') => {
    const availableStock = variant ? (variant.stock || 0) : (product.stock_total || 0);
    if (product.activo === false || availableStock <= 0) {
      return;
    }

    const customKeySuffix = customText && customText.trim() ? `-${customText.trim().substring(0, 15)}` : '';
    const itemKey = variant ? `${product.id}-${variant.id}${customKeySuffix}` : `${product.id}-default${customKeySuffix}`;
    const itemPrice = variant?.precio_venta_pyg || product.precio_venta || 0;
    const itemImage = variant?.imagen_url || product.imagen_url_completa || product.imagen_url || null;

    setCart(prevCart => {
      const existing = prevCart.find(i => i.key === itemKey);
      if (existing) {
        return prevCart.map(i =>
          i.key === itemKey ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prevCart,
        {
          key: itemKey,
          productId: product.id,
          variantId: variant?.id || null,
          name: product.nombre,
          color: variant?.color || null,
          size: variant?.talle_medida || null,
          sku: variant?.sku || null,
          price: itemPrice,
          image: itemImage,
          maxStock: variant ? variant.stock : product.stock_total || 99,
          quantity: qty,
          customText: customText.trim() || null,
        }
      ];
    });

    // Efecto de rebote en el ícono del carrito
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 600);
    setActiveModalProduct(null);
  };

  const updateCartItemQuantity = (key, delta) => {
    setCart(prev => prev.map(item => {
      if (item.key === key) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (item.maxStock && newQty > item.maxStock) {
          alert(`Solo disponemos de ${item.maxStock} unidades en stock de este accesorio.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeCartItem = (key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  };

  const copyAliasOnly = (alias) => {
    navigator.clipboard.writeText(alias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2200);
  };

  const copyBankDetails = (bank) => {
    const text = `🏦 *DATOS BANCARIOS PARA TRANSFERENCIA - GUTSY*
• Banco: ${bank.name}
• Titular: ${bank.titular}
• C.I. / RUC: ${bank.documento}
• Nro. de Cuenta: ${bank.cuenta}
• Tipo de Cuenta: ${bank.tipoCuenta}
• Alias SIPAP: ${bank.alias}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  // ─── Envío de Pedido a WhatsApp ───────────────────────────────────────────
  const handleSendOrderWhatsApp = () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío. Agrega accesorios antes de finalizar.');
      return;
    }

    if (!customerName.trim()) {
      alert('Por favor, ingresa tu Nombre y Apellido para preparar tu pedido.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Por favor, ingresa tu número de Celular o WhatsApp de contacto.');
      return;
    }

    if (shippingType === 'interior') {
      if (!customerCity.trim()) {
        alert('Por favor, ingresa la Ciudad y Departamento de destino.');
        return;
      }
      if (!customerAddress.trim()) {
        alert('Por favor, ingresa tu dirección de entrega o la sucursal de transportadora.');
        return;
      }
    }

    setIsSubmittingOrder(true);

    // Mapeo de Método de Pago
    let paymentLabel = '';
    if (paymentMethod === 'contimovil') {
      paymentLabel = '💳 Link de Pago ContiMóvil (Tarjeta Crédito/Débito)';
    } else if (paymentMethod === 'transferencia') {
      paymentLabel = `🏦 Transferencia (${selectedBank.shortName} - Alias: ${selectedBank.alias})`;
    } else if (paymentMethod === 'qr') {
      paymentLabel = '📲 Pago con QR Bancario';
    } else if (paymentMethod === 'contraentrega') {
      paymentLabel = '💵 Pago Contra Entrega en Villarrica (Efectivo)';
    }

    // Mapeo de Tipo de Envío
    let shippingLabel = '';
    if (shippingType === 'villarrica') shippingLabel = '🛵 Delivery en Villarrica y/o alrededores (Gs. 15.000)';
    else if (shippingType === 'interior') shippingLabel = '📦 Envío Nacional (Vía Transportadora - Costo de envío a pagar al recibir, prom. Gs. 35.000 según ciudad)';

    // Construcción del mensaje
    let message = `*¡HOLA GUTSY! QUIERO REALIZAR ESTE PEDIDO*\n\n`;
    message += `👤 *CLIENTE:* ${customerName.trim()}\n`;
    if (customerDoc.trim()) message += `🆔 *C.I. / RUC:* ${customerDoc.trim()}\n`;
    message += `📱 *TELÉFONO:* ${customerPhone.trim()}\n`;
    if (customerCity.trim()) message += `📍 *CIUDAD:* ${customerCity.trim()}\n`;
    if (customerAddress.trim()) message += `🏠 *DIRECCIÓN/SUCURSAL:* ${customerAddress.trim()}\n`;
    if (shippingType === 'villarrica') message += `📍 *ENTREGA:* Les enviaré mi ubicación GPS y referencias por aquí tras confirmar el pago.\n`;
    if (customerNotes.trim()) message += `📝 *NOTAS:* ${customerNotes.trim()}\n\n`;

    message += `🛒 *DETALLE DEL PEDIDO:*\n`;
    cart.forEach((item, index) => {
      const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');
      message += `${index + 1}. *${item.name}* ${variantDesc ? `(${variantDesc})` : ''}\n`;
      if (item.customText) {
        message += `   • Grabado / Logo: "${item.customText}"\n`;
      }
      message += `   • Cant: ${item.quantity} un. x Gs. ${formatGsInput(item.price)} = Gs. ${formatGsInput(item.price * item.quantity)}\n`;
    });

    message += `\n📦 *MÉTODO DE ENTREGA:* ${shippingLabel}\n`;
    if (deliveryCost > 0) {
      message += `🛵 *COSTO DELIVERY:* Gs. ${formatGsInput(deliveryCost)}\n`;
    }
    message += `💰 *TOTAL A PAGAR:* *Gs. ${formatGsInput(cartTotal)}*\n`;
    message += `💳 *MEDIO DE PAGO:* ${paymentLabel}\n\n`;

    if (paymentMethod === 'contimovil') {
      message += `👉 *Solicitud:* Por favor envíenme el link de ContiMóvil para abonar con mi tarjeta.\n`;
    } else if (paymentMethod === 'qr') {
      message += `👉 *Solicitud:* Por favor envíenme el código QR con el monto de Gs. ${formatGsInput(cartTotal)} para pagar.\n`;
    } else if (paymentMethod === 'transferencia') {
      message += `👉 *Aviso:* Ya tengo los datos de transferencia para *${selectedBank.shortName}* (Alias: ${selectedBank.alias}) y les adjuntaré el comprobante enseguida.\n`;
    }

    message += `\n¡Muchas gracias! Quedo a la espera de su confirmación. 😊`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodedMessage}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    setIsSubmittingOrder(false);
    setOrderSentSuccess(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* ─── BANNER SUPERIOR DE BENEFICIOS (Marquesina Infinita) ────────── */}
      <div className="bg-black dark:bg-zinc-900 text-white text-[11px] sm:text-xs py-2 border-b border-zinc-800 overflow-hidden relative select-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Pista de la marquesina con desvanecimiento en bordes */}
          <div className="flex-1 overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div className="animate-marquee flex items-center gap-6">
              {[...ANNOUNCEMENT_ITEMS, ...ANNOUNCEMENT_ITEMS].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 flex-shrink-0 text-zinc-300">
                    <IconComponent className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="font-medium tracking-wide whitespace-nowrap">{item.text}</span>
                    <span className="text-zinc-600 font-bold">•</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teléfono de contacto fijo a la derecha (pantallas grandes) */}
          <div className="hidden lg:flex items-center flex-shrink-0 pl-4 text-zinc-400 border-l border-zinc-800">
            <a
              href={`https://wa.me/${STORE_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1.5 text-zinc-300 font-semibold"
            >
              <Phone className="w-3 h-3 text-zinc-400" />
              <span>{STORE_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── HEADER / NAVBAR PRINCIPAL ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Slogan de Gutsy */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md">
              <Gem className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-[0.2em] uppercase font-serif block leading-none">
                GUTSY
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-500 dark:text-zinc-400 uppercase font-sans mt-1 block">
                Tu propio estilo, tu propia esencia.
              </span>
            </div>
          </div>

          {/* Barra de Búsqueda Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar collares, anillos, pulseras, acero 316L..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:border-black dark:focus:border-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Acciones: Carrito, Modo Claro/Oscuro y Panel Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Si el dueño ya está autenticado, botón directo a su panel */}
            {user ? (
              <button
                onClick={onGoToAdmin}
                className="px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold tracking-wide uppercase border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white transition"
                title="Acceso Administrativo"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Selector de Tema */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-black dark:hover:border-white transition"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Botón Carrito de Compras */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative px-4 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
                cartBounce ? 'scale-110 ring-4 ring-black/20 dark:ring-white/20' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Carrito</span>
              {totalCartItems > 0 && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={totalCartItems}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                      mass: 0.6,
                    }}
                    className="px-2 py-0.5 text-[10px] bg-white text-black dark:bg-black dark:text-white rounded-full font-black"
                  >
                    {totalCartItems}
                  </motion.span>
                </AnimatePresence>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Mobile */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar joyas, accesorios..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* ─── HERO LOOKBOOK (Elegante Blanco & Negro) ──────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-16 sm:py-24 border-b border-zinc-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-semibold tracking-widest uppercase mb-4 border border-white/15">
            <Gem className="w-3.5 h-3.5 text-white" />
            <span>JOYAS & ACCESORIOS · GUTSY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase font-serif leading-tight">
            TU PROPIO ESTILO,<br />
            <span className="italic font-light tracking-wide text-zinc-300">TU PROPIA ESENCIA.</span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Joyas y accesorios diseñados para destacar tu personalidad. Piezas duraderas y resistentes diseñadas para redefinir tu estilo.
          </p>

          {/* Grid de 4 Pilares de Confianza (CAMBIO 3) */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-white mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">CALIDAD SELECCIONADA</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Materiales elegidos para acompañarte.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-white mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">VARIEDAD</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Acero · Plata · Bijou</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Truck className="w-4 h-4 text-white mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">ENVÍOS A TODO EL PAÍS</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Trabajamos con varias empresas de logística.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CreditCard className="w-4 h-4 text-white mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">PAGOS SEGUROS</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Transferencias · QR · POS</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FILTROS Y CATEGORÍAS ────────────────────────────────────────── */}
      <section
        id="catalogo"
        className="sticky top-20 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {/* Scroll Horizontal de Categorías */}
            <div className="relative w-full">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pr-8">
                {activeCategories.map(cat => {
                   const isActive = selectedCategory === cat.id;
                   return (
                     <button
                       key={cat.id}
                       onClick={() => setSelectedCategory(cat.id)}
                       className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap flex-shrink-0 ${
                         isActive
                           ? 'text-white dark:text-black'
                           : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                       }`}
                     >
                       {isActive && (
                         <motion.div
                           layoutId="categoryActivePill"
                           className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                           transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                         />
                       )}
                       <span className="relative z-10">{cat.label}</span>
                     </button>
                   );
                 })}
              </div>
              {/* Fade visual en el borde derecho para indicar scroll */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />
            </div>

            {/* Filtros Secundarios: Desktop */}
            <div className="hidden md:flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Género */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'F', label: 'Dama' },
                    { id: 'M', label: 'Hombre' },
                    { id: 'U', label: 'Unisex' }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGender(g.id)}
                      className={`relative px-2.5 py-1 rounded-full font-bold tracking-wider uppercase transition-colors text-[11px] ${
                        selectedGender === g.id
                          ? 'text-black dark:text-white'
                          : 'text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {selectedGender === g.id && (
                        <motion.div
                          layoutId="genderActivePill"
                          className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-xs"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{g.label}</span>
                    </button>
                  ))}
                </div>

                {/* Selector Material (Dinámico por ID) */}
                <select
                  value={selectedMaterial}
                  onChange={e => setSelectedMaterial(e.target.value)}
                  className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                    selectedMaterial !== 'ALL'
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
                  }`}
                >
                  {materialFilterOptions.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>

                {/* Selector Color (Estructurado en variantes) */}
                <select
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                    selectedColor !== 'ALL'
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
                  }`}
                >
                  {COLOR_FILTER_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                {/* Botón limpiar si hay filtros activos */}
                {(activeFilterCount > 0 || selectedCategory !== 'ALL' || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedGender('ALL');
                      setSelectedMaterial('ALL');
                      setSelectedColor('ALL');
                      setSearchTerm('');
                    }}
                    className="text-[11px] font-bold text-zinc-500 hover:text-black dark:hover:text-white underline ml-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Ordenar por */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Menor Precio</option>
                <option value="price-desc">Mayor Precio</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>

            {/* Filtros Secundarios: Mobile (Botón FILTRAR + Ordenar) */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className={`flex-1 py-2 px-4 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                  activeFilterCount > 0
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-full px-3 py-2 font-bold tracking-wider text-xs uppercase focus:outline-none"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Menor Precio</option>
                <option value="price-desc">Mayor Precio</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GRILLA DEL CATÁLOGO ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Encabezado del listado */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold tracking-wider uppercase font-serif">
              {ALL_STORE_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Catálogo'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Mostrando {filteredProducts.length} modelo{filteredProducts.length !== 1 ? 's' : ''} disponibles
            </p>
          </div>

          {(searchTerm || selectedCategory !== 'ALL' || selectedGender !== 'ALL' || selectedMaterial !== 'ALL' || selectedColor !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedGender('ALL');
                setSelectedMaterial('ALL');
                setSelectedColor('ALL');
              }}
              className="text-xs text-zinc-500 hover:text-black dark:hover:text-white underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Empty state si no hay productos (CAMBIO 5) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800">
              <Search className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-widest font-serif">
              NO ENCONTRAMOS PRODUCTOS
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Prueba modificando alguno de tus filtros de categoría, material o color.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedGender('ALL');
                setSelectedMaterial('ALL');
                setSelectedColor('ALL');
              }}
              className="mt-6 px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition"
            >
              VER TODOS LOS PRODUCTOS
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${selectedGender}-${sortBy}-${searchTerm}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.035, delayChildren: 0.02 }
                },
                exit: { opacity: 0, transition: { duration: 0.1 } }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {filteredProducts.map((product) => {
                const imageSrc = product.imagen_url_completa || product.imagen_url || null;
                const hasStock = product.activo !== false && (product.stock_total || 0) > 0;
                const isLowStock = hasStock && (product.stock_total || 0) <= 3;
                const variants = product.variantes || [];
                const hasMultipleVariants = variants.length > 1;

                return (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 22 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                      },
                      exit: { opacity: 0, transition: { duration: 0.08 } }
                    }}
                    key={product.id}
                    className="group relative bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-xl"
                  >
                    {/* Contenedor de Imagen */}
                    <div
                      className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenProductModal(product)}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.nombre}
                          className={`w-full h-full object-cover transition-all duration-500 ${
                            hasStock ? 'group-hover:scale-105' : 'opacity-75 grayscale-[20%] group-hover:opacity-100'
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-4 text-center">
                          <Gem className="w-10 h-10 stroke-[1.5] mb-2" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">GUTSY</span>
                        </div>
                      )}

                      {/* Badges Flotantes */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {isLowStock && (
                          <span className="px-2 py-0.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
                            ¡Últimas {product.stock_total}!
                          </span>
                        )}
                        {!hasStock && (
                          <span className="px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                            Agotado
                          </span>
                        )}
                        {product.genero_display && (
                          <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/90 backdrop-blur-sm text-black dark:text-white text-[9px] font-bold tracking-wider uppercase border border-zinc-200 dark:border-zinc-800">
                            {product.genero_display}
                          </span>
                        )}
                      </div>

                      {/* Botón Vista Rápida en hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProductModal(product);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-black text-black dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Información del Producto */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Categoría & Materiales */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          <span>{product.categoria_display || 'Accesorio'}</span>
                          {product.materiales?.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate">{product.materiales[0].nombre}</span>
                            </>
                          )}
                        </div>

                        {/* Nombre */}
                        <h3
                          onClick={() => handleOpenProductModal(product)}
                          className="text-xs sm:text-sm font-bold text-black dark:text-white tracking-wide uppercase line-clamp-2 cursor-pointer hover:underline"
                        >
                          {product.nombre}
                        </h3>

                        {/* Variantes mini preview */}
                        {hasMultipleVariants && (
                          <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {variants.map((v, i) => (
                              <span
                                key={v.id || i}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold"
                              >
                                {v.color || v.talle_medida || `Var ${i+1}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Precio y Botón de Compra */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-medium block leading-none">Precio</span>
                          <span className="text-xs sm:text-sm font-black text-black dark:text-white tracking-wider">
                            Gs. {formatGsInput(product.precio_venta || 0)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenProductModal(product)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 ${
                            hasStock
                              ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 shadow-sm'
                              : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400'
                          }`}
                        >
                          {hasStock ? (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Comprar</span>
                            </>
                          ) : (
                            <span className="text-[11px]">Agotado</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ─── MODAL DETALLE DE PRODUCTO (Lookbook View) ────────────────────── */}
      <AnimatePresence>
        {activeModalProduct && (
          <motion.div
            key="product-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveModalProduct(null)}
          >
            <motion.div
              key="product-modal-panel"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
            {/* Botón Cerrar */}
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:scale-105 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Columna Imagen */}
            <div className="md:w-1/2 bg-zinc-100 dark:bg-zinc-900 relative flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white dark:bg-black flex items-center justify-center shadow-inner">
                {selectedVariant?.imagen_url || activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url ? (
                  <img
                    src={selectedVariant?.imagen_url || activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url}
                    alt={activeModalProduct.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Gem className="w-12 h-12 stroke-[1.5] mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase">GUTSY</span>
                  </div>
                )}
              </div>

              {/* Beneficios Rápidos (Dinámicos por material) */}
              <div className="mt-4 grid grid-cols-2 gap-2 w-full text-[11px] text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white flex-shrink-0" />
                  <span className="truncate">
                    {activeModalProduct.materiales?.length > 0
                      ? activeModalProduct.materiales.map(m => m.nombre).join(', ')
                      : 'Garantía de Calidad'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-black dark:text-white flex-shrink-0" />
                  <span>Diseño Exclusivo</span>
                </div>
              </div>
            </div>

            {/* Columna Detalles y Variantes */}
            <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">
                  {activeModalProduct.categoria_display} • {activeModalProduct.genero_display}
                </span>

                <h2 className="text-lg font-black tracking-wide uppercase font-serif mt-1">
                  {activeModalProduct.nombre}
                </h2>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-black dark:text-white">
                    Gs. {formatGsInput(selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0)}
                  </span>
                </div>

                {/* Selector de Variantes (Color / Talle) */}
                {activeModalProduct.variantes && activeModalProduct.variantes.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider block text-zinc-700 dark:text-zinc-300">
                      Selecciona una opción:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activeModalProduct.variantes.map(v => {
                        const isSelected = selectedVariant?.id === v.id;
                        const hasVarStock = v.stock > 0;
                        return (
                          <button
                            key={v.id}
                            disabled={!hasVarStock}
                            onClick={() => setSelectedVariant(v)}
                            className={`p-2.5 rounded-xl text-left border text-xs transition relative ${
                              isSelected
                                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold shadow-sm'
                                : hasVarStock
                                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white hover:border-zinc-400'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-bold truncate">{v.color || v.sku || 'Estándar'}</div>
                            <div className="text-[10px] opacity-80">
                              {v.talle_medida ? `Talle: ${v.talle_medida}` : ''} • Stock: {v.stock}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Personalización / Grabado Láser */}
                {isCustomizableProduct(activeModalProduct) && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Personalización / Grabado Láser</span>
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      value={customEngravingText}
                      onChange={e => setCustomEngravingText(e.target.value)}
                      placeholder="Ej: Cara 1: Lucas · Cara 2: 15.08.2024 · Cara 3: Coordenadas (o 'Adjuntaré logo en el chat')"
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white transition resize-none text-black dark:text-white"
                    />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Si deseas grabar un logo, foto o diseño especial, indícalo aquí y podrás adjuntar el archivo directamente en el chat de WhatsApp al finalizar.
                    </p>
                  </div>
                )}

                {/* Estado de disponibilidad */}
                {(() => {
                  const currentStock = selectedVariant != null
                    ? (selectedVariant.stock ?? 0)
                    : (activeModalProduct.stock_total ?? 0);
                  const isAvailable = activeModalProduct.activo !== false && currentStock > 0;

                  return (
                    <>
                      {/* Selector de Cantidad */}
                      {isAvailable && (
                        <div className="mt-5 flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                            Cantidad
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-black w-6 text-center">{modalQuantity}</span>
                            <button
                              onClick={() => {
                                const max = selectedVariant ? selectedVariant.stock : (activeModalProduct.stock_total || 99);
                                if (modalQuantity < max) {
                                  setModalQuantity(modalQuantity + 1);
                                } else {
                                  alert(`Solo hay ${max} unidades disponibles.`);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botón Agregar al Carrito o Agotado */}
                      <div className="mt-6">
                        <button
                          onClick={() => isAvailable && handleAddToCart(activeModalProduct, selectedVariant, modalQuantity, customEngravingText)}
                          disabled={!isAvailable}
                          className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition ${
                            isAvailable
                              ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-[1.02] active:scale-95'
                              : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-75'
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>
                                Agregar al Carrito • Gs. {formatGsInput((selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0) * modalQuantity)}
                              </span>
                            </>
                          ) : (
                            <span>Producto Agotado</span>
                          )}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CARRITO & CHECKOUT DRAWER (Optimizado para Paraguay) ──────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
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
                <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Tu Pedido</h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    {totalCartItems} artículo{totalCartItems !== 1 ? 's' : ''} seleccionado{totalCartItems !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:scale-105 transition"
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
                    Explora nuestras joyas y añade tus favoritas para armar tu pedido.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
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
                    {cart.map(item => (
                      <div
                        key={item.key}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-black overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Gem className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold uppercase tracking-wide truncate">{item.name}</h5>
                          {(item.color || item.size) && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                              {[item.color, item.size ? `Talle: ${item.size}` : ''].filter(Boolean).join(' • ')}
                            </span>
                          )}
                          {item.customText && (
                            <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50 font-medium">
                              <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="truncate">Grabado: {item.customText}</span>
                            </div>
                          )}
                          <span className="text-xs font-black text-black dark:text-white mt-0.5 block">
                            Gs. {formatGsInput(item.price * item.quantity)}
                          </span>
                        </div>

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

                        <button
                          onClick={() => removeCartItem(item.key)}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ─── PASO 1: Destino de Entrega ──────────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                      1. Selecciona tu Ubicación y Envío:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setShippingType('villarrica');
                        }}
                        className={`p-3 rounded-2xl text-left border text-xs transition flex items-center justify-between ${
                          shippingType === 'villarrica'
                            ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold">Delivery Villarrica y/o alrededores</div>
                            <div className="text-[10px] opacity-80">Entrega rápida en puerta</div>
                          </div>
                        </div>
                        <span className="font-black text-xs whitespace-nowrap">+ Gs. 15.000</span>
                      </button>

                      <button
                        onClick={() => {
                          setShippingType('interior');
                          if (paymentMethod === 'contraentrega') setPaymentMethod('contimovil');
                        }}
                        className={`p-3 rounded-2xl text-left border text-xs transition flex items-center justify-between ${
                          shippingType === 'interior'
                            ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold">Envíos Nacionales</div>
                            <div className="text-[10px] opacity-80">Vía Transportadora · Podes abonar el COSTO DE ENVIO al recibir (Promedio Gs. 35.000)</div>
                          </div>
                        </div>
                        <span className="font-black text-[11px] whitespace-nowrap">Flete en destino</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── PASO 2: Datos de Envío / Contacto ────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                      {shippingType === 'villarrica' ? '2. Datos de Contacto:' : '2. Datos para el Envío y Rótulo:'}
                    </span>
                    <div className="space-y-2 text-xs">
                      {shippingType === 'villarrica' ? (
                        <>
                          <div>
                            <input
                              type="text"
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder="Nombre y Apellido *"
                              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              placeholder="Celular / WhatsApp *"
                              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                            />
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                            <div className="font-bold text-black dark:text-white flex items-center gap-1.5">
                              <span>📍</span>
                              <span>Coordinación de Entrega en Villarrica</span>
                            </div>
                            <p className="leading-snug">
                              Al confirmar tu pedido y pago por WhatsApp, te pediremos tu ubicación en tiempo real o referencias exactas para despachar el delivery.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <input
                              type="text"
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder="Nombre y Apellido completo *"
                              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={customerDoc}
                              onChange={e => setCustomerDoc(e.target.value)}
                              placeholder="Nro. Cédula (C.I.) *"
                              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                            />
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              placeholder="Celular / WhatsApp *"
                              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                            />
                          </div>

                          <input
                            type="text"
                            value={customerCity}
                            onChange={e => setCustomerCity(e.target.value)}
                            placeholder="Ciudad y Departamento de destino *"
                            className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white"
                          />
                          <textarea
                            rows={2}
                            value={customerAddress}
                            onChange={e => setCustomerAddress(e.target.value)}
                            placeholder="Dirección exacta o Sucursal de Transportadora *"
                            className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white resize-none"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* ─── PASO 3: Medio de Pago ──────────────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                      3. Selecciona tu Medio de Pago:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {/* Link ContiMóvil */}
                      <button
                        onClick={() => setPaymentMethod('contimovil')}
                        className={`p-3 rounded-2xl text-left border text-xs transition ${
                          paymentMethod === 'contimovil'
                            ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold">Link de Pago ContiMóvil (Tarjetas)</div>
                            <div className="text-[10px] opacity-80">
                              Te enviamos el link seguro a tu WhatsApp para pagar con tarjeta
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Transferencia SIPAP */}
                      <button
                        onClick={() => setPaymentMethod('transferencia')}
                        className={`p-3 rounded-2xl text-left border text-xs transition ${
                          paymentMethod === 'transferencia'
                            ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold">Transferencia Bancaria (SIPAP)</div>
                            <div className="text-[10px] opacity-80">
                              Transferencia directa a Continental, ueno bank o Itaú
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* CAJA DESPLEGABLE CON SELECTOR DE 3 BANCOS & COPIA DE ALIAS */}
                      {paymentMethod === 'transferencia' && (
                        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs animate-in fade-in">
                          {/* Pestañas de Bancos */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
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
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                        : 'bg-white dark:bg-black text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
                                    }`}
                                  >
                                    {bank.shortName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Destacado Especial para TIPO DE ALIAS & ALIAS (Copia en 1 Clic del dato limpio) */}
                          <div className="p-3 rounded-2xl bg-white dark:bg-black border-2 border-black dark:border-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold tracking-wider uppercase border border-zinc-300 dark:border-zinc-700">
                                  Tipo: {selectedBank.tipoAlias}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-sans">({selectedBank.shortName})</span>
                              </div>
                              <div className="text-base sm:text-lg font-black text-black dark:text-white font-mono tracking-tight select-all">
                                {selectedBank.alias}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAliasOnly(selectedBank.alias)}
                              className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition flex-shrink-0"
                              title="Copiar solo el alias"
                            >
                              {copiedAlias ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedAlias ? '¡Alias Copiado!' : 'Copiar Alias'}</span>
                            </button>
                          </div>

                          {/* Todos los detalles de la cuenta */}
                          <div className="text-[11px] space-y-0.5 text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <div><strong>Banco:</strong> {selectedBank.name}</div>
                            <div><strong>Titular:</strong> {selectedBank.titular}</div>
                            <div><strong>C.I. / RUC:</strong> {selectedBank.documento}</div>
                            <div><strong>Nro. Cuenta:</strong> {selectedBank.cuenta}</div>
                            <div><strong>Tipo:</strong> {selectedBank.tipoCuenta}</div>
                          </div>

                          {/* Botón secundario para copiar todos los datos */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-500 italic">
                              * Adjuntarás tu comprobante por WhatsApp.
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBankDetails(selectedBank)}
                              className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline flex items-center gap-1"
                            >
                              {copiedBank ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedBank ? '¡Datos Copiados!' : 'Copiar todo el bloque'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* QR Bancario */}
                      <button
                        onClick={() => setPaymentMethod('qr')}
                        className={`p-3 rounded-2xl text-left border text-xs transition ${
                          paymentMethod === 'qr'
                            ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <QrCode className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold">Pago con QR Bancario</div>
                            <div className="text-[10px] opacity-80">
                              Te enviamos el código QR con el monto exacto de tu pedido para escanearlo y pagar desde tu app bancaria
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Contra Entrega (Solo para Villarrica) */}
                      {shippingType === 'villarrica' && (
                        <button
                          onClick={() => setPaymentMethod('contraentrega')}
                          className={`p-3 rounded-2xl text-left border text-xs transition ${
                            paymentMethod === 'contraentrega'
                              ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Banknote className="w-4 h-4 flex-shrink-0" />
                            <div>
                              <div className="font-bold">Pago Contra Entrega (Villarrica)</div>
                              <div className="text-[10px] opacity-80">
                                Pagas al recibir en efectivo o con tu tarjeta en nuestro POS Bancard
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
              <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Subtotal Productos</span>
                    <span>Gs. {formatGsInput(cartSubtotal)}</span>
                  </div>
                  {deliveryCost > 0 && (
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Delivery en Villarrica</span>
                      <span>Gs. {formatGsInput(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm sm:text-base font-black text-black dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span>Total a Pagar</span>
                    <span className="text-base sm:text-lg">Gs. {formatGsInput(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSendOrderWhatsApp}
                  disabled={isSubmittingOrder}
                  className="w-full py-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-2xl hover:scale-[1.02] active:scale-95 transition"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                  <span>Finalizar Pedido por WhatsApp</span>
                </button>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE FILTROS EN MOBILE (CAMBIO 6) ──────────────────────── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            key="mobile-filters-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              key="mobile-filters-panel"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-black dark:text-white" />
                  <h3 className="text-sm font-bold uppercase tracking-wider font-serif">
                    Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                  </h3>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:scale-105 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido scrolleable de filtros */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                {/* 1. Género */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Público / Género</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'ALL', label: 'Todos' },
                      { id: 'F', label: 'Dama' },
                      { id: 'M', label: 'Hombre' },
                      { id: 'U', label: 'Unisex' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGender(g.id)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                          selectedGender === g.id
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Material */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Material</span>
                  <div className="grid grid-cols-2 gap-2">
                    {materialFilterOptions.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMaterial(m.id)}
                        className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                          selectedMaterial === m.id
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Color */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Color</span>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_FILTER_OPTIONS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.id)}
                        className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                          selectedColor === c.id
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Ordenar */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Ordenar por</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'featured', label: 'Destacados' },
                      { id: 'price-asc', label: 'Menor Precio' },
                      { id: 'price-desc', label: 'Mayor Precio' },
                      { id: 'name', label: 'Nombre A-Z' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSortBy(s.id)}
                        className={`p-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition ${
                          sortBy === s.id
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer con botones de acción */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedGender('ALL');
                    setSelectedMaterial('ALL');
                    setSelectedColor('ALL');
                    setSearchTerm('');
                  }}
                  className="px-4 py-3 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold uppercase tracking-wider hover:opacity-80 transition"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition"
                >
                  Ver {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE ÉXITO TRAS ENVIAR PEDIDO ──────────────────────────── */}
      {orderSentSuccess && (
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
              onClick={() => {
                setOrderSentSuccess(false);
                setIsCartOpen(false);
                setCart([]);
              }}
              className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider"
            >
              Entendido, volver a la tienda
            </button>
          </div>
        </div>
      )}

      {/* ─── FOOTER PERSUASIVO & ELEGANTE ───────────────────────────────── */}
      <footer className="bg-zinc-950 text-white border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                <Gem className="w-4 h-4" />
              </div>
              <span className="text-xl font-black uppercase tracking-widest font-serif">GUTSY</span>
            </div>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Tu propio estilo, tu propia esencia. Joyas y accesorios de acero inoxidable diseñados para durar.
            </p>
            <p className="text-[11px] text-zinc-500">
              📍 Villarrica, Guairá, Paraguay.
            </p>
          </div>

          {/* Medios de Pago */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-zinc-300">Medios de Pago</h4>
            <ul className="space-y-1.5 text-zinc-400 text-[11px]">
              <li>• Link ContiMóvil (Crédito / Débito)</li>
              <li>• Transferencias SIPAP (ueno bank, Continental, Familiar)</li>
              <li>• Código QR Bancario</li>
              <li>• POS Bancard & Efectivo (Villarrica)</li>
            </ul>
          </div>

          {/* Envíos */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-zinc-300">Logística & Envíos</h4>
            <ul className="space-y-1.5 text-zinc-400 text-[11px]">
              <li>• <strong>Villarrica:</strong> Delivery local (Gs. 15.000)</li>
              <li>• <strong>Interior del País:</strong> Vía Transportadora (Flete en destino)</li>
              <li>• Empaque seguro y presentación de regalo</li>
            </ul>
          </div>

          {/* Contacto & Acceso */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-zinc-300">Atención al Cliente</h4>
            <a
              href={`https://wa.me/${STORE_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-600 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp: {STORE_WHATSAPP_DISPLAY}</span>
            </a>

            <div className="pt-2">
              <button
                onClick={user ? onGoToAdmin : onOpenAdminLogin}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest flex items-center gap-1 transition"
              >
                <Lock className="w-3 h-3" />
                <span>{user ? 'Ir al Panel Administrativo' : 'Acceso Administrador'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 gap-2">
          <span>© {new Date().getFullYear()} GUTSY. Todos los derechos reservados.</span>
          <span>Desarrollado para Gutsy Paraguay</span>
        </div>
      </footer>
    </div>
  );
}
