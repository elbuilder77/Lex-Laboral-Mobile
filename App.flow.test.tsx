import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthState, signOutMock } = vi.hoisted(() => ({
  mockAuthState: {
    user: null as null | { email?: string; id?: string },
    access: {
      hasActiveSubscription: false,
      isPremium: false,
      licenseType: null,
      accessUntil: null,
      singleDocumentUsesRemaining: 0,
    },
    loading: false,
  },
  signOutMock: vi.fn(),
}));

vi.mock('./components/AuthProvider', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    access: mockAuthState.access,
    loading: mockAuthState.loading,
    refreshAccess: vi.fn(),
    signOut: signOutMock,
    session: null,
  }),
}));

vi.mock('./components/Sidebar', () => ({
  Sidebar: () => <div>sidebar</div>,
}));

vi.mock('./components/Home', () => ({
  Home: () => <div>home</div>,
}));

vi.mock('./components/LegalView', () => ({
  LegalView: () => <div>legal</div>,
}));

vi.mock('./components/NotificationHub', () => ({
  NotificationHub: () => null,
}));

vi.mock('./components/PricingModal', () => ({
  PricingModal: ({ isOpen, initialPlan }: { isOpen: boolean; initialPlan: string }) =>
    isOpen ? <div>{`pricing:${initialPlan}`}</div> : null,
}));

vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/LoginModal', () => ({
  LoginModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>login-open</div> : null),
}));

vi.mock('./components/Drafter', () => ({
  Drafter: ({ onAuthRequired }: { onAuthRequired: () => void }) => (
    <button onClick={onAuthRequired}>draft-auth</button>
  ),
}));

vi.mock('./components/LaborCalculator', () => ({
  LaborCalculator: () => <div>labor</div>,
}));

vi.mock('./components/SocialSecurityCalculator', () => ({
  SocialSecurityCalculator: () => <div>imss</div>,
}));

vi.mock('./components/CEODashboard', () => ({
  CEODashboard: () => <div>ceo</div>,
}));

vi.mock('./lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('./lib/seo', () => ({
  updateSEO: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: signOutMock,
    },
  },
}));

import App from './App';

describe('App critical flow', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.loading = false;
    mockAuthState.access = {
      hasActiveSubscription: false,
      isPremium: false,
      licenseType: null,
      accessUntil: null,
      singleDocumentUsesRemaining: 0,
    };
    signOutMock.mockReset();
    window.history.pushState({}, '', '/generador-documentos');
  });

  it('resumes the selected pricing flow after login', async () => {
    const { rerender } = render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'draft-auth' }));
    expect(await screen.findByText('login-open')).toBeInTheDocument();

    mockAuthState.user = { id: 'user_1', email: 'user@example.com' };
    rerender(<App />);

    expect(await screen.findByText('pricing:draft_basic')).toBeInTheDocument();
  });
});
