const API_BASE = '/api';

export async function fetchProductos(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/productos/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function fetchLotes() {
  const res = await fetch(`${API_BASE}/lotes/`);
  if (!res.ok) throw new Error('Error al cargar lotes');
  return res.json();
}

export async function createLote(data) {
  const res = await fetch(`${API_BASE}/lotes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar lote de importación');
  return res.json();
}

export async function fetchCouriers() {
  const res = await fetch(`${API_BASE}/couriers/`);
  if (!res.ok) throw new Error('Error al cargar couriers');
  return res.json();
}

export async function fetchProveedores() {
  const res = await fetch(`${API_BASE}/proveedores/`);
  if (!res.ok) throw new Error('Error al cargar proveedores');
  return res.json();
}

export async function updateLoteFlete(id, data) {
  const res = await fetch(`${API_BASE}/lotes/${id}/actualizar_flete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar flete');
  return res.json();
}

export async function createVenta(data) {
  const res = await fetch(`${API_BASE}/ventas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.detail || 'Error al procesar la venta');
  }
  return res.json();
}

export async function fetchVentas() {
  const res = await fetch(`${API_BASE}/ventas/`);
  if (!res.ok) throw new Error('Error al cargar ventas');
  return res.json();
}

export async function deleteVenta(id) {
  const res = await fetch(`${API_BASE}/ventas/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al anular la venta');
}


export async function fetchGastos() {
  const res = await fetch(`${API_BASE}/gastos/`);
  if (!res.ok) throw new Error('Error al cargar gastos');
  return res.json();
}

export async function createGasto(data) {
  const res = await fetch(`${API_BASE}/gastos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar gasto');
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats/`);
  if (!res.ok) throw new Error('Error al cargar estadísticas');
  return res.json();
}

export async function fetchConfiguracion() {
  const res = await fetch(`${API_BASE}/configuracion/`);
  if (!res.ok) throw new Error('Error al cargar configuración');
  return res.json();
}

export async function syncCotizaciones() {
  const res = await fetch(`${API_BASE}/configuracion/sync-rates/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Error al sincronizar cotizaciones');
  return res.json();
}

export async function bulkUploadProductos(productos) {
  const res = await fetch(`${API_BASE}/productos-carga-masiva/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productos }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error || errorData?.errores?.join('\n') || 'Error en la carga masiva');
  }
  return res.json();
}

export async function updateProducto(id, data) {
  const res = await fetch(`${API_BASE}/productos/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function deleteProducto(id) {
  const res = await fetch(`${API_BASE}/productos/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar el producto');
}

export async function updateVariante(id, data) {
  const res = await fetch(`${API_BASE}/variantes/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar variante');
  return res.json();
}

export async function deleteVariante(id) {
  const res = await fetch(`${API_BASE}/variantes/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar variante');
}

export async function uploadFotoProducto(id, file) {
  const formData = new FormData();
  formData.append('foto', file);
  const res = await fetch(`${API_BASE}/productos/${id}/upload-foto/`, {
    method: 'POST',
    body: formData,
    // NO poner Content-Type: el browser lo agrega con el boundary correcto para multipart
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || 'Error al subir la foto');
  }
  return res.json();
}

export async function parseUploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/productos-carga-masiva/parsear-archivo/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error || 'Error al procesar el archivo');
  }
  return res.json();
}

