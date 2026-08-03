import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LaborCalculator } from './LaborCalculator';

const {
  jsPdfCtorMock,
  autoTableMock,
  docMock,
} = vi.hoisted(() => {
  const doc = {
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
  };

  return {
    jsPdfCtorMock: vi.fn(function JsPdfMock() {
      return doc;
    }),
    autoTableMock: vi.fn(),
    docMock: doc,
  };
});

vi.mock('./BreakdownChart', () => ({
  BreakdownChart: () => <div>chart</div>,
}));

vi.mock('jspdf', () => ({
  jsPDF: jsPdfCtorMock,
}));

vi.mock('jspdf-autotable', () => ({
  default: autoTableMock,
}));

describe('LaborCalculator critical flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jsPdfCtorMock.mockClear();
    autoTableMock.mockClear();
    Object.values(docMock).forEach((value) => {
      if (typeof value === 'function' && 'mockClear' in value) {
        value.mockClear();
      }
    });
  });

  it('calculates without exposing document generation', async () => {
    const { container } = render(
      <LaborCalculator notify={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '30000' } });

    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2025-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /^calcular/i }));

    expect(await screen.findByText(/Descargar PDF/i)).toBeInTheDocument();
    expect(screen.queryByText(/Generar Documento/i)).not.toBeInTheDocument();
  });

  it('exports the labor calculation as PDF', async () => {
    const { container } = render(<LaborCalculator notify={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '30000' } });

    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2025-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /^calcular/i }));
    await screen.findByRole('button', { name: /pdf/i });

    fireEvent.click(screen.getByRole('button', { name: /pdf/i }));

    await waitFor(() => {
      expect(jsPdfCtorMock).toHaveBeenCalled();
      expect(docMock.save).toHaveBeenCalled();
    });
  });
});
