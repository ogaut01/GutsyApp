import { ALL_STORE_CATEGORIES } from '../constants/storefrontConstants';

/**
 * Convierte un texto a slug amigable para URL (ej: "Collar Dije Cruz" -> "collar-dije-cruz")
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza caracteres no alfanuméricos por guiones
    .replace(/^-+|-+$/g, '');        // Remueve guiones al inicio y final
}

/**
 * Analiza la URL actual para determinar la categoría y/o producto seleccionado.
 * Soporta:
 * - /collares, /categoria/collares
 * - /pulseras, /anillos, /cadenas, etc.
 * - /producto/:id, /producto/:id-slug, /p/:id
 */
export function parseStorefrontUrl() {
  if (typeof window === 'undefined') {
    return { category: 'ALL', productId: null, isProductRoute: false };
  }

  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const pathname = rawPath.toLowerCase();

  // 1. Detectar ruta de producto: /producto/:id o /p/:id
  const productMatch = pathname.match(/^\/(?:producto|p)\/(\d+)(?:-.*)?$/);
  if (productMatch) {
    const id = Number(productMatch[1]);
    return { category: 'ALL', productId: id, isProductRoute: true };
  }

  // 2. Detectar ruta de categoría: /:slug o /categoria/:slug
  let pathSlug = '';
  if (pathname.startsWith('/categoria/')) {
    pathSlug = pathname.replace('/categoria/', '');
  } else if (pathname.length > 1) {
    pathSlug = pathname.slice(1);
  }

  if (pathSlug) {
    const foundCategory = ALL_STORE_CATEGORIES.find(c => c.slug === pathSlug);
    if (foundCategory) {
      return { category: foundCategory.id, productId: null, isProductRoute: false };
    }
  }

  return { category: 'ALL', productId: null, isProductRoute: false };
}

/**
 * Actualiza la URL del navegador para reflejar la categoría seleccionada
 */
export function updateCategoryUrl(categoryId, replace = false) {
  if (typeof window === 'undefined') return;
  const cat = ALL_STORE_CATEGORIES.find(c => c.id === categoryId);
  const targetPath = (!cat || cat.id === 'ALL') ? '/' : `/${cat.slug}`;

  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ category: categoryId }, '', targetPath);
    } else {
      window.history.pushState({ category: categoryId }, '', targetPath);
    }
  }
}

/**
 * Actualiza la URL del navegador para reflejar el producto abierto en modal
 */
export function updateProductUrl(productId, productName = '', replace = false) {
  if (typeof window === 'undefined') return;
  const nameSlug = slugify(productName);
  const targetPath = nameSlug ? `/producto/${productId}-${nameSlug}` : `/producto/${productId}`;

  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ productId }, '', targetPath);
    } else {
      window.history.pushState({ productId }, '', targetPath);
    }
  }
}

/**
 * Obtiene el slug de una categoría a partir de su ID
 */
export function getCategorySlug(categoryId) {
  const cat = ALL_STORE_CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.slug : 'todos';
}
