import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Phone, MessageCircle, Instagram, MapPin,
  ShoppingBag, Sparkles, ChevronDown, ChevronUp, Pencil, Trash2, X,
  Calendar, Check, ArrowUpRight, DollarSign, Clock, FileText, AlertTriangle
} from 'lucide-react';
import {
  fetchClientes, fetchClienteDetalle, createCliente, updateCliente, deleteCliente, fetchClienteStats
} from '../services/api';

export default function ClientsView({ onNavigateToPos }) {
  const [clientes, setClientes] = useState([]);
  const [stats, setStats] = useState({ total_clientes: 0, clientes_recurrentes: 0, total_facturado_clientes: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'RECURRENT' | 'NEW'

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    instagram: '',
    ciudad: '',
    direccion: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  // Modal Confirmar Eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Historial expandido
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [clientDetails, setClientDetails] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, statsData] = await Promise.all([
        fetchClientes().catch(() => []),
        fetchClienteStats().catch(() => ({ total_clientes: 0, clientes_recurrentes: 0, total_facturado_clientes: 0 })),
      ]);
      setClientes(list);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      nombre: '',
      telefono: '',
      instagram: '',
      ciudad: '',
      direccion: '',
      notas: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      nombre: client.nombre || '',
      telefono: client.telefono || '',
      instagram: client.instagram || '',
      ciudad: client.ciudad || '',
      direccion: client.direccion || '',
      notas: client.notas || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('Ingresá el nombre del cliente');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || null,
        instagram: formData.instagram.trim().replace(/^@/, '') || null,
        ciudad: formData.ciudad.trim() || null,
        direccion: formData.direccion.trim() || null,
        notas: formData.notas.trim() || null,
      };

      if (editingClient) {
        await updateCliente(editingClient.id, payload);
      } else {
        await createCliente(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteCliente(confirmDelete.id);
      setConfirmDelete(null);
      loadData();
    } catch (err) {
      alert('Error al eliminar cliente: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpandClient = async (clientId) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      return;
    }
    setExpandedClientId(clientId);
    if (!clientDetails[clientId]) {
      setLoadingDetailId(clientId);
      try {
        const detail = await fetchClienteDetalle(clientId);
        setClientDetails(prev => ({ ...prev, [clientId]: detail }));
      } catch (err) {
        console.error('Error cargando historial de cliente:', err);
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  // Limpiar y formatear número de WhatsApp
  const getWhatsAppLink = (phone, name) => {
    if (!phone) return null;
    let clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('0')) {
      clean = '595' + clean.slice(1);
    } else if (!clean.startsWith('+') && !clean.startsWith('595')) {
      clean = '595' + clean;
    }
    clean = clean.replace('+', '');
    const greeting = encodeURIComponent(`¡Hola ${name || ''}! Te escribo de Gutsy Accesorios ✨`);
    return `https://wa.me/${clean}?text=${greeting}`;
  };

  // Filtrado de clientes
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return clientes.filter((c) => {
      const matchesSearch = !term ||
        c.nombre?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.instagram?.toLowerCase().includes(term) ||
        c.ciudad?.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterType === 'RECURRENT') return c.total_compras > 1;
      if (filterType === 'NEW') return c.total_compras <= 1;
      return true;
    });
  }, [clientes, searchTerm, filterType]);

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-black dark:text-white" />
            Cartera de Clientes
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Mostrando <b className="text-stone-900 dark:text-white">{filtered.length}</b> de {clientes.length} clientes registrados
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* ── Tarjetas de Resumen ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Total Clientes */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between space-y-1 sm:space-y-2 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-black dark:text-white" />
            Total Clientes
          </span>
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-white">
              {stats.total_clientes || clientes.length}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-stone-400 dark:text-zinc-500">
              Registrados en sistema
            </p>
          </div>
        </div>

        {/* Clientes Recurrentes */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between space-y-1 sm:space-y-2 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recurrentes
          </span>
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-white">
              {stats.clientes_recurrentes || 0}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-stone-400 dark:text-zinc-500">
              Más de 1 compra realizada
            </p>
          </div>
        </div>

        {/* Facturado a Clientes */}
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between space-y-1 sm:space-y-2 shadow-sm">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Total Facturado
          </span>
          <div>
            <h3 className="text-sm sm:text-xl font-black text-stone-900 dark:text-white truncate">
              Gs. {(stats.total_facturado_clientes || 0).toLocaleString('es-PY')}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-stone-400 dark:text-zinc-500">
              Ventas vinculadas
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, WhatsApp, Instagram o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl text-sm placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-white rounded-full transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'ALL'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
            }`}
          >
            Todos ({clientes.length})
          </button>
          <button
            onClick={() => setFilterType('RECURRENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'RECURRENT'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
            }`}
          >
            Recurrentes ({clientes.filter(c => c.total_compras > 1).length})
          </button>
          <button
            onClick={() => setFilterType('NEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'NEW'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800'
            }`}
          >
            Nuevos / 1 Compra ({clientes.filter(c => c.total_compras <= 1).length})
          </button>
        </div>
      </div>

      {/* ── Lista de Clientes ── */}
      {loading && clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs">
          <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-2" />
          <span>Cargando clientes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-stone-300 dark:text-zinc-700" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {searchTerm ? 'No se encontraron clientes' : 'Aún no hay clientes registrados'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Probá buscando con otro nombre o número de teléfono.'
                : 'Registrá a tus clientes para llevar el historial de lo que compran y contactarlos fácilmente.'}
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrar Primer Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const waUrl = getWhatsAppLink(client.telefono, client.nombre);
            const detail = clientDetails[client.id];
            const isLoadingDetail = loadingDetailId === client.id;

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 transition hover:border-neutral-300 dark:hover:border-zinc-700"
              >
                {/* ── Fila Principal ── */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                        {client.nombre}
                      </h3>
                      {client.total_compras > 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Recurrente ({client.total_compras} compras)
                        </span>
                      ) : client.total_compras === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          1 compra
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 text-[10px] font-medium">
                          Sin compras
                        </span>
                      )}
                    </div>

                    {/* Datos de contacto */}
                    <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400 flex-wrap">
                      {client.telefono && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {client.telefono}
                        </span>
                      )}
                      {client.instagram && (
                        <a
                          href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition"
                        >
                          <Instagram className="w-3 h-3 text-pink-500" />
                          @{client.instagram.replace('@', '')}
                        </a>
                      )}
                      {client.ciudad && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {client.ciudad}
                        </span>
                      )}
                    </div>

                    {/* Dirección o notas breves */}
                    {client.direccion && (
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 truncate">
                        📍 {client.direccion}
                      </p>
                    )}
                    {client.notas && (
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 italic bg-stone-50 dark:bg-zinc-950 p-2 rounded-xl border border-neutral-100 dark:border-zinc-800/80">
                        "{client.notas}"
                      </p>
                    )}
                  </div>

                  {/* ── Acciones y Total ── */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-stone-900 dark:text-white block">
                        Gs. {(client.total_gastado || 0).toLocaleString('es-PY')}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                        {client.total_compras || 0} compras
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
                          title="Escribir por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        </a>
                      )}

                      <button
                        onClick={(e) => handleOpenEdit(client, e)}
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-zinc-700 transition"
                        title="Editar cliente"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(client); }}
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleExpandClient(client.id)}
                        className={`p-2 rounded-xl border border-neutral-200 dark:border-zinc-800 transition flex items-center gap-1 text-xs font-semibold ${
                          isExpanded
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800'
                        }`}
                        title="Ver historial de compras"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Historial de Compras Desplegable ── */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-zinc-800 space-y-3 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Historial de Compras Vinculadas
                      </h4>
                      {onNavigateToPos && (
                        <button
                          onClick={() => onNavigateToPos(client)}
                          className="text-[11px] font-bold text-black dark:text-white underline flex items-center gap-1"
                        >
                          Nueva Venta en POS <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {isLoadingDetail ? (
                      <div className="py-4 text-center text-xs text-stone-400">
                        Cargando historial de compras...
                      </div>
                    ) : !detail?.ventas || detail.ventas.length === 0 ? (
                      <p className="text-xs text-stone-400 dark:text-zinc-500 italic py-2">
                        Este cliente aún no tiene ventas asociadas en el sistema.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detail.ventas.map((venta) => (
                          <div
                            key={venta.id}
                            className="bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                {new Date(venta.fecha_venta).toLocaleDateString('es-PY', {
                                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-zinc-800 text-[10px] font-bold">
                                  {venta.metodo_pago_display || venta.metodo_pago}
                                </span>
                                <span className="font-black text-stone-900 dark:text-white">
                                  Gs. {venta.total_cobrado.toLocaleString('es-PY')}
                                </span>
                              </div>
                            </div>

                            {/* Artículos comprados en esta venta */}
                            {venta.detalles && venta.detalles.length > 0 && (
                              <div className="pl-2 border-l-2 border-neutral-300 dark:border-zinc-700 space-y-1 text-xs">
                                {venta.detalles.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-stone-600 dark:text-zinc-300">
                                    <span>
                                      • <b className="text-stone-900 dark:text-white">{item.cantidad}x</b> {item.variante_info?.producto_nombre || 'Accesorio'}
                                      <span className="text-stone-400 dark:text-zinc-500 ml-1">
                                        ({item.variante_info?.color || 'Único'}, {item.variante_info?.talle_medida || 'Ajustable'})
                                      </span>
                                    </span>
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                      Gs. {(item.subtotal || 0).toLocaleString('es-PY')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {venta.notas && (
                              <p className="text-[11px] text-stone-400 dark:text-zinc-500 italic">
                                Nota: {venta.notas}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Crear / Editar Cliente
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border border-neutral-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-black dark:text-white" />
                {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María Gómez"
                  value={formData.nombre}
                  onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 0981123456"
                    value={formData.telefono}
                    onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">@</span>
                    <input
                      type="text"
                      placeholder="usuario"
                      value={formData.instagram}
                      onChange={(e) => setFormData(f => ({ ...f, instagram: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Ciudad / Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Asunción, CDE, Luque"
                    value={formData.ciudad}
                    onChange={(e) => setFormData(f => ({ ...f, ciudad: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Barrio San Pablo, Calle X"
                    value={formData.direccion}
                    onChange={(e) => setFormData(f => ({ ...f, direccion: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Prefiere entregas por la tarde, le gusta el acero dorado, etc."
                  value={formData.notas}
                  onChange={(e) => setFormData(f => ({ ...f, notas: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#fcfbf9] dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white focus:border-black dark:focus:border-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-sm transition active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingClient ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
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
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                ¿Eliminar cliente?
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                Se eliminará a <b>{confirmDelete.nombre}</b> de la lista. Su historial de ventas anteriores no se perderá.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
