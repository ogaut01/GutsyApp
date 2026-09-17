import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle2, MessageCircle,
  X, Sparkles, Tag, Layers, QrCode, Banknote, Smartphone, Building2,
  CreditCard, Users, UserPlus, Check
} from 'lucide-react';
import { createVenta, fetchClientes, createCliente } from '../services/api';

export default function POSView({ productos = [], onSaleSuccess, cart, setCart, isCartOpen, setIsCartOpen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');

  // Estado para selección de variante del producto activo
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Clientes
  const [clientesList, setClientesList] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [isCreatingClientInline, setIsCreatingClientInline] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientInstagram, setNewClientInstagram] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [savingNewClient, setSavingNewClient] = useState(false);

  useEffect(() => {
    fetchClientes().then(list => setClientesList(list || [])).catch(() => {});
  }, []);

  // Estado del proceso de cobro
  const [metodoPago, setMetodoPago] = useState('QRD');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const allCategories = [
    { id: 'ALL', label: 'Todo' },
    { id: 'AN', label: 'Anillos' },
    { id: 'CA', label: 'Cadenas' },
    { id: 'CO', label: 'Collares' },
    { id: 'ST', label: 'Sets / Parejas' },
    { id: 'LE', label: 'Lentes' },
    { id: 'PU', label: 'Pulseras' },
    { id: 'AR', label: 'Aros' },
    { id: 'TO', label: 'Tobilleras' },
    { id: 'DI', label: 'Dijes' },
    { id: 'RE', label: 'Relojes' },
    { id: 'PI', label: 'Piercings' },
    { id: 'OT', label: 'Otros' },
  ];

  // Opción 2: Filtrar y mostrar solo categorías que tienen al menos 1 producto registrado (+ 'Todo')
  const categories = useMemo(() => {
    const existingCats = new Set(productos.map(p => p.categoria));
    return allCategories.filter(c => c.id === 'ALL' || existingCats.has(c.id));
  }, [productos]);

  const genders = [
    { id: 'ALL', label: 'Todos' },
    { id: 'M', label: 'Hombre' },
    { id: 'F', label: 'Dama' },
    { id: 'U', label: 'Unisex' },
  ];

  const paymentMethods = [
    { id: 'QRD', label: 'QR Débito', icon: QrCode },
    { id: 'QRC', label: 'QR Crédito', icon: QrCode },
    { id: 'EF', label: 'Efectivo', icon: Banknote },
    { id: 'GT', label: 'Giros Tigo', icon: Smartphone },
    { id: 'TR', label: 'SIPAP / Transferencia', icon: Building2 },
    { id: 'TD', label: 'Tarjeta Débito', icon: CreditCard },
    { id: 'TC', label: 'Tarjeta Crédito', icon: CreditCard },
  ];

  const hasActiveFilters = searchTerm.trim() !== '' || selectedCategory !== 'ALL' || selectedGender !== 'ALL';

  // Opción 3: Limpiar todos los filtros con un clic
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedGender('ALL');
  };

  // Filtrado de catálogo
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return productos.filter((p) => {
      const matchesSearch = !term ||
        p.nombre?.toLowerCase().includes(term) ||
        p.variantes?.some(v => v.sku?.toLowerCase().includes(term) || v.color?.toLowerCase().includes(term));
      
      // Opción 4: Búsqueda inteligente (si el usuario busca texto específico, no lo limita a la categoría seleccionada a menos que no haya texto)
      const matchesCat = (!term && selectedCategory !== 'ALL') ? p.categoria === selectedCategory : (selectedCategory === 'ALL' || p.categoria === selectedCategory);
      const matchesGen = selectedGender === 'ALL' || p.genero === selectedGender;
      return matchesSearch && matchesCat && matchesGen;
    });
  }, [productos, searchTerm, selectedCategory, selectedGender]);

  // Al hacer clic en un producto
  const handleOpenProduct = (prod) => {
    setActiveProduct(prod);
    const uniqueColors = [...new Set(prod.variantes?.map(v => v.color) || [])];
    if (uniqueColors.length === 1) {
      setSelectedColor(uniqueColors[0]);
    } else {
      setSelectedColor(null);
    }
    setSelectedVariant(null);
    setQuantity(1);
  };

  // Colores disponibles para el producto seleccionado
  const availableColors = useMemo(() => {
    if (!activeProduct?.variantes) return [];
    return [...new Set(activeProduct.variantes.map(v => v.color))].sort();
  }, [activeProduct]);

  // Talles/Variantes disponibles para el color seleccionado
  const availableSizes = useMemo(() => {
    if (!activeProduct?.variantes || !selectedColor) return [];
    return activeProduct.variantes.filter(v => v.color === selectedColor);
  }, [activeProduct, selectedColor]);

  // Imagen activa según el color seleccionado
  // Toma la primera variante del color y usa su imagen propia; si no, usa la del producto.
  const activeColorImage = useMemo(() => {
    if (selectedColor && activeProduct?.variantes) {
      const variantOfColor = activeProduct.variantes.find(v => v.color === selectedColor && v.imagen_url);
      if (variantOfColor) return variantOfColor.imagen_url;
    }
    return activeProduct?.imagen_url_completa || null;
  }, [activeProduct, selectedColor]);

  // Agregar al carrito
  const handleAddToCart = () => {
    if (!selectedVariant || quantity < 1) return;

    setCart((prev) => {
      const existing = prev.find(item => item.variant.id === selectedVariant.id);
      if (existing) {
        return prev.map(item =>
          item.variant.id === selectedVariant.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, selectedVariant.stock) }
            : item
        );
      }
      const variantUnitPrice = (selectedVariant.precio_venta && selectedVariant.precio_venta > 0)
        ? selectedVariant.precio_venta
        : (activeProduct.precio_venta || 0);

      return [...prev, {
        product: activeProduct,
        variant: selectedVariant,
        quantity: Math.min(quantity, selectedVariant.stock),
        unitPrice: variantUnitPrice
      }];
    });

    setActiveProduct(null);
    setSelectedColor(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (variantId) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const handleUpdateCartQty = (variantId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, item.variant.stock) };
      }
      return item;
    }).filter(Boolean));
  };

  const handleUpdateCartPrice = (variantId, newPrice) => {
    const price = Math.max(0, parseInt(newPrice) || 0);
    setCart(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        return { ...item, unitPrice: price };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const cartTotalUnits = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSelectClient = (clientId) => {
    setSelectedClienteId(clientId);
    if (!clientId) {
      setClienteNombre('');
      setClienteTelefono('');
      return;
    }
    const found = clientesList.find(c => c.id === parseInt(clientId));
    if (found) {
      setClienteNombre(found.nombre);
      setClienteTelefono(found.telefono || '');
    }
  };

  const handleQuickCreateClient = async (e) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setSavingNewClient(true);
    try {
      const created = await createCliente({
        nombre: newClientName.trim(),
        telefono: newClientPhone.trim() || null,
        instagram: newClientInstagram.trim().replace(/^@/, '') || null,
        ciudad: newClientCity.trim() || null,
      });
      setClientesList(prev => [created, ...prev]);
      setSelectedClienteId(created.id.toString());
      setClienteNombre(created.nombre);
      setClienteTelefono(created.telefono || '');
      setIsCreatingClientInline(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientInstagram('');
      setNewClientCity('');
    } catch (err) {
      alert('Error al crear cliente: ' + err.message);
    } finally {
      setSavingNewClient(false);
    }
  };

  // Finalizar cobro
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const payload = {
        metodo_pago: metodoPago,
        total_cobrado: cartTotal,
        cliente: selectedClienteId ? parseInt(selectedClienteId) : undefined,
        cliente_nombre: clienteNombre.trim() || undefined,
        cliente_telefono: clienteTelefono.trim() || undefined,
        notas: notas.trim() || undefined,
        items: cart.map(item => ({
          variante_id: item.variant.id,
          cantidad: item.quantity,
          precio_unitario: item.unitPrice
        }))
      };

      const result = await createVenta(payload);
      setCompletedSale({
        ...result,
        cartItems: [...cart],
        total: cartTotal,
        notas: notas.trim() || undefined,
        metodo: paymentMethods.find(m => m.id === metodoPago)?.label,
        cliente_telefono: clienteTelefono.trim() || result.cliente_telefono || undefined,
        cliente_nombre: clienteNombre.trim() || result.cliente_nombre || undefined,
      });
      setCart([]);
      setIsCartOpen(false);
      setSelectedClienteId('');
      setClienteNombre('');
      setClienteTelefono('');
      setNotas('');
      if (onSaleSuccess) onSaleSuccess();
    } catch (err) {
      alert('Error al registrar venta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar comprobante WhatsApp
  const generateWhatsAppReceipt = () => {
    if (!completedSale) return '';
    let msg = `*COMPROBANTE DE COMPRA — GUTSY ACCESORIOS* 💎\n`;
    msg += `--------------------------------------\n`;
    msg += `📅 Fecha: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (completedSale.cliente_nombre) msg += `👤 Cliente: ${completedSale.cliente_nombre}\n`;
    msg += `💳 Pago: ${completedSale.metodo}\n`;
    if (completedSale.notas) msg += `✍️ Detalle/Notas: ${completedSale.notas}\n`;
    msg += `--------------------------------------\n`;
    completedSale.cartItems.forEach((it, i) => {
      msg += `${i + 1}. *${it.product.nombre}*\n`;
      msg += `   (${it.variant.color} - ${it.variant.talle_medida}) x${it.quantity}\n`;
      msg += `   Gs. ${(it.unitPrice * it.quantity).toLocaleString('es-PY')}\n`;
    });
    msg += `--------------------------------------\n`;
    msg += `*TOTAL PAGADO: Gs. ${completedSale.total.toLocaleString('es-PY')}*\n\n`;
    msg += `¡Muchas gracias por tu compra! ✨`;
    return encodeURIComponent(msg);
  };

  const getCompletedSaleWhatsAppUrl = () => {
    const text = generateWhatsAppReceipt();
    if (completedSale?.cliente_telefono) {
      let clean = completedSale.cliente_telefono.replace(/[^\d+]/g, '');
      if (clean.startsWith('0')) clean = '595' + clean.slice(1);
      else if (!clean.startsWith('+') && !clean.startsWith('595')) clean = '595' + clean;
      clean = clean.replace('+', '');
      return `https://wa.me/${clean}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* ── Buscador y Filtros ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por accesorio, color o SKU... (Esc para limpiar)"
            value={searchTerm}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClearFilters();
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl text-sm placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-white rounded-full transition"
              title="Borrar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categorías (Filtro Principal con scroll horizontal suave y fade indicador) */}
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto scroll-smooth pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  selectedCategory === c.id
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {/* Indicador de fade a la derecha cuando desborda */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white dark:from-black to-transparent" />
        </div>

        {/* Género (Filtro Secundario) + Botón de Limpiar Filtros */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {genders.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGender(g.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition shrink-0 ${
                  selectedGender === g.id
                    ? 'bg-neutral-800 text-white dark:bg-zinc-200 dark:text-black shadow-sm'
                    : 'bg-neutral-100 dark:bg-zinc-900/80 text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-neutral-200/80 dark:border-zinc-800/80'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Botón rápido para limpiar todos los filtros activos */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center gap-1 transition shrink-0 active:scale-95"
              title="Restablecer todos los filtros"
            >
              <X className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Catálogo en Cuadrícula ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredProducts.map((prod) => {
          const totalStock = prod.stock_total || 0;
          const inStock = totalStock > 0;

          return (
            <div
              key={prod.id}
              onClick={() => inStock && handleOpenProduct(prod)}
              className={`group bg-zinc-900 border rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer active:scale-[0.98] ${
                inStock
                  ? 'border-neutral-200 dark:border-zinc-800/80 hover:border-amber-500/50 shadow-sm'
                  : 'border-zinc-900 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Thumbnail e Insignia */}
              <div className="relative aspect-square w-full rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800/60 overflow-hidden mb-2.5 flex items-center justify-center">
                {prod.imagen_url_completa ? (
                  <img
                    src={prod.imagen_url_completa}
                    alt={prod.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <Sparkles className="w-8 h-8 text-zinc-700 stroke-[1.2]" />
                )}

                {/* Stock Badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                  totalStock > 3 ? 'bg-emerald-500/90 text-zinc-950' :
                  totalStock > 0 ? 'bg-amber-500/90 text-zinc-950' :
                  'bg-rose-500/90 text-stone-900 dark:text-white'
                }`}>
                  {inStock ? `${totalStock} disp.` : 'Agotado'}
                </span>
              </div>

              {/* Info */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white block mb-0.5">
                  {prod.categoria_display || prod.categoria} • {prod.genero_display || prod.genero}
                </span>
                <h3 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-tight mb-2">
                  {prod.nombre}
                </h3>
              </div>

              {/* Precio y Botón */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-zinc-800/60 mt-auto">
                <div>
                  <span className="text-sm font-black text-stone-900 dark:text-white block">
                    Gs. {prod.precio_venta?.toLocaleString('es-PY') || '0'}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                    {prod.variantes?.length || 0} talles/col.
                  </span>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  inStock ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm group-hover:bg-amber-400' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-stone-400 dark:text-zinc-500">
          <Sparkles className="w-10 h-10 mx-auto stroke-[1] mb-2 text-zinc-600" />
          <p className="text-sm">No encontramos accesorios con esos filtros</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Selección de Variante (Color → Talle)
      ══════════════════════════════════════════════════════ */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            {/* Encabezado */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-800 flex-shrink-0 flex items-center justify-center transition-all duration-300">
                  {activeColorImage ? (
                    <img src={activeColorImage} alt={activeProduct.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-zinc-700" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">{activeProduct.nombre}</h2>
                  <p className="text-sm font-black text-black dark:text-white mt-0.5">
                    Gs. {activeProduct.precio_venta?.toLocaleString('es-PY')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveProduct(null);
                  setSelectedColor(null);
                  setSelectedVariant(null);
                  setQuantity(1);
                }}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paso 1: Selección de Color */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-stone-500 dark:text-zinc-400 block mb-2">
                1. Seleccioná el Color:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((col) => {
                  const isSelected = selectedColor === col;
                  const totalColorStock = activeProduct.variantes
                    .filter(v => v.color === col)
                    .reduce((acc, v) => acc + v.stock, 0);
                  // Imagen específica de este color
                  const colorImg = activeProduct.variantes.find(v => v.color === col && v.imagen_url)?.imagen_url
                    || activeProduct.imagen_url_completa;

                  return (
                    <button
                      key={col}
                      onClick={() => {
                        setSelectedColor(col);
                        setSelectedVariant(null);
                        setQuantity(1);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-neutral-700 dark:text-neutral-300 shadow-sm'
                          : 'border-neutral-200 dark:border-zinc-800 bg-zinc-950 text-stone-700 dark:text-zinc-300 hover:border-[#d6cebf] dark:border-zinc-700'
                      }`}
                    >
                      {colorImg ? (
                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-[#d6cebf] dark:border-zinc-700">
                          <img src={colorImg} alt={col} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                      <span>{col}</span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-normal">({totalColorStock} u.)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 2: Selección de Talle (si hay color elegido) */}
            {selectedColor && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-stone-500 dark:text-zinc-400 block mb-2">
                  2. Seleccioná el Talle / Medida:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {availableSizes.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isAvailable = v.stock > 0;

                    return (
                      <button
                        key={v.id}
                        disabled={!isAvailable}
                        onClick={() => {
                          setSelectedVariant(v);
                          setQuantity(1);
                        }}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between text-left ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-stone-900 dark:text-white'
                            : isAvailable
                            ? 'border-neutral-200 dark:border-zinc-800 bg-zinc-950 text-stone-700 dark:text-zinc-300 hover:border-[#d6cebf] dark:border-zinc-700'
                            : 'border-zinc-900 bg-zinc-950/40 text-zinc-600 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs">{v.talle_medida}</span>
                          <span className={`text-[10px] font-bold ${isAvailable ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {isAvailable ? `${v.stock} disp.` : 'Sin stock'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full mt-0.5">
                          {v.sku ? (
                            <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 truncate">
                              {v.sku}
                            </span>
                          ) : <span />}
                          {v.precio_venta && v.precio_venta > 0 && v.precio_venta !== activeProduct.precio_venta && (
                            <span className="text-[10px] font-black text-amber-500 ml-1">
                              Gs. {v.precio_venta.toLocaleString('es-PY')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paso 3: Cantidad y Botón Agregar */}
            {selectedVariant && (
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-zinc-800">
                <div className="flex items-center bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-stone-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(selectedVariant.stock, prev + 1))}
                    className="p-2 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  Agregar • Gs. {((activeProduct.precio_venta || 0) * quantity).toLocaleString('es-PY')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DRAWER / MODAL — Carrito y Cobro
      ══════════════════════════════════════════════════════ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-black dark:text-white" />
                <h2 className="font-bold text-base text-stone-900 dark:text-white">Pedido en Caja ({cartTotalUnits} u.)</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-stone-400 dark:text-zinc-500 text-xs">
                  El carrito está vacío. Agregá accesorios desde el catálogo.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-2xl"
                  >
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">{item.product.nombre}</h4>
                      <p className="text-[11px] text-black dark:text-white font-semibold">
                        {item.variant.color} • {item.variant.talle_medida}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500">Precio u.:</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateCartPrice(item.variant.id, e.target.value)}
                          className="w-24 px-2 py-0.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-[#d6cebf] dark:border-zinc-700 focus:border-black dark:focus:border-white rounded-lg text-xs font-bold text-black dark:text-white outline-none"
                        />
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold">
                          = Gs. {(item.unitPrice * item.quantity).toLocaleString('es-PY')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl p-1">
                      <button
                        onClick={() => handleUpdateCartQty(item.variant.id, -1)}
                        className="p-1 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-stone-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(item.variant.id, 1)}
                        className="p-1 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.variant.id)}
                      className="p-2 ml-2 text-zinc-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Total y Métodos de Pago */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Total a Cobrar</span>
                  <span className="text-2xl font-black text-black dark:text-white">
                    Gs. {cartTotal.toLocaleString('es-PY')}
                  </span>
                </div>

                {/* Métodos de Pago */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    Medio de Cobro
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {paymentMethods.map((m) => {
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetodoPago(m.id)}
                          className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            metodoPago === m.id
                              ? 'border-amber-500 bg-amber-500/15 text-black dark:text-white font-bold'
                              : 'border-neutral-200 dark:border-zinc-800 bg-zinc-950 text-stone-500 dark:text-zinc-400 hover:border-[#d6cebf] dark:border-zinc-700'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 ${metodoPago === m.id ? 'text-black dark:text-white' : 'text-stone-400 dark:text-zinc-500'}`} />
                          <span className="text-[10px] whitespace-nowrap">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selección y Registro de Cliente */}
                <div className="space-y-2 pt-1 border-t border-neutral-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Cliente
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingClientInline(!isCreatingClientInline)}
                      className="text-[11px] font-bold text-black dark:text-white hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      {isCreatingClientInline ? 'Cancelar' : '+ Nuevo Cliente'}
                    </button>
                  </div>

                  {/* Formulario rápido para crear cliente inline */}
                  {isCreatingClientInline ? (
                    <form onSubmit={handleQuickCreateClient} className="p-3 bg-stone-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl space-y-2 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">Registrar nuevo cliente</span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingClientInline(false)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Nombre Completo *"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        />
                        <input
                          type="tel"
                          placeholder="Celular (WhatsApp)"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Instagram (@usuario)"
                          value={newClientInstagram}
                          onChange={(e) => setNewClientInstagram(e.target.value)}
                          className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        />
                        <input
                          type="text"
                          placeholder="Ciudad / Barrio"
                          value={newClientCity}
                          onChange={(e) => setNewClientCity(e.target.value)}
                          className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingNewClient || !newClientName.trim()}
                        className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        {savingNewClient ? 'Guardando...' : 'Crear y Seleccionar'}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <select
                        value={selectedClienteId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="w-full px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                      >
                        <option value="">👤 Consumidor Final (Ocasional)</option>
                        {clientesList.map(c => (
                          <option key={c.id} value={c.id}>
                            👤 {c.nombre} {c.telefono ? `(${c.telefono})` : ''} {c.ciudad ? `• ${c.ciudad}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Inputs manuales si no hay cliente registrado seleccionado */}
                  {!selectedClienteId && !isCreatingClientInline && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nombre (Opcional)"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        className="px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white"
                      />
                      <input
                        type="tel"
                        placeholder="Celular (WhatsApp)"
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        className="px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white"
                      />
                    </div>
                  )}

                  <textarea
                    rows={2}
                    placeholder="Detalles de la venta, notas o especificaciones (Opcional)..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white resize-none"
                  />
                </div>

                {/* Botón Finalizar */}
                <button
                  onClick={handleFinalizeSale}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-base shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? 'Procesando Venta...' : `CONFIRMAR VENTA • Gs. ${cartTotal.toLocaleString('es-PY')}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Venta Completada / Recibo WhatsApp
      ══════════════════════════════════════════════════════ */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <h3 className="font-black text-stone-900 dark:text-white text-lg">¡Venta Registrada!</h3>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                Gs. {completedSale.total.toLocaleString('es-PY')}
              </p>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                Cobrado vía {completedSale.metodo}
                {completedSale.cliente_nombre ? ` a ${completedSale.cliente_nombre}` : ''}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getCompletedSaleWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-stone-900 dark:text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Recibo por WhatsApp</span>
              </a>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition"
              >
                Cerrar & Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
