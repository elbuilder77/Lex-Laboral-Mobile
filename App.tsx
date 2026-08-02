import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Home } from './components/Home';
import { NotificationHub } from './components/NotificationHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';

// Lazy loading components
const LegalView = lazy(() => import('./components/LegalView').then(module => ({ default: module.LegalView })));
const Drafter = lazy(() => import('./components/Drafter').then(module => ({ default: module.Drafter })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));
const PensionCalculator = lazy(() => import('./components/PensionCalculator').then(module => ({ default: module.PensionCalculator })));
import { BottomNav } from './components/BottomNav';

import { AppView } from './types';
import type { AppNotification, NotificationType, DraftingState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [draftingState, setDraftingState] = useState<DraftingState>({ prompt: '', generatedDoc: '' });

  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const renderView = () => {
    return (
      <div className="h-full w-full animate-fade-in relative overflow-y-auto">
        <Suspense fallback={
          <div className="h-full w-full min-h-[600px] flex items-center justify-center animate-in fade-in duration-500">
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin mb-3"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Iniciando Herramienta...</span>
             </div>
          </div>
        }>
          {(() => {
            switch (currentView) {
              case AppView.HOME:
                return <Home onNavigate={handleViewChange} />;
              case AppView.DRAFTING:
                return <Drafter
                  state={draftingState}
                  setState={setDraftingState}
                  notify={notify}
                />;
              case AppView.CALCULATOR:
                return (
                  <LaborCalculator
                    notify={notify}
                    onOpenDrafting={() => handleViewChange(AppView.DRAFTING)}
                    onOpenImss={() => handleViewChange(AppView.SOCIAL_SECURITY)}
                  />
                );
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator
                  notify={notify}
                />;
              case AppView.PENSION_CALCULATOR:
                return <PensionCalculator
                  notify={notify}
                />;
              case AppView.TERMS:
                return <LegalView type={AppView.TERMS} onBack={() => handleViewChange(AppView.HOME)} />;
              case AppView.PRIVACY:
                return <LegalView type={AppView.PRIVACY} onBack={() => handleViewChange(AppView.HOME)} />;
              default:
                return <Home onNavigate={handleViewChange} />;
            }
          })()}
        </Suspense>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans selection:bg-legal-gold/30">
        <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
        <DebugPanel />

        <main className="flex-1 relative overflow-hidden flex flex-col h-full bg-slate-50">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]">
            {renderView()}
          </div>
        </main>

        <BottomNav currentView={currentView} onChangeView={handleViewChange} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
