import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialSecurityCalculator } from './SocialSecurityCalculator';

describe('SocialSecurityCalculator flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates cuotas IMSS without any account or plan', async () => {
    const notify = vi.fn();

    render(<SocialSecurityCalculator notify={notify} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '2000' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.13065' } });

    fireEvent.click(screen.getByRole('button', { name: /calcular cuotas/i }));

    expect(notify).toHaveBeenCalledWith('Cálculo finalizado', 'success');
    expect(await screen.findByText('Patrón')).toBeInTheDocument();
    expect(screen.getByText('Trabajador')).toBeInTheDocument();
  });
});
