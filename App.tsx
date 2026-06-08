
import React, { useState, useCallback, useEffect, Suspense, lazy, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { LegalView } from './components/LegalView';
import { NotificationHub } from './components/NotificationHub';
import { PricingModal } from './components/PricingModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './components/AuthProvider';
import { LoginModal } from './components/LoginModal';
import { trackEvent } from './lib/analytics';
import { updateSEO } from './lib/seo';
import { getPathForView, getViewForPath } from './lib/routes';

// Lazy loading components
const Drafter = lazy(() => import('./components/Drafter').then(module => ({ default: module.Drafter })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));
const PensionCalculator = lazy(() => import('./components/PensionCalculator').then(module => ({ default: module.PensionCalculator })));
const CEODashboard = lazy(() => import('./components/CEODashboard').then(module => ({ default: module.CEODashboard })));

import { AppView, AppNotification, NotificationType, DraftingState } from './types';
import { Menu, X } from 'lucide-react';

// CEO check moved to secure backend route

function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => getViewForPath(window.location.pathname));
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'draft_basic' | 'mensualidad' | 'trimestralidad'>('draft_basic');
  const [draftingState, setDraftingState] = useState<DraftingState>({ prompt: '', generatedDoc: '' });
  const [pendingPostLoginAction, setPendingPostLoginAction] = useState<{
    type: 'resume_pricing';
    plan: 'draft_basic' | 'mensualidad' | 'trimestralidad';
    sourceView?: AppView;
  } | null>(null);

  const { user, access, loading: authLoading, session, signOut } = useAuth();
  const previousUserRef = useRef<typeof user>(user);

  // isCEO now fetched from secure backend endpoint
  const [isCEO, setIsCEO] = useState(false);

  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const openPricingModal = useCallback((plan: 'draft_basic' | 'mensualidad' | 'trimestralidad' = 'draft_basic') => {
    setSelectedPlan(plan);
    setIsPricingModalOpen(true);
    trackEvent('pricing_opened', { plan });
  }, []);

  const openLoginModal = useCallback((action?: {
    type: 'resume_pricing';
    plan: 'draft_basic' | 'mensualidad' | 'trimestralidad';
    sourceView?: AppView;
  }) => {
    if (action) {
      setPendingPostLoginAction(action);
    }

    setIsLoginModalOpen(true);
  }, []);

  // SEO: actualizar tags al montar con la vista inicial
  useEffect(() => {
    updateSEO(currentView);
  }, [currentView]);

  // Cambio de vista con analytics y SEO
  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view);
    const nextPath = getPathForView(view);
    const currentPath = window.location.pathname;
    if (nextPath !== currentPath) {
      window.history.pushState({}, '', nextPath);
    }
    trackEvent('view_changed', { view });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentView(getViewForPath(window.location.pathname));
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setCurrentView(AppView.HOME);
    notify('Sesión cerrada correctamente', 'info');
  }, [notify, signOut]);

  useEffect(() => {
    const hadUser = previousUserRef.current;

    if (!hadUser && user && pendingPostLoginAction && !authLoading) {
      if (pendingPostLoginAction.type === 'resume_pricing') {
        const needsPricing =
          pendingPostLoginAction.plan === 'draft_basic'
            ? !access.hasActiveSubscription && access.singleDocumentUsesRemaining < 1
            : !access.hasActiveSubscription;

        if (needsPricing) {
          openPricingModal(pendingPostLoginAction.plan);
          notify('Continúa con tu compra.', 'info');
        } else if (pendingPostLoginAction.sourceView === AppView.SOCIAL_SECURITY) {
          notify('Tu acceso ya está activo. Continúa con IMSS.', 'success');
        } else if (pendingPostLoginAction.sourceView === AppView.DRAFTING) {
          notify('Tu acceso ya está activo. Continúa con documentos.', 'success');
        }
      }

      setPendingPostLoginAction(null);
    }

    previousUserRef.current = user;
  }, [
    access.hasActiveSubscription,
    access.singleDocumentUsesRemaining,
    authLoading,
    notify,
    openPricingModal,
    pendingPostLoginAction,
    user,
  ]);

  // Secure CEO check using backend
  useEffect(() => {
    if (!user) {
      setIsCEO(false);
      return;
    }
    const checkCEO = async () => {
      try {
        const res = await fetch('/api/ceo/verify', {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setIsCEO(data.isCEO === true);
        } else {
          setIsCEO(false);
        }
      } catch {
        setIsCEO(false);
      }
    };
    checkCEO();
  }, [session?.access_token, user]);

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
                return <Home onNavigate={handleViewChange} user={user} onLogin={() => openLoginModal()} onLogout={handleLogout} />;
              case AppView.DRAFTING:
                return <Drafter
                  state={draftingState}
                  setState={setDraftingState}
                  notify={notify}
                  onUpgrade={(plan) => openPricingModal(plan || 'draft_basic')}
                  onAuthRequired={() =>
                    openLoginModal({
                      type: 'resume_pricing',
                      plan: 'draft_basic',
                      sourceView: AppView.DRAFTING,
                    })
                  }
                />;
              case AppView.CALCULATOR:
                return (
                  <LaborCalculator
                    notify={notify}
                    onRequireLogin={() => openLoginModal()}
                    onOpenDrafting={() => handleViewChange(AppView.DRAFTING)}
                    onOpenImss={() => handleViewChange(AppView.SOCIAL_SECURITY)}
                    onOpenPricing={openPricingModal}
                  />
                );
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator 
                  notify={notify} 
                  onRequireLogin={() =>
                    openLoginModal({
                      type: 'resume_pricing',
                      plan: 'mensualidad',
                      sourceView: AppView.SOCIAL_SECURITY,
                    })
                  }
                  onRequirePremium={() => openPricingModal('mensualidad')}
                />;
              case AppView.PENSION_CALCULATOR:
                return <PensionCalculator
                  notify={notify}
                  onRequireLogin={() => openLoginModal()}
                />;
              case AppView.CEO_DASHBOARD:
                return isCEO ? <CEODashboard /> : <Home onNavigate={handleViewChange} user={user} onLogin={() => openLoginModal()} onLogout={handleLogout} />;
              case AppView.TERMS:
                return <LegalView type={AppView.TERMS} onBack={() => handleViewChange(AppView.HOME)} />;
              case AppView.PRIVACY:
                return <LegalView type={AppView.PRIVACY} onBack={() => handleViewChange(AppView.HOME)} />;
              default:
                return <Home onNavigate={handleViewChange} user={user} onLogin={() => openLoginModal()} onLogout={handleLogout} />;
            }
          })()}
        </Suspense>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden font-sans selection:bg-legal-gold/30">
        <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
      
      {currentView !== AppView.HOME && (
        <>
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-6 py-4 bg-legal-950 text-white z-40 border-b border-white/5 shadow-2xl">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => handleViewChange(AppView.HOME)}
            >
               <img src="/assets/logo.webp" alt="Lex Laboral" className="h-8 w-auto object-contain" loading="lazy" />
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Sidebar Overlay for Mobile */}
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Container */}
          <div className={`fixed inset-y-0 left-0 z-[70] transition-transform duration-300 transform md:relative md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <Sidebar 
              currentView={currentView} 
              onChangeView={(v) => { handleViewChange(v); setIsSidebarOpen(false); }} 
              onNewCase={() => handleViewChange(AppView.HOME)} 
              onLogout={() => {}}
              user={null}
              userData={null}
              isPremium={false}
              isGuest={true}
              notify={notify}
              onOpenPricing={openPricingModal}
              isCEO={isCEO}
            />
          </div>
        </>
      )}

      <main className="flex-1 relative overflow-hidden flex flex-col h-full bg-slate-50">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderView()}
        </div>
      </main>

      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        notify={notify} 
        initialPlan={selectedPlan}
        onRequireLogin={(plan) =>
          openLoginModal({
            type: 'resume_pricing',
            plan,
            sourceView: currentView,
          })
        }
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      </div>
    </ErrorBoundary>
  );
}

export default App;
