// Helper para identificar accesorios de parejas / dúos
export const isCoupleProduct = (p) => {
  if (!p) return false;
  if (p.categoria === 'PA') return true;
  const n = (p.nombre || '').toLowerCase();
  return (
    n.includes('par ') ||
    n.includes('par.') ||
    n.includes('pareja') ||
    n.includes('astronautas') ||
    n.includes('deadpool') ||
    n.includes('corazon y llave') ||
    n.includes('chimuelo') ||
    n.includes('eternal lock')
  );
};

// Helper para mostrar género limpio (Dama, Caballero, Unisex)
export const formatGenero = (g) => {
  if (!g) return '';
  const lower = String(g).toLowerCase().trim();
  if (lower.includes('dama') || lower.includes('femenino') || lower === 'f') return 'Dama';
  if (lower.includes('caballero') || lower.includes('hombre') || lower.includes('masculino') || lower === 'm') return 'Caballero';
  if (lower.includes('unisex') || lower === 'u') return 'Unisex';
  return g;
};

// Helper para identificar accesorios personalizables / grabados láser
export const isCustomizableProduct = (p) => {
  if (!p || !p.nombre) return false;
  const n = (p.nombre || '').toLowerCase();
  const d = (p.descripcion || '').toLowerCase();
  return (
    n.includes('personaliz') ||
    n.includes('grabado') ||
    n.includes('grabar') ||
    n.includes('inicial') ||
    n.includes('barra 3d') ||
    d.includes('personaliz') ||
    d.includes('grabado')
  );
};

// Helper para comparar color de variante con el filtro seleccionado
export const isColorMatch = (variantColor, filterColor) => {
  if (!filterColor || filterColor === 'ALL') return false;
  const c = (variantColor || '').toLowerCase();
  if (filterColor === 'negro') return c.includes('negro') || c.includes('black');
  if (filterColor === 'plateado') return c.includes('plateado') || c.includes('plata') || c.includes('silver');
  if (filterColor === 'dorado') return c.includes('dorado') || c.includes('oro') || c.includes('gold');
  if (filterColor === 'rose_gold') return c.includes('rose') || c.includes('rosado') || c.includes('rosa');
  if (filterColor === 'blanco') return c.includes('blanco') || c.includes('white');
  return false;
};

// Helper para obtener la variante que coincide con el filtro de color
export const getMatchingColorVariant = (product, filterColor) => {
  if (!product || !product.variantes || product.variantes.length === 0 || !filterColor || filterColor === 'ALL') {
    return null;
  }
  const withStock = product.variantes.find(v => v.activo !== false && (v.stock || 0) > 0 && isColorMatch(v.color, filterColor));
  if (withStock) return withStock;
  return product.variantes.find(v => v.activo !== false && isColorMatch(v.color, filterColor)) || null;
};

// Helper para renderizar los círculos de colores de variantes
export const getColorSwatchStyle = (colorName) => {
  if (!colorName) return { 
    bgClass: 'bg-zinc-400', 
    borderClass: 'border-zinc-300 dark:border-zinc-600',
    isLight: true 
  };
  const c = colorName.toLowerCase().trim();
  if (c.includes('negro') || c.includes('black')) {
    return { 
      bgClass: 'bg-zinc-950', 
      borderClass: 'border-zinc-400 dark:border-zinc-500 shadow-sm',
      isLight: false 
    };
  }
  if (c.includes('dorado') || c.includes('oro') || c.includes('gold')) {
    return { 
      bgClass: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600', 
      borderClass: 'border-amber-300 dark:border-amber-500 shadow-sm',
      isLight: true 
    };
  }
  if (c.includes('plateado') || c.includes('plata') || c.includes('silver') || c.includes('acero')) {
    return { 
      bgClass: 'bg-gradient-to-br from-slate-100 via-slate-300 to-zinc-400', 
      borderClass: 'border-slate-300 dark:border-slate-500 shadow-sm',
      isLight: true 
    };
  }
  if (c.includes('rose') || c.includes('rosad') || c.includes('rosa') || c.includes('cobre')) {
    return { 
      bgClass: 'bg-gradient-to-br from-rose-200 via-rose-300 to-pink-400', 
      borderClass: 'border-rose-300 dark:border-rose-400 shadow-sm',
      isLight: true 
    };
  }
  if (c.includes('azul') || c.includes('blue')) {
    return { 
      bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-700', 
      borderClass: 'border-blue-400 dark:border-blue-500 shadow-sm',
      isLight: false 
    };
  }
  if (c.includes('rojo') || c.includes('red')) {
    return { 
      bgClass: 'bg-gradient-to-br from-red-500 to-rose-700', 
      borderClass: 'border-red-400 dark:border-red-500 shadow-sm',
      isLight: false 
    };
  }
  if (c.includes('verde') || c.includes('green')) {
    return { 
      bgClass: 'bg-gradient-to-br from-emerald-400 to-green-700', 
      borderClass: 'border-emerald-400 dark:border-emerald-500 shadow-sm',
      isLight: false 
    };
  }
  if (c.includes('blanco') || c.includes('white')) {
    return { 
      bgClass: 'bg-white', 
      borderClass: 'border-zinc-300 dark:border-zinc-600 shadow-sm',
      isLight: true 
    };
  }
  if (c.includes('morad') || c.includes('violet') || c.includes('purp')) {
    return { 
      bgClass: 'bg-gradient-to-br from-purple-500 to-violet-700', 
      borderClass: 'border-purple-400 dark:border-purple-500 shadow-sm',
      isLight: false 
    };
  }
  if (c.includes('tornasol') || c.includes('arcoiris') || c.includes('multicolor') || c.includes('iridiscente')) {
    return { 
      bgClass: 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-yellow-400', 
      borderClass: 'border-cyan-300 shadow-sm',
      isLight: true 
    };
  }
  return { 
    bgClass: 'bg-zinc-400 dark:bg-zinc-600', 
    borderClass: 'border-zinc-300 dark:border-zinc-500 shadow-sm',
    isLight: true 
  };
};

// Helper para precios de Aros (Par vs Unidad)
export const getAroPrecios = (product) => {
  if (!product) return { precioPar: 0, precioUnidad: 0 };
  const precioPar = product.precio_venta || 0;
  let precioUnidad = product.precio_unidad;
  if (!precioUnidad || precioUnidad <= 0) {
    if (product.precio_unidad_calculado) {
      precioUnidad = product.precio_unidad_calculado;
    } else {
      if (precioPar <= 20000) precioUnidad = 15000;
      else if (precioPar <= 30000) precioUnidad = 20000;
      else if (precioPar <= 40000) precioUnidad = 25000;
      else if (precioPar <= 50000) precioUnidad = 30000;
      else if (precioPar <= 60000) precioUnidad = 35000;
      else precioUnidad = Math.round((precioPar / 2 + 5000) / 5000) * 5000;
    }
  }
  return { precioPar, precioUnidad };
};

// Helper para normalizar URLs de imagenes
export const normalizeImageUrl = (u) => {
  if (!u) return '';
  try {
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const parsed = new URL(u);
      return parsed.pathname;
    }
  } catch (e) {}
  return u.trim();
};

// Helper universal y seguro para copiar al portapapeles (funciona en HTTPS, HTTP, IP local y celulares)
export const copyToClipboard = async (text) => {
  if (!text) return false;

  // 1. Intentar con Clipboard API moderna si está soportada
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard falló, usando fallback:', err);
    }
  }

  // 2. Fallback con textarea (imprescindible en redes locales http://192.168.x.x o contextos no seguros)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.warn('Error al copiar texto:', err);
    return false;
  }
};

