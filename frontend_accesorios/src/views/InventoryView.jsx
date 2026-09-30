import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search, Gem, Sparkles, ChevronDown, ChevronUp,
  Tag, DollarSign, Layers, Pencil, Trash2, X,
  Plus, Minus, Check, AlertTriangle, ExternalLink, Camera,
} from 'lucide-react';
import {
  updateProducto, deleteProducto,
  createVariante, updateVariante, deleteVariante,
  uploadFotoProducto, fetchProveedores, fetchMateriales, createMaterial,
  bulkUploadProductos, uploadFotoVariante,
  uploadFotoGaleria, addFotoUrlGaleria, deleteFotoGaleria,
} from '../services/api';
import { formatGsInput, parseGsInput } from '../currency';

const CATEGORIAS = [
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

const GENEROS = [
  { id: 'M', label: 'Caballero' },
  { id: 'F', label: 'Dama' },
  { id: 'U', label: 'Unisex' },
];

export default function InventoryView({ productos = [], alertFilter, onClearAlertFilter, onOpenBulkUpload, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Modal editar producto
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal editar variante
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({});
  const [savingVariant, setSavingVariant] = useState(false);

  // Modal agregar nueva variante a producto existente
  const [addingVariantToProd, setAddingVariantToProd] = useState(null);
  const [newVariantForm, setNewVariantForm] = useState({ color: 'Único', talle_medida: 'Ajustable', stock: 1 });
  const [savingNewVariant, setSavingNewVariant] = useState(false);

  // Modal confirmar borrado
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'producto'|'variante', id, nombre }
  const [deleting, setDeleting] = useState(false);

  // Edición rápida de precio inline
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');
  const [savingQuickPrice, setSavingQuickPrice] = useState(false);

  // Subida de foto
  const [uploadingFotoId, setUploadingFotoId] = useState(null);
  const fotoInputRef = useRef(null);
  const [pendingFotoProductoId, setPendingFotoProductoId] = useState(null);
  const [uploadingVariantPhotoId, setUploadingVariantPhotoId] = useState(null);
  const variantPhotoInputRef = useRef(null);
  const [pendingVariantPhotoId, setPendingVariantPhotoId] = useState(null);

  // Subida de fotos de galería adicional
  const [uploadingGalleryProdId, setUploadingGalleryProdId] = useState(null);
  const galleryInputRef = useRef(null);
  const [pendingGalleryProdId, setPendingGalleryProdId] = useState(null);
  const [addGalleryUrlModal, setAddGalleryUrlModal] = useState(null); // prod object
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [savingGalleryUrl, setSavingGalleryUrl] = useState(false);

  // Materiales y Proveedores
  const [materialesList, setMaterialesList] = useState([]);

  useEffect(() => {
    fetchMateriales().then(mats => setMaterialesList(mats || [])).catch(() => {});
    fetchProveedores().then(provs => setProveedores(provs || [])).catch(() => {});
  }, []);

  // Modal Nuevo Producto manual
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [nuevoProductoFoto, setNuevoProductoFoto] = useState(null);
  const [nuevoProductoFotoPreview, setNuevoProductoFotoPreview] = useState(null);
  const nuevoProductoFotoInputRef = useRef(null);
  const [nuevoProductoForm, setNuevoProductoForm] = useState({
    nombre: '',
    categoria: 'AN',
    genero: 'U',
    proveedor: '',
    materiales: 'Acero Quirurgico',
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

  // Manejo de cámara y fotos
  const handleFotoClick = (prodId, e) => {
    e.stopPropagation();
    setPendingFotoProductoId(prodId);
    fotoInputRef.current?.click();
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingFotoProductoId) return;
    e.target.value = '';
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

  const handleNuevoProductoFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNuevoProductoFoto(file);
    setNuevoProductoFotoPreview(URL.createObjectURL(file));
  };

  const handleVariantPhotoClick = (variantId, e) => {
    e.stopPropagation();
    setPendingVariantPhotoId(variantId);
    variantPhotoInputRef.current?.click();
  };

  const handleVariantPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingVariantPhotoId) return;
    e.target.value = '';
    setUploadingVariantPhotoId(pendingVariantPhotoId);
    try {
      await uploadFotoVariante(pendingVariantPhotoId, file);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al subir la foto de la variante: ' + err.message);
    } finally {
      setUploadingVariantPhotoId(null);
      setPendingVariantPhotoId(null);
    }
  };

  const handleGalleryFotoClick = (prodId, e) => {
    e.stopPropagation();
    setPendingGalleryProdId(prodId);
    galleryInputRef.current?.click();
  };

  const handleGalleryFotoChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !pendingGalleryProdId) return;
    const prodId = pendingGalleryProdId;
    e.target.value = '';
    setUploadingGalleryProdId(prodId);
    try {
      await uploadFotoGaleria(prodId, files);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al subir fotos a la galería: ' + err.message);
    } finally {
      setUploadingGalleryProdId(null);
      setPendingGalleryProdId(null);
    }
  };

  const handleDeleteGalleryFoto = async (imgId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar esta foto de la galería?')) return;
    try {
      await deleteFotoGaleria(imgId);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al eliminar foto: ' + err.message);
    }
  };

  const handleOpenAddGalleryUrlModal = (prod, e) => {
    e.stopPropagation();
    setAddGalleryUrlModal(prod);
    setGalleryUrlInput('');
  };

  const handleSaveGalleryUrl = async (e) => {
    e.preventDefault();
    if (!addGalleryUrlModal || !galleryUrlInput.trim()) return;
    setSavingGalleryUrl(true);
    try {
      await addFotoUrlGaleria(addGalleryUrlModal.id, galleryUrlInput.trim());
      setAddGalleryUrlModal(null);
      setGalleryUrlInput('');
      if (onReload) onReload();
    } catch (err) {
      alert('Error al agregar foto por URL: ' + err.message);
    } finally {
      setSavingGalleryUrl(false);
    }
  };

  // Abrir modal de nuevo producto
  const handleOpenNuevoProducto = async () => {
    setShowNuevoProductoModal(true);
    setNuevoProductoFoto(null);
    setNuevoProductoFotoPreview(null);
    try {
      const [provs, mats] = await Promise.all([
        fetchProveedores().catch(() => []),
        fetchMateriales().catch(() => [])
      ]);
      setProveedores(provs);
      setMaterialesList(mats);
      if (provs.length > 0) {
        setNuevoProductoForm(f => ({ ...f, proveedor: provs[0].nombre }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Guardar nuevo producto manual
  const handleSaveNuevoProducto = async (e) => {
    e.preventDefault();
    setSavingNuevoProducto(true);
    try {
      const res = await bulkUploadProductos([
        {
          nombre: nuevoProductoForm.nombre.trim(),
          categoria: nuevoProductoForm.categoria,
          genero: nuevoProductoForm.genero,
          proveedor: nuevoProductoForm.proveedor || 'Shein',
          materiales: nuevoProductoForm.materiales || 'Acero Quirurgico',
          costo_moneda_origen: parseFloat(nuevoProductoForm.costo_moneda_origen) || 0,
          moneda_compra: nuevoProductoForm.moneda_compra,
          peso_gramos: parseInt(nuevoProductoForm.peso_gramos) || 15,
          precio_venta: parseGsInput(nuevoProductoForm.precio_venta),
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
        materiales: 'Acero Quirurgico',
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

  // Filtrar y mostrar solo categorías que tienen al menos 1 producto registrado (+ 'Todo')
  const availableCategories = useMemo(() => {
    const existingCats = new Set(productos.map(p => p.categoria));
    return CATEGORIAS.filter(c => existingCats.has(c.id));
  }, [productos]);

  const alertType = typeof alertFilter === 'string' ? alertFilter : alertFilter?.type;
  const alertVariantIds = new Set(
    alertFilter && typeof alertFilter === 'object' ? alertFilter.variantIds || [] : []
  );
  const isOutOfStockAlert = alertType === 'agotados';
  const hasActiveFilters = searchTerm.trim() !== '' || selectedCategory !== 'ALL' || selectedGender !== 'ALL' || Boolean(alertType);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedGender('ALL');
    if (onClearAlertFilter) onClearAlertFilter();
  };

  // Filtrado de productos con Búsqueda Inteligente
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return productos.filter((p) => {
      const matchesSearch = !term ||
        p.nombre?.toLowerCase().includes(term) ||
        p.variantes?.some(v => v.sku?.toLowerCase().includes(term) || v.color?.toLowerCase().includes(term));
      
      const matchesCat = (!term && selectedCategory !== 'ALL') ? p.categoria === selectedCategory : (selectedCategory === 'ALL' || p.categoria === selectedCategory);
      const matchesGen = selectedGender === 'ALL' || p.genero === selectedGender;
      const activeVariants = (p.variantes || []).filter((variant) => variant.activo !== false);
      const activeStock = activeVariants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
      const matchesAlert =
        !alertType ||
        (isOutOfStockAlert && activeVariants.length > 0 && activeStock === 0) ||
        (!isOutOfStockAlert && activeVariants.some((variant) => alertVariantIds.has(variant.id)));
      return matchesSearch && matchesCat && matchesGen && matchesAlert;
    });
  }, [productos, searchTerm, selectedCategory, selectedGender, alertType, isOutOfStockAlert, alertFilter]);

  const alertInfo = {
    agotados: {
      title: 'Productos agotados',
      description: 'Se muestran solo los modelos sin unidades disponibles.',
      tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      button: 'border-rose-500/30 text-rose-200 hover:bg-rose-500/10',
    },
    stock_bajo: {
      title: 'Stock bajo',
      description: 'Se muestran solo los productos con variantes de 1 o 2 unidades.',
      tone: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
      button: 'border-amber-500/30 text-amber-100 hover:bg-amber-500/10',
    },
    sin_movimiento: {
      title: 'Productos sin ventas',
      description: 'Se muestran los productos con variantes sin ventas recientes.',
      tone: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
      button: 'border-blue-500/30 text-blue-100 hover:bg-blue-500/10',
    },
  }[alertType];

  const totalStockUnits = productos.reduce((acc, p) => acc + (p.stock_total || 0), 0);
  // Valuación sumando variante por variante con precio efectivo (respeta precios específicos por variante)
  const totalValuation = productos.reduce((acc, p) => {
    if (p.variantes && p.variantes.length > 0) {
      return acc + p.variantes.reduce((vAcc, v) => vAcc + ((v.stock || 0) * (v.precio_venta_pyg || p.precio_venta || 0)), 0);
    }
    return acc + ((p.stock_total || 0) * (p.precio_venta || 0));
  }, 0);
  const totalCostValuation = productos.reduce((acc, p) => {
    if (p.variantes && p.variantes.length > 0) {
      return acc + p.variantes.reduce((vAcc, v) => vAcc + ((v.stock || 0) * (v.costo_pyg || p.costo_pyg || 0)), 0);
    }
    return acc + ((p.stock_total || 0) * (p.costo_pyg || 0));
  }, 0);
  const totalProfitPotential = totalValuation - totalCostValuation;
  const averageProfitMargin = totalValuation > 0 ? Math.round((totalProfitPotential / totalValuation) * 100) : 0;

  const toggleExpand = (id) => setExpandedProduct(expandedProduct === id ? null : id);

  const openQuickPrice = (prod, e) => {
    e.stopPropagation();
    setEditingPriceId(prod.id);
    setEditingPriceVal(formatGsInput(prod.precio_venta));
  };

  const handleQuickPriceSave = async (prodId, e) => {
    if (e) e.stopPropagation();
    const newPrice = parseGsInput(editingPriceVal);
    if (editingPriceVal === '' || newPrice < 0) {
      alert('Ingresá un precio válido en Guaraníes');
      return;
    }
    setSavingQuickPrice(true);
    try {
      await updateProducto(prodId, { precio_venta: newPrice });
      setEditingPriceId(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al actualizar precio: ' + err.message);
    } finally {
      setSavingQuickPrice(false);
    }
  };

  // ── Editar Producto ──────────────────────────────────────────
  const openEditProduct = (prod, e) => {
    e.stopPropagation();
    setEditingProduct(prod);
    const currentMatId = (prod.materiales && prod.materiales.length > 0) ? prod.materiales[0].id : '';
    setEditForm({
      nombre: prod.nombre,
      categoria: prod.categoria,
      genero: prod.genero,
      material_id: currentMatId,
      costo_moneda_origen: prod.costo_moneda_origen || '',
      moneda_compra: prod.moneda_compra || 'USD',
      peso_gramos: prod.peso_gramos || 15,
      precio_venta: formatGsInput(prod.precio_venta),
      url_producto: prod.url_producto || '',
    });
    if (materialesList.length === 0) {
      fetchMateriales().then(mats => setMaterialesList(mats || [])).catch(() => {});
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        nombre: editForm.nombre,
        categoria: editForm.categoria,
        genero: editForm.genero,
        costo_moneda_origen: parseFloat(editForm.costo_moneda_origen) || null,
        moneda_compra: editForm.moneda_compra,
        peso_gramos: parseInt(editForm.peso_gramos) || 15,
        precio_venta: parseGsInput(editForm.precio_venta),
        url_producto: editForm.url_producto || '',
        materiales_ids: editForm.material_id ? [parseInt(editForm.material_id)] : [],
      };
      await updateProducto(editingProduct.id, payload);
      setEditingProduct(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar producto: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Editar Variante ──────────────────────────────────────────
  const openEditVariant = (v, e) => {
    e.stopPropagation();
    setEditingVariant(v);
    setVariantForm({
      color: v.color,
      talle_medida: v.talle_medida,
      stock: v.stock,
      precio_venta: v.precio_venta !== null && v.precio_venta !== undefined ? formatGsInput(v.precio_venta) : '',
    });
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    setSavingVariant(true);
    try {
      const precioVentaNum = variantForm.precio_venta !== '' && variantForm.precio_venta !== null 
        ? parseGsInput(variantForm.precio_venta)
        : null;

      await updateVariante(editingVariant.id, {
        color: variantForm.color,
        talle_medida: variantForm.talle_medida,
        stock: parseInt(variantForm.stock) || 0,
        precio_venta: precioVentaNum,
      });
      setEditingVariant(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al guardar variante: ' + err.message);
    } finally {
      setSavingVariant(false);
    }
  };

  // ── Agregar Nueva Variante ────────────────────────────────────
  const openAddVariant = (prod, e) => {
    e.stopPropagation();
    setAddingVariantToProd(prod);
    setNewVariantForm({ color: 'Único', talle_medida: 'Ajustable', stock: 1, precio_venta: '' });
  };

  const handleSaveNewVariant = async (e) => {
    e.preventDefault();
    if (!addingVariantToProd) return;
    setSavingNewVariant(true);
    try {
      const precioVentaNum = newVariantForm.precio_venta !== '' && newVariantForm.precio_venta !== null 
        ? parseGsInput(newVariantForm.precio_venta)
        : null;

      await createVariante({
        producto: addingVariantToProd.id,
        color: newVariantForm.color.trim() || 'Único',
        talle_medida: newVariantForm.talle_medida.trim() || 'Ajustable',
        stock: parseInt(newVariantForm.stock) || 0,
        precio_venta: precioVentaNum,
      });
      setAddingVariantToProd(null);
      if (onReload) onReload();
    } catch (err) {
      alert('Error al agregar variante: ' + err.message);
    } finally {
      setSavingNewVariant(false);
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
  const quickStock = async (variante, delta, e) => {
    e.stopPropagation();
    const newStock = Math.max(0, (variante.stock || 0) + delta);
    try {
      await updateVariante(variante.id, { stock: newStock });
      if (onReload) onReload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-black dark:text-white" />
            Catálogo & Control de Stock
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Mostrando <b className="text-stone-900 dark:text-white">{filtered.length}</b> de {productos.length} modelos
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenNuevoProducto}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-black dark:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>
          {onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          )}
        </div>
      </div>

      {alertInfo && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-xs ${alertInfo.tone}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><b>{alertInfo.title}:</b> {alertInfo.description}</span>
          </div>
          <button
            onClick={onClearAlertFilter}
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 font-bold ${alertInfo.button}`}
          >
            Ver todo
          </button>
        </div>
      )}

      {/* ── Totales & Valuación ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stock Total */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
              Stock Total
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
              {productos.length} modelos
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
              {totalStockUnits} <span className="text-sm font-semibold text-stone-500 dark:text-zinc-400">unidades</span>
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
              Costo inversión: <b className="text-stone-700 dark:text-zinc-300">Gs. {totalCostValuation.toLocaleString('es-PY')}</b>
            </p>
          </div>
        </div>

        {/* Valor en Venta & Ganancia Potencial */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              Valor en Venta
            </span>
            {totalValuation > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                +Gs. {totalProfitPotential.toLocaleString('es-PY')} ganancia · {averageProfitMargin}% margen promedio
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
              Gs. {totalValuation.toLocaleString('es-PY')}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
              Retorno total estimado al 100% de venta
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros Inteligentes ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, color o SKU... (Esc para limpiar)"
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

        {/* Categorías (Filtro Principal con solo categorías activas + scroll fade) */}
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto scroll-smooth pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              Todo
            </button>
            {availableCategories.map((c) => (
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
            <button
              onClick={() => setSelectedGender('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition shrink-0 ${
                selectedGender === 'ALL'
                  ? 'bg-neutral-800 text-white dark:bg-zinc-200 dark:text-black shadow-sm'
                  : 'bg-neutral-100 dark:bg-zinc-900/80 text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-neutral-200/80 dark:border-zinc-800/80'
              }`}
            >
              Todos
            </button>
            {GENEROS.map((g) => (
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

      {/* iOS y Android muestran su selector nativo: fototeca, cámara o archivos. */}
      <input
        ref={fotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFotoChange}
      />
      <input
        ref={variantPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleVariantPhotoChange}
      />
      <input
        ref={nuevoProductoFotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNuevoProductoFotoChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryFotoChange}
      />

      {/* ── Lista de Productos ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-zinc-600 text-xs py-10">Sin resultados para "{searchTerm}"</p>
        )}

        {filtered.map((prod) => {
          const isExpanded = expandedProduct === prod.id;
          const isUploading = uploadingFotoId === prod.id;
          const totalStock = prod.stock_total || 0;
          const missingVariants = (prod.variantes || []).filter(
            (variant) => variant.activo !== false && Number(variant.stock) === 0
          );
          const alertVariants = isOutOfStockAlert
            ? missingVariants
            : (prod.variantes || []).filter((variant) => alertVariantIds.has(variant.id));
          const displayedVariants = alertType ? alertVariants : (prod.variantes || []);

          return (
            <div
              key={prod.id}
              className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 transition hover:border-[#d6cebf] dark:border-zinc-700"
            >
              {/* ── Fila principal ── */}
              <div
                onClick={() => toggleExpand(prod.id)}
                className="flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail con botón de cámara */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                      {prod.imagen_url_completa ? (
                        <img src={prod.imagen_url_completa} alt={prod.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <Gem className="w-6 h-6 text-zinc-700" />
                      )}
                    </div>
                    <button
                      onClick={(e) => handleFotoClick(prod.id, e)}
                      disabled={isUploading}
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition
                        ${prod.imagen_url_completa
                          ? 'bg-zinc-700 hover:bg-amber-500 text-stone-700 dark:text-zinc-300 hover:text-zinc-950'
                          : 'bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm'
                        } ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                      title={prod.imagen_url_completa ? 'Reemplazar foto' : 'Agregar foto'}
                    >
                      {isUploading ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-black dark:text-white text-[10px] font-bold">
                        {prod.categoria_display || prod.categoria} • {prod.genero_display || prod.genero}
                      </span>
                      {prod.materiales && prod.materiales.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 text-[10px] font-medium border border-neutral-200 dark:border-zinc-700">
                          {prod.materiales.map(m => m.nombre).join(', ')}
                        </span>
                      )}
                      {prod.proveedor_nombre && (
                        <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                          Prov: <b className="text-zinc-200">{prod.proveedor_nombre}</b>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-1">{prod.nombre}</h3>
                    {alertType && alertVariants.length > 0 && (
                      <p className={`mt-1 text-[10px] leading-relaxed ${
                        isOutOfStockAlert ? 'text-rose-300' :
                        alertType === 'stock_bajo' ? 'text-amber-300' : 'text-blue-300'
                      }`}>
                        <b>{isOutOfStockAlert ? 'Falta' : 'Variantes relevantes'}:</b>{' '}
                        {alertVariants.map((variant) => `${variant.color || 'Sin color'} · ${variant.talle_medida || 'Único'} (${variant.stock} u.)`).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {editingPriceId === prod.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-700 px-2 py-1 rounded-xl shadow-md"
                        >
                          <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">Gs.</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={editingPriceVal}
                            onChange={(e) => setEditingPriceVal(formatGsInput(e.target.value))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickPriceSave(prod.id, e);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            className="w-24 px-1.5 py-0.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-white font-black text-xs border border-neutral-300 dark:border-zinc-700 rounded-lg outline-none text-right"
                          />
                          <button
                            onClick={(e) => handleQuickPriceSave(prod.id, e)}
                            disabled={savingQuickPrice}
                            className="p-1 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition"
                            title="Guardar precio (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingPriceId(null); }}
                            className="p-1 rounded-lg bg-neutral-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:opacity-80 transition"
                            title="Cancelar (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => openQuickPrice(prod, e)}
                          className="group/price flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-zinc-800/80 hover:bg-neutral-200 dark:hover:bg-zinc-700 border border-neutral-200/80 dark:border-zinc-700/80 transition"
                          title="Clic para cambiar precio rápido"
                        >
                          <span className="text-xs font-black text-stone-900 dark:text-white">
                            Gs. {prod.precio_venta?.toLocaleString('es-PY')}
                          </span>
                          <Pencil className="w-2.5 h-2.5 text-stone-400 dark:text-zinc-500 group-hover/price:text-stone-900 dark:group-hover/price:text-white transition" />
                        </button>
                      )}

                      {prod.costo_pyg > 0 && (
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                          (Costo: Gs. {prod.costo_pyg?.toLocaleString('es-PY')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    totalStock > 3 ? 'bg-emerald-500/20 text-emerald-400' :
                    totalStock > 0 ? 'bg-amber-500/20 text-black dark:text-white' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {totalStock} u.
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditProduct(prod, e)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-stone-500 dark:text-zinc-400 hover:text-black dark:text-white transition"
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'producto', id: prod.id, nombre: prod.nombre }); }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-stone-500 dark:text-zinc-400 transition"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-stone-400 dark:text-zinc-500 hover:text-stone-900 dark:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Detalle desplegable: Variantes por Color y Talle ── */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-zinc-800/80 space-y-3 text-xs animate-in fade-in-50">
                  {/* Ficha técnica y Enlaces */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/60 text-[11px]">
                    <div>
                      <span className="text-stone-400 dark:text-zinc-500 block">Costo FOB</span>
                      <span className="font-semibold text-zinc-200">
                        {prod.costo_moneda_origen ? `${prod.costo_moneda_origen} ${prod.moneda_compra}` : 'No definido'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 dark:text-zinc-500 block">Peso</span>
                      <span className="font-semibold text-zinc-200">{prod.peso_gramos}g</span>
                    </div>
                    <div>
                      <span className="text-stone-400 dark:text-zinc-500 block">Margen Ganancia</span>
                      <span className="font-semibold text-emerald-400">+{prod.margen_porcentaje || 0}%</span>
                    </div>
                    <div>
                      <span className="text-stone-400 dark:text-zinc-500 block">Enlace Proveedor</span>
                      {prod.url_producto ? (
                        <a
                          href={prod.url_producto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black dark:text-white hover:underline flex items-center gap-1 font-semibold truncate"
                        >
                          Ver en tienda <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-zinc-600">Sin link</span>
                      )}
                    </div>
                  </div>

                  {/* Historial de Proveedores y Compras */}
                  <div className="p-3 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/60 text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-black dark:text-white" />
                        Historial de Proveedores & Tiendas
                      </span>
                      <span className="text-[10px] text-black dark:text-white font-bold">
                        Actual: {prod.proveedor_nombre}
                      </span>
                    </div>

                    {prod.proveedores_historial && prod.proveedores_historial.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {prod.proveedores_historial.map((h, hIdx) => (
                          <div key={hIdx} className="flex items-center justify-between bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/80 px-2.5 py-1.5 rounded-lg text-stone-700 dark:text-zinc-300">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="font-semibold text-stone-900 dark:text-white">{h.proveedor}</span>
                              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">({h.lote_nombre})</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              {h.fecha && <span className="text-stone-400 dark:text-zinc-500">{h.fecha}</span>}
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-black dark:text-white font-bold">
                                {h.cantidad} u.
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-400 dark:text-zinc-500 italic">
                        Sin lotes previos. Proveedor de referencia: <b className="text-stone-700 dark:text-zinc-300">{prod.proveedor_nombre}</b>.
                      </p>
                    )}
                  </div>

                  {/* ── Galería de Fotos Adicionales (Carrusel de la Tienda) ── */}
                  <div className="p-3 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-black dark:text-white" />
                            Galería de Fotos Adicionales ({prod.imagenes_galeria?.length || 0})
                          </span>
                          <p className="text-[10px] text-stone-400 dark:text-zinc-500">
                            Fotos extras que el cliente podrá deslizar en la tienda (puesto, zoom, empaque).
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={(e) => handleGalleryFotoClick(prod.id, e)}
                            disabled={uploadingGalleryProdId === prod.id}
                            className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold flex items-center gap-1 hover:opacity-90 transition disabled:opacity-50 active:scale-95 shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{uploadingGalleryProdId === prod.id ? 'Subiendo...' : 'Subir Fotos'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenAddGalleryUrlModal(prod, e)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition active:scale-95"
                            title="Agregar foto pegando un enlace externo"
                          >
                            <span>+ Enlace URL</span>
                          </button>
                        </div>
                      </div>

                      {/* Miniaturas de fotos adicionales */}
                      {prod.imagenes_galeria && prod.imagenes_galeria.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {prod.imagenes_galeria.map((img) => (
                            <div
                              key={img.id}
                              className="relative group/gal w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm flex-shrink-0"
                            >
                              <img
                                src={img.url || img.imagen_url}
                                alt="Foto adicional"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => handleDeleteGalleryFoto(img.id, e)}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover/gal:opacity-100 flex items-center justify-center text-rose-400 transition"
                                title="Eliminar esta foto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 dark:text-zinc-500 italic">
                          Este accesorio solo tiene su foto principal. Hacé clic en "Subir Fotos" o "+ Enlace URL" para agregar fotos al carrusel.
                        </p>
                      )}
                    </div>

                    {/* Variantes (Talles y Colores) */}
                    <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                        {alertType ? 'Variantes relevantes' : 'Variantes & Stock Físico'} ({displayedVariants.length})
                      </h4>
                      <button
                        onClick={(e) => openAddVariant(prod, e)}
                        className="text-[11px] font-bold text-black dark:text-white hover:text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Variante
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {displayedVariants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-xl border border-neutral-200 dark:border-zinc-800/50 hover:border-[#d6cebf] dark:border-zinc-700 transition"
                        >
                          <div className="flex items-center gap-2">
                            {/* Thumbnail de imagen del color */}
                            {v.imagen_url ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#d6cebf] dark:border-zinc-700 flex-shrink-0">
                                <img src={v.imagen_url} alt={v.color} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-stone-900 dark:text-white mr-1.5">{v.color}</span>
                              <span className="text-stone-500 dark:text-zinc-400 text-[11px]">{v.talle_medida}</span>
                              {v.sku && (
                                <span className="ml-2 font-mono text-[9px] text-stone-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
                                  {v.sku}
                                </span>
                              )}
                              {v.precio_venta && v.precio_venta > 0 && v.precio_venta !== prod.precio_venta && (
                                <span className="ml-2 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  Gs. {v.precio_venta.toLocaleString('es-PY')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Control rápido +/- */}
                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 rounded-lg p-0.5 border border-neutral-200 dark:border-zinc-800">
                              <button
                                onClick={(e) => quickStock(v, -1, e)}
                                disabled={v.stock <= 0}
                                className="w-6 h-6 rounded flex items-center justify-center text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white hover:bg-zinc-800 transition disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`w-7 text-center font-bold text-xs ${
                                v.stock > 0 ? 'text-stone-900 dark:text-white' : 'text-rose-400'
                              }`}>
                                {v.stock}
                              </span>
                              <button
                                onClick={(e) => quickStock(v, 1, e)}
                                className="w-6 h-6 rounded flex items-center justify-center text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white hover:bg-zinc-800 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={(e) => handleVariantPhotoClick(v.id, e)}
                              disabled={uploadingVariantPhotoId === v.id}
                              className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-black dark:hover:text-white disabled:opacity-50"
                              title="Cambiar foto de esta variante"
                            >
                              <Camera className={`w-3.5 h-3.5 ${uploadingVariantPhotoId === v.id ? 'animate-pulse' : ''}`} />
                            </button>

                            <button
                              onClick={(e) => openEditVariant(v, e)}
                              className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-black dark:text-white"
                              title="Editar variante"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'variante', id: v.id, nombre: `${v.color} / ${v.talle_medida}` }); }}
                              className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-rose-400"
                              title="Eliminar variante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {displayedVariants.length === 0 && (
                        <p className="text-zinc-600 text-xs py-2 text-center">
                          {alertType ? 'No hay variantes relevantes para esta alerta.' : 'Sin variantes cargadas. Hacé clic en "Agregar Variante".'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Nuevo Producto Manual
      ══════════════════════════════════════════════════════ */}
      {showNuevoProductoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Gem className="w-5 h-5 text-black dark:text-white" />
                Agregar Nuevo Producto
              </h3>
              <button onClick={() => setShowNuevoProductoModal(false)} className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNuevoProducto} className="space-y-4">
              {/* Foto del Producto (Opcional) */}
              <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800/40">
                <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-2">Foto del Producto (Opcional)</span>
                <button
                  type="button"
                  onClick={() => nuevoProductoFotoInputRef.current?.click()}
                  className="relative cursor-pointer group flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-dashed border-[#d6cebf] dark:border-zinc-700 hover:border-amber-500 overflow-hidden bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 transition"
                  aria-label="Elegir fuente de foto"
                >
                  {nuevoProductoFotoPreview ? (
                    <>
                      <img src={nuevoProductoFotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="w-5 h-5 text-stone-900 dark:text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 dark:text-zinc-500 group-hover:text-black dark:text-white transition">
                      <Camera className="w-6 h-6 stroke-[1.8]" />
                      <span className="text-[9px] mt-1 font-bold">Cámara</span>
                    </div>
                  )}
                </button>
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
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anillo Ares Biselado"
                  value={nuevoProductoForm.nombre}
                  onChange={e => setNuevoProductoForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Categoría</label>
                  <select
                    value={nuevoProductoForm.categoria}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Género</label>
                  <select
                    value={nuevoProductoForm.genero}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, genero: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {GENEROS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Proveedor Principal</label>
                  <select
                    value={nuevoProductoForm.proveedor}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, proveedor: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    {proveedores.length === 0 && <option value="Shein">Shein</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Material</label>
                  <select
                    value={nuevoProductoForm.materiales}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, materiales: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {materialesList.map(m => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                    {materialesList.length === 0 && (
                      <>
                        <option value="Acero Quirurgico">Acero Quirurgico</option>
                        <option value="Acero Inoxidable 316L">Acero Inoxidable 316L</option>
                        <option value="Plata 925">Plata 925</option>
                        <option value="Cuero PU">Cuero PU</option>
                        <option value="Aleacion de Zinc (Bijou)">Aleacion de Zinc (Bijou)</option>
                        <option value="Piedra">Piedra</option>
                        <option value="Hilo">Hilo</option>
                        <option value="Metal">Metal</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Costo Origen</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej: 1.90"
                    value={nuevoProductoForm.costo_moneda_origen}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, costo_moneda_origen: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Moneda Compra</label>
                  <select
                    value={nuevoProductoForm.moneda_compra}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, moneda_compra: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="USD">USD — Dólares</option>
                    <option value="BRL">BRL — Reales</option>
                    <option value="CNY">CNY — Yuanes</option>
                    <option value="ARS">ARS — Pesos Arg.</option>
                    <option value="PYG">PYG — Guaraníes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Precio Venta (Gs.)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej: 45000"
                    value={nuevoProductoForm.precio_venta}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, precio_venta: formatGsInput(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Peso (gramos)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 15"
                    value={nuevoProductoForm.peso_gramos}
                    onChange={e => setNuevoProductoForm(f => ({ ...f, peso_gramos: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Enlace Proveedor</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={nuevoProductoForm.url_origen}
                  onChange={e => setNuevoProductoForm(f => ({ ...f, url_origen: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              {/* Variante Inicial */}
              <div className="border-t border-neutral-200 dark:border-zinc-800 pt-3.5">
                <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">
                  Variante Inicial de Stock
                </h4>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Color</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Dorado, Negro, Único"
                      value={nuevoProductoForm.color}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, color: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Talle / Medida</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Talle 8, 45cm, Ajustable"
                      value={nuevoProductoForm.talle_medida}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, talle_medida: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Stock Inicial</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoProductoForm(f => ({ ...f, stock: Math.max(0, parseInt(f.stock || 0) - 1).toString() }))}
                      className="w-10 h-10 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-stone-900 dark:text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      required
                      value={nuevoProductoForm.stock}
                      onChange={e => setNuevoProductoForm(f => ({ ...f, stock: e.target.value }))}
                      className="flex-1 text-center px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xl font-black text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNuevoProductoForm(f => ({ ...f, stock: (parseInt(f.stock || 0) + 1).toString() }))}
                      className="w-10 h-10 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-stone-900 dark:text-white font-bold flex items-center justify-center text-lg flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingNuevoProducto}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingNuevoProducto ? 'Creando Producto...' : 'CREAR PRODUCTO Y VARIANTES'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Editar Producto
      ══════════════════════════════════════════════════════ */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-black dark:text-white" />
                Editar Producto
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  value={editForm.nombre || ''}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Categoría</label>
                  <select
                    value={editForm.categoria || 'OT'}
                    onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Género</label>
                  <select
                    value={editForm.genero || 'U'}
                    onChange={e => setEditForm(f => ({ ...f, genero: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    {GENEROS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Costo en Origen (FOB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.costo_moneda_origen || ''}
                    onChange={e => setEditForm(f => ({ ...f, costo_moneda_origen: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Moneda Compra</label>
                  <select
                    value={editForm.moneda_compra || 'USD'}
                    onChange={e => setEditForm(f => ({ ...f, moneda_compra: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="PYG">PYG (Gs.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Precio Venta (Gs.)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={editForm.precio_venta || ''}
                    onChange={e => setEditForm(f => ({ ...f, precio_venta: formatGsInput(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Peso (gramos)</label>
                  <input
                    type="number"
                    value={editForm.peso_gramos || 15}
                    onChange={e => setEditForm(f => ({ ...f, peso_gramos: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Material</label>
                  <select
                    value={editForm.material_id || ''}
                    onChange={e => setEditForm(f => ({ ...f, material_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="">Sin especificar / Ninguno</option>
                    {materialesList.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Enlace del Proveedor</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editForm.url_producto || ''}
                    onChange={e => setEditForm(f => ({ ...f, url_producto: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingEdit ? 'Guardando Cambios...' : 'GUARDAR CAMBIOS'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Editar Variante
      ══════════════════════════════════════════════════════ */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">Editar Variante</h3>
              <button onClick={() => setEditingVariant(null)} className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Color</label>
                <input
                  type="text"
                  required
                  value={variantForm.color || ''}
                  onChange={e => setVariantForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Talle / Medida</label>
                <input
                  type="text"
                  required
                  value={variantForm.talle_medida || ''}
                  onChange={e => setVariantForm(f => ({ ...f, talle_medida: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Stock Disponible</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={variantForm.stock ?? 0}
                  onChange={e => setVariantForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-lg font-black text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none text-center"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block">Precio Específico (Gs.)</label>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium">Opcional</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Heredar del modelo padre"
                  value={variantForm.precio_venta ?? ''}
                  onChange={e => setVariantForm(f => ({ ...f, precio_venta: formatGsInput(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
                <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-1">
                  Dejar vacío para usar el precio base del modelo.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingVariant}
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingVariant ? 'Guardando...' : 'GUARDAR VARIANTE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Agregar Nueva Variante a Producto
      ══════════════════════════════════════════════════════ */}
      {addingVariantToProd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">Nueva Variante</h3>
                <p className="text-[11px] text-black dark:text-white truncate">{addingVariantToProd.nombre}</p>
              </div>
              <button onClick={() => setAddingVariantToProd(null)} className="p-1.5 rounded-full bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewVariant} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Color</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dorado, Negro, Plateado"
                  value={newVariantForm.color}
                  onChange={e => setNewVariantForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Talle / Medida</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Talle 8, 45cm, Ajustable"
                  value={newVariantForm.talle_medida}
                  onChange={e => setNewVariantForm(f => ({ ...f, talle_medida: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">Stock Inicial</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newVariantForm.stock}
                  onChange={e => setNewVariantForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-lg font-black text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none text-center"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block">Precio Específico (Gs.)</label>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium">Opcional</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Heredar del modelo padre"
                  value={newVariantForm.precio_venta ?? ''}
                  onChange={e => setNewVariantForm(f => ({ ...f, precio_venta: formatGsInput(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
                <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-1">
                  Dejar vacío para usar el precio base del modelo.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingNewVariant}
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {savingNewVariant ? 'Agregando...' : 'AGREGAR VARIANTE'}
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
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">¿Eliminar {confirmDelete.type === 'producto' ? 'producto' : 'variante'}?</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
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
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-stone-900 dark:text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          MODAL — Agregar Foto por URL a la Galería
      ══════════════════════════════════════════════════════ */}
      {addGalleryUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-black dark:text-white" />
                Agregar Foto por Enlace
              </h3>
              <button
                onClick={() => setAddGalleryUrlModal(null)}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryUrl} className="space-y-4">
              <div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mb-2">
                  Accesorio: <b className="text-stone-900 dark:text-white">{addGalleryUrlModal.nombre}</b>
                </p>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Enlace directo de la imagen (HTTPS)
                </label>
                <input
                  type="url"
                  required
                  autoFocus
                  placeholder="https://img.shein.com/.../foto.jpg"
                  value={galleryUrlInput}
                  onChange={e => setGalleryUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              {/* Vista previa de la foto */}
              {galleryUrlInput.trim().startsWith('http') && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-neutral-100 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 flex items-center justify-center relative">
                  <img
                    src={galleryUrlInput.trim()}
                    alt="Vista previa"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddGalleryUrlModal(null)}
                  className="flex-1 py-2.5 bg-neutral-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl text-xs hover:bg-neutral-200 dark:hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGalleryUrl || !galleryUrlInput.trim()}
                  className="flex-1 py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition disabled:opacity-50 active:scale-95"
                >
                  {savingGalleryUrl ? 'Guardando...' : 'Agregar a Galería'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
