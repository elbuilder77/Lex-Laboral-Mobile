import React from 'react';
import { AppView } from '../types';
import { Home, PenTool, Calculator, ShieldCheck } from 'lucide-react';
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
      id: AppView.DRAFTING,
      label: 'Docs IA',
      icon: <PenTool size={22} />,
      activeViews: [AppView.DRAFTING]
    }
  ];

  return (
    <div data-debug-nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0F1C]/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.activeViews.includes(currentView);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-legal-gold' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-legal-gold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
