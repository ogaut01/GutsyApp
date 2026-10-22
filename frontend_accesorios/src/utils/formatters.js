// Utilidades de formateo y parsing numérico en tiempo real para inputs de usuario

/**
 * Formatea un valor para campos de Guaraníes (PYG).
 * Solo permite dígitos enteros y los separa con puntos de miles (ej: 129000 -> "129.000").
 * Si el valor está vacío o no es válido, retorna cadena vacía "".
 */
export function formatGuaraniesInput(value) {
  if (value === null || value === undefined || value === '') return '';
  // Convertir a string y extraer solo dígitos
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  // Formatear con separador de miles con punto
  return Number(digits).toLocaleString('es-PY');
}

/**
 * Convierte un string formateado en Guaraníes a un número entero puro (ej: "129.000" -> 129000).
 * Retorna 0 si no hay dígitos válidos.
 */
export function parseGuaraniesInput(value) {
  if (value === null || value === undefined || value === '') return 0;
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Formatea un valor decimal para monedas extranjeras (USD, BRL, CNY, ARS).
 * Permite hasta 2 decimales y limpia caracteres inválidos manteniendo coma o punto.
 */
export function formatDecimalInput(value) {
  if (value === null || value === undefined || value === '') return '';
  let str = String(value).replace(/,/g, '.');
  // Permitir dígitos y a lo sumo un punto
  str = str.replace(/[^\d.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
}

/**
 * Parsea un string decimal (ej: "12.50" o "12,50") a float.
 */
export function parseDecimalInput(value) {
  if (value === null || value === undefined || value === '') return 0.0;
  const str = String(value).replace(/,/g, '.').replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0.0 : num;
}


/**
 * Optimiza URLs de Cloudinary inyectando parámetros f_auto, q_auto y ancho responsivo.
 * Reduce drásticamente la carga de imágenes (WebP/AVIF comprimido) y asegura HTTPS.
 */
export function getOptimizedImageUrl(url, width = 400) {
  if (!url || typeof url !== 'string') return url;
  let cleanUrl = url.replace(/^http:\/\/res\.cloudinary\.com/, 'https://res.cloudinary.com');
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/')) {
    // Si ya tiene transformaciones avanzadas, evitar duplicar
    if (cleanUrl.includes('/upload/f_auto')) return cleanUrl;
    return cleanUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return cleanUrl;
}
