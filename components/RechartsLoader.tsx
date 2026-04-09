import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface RechartsLoaderProps {
  data: ChartData[];
}

const RechartsLoader: React.FC<RechartsLoaderProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default RechartsLoader;
