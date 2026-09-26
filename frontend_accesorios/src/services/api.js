// Centralized API Service for Joyas & Accesorios PY (GutsyApp)

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'gutsy_auth_token';
const AUTH_USER_KEY = 'gutsy_auth_user';

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getStoredUser() {
  const user = localStorage.getItem(AUTH_USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

/**
 * Petición fetch autenticada con inyección de Token y manejo central de 401
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  // Solo agregar Content-Type JSON si hay body y no es FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && !endpoint.includes('/auth/login/')) {
    // Sesión no autorizada o token inválido
    setStoredToken(null);
    setStoredUser(null);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return res;
}

// ─── Autenticación ─────────────────────────────────────────────────────────

export async function loginApi(username, password) {
  const res = await apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Error al iniciar sesión');
  }
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function logoutApi() {
  try {
    await apiRequest('/auth/logout/', { method: 'POST' });
  } catch (err) {
    console.warn('Error closing remote session:', err);
  } finally {
    setStoredToken(null);
    setStoredUser(null);
  }
}

export async function fetchMe() {
  const res = await apiRequest('/auth/me/');
  if (!res.ok) throw new Error('Token inválido o expirado');
  const user = await res.json();
  setStoredUser(user);
  return user;
}

// ─── Catálogo & Productos ──────────────────────────────────────────────────

export async function fetchProductos(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/productos/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function fetchProductosCatalogoUnificado() {
  const res = await apiRequest('/productos/catalogo-unificado/');
  if (!res.ok) throw new Error('Error al cargar catálogo unificado');
  return res.json();
}

export async function updateProducto(id, data) {
  const res = await apiRequest(`/productos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const textContent = await res.text();
    let errorMessage = 'Error al actualizar producto';
    try {
      const errorData = JSON.parse(textContent);
      errorMessage = JSON.stringify(errorData);
    } catch {
      errorMessage = textContent || res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function deleteProducto(id) {
  const res = await apiRequest(`/productos/${id}/`, { method: 'DELETE' });
  if (res.status === 404) return true;
  if (!res.ok) {
    const textContent = await res.text();
    let errorMessage = 'Error al eliminar el producto';
    try {
      const errorData = JSON.parse(textContent);
      errorMessage = errorData?.detail || errorData?.message || errorMessage;
    } catch {
      errorMessage = textContent || res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return true;
}

export async function updateVariante(id, data) {
  const res = await apiRequest(`/variantes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar variante');
  return res.json();
}

export async function createVariante(data) {
  const res = await apiRequest('/variantes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear variante');
  return res.json();
}

export async function deleteVariante(id) {
  const res = await apiRequest(`/variantes/${id}/`, { method: 'DELETE' });
  if (res.status === 404) return true;
  if (!res.ok) throw new Error('Error al eliminar variante');
  return true;
}

export async function uploadFotoProducto(id, file) {
  const formData = new FormData();
  formData.append('foto', file);
  const res = await apiRequest(`/productos/${id}/upload-foto/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || 'Error al subir la foto');
  }
  return res.json();
}

export async function uploadFotoVariante(id, file) {
  const form = new FormData();
  form.append('foto', file);
  const res = await apiRequest(`/variantes/${id}/upload-foto/`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Error al subir la foto de la variante');
  }
  return res.json();
}

// ─── Importaciones & Lotes ─────────────────────────────────────────────────

export async function fetchLotes() {
  const res = await apiRequest('/lotes/');
  if (!res.ok) throw new Error('Error al cargar lotes');
  return res.json();
}

export async function createLote(data) {
  const res = await apiRequest('/lotes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar lote de importación');
  return res.json();
}

export async function updateLote(id, data) {
  const res = await apiRequest(`/lotes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar lote de importación');
  return res.json();
}

export async function deleteLote(id) {
  const res = await apiRequest(`/lotes/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar lote');
  return true;
}

export async function updateLoteFlete(id, data) {
  const res = await apiRequest(`/lotes/${id}/actualizar_flete/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar flete');
  return res.json();
}

export async function createItemLote(data) {
  const res = await apiRequest('/itemlotes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.non_field_errors?.[0] || 'Error al asignar producto al lote');
  }
  return res.json();
}

export async function updateItemLote(id, data) {
  const res = await apiRequest(`/itemlotes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.non_field_errors?.[0] || 'Error al actualizar producto en el lote');
  }
  return res.json();
}

export async function deleteItemLote(id) {
  const res = await apiRequest(`/itemlotes/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al quitar producto del lote');
  return true;
}

// ─── Couriers, Proveedores & Materiales ────────────────────────────────────

export async function fetchCouriers() {
  const res = await apiRequest('/couriers/');
  if (!res.ok) throw new Error('Error al cargar couriers');
  return res.json();
}

export async function createCourier(data) {
  const res = await apiRequest('/couriers/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar courier');
  return res.json();
}

export async function updateCourier(id, data) {
  const res = await apiRequest(`/couriers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar courier');
  return res.json();
}

export async function deleteCourier(id) {
  const res = await apiRequest(`/couriers/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar courier');
  return true;
}

// ─── Plataformas ──────────────────────────────────────────────────────────

export async function fetchPlataformas() {
  const res = await apiRequest('/plataformas/');
  if (!res.ok) throw new Error('Error al cargar plataformas');
  return res.json();
}

export async function createPlataforma(data) {
  const res = await apiRequest('/plataformas/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear plataforma');
  return res.json();
}

export async function updatePlataforma(id, data) {
  const res = await apiRequest(`/plataformas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar plataforma');
  return res.json();
}

export async function deletePlataforma(id) {
  const res = await apiRequest(`/plataformas/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar plataforma');
  return true;
}

// ─── Proveedores ──────────────────────────────────────────────────────────

export async function fetchProveedores() {
  const res = await apiRequest('/proveedores/');
  if (!res.ok) throw new Error('Error al cargar proveedores');
  return res.json();
}

export async function createProveedor(data) {
  const res = await apiRequest('/proveedores/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.non_field_errors?.[0] || 'Error al crear proveedor');
  }
  return res.json();
}

export async function updateProveedor(id, data) {
  const res = await apiRequest(`/proveedores/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.non_field_errors?.[0] || 'Error al actualizar proveedor');
  }
  return res.json();
}

export async function deleteProveedor(id) {
  const res = await apiRequest(`/proveedores/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar proveedor');
  return true;
}

// ─── Materiales ───────────────────────────────────────────────────────────

export async function fetchMateriales() {
  const res = await apiRequest('/materiales/');
  if (!res.ok) throw new Error('Error al cargar materiales');
  return res.json();
}

export async function createMaterial(data) {
  const res = await apiRequest('/materiales/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.nombre?.[0] || 'Error al crear material');
  }
  return res.json();
}

export async function updateMaterial(id, data) {
  const res = await apiRequest(`/materiales/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.nombre?.[0] || 'Error al actualizar material');
  }
  return res.json();
}

export async function deleteMaterial(id) {
  const res = await apiRequest(`/materiales/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar material');
  return true;
}

// ─── Ventas & POS ──────────────────────────────────────────────────────────

export async function createVenta(data) {
  const res = await apiRequest('/ventas/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || 'Error al procesar la venta');
  }
  return res.json();
}

export async function fetchVentas() {
  const res = await apiRequest('/ventas/');
  if (!res.ok) throw new Error('Error al cargar ventas');
  return res.json();
}

export async function deleteVenta(id) {
  const res = await apiRequest(`/ventas/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al anular la venta');
}

// ─── Gastos Operativos ─────────────────────────────────────────────────────

export async function fetchGastos() {
  const res = await apiRequest('/gastos/');
  if (!res.ok) throw new Error('Error al cargar gastos');
  return res.json();
}

export async function createGasto(data) {
  const res = await apiRequest('/gastos/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar gasto');
  return res.json();
}

export async function deleteGasto(id) {
  const res = await apiRequest(`/gastos/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar gasto');
  return true;
}

// ─── Dashboard & Métricas ──────────────────────────────────────────────────

export async function fetchDashboardStats(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/dashboard/stats/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Error al cargar estadísticas');
  return res.json();
}

// ─── Configuración & Cotizaciones ──────────────────────────────────────────

export async function fetchConfiguracion() {
  const res = await apiRequest('/configuracion/');
  if (!res.ok) throw new Error('Error al cargar configuración');
  return res.json();
}

export async function updateConfiguracion(data) {
  const res = await apiRequest('/configuracion/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.detail || 'Error al actualizar configuración');
  }
  return res.json();
}

export async function syncCotizaciones() {
  const res = await apiRequest('/configuracion/sync-rates/', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Error al sincronizar cotizaciones');
  return res.json();
}

// ─── Carga Masiva Excel ────────────────────────────────────────────────────

export async function bulkUploadProductos(productos) {
  const res = await apiRequest('/productos-carga-masiva/', {
    method: 'POST',
    body: JSON.stringify({ productos }),
  });
  if (!res.ok) {
    const textContent = await res.text();
    let errorMessage = `Error en la carga masiva (${res.status})`;
    try {
      const errorData = JSON.parse(textContent);
      errorMessage = errorData?.error || errorData?.errores?.join('\n') || errorMessage;
    } catch {
      errorMessage = textContent || res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function parseUploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiRequest('/productos-carga-masiva/parsear-archivo/', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const textContent = await res.text();
    let errorMessage = `Error al procesar el archivo (${res.status})`;
    try {
      const errorData = JSON.parse(textContent);
      if (errorData?.errores && Array.isArray(errorData.errores) && errorData.errores.length > 0) {
        errorMessage = errorData.errores.slice(0, 5).join('\n') + (errorData.errores.length > 5 ? `\n...y ${errorData.errores.length - 5} errores más.` : '');
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = textContent || res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

// ─── Clientes (CRM) ────────────────────────────────────────────────────────

export async function fetchClientes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/clientes/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Error al cargar clientes');
  return res.json();
}

export async function fetchClienteDetalle(id) {
  const res = await apiRequest(`/clientes/${id}/`);
  if (!res.ok) throw new Error('Error al cargar detalle del cliente');
  return res.json();
}

export async function fetchClienteStats() {
  const res = await apiRequest('/clientes/stats/');
  if (!res.ok) throw new Error('Error al cargar estadísticas de clientes');
  return res.json();
}

export async function createCliente(data) {
  const res = await apiRequest('/clientes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.nombre?.[0] || err.detail || 'Error al registrar cliente');
  }
  return res.json();
}

export async function updateCliente(id, data) {
  const res = await apiRequest(`/clientes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar cliente');
  return res.json();
}

export async function deleteCliente(id) {
  const res = await apiRequest(`/clientes/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar cliente');
  return true;
}

// ── Pedidos Web (WhatsApp Storefront) ─────────────────────────────────────────

export async function createPedidoWeb(data) {
  const res = await apiRequest('/pedidos-web/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al registrar pedido');
  }
  return res.json();
}

export async function fetchPedidosWeb(estado = null) {
  const query = estado ? `?estado=${estado}` : '';
  const res = await apiRequest(`/pedidos-web/${query}`);
  if (!res.ok) throw new Error('Error al cargar pedidos web');
  return res.json();
}

export async function confirmarPedidoWeb(id, metodoPagoVenta = 'TR') {
  const res = await apiRequest(`/pedidos-web/${id}/confirmar/`, {
    method: 'POST',
    body: JSON.stringify({ metodo_pago_venta: metodoPagoVenta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al confirmar pedido');
  }
  return res.json();
}

export async function cancelarPedidoWeb(id) {
  const res = await apiRequest(`/pedidos-web/${id}/cancelar/`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cancelar pedido');
  }
  return res.json();
}

