/**
 * Vercel Serverless Function: Generador dinámico de Open Graph (OG) tags para productos de GUTSY.
 * 
 * Permite que al compartir enlaces como https://gutsy-app-omega.vercel.app/producto/241
 * en WhatsApp, Facebook, Twitter, Telegram, etc., los rastreadores reciban el HTML
 * con el título, precio, descripción y la foto del producto en lugar del logo genérico.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optimizeImageUrl(rawUrl) {
  if (!rawUrl) return 'https://gutsy-app-omega.vercel.app/gutsy-logo.png';
  let url = String(rawUrl).trim();

  // Si es relativa, prepender backend URL
  if (url.startsWith('/')) {
    url = `https://gutsy-backend-fpk3.onrender.com${url}`;
  }

  // Si la imagen está en Cloudinary, transformar a JPG optimizado para WhatsApp / redes
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('/upload/c_')) {
      url = url.replace('/upload/', '/upload/c_limit,w_1000,h_1000,q_auto,f_jpg/');
    }
  }

  return url;
}

function renderHtml({ title, description, imageUrl, canonicalUrl, productName }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:site_name" content="GUTSY Accesorios y Regalos">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${escapeHtml(productName || title)}">
  <meta property="og:locale" content="es_PY">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <!-- Redirección instantánea si un usuario humano abre este endpoint en un navegador -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
  <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</head>
<body style="background-color:#09090b;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;box-sizing:border-box;text-align:center;">
  <div>
    <h2 style="font-weight:600;font-size:1.25rem;margin-bottom:8px;">${escapeHtml(productName || 'GUTSY')}</h2>
    <p style="color:#a1a1aa;font-size:0.9rem;margin-bottom:16px;">Redirigiendo a GUTSY Accesorios y Regalos...</p>
    <a href="${escapeHtml(canonicalUrl)}" style="display:inline-block;padding:10px 20px;background:#ffffff;color:#000000;text-decoration:none;border-radius:6px;font-weight:500;font-size:0.9rem;">Ver producto</a>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Extraer el ID del producto desde query params (?id=, ?path=, ?p=)
  const rawParam = req.query?.id || req.query?.path || req.query?.p || '';
  const match = String(rawParam).match(/^(\d+)/) || String(rawParam).match(/(?:^|\/)(\d+)/);
  const productId = match ? match[1] : null;

  // Defaults de la tienda
  const defaultTitle = 'GUTSY — Tienda de Accesorios y Regalos en Paraguay';
  const defaultDesc = 'Accesorios masculinos, piezas de acero quirúrgico y regalos especiales. Pulseras, cadenas, collares y anillos con envíos rápidos a todo Paraguay.';
  const defaultImage = 'https://gutsy-app-omega.vercel.app/gutsy-logo.png';
  const defaultUrl = 'https://gutsy-app-omega.vercel.app/';

  if (!productId) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(renderHtml({
      title: defaultTitle,
      description: defaultDesc,
      imageUrl: defaultImage,
      canonicalUrl: defaultUrl,
      productName: 'GUTSY Accesorios y Regalos'
    }));
  }

  try {
    // Timeout de 4500ms para no bloquear si Render está en cold-start
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const apiRes = await fetch(`https://gutsy-backend-fpk3.onrender.com/api/productos/${productId}/`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Gutsy-OG-Bot/1.0'
      }
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const productName = data.nombre || 'Accesorio';
      
      let priceFormatted = '';
      if (data.precio_venta && Number(data.precio_venta) > 0) {
        priceFormatted = `Gs. ${Number(data.precio_venta).toLocaleString('es-PY')}`;
      }

      // Priorizar imagen completa del producto, luego primera variante con imagen, luego genérica
      const rawImage = data.imagen_url_completa
        || (Array.isArray(data.variantes) && data.variantes.find(v => v.imagen_url)?.imagen_url)
        || (Array.isArray(data.variantes) && data.variantes[0]?.imagen_url)
        || data.imagen_url
        || defaultImage;

      const imageUrl = optimizeImageUrl(rawImage);

      const title = priceFormatted
        ? `${productName} — ${priceFormatted} | GUTSY`
        : `${productName} | GUTSY Accesorios y Regalos`;

      const description = data.descripcion && data.descripcion.trim().length > 10
        ? data.descripcion.trim().slice(0, 240)
        : `${productName}${priceFormatted ? ` (${priceFormatted})` : ''}. Piezas de acero quirúrgico, accesorios y detalles seleccionados para regalar con envíos a todo Paraguay.`;

      const canonicalUrl = `https://gutsy-app-omega.vercel.app/producto/${productId}`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(renderHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        productName
      }));
    }
  } catch (err) {
    // Si falla o hay timeout, fallback a información básica de la tienda
  }

  // Fallback con el ID del producto pero metadata por defecto
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(renderHtml({
    title: `Producto #${productId} | GUTSY Accesorios y Regalos`,
    description: defaultDesc,
    imageUrl: defaultImage,
    canonicalUrl: `https://gutsy-app-omega.vercel.app/producto/${productId}`,
    productName: `Producto #${productId} | GUTSY`
  }));
}
