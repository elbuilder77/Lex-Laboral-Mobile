import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialSecurityCalculator } from './SocialSecurityCalculator';

describe('SocialSecurityCalculator flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('calculates SBC from monthly salary and cuotas IMSS', async () => {
    const notify = vi.fn();

    render(<SocialSecurityCalculator notify={notify} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10000' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.13065' } });

    expect(screen.getByText(/Tu SBC estimado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /calcular cuotas/i }));

    expect(notify).toHaveBeenCalledWith('Cálculo finalizado', 'success');
    expect(await screen.findByText('Patrón')).toBeInTheDocument();
    expect(screen.getByText('Trabajador')).toBeInTheDocument();
    expect(screen.getByText(/SBC aplicado/i)).toBeInTheDocument();
  });

  it('rejects salary that yields an SBC below minimum wage', async () => {
    const notify = vi.fn();

    render(<SocialSecurityCalculator notify={notify} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '300' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.13065' } });

    fireEvent.click(screen.getByRole('button', { name: /calcular cuotas/i }));

    expect(notify).toHaveBeenCalledWith(expect.stringContaining('salario mínimo'), 'warning');
  });

  it('supports direct SBC entry mode', async () => {
    const notify = vi.fn();

    render(<SocialSecurityCalculator notify={notify} />);

    fireEvent.click(screen.getByRole('button', { name: /ya conozco mi sbc/i }));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '2000' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.13065' } });

    fireEvent.click(screen.getByRole('button', { name: /calcular cuotas/i }));

    expect(notify).toHaveBeenCalledWith('Cálculo finalizado', 'success');
    expect(await screen.findByText('Patrón')).toBeInTheDocument();
  });
});
