import React, { useState, useRef } from 'react';
import {
  Search, Gem, Sparkles, ChevronDown, ChevronUp,
  Tag, DollarSign, Layers, Pencil, Trash2, X,
  Plus, Minus, Check, AlertTriangle, ExternalLink, Camera,
} from 'lucide-react';
import {
  updateProducto, deleteProducto,
  updateVariante, deleteVariante,
  uploadFotoProducto, fetchProveedores,
  bulkUploadProductos,
} from '../services/api';

const CATEGORIAS = [
  { id: 'AR', label: 'Aros' },
  { id: 'CO', label: 'Cadenas / Collares' },
  { id: 'PU', label: 'Pulseras' },
  { id: 'AN', label: 'Anillos' },
  { id: 'TO', label: 'Tobilleras' },
  { id: 'DJ', label: 'Dijes' },
  { id: 'OT', label: 'Otros' },
];

const GENEROS = [
  { id: 'M', label: 'Hombre' },
  { id: 'F', label: 'Dama' },
  { id: 'U', label: 'Unisex' },
];

export default function InventoryView({ productos, onOpenBulkUpload, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Modal editar producto
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal editar variante
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({});
  const [savingVariant, setSavingVariant] = useState(false);

  // Confirmación de borrado
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'producto'|'variante', id, nombre }
  const [deleting, setDeleting] = useState(false);

  // Subida de foto
  const [uploadingFotoId, setUploadingFotoId] = useState(null);
  const fotoInputRef = useRef(null);
  const [pendingFotoProductoId, setPendingFotoProductoId] = useState(null);

  const handleFotoClick = (prodId, e) => {
    e.stopPropagation();
    setPendingFotoProductoId(prodId);
    fotoInputRef.current.click();
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingFotoProductoId) return;
    e.target.value = ''; // reset para poder subir la misma foto otra vez si hace falta
    setUploadingFotoId(pendingFotoProductoId);
    try {
      await uploadFotoProducto(pendingFotoProductoId, file);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al subir la foto: ' + err.message);
    } finally {
      setUploadingFotoId(null);
      setPendingFotoProductoId(null);
    }
  };

  // Nuevo Producto manual
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [nuevoProductoFoto, setNuevoProductoFoto] = useState(null);
  const [nuevoProductoFotoPreview, setNuevoProductoFotoPreview] = useState(null);
  const [nuevoProductoForm, setNuevoProductoForm] = useState({
    nombre: '',
    categoria: 'AN',
    genero: 'U',
    proveedor: '',
    costo_moneda_origen: '',
    moneda_compra: 'USD',
    peso_gramos: '15',
    precio_venta: '',
    url_origen: '',
    color: 'Único',
    talle_medida: 'Ajustable',
    stock: '1'
  });
  const [savingNuevoProducto, setSavingNuevoProducto] = useState(false);

  const handleNuevoProductoFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNuevoProductoFoto(file);
    setNuevoProductoFotoPreview(URL.createObjectURL(file));
  };

  const handleOpenNuevoProducto = async () => {
    setShowNuevoProductoModal(true);
    setNuevoProductoFoto(null);
    setNuevoProductoFotoPreview(null);
    try {
      const provs = await fetchProveedores();
      setProveedores(provs);
      if (provs.length > 0) {
        setNuevoProductoForm(f => ({ ...f, proveedor: provs[0].nombre }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNuevoProducto = async (e) => {
    e.preventDefault();
    setSavingNuevoProducto(true);
    try {
      const res = await bulkUploadProductos([
        {
          nombre: nuevoProductoForm.nombre,
          categoria: nuevoProductoForm.categoria,
          genero: nuevoProductoForm.genero,
          proveedor: nuevoProductoForm.proveedor || 'Shein',
          costo_moneda_origen: parseFloat(nuevoProductoForm.costo_moneda_origen) || 0,
          moneda_compra: nuevoProductoForm.moneda_compra,
          peso_gramos: parseInt(nuevoProductoForm.peso_gramos) || 15,
          precio_venta: parseInt(nuevoProductoForm.precio_venta) || 0,
          url_origen: nuevoProductoForm.url_origen || '',
          variantes: [
            {
              color: nuevoProductoForm.color || 'Único',
              talle_medida: nuevoProductoForm.talle_medida || 'Ajustable',
              stock: parseInt(nuevoProductoForm.stock) || 1
            }
          ]
        }
      ]);

      // Si se seleccionó una foto y tenemos el ID del producto, subirla
      if (nuevoProductoFoto && res.producto_ids && res.producto_ids.length > 0) {
        try {
          await uploadFotoProducto(res.producto_ids[0], nuevoProductoFoto);
        } catch (fotoErr) {
          console.error('Producto creado pero error al subir foto:', fotoErr);
        }
      }

      setShowNuevoProductoModal(false);
      setNuevoProductoFoto(null);
      setNuevoProductoFotoPreview(null);
      setNuevoProductoForm({
        nombre: '',
        categoria: 'AN',
        genero: 'U',
        proveedor: proveedores[0]?.nombre || 'Shein',
        costo_moneda_origen: '',
        moneda_compra: 'USD',
        peso_gramos: '15',
        precio_venta: '',
        url_origen: '',
        color: 'Único',
        talle_medida: 'Ajustable',
        stock: '1'
      });
      if (onReload) onReload();
    } catch (err) {
      alert('Error al crear producto: ' + err.message);
    } finally {
      setSavingNuevoProducto(false);
    }
  };



  const categories = [
    { id: 'ALL', label: 'Todo' },
    ...CATEGORIAS,
  ];

  const filtered = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variantes.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || p.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalStockUnits = productos.reduce((acc, p) => acc + p.stock_total, 0);
  const totalValuation = productos.reduce((acc, p) => acc + (p.stock_total * p.precio_venta), 0);

  const toggleExpand = (id) => setExpandedProduct(expandedProduct === id ? null : id);

  // ── Editar Producto ──────────────────────────────────────────
  const openEditProduct = (prod, e) => {
    e.stopPropagation();
    setEditingProduct(prod);
    setEditForm({
      nombre: prod.nombre,
      categoria: prod.categoria,
      genero: prod.genero,
      costo_moneda_origen: prod.costo_moneda_origen,
      moneda_compra: prod.moneda_compra,
      precio_venta: prod.precio_venta,
      peso_gramos: prod.peso_gramos,
      url_producto: prod.url_producto || '',
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await updateProducto(editingProduct.id, {
        ...editForm,
        precio_venta: parseInt(editForm.precio_venta),
        costo_moneda_origen: parseFloat(editForm.costo_moneda_origen),
        peso_gramos: parseInt(editForm.peso_gramos),
      });
      setEditingProduct(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Editar Variante ──────────────────────────────────────────
  const openEditVariant = (variante, prodNombre, e) => {
    e.stopPropagation();
    setEditingVariant({ ...variante, prodNombre });
    setVariantForm({
      color: variante.color,
      talle_medida: variante.talle_medida,
      stock: variante.stock,
    });
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    setSavingVariant(true);
    try {
      await updateVariante(editingVariant.id, {
        ...variantForm,
        stock: parseInt(variantForm.stock),
      });
      setEditingVariant(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar variante: ' + err.message);
    } finally {
      setSavingVariant(false);
    }
  };

  // ── Borrar ───────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === 'producto') {
        await deleteProducto(confirmDelete.id);
        setExpandedProduct(null);
      } else {
        await deleteVariante(confirmDelete.id);
      }
      setConfirmDelete(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Stock rápido +/- sin abrir modal ────────────────────────
  const quickStock = async (varianteId, delta, e) => {
    e.stopPropagation();
    try {
      await updateVariante(varianteId, { stock_delta: delta });
      if (onReload) onReload();
    } catch {
      // fallback silencioso
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-amber-400" />
            Catálogo & Control de Stock
          </h2>
          <p className="text-[11px] text-zinc-400">{productos.length} modelos registrados</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenNuevoProducto}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>
          {onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Totales ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Total</span>
          </div>
          <p className="text-xl font-black text-white">{totalStockUnits} unidades</p>
          <span className="text-[10px] text-zinc-400">{productos.length} modelos en catálogo</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Valor en Venta</span>
          </div>
          <p className="text-xl font-black text-white">Gs. {totalValuation.toLocaleString('es-PY')}</p>
          <span className="text-[10px] text-zinc-400">Inventario disponible</span>
        </div>
      </div>

      {/* ── Buscador y Filtros ── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, talle o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input de cámara oculto — compartido entre todos los productos */}
      <input
        ref={fotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFotoChange}
      />

      {/* ── Lista de Productos ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-zinc-600 text-xs py-10">Sin resultados para "{searchTerm}"</p>
        )}

        {filtered.map((prod) => {
          const isExpanded = expandedProduct === prod.id;
          const isUploading = uploadingFotoId === prod.id;
          return (
            <div
              key={prod.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 transition hover:border-zinc-700"
            >
              {/* ── Fila principal ── */}
              <div
                onClick={() => toggleExpand(prod.id)}
                className="flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail con botón de cámara superpuesto */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                      {prod.imagen_url_completa ? (
                        <img src={prod.imagen_url_completa} alt={prod.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <Gem className="w-6 h-6 text-zinc-700" />
                      )}
                    </div>
                    {/* Botón cámara superpuesto */}
                    <button
                      onClick={(e) => handleFotoClick(prod.id, e)}
                      disabled={isUploading}
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition
                        ${prod.imagen_url_completa
                          ? 'bg-zinc-700 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                        } ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                      title={prod.imagen_url_completa ? 'Reemplazar foto' : 'Agregar foto'}
                    >
                      {isUploading
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : <Camera className="w-3 h-3" />
                      }
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 text-[10px] font-bold">
                        {prod.categoria_display}
                      </span>
                      <span className="text-[10px] text-zinc-400">{prod.genero_display}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{prod.nombre}</h3>
                    <p className="text-xs font-black text-amber-400 mt-0.5">
                      Gs. {prod.precio_venta?.toLocaleString('es-PY')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    prod.stock_total > 3 ? 'bg-emerald-500/20 text-emerald-400' :
                    prod.stock_total > 0 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {prod.stock_total} u.
                  </span>
                  {/* Botones Editar / Borrar producto */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditProduct(prod, e)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 transition"
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'producto', id: prod.id, nombre: prod.nombre }); }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-zinc-500 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Detalle desplegable ── */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3 text-xs animate-in fade-in-50">

                  {/* Costos */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/60">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Costo FOB</span>
                      <span className="font-semibold text-zinc-200">
                        {prod.costo_moneda_origen} {prod.moneda_compra}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Costo Real PYG</span>
                      <span className="font-semibold text-white">Gs. {prod.costo_pyg?.toLocaleString('es-PY')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Margen Bruto</span>
                      <span className="font-bold text-emerald-400">
                        +{prod.margen_porcentaje}%
                      </span>
                    </div>
                  </div>

                  {/* URL origen */}
                  {prod.url_producto && (
                    <a
                      href={prod.url_producto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver en proveedor original
                    </a>
                  )}

                  {/* Materiales */}
                  {prod.materiales?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prod.materiales.map((m) => (
                        <span key={m.id} className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-[10px] flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-amber-500" />
                          {m.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tabla de Variantes */}
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Variantes de Stock
                    </h4>
                    <div className="overflow-hidden border border-zinc-800 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                          <tr>
                            <th className="py-2 px-3">Color</th>
                            <th className="py-2 px-3">Talle</th>
                            <th className="py-2 px-3 text-right">Stock</th>
                            <th className="py-2 px-3 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-[11px]">
                          {prod.variantes.map((v) => (
                            <tr key={v.id} className="bg-zinc-900/60">
                              <td className="py-2 px-3 font-semibold text-white">{v.color}</td>
                              <td className="py-2 px-3 text-zinc-300">{v.talle_medida}</td>
                              <td className={`py-2 px-3 text-right font-black ${
                                v.stock > 2 ? 'text-emerald-400' : v.stock > 0 ? 'text-amber-400' : 'text-rose-500'
                              }`}>
                                {v.stock}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => openEditVariant(v, prod.nombre, e)}
                                    className="p-1 rounded-md bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 transition"
                                    title="Editar variante"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'variante', id: v.id, nombre: `${v.color} / ${v.talle_medida}` }); }}
                                    className="p-1 rounded-md bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition"
                                    title="Eliminar variante"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Editar Producto
      ══════════════════════════════════════════════════════ */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                Editar Producto
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  value={editForm.nombre}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Categoría</label>
                  <select
                    value={editForm.categoria}
                    onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Género</label>
                  <select
                    value={editForm.genero}
                    onChange={e => setEditForm(f => ({ ...f, genero: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {GENEROS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Costo en Origen</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.costo_moneda_origen}
                    onChange={e => setEditForm(f => ({ ...f, costo_moneda_origen: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Moneda</label>
                  <select
                    value={editForm.moneda_compra}
                    onChange={e => setEditForm(f => ({ ...f, moneda_compra: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="USD">USD — Dólar</option>
                    <option value="BRL">BRL — Real</option>
                    <option value="CNY">CNY — Yuan</option>
                    <option value="ARS">ARS — Peso Arg.</option>
                    <option value="PYG">PYG — Guaraní</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Precio Venta (Gs.)</label>
                  <input
                    type="number"
                    required
                    value={editForm.precio_venta}
                    onChange={e => setEditForm(f => ({ ...f, precio_venta: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Peso (gramos)</label>
                  <input
                    type="number"
                    value={editForm.peso_gramos}
                    onChange={e => setEditForm(f => ({ ...f, peso_gramos: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">URL del Proveedor <span className="text-zinc-500 font-normal">(opcional)</span></label>
                <input
                  type="url"
                  placeholder="https://www.aliexpress.com/item/..."
                  value={editForm.url_producto}
                  onChange={e => setEditForm(f => ({ ...f, url_producto: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {savingEdit ? 'Guardando...' : 'GUARDAR CAMBIOS'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Editar Variante (Color / Talle / Stock)
      ══════════════════════════════════════════════════════ */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" />
                  Editar Variante
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">{editingVariant.prodNombre}</p>
              </div>
              <button onClick={() => setEditingVariant(null)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Color</label>
                  <input
                    type="text"
                    required
                    value={variantForm.color}
                    onChange={e => setVariantForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Talle / Medida</label>
                  <input
                    type="text"
                    required
                    value={variantForm.talle_medida}
                    onChange={e => setVariantForm(f => ({ ...f, talle_medida: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Stock disponible</label>
                {/* Control +/- con input */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVariantForm(f => ({ ...f, stock: Math.max(0, parseInt(f.stock || 0) - 1) }))}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={variantForm.stock}
                    onChange={e => setVariantForm(f => ({ ...f, stock: e.target.value }))}
                    className="flex-1 text-center px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xl font-black text-white focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVariantForm(f => ({ ...f, stock: parseInt(f.stock || 0) + 1 }))}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 text-center">
                  Stock anterior: <b className="text-zinc-300">{editingVariant.stock}</b>
                </p>
              </div>

              <button
                type="submit"
                disabled={savingVariant}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {savingVariant ? 'Guardando...' : 'GUARDAR VARIANTE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmar Eliminación
      ══════════════════════════════════════════════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">¿Eliminar {confirmDelete.type === 'producto' ? 'producto' : 'variante'}?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                <b className="text-zinc-200">"{confirmDelete.nombre}"</b>
                {confirmDelete.type === 'producto'
                  ? ' y todas sus variantes serán eliminadas permanentemente.'
                  : ' será eliminada permanentemente.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          MODAL — Nuevo Producto
      ══════════════════════════════════════════════════════ */}
      {showNuevoProductoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Agregar Nuevo Producto
              </h3>
              <button onClick={() => setShowNuevoProductoModal(false)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNuevoProducto} className="space-y-4">
              {/* Foto del Producto (Opcional) */}
              <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-4 bg-zinc-950/40">
                <span className="text-xs font-semibold text-zinc-300 mb-2">Foto del Producto (Opcional)</span>
                <label className="relative cursor-pointer group flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-amber-500 overflow-hidden bg-zinc-950 transition">
                  {nuevoProductoFotoPreview ? (
                    <>
                      <img src={nuevoProductoFotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-amber-400 transition">
                      <Camera className="w-6 h-6 stroke-[1.8]" />
                      <span className="text-[9px] mt-1 font-bold">Cámara</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleNuevoProductoFotoChange}
                    className="hidden"
                  />
                </label>
                {nuevoProductoFoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setNuevoProductoFoto(null);
                      setNuevoProductoFotoPreview(null);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold mt-2 flex items-center gap-0.5"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anillo Sello Leon Acero"
                  value={nuevoProductoForm.nombre}
                  onChange={e => setNuevoProductoForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Categoría</label>
                  <select
                    value={nuevoProductoForm.categoria}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Género</label>
                  <select
                    value={nuevoProductoForm.genero}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, genero: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {GENEROS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Proveedor Principal</label>
                  <select
                    value={nuevoProductoForm.proveedor}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, proveedor: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    {proveedores.length === 0 && <option value="Shein">Shein</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Costo Origen</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej: 1.90"
                    value={nuevoProductoForm.costo_moneda_origen}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, costo_moneda_origen: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Moneda Compra</label>
                  <select
                    value={nuevoProductoForm.moneda_compra}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, moneda_compra: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="USD">USD — Dólares</option>
                    <option value="BRL">BRL — Reales</option>
                    <option value="CNY">CNY — Yuanes</option>
                    <option value="ARS">ARS — Pesos Arg.</option>
                    <option value="PYG">PYG — Guaraníes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Peso (gramos)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 15"
                    value={nuevoProductoForm.peso_gramos}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, peso_gramos: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Precio Venta (Gs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 45000"
                    value={nuevoProductoForm.precio_venta}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, precio_venta: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Enlace del Proveedor</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={nuevoProductoForm.url_origen}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, url_origen: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Sección Variante Inicial */}
              <div className="border-t border-zinc-800 pt-3.5">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Variante Inicial de Stock
                </h4>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Color</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Dorado, Negro, Único"
                      value={nuevoProductoForm.color}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, color: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Talle / Medida</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Talle 8, 45cm, Ajustable"
                      value={nuevoProductoForm.talle_medida}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, talle_medida: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Stock Inicial</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoProductoForm(f => ({ ...f, stock: Math.max(0, parseInt(f.stock || 0) - 1).toString() }))}
                      className="w-10 h-10 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      required
                      value={nuevoProductoForm.stock}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, stock: e.target.value }))}
                      className="flex-1 text-center px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xl font-black text-white focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNuevoProductoForm(f => ({ ...f, stock: (parseInt(f.stock || 0) + 1).toString() }))}
                      className="w-10 h-10 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingNuevoProducto}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingNuevoProducto ? 'Creando Producto...' : 'CREAR PRODUCTO Y VARIANTES'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
