import React, { lazy, Suspense } from 'react';

const RechartsComponents = lazy(() => import('./RechartsLoader'));

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface BreakdownChartProps {
  data: ChartData[];
}

export const BreakdownChart: React.FC<BreakdownChartProps> = ({ data }) => {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin" /></div>}>
      <RechartsComponents data={data} />
    </Suspense>
  );
};
