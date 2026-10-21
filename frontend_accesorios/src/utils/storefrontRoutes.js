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

  // 1. Detectar parámetro de consulta ?producto=:id o ?p=:id
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const queryProd = searchParams.get('producto') || searchParams.get('p');
    if (queryProd && !isNaN(Number(queryProd))) {
      return { category: 'ALL', productId: Number(queryProd), isProductRoute: true };
    }
  } catch (e) {}

  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const pathname = rawPath.toLowerCase();

  // 2. Detectar ruta de producto: /producto/:id o /p/:id
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

const SEO_CATEGORY_TITLES = {
  ALL: 'GUTSY — Tienda de Accesorios y Regalos en Paraguay',
  AN: 'Anillos para Hombre y Parejas | GUTSY Accesorios y Regalos',
  PU: 'Pulseras y Brazaletes Masculinos | GUTSY Paraguay',
  CO: 'Collares y Colgantes | GUTSY Accesorios y Regalos',
  CA: 'Cadenas de Acero Quirúrgico | GUTSY Paraguay',
  ST: 'Sets y Combos de Regalo | GUTSY Paraguay',
  PA: 'Regalos para Parejas y Accesorios Dúo | GUTSY Paraguay',
  AR: 'Aros y Argollas para Hombre | GUTSY Paraguay',
  LE: 'Lentes de Sol | GUTSY Accesorios Paraguay',
  TO: 'Tobilleras | GUTSY Accesorios Paraguay',
  DI: 'Dijes y Colgantes de Acero | GUTSY Paraguay',
  OT: 'Accesorios y Detalles Especiales | GUTSY Paraguay'
};

const DEFAULT_META_DESC = 'GUTSY — Tienda online de accesorios y regalos en Paraguay. Pulseras, collares, cadenas, anillos de acero quirúrgico y sets especiales para regalar. Envíos a todo el país.';

/**
 * Actualiza la URL y el SEO (título y meta descripción) según la categoría seleccionada
 */
export function updateCategoryUrl(categoryId, replace = false) {
  if (typeof window === 'undefined') return;
  const cat = ALL_STORE_CATEGORIES.find(c => c.id === categoryId);
  const targetPath = (!cat || cat.id === 'ALL') ? '/' : `/${cat.slug}`;

  // Actualizar Título SEO dinámico
  const seoTitle = SEO_CATEGORY_TITLES[categoryId] || (cat ? `${cat.label} | GUTSY Accesorios y Regalos` : SEO_CATEGORY_TITLES.ALL);
  document.title = seoTitle;

  // Restaurar meta descripción si no hay producto abierto
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    if (cat && cat.id !== 'ALL') {
      metaDesc.setAttribute('content', `Descubre nuestra colección de ${cat.label.toLowerCase()} en GUTSY Paraguay. Accesorios y opciones de regalo con envíos rápidos a todo el país.`);
    } else {
      metaDesc.setAttribute('content', DEFAULT_META_DESC);
    }
  }

  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ category: categoryId }, '', targetPath);
    } else {
      window.history.pushState({ category: categoryId }, '', targetPath);
    }
  }
}

/**
 * Actualiza la URL y el SEO (título y meta descripción) según el producto abierto en modal
 */
export function updateProductUrl(productId, productName = '', replace = false) {
  if (typeof window === 'undefined') return;
  const nameSlug = slugify(productName);
  const targetPath = nameSlug ? `/producto/${productId}-${nameSlug}` : `/producto/${productId}`;

  if (productName) {
    document.title = `${productName} | GUTSY Accesorios y Regalos`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Compra ${productName} en GUTSY Paraguay. Accesorios seleccionados y regalos especiales con envíos garantizados a todo el país.`);
    }
  }

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
