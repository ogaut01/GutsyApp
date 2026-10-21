const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const RESULTS_DIR = path.join(__dirname, 'qa-results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const allIssues = [];

function recordIssue({ persona, title, description, screenshot, severity = 'medium', element = null }) {
  console.log(`  [ISSUE] [${severity.toUpperCase()}]: ${title}`);
  allIssues.push({ persona, title, description, screenshot, severity, element, timestamp: new Date().toISOString() });
}

/**
 * Dismiss any blocking overlay/modal (review modal, lightbox, etc.)
 * by pressing Escape or clicking close button. Critical to avoid test stalls.
 */
async function dismissOverlays(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const overlay = page.locator('.fixed.inset-0.z-50').first();
    if (await overlay.count() > 0 && await overlay.isVisible()) {
      const closeBtn = overlay.locator('button:has(svg)').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click({ timeout: 2000 }).catch(() => {});
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
}

/**
 * Scroll to the product grid and click the FIRST real product card
 * (using data-testid, NOT review cards). Returns true if modal opened.
 */
async function openFirstProduct(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  try {
    await page.waitForSelector('[data-testid="product-card"]', { state: 'visible', timeout: 25000 });
  } catch (e) {
    return false;
  }

  const productCard = page.locator('[data-testid="product-card"]').first();
  await productCard.scrollIntoViewIfNeeded();
  await productCard.click({ timeout: 5000 });
  await page.waitForTimeout(800);
  return true;
}

async function clickAddToCart(page) {
  const addBtn = page.locator('[data-testid="add-to-cart-modal-btn"], button:has-text("AGREGAR AL CARRITO")').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click({ timeout: 3000 });
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

async function openCart(page) {
  await dismissOverlays(page);
  const cartBtn = page.locator('button[aria-label*="carrito" i]').first();
  if (await cartBtn.count() > 0 && await cartBtn.isVisible()) {
    await cartBtn.click({ timeout: 3000 });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA 1: THE IMPATIENT ONE
// ─────────────────────────────────────────────────────────────────────────────
async function runTheImpatientOne(browser) {
  const persona = 'The Impatient One';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${persona}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  let dialogMessages = [];
  page.on('dialog', async dialog => {
    dialogMessages.push(dialog.message());
    console.log(`  [DIALOG] "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    const opened = await openFirstProduct(page);
    if (!opened) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_no_products.png'), fullPage: true });
      recordIssue({ persona, title: 'No se encontraron productos en la tienda', description: 'El catalogo no tiene productos visibles.', screenshot: 'impatient_no_products.png', severity: 'high' });
      await context.close();
      return;
    }

    const added = await clickAddToCart(page);
    if (!added) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_no_add_btn.png') });
      recordIssue({ persona, title: 'Boton "Agregar al Carrito" no visible tras abrir producto', description: 'Al abrir un producto, el boton de compra no fue encontrado o no estaba visible.', screenshot: 'impatient_no_add_btn.png', severity: 'high' });
    }

    const cartOpened = await openCart(page);

    if (cartOpened) {
      const submitBtn = page.locator('button:has-text("Finalizar Pedido")').first();
      if (await submitBtn.count() > 0 && await submitBtn.isVisible()) {
        dialogMessages = [];
        await submitBtn.click();
        await page.waitForTimeout(1000);

        if (dialogMessages.length > 0) {
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_alert_validation.png') });
          recordIssue({
            persona,
            title: 'Validacion mediante alert() nativo en vez de feedback inline',
            description: `Al hacer clic en "Finalizar Pedido" sin datos, se mostro un alert() nativo: "${dialogMessages[0]}". Los pop-ups nativos frustran a usuarios impacientes que esperan validacion inline.`,
            screenshot: 'impatient_alert_validation.png',
            severity: 'high'
          });
        }
      } else {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_no_submit.png') });
        recordIssue({ persona, title: 'Boton de finalizar pedido no visible en carrito', description: 'No se encontro el boton de checkout dentro del cart drawer.', screenshot: 'impatient_no_submit.png', severity: 'medium' });
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_final.png') });
  } catch (err) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'impatient_error.png') }).catch(() => {});
    recordIssue({ persona, title: 'Error fatal durante navegacion rapida', description: err.message.substring(0, 300), screenshot: 'impatient_error.png', severity: 'high' });
  } finally {
    if (consoleErrors.length > 0) {
      recordIssue({ persona, title: 'Errores en consola del navegador', description: consoleErrors.slice(0, 3).join(' | '), screenshot: 'impatient_final.png', severity: 'low' });
    }
    await context.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA 2: THE SKEPTIC
// ─────────────────────────────────────────────────────────────────────────────
async function runTheSkeptic(browser) {
  const persona = 'The Skeptic';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${persona}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    // 1. Check footer for legal links
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const footerPolicies = page.locator('footer button, footer a').filter({ hasText: /t[eé]rminos|privacidad|pol[ií]tica/i });
    const hasFooterPolicies = await footerPolicies.count() > 0;

    if (!hasFooterPolicies) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_no_footer_policies.png'), fullPage: true });
      recordIssue({
        persona,
        title: 'Sin enlaces visibles a Terminos o Privacidad en el footer',
        description: 'El usuario esceptico busca en el pie de pagina las politicas de la tienda y no las encuentra.',
        screenshot: 'skeptic_no_footer_policies.png',
        severity: 'high'
      });
    } else {
      const policyBtn = footerPolicies.first();
      await policyBtn.click();
      await page.waitForTimeout(800);
      const policyModal = page.locator('.fixed.inset-0.z-50');
      if (await policyModal.count() > 0) {
        const text = await policyModal.first().innerText().catch(() => '');
        if (text.length < 100) {
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_empty_policies.png') });
          recordIssue({ persona, title: 'Contenido de Terminos o Privacidad demasiado breve', description: `El texto legal tiene solo ${text.length} caracteres.`, screenshot: 'skeptic_empty_policies.png', severity: 'medium' });
        }
        await dismissOverlays(page);
      }
    }

    // 2. Add product and inspect pricing in cart
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const productOpened = await openFirstProduct(page);
    if (productOpened) {
      await clickAddToCart(page);
      const cartOpen = await openCart(page);

      if (cartOpen) {
        const cartDrawer = page.locator('.fixed.inset-0.z-50').first();
        const cartText = await cartDrawer.innerText().catch(() => '');

        const hasSubtotal = /subtotal/i.test(cartText);
        const hasCostoEnvio = /costo de env/i.test(cartText) || /flete/i.test(cartText);
        const hasTotal = /total a pagar/i.test(cartText);

        if (!hasSubtotal || !hasCostoEnvio || !hasTotal) {
          const missing = [];
          if (!hasSubtotal) missing.push('Subtotal');
          if (!hasCostoEnvio) missing.push('Costo de Envio');
          if (!hasTotal) missing.push('Total a Pagar');
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_breakdown.png') });
          recordIssue({
            persona,
            title: 'Desglose de costos incompleto en el carrito',
            description: `Faltan en la vista del carrito: ${missing.join(', ')}.`,
            screenshot: 'skeptic_breakdown.png',
            severity: 'medium'
          });
        }

        // Check bank details
        const transferBtn = page.locator('button:has-text("Transferencia")').first();
        if (await transferBtn.count() > 0 && await transferBtn.isVisible()) {
          await transferBtn.click();
          await page.waitForTimeout(600);
          const bodyText = await page.innerText('body');
          const hasAlias = /alias/i.test(bodyText);
          const hasTitular = /titular/i.test(bodyText);

          if (!hasAlias || !hasTitular) {
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_bank_info.png') });
            recordIssue({ persona, title: 'Informacion bancaria incompleta para transferencias', description: 'Falta Alias SIPAP o Titular de la cuenta.', screenshot: 'skeptic_bank_info.png', severity: 'medium' });
          }
        }

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_cart_final.png') });
      }
    }
  } catch (err) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'skeptic_error.png') }).catch(() => {});
    recordIssue({ persona, title: 'Error durante analisis de confianza', description: err.message.substring(0, 300), screenshot: 'skeptic_error.png', severity: 'medium' });
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA 3: THE MOBILE USER (375px)
// ─────────────────────────────────────────────────────────────────────────────
async function runTheMobileUser(browser) {
  const persona = 'The Mobile User';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${persona} (375x667)`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  try {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const loadTime = Date.now() - startTime;
    console.log(`  Page loaded in ${loadTime}ms`);
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    // 1. Horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > 380) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_overflow.png') });
      recordIssue({ persona, title: 'Desborde horizontal en pantalla movil (375px)', description: `scrollWidth=${scrollWidth}px excede los 375px.`, screenshot: 'mobile_overflow.png', severity: 'high' });
    }

    // 2. Search bar
    const mobileSearch = page.locator('input[placeholder*="Buscar"]:visible').first();
    if (await mobileSearch.count() === 0) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_no_search.png') });
      recordIssue({ persona, title: 'Barra de busqueda no visible en movil', description: 'El usuario movil no puede buscar productos.', screenshot: 'mobile_no_search.png', severity: 'medium' });
    }

    // 3. Open product and check CTA
    const productOpened = await openFirstProduct(page);
    if (productOpened) {
      const addBtn = page.locator('[data-testid="add-to-cart-modal-btn"]').first();
      if (await addBtn.count() > 0) {
        await addBtn.scrollIntoViewIfNeeded().catch(() => {});
        const isVisible = await addBtn.isVisible();
        if (!isVisible) {
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_cta_hidden.png') });
          recordIssue({ persona, title: 'Boton de compra oculto en modal movil', description: 'Requiere scroll extenso para encontrar "Agregar al Carrito".', screenshot: 'mobile_cta_hidden.png', severity: 'medium' });
        } else {
          await clickAddToCart(page);
        }
      }
      await dismissOverlays(page);
    }

    // 4. Cart drawer on mobile
    const cartOpen = await openCart(page);
    if (cartOpen) {
      const submitBtn = page.locator('button:has-text("Finalizar Pedido")');
      if (await submitBtn.count() > 0) await submitBtn.first().scrollIntoViewIfNeeded().catch(() => {});
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_cart.png') });
    }

    // 5. Small touch targets
    const smallTargets = await page.evaluate(() => {
      let small = 0;
      document.querySelectorAll('button, a, input[type=submit]').forEach(btn => {
        const r = btn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 36 || r.height < 36) && getComputedStyle(btn).display !== 'none' && r.top < window.innerHeight) small++;
      });
      return small;
    });

    if (smallTargets > 3) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_small_targets.png') });
      recordIssue({ persona, title: 'Touch targets demasiado pequenos para dedos', description: `${smallTargets} botones con ancho/alto < 36px. Apple recomienda min 44px.`, screenshot: 'mobile_small_targets.png', severity: 'low' });
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_final.png') });
  } catch (err) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_error.png') }).catch(() => {});
    recordIssue({ persona, title: 'Error de navegacion en version movil', description: err.message.substring(0, 300), screenshot: 'mobile_error.png', severity: 'high' });
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA 4: THE NON-NATIVE / LITERAL USER
// ─────────────────────────────────────────────────────────────────────────────
async function runTheLiteralUser(browser) {
  const persona = 'The Non-Native / Literal User';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${persona}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    // 1. Icon-only buttons
    const unlabeled = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.innerText.trim();
        const aria = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        const r = btn.getBoundingClientRect();
        return !text && !aria && !title && r.width > 0 && r.height > 0;
      }).length;
    });

    if (unlabeled > 0) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'literal_unlabeled.png') });
      recordIssue({ persona, title: 'Botones sin texto ni etiqueta accesible (solo icono)', description: `${unlabeled} boton(es) sin texto, aria-label, ni title.`, screenshot: 'literal_unlabeled.png', severity: 'medium' });
    }

    // 2. Add product and check form
    const productOpened = await openFirstProduct(page);
    if (productOpened) {
      await clickAddToCart(page);
      const cartOpen = await openCart(page);

      if (cartOpen) {
        const inputAudit = await page.evaluate(() => {
          let missing = 0;
          document.querySelectorAll('.fixed.inset-0 input:not([type=radio]):not([type=checkbox]):not([type=hidden]), .fixed.inset-0 textarea').forEach(el => {
            if (!el.getAttribute('placeholder')) missing++;
          });
          return missing;
        });

        if (inputAudit > 0) {
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'literal_no_placeholders.png') });
          recordIssue({ persona, title: 'Campos de formulario sin placeholder descriptivo', description: `${inputAudit} campo(s) sin placeholder en el checkout.`, screenshot: 'literal_no_placeholders.png', severity: 'low' });
        }

        const bodyText = await page.innerText('body');
        const hasVillarrica = /villarrica/i.test(bodyText);
        const hasOtherExplain = /otra ciudad|resto del pa/i.test(bodyText) || /todo el Paraguay/i.test(bodyText);
        if (hasVillarrica && !hasOtherExplain) {
          recordIssue({ persona, title: 'Opciones de envio poco claras para clientes de otras ciudades', description: 'El usuario ve "Villarrica" e "Interior" pero no queda claro que "Interior" abarca todo Paraguay.', screenshot: 'literal_no_placeholders.png', severity: 'medium' });
        }
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'literal_final.png') });
  } catch (err) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'literal_error.png') }).catch(() => {});
    recordIssue({ persona, title: 'Error en analisis de usuario literal', description: err.message.substring(0, 300), screenshot: 'literal_error.png', severity: 'medium' });
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA 5: THE BREAKER
// ─────────────────────────────────────────────────────────────────────────────
async function runTheBreaker(browser) {
  const persona = 'The Breaker';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${persona}`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  let pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  let dialogMessages = [];
  page.on('dialog', async dialog => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await dismissOverlays(page);

    // 1. Rapid multi-click on product card
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.count() > 0) {
      await productCard.scrollIntoViewIfNeeded();
      await productCard.click({ clickCount: 3, delay: 30 });
      await page.waitForTimeout(800);

      // 2. Rapid-click Add to Cart
      const addBtn = page.locator('[data-testid="add-to-cart-modal-btn"]').first();
      if (await addBtn.count() > 0 && await addBtn.isVisible()) {
        for (let i = 0; i < 5; i++) {
          await addBtn.click({ force: true, delay: 10 }).catch(() => {});
        }
        await page.waitForTimeout(800);
      }

      await dismissOverlays(page);
      await openCart(page);

      // 3. Fuzz
      const junk = {
        name: '<script>alert("xss")</script><img onerror=alert(1) src=x>',
        phone: '---!@#$%NOPHONE---',
        doc: '9'.repeat(80),
        address: 'X'.repeat(500)
      };

      const nameInput = page.locator('input[placeholder*="Nombre" i]').first();
      if (await nameInput.count() > 0) await nameInput.fill(junk.name).catch(() => {});

      const phoneInput = page.locator('input[placeholder*="Celular" i], input[type="tel"]').first();
      if (await phoneInput.count() > 0) await phoneInput.fill(junk.phone).catch(() => {});

      const docInput = page.locator('input[placeholder*="dula" i], input[placeholder*="C.I." i]').first();
      if (await docInput.count() > 0) await docInput.fill(junk.doc).catch(() => {});

      const addrInput = page.locator('textarea[placeholder*="Direcci" i]').first();
      if (await addrInput.count() > 0) await addrInput.fill(junk.address).catch(() => {});

      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'breaker_fuzzed.png') });

      // Check XSS
      const bodyHtml = await page.innerHTML('body');
      if (bodyHtml.includes('<script>alert') || bodyHtml.includes('onerror=alert')) {
        recordIssue({ persona, title: 'Posible vulnerabilidad XSS', description: 'El texto del input se renderizo como HTML en el DOM.', screenshot: 'breaker_fuzzed.png', severity: 'high' });
      }

      // 4. Double-click Finalizar
      dialogMessages = [];
      const submitBtn = page.locator('button:has-text("Finalizar Pedido")').first();
      if (await submitBtn.count() > 0 && await submitBtn.isVisible()) {
        await submitBtn.click({ clickCount: 2, delay: 30 }).catch(() => {});
        await page.waitForTimeout(1000);

        if (dialogMessages.length > 0) {
          recordIssue({ persona, title: 'Validacion con alert() nativo en vez de feedback inline', description: `El usuario breaker activo un alert: "${dialogMessages[0]}"`, screenshot: 'breaker_fuzzed.png', severity: 'high' });
        }
      }

      // 5. Back button mid-flow
      await page.goBack();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'breaker_after_back.png') });

      const alive = await page.evaluate(() => document.readyState).catch(() => null);
      if (!alive) {
        recordIssue({ persona, title: 'Pagina se rompio tras presionar "Atras"', description: 'La app no se recupero correctamente al navegar atras.', screenshot: 'breaker_after_back.png', severity: 'high' });
      }
    }
  } catch (err) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'breaker_error.png') }).catch(() => {});
    recordIssue({ persona, title: 'Error durante prueba de estres', description: err.message.substring(0, 300), screenshot: 'breaker_error.png', severity: 'high' });
  } finally {
    if (pageErrors.length > 0) {
      recordIssue({ persona, title: 'Excepciones JS no capturadas durante uso agresivo', description: pageErrors.slice(0, 3).join(' | '), screenshot: 'breaker_after_back.png', severity: 'high' });
    }
    await context.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RUNNER & REPORT
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('QA Personas Simulation v2 - Microsoft Edge (headless)\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    console.log('⏳ Calentando catálogo y verificando carga inicial...');
    const warmup = await browser.newPage();
    await warmup.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await warmup.waitForSelector('[data-testid="product-card"]', { state: 'visible', timeout: 35000 }).catch(() => {});
    await warmup.close();
    console.log('✅ Catálogo listo. Iniciando simulación de los 5 usuarios.\n');

    await runTheImpatientOne(browser);
    await runTheSkeptic(browser);
    await runTheMobileUser(browser);
    await runTheLiteralUser(browser);
    await runTheBreaker(browser);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(RESULTS_DIR, 'issues.json'), JSON.stringify(allIssues, null, 2));

  const grouped = {};
  allIssues.forEach(issue => {
    const key = issue.title;
    if (!grouped[key]) grouped[key] = { title: issue.title, severity: issue.severity, personas: new Set(), descriptions: [], screenshots: [] };
    grouped[key].personas.add(issue.persona);
    if (!grouped[key].descriptions.includes(issue.description)) grouped[key].descriptions.push(issue.description);
    if (issue.screenshot && !grouped[key].screenshots.includes(issue.screenshot)) grouped[key].screenshots.push(issue.screenshot);
    if (grouped[key].personas.size >= 3 && grouped[key].severity !== 'high') grouped[key].severity = 'high';
  });

  const ranked = Object.values(grouped).map(g => ({
    title: g.title, severity: g.severity, impactCount: g.personas.size,
    personas: Array.from(g.personas), descriptions: g.descriptions, screenshots: g.screenshots
  })).sort((a, b) => b.impactCount - a.impactCount || (a.severity === 'high' ? -1 : 1));

  fs.writeFileSync(path.join(RESULTS_DIR, 'ranked_report.json'), JSON.stringify(ranked, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SIMULATION COMPLETE - ${ranked.length} distinct issues found`);
  console.log(`${'='.repeat(60)}`);
  ranked.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.impactCount} users] [${issue.severity.toUpperCase()}] ${issue.title}`);
    console.log(`   -> ${issue.personas.join(', ')}`);
  });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
