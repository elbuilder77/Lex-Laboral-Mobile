import React from 'react';
import { AppView } from '../types';
import { Home, Calculator, ShieldCheck, Landmark } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface BottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const handleNav = async (view: AppView) => {
    if (currentView !== view) {
      onChangeView(view);
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
  };

  const navItems = [
    {
      id: AppView.HOME,
      label: 'Inicio',
      icon: <Home size={22} />,
      activeViews: [
        AppView.HOME, 
      ]
    },
    {
      id: AppView.CALCULATOR,
      label: 'Finiquito',
      icon: <Calculator size={22} />,
      activeViews: [AppView.CALCULATOR]
    },
    {
      id: AppView.SOCIAL_SECURITY,
      label: 'IMSS',
      icon: <ShieldCheck size={22} />,
      activeViews: [AppView.SOCIAL_SECURITY]
    },
    {
      id: AppView.PENSION_CALCULATOR,
      label: 'Pensión',
      icon: <Landmark size={22} />,
      activeViews: [AppView.PENSION_CALCULATOR]
    }
  ];

  return (
    <div data-debug-nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-[#fbfaf7]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="grid h-[68px] grid-cols-4 px-2">
        {navItems.map((item) => {
          const isActive = item.activeViews.includes(currentView);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              aria-label={item.label}
              className={`flex h-full min-w-0 flex-col items-center justify-center gap-1 transition-colors duration-200 ${
                isActive ? 'text-legal-gold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`max-w-full truncate px-0.5 text-[10px] font-semibold ${isActive ? 'text-legal-gold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
