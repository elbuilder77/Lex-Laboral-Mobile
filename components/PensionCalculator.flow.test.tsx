import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { PensionCalculator } from './PensionCalculator';

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

test('renders PensionCalculator and allows Ley 97 calculation', async () => {
  localStorage.clear();
  const notify = vi.fn();

  render(<PensionCalculator notify={notify} />);

  // Switch to Ley 1997
  fireEvent.click(screen.getByText('Ley 1997'));

  // Fill in required fields for Ley 97
  const inputs = screen.getAllByRole('spinbutton');

  // Edad
  fireEvent.change(inputs[0], { target: { value: '65' } });
  // Semanas cotizadas
  fireEvent.change(inputs[1], { target: { value: '1000' } });
  // Saldo AFORE
  fireEvent.change(inputs[2], { target: { value: '1000000' } });

  // Calculate
  fireEvent.click(screen.getByText('Calcular Pensión'));

  // Notification should be called
  expect(notify).toHaveBeenCalledWith('Cálculo generado exitosamente', 'success');
  expect(await screen.findByText('Pensión Mensual Aprox.')).toBeInTheDocument();
});
