import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { PensionCalculator } from './PensionCalculator';
import { AuthProvider } from './AuthProvider';

// Mock matchMedia para Recharts/framer-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}));

test('renders PensionCalculator and allows Ley 97 calculation', async () => {
  const notify = vi.fn();

  render(
    <AuthProvider>
      <PensionCalculator notify={notify} />
    </AuthProvider>
  );

  // Switch to Ley 1997
  const ley97Button = screen.getByText('Ley 1997');
  fireEvent.click(ley97Button);

  // Fill in required fields for Ley 97
  const inputs = screen.getAllByRole('spinbutton');

  // Find age input
  const ageInput = screen.getByPlaceholderText('60');
  fireEvent.change(ageInput, { target: { value: '65' } });

  // Find weeks input
  const weeksInput = screen.getByPlaceholderText('500');
  fireEvent.change(weeksInput, { target: { value: '1000' } });

  // Find AFORE balance input
  const aforeInput = screen.getByPlaceholderText('0.00');
  fireEvent.change(aforeInput, { target: { value: '1000000' } });

  // Calculate
  const calculateButton = screen.getByText('Calcular Pensión');

  // Await the effect to settle the auth state
  await screen.findByText('Estimación IMSS');

  fireEvent.click(calculateButton);

  // Notification should be called
  // AuthProvider mock handles user, so it should succeed
  expect(notify).toHaveBeenCalledWith('Cálculo generado exitosamente', 'success');
});
