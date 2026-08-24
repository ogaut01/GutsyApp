import React, { useState } from 'react';
import { Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle2, MessageCircle, X, Sparkles, Tag } from 'lucide-react';
import { createVenta } from '../services/api';

export default function POSView({ productos, onSaleSuccess, cart, setCart, isCartOpen, setIsCartOpen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  
  // Modal de selección de variante
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Estado del proceso de cobro
  const [metodoPago, setMetodoPago] = useState('QRD');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const categories = [
    { id: 'ALL', label: 'Todo' },
    { id: 'AR', label: 'Aros' },
    { id: 'CO', label: 'Cadenas' },
    { id: 'PU', label: 'Pulseras' },
    { id: 'AN', label: 'Anillos' },
    { id: 'TO', label: 'Tobilleras' },
  ];

  const genders = [
    { id: 'ALL', label: 'Todos' },
    { id: 'M', label: 'Hombre' },
    { id: 'F', label: 'Dama' },
    { id: 'U', label: 'Unisex' },
  ];

  const paymentMethods = [
    { id: 'QRD', label: 'QR Débito', icon: '📲' },
    { id: 'QRC', label: 'QR Crédito', icon: '📲' },
    { id: 'EF', label: 'Efectivo', icon: '💵' },
    { id: 'GT', label: 'Giros Tigo', icon: '📱' },
    { id: 'TR', label: 'SIPAP / Bancos', icon: '🏦' },
    { id: 'TD', label: 'Tarjeta Débito', icon: '💳' },
    { id: 'TC', label: 'Tarjeta Crédito', icon: '💳' },
  ];

  // Filtrado
  const filteredProducts = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variantes.some(v => v.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || p.categoria === selectedCategory;
    const matchesGender = selectedGender === 'ALL' || p.genero === selectedGender;
    return matchesSearch && matchesCategory && matchesGender;
  });

  const handleOpenProduct = (product) => {
    setActiveProduct(product);
    // Auto seleccionar la primera variante con stock
    const available = product.variantes.find(v => v.stock > 0) || product.variantes[0];
    setSelectedVariant(available);
    setQuantity(1);
  };

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
      return [...prev, {
        product: activeProduct,
        variant: selectedVariant,
        quantity: Math.min(quantity, selectedVariant.stock),
        unitPrice: activeProduct.precio_venta
      }];
    });

    setActiveProduct(null);
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

  const cartTotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const payload = {
        metodo_pago: metodoPago,
        total_cobrado: cartTotal,
        cliente_nombre: clienteNombre.trim() || undefined,
        cliente_telefono: clienteTelefono.trim() || undefined,
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
        metodo: paymentMethods.find(m => m.id === metodoPago)?.label
      });
      setCart([]);
      setIsCartOpen(false);
      onSaleSuccess();
    } catch (err) {
      alert('Error al registrar venta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppReceipt = () => {
    if (!completedSale) return;
    const phone = clienteTelefono.replace(/\D/g, '');
    let msg = `✨ *COMPROBANTE DE COMPRA - ACCESORIOS PY* ✨\n`;
    msg += `---------------------------------\n`;
    msg += `Nro. Venta: #${completedSale.id}\n`;
    if (clienteNombre) msg += `Cliente: ${clienteNombre}\n`;
    msg += `Método: ${completedSale.metodo}\n`;
    msg += `---------------------------------\n`;
    completedSale.cartItems.forEach(item => {
      msg += `• ${item.product.nombre}\n  (${item.variant.color} - ${item.variant.talle_medida}) x${item.quantity} = Gs. ${(item.unitPrice * item.quantity).toLocaleString('es-PY')}\n`;
    });
    msg += `---------------------------------\n`;
    msg += `*TOTAL COBRADO: Gs. ${completedSale.total.toLocaleString('es-PY')}*\n`;
    msg += `\n¡Muchas gracias por tu preferencia! 🙌`;

    const encoded = encodeURIComponent(msg);
    const url = phone ? `https://wa.me/595${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto">
      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar accesorio, modelo o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtro Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar mb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filtro Género */}
      <div className="flex gap-1.5 mb-4">
        {genders.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGender(g.id)}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium transition ${
              selectedGender === g.id
                ? 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                : 'bg-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredProducts.map((prod) => {
          const inStock = prod.stock_total > 0;
          return (
            <div
              key={prod.id}
              onClick={() => handleOpenProduct(prod)}
              className="group bg-zinc-900 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-col justify-between hover:border-amber-500/40 active:scale-[0.98] transition cursor-pointer relative overflow-hidden"
            >
              {/* Imagen */}
              <div className="w-full aspect-square bg-zinc-950 rounded-xl mb-2.5 overflow-hidden relative flex items-center justify-center border border-zinc-800/50">
                {prod.imagen_url_completa ? (
                  <img
                    src={prod.imagen_url_completa}
                    alt={prod.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="text-zinc-600 flex flex-col items-center">
                    <Sparkles className="w-8 h-8 stroke-[1.2] mb-1 text-zinc-700" />
                    <span className="text-[10px]">Sin foto</span>
                  </div>
                )}

                {/* Badge de Stock */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                  prod.stock_total > 3 ? 'bg-emerald-500/90 text-white' :
                  prod.stock_total > 0 ? 'bg-amber-500/90 text-zinc-950' :
                  'bg-rose-500/90 text-white'
                }`}>
                  {prod.stock_total > 0 ? `${prod.stock_total} u.` : 'Agotado'}
                </div>
              </div>

              {/* Info */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block mb-0.5">
                  {prod.categoria_display} • {prod.genero_display}
                </span>
                <h3 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-tight mb-2">
                  {prod.nombre}
                </h3>
              </div>

              {/* Precio y Botón */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-auto">
                <div>
                  <span className="text-sm font-black text-white block">
                    Gs. {prod.precio_venta ? prod.precio_venta.toLocaleString('es-PY') : '0'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {prod.variantes?.length || 0} talles/col.
                  </span>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  inStock ? 'bg-amber-500 text-zinc-950 group-hover:bg-amber-400' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <Sparkles className="w-10 h-10 mx-auto stroke-[1] mb-2 text-zinc-600" />
          <p className="text-sm">No encontramos accesorios con esos filtros</p>
        </div>
      )}

      {/* Modal Selección de Variante */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  {activeProduct.categoria_display} • {activeProduct.genero_display}
                </span>
                <h2 className="text-base font-bold text-white leading-tight">
                  {activeProduct.nombre}
                </h2>
                <p className="text-lg font-black text-amber-400 mt-1">
                  Gs. {activeProduct.precio_venta?.toLocaleString('es-PY')}
                </p>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Variantes (Colores y Talles) */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-zinc-400 block mb-2">
                Selecciona Color y Talle disponible:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeProduct.variantes.map((v) => {
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
                      className={`p-3 rounded-2xl text-left border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : isAvailable
                          ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                          : 'border-zinc-900 bg-zinc-950/40 text-zinc-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-bold text-xs">{v.color}</div>
                      <div className="text-[11px] text-zinc-400">{v.talle_medida}</div>
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-zinc-500">{v.sku}</span>
                        <span className={`font-bold ${isAvailable ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {isAvailable ? `${v.stock} disp.` : 'Sin stock'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cantidad y Agregar */}
            {selectedVariant && selectedVariant.stock > 0 && (
              <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  Agregar • Gs. {(activeProduct.precio_venta * quantity).toLocaleString('es-PY')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer / Modal de Carrito y Cobro */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base text-white">Pedido en Caja</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  El carrito está vacío. Agrega accesorios desde el catálogo.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl"
                  >
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.nombre}</h4>
                      <p className="text-[11px] text-amber-400">
                        {item.variant.color} • {item.variant.talle_medida}
                      </p>
                      <p className="text-xs font-black text-zinc-100 mt-0.5">
                        Gs. {(item.unitPrice * item.quantity).toLocaleString('es-PY')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                      <button
                        onClick={() => handleUpdateCartQty(item.variant.id, -1)}
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(item.variant.id, 1)}
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.variant.id)}
                      className="p-2 text-zinc-600 hover:text-rose-400 ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                {/* Selector Método de Pago */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                    Método de Pago:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMetodoPago(m.id)}
                        className={`p-2 rounded-xl text-center border text-xs font-medium transition ${
                          metodoPago === m.id
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-base block mb-0.5">{m.icon}</span>
                        <span className="text-[10px] leading-tight block">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cliente Opcional */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Cliente (Opcional)"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp (0981...)"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Total y Botón Cobrar */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Total a Cobrar</span>
                    <span className="text-xl font-black text-white">
                      Gs. {cartTotal.toLocaleString('es-PY')}
                    </span>
                  </div>
                  <button
                    disabled={loading}
                    onClick={handleFinalizeSale}
                    className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black rounded-2xl text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'COBRAR AHORA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Venta Exitosa */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white">¡Venta Registrada!</h3>
            <p className="text-xs text-zinc-400 mb-4">Comprobante #{completedSale.id}</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total:</span>
                <span className="font-bold text-white">Gs. {completedSale.total?.toLocaleString('es-PY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Método:</span>
                <span className="font-bold text-amber-400">{completedSale.metodo}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800 text-[11px] text-zinc-500">
                <span>Stock:</span>
                <span className="text-emerald-400">Descontado automáticamente</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={sendWhatsAppReceipt}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Recibo por WhatsApp
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
