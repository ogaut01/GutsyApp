import React, { useState, useMemo, useEffect } from 'react';
import { fetchMateriales, createPedidoWeb } from '../services/api';
import { formatGsInput } from '../currency';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductLightbox from '../components/ProductLightbox';

// Constantes y Configuración
import {
  BANK_ACCOUNTS,
  ALL_STORE_CATEGORIES,
  STORE_WHATSAPP
} from '../constants/storefrontConstants';

// Helpers y Utilidades
import {
  isCoupleProduct,
  formatGenero,
  getMatchingColorVariant,
  getAroPrecios,
  normalizeImageUrl,
  copyToClipboard
} from '../utils/storefrontHelpers';

// Manejo de Rutas y URLs Compartibles (/collares, /pulseras, /producto/:id)
import {
  parseStorefrontUrl,
  updateCategoryUrl,
  updateProductUrl
} from '../utils/storefrontRoutes';

// Componentes Modulares del Storefront
import StorefrontNavbar from '../components/storefront/StorefrontNavbar';
import StorefrontHero from '../components/storefront/StorefrontHero';
import StorefrontFilters from '../components/storefront/StorefrontFilters';
import MobileFiltersModal from '../components/storefront/MobileFiltersModal';
import ProductGrid from '../components/storefront/ProductGrid';
import ProductDetailModal from '../components/storefront/ProductDetailModal';
import CartDrawer from '../components/storefront/CartDrawer';
import OrderSuccessModal from '../components/storefront/OrderSuccessModal';
import CustomerReviewsSection from '../components/storefront/CustomerReviewsSection';
import StorefrontFooter from '../components/storefront/StorefrontFooter';

// Exportar cuentas bancarias por compatibilidad
export { BANK_ACCOUNTS };

export default function StorefrontView({
  productos = [],
  onOpenAdminLogin,
  user,
  onGoToAdmin,
  theme,
  onToggleTheme,
  isLoading = false
}) {
  // ─── Enrutamiento y Categoría Inicial desde la URL ────────────────────────
  const initialRoute = useMemo(() => parseStorefrontUrl(), []);
  const [selectedCategory, setSelectedCategory] = useState(initialRoute.category || 'ALL');
  const [pendingProductId, setPendingProductId] = useState(initialRoute.productId);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [dbMaterials, setDbMaterials] = useState([]);

  // Carrito de Compras Público
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
  const [earringOption, setEarringOption] = useState('par');
  const [customEngravingText, setCustomEngravingText] = useState('');
  const [engravingFace1, setEngravingFace1] = useState('');
  const [engravingFace2, setEngravingFace2] = useState('');
  const [activeEngravingFace, setActiveEngravingFace] = useState('face1');
  const [engravingFont, setEngravingFont] = useState('cursiva');
  const [openAccordion, setOpenAccordion] = useState(null);

  // Guía de Talles y Lightbox
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideInitialTab, setSizeGuideInitialTab] = useState('anillos');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Formulario de Envío y Checkout
  const [shippingType, setShippingType] = useState('villarrica');
  const [paymentMethod, setPaymentMethod] = useState('contimovil');
  const [selectedBankId, setSelectedBankId] = useState('continental');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerDept, setCustomerDept] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  const selectedBank = useMemo(() => {
    return BANK_ACCOUNTS.find(b => b.id === selectedBankId) || BANK_ACCOUNTS[0];
  }, [selectedBankId]);

  // Sincronizar grabado de múltiples caras en customEngravingText
  useEffect(() => {
    const parts = [];
    if (engravingFace1.trim()) parts.push(`Cara 1: ${engravingFace1.trim()}`);
    if (engravingFace2.trim()) parts.push(`Cara 2: ${engravingFace2.trim()}`);
    setCustomEngravingText(parts.join(' · '));
  }, [engravingFace1, engravingFace2]);

  // Carga de materiales de la BD
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

  // Categorías activas
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

  // ─── Sincronización de URL y Popstate del Navegador ────────────────────────
  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    updateCategoryUrl(categoryId);
  };

  const handleOpenProductModal = (product, targetVariant = null, fromHistory = false) => {
    setActiveModalProduct(product);
    setActiveImageIndex(0);
    setModalQuantity(1);
    setCustomEngravingText('');
    setEngravingFace1('');
    setEngravingFace2('');
    setActiveEngravingFace('face1');

    let chosenVar = null;
    if (product.variantes && product.variantes.length > 0) {
      if (targetVariant) {
        chosenVar = targetVariant;
      } else {
        const colorMatchVar = getMatchingColorVariant(product, selectedColor);
        if (colorMatchVar) {
          chosenVar = colorMatchVar;
        } else {
          const mainImg = (product.imagen_url_completa || product.imagen_url || '').trim();
          const coverMatchVar = mainImg
            ? product.variantes.find(v => v.activo !== false && v.imagen_url && (v.imagen_url === mainImg || mainImg.endsWith(v.imagen_url) || mainImg.includes(v.imagen_url)))
            : null;

          if (coverMatchVar) {
            chosenVar = coverMatchVar;
          } else {
            const firstWithStock = product.variantes.find(v => v.activo !== false && (v.stock || 0) > 0) || product.variantes[0];
            chosenVar = firstWithStock;
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

    if (!fromHistory) {
      updateProductUrl(product.id, product.nombre);
    }
    document.title = `${product.nombre} | GUTSY Joyas`;
  };

  const handleCloseProductModal = () => {
    setActiveModalProduct(null);
    updateCategoryUrl(selectedCategory);
    document.title = 'GUTSY | Joyas & Accesorios';
  };

  // Abrir producto directo si venía en la URL inicial (/producto/:id)
  useEffect(() => {
    if (pendingProductId && productos.length > 0 && !activeModalProduct) {
      const target = productos.find(p => p.id === pendingProductId);
      if (target) {
        handleOpenProductModal(target, null, true);
      }
      setPendingProductId(null);
    }
  }, [pendingProductId, productos]);

  // Manejar navegación con botones Atrás/Adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      const { category, productId } = parseStorefrontUrl();
      setSelectedCategory(category);
      if (productId) {
        const found = productos.find(p => p.id === productId);
        if (found) {
          handleOpenProductModal(found, null, true);
        }
      } else {
        setActiveModalProduct(null);
        document.title = 'GUTSY | Joyas & Accesorios';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [productos]);

  // ─── Filtrado y Ordenamiento de Productos ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    return productos.filter(product => {
      if (selectedCategory !== 'PQ' && product.categoria === 'PQ') {
        return false;
      }

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        product.nombre?.toLowerCase().includes(term) ||
        product.categoria_display?.toLowerCase().includes(term) ||
        product.materiales?.some(m => m.nombre?.toLowerCase().includes(term)) ||
        product.variantes?.some(v => v.color?.toLowerCase().includes(term) || v.sku?.toLowerCase().includes(term));

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

      const matchGender = selectedGender === 'ALL' || product.genero === selectedGender;

      let matchMaterial = true;
      if (selectedMaterial !== 'ALL') {
        if (!product.materiales || product.materiales.length === 0) {
          matchMaterial = false;
        } else {
          const targetId = Number(selectedMaterial);
          matchMaterial = product.materiales.some(m => m.id === targetId);
        }
      }

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
      const aInStock = (a.activo !== false && (a.stock_total || 0) > 0) ? 1 : 0;
      const bInStock = (b.activo !== false && (b.stock_total || 0) > 0) ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;

      if (sortBy === 'price-asc') return (a.precio_venta || 0) - (b.precio_venta || 0);
      if (sortBy === 'price-desc') return (b.precio_venta || 0) - (a.precio_venta || 0);
      if (sortBy === 'name') return (a.nombre || '').localeCompare(b.nombre || '');
      
      const aHasImg = (a.imagen_url_completa || a.imagen_url) ? 1 : 0;
      const bHasImg = (b.imagen_url_completa || b.imagen_url) ? 1 : 0;
      if (aHasImg !== bHasImg) return bHasImg - aHasImg;
      return (b.stock_total || 0) - (a.stock_total || 0);
    });
  }, [productos, searchTerm, selectedCategory, selectedGender, selectedMaterial, selectedColor, sortBy]);

  const INITIAL_PRODUCT_LIMIT = 8;
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

  // Totales del carrito
  const totalCartItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0), [cart]);
  const deliveryCost = useMemo(() => (shippingType === 'villarrica' ? 15000 : 0), [shippingType]);
  const cartTotal = cartSubtotal + deliveryCost;

  // ─── Galería Dinámica de Fotos para el Modal ──────────────────────────────
  const modalImages = useMemo(() => {
    if (!activeModalProduct) return [];
    const list = [];
    const addedUrls = new Set();

    const addImg = (url, label, variantId = null) => {
      if (!url) return;
      const norm = normalizeImageUrl(url);
      if (norm && !addedUrls.has(norm)) {
        addedUrls.add(norm);
        list.push({ url, label, variantId });
      }
    };

    const activeColor = (selectedVariant?.color || '').trim().toLowerCase();

    if (activeModalProduct.variantes && activeModalProduct.variantes.length > 0) {
      if (activeColor) {
        const colorVariants = activeModalProduct.variantes.filter(
          v => (v.color || '').trim().toLowerCase() === activeColor
        );
        const varWithImg = colorVariants.find(v => v.imagen_url);
        if (varWithImg && varWithImg.imagen_url) {
          addImg(varWithImg.imagen_url, varWithImg.color || 'Color', varWithImg.id);
        }
      } else {
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

    if (activeModalProduct.imagenes_galeria && activeModalProduct.imagenes_galeria.length > 0) {
      activeModalProduct.imagenes_galeria.forEach((g) => {
        const gUrl = g.url || g.imagen_url;
        const gColor = (g.color || '').trim().toLowerCase();
        const matchesColor = !activeColor || !gColor || gColor === 'general' || gColor === 'todos' || gColor === activeColor;
        if (gUrl && matchesColor) {
          addImg(gUrl, g.color ? `${g.color}` : 'Galería');
        }
      });
    }

    const mainImg = activeModalProduct.imagen_url_completa || activeModalProduct.imagen_url;
    if (list.length === 0 && mainImg) {
      addImg(mainImg, 'Principal');
    }

    return list;
  }, [activeModalProduct, selectedVariant?.color]);

  // ─── Cross-Selling "Completa tu Look" ─────────────────────────────────────
  const crossSellProducts = useMemo(() => {
    if (!activeModalProduct || !productos || productos.length === 0) return [];
    const cat = activeModalProduct.categoria;
    const currentGender = formatGenero(activeModalProduct.genero_display || activeModalProduct.genero);

    let targetCats = [];
    if (cat === 'AN') targetCats = ['PU', 'CA', 'CO', 'DI', 'AR'];
    else if (cat === 'CA' || cat === 'CO') targetCats = ['PU', 'AN', 'DI', 'AR'];
    else if (cat === 'DI') targetCats = ['CA', 'CO', 'PU', 'AN'];
    else if (cat === 'PU' || cat === 'TO') targetCats = ['AN', 'CA', 'CO', 'DI', 'AR'];
    else if (cat === 'AR') targetCats = ['CO', 'CA', 'PU', 'AN'];
    else targetCats = ['PU', 'CA', 'CO', 'AN', 'AR'];

    const inStock = productos.filter(
      p => p.id !== activeModalProduct.id && p.activo !== false && (p.stock_total || 0) > 0 && p.categoria !== 'PQ'
    );

    const sameGender = inStock.filter(p => {
      if (!currentGender || currentGender === 'Unisex') return true;
      const pG = formatGenero(p.genero_display || p.genero);
      return pG === currentGender || pG === 'Unisex';
    });

    const pool = sameGender.length >= 2 ? sameGender : inStock;
    return pool.filter(p => targetCats.includes(p.categoria)).slice(0, 8);
  }, [activeModalProduct, productos]);

  // Packaging especial desde la BD
  const matchedDbPackaging = useMemo(() => {
    if (!activeModalProduct || !productos || productos.length === 0) return null;
    const pqProducts = productos.filter(p => p.categoria === 'PQ' && p.activo !== false);
    if (pqProducts.length === 0) return null;

    const cat = activeModalProduct.categoria;
    const catName = (activeModalProduct.categoria_display || '').toLowerCase();
    const gCode = (activeModalProduct.genero || '').toUpperCase();
    const gDisp = (activeModalProduct.genero_display || '').toLowerCase();
    const isDama = gCode === 'MUJ' || gDisp.includes('dama') || gDisp.includes('mujer');

    if (
      cat === 'AR' || cat === 'PU' || cat === 'TO' || cat === 'LE' || cat === 'GA' || cat === 'AC' ||
      catName.includes('lente') || catName.includes('gafa') || catName.includes('aro') || catName.includes('pulsera')
    ) {
      return null;
    }

    if (cat === 'AN' || catName.includes('anillo')) {
      if (isDama) {
        return pqProducts.find(p => (p.nombre || '').toLowerCase().includes('coraz')) ||
               pqProducts.find(p => (p.nombre || '').toLowerCase().includes('anillo')) || null;
      } else {
        return pqProducts.find(p => {
          const n = (p.nombre || '').toLowerCase();
          return !n.includes('coraz') && n.includes('anillo');
        }) || null;
      }
    }

    if (cat === 'CO' || cat === 'CA' || cat === 'DI' || catName.includes('collar') || catName.includes('cadena') || catName.includes('dije')) {
      return pqProducts.find(p => {
        const n = (p.nombre || '').toLowerCase();
        return n.includes('collar') || n.includes('cadena') || n.includes('dije');
      }) || null;
    }

    return null;
  }, [activeModalProduct, productos]);

  // ─── Funciones del Carrito ────────────────────────────────────────────────
  const handleAddToCart = (product, variant, qty = 1, customText = '', presentation = null, closeModal = true) => {
    const isStandardGiftPkg = product.id === 'pkg-standard-gift';
    const isEarring = product.categoria === 'AR';
    const chosenPres = isEarring ? (presentation || earringOption) : null;
    const { precioPar, precioUnidad } = isEarring ? getAroPrecios(product) : { precioPar: 0, precioUnidad: 0 };
    const stockUnitsPerQty = isEarring && chosenPres === 'par' ? 2 : 1;
    const totalRequiredStock = qty * stockUnitsPerQty;

    if (!isStandardGiftPkg) {
      const availableStock = variant ? (variant.stock || 0) : (product.stock_total || 0);
      if (product.activo === false || availableStock < totalRequiredStock) {
        alert(`No hay suficiente stock disponible. (Disponibles: ${availableStock} un.)`);
        return;
      }
    }

    const basePrice = isEarring
      ? (chosenPres === 'par' ? precioPar : precioUnidad)
      : (variant?.precio_venta_pyg || product.precio_venta || 0);

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
          price: basePrice,
          image: itemImage,
          presentation: presentationLabel,
          stockUnitsPerItem: stockUnitsPerQty,
          maxStock: isStandardGiftPkg ? 1 : (variant ? variant.stock : product.stock_total || 99),
          quantity: qty,
          customText: customText.trim() || null,
        }
      ];
    });

    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 600);
    if (closeModal) {
      handleCloseProductModal();
    }
  };

  const updateCartItemQuantity = (key, delta) => {
    setCart(prev => prev.map(item => {
      if (item.key === key) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (item.maxStock && newQty > item.maxStock) {
          alert(`Solo disponemos de ${item.maxStock} unidades en stock.`);
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

  const copyAliasOnly = async (alias) => {
    await copyToClipboard(alias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2200);
  };

  const copyBankDetails = async (bank) => {
    const text = `🏦 *DATOS BANCARIOS PARA TRANSFERENCIA - GUTSY*
• Banco: ${bank.name}
• Titular: ${bank.titular}
• C.I. / RUC: ${bank.documento}
• Nro. de Cuenta: ${bank.cuenta}
• Tipo de Cuenta: ${bank.tipoCuenta}
• Alias SIPAP: ${bank.alias}`;
    await copyToClipboard(text);
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

    let message = '\u{1F6CD}\uFE0F *\u00A1HOLA GUTSY!*\n\n';
    message += `\u{1F464} *${fullCustomerName}*\n`;
    if (customerDoc.trim())     message += `   \u{1F194} CI: ${customerDoc.trim()}\n`;
    if (customerPhone.trim())   message += `   \u{1F4F1} ${customerPhone.trim()}\n`;
    if (fullCityDept)           message += `   \u{1F4CD} ${fullCityDept}\n`;
    if (customerAddress.trim()) message += `   \u{1F3E0} ${customerAddress.trim()}\n`;
    message += '\n';

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

    if (shippingType === 'villarrica') {
      message += '\u{1F6F5} *ENTREGA:* Delivery Villarrica / Alrededores \u2014 Gs.\u00A015.000\n';
      message += '   Les enviar\u00E9 mi ubicaci\u00F3n por aqu\u00ED al confirmar el pago.\n';
    } else {
      message += '\u{1F4E6} *ENTREGA:* Env\u00EDo por Transportadora \u2014 flete en destino (prom. Gs.\u00A035.000)\n';
    }
    message += '\n';

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
    window.open(whatsappUrl, '_blank');

    setIsSubmittingOrder(false);
    setOrderSentSuccess(true);
  };

  const handleOpenSizeGuide = (categoria) => {
    if (categoria === 'AN') setSizeGuideInitialTab('anillos');
    else if (categoria === 'CA' || categoria === 'CO' || categoria === 'DI') setSizeGuideInitialTab('cadenas');
    else if (categoria === 'PU' || categoria === 'TO') setSizeGuideInitialTab('pulseras');
    else setSizeGuideInitialTab('anillos');
    setIsSizeGuideOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    handleSelectCategory('ALL');
    setSelectedGender('ALL');
    setSelectedMaterial('ALL');
    setSelectedColor('ALL');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* 1. Header & Marquesina de Anuncios */}
      <StorefrontNavbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        user={user}
        onGoToAdmin={onGoToAdmin}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenCart={() => setIsCartOpen(true)}
        cartBounce={cartBounce}
        totalCartItems={totalCartItems}
      />

      {/* 2. Hero Lookbook Editorial */}
      <StorefrontHero />

      {/* 3. Barra de Categorías y Filtros */}
      <StorefrontFilters
        activeCategories={activeCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        materialFilterOptions={materialFilterOptions}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeFilterCount={activeFilterCount}
        onResetFilters={handleResetFilters}
        onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
      />

      {/* 4. Grilla de Productos */}
      <ProductGrid
        products={productos}
        displayedProducts={displayedProducts}
        filteredProducts={filteredProducts}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        selectedGender={selectedGender}
        selectedMaterial={selectedMaterial}
        selectedColor={selectedColor}
        sortBy={sortBy}
        searchTerm={searchTerm}
        hasMoreProducts={hasMoreProducts}
        onShowAll={() => setShowAllProducts(true)}
        onResetFilters={handleResetFilters}
        onOpenProductModal={(p, v) => handleOpenProductModal(p, v)}
      />

      {/* 5. Sección de Reseñas de Clientes */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerReviewsSection />
      </div>

      {/* 6. Modal de Detalle de Producto */}
      <ProductDetailModal
        activeModalProduct={activeModalProduct}
        onClose={handleCloseProductModal}
        modalImages={modalImages}
        activeImageIndex={activeImageIndex}
        setActiveImageIndex={setActiveImageIndex}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
        earringOption={earringOption}
        setEarringOption={setEarringOption}
        modalQuantity={modalQuantity}
        setModalQuantity={setModalQuantity}
        customEngravingText={customEngravingText}
        engravingFace1={engravingFace1}
        setEngravingFace1={setEngravingFace1}
        engravingFace2={engravingFace2}
        setEngravingFace2={setEngravingFace2}
        activeEngravingFace={activeEngravingFace}
        setActiveEngravingFace={setActiveEngravingFace}
        engravingFont={engravingFont}
        setEngravingFont={setEngravingFont}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        cart={cart}
        removeCartItem={removeCartItem}
        onAddToCart={handleAddToCart}
        onOpenSizeGuide={handleOpenSizeGuide}
        onOpenLightbox={() => setIsLightboxOpen(true)}
        onSetPreviewImage={setPreviewImage}
        matchedDbPackaging={matchedDbPackaging}
        crossSellProducts={crossSellProducts}
        onOpenAnotherProduct={(p) => handleOpenProductModal(p)}
      />

      {/* 7. Modal de Filtros en Mobile */}
      <MobileFiltersModal
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        activeFilterCount={activeFilterCount}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        materialFilterOptions={materialFilterOptions}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onResetFilters={handleResetFilters}
        totalResults={filteredProducts.length}
      />

      {/* 8. Carrito & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        totalCartItems={totalCartItems}
        cartSubtotal={cartSubtotal}
        cartTotal={cartTotal}
        deliveryCost={deliveryCost}
        updateCartItemQuantity={updateCartItemQuantity}
        removeCartItem={removeCartItem}
        shippingType={shippingType}
        setShippingType={setShippingType}
        customerFirstName={customerFirstName}
        setCustomerFirstName={setCustomerFirstName}
        customerLastName={customerLastName}
        setCustomerLastName={setCustomerLastName}
        customerDoc={customerDoc}
        setCustomerDoc={setCustomerDoc}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerCity={customerCity}
        setCustomerCity={setCustomerCity}
        customerDept={customerDept}
        setCustomerDept={setCustomerDept}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        selectedBankId={selectedBankId}
        setSelectedBankId={setSelectedBankId}
        selectedBank={selectedBank}
        copiedAlias={copiedAlias}
        copiedBank={copiedBank}
        copyAliasOnly={copyAliasOnly}
        copyBankDetails={copyBankDetails}
        isSubmittingOrder={isSubmittingOrder}
        onSendOrderWhatsApp={handleSendOrderWhatsApp}
      />

      {/* 9. Modal de Éxito de Pedido */}
      <OrderSuccessModal
        isOpen={orderSentSuccess}
        onClose={() => {
          setOrderSentSuccess(false);
          setIsCartOpen(false);
          setCart([]);
        }}
      />

      {/* 10. Guía de Talles y Lightbox */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        initialTab={sizeGuideInitialTab}
      />

      <ProductLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={modalImages}
        activeIndex={activeImageIndex}
        onSelectIndex={(idx) => setActiveImageIndex(idx)}
        title={activeModalProduct?.nombre || ''}
      />

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

      {/* 11. Footer */}
      <StorefrontFooter />
    </div>
  );
}
