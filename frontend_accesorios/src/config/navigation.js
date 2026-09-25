import { ShoppingCart, Gem, Package, Sliders, Home, Users, Store } from 'lucide-react';

export const getNavItems = (cartCount = 0) => [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'pos', label: 'Vender', icon: ShoppingCart, badge: cartCount },
  { id: 'storefront', label: 'Tienda Web', icon: Store },
  { id: 'inventory', label: 'Stock', icon: Gem },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'imports', label: 'Envíos', icon: Package },
  { id: 'settings', label: 'Ajustes', icon: Sliders },
];