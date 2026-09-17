import React from 'react';
import { getNavItems } from '../config/navigation';

export default function BottomNav({ activeTab, setActiveTab, cartCount }) {
  const navItems = getNavItems(cartCount);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 safe-area-pb transition-colors duration-200">
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
                  ? 'text-black dark:text-white font-bold scale-105'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[10px] bg-black text-white dark:bg-white dark:text-black font-black rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wider uppercase mt-0.5 font-sans">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-black dark:bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}


