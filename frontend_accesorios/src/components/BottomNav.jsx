import React from 'react';
import { ShoppingCart, Gem, Package, TrendingUp, Sliders, Home } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, cartCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'pos', label: 'Vender', icon: ShoppingCart, badge: cartCount },
    { id: 'inventory', label: 'Stock', icon: Gem },
    { id: 'imports', label: 'Envíos', icon: Package },
    { id: 'settings', label: 'Ajustes', icon: Sliders },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-amber-400 font-semibold scale-105'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[10px] bg-amber-500 text-zinc-950 font-black rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
