import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Sparkles, ShieldCheck, Droplets, Truck,
  Heart, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2,
  Copy, Check, MessageCircle, ChevronRight, ChevronLeft, Phone, Instagram,
  MapPin, CreditCard, QrCode, Building2, Banknote, Filter,
  Lock, ArrowLeft, Gem, Tag, Eye, RefreshCw, Package,
  Ruler, ZoomIn, ChevronDown, ChevronUp, Gift, RotateCcw, Info, Share2, Award,
  Star, Maximize2, Clock, Sun, Moon, PenTool, Layers
} from 'lucide-react';
import { formatGsInput } from '../currency';
import { fetchMateriales, createPedidoWeb } from '../services/api';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductLightbox from '../components/ProductLightbox';
import GutsyLogo from '../components/GutsyLogo';
import { getOptimizedImageUrl } from '../utils/formatters';

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
  { id: 'ALL', label: 'Todos', icon: Tag },
  { id: 'AN', label: 'Anillos', icon: Tag },
  { id: 'CA', label: 'Cadenas', icon: Tag },
  { id: 'CO', label: 'Collares', icon: Tag },
  { id: 'PU', label: 'Pulseras & Brazaletes', icon: Tag },
  { id: 'AR', label: 'Aros', icon: Tag },
  { id: 'ST', label: 'Sets & Combos', icon: Tag },
  { id: 'PA', label: 'Parejas', icon: Tag },
  { id: 'LE', label: 'Lentes', icon: Tag },
  { id: 'TO', label: 'Tobilleras', icon: Tag },
  { id: 'DI', label: 'Dijes & Colgantes', icon: Tag },
  { id: 'OT', label: 'Otros', icon: Tag },
];

// Mensajes para la marquesina infinita superior (CAMBIO 1)
const ANNOUNCEMENT_ITEMS = [
  { text: 'MATERIALES SELECCIONADOS', icon: ShieldCheck },
  { text: 'GARANTÍA DE CALIDAD', icon: Award },
  { text: '+100 MODELOS', icon: Layers },
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

// ─── SKELETON WIREFRAME DE CARGA (PRODUCTOS) ─────────────────────────────
function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden flex flex-col p-3 space-y-3"
        >
          {/* Contenedor de Imagen Skeleton */}
          <div className="aspect-square w-full rounded-xl bg-zinc-200/80 dark:bg-zinc-900 animate-pulse" />
          
          {/* Subtítulo Marca / Categoría */}
          <div className="h-2.5 w-1/3 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse" />
          
          {/* Título de Producto */}
          <div className="h-4 w-4/5 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse" />
          
          {/* Precio y Botón */}
          <div className="pt-2 flex items-center justify-between">
            <div className="h-5 w-2/5 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StorefrontView({
  productos = [],
  onOpenAdminLogin,
  user,
  onGoToAdmin,
  theme,
  onToggleTheme,
  isLoading = false
}) {
  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [isShimmering, setIsShimmering] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'name'
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [customEngravingText, setCustomEngravingText] = useState('');
  const [engravingFace1, setEngravingFace1] = useState('');
  const [engravingFace2, setEngravingFace2] = useState('');
  const [activeEngravingFace, setActiveEngravingFace] = useState('face1'); // 'face1' | 'face2'
  const [dbMaterials, setDbMaterials] = useState([]);

  // Sincronizar grabado de múltiples caras en customEngravingText
  useEffect(() => {
    const parts = [];
    if (engravingFace1.trim()) parts.push(`Cara 1: ${engravingFace1.trim()}`);
    if (engravingFace2.trim()) parts.push(`Cara 2: ${engravingFace2.trim()}`);
    setCustomEngravingText(parts.join(' · '));
  }, [engravingFace1, engravingFace2]);

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

  // Modal de Detalle de Producto & UI Extras
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [earringOption, setEarringOption] = useState('par'); // 'par' | 'unidad'
  const [activeReviewModal, setActiveReviewModal] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideInitialTab, setSizeGuideInitialTab] = useState('anillos');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [openAccordion, setOpenAccordion] = useState(null); // Accordions closed by default for optimal initial visual balance
  const [engravingFont, setEngravingFont] = useState('cursiva'); // 'cursiva' | 'clasica' | 'romana'
  const [selectedPackaging, setSelectedPackaging] = useState('standard'); // 'standard' | 'giftbox'
  const [isGiftOption, setIsGiftOption] = useState(false); // boolean (Añadir moño de regalo gratis)
  const crossSellScrollRef = useRef(null);

  const handleOpenSizeGuide = (categoria) => {
    if (categoria === 'AN') setSizeGuideInitialTab('anillos');
    else if (categoria === 'CA' || categoria === 'CO' || categoria === 'DI') setSizeGuideInitialTab('cadenas');
    else if (categoria === 'PU' || categoria === 'TO') setSizeGuideInitialTab('pulseras');
    else setSizeGuideInitialTab('anillos');
    setIsSizeGuideOpen(true);
  };

  // Formulario de Envío y Checkout
  const [shippingType, setShippingType] = useState('villarrica'); // 'villarrica', 'interior'
  const [paymentMethod, setPaymentMethod] = useState('contimovil'); // 'contimovil', 'transferencia', 'qr', 'contraentrega'
  const [selectedBankId, setSelectedBankId] = useState('continental'); // 'continental', 'ueno', 'itau'
  
  const selectedBank = useMemo(() => {
    return BANK_ACCOUNTS.find(b => b.id === selectedBankId) || BANK_ACCOUNTS[0];
  }, [selectedBankId]);

  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerDept, setCustomerDept] = useState('');
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

  // Helper para mostrar género limpio (Dama, Caballero, Unisex)
  const formatGenero = (g) => {
    if (!g) return '';
    const lower = String(g).toLowerCase().trim();
    if (lower.includes('dama') || lower.includes('femenino') || lower === 'f') return 'Dama';
    if (lower.includes('caballero') || lower.includes('hombre') || lower.includes('masculino') || lower === 'm') return 'Caballero';
    if (lower.includes('unisex') || lower === 'u') return 'Unisex';
    return g;
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

  // Helper para comparar color de variante con el filtro seleccionado
  const isColorMatch = (variantColor, filterColor) => {
    if (!filterColor || filterColor === 'ALL') return false;
    const c = (variantColor || '').toLowerCase();
    if (filterColor === 'negro') return c.includes('negro') || c.includes('black');
    if (filterColor === 'plateado') return c.includes('plateado') || c.includes('plata') || c.includes('silver');
    if (filterColor === 'dorado') return c.includes('dorado') || c.includes('oro') || c.includes('gold');
    if (filterColor === 'rose_gold') return c.includes('rose') || c.includes('rosado') || c.includes('rosa');
    if (filterColor === 'blanco') return c.includes('blanco') || c.includes('white');
    return false;
  };

  // Helper para obtener la variante que coincide con el filtro de color
  const getMatchingColorVariant = (product, filterColor) => {
    if (!product || !product.variantes || product.variantes.length === 0 || !filterColor || filterColor === 'ALL') {
      return null;
    }
    // Primero buscar variante con stock disponible que coincida con el color
    const withStock = product.variantes.find(v => v.activo !== false && (v.stock || 0) > 0 && isColorMatch(v.color, filterColor));
    if (withStock) return withStock;
    // Sino, cualquier variante activa que coincida con el color
    return product.variantes.find(v => v.activo !== false && isColorMatch(v.color, filterColor)) || null;
  };

  // Helper para renderizar los círculos de colores de variantes con acabados premium y legibilidad en dark/light
  const getColorSwatchStyle = (colorName) => {
    if (!colorName) return { 
      bgClass: 'bg-zinc-400', 
      borderClass: 'border-zinc-300 dark:border-zinc-600',
      isLight: true 
    };
    const c = colorName.toLowerCase().trim();
    if (c.includes('negro') || c.includes('black')) {
      return { 
        bgClass: 'bg-zinc-950', 
        borderClass: 'border-zinc-400 dark:border-zinc-500 shadow-sm',
        isLight: false 
      };
    }
    if (c.includes('dorado') || c.includes('oro') || c.includes('gold')) {
      return { 
        bgClass: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600', 
        borderClass: 'border-amber-300 dark:border-amber-500 shadow-sm',
        isLight: true 
      };
    }
    if (c.includes('plateado') || c.includes('plata') || c.includes('silver') || c.includes('acero')) {
      return { 
        bgClass: 'bg-gradient-to-br from-slate-100 via-slate-300 to-zinc-400', 
        borderClass: 'border-slate-300 dark:border-slate-500 shadow-sm',
        isLight: true 
      };
    }
    if (c.includes('rose') || c.includes('rosad') || c.includes('rosa') || c.includes('cobre')) {
      return { 
        bgClass: 'bg-gradient-to-br from-rose-200 via-rose-300 to-pink-400', 
        borderClass: 'border-rose-300 dark:border-rose-400 shadow-sm',
        isLight: true 
      };
    }
    if (c.includes('azul') || c.includes('blue')) {
      return { 
        bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-700', 
        borderClass: 'border-blue-400 dark:border-blue-500 shadow-sm',
        isLight: false 
      };
    }
    if (c.includes('rojo') || c.includes('red')) {
      return { 
        bgClass: 'bg-gradient-to-br from-red-500 to-rose-700', 
        borderClass: 'border-red-400 dark:border-red-500 shadow-sm',
        isLight: false 
      };
    }
    if (c.includes('verde') || c.includes('green')) {
      return { 
        bgClass: 'bg-gradient-to-br from-emerald-400 to-green-700', 
        borderClass: 'border-emerald-400 dark:border-emerald-500 shadow-sm',
        isLight: false 
      };
    }
    if (c.includes('blanco') || c.includes('white')) {
      return { 
        bgClass: 'bg-white', 
        borderClass: 'border-zinc-300 dark:border-zinc-600 shadow-sm',
        isLight: true 
      };
    }
    if (c.includes('morad') || c.includes('violet') || c.includes('purp')) {
      return { 
        bgClass: 'bg-gradient-to-br from-purple-500 to-violet-700', 
        borderClass: 'border-purple-400 dark:border-purple-500 shadow-sm',
        isLight: false 
      };
    }
    if (c.includes('tornasol') || c.includes('arcoiris') || c.includes('multicolor') || c.includes('iridiscente')) {
      return { 
        bgClass: 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-yellow-400', 
        borderClass: 'border-cyan-300 shadow-sm',
        isLight: true 
      };
    }
    return { 
      bgClass: 'bg-zinc-400 dark:bg-zinc-600', 
      borderClass: 'border-zinc-300 dark:border-zinc-500 shadow-sm',
      isLight: true 
    };
  };

  // Helper para precios de Aros (Par vs Unidad)
  const getAroPrecios = (product) => {
    if (!product) return { precioPar: 0, precioUnidad: 0 };
    const precioPar = product.precio_venta || 0;
    let precioUnidad = product.precio_unidad;
    if (!precioUnidad || precioUnidad <= 0) {
      if (product.precio_unidad_calculado) {
        precioUnidad = product.precio_unidad_calculado;
      } else {
        if (precioPar <= 20000) precioUnidad = 15000;
        else if (precioPar <= 30000) precioUnidad = 20000;
        else if (precioPar <= 40000) precioUnidad = 25000;
        else if (precioPar <= 50000) precioUnidad = 30000;
        else if (precioPar <= 60000) precioUnidad = 35000;
        else precioUnidad = Math.round((precioPar / 2 + 5000) / 5000) * 5000;
      }
    }
    return { precioPar, precioUnidad };
  };

  // ─── Filtrado de Productos ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return productos.filter(product => {
      // Ocultar productos de categoría Packaging (PQ) de la lista general del catálogo
      if (selectedCategory !== 'PQ' && product.categoria === 'PQ') {
        return false;
      }

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
      // featured: priorizar productos con imagen cargada y mayor stock
      const aHasImg = (a.imagen_url_completa || a.imagen_url) ? 1 : 0;
      const bHasImg = (b.imagen_url_completa || b.imagen_url) ? 1 : 0;
      if (aHasImg !== bHasImg) return bHasImg - aHasImg;
      return (b.stock_total || 0) - (a.stock_total || 0);
    });
  }, [productos, searchTerm, selectedCategory, selectedGender, selectedMaterial, selectedColor, sortBy]);

  const INITIAL_PRODUCT_LIMIT = 8;
  const [showAllProducts, setShowAllProducts] = useState(false);
  const hasActiveFilters = searchTerm || selectedCategory !== 'ALL' || selectedGender !== 'ALL' || selectedMaterial !== 'ALL' || selectedColor !== 'ALL';
  const displayedProducts = (showAllProducts || hasActiveFilters) ? filteredProducts : filteredProducts.slice(0, INITIAL_PRODUCT_LIMIT);
  const hasMoreProducts = !hasActiveFilters && !showAllProducts && filteredProducts.length > INITIAL_PRODUCT_LIMIT;

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

  // ─── Galería Dinámica de Fotos para el Modal (Filtrada por Color) ──────────
  const modalImages = useMemo(() => {
    if (!activeModalProduct) return [];
    const list = [];
    const addedUrls = new Set();

    // Normalizar URLs para evitar duplicados por diferencias de dominio/puerto (ej: http://localhost vs /media/)
    const normalizeUrl = (u) => {
      if (!u) return '';
      try {
        if (u.startsWith('http://') || u.startsWith('https://')) {
          const parsed = new URL(u);
          return parsed.pathname;
        }
      } catch (e) {}
      return u.trim();
    };

    const addImg = (url, label, variantId = null) => {
      if (!url) return;
      const norm = normalizeUrl(url);
      if (norm && !addedUrls.has(norm)) {
        addedUrls.add(norm);
        list.push({ url, label, variantId });
      }
    };

    const activeColor = (selectedVariant?.color || '').trim().toLowerCase();

    // 1. Fotos representativas de las variantes
    if (activeModalProduct.variantes && activeModalProduct.variantes.length > 0) {
      if (activeColor) {
        const colorVariants = activeModalProduct.variantes.filter(
          v => (v.color || '').trim().toLowerCase() === activeColor
        );
        // Tomar exactamente 1 foto representativa por color (evita duplicar por cada talle/medida como Talle 7, 8, 9, 10)
        const varWithImg = colorVariants.find(v => v.imagen_url);
        if (varWithImg && varWithImg.imagen_url) {
          addImg(varWithImg.imagen_url, varWithImg.color || 'Color', varWithImg.id);
        }
      } else {
        // Si no hay color seleccionado aún, tomar 1 foto por color único
        const seenColors = new Set();
        activeModalProduct.variantes.forEach(v => {
          const c = (v.color || '').trim().toLowerCase();
          if (c && !seenColors.has(c) && v.imagen_url) {
            seenColors.add(c);
            addImg(v.imagen_url, v.color || 'Color', v.id);
          }
        });
      }
    }

    // 2. Fotos de la galería adicional del producto (filtradas por color o generales)
    if (activeModalProduct.imagenes_galeria && activeModalProduct.imagenes_galeria.length > 0) {
      activeModalProduct.imagenes_galeria.forEach((g) => {
        const gUrl = g.url || g.imagen_url;
        const gColor = (g.color || '').trim().toLowerCase();
        
        // Si no hay color activo: mostrar todo
        // Si hay color activo: mostrar si coincide el color O si es foto general (sin color / 'general' / 'todos')
        const matchesColor = !activeColor || !gColor || gColor === 'general' || gColor === 'todos' || gColor === activeColor;
        
        if (gUrl && matchesColor) {
          addImg(gUrl, g.color ? `${g.color}` : 'Galería');
        }
      });
    }

    // 3. Si no hay fotos para ese color específico (o el producto no tiene variantes), usar la foto principal
    const mainImg = activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url;
    if (list.length === 0 && mainImg) {
      addImg(mainImg, 'Principal');
    }

    return list;
  }, [activeModalProduct, selectedVariant?.color]);

  // Helper para identificar el grupo de color principal de un producto o variante
  const getColorGroup = (product, activeVariant) => {
    if (!product) return null;
    const variantColor = (activeVariant?.color || '').toLowerCase();
    const productName = (product.nombre || '').toLowerCase();
    const desc = (product.descripcion || '').toLowerCase();
    const variantColors = (product.variantes || []).map(v => v.color || '').join(' ').toLowerCase();

    const fullText = `${variantColor} ${productName} ${desc} ${variantColors}`;

    if (fullText.includes('dorad') || fullText.includes('gold') || fullText.includes('oro')) return 'dorado';
    if (fullText.includes('platead') || fullText.includes('silver') || fullText.includes('plata')) return 'plateado';
    if (fullText.includes('negr') || fullText.includes('black')) return 'negro';
    if (fullText.includes('rose') || fullText.includes('rosad') || fullText.includes('rosa')) return 'rose';
    if (fullText.includes('cuero') || fullText.includes('marr') || fullText.includes('brown')) return 'cuero';

    return null;
  };

  // ─── Cross-Selling Inteligente "Completa tu Look" (Priorizando Color & Género) ──────
  const crossSellProducts = useMemo(() => {
    if (!activeModalProduct || !productos || productos.length === 0) return [];
    
    const cat = activeModalProduct.categoria;
    const currentGender = formatGenero(activeModalProduct.genero_display || activeModalProduct.genero); // 'Caballero', 'Dama', 'Unisex'
    const currentColorGroup = getColorGroup(activeModalProduct, selectedVariant);

    // Definir categorías complementarias prioritarias
    let targetCats = [];
    if (cat === 'AN') targetCats = ['PU', 'CA', 'CO', 'DI', 'AR'];
    else if (cat === 'CA' || cat === 'CO') targetCats = ['PU', 'AN', 'DI', 'AR'];
    else if (cat === 'DI') targetCats = ['CA', 'CO', 'PU', 'AN'];
    else if (cat === 'PU' || cat === 'TO') targetCats = ['AN', 'CA', 'CO', 'DI', 'AR'];
    else if (cat === 'AR') targetCats = ['CO', 'CA', 'PU', 'AN'];
    else targetCats = ['PU', 'CA', 'CO', 'AN', 'AR'];

    // Filtrar productos activos con stock que NO sean el producto actual ni Packaging
    const inStock = productos.filter(
      p => p.id !== activeModalProduct.id && p.activo !== false && (p.stock_total || 0) > 0 && p.categoria !== 'PQ'
    );

    // 1. Coincidencia estricta de género (Caballero con Caballero/Unisex, Dama con Dama/Unisex)
    const matchesGender = (p) => {
      if (!currentGender || currentGender === 'Unisex') return true;
      const pGender = formatGenero(p.genero_display || p.genero);
      if (pGender === currentGender) return true;
      if (pGender === 'Unisex') return true;
      return false;
    };

    const sameGenderProducts = inStock.filter(matchesGender);
    const pool = sameGenderProducts.length >= 2 ? sameGenderProducts : inStock;

    // 2. Puntuar cada producto priorizando:
    //    a) Coincidencia de Color (Mismo color: Dorado -> Dorado, Plateado -> Plateado, Negro -> Negro)
    //    b) Categoría complementaria (Collar -> Pulsera/Anillo)
    //    c) Diversidad consistente basada en ID de producto
    const productIdSeed = Number(activeModalProduct.id) || 1;

    const scoredProducts = pool.map(p => {
      const pColorGroup = getColorGroup(p, null);
      const isSameColor = currentColorGroup && pColorGroup && pColorGroup === currentColorGroup;
      const isComplementaryCat = targetCats.includes(p.categoria);
      const catIndex = targetCats.indexOf(p.categoria);

      let score = 0;
      if (isSameColor) score += 500; // Máxima prioridad para el mismo color
      if (isComplementaryCat) {
        score += 200 - (catIndex * 30); // Prioridad para categoría complementaria
      }

      // Variación determinista pero variada por producto
      const pseudoRandom = ((Number(p.id || 0) * 37 + productIdSeed * 13) % 100);
      score += pseudoRandom;

      return { product: p, score };
    });

    // Ordenar de mayor a menor puntuación
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts.map(sp => sp.product).slice(0, 8);
  }, [activeModalProduct, selectedVariant, productos]);

  // ─── Búsqueda Dinámica de Packaging desde la BD (Categoría PQ) ──────────────
  const matchedDbPackaging = useMemo(() => {
    if (!activeModalProduct || !productos || productos.length === 0) return null;
    const pqProducts = productos.filter(p => p.categoria === 'PQ' && p.activo !== false);
    if (pqProducts.length === 0) return null;

    const cat = activeModalProduct.categoria;
    const catName = (activeModalProduct.categoria_display || '').toLowerCase();
    const gCode = (activeModalProduct.genero || '').toUpperCase();
    const gDisp = (activeModalProduct.genero_display || '').toLowerCase();
    const isDama = gCode === 'MUJ' || gDisp.includes('dama') || gDisp.includes('mujer');

    // Aros, Pulseras y Lentes no llevan caja especial de regalo
    if (
      cat === 'AR' || cat === 'PU' || cat === 'TO' || cat === 'LE' || cat === 'GA' || cat === 'AC' ||
      catName.includes('lente') || catName.includes('gafa') || catName.includes('aro') || catName.includes('pulsera')
    ) {
      return null;
    }

    // 1. Para Anillos (AN)
    if (cat === 'AN' || catName.includes('anillo')) {
      if (isDama) {
        return pqProducts.find(p => {
          const n = (p.nombre || '').toLowerCase();
          return n.includes('corazon') || n.includes('corazón') || n.includes('anillo');
        }) || pqProducts.find(p => (p.nombre || '').toLowerCase().includes('anillo')) || null;
      } else {
        // Para anillos que NO son de dama (Caballero / Unisex), buscar una caja que NO sea de corazón
        return pqProducts.find(p => {
          const n = (p.nombre || '').toLowerCase();
          return !n.includes('corazon') && !n.includes('corazón') && n.includes('anillo');
        }) || null;
      }
    }

    // 2. Para Collares / Cadenas / Dijes (CO, CA, DI)
    if (cat === 'CO' || cat === 'CA' || cat === 'DI' || catName.includes('collar') || catName.includes('cadena') || catName.includes('dije')) {
      return pqProducts.find(p => {
        const n = (p.nombre || '').toLowerCase();
        return n.includes('collar') || n.includes('cadena') || n.includes('dije');
      }) || null;
    }

    return null;
  }, [activeModalProduct, productos]);

  // ─── Manejo de Selección de Producto & Modal ──────────────────────────────
  const handleOpenProductModal = (product, targetVariant = null) => {
    setActiveModalProduct(product);
    setActiveImageIndex(0);
    setModalQuantity(1);
    setCustomEngravingText('');
    setEngravingFace1('');
    setEngravingFace2('');
    setActiveEngravingFace('face1');
    setSelectedPackaging('standard');
    setIsGiftOption(false);

    let chosenVar = null;
    if (product.variantes && product.variantes.length > 0) {
      if (targetVariant) {
        chosenVar = targetVariant;
      } else {
        const colorMatchVar = getMatchingColorVariant(product, selectedColor);

        if (colorMatchVar) {
          chosenVar = colorMatchVar;
        } else {
          // Intentar hacer coincidir la variante con la foto de portada principal del producto
          const mainImg = (product.imagen_url_completa || product.imagen_url || '').trim();

          const coverMatchVar = mainImg
            ? product.variantes.find(v => v.activo !== false && v.imagen_url && (v.imagen_url === mainImg || mainImg.endsWith(v.imagen_url) || mainImg.includes(v.imagen_url)))
            : null;

          if (coverMatchVar) {
            chosenVar = coverMatchVar;
          } else {
            // Si la URL no coincide exactamente, detectar el color por el nombre/URL de la portada
            const mainImgLower = mainImg.toLowerCase();
            let coverColorVar = null;
            if (mainImgLower.includes('negro') || mainImgLower.includes('black')) {
              coverColorVar = product.variantes.find(v => v.activo !== false && (v.color || '').toLowerCase().includes('negr'));
            } else if (mainImgLower.includes('platead') || mainImgLower.includes('silver') || mainImgLower.includes('plata')) {
              coverColorVar = product.variantes.find(v => v.activo !== false && (v.color || '').toLowerCase().includes('plat'));
            } else if (mainImgLower.includes('dorad') || mainImgLower.includes('gold') || mainImgLower.includes('oro')) {
              coverColorVar = product.variantes.find(v => v.activo !== false && (v.color || '').toLowerCase().includes('dorad'));
            }

            if (coverColorVar) {
              chosenVar = coverColorVar;
            } else {
              const firstWithStock = product.variantes.find(v => v.activo !== false && (v.stock || 0) > 0) || product.variantes[0];
              chosenVar = firstWithStock;
            }
          }
        }
      }
      setSelectedVariant(chosenVar);
    } else {
      setSelectedVariant(null);
    }

    if (product.categoria === 'AR') {
      const stock = chosenVar ? (chosenVar.stock || 0) : (product.stock_total || 0);
      setEarringOption(stock >= 2 ? 'par' : 'unidad');
    } else {
      setEarringOption('par');
    }
  };

  const handleAddToCart = (product, variant, qty = 1, customText = '', presentation = null, closeModal = true, unitPriceOverride = null) => {
    const isEarring = product.categoria === 'AR';
    const chosenPres = isEarring ? (presentation || earringOption) : null;
    const { precioPar, precioUnidad } = isEarring ? getAroPrecios(product) : { precioPar: 0, precioUnidad: 0 };

    // Si compra Par, cada 1 qty requiere 2 unidades de stock físico
    const stockUnitsPerQty = isEarring && chosenPres === 'par' ? 2 : 1;
    const totalRequiredStock = qty * stockUnitsPerQty;

    const availableStock = variant ? (variant.stock || 0) : (product.stock_total || 0);
    if (product.activo === false || availableStock < totalRequiredStock) {
      alert(`No hay suficiente stock disponible. (Disponibles: ${availableStock} un.)`);
      return;
    }

    const basePrice = isEarring
      ? (chosenPres === 'par' ? precioPar : precioUnidad)
      : (variant?.precio_venta_pyg || product.precio_venta || 0);

    const itemPrice = unitPriceOverride !== null ? unitPriceOverride : basePrice;

    const presentationLabel = isEarring
      ? (chosenPres === 'par' ? 'Par (2 un.)' : 'Individual (1 un.)')
      : null;

    const customKeySuffix = [
      chosenPres ? `-${chosenPres}` : '',
      customText && customText.trim() ? `-${customText.trim().substring(0, 15)}` : ''
    ].filter(Boolean).join('');

    const itemKey = variant
      ? `${product.id}-${variant.id}${customKeySuffix}`
      : `${product.id}-default${customKeySuffix}`;

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
          presentation: presentationLabel,
          stockUnitsPerItem: stockUnitsPerQty,
          maxStock: variant ? variant.stock : product.stock_total || 99,
          quantity: qty,
          customText: customText.trim() || null,
        }
      ];
    });

    // Efecto de rebote en el ícono del carrito
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 600);
    if (closeModal) {
      setActiveModalProduct(null);
    }
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

    const fullCustomerName = `${customerFirstName.trim()} ${customerLastName.trim()}`.trim();

    if (!fullCustomerName) {
      alert('Por favor, ingresa tu Nombre y Apellido para preparar tu pedido.');
      return;
    }

    if (shippingType === 'interior') {
      if (!customerPhone.trim()) {
        alert('Por favor, ingresa un número de Celular o WhatsApp para el rótulo de la transportadora.');
        return;
      }
      if (!customerCity.trim()) {
        alert('Por favor, ingresa tu Ciudad de destino.');
        return;
      }
      if (!customerAddress.trim()) {
        alert('Por favor, ingresa tu dirección de entrega o la sucursal de transportadora.');
        return;
      }
    }

    const fullCityDept = customerDept.trim() ? `${customerCity.trim()}, ${customerDept.trim()}` : customerCity.trim();

    setIsSubmittingOrder(true);

    // Construccion del mensaje de WhatsApp (emojis con escapes para evitar corrupcion)
    let message = '\u{1F6CD}\uFE0F *\u00A1HOLA GUTSY!*\n\n';

    // -- Datos del cliente --
    message += `\u{1F464} *${fullCustomerName}*\n`;
    if (customerDoc.trim())     message += `   \u{1F194} CI: ${customerDoc.trim()}\n`;
    if (customerPhone.trim())   message += `   \u{1F4F1} ${customerPhone.trim()}\n`;
    if (fullCityDept)           message += `   \u{1F4CD} ${fullCityDept}\n`;
    if (customerAddress.trim()) message += `   \u{1F3E0} ${customerAddress.trim()}\n`;
    message += '\n';

    // -- Productos --
    message += '\u{1F6D2} *PEDIDO*\n';
    cart.forEach((item, index) => {
      const variantDesc = [item.presentation, item.color, item.size ? `Talle: ${item.size}` : ''].filter(Boolean).join(' \u2022 ');
      message += `${index + 1}. *${item.name}*${variantDesc ? ' \u2014 ' + variantDesc : ''}\n`;
      if (item.customText) {
        message += `   \u270F\uFE0F _Grabado: "${item.customText}"_\n`;
      }
      message += `   ${item.quantity} ${item.presentation ? 'opción' : 'un.'} \u00D7 Gs.\u00A0${formatGsInput(item.price)} = *Gs.\u00A0${formatGsInput(item.price * item.quantity)}*\n`;
    });
    message += '\n';

    // -- Entrega --
    if (shippingType === 'villarrica') {
      message += '\u{1F6F5} *ENTREGA:* Delivery Villarrica / Alrededores \u2014 Gs.\u00A015.000\n';
      message += '   Les enviar\u00E9 mi ubicaci\u00F3n por aqu\u00ED al confirmar el pago.\n';
    } else {
      message += '\u{1F4E6} *ENTREGA:* Env\u00EDo por Transportadora \u2014 flete en destino (prom. Gs.\u00A035.000)\n';
    }
    message += '\n';

    // -- Total y pago --
    message += `\u{1F4B0} *TOTAL: Gs.\u00A0${formatGsInput(cartTotal)}*\n`;
    if (paymentMethod === 'contimovil') {
      message += '\u{1F4B3} *PAGO:* ContiM\u00F3vil (Tarjeta Cr\u00E9dito / D\u00E9bito)\n';
      message += '   \u{1F449} Por favor env\u00EDenme el link de pago.\n';
    } else if (paymentMethod === 'transferencia') {
      message += `\u{1F4B3} *PAGO:* Transferencia \u2014 ${selectedBank.shortName} (Alias: ${selectedBank.alias})\n`;
      message += '   \u{1F449} Les adjunto el comprobante enseguida.\n';
    } else if (paymentMethod === 'qr') {
      message += '\u{1F4B3} *PAGO:* QR\n';
      message += `   \u{1F449} Por favor env\u00EDenme el c\u00F3digo QR por Gs.\u00A0${formatGsInput(cartTotal)}.\n`;
    } else if (paymentMethod === 'contraentrega') {
      message += '\u{1F4B3} *PAGO:* Efectivo al recibir\n';
    }

    if (customerNotes.trim()) {
      message += `\n\u{1F4DD} *Nota:* ${customerNotes.trim()}\n`;
    }

    message += '\n\u00A1Gracias! Quedo a la espera. \u{1F64F}';

    // Registrar el pedido en la base de datos (segundo plano, sin bloquear WhatsApp)
    const pedidoPayload = {
      cliente_nombre: fullCustomerName,
      cliente_telefono: customerPhone.trim(),
      cliente_ci: customerDoc.trim(),
      cliente_ciudad: fullCityDept,
      cliente_direccion: customerAddress.trim(),
      tipo_envio: shippingType,
      metodo_pago: paymentMethod,
      subtotal_productos: cartSubtotal,
      costo_envio: deliveryCost,
      total_pedido: cartTotal,
      notas: customerNotes.trim(),
      items: cart.map(item => {
        const unitsPerItem = item.stockUnitsPerItem || 1;
        return {
          variante_id: item.variantId,
          cantidad: (item.quantity || 1) * unitsPerItem,
          precio_unitario: Math.round((item.price || 0) / unitsPerItem),
          nombre_producto: item.name + (item.presentation ? ` [${item.presentation}]` : ''),
          grabado_texto: item.customText || '',
        };
      }),
    };

    createPedidoWeb(pedidoPayload).catch(err => {
      console.warn('No se pudo registrar pedido web en BD:', err);
    });

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
            <GutsyLogo className="w-9 h-9 shrink-0" />
            <span className="text-xl sm:text-2xl font-black tracking-[0.22em] uppercase font-serif block leading-none">
              GUTSY
            </span>
          </div>

          {/* Barra de Búsqueda Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar collares, anillos, pulseras..."
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
            {/* Acceso admin solo visible si ya está autenticado */}
            {user && (
              <button
                onClick={onGoToAdmin}
                className="p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white transition"
                title="Panel"
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
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
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

      {/* ─── HERO LOOKBOOK (Estilo Editorial Limpio Blanco & Negro) ─────────── */}
      <section className="relative overflow-hidden bg-black text-white py-14 sm:py-20 border-b border-zinc-800">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase font-serif leading-tight">
            TU PROPIO ESTILO,<br />
            <span className="italic font-light tracking-wide text-zinc-300">TU PROPIA ESENCIA.</span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Piezas únicas seleccionadas para acompañar tu día a día.
          </p>

          {/* Cinta de Confianza Minimalista de 1 sola línea (Sin tarjetas pesadas ni supuestos) */}
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

      {/* ─── FILTROS Y CATEGORÍAS (Estilo Tienda de Moda Editorial) ────────── */}
      <section
        id="catalogo"
        className="sticky top-20 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {/* Pestañas de Categoría en Cápsulas Editoriales */}
            <div className="relative w-full">
              {/* Desvanecido sutil a los bordes para indicar scroll en móvil */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-black to-transparent z-10 md:hidden" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-black to-transparent z-10 md:hidden" />

              <div className="flex items-center md:justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-3 sm:px-0 scroll-smooth">
                {activeCategories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={(e) => {
                        setSelectedCategory(cat.id);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }}
                      className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold tracking-widest uppercase transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                        isActive
                          ? 'bg-black text-white dark:bg-white dark:text-black font-black shadow-xs border border-black dark:border-white'
                          : 'bg-zinc-100/90 dark:bg-zinc-900/90 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtros Secundarios: Género, Material, Color, Ordenar */}
            <div className="hidden md:flex items-center justify-center gap-3 flex-wrap text-xs pt-1">
              {/* Selector Género (Desplegable unificado) */}
              <select
                value={selectedGender}
                onChange={e => setSelectedGender(e.target.value)}
                className={`border rounded-full px-3 py-1.5 font-bold tracking-wider text-[11px] uppercase focus:outline-none transition ${
                  selectedGender !== 'ALL'
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white'
                }`}
              >
                <option value="ALL">TODOS LOS GÉNEROS</option>
                <option value="F">DAMA</option>
                <option value="M">CABALLERO</option>
                <option value="U">UNISEX</option>
              </select>

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

            {/* Filtros Secundarios: Mobile (Botón FILTRAR + Ordenar) */}
            <div className="flex md:hidden items-center justify-between gap-2.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className={`flex-1 py-2 px-3.5 rounded-full border text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition active:scale-95 ${
                  activeFilterCount > 0
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'bg-zinc-100/90 dark:bg-zinc-900/90 border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 rounded-full px-3.5 py-2 font-semibold tracking-wide text-xs focus:outline-none"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Encabezado del listado */}
        <div className="flex items-center justify-between mb-6 pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-serif">
                {ALL_STORE_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Catálogo'}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                {displayedProducts.length}{hasMoreProducts ? ` / ${filteredProducts.length}` : ''}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {filteredProducts.length === 1 ? '1 modelo disponible' : `${filteredProducts.length} modelos disponibles`}
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

        {/* Renderizado de Skeleton Wireframes de Carga o Grilla Real */}
        {isLoading || isShimmering ? (
          <ProductGridSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
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
              {displayedProducts.map((product, productIndex) => {
                const activeVariantForCard = getMatchingColorVariant(product, selectedColor);
                const rawImageSrc = activeVariantForCard?.imagen_url || product.imagen_url_completa || product.imagen_url || null;
                const imageSrc = getOptimizedImageUrl(rawImageSrc, 500);
                const hasStock = product.activo !== false && (product.stock_total || 0) > 0;
                const isLastUnit = hasStock && (product.stock_total || 0) === 1;
                const variants = product.variantes || [];
                const uniqueColors = Array.from(
                  new Set(
                    variants
                      .map(v => (v.color || '').trim())
                      .filter(Boolean)
                  )
                );
                const uniqueSizes = Array.from(
                  new Set(
                    variants
                      .map(v => (v.talle_medida || '').replace(/^talle\s*/i, '').trim())
                      .filter(Boolean)
                  )
                );
                const previewBadges = uniqueColors.length > 0
                  ? uniqueColors
                  : uniqueSizes.length > 0
                    ? uniqueSizes
                    : variants.map((v, i) => v.sku || `Opción ${i + 1}`);

                const hasPreviewBadges = previewBadges.length > 0 && (variants.length > 1 || previewBadges.length > 1);
                const isAboveFold = productIndex < 4;

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
                          loading={isAboveFold ? 'eager' : 'lazy'}
                          fetchpriority={isAboveFold ? 'high' : undefined}
                          decoding="async"
                          width="300"
                          height="300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-4 text-center">
                          <Gem className="w-10 h-10 stroke-[1.5] mb-2" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">GUTSY</span>
                        </div>
                      )}

                      {/* Badges Flotantes (Auto-ajustables al tamaño de cada palabra) */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10 pointer-events-none">
                        {isLastUnit && (
                          <span className="w-fit px-2 py-0.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
                            ¡Última unidad!
                          </span>
                        )}
                        {!hasStock && (
                          <span className="w-fit px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                            Agotado
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

                        {/* Variantes mini preview (sin colores repetidos) */}
                        {hasPreviewBadges && (
                          <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {previewBadges.map((badge, i) => {
                              const matchingVar = product.variantes?.find(v => (v.color || '').trim().toLowerCase() === badge.toLowerCase());
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenProductModal(product, matchingVar || null);
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold whitespace-nowrap hover:border-black dark:hover:border-white transition"
                                >
                                  {badge}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Precio y Botón de Compra */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-medium block leading-none">Precio</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs sm:text-sm font-black text-black dark:text-white tracking-wider">
                              Gs. {formatGsInput(product.precio_venta || 0)}
                            </span>
                            {product.categoria === 'AR' && (
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                / par
                              </span>
                            )}
                          </div>
                          {product.categoria === 'AR' && (
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block leading-tight font-medium">
                              o Gs. {formatGsInput(getAroPrecios(product).precioUnidad)} c/u
                            </span>
                          )}
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

        {/* Botón "Ver catálogo completo" */}
        {hasMoreProducts && (
          <div className="flex justify-center mt-10 mb-4">
            <button
              onClick={() => setShowAllProducts(true)}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Eye className="w-4 h-4" />
              Ver catálogo completo ({filteredProducts.length} productos)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* ─── SECCIÓN DE RESEÑAS Y EXPERIENCIAS DE CLIENTES ─── */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          {/* Header Reseñas */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                Feedback de Clientes
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                Capturas de conversaciones reales en WhatsApp y clientes satisfechos al recibir sus accesorios GUTSY en Paraguay.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> 100% Compras Verificadas
              </span>
            </div>
          </div>

          {/* Grid de Tarjetas de Reseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                id: 1,
                name: 'Camila R.',
                date: '10/10/2026',
                city: 'Asunción',
                rating: 5,
                comment: 'Ya le entregué a mi novio, le encantó, realmente gracias por la paciencia, le quedó súper bien y es muy elegante como dijiste',
                img: '/reviews/1.jpg'
              },
              {
                id: 2,
                name: 'Lucas M.',
                date: '08/10/2026',
                city: 'San Lorenzo',
                rating: 5,
                comment: 'Perdón por no agradecerle... Pero me encantó está muy fachero, Gracias por el buen servicio',
                img: '/reviews/2.jpg'
              },
              {
                id: 3,
                name: 'Mariano G.',
                date: '05/10/2026',
                city: 'Capiatá',
                rating: 5,
                comment: 'Que tal rey me acaba de llegar. Muchas gracias, Super. Me encantó',
                img: '/reviews/3.jpg'
              },
              {
                id: 4,
                name: 'Sofía B.',
                date: '02/10/2026',
                city: 'Ciudad del Este',
                rating: 5,
                comment: 'Muchísimas gracias, demasiado lindo es, me encantó',
                img: '/reviews/4.jpg'
              }
            ].map((rev) => (
              <div
                key={rev.id}
                onClick={() => setActiveReviewModal(rev)}
                className="group relative bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-xl cursor-pointer"
              >
                {/* Captura de WhatsApp */}
                <div className="relative aspect-4/3 bg-zinc-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={rev.img}
                    alt={`Feedback ${rev.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>Ver captura real</span>
                  </div>
                </div>

                {/* Info de la Reseña */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1">
                        {rev.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{rev.date}</span>
                    </div>
                    <div className="flex items-center text-amber-400 my-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 italic line-clamp-3 leading-snug">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400 truncate max-w-[150px]">
                      {rev.productTag}
                    </span>
                    <span className="text-emerald-500 font-semibold">Verificada</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── MODAL LIGHTBOX DE RESEÑA EN ALTA RESOLUCIÓN ─── */}
      <AnimatePresence>
        {activeReviewModal && (
          <motion.div
            key="review-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden p-5 text-white shadow-2xl flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveReviewModal(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-zinc-700 hover:scale-105 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full aspect-auto rounded-2xl overflow-hidden bg-black border border-zinc-800 mb-4 flex items-center justify-center">
                <img
                  src={activeReviewModal.img}
                  alt={`Chat WhatsApp ${activeReviewModal.name}`}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeReviewModal.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Compra Verificada
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">{activeReviewModal.date}</span>
                </div>

                <div className="flex items-center text-amber-400">
                  {[...Array(activeReviewModal.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-zinc-300 italic bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  "{activeReviewModal.comment}"
                </p>

                <div className="text-[11px] text-zinc-500 font-mono pt-1">
                  Producto adquirido: <span className="text-zinc-300 font-semibold">{activeReviewModal.productTag}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DETALLE DE PRODUCTO (Luxury Lookbook View) ────────────────── */}
      <AnimatePresence>
        {activeModalProduct && (
          <motion.div
            key="product-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setActiveModalProduct(null)}
          >
            <motion.div
              key="product-modal-panel"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] my-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Botón Cerrar Flotante */}
              <button
                onClick={() => setActiveModalProduct(null)}
                className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                title="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* ─── COLUMNA IZQUIERDA: GALERÍA & FOTOS CON ZOOM (50% Equilibrado) ────── */}
              <div className="md:w-1/2 bg-zinc-50/80 dark:bg-zinc-900/50 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-center">
                <div className="w-full max-w-md">
                  {/* Contenedor Principal de la Foto */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-inner group">
                    {/* Badges sobre la foto */}
                    {isCustomizableProduct(activeModalProduct) && (
                      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
                          <Sparkles className="w-3 h-3" />
                          <span>Grabado Láser</span>
                        </span>
                      </div>
                    )}

                    {/* Botón Lupa / Pantalla Completa */}
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md hover:scale-110 transition"
                      title="Ver en pantalla completa"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    {/* Foto Activa con Click para Expandir */}
                    <div
                      className="w-full h-full cursor-zoom-in flex items-center justify-center"
                      onClick={() => setIsLightboxOpen(true)}
                    >
                      {modalImages.length > 0 && (modalImages[activeImageIndex] || modalImages[0])?.url ? (
                        <img
                          key={(modalImages[activeImageIndex] || modalImages[0]).url}
                          src={(modalImages[activeImageIndex] || modalImages[0]).url}
                          alt={activeModalProduct.nombre}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          decoding="async"
                        />
                      ) : activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url ? (
                        <img
                          src={activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url}
                          alt={activeModalProduct.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                          <Gem className="w-12 h-12 stroke-[1.5] mb-2" />
                          <span className="text-xs font-bold tracking-widest uppercase">GUTSY</span>
                        </div>
                      )}
                    </div>

                    {/* Flechas de Navegación de Fotos */}
                    {modalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(prev => (prev > 0 ? prev - 1 : modalImages.length - 1));
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition hover:scale-105 shadow-md"
                          aria-label="Foto anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(prev => (prev < modalImages.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition hover:scale-105 shadow-md"
                          aria-label="Foto siguiente"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-mono font-bold backdrop-blur-sm shadow-sm">
                          {activeImageIndex + 1} / {modalImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tira de Miniaturas (Thumbnails) */}
                  {modalImages.length > 1 && (
                    <div className="w-full flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar justify-center">
                      {modalImages.map((img, idx) => {
                        const isActive = activeImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                              isActive
                                ? 'border-black dark:border-white scale-105 shadow-md ring-2 ring-black/10 dark:ring-white/20'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Especificaciones & Destacados */}
                <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0" title={activeModalProduct.materiales?.map(m => m.nombre).join(', ') || 'Acero Quirúrgico'}>
                    <Gem className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {activeModalProduct.materiales?.map(m => m.nombre).join(', ') || 'Acero Quirúrgico'}
                    </span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 shrink-0">•</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Garantía de Calidad</span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 shrink-0">•</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Truck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Envíos a todo el país</span>
                  </div>
                </div>
              </div>

              {/* ─── COLUMNA DERECHA: DETALLES, SELECTORES & ACORDEÓN (50%) ───────── */}
              <div className="md:w-1/2 p-5 sm:p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Categoría, Género & Referencia */}
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                        <Tag className="w-3 h-3 text-zinc-400" />
                        <span>{activeModalProduct.categoria_display || 'Accesorio'}</span>
                      </span>

                      {selectedVariant?.sku && (
                        <span className="font-mono text-zinc-400 text-[9px]">
                          SKU: {selectedVariant.sku}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-serif text-black dark:text-white leading-tight">
                      {activeModalProduct.nombre}
                    </h2>

                    {/* Precios & Estado */}
                    <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                        Gs. {formatGsInput(
                          activeModalProduct.categoria === 'AR'
                            ? (earringOption === 'par'
                                ? getAroPrecios(activeModalProduct).precioPar
                                : getAroPrecios(activeModalProduct).precioUnidad)
                            : (selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0)
                        )}
                      </span>
                      {activeModalProduct.categoria === 'AR' && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 self-center">
                          {earringOption === 'par' ? 'Por Par (2 un.)' : 'Por Unidad (1 un.)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selector de Presentación (Par vs Unidad) para Aros & Aretes */}
                  {activeModalProduct.categoria === 'AR' && (() => {
                    const currentStock = selectedVariant != null ? (selectedVariant.stock ?? 0) : (activeModalProduct.stock_total ?? 0);
                    const canBuyPair = currentStock >= 2;
                    const { precioPar, precioUnidad } = getAroPrecios(activeModalProduct);

                    return (
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider block text-zinc-700 dark:text-zinc-300">
                          Selecciona Presentación:
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            disabled={!canBuyPair}
                            onClick={() => setEarringOption('par')}
                            className={`p-3 rounded-xl border text-left transition relative ${
                              earringOption === 'par' && canBuyPair
                                ? 'border-black dark:border-white bg-white dark:bg-zinc-800 shadow-md ring-2 ring-black dark:ring-white'
                                : canBuyPair
                                  ? 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white/50 dark:bg-zinc-950/50'
                                  : 'border-zinc-200 dark:border-zinc-800 opacity-40 cursor-not-allowed bg-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-black dark:text-white">Par Completo</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                2 un.
                              </span>
                            </div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                              Gs. {formatGsInput(precioPar)}
                            </span>
                            {!canBuyPair && (
                              <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">Stock insuf. para par</span>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={currentStock <= 0}
                            onClick={() => setEarringOption('unidad')}
                            className={`p-3 rounded-xl border text-left transition relative ${
                              earringOption === 'unidad' || !canBuyPair
                                ? 'border-black dark:border-white bg-white dark:bg-zinc-800 shadow-md ring-2 ring-black dark:ring-white'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 bg-white/50 dark:bg-zinc-950/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-black dark:text-white">Individual</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                1 un.
                              </span>
                            </div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                              Gs. {formatGsInput(precioUnidad)}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Selector de Variantes (Colores & Talles) */}
                  {activeModalProduct.variantes && activeModalProduct.variantes.length > 0 && (() => {
                    const talleNum = (v) => {
                      const n = parseFloat((v.talle_medida || '').toString().replace(/[^0-9.]/g, ''));
                      return isNaN(n) ? 9999 : n;
                    };

                    const colorList = [];
                    const seenColors = new Set();
                    activeModalProduct.variantes.forEach(v => {
                      const c = (v.color || '').trim();
                      if (c && !seenColors.has(c.toLowerCase())) {
                        seenColors.add(c.toLowerCase());
                        colorList.push(c);
                      }
                    });

                    const currentColor = (selectedVariant?.color || '').trim() || (colorList.length > 0 ? colorList[0] : '');
                    const filteredVariants = colorList.length > 0
                      ? activeModalProduct.variantes.filter(v => (v.color || '').trim().toLowerCase() === currentColor.toLowerCase())
                      : activeModalProduct.variantes;

                    const disp = filteredVariants.filter(v => (v.stock || 0) > 0).sort((a, b) => talleNum(a) - talleNum(b));
                    const agot = filteredVariants.filter(v => (v.stock || 0) <= 0).sort((a, b) => talleNum(a) - talleNum(b));
                    const currentVariants = [...disp, ...agot];

                    const isNoSizeProduct = activeModalProduct.categoria === 'AR' || activeModalProduct.categoria === 'PQ';
                    const hasSizes = !isNoSizeProduct && currentVariants.some(v => v.talle_medida && v.talle_medida.trim() !== '' && v.talle_medida.toLowerCase() !== 'único');

                    return (
                      <div className="space-y-4">
                        {/* Selector de Color */}
                        {colorList.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                Color: <span className="font-black text-black dark:text-white capitalize">{currentColor || 'Estándar'}</span>
                              </label>
                            </div>
                            <div className="flex items-center gap-3">
                              {colorList.map((colName) => {
                                const isColorActive = currentColor.toLowerCase() === colName.toLowerCase();
                                const swatch = getColorSwatchStyle(colName);
                                const hasStockInColor = activeModalProduct.variantes.some(
                                  v => (v.color || '').trim().toLowerCase() === colName.toLowerCase() && (v.stock || 0) > 0
                                );

                                return (
                                  <button
                                    key={colName}
                                    type="button"
                                    onClick={() => {
                                      const nextVariants = activeModalProduct.variantes.filter(
                                        v => (v.color || '').trim().toLowerCase() === colName.toLowerCase()
                                      );
                                      const currentTalle = selectedVariant?.talle_medida;
                                      let matchVar = nextVariants.find(v => v.talle_medida === currentTalle && (v.stock || 0) > 0);
                                      if (!matchVar) {
                                        matchVar = nextVariants.find(v => (v.stock || 0) > 0) || nextVariants[0];
                                      }
                                      if (matchVar) {
                                        setSelectedVariant(matchVar);
                                        setActiveImageIndex(0);
                                      }
                                    }}
                                    className={`relative w-8 h-8 rounded-full border transition-all flex items-center justify-center ${swatch.borderClass} ${swatch.bgClass} ${
                                      isColorActive
                                        ? 'ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-md'
                                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                                    }`}
                                    title={`${colName}${!hasStockInColor ? ' (Agotado)' : ''}`}
                                  >
                                    {isColorActive && (
                                      <Check className={`w-3.5 h-3.5 stroke-[3] ${swatch.isLight ? 'text-black' : 'text-white'}`} />
                                    )}
                                    {!hasStockInColor && (
                                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-zinc-900" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Selector de Talle con Botón Guía de Talles */}
                        {hasSizes && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                Talle / Medida: {selectedVariant?.talle_medida ? (
                                  <span className="font-extrabold text-black dark:text-white ml-1">
                                    {selectedVariant.talle_medida}
                                  </span>
                                ) : null}
                              </label>

                              {/* Botón Guía de Talles Interactivo */}
                              <button
                                type="button"
                                onClick={() => handleOpenSizeGuide(activeModalProduct.categoria)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline"
                              >
                                <Ruler className="w-3.5 h-3.5 text-amber-500" />
                                <span>Guía de Talles</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {currentVariants.map(v => {
                                const isSelected = selectedVariant?.id === v.id;
                                const hasVarStock = (v.stock || 0) > 0;
                                const displayNum = (v.talle_medida || '').replace(/^talle\s*/i, '').trim() || 'Único';

                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    disabled={!hasVarStock}
                                    onClick={() => setSelectedVariant(v)}
                                    title={!hasVarStock ? 'Agotado' : `Talle ${displayNum} (Stock: ${v.stock} un.)`}
                                    className={`min-w-[42px] h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                                      isSelected
                                        ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-md scale-105'
                                        : hasVarStock
                                          ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-black dark:hover:border-white'
                                          : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 opacity-40 cursor-not-allowed line-through'
                                    }`}
                                  >
                                    {displayNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Personalización / Grabado Láser con Previsualizador Multi-Cara */}
                  {isCustomizableProduct(activeModalProduct) && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Personalización Láser Gratis</span>
                        </label>
                        <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                          {activeEngravingFace === 'face1' ? engravingFace1.length : engravingFace2.length}/15 chars (Max 15 por cara)
                        </span>
                      </div>

                      {/* Selector de Caras (Frente / Dorso) */}
                      <div className="grid grid-cols-2 gap-2 bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveEngravingFace('face1')}
                          className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            activeEngravingFace === 'face1'
                              ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-xs'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          <span>Cara 1 (Frente)</span>
                          {engravingFace1.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEngravingFace('face2')}
                          className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            activeEngravingFace === 'face2'
                              ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-xs'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          <span>Cara 2 (Dorso)</span>
                          {engravingFace2.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </button>
                      </div>

                      {/* Selector de Estilo de Tipografía */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-medium block">Estilo de grabado:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'cursiva', label: 'Cursiva' },
                            { id: 'clasica', label: 'Clásica' },
                            { id: 'romana', label: 'Romanos' }
                          ].map(font => (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => setEngravingFont(font.id)}
                              className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                                engravingFont === font.id
                                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs ring-1 ring-black dark:ring-white'
                                  : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                              }`}
                            >
                              {font.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 🌟 PREVISUALIZADOR GRÁFICO EN VIVO EN MEDALLA / PLACA */}
                      <div className="relative p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-0.5">
                          Simulación — {activeEngravingFace === 'face1' ? 'Cara 1 (Frente)' : 'Cara 2 (Dorso)'}
                        </span>
                        <div
                          className={`text-sm sm:text-base text-zinc-900 dark:text-zinc-100 transition-all select-none truncate max-w-full px-2 py-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${
                            engravingFont === 'cursiva'
                              ? 'font-serif italic font-medium tracking-wide'
                              : engravingFont === 'clasica'
                                ? 'font-sans font-black tracking-widest uppercase'
                                : 'font-serif font-bold tracking-widest uppercase'
                          }`}
                        >
                          {(activeEngravingFace === 'face1' ? engravingFace1 : engravingFace2).trim() || 'Escribe tu grabado'}
                        </div>
                      </div>

                      {/* Campo de Texto para la Cara Seleccionada */}
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          maxLength={15}
                          value={activeEngravingFace === 'face1' ? engravingFace1 : engravingFace2}
                          onChange={e => {
                            if (activeEngravingFace === 'face1') setEngravingFace1(e.target.value);
                            else setEngravingFace2(e.target.value);
                          }}
                          placeholder={activeEngravingFace === 'face1' ? "Ej: Lucas, Inicial A, Fecha..." : "Ej: 15.08.2024, Coordenadas..."}
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-black dark:focus:border-white transition text-black dark:text-white placeholder:text-zinc-400"
                        />
                      </div>

                      {/* Ejemplos de Inserción Rápida */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-zinc-400 font-medium">Sugerencias:</span>
                        {[
                          '15.08.2024',
                          'Lucas ♡',
                          'A ♾️ B',
                          '25°45\'S 56°W'
                        ].map(example => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => {
                              if (activeEngravingFace === 'face1') setEngravingFace1(example.slice(0, 15));
                              else setEngravingFace2(example.slice(0, 15));
                            }}
                            className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
                          >
                            +{example}
                          </button>
                        ))}
                      </div>

                      {/* Resumen del Grabado Completo */}
                      {customEngravingText && (
                        <div className="text-[11px] p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-semibold shrink-0">Resumen final:</span>
                          <span className="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 break-words">{customEngravingText}</span>
                        </div>
                      )}

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        💡 Max 15 caracteres por cara para garantizar máxima claridad física en el grabado láser. Para dijes de 4 caras o fotos/dibujos personalizados, coordina en WhatsApp al finalizar.
                      </p>
                    </div>
                  )}

                  {/* Selector de Cantidad y Botón Comprar */}
                  {(() => {
                    const currentStock = selectedVariant != null
                      ? (selectedVariant.stock ?? 0)
                      : (activeModalProduct.stock_total ?? 0);

                    const isEarring = activeModalProduct.categoria === 'AR';
                    const maxAllowedQty = isEarring
                      ? (earringOption === 'par' ? Math.floor(currentStock / 2) : currentStock)
                      : currentStock;

                    const isAvailable = activeModalProduct.activo !== false && (
                      isEarring ? (earringOption === 'par' ? currentStock >= 2 : currentStock >= 1) : currentStock > 0
                    );

                    const currentUnitEffectivePrice = isEarring
                      ? (earringOption === 'par' ? getAroPrecios(activeModalProduct).precioPar : getAroPrecios(activeModalProduct).precioUnidad)
                      : (selectedVariant?.precio_venta_pyg || activeModalProduct.precio_venta || 0);

                    return (
                      <div className="space-y-3 pt-2">
                        {/* Selector de Cantidad */}
                        {isAvailable && (
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                              Cantidad {isEarring && (earringOption === 'par' ? '(Pares)' : '(Unidades)')}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold hover:scale-105 transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-black w-6 text-center">{modalQuantity}</span>
                              <button
                                onClick={() => {
                                  if (modalQuantity < maxAllowedQty) {
                                    setModalQuantity(modalQuantity + 1);
                                  } else {
                                    alert(`Solo hay disponible para ${maxAllowedQty} ${isEarring && earringOption === 'par' ? 'par(es)' : 'unidad(es)'}.`);
                                  }
                                }}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold hover:scale-105 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Botón Principal de Compra */}
                        <button
                          onClick={() => {
                            if (!isAvailable) return;
                            
                            const finalCustom = customEngravingText.trim()
                              ? `[GRABADO ${engravingFont.toUpperCase()}]: ${customEngravingText.trim()}`
                              : '';

                            handleAddToCart(
                              activeModalProduct,
                              selectedVariant,
                              modalQuantity,
                              finalCustom,
                              isEarring ? earringOption : null
                            );
                          }}
                          disabled={!isAvailable}
                          className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                            isAvailable
                              ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-[1.01] active:scale-98 cursor-pointer'
                              : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-75'
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>
                                AGREGAR AL PEDIDO • Gs. {formatGsInput(currentUnitEffectivePrice * modalQuantity)}
                              </span>
                            </>
                          ) : (
                            <span>Producto Agotado</span>
                          )}
                        </button>
                      </div>
                    );
                  })()}

                  {/* ─── DESPLEGABLES & SECCIONES ADICIONALES ────────────── */}
                  <div className="mt-6 space-y-4">
                    
                    {/* Desplegable Opcional "¿Es para regalo?" */}
                    <div className="border-t border-b border-zinc-200 dark:border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => setOpenAccordion(openAccordion === 'gift' ? null : 'gift')}
                        className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                      >
                        <span className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>¿Es para regalo?</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-normal text-zinc-400">
                            Personaliza tu regalo
                          </span>
                          {openAccordion === 'gift' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {openAccordion === 'gift' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pb-3.5 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400"
                          >
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              Selecciona cómo te gustaría presentar tu joya para sorprender a esa persona especial:
                            </p>

                            <div className="space-y-2 pt-1">
                              {/* Opción 1: Empaque Estándar */}
                              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                      Empaque Estándar de Regalo
                                    </h5>
                                    <span className="text-[11px] font-medium text-emerald-500 block mt-0.5">
                                      Gratis 
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddToCart(
                                      {
                                        id: 'pkg-standard-gift',
                                        nombre: 'Empaque Estándar de Regalo',
                                        precio_venta: 0
                                      },
                                      null,
                                      1,
                                      '🎁 [EMPAQUE DE REGALO ESTÁNDAR]',
                                      null,
                                      false
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-black dark:hover:bg-white transition shrink-0"
                                  title="Agregar empaque de regalo gratis"
                                >
                                  + Agregar
                                </button>
                              </div>

                              {/* Opción 2: Cajita Especial de Regalo */}
                              {(() => {
                                if (!matchedDbPackaging) return null;

                                const gCode = (activeModalProduct.genero || '').toUpperCase();
                                const gDisp = (activeModalProduct.genero_display || '').toLowerCase();
                                const isDama = gCode === 'MUJ' || gDisp.includes('dama') || gDisp.includes('mujer');

                                const dbBoxTitle = matchedDbPackaging.nombre || 'Cajita Especial de Regalo';
                                const isHeartBox = (dbBoxTitle || '').toLowerCase().includes('coraz');

                                if (isHeartBox && !isDama) return null;

                                const dbBoxImg = matchedDbPackaging.imagen_url_completa || matchedDbPackaging.imagen_url || matchedDbPackaging.variantes?.[0]?.imagen_url;
                                const dbBoxPrice = matchedDbPackaging.precio_venta || 30000;
                                const targetBoxProduct = matchedDbPackaging;

                                return (
                                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {dbBoxImg ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage({ url: dbBoxImg, title: dbBoxTitle });
                                          }}
                                          className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900 group/box cursor-zoom-in focus:outline-none"
                                          title="Ver foto en tamaño completo"
                                        >
                                          <img src={dbBoxImg} alt={dbBoxTitle} className="w-full h-full object-cover group-hover/box:scale-110 transition duration-300" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/box:opacity-100 flex items-center justify-center transition backdrop-blur-[1px]">
                                            <ZoomIn className="w-4 h-4 text-white" />
                                          </div>
                                        </button>
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                                          <Gift className="w-4 h-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                          {dbBoxTitle}
                                        </h5>
                                        <span className="text-[11px] font-medium text-zinc-400 block mt-0.5">
                                          Gs. {formatGsInput(dbBoxPrice)}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleAddToCart(targetBoxProduct, targetBoxProduct.variantes?.[0] || null, 1, '', null, false)}
                                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-black dark:hover:bg-white transition shrink-0"
                                      title="Agregar cajita especial de regalo"
                                    >
                                      + Agregar
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ─── MÓDULO "COMPLETA TU LOOK" (Carrusel de Sugerencias) ────── */}
                    {crossSellProducts.length > 0 && (
                      <div className="py-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Combiná con</span>
                          </span>
                          
                          {/* Controles del Carrusel */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (crossSellScrollRef.current) {
                                  crossSellScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                                }
                              }}
                              className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition"
                              title="Anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (crossSellScrollRef.current) {
                                  crossSellScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                                }
                              }}
                              className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition"
                              title="Siguiente"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Carrusel Desplazable Horizontal */}
                        <div
                          ref={crossSellScrollRef}
                          className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 pt-0.5 scroll-smooth"
                        >
                          {crossSellProducts.map(item => {
                            const itemImg = item.imagen_url_completa || item.imagen_url || (item.variantes?.[0]?.imagen_url);
                            return (
                              <div
                                key={item.id}
                                className="w-[160px] sm:w-[180px] shrink-0 snap-start p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 transition group"
                              >
                                <div>
                                  {/* Imagen del producto */}
                                  <div
                                    className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer mb-2 relative"
                                    onClick={() => handleOpenProductModal(item)}
                                  >
                                    {itemImg ? (
                                      <img src={itemImg} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                        <Gem className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  {/* Nombre del producto */}
                                  <h5
                                    onClick={() => handleOpenProductModal(item)}
                                    className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline"
                                    title={item.nombre}
                                  >
                                    {item.nombre}
                                  </h5>
                                </div>

                                {/* Precio y Botón Agregar */}
                                <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                                    Gs. {formatGsInput(item.precio_venta || 0)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(item, item.variantes?.[0] || null, 1, '', null, false)}
                                    className="px-2 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium hover:scale-105 transition shrink-0"
                                    title="Agregar al pedido"
                                  >
                                    + Agregar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ─── ACORDEONES MINIMALISTAS ──────────────────────── */}
                    <div className="border-t border-b border-zinc-200 dark:border-zinc-800/80 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                      {/* Item 2: Cuidados de la Joya */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                          className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span>Cuidados & Durabilidad</span>
                          </span>
                          {openAccordion === 'care' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </button>

                        <AnimatePresence>
                          {openAccordion === 'care' && (() => {
                            const matNames = (activeModalProduct.materiales || []).map(m => (m.nombre || '').toLowerCase());
                            const isAcero = matNames.some(m => m.includes('acero'));
                            const isPlata = matNames.some(m => m.includes('plata'));

                            return (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pb-3.5 px-1 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed"
                              >
                                {isAcero ? (
                                  <>
                                    <p>
                                      • <strong>Resistencia al agua:</strong> Las piezas de Acero Quirúrgico son altamente resistentes al agua y sudor. No manchan la piel ni se oscurecen.
                                    </p>
                                    <p>
                                      • <strong>Mantenimiento:</strong> Limpia periódicamente tu joya con un paño de microfibra seco para mantener su acabado brillante original.
                                    </p>
                                  </>
                                ) : isPlata ? (
                                  <>
                                    <p>
                                      • <strong>Cuidado de la Plata 925:</strong> Guardar en un lugar seco y proteger de la humedad constante para evitar deslustre.
                                    </p>
                                    <p>
                                      • <strong>Restauración de brillo:</strong> Si la plata se opaca naturalmente con el tiempo, frotar suavemente con un paño limpio especial para joyas de plata.
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p>
                                      • <strong>Cuidado del acabado:</strong> Evitar contacto directo con agua, humedad constante, sudor excesivo o químicos para prolongar el brillo y durabilidad del acabado.
                                    </p>
                                    <p>
                                      • <strong>Almacenamiento:</strong> Guardar por separado en su estuche o bolsa protectora en un ambiente seco.
                                    </p>
                                  </>
                                )}
                                <p>
                                  • <strong>Perfumes y lociones:</strong> Aplica lociones, cosméticos o perfumes antes de colocarte los accesorios para proteger el acabado.
                                </p>
                              </motion.div>
                            );
                          })()}
                        </AnimatePresence>
                      </div>

                      {/* Item 3: Logística de Envíos & Medios de Pago */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                          className="w-full py-3 px-1 flex items-center justify-between text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white transition"
                        >
                          <span className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span>Envíos & Medios de Pago</span>
                          </span>
                          {openAccordion === 'shipping' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </button>

                        <AnimatePresence>
                          {openAccordion === 'shipping' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pb-3.5 px-1 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed"
                            >
                              <p>
                                • <strong>Villarrica:</strong> Delivery local a domicilio (Gs. 15.000) o retiro acordado.
                              </p>
                              <p>
                                • <strong>Envíos Nacionales:</strong> A todo el Paraguay vía encomienda / transportadora.
                              </p>
                              <p>
                                • <strong>Medios de Pago:</strong> Transferencias SIPAP, pagos QR (débito/crédito) o efectivo al recibir (solo Villarrica).
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
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
                <GutsyLogo className="w-7 h-7 shrink-0" />
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
                    Explora nuestros accesorios y añade tus favoritas para armar tu pedido.
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
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      1. Ubicación y Tipo de Envío
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShippingType('villarrica')}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          shippingType === 'villarrica'
                            ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${shippingType === 'villarrica' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>Delivery Villarrica y alrededores</span>
                              {shippingType === 'villarrica' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Entrega local en puerta</div>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-emerald-400 whitespace-nowrap">+ Gs. 15.000</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShippingType('interior');
                          if (paymentMethod === 'contraentrega') setPaymentMethod('contimovil');
                        }}
                        className={`p-3.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          shippingType === 'interior'
                            ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${shippingType === 'interior' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>Envíos Nacionales</span>
                              {shippingType === 'interior' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Vía Transportadora (prom. Gs. 35.000)</div>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-zinc-300 whitespace-nowrap">Flete en destino</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── PASO 2: Datos de Envío / Contacto ────────────────── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {shippingType === 'villarrica' ? '2. Datos de Contacto:' : '2. Datos para la Entrega y Rótulo:'}
                    </span>
                    <div className="space-y-2.5 text-xs">
                      {/* Nombre y Apellido separados en 2 campos */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            autoComplete="given-name"
                            value={customerFirstName}
                            onChange={e => setCustomerFirstName(e.target.value)}
                            placeholder="Nombre *"
                            className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            autoComplete="family-name"
                            value={customerLastName}
                            onChange={e => setCustomerLastName(e.target.value)}
                            placeholder="Apellido *"
                            className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                          />
                        </div>
                      </div>

                      {shippingType === 'villarrica' ? (
                        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Coordinación de Entrega en Villarrica</span>
                          </div>
                          <p className="leading-relaxed text-zinc-400">
                            Al confirmar tu pedido por WhatsApp, te pediremos tu ubicación o referencias exactas para coordinar la entrega a domicilio.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={customerDoc}
                              onChange={e => setCustomerDoc(e.target.value)}
                              placeholder="Nro. Cédula (C.I.) *"
                              className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                            />
                            <input
                              type="text"
                              autoComplete="tel"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              placeholder="Celular / WhatsApp *"
                              className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              autoComplete="address-level2"
                              value={customerCity}
                              onChange={e => setCustomerCity(e.target.value)}
                              placeholder="Ciudad *"
                              className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                            />
                            <input
                              type="text"
                              autoComplete="address-level1"
                              value={customerDept}
                              onChange={e => setCustomerDept(e.target.value)}
                              placeholder="Departamento *"
                              className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition"
                            />
                          </div>

                          <textarea
                            rows={2}
                            autoComplete="street-address"
                            value={customerAddress}
                            onChange={e => setCustomerAddress(e.target.value)}
                            placeholder="Dirección exacta o Sucursal de Transportadora (ej: AEX Central, NSA Sucursal) *"
                            className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 resize-none transition"
                          />
                        </>
                      )}
                    </div>
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
                            ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'contimovil' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>Link de Pago (Tarjetas DÉBITO O CRÉDITO)</span>
                              {paymentMethod === 'contimovil' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
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
                            ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'transferencia' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>Transferencia Bancaria</span>
                              {paymentMethod === 'transferencia' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Transferencia directa a bancos habilitados
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* CAJA DESPLEGABLE CON SELECTOR DE 3 BANCOS & COPIA DE ALIAS */}
                      {paymentMethod === 'transferencia' && (
                        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-xs animate-in fade-in">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
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
                                        ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                                    }`}
                                  >
                                    {bank.shortName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-white text-[10px] font-bold tracking-wider uppercase border border-zinc-700">
                                  Tipo: {selectedBank.tipoAlias}
                                </span>
                              </div>
                              <div className="text-base sm:text-lg font-black text-white font-mono tracking-tight select-all">
                                {selectedBank.alias}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAliasOnly(selectedBank.alias)}
                              className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition flex-shrink-0"
                              title="Copiar solo el alias"
                            >
                              {copiedAlias ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedAlias ? '¡Alias Copiado!' : 'Copiar Alias'}</span>
                            </button>
                          </div>

                          <div className="text-[11px] space-y-0.5 text-zinc-300 font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                            <div><strong>Banco:</strong> {selectedBank.name}</div>
                            <div><strong>Titular:</strong> {selectedBank.titular}</div>
                            <div><strong>C.I. / RUC:</strong> {selectedBank.documento}</div>
                            <div><strong>Nro. Cuenta:</strong> {selectedBank.cuenta}</div>
                            <div><strong>Tipo:</strong> {selectedBank.tipoCuenta}</div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-400 italic">
                              * Adjunta tu comprobante por WhatsApp.
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBankDetails(selectedBank)}
                              className="text-[10px] font-medium text-zinc-400 hover:text-white underline flex items-center gap-1"
                            >
                              {copiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                            ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'qr' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>Pago con QR</span>
                              {paymentMethod === 'qr' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
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
                              ? 'border-zinc-300 dark:border-zinc-200 bg-zinc-900 text-white font-medium shadow-sm ring-1 ring-zinc-300/30'
                              : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'contraentrega' ? 'bg-zinc-800 text-white' : 'bg-zinc-800/40 text-zinc-400'}`}>
                              <Banknote className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>Pago Contra Entrega (Villarrica)</span>
                                {paymentMethod === 'contraentrega' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-0.5">
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
              <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Subtotal Productos</span>
                    <span>Gs. {formatGsInput(cartSubtotal)}</span>
                  </div>
                  {deliveryCost > 0 && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Delivery en Villarrica</span>
                      <span>Gs. {formatGsInput(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm sm:text-base font-bold text-white pt-2 border-t border-zinc-800">
                    <span>Total a Pagar</span>
                    <span className="text-base sm:text-lg text-white">Gs. {formatGsInput(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOrderWhatsApp}
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg hover:bg-zinc-100 active:scale-98 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
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
                      { id: 'M', label: 'Caballero' },
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

      {/* ─── MODAL GUÍA DE TALLES INTERACTIVA ────────────────────────────── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        initialTab={sizeGuideInitialTab}
      />

      {/* ─── LIGHTBOX ZOOM PANTALLA COMPLETA ─────────────────────────────── */}
      <ProductLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={modalImages}
        activeIndex={activeImageIndex}
        onSelectIndex={(idx) => setActiveImageIndex(idx)}
        title={activeModalProduct?.nombre || ''}
      />

      {/* ─── LIGHTBOX ZOOM VISTA PREVIA PACKAGING ────────────────────────── */}
      {previewImage && (
        <ProductLightbox
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          images={[{ url: previewImage.url, label: previewImage.title }]}
          activeIndex={0}
          onSelectIndex={() => {}}
          title={previewImage.title || 'Vista Previa'}
        />
      )}

      {/* ─── FOOTER MINIMALISTA & HUMANIZADO ───────────────────────────────── */}
      <footer className="bg-zinc-950 text-white border-t border-zinc-900 pt-14 pb-10 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid (2 columnas en móvil, 4 en desktop) */}
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
    </div>
  );
}
