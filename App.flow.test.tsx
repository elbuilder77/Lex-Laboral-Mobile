import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/Home', () => ({
  Home: ({ onNavigate }: { onNavigate: (view: string) => void }) => (
    <button onClick={() => onNavigate('CALCULATOR')}>go-labor</button>
  ),
}));

vi.mock('./components/LegalView', () => ({
  LegalView: () => <div>legal</div>,
}));

vi.mock('./components/NotificationHub', () => ({
  NotificationHub: () => null,
}));

vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/Drafter', () => ({
  Drafter: () => <div>drafter</div>,
}));

vi.mock('./components/LaborCalculator', () => ({
  LaborCalculator: () => <div>labor</div>,
}));

vi.mock('./components/SocialSecurityCalculator', () => ({
  SocialSecurityCalculator: () => <div>imss</div>,
}));

vi.mock('./components/PensionCalculator', () => ({
  PensionCalculator: () => <div>pension</div>,
}));

import App from './App';

describe('App critical flow', () => {
  it('renders the home view by default', () => {
    render(<App />);
    expect(screen.getByText('go-labor')).toBeInTheDocument();
  });

  it('navigates between views without requiring an account', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'go-labor' }));

    expect(await screen.findByText('labor')).toBeInTheDocument();
  });
});
