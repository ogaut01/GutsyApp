import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import {
  fetchProductos, fetchLotes, syncCotizaciones,
  getStoredToken, getStoredUser, fetchMe, logoutApi
} from './services/api';

// ─── Code Splitting / Lazy Loading de Vistas ──────────────────────────────
const StorefrontView = lazy(() => import('./views/StorefrontView'));
const LoginView = lazy(() => import('./views/LoginView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const InventoryView = lazy(() => import('./views/InventoryView'));
const POSView = lazy(() => import('./views/POSView'));
const PedidosWebView = lazy(() => import('./views/PedidosWebView'));
const ClientsView = lazy(() => import('./views/ClientsView'));
const ImportsView = lazy(() => import('./views/ImportsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const BulkUploadView = lazy(() => import('./views/BulkUploadView'));

function ViewLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-zinc-500 text-xs">
      <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-3" />
      <span className="uppercase tracking-widest font-mono text-[10px]">Cargando vista...</span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Hash secreto para acceso admin — no aparece en ningún enlace de la UI
  const SECRET_ADMIN_HASH = '#gsy-cp-2024';

  const [showAdminLogin, setShowAdminLogin] = useState(() => {
    const isSecret = window.location.hash === SECRET_ADMIN_HASH;
    if (isSecret) {
      // Limpiar el hash de la URL inmediatamente para no dejarlo visible
      history.replaceState(null, '', window.location.pathname);
    }
    return isSecret;
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (p.startsWith('/producto') || p.startsWith('/p/') || p.startsWith('/categoria')) {
        return 'storefront';
      }
    }
    return localStorage.getItem('gutsy_active_tab') || 'dashboard';
  });

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('gutsy_active_tab', activeTab);
    }
  }, [activeTab]);

  const [productos, setProductos] = useState([]);
  const [inventoryAlertFilter, setInventoryAlertFilter] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ─── Modo Claro / Oscuro (Della Poletti Luxury Theme) ─────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gutsy_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('gutsy_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ─── Verificación de Autenticación al Iniciar ─────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const userData = await fetchMe();
        setUser(userData);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Escuchar evento de 401 para desloguear automáticamente
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Escuchar cambio de hash para acceso admin secreto (por si el app ya está corriendo)
    const handleHashChange = () => {
      if (window.location.hash === SECRET_ADMIN_HASH) {
        history.replaceState(null, '', window.location.pathname);
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowAdminLogin(false);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setActiveTab('dashboard');
  };

  // ─── Carga de Datos Principales (Catálogo para clientes y Admin) ──────────
  const loadData = async () => {
    try {
      setLoading(true);
      if (user) {
        const [prodsData, lotesData] = await Promise.all([
          fetchProductos().catch(() => []),
          fetchLotes().catch(() => []),
        ]);
        setProductos(prodsData || []);
        setLotes(lotesData || []);
      } else {
        const prodsData = await fetchProductos().catch(() => []);
        setProductos(prodsData || []);
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleQuickSync = async () => {
    setSyncing(true);
    try {
      await syncCotizaciones();
      await loadData();
      alert('✅ Cotizaciones y catálogo actualizados');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Pantalla de carga mientras se verifica el token inicial
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500 text-xs">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
        <span className="uppercase tracking-widest font-mono text-[10px]">Cargando Gutsy...</span>
      </div>
    );
  }

  // ─── VISTA PÚBLICA (Para clientes o cuando no hay sesión) ─────────────────
  if (!user) {
    if (showAdminLogin) {
      return (
        <Suspense fallback={<ViewLoadingFallback />}>
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onBackToStore={() => setShowAdminLogin(false)}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <StorefrontView
          productos={productos}
          onOpenAdminLogin={() => setShowAdminLogin(true)}
          user={null}
          theme={theme}
          onToggleTheme={toggleTheme}
          isLoading={loading}
        />
      </Suspense>
    );
  }

  // Si el usuario autenticado decide navegar a la tienda pública
  if (activeTab === 'storefront') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <StorefrontView
          productos={productos}
          user={user}
          onGoToAdmin={() => setActiveTab('dashboard')}
          theme={theme}
          onToggleTheme={toggleTheme}
          isLoading={loading}
        />
      </Suspense>
    );
  }

  // ─── PANEL ADMINISTRATIVO PRIVADO ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar de Navegación (Solo Desktop md:flex) */}
      <Sidebar
        activeTab={activeTab === 'bulk-upload' ? 'inventory' : activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalItems}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Barra Superior */}
        <Header
          activeTab={activeTab}
          cartCount={cartTotalItems}
          onOpenCart={() => setIsCartOpen(true)}
          onQuickSync={handleQuickSync}
          syncing={syncing}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
        />

        {/* Contenido Principal */}
        <main className="flex-1 w-full">
          {loading && productos.length === 0 && (activeTab === 'pos' || activeTab === 'inventory') ? (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-500 text-xs">
              <div className="w-8 h-8 border-2 border-white dark:border-white border-t-transparent rounded-full animate-spin mb-3" />
              <span className="uppercase tracking-widest font-mono text-[10px]">Cargando catálogo de accesorios...</span>
            </div>
          ) : (
            <Suspense fallback={<ViewLoadingFallback />}>
              {activeTab === 'pos' && (
                <POSView
                  productos={productos}
                  onSaleSuccess={loadData}
                  cart={cart}
                  setCart={setCart}
                  isCartOpen={isCartOpen}
                  setIsCartOpen={setIsCartOpen}
                />
              )}

              {activeTab === 'pedidos-web' && (
                <PedidosWebView onReloadParent={loadData} />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  productos={productos}
                  alertFilter={inventoryAlertFilter}
                  onClearAlertFilter={() => setInventoryAlertFilter(null)}
                  onOpenBulkUpload={() => setActiveTab('bulk-upload')}
                  onReload={loadData}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientsView
                  onNavigateToPos={() => setActiveTab('pos')}
                />
              )}

              {activeTab === 'bulk-upload' && (
                <BulkUploadView
                  onBack={() => setActiveTab('inventory')}
                  onSuccess={loadData}
                />
              )}

              {activeTab === 'imports' && (
                <ImportsView lotes={lotes} onReload={loadData} />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  onActionSuccess={loadData}
                  onNavigate={(tab, alertFilter = null) => {
                    setInventoryAlertFilter(tab === 'inventory' ? alertFilter : null);
                    setActiveTab(tab);
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView onSyncSuccess={loadData} />
              )}
            </Suspense>
          )}
        </main>
      </div>

      {/* Navegación Inferior Móvil */}
      <BottomNav
        activeTab={activeTab === 'bulk-upload' ? 'inventory' : activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalItems}
      />
    </div>
  );
}
