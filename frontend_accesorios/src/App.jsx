import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import POSView from './views/POSView';
import InventoryView from './views/InventoryView';
import ImportsView from './views/ImportsView';
import DashboardView from './views/DashboardView';
import SettingsView from './views/SettingsView';
import BulkUploadView from './views/BulkUploadView';
import { fetchProductos, fetchLotes, syncCotizaciones } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsData, lotesData] = await Promise.all([
        fetchProductos(),
        fetchLotes(),
      ]);
      setProductos(prodsData);
      setLotes(lotesData);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Barra Superior */}
      <Header
        activeTab={activeTab}
        cartCount={cartTotalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onQuickSync={handleQuickSync}
        syncing={syncing}
      />

      {/* Contenido Principal */}
      <main className="flex-1 w-full">
        {loading && productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500 text-xs">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span>Cargando sistema de accesorios...</span>
          </div>
        ) : (
          <>
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

            {activeTab === 'inventory' && (
              <InventoryView
                productos={productos}
                onOpenBulkUpload={() => setActiveTab('bulk-upload')}
                onReload={loadData}
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
              <DashboardView onActionSuccess={loadData} />
            )}

            {activeTab === 'settings' && (
              <SettingsView onSyncSuccess={loadData} />
            )}
          </>
        )}
      </main>

      {/* Navegación Inferior Móvil */}
      <BottomNav
        activeTab={activeTab === 'bulk-upload' ? 'inventory' : activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalItems}
      />
    </div>
  );
}

