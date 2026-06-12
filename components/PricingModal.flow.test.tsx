import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PENDING_CHECKOUT_STORAGE_KEY } from '../lib/checkout';
import { PricingModal } from './PricingModal';

const { mockAuthState, createCheckoutSessionMock, redirectToCheckoutMock } = vi.hoisted(() => ({
  mockAuthState: {
    user: null as null | { id: string; email: string },
    session: null as null | { access_token: string },
  },
  createCheckoutSessionMock: vi.fn(),
  redirectToCheckoutMock: vi.fn(),
}));

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
  }),
}));

vi.mock('../services/stripe', () => ({
  createCheckoutSession: createCheckoutSessionMock,
  redirectToCheckout: redirectToCheckoutMock,
}));

describe('PricingModal flow', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.session = null;
    createCheckoutSessionMock.mockReset();
    redirectToCheckoutMock.mockReset();
    window.sessionStorage.clear();
  });

  it('sends unauthenticated users to login preserving the selected plan', () => {
    const onClose = vi.fn();
    const onRequireLogin = vi.fn();

    render(
      <PricingModal
        isOpen
        onClose={onClose}
        notify={vi.fn()}
        onRequireLogin={onRequireLogin}
      />
    );

    const planButtons = screen.getAllByRole('button', { name: /elegir plan/i });
    fireEvent.click(planButtons[1]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequireLogin).toHaveBeenCalledWith('mensualidad');
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it('creates a checkout session and redirects for authenticated users', async () => {
    mockAuthState.user = { id: 'user_1', email: 'user@example.com' };
    mockAuthState.session = { access_token: 'token_123' };
    createCheckoutSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.test' });

    render(
      <PricingModal
        isOpen
        onClose={vi.fn()}
        notify={vi.fn()}
      />
    );

    const planButtons = screen.getAllByRole('button', { name: /elegir plan/i });
    fireEvent.click(planButtons[0]);

    await waitFor(() => {
      expect(createCheckoutSessionMock).toHaveBeenCalledWith(
        'user@example.com',
        'user_1',
        'draft_basic',
        'token_123'
      );
    });

    expect(redirectToCheckoutMock).toHaveBeenCalledWith('https://checkout.stripe.test');
    expect(JSON.parse(window.sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY) || '{}')).toMatchObject({
      plan: 'draft_basic',
    });
  });
});
