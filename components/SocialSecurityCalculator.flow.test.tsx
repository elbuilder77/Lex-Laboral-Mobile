import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialSecurityCalculator } from './SocialSecurityCalculator';

const { mockAuthState, checkCalculatorUsageMock } = vi.hoisted(() => ({
  mockAuthState: {
    user: { id: 'user_1', email: 'user@example.com' },
    session: { access_token: 'token_123' },
    access: {
      hasActiveSubscription: false,
      isPremium: false,
      licenseType: null,
      accessUntil: null,
      singleDocumentUsesRemaining: 0,
    },
  },
  checkCalculatorUsageMock: vi.fn(),
}));

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    access: mockAuthState.access,
  }),
}));

vi.mock('../services/gemini', () => ({
  checkCalculatorUsage: checkCalculatorUsageMock,
}));

vi.mock('./SEOContentSection', () => ({
  SEOContentSection: () => null,
}));

describe('SocialSecurityCalculator gating flow', () => {
  beforeEach(() => {
    mockAuthState.user = { id: 'user_1', email: 'user@example.com' };
    mockAuthState.session = { access_token: 'token_123' };
    mockAuthState.access = {
      hasActiveSubscription: false,
      isPremium: false,
      licenseType: null,
      accessUntil: null,
      singleDocumentUsesRemaining: 0,
    };
    checkCalculatorUsageMock.mockReset();
  });

  it('shows premium access before calculation and routes to plans', () => {
    const onRequirePremium = vi.fn();

    render(
      <SocialSecurityCalculator
        notify={vi.fn()}
        onRequirePremium={onRequirePremium}
      />
    );

    expect(screen.getByText('Esta calculadora forma parte del plan mensual o trimestral.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ver planes/i }));
    expect(onRequirePremium).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /calcular cuotas/i }));
    expect(onRequirePremium).toHaveBeenCalledTimes(2);
    expect(checkCalculatorUsageMock).not.toHaveBeenCalled();
  });
});
