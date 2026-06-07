import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const pHChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '8px' }}>
        <TrendingUp size={24} style={{ color: '#4b5563' }} />
        <span>Belum ada data tren pH untuk tahun ini.</span>
      </div>
    );
  }

  if (data.length < 2) {
    const singlePoint = data[0];
    const xKey = singlePoint.month ? 'month' : 'week';
    const valuesText = Object.keys(singlePoint)
      .filter(key => key !== 'week' && key !== 'month')
      .map(key => `${key}: ${singlePoint[key].toFixed(2)} pH`)
      .join(', ');

    return (
      <div style={{ 
        display: 'flex', 
        height: '100%', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#9ca3af', 
        flexDirection: 'column', 
        gap: '8px', 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <TrendingUp size={28} style={{ color: '#10b981', marginBottom: '4px' }} />
        <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>
          Data Baru Tersedia untuk {singlePoint[xKey]}
        </span>
        <span style={{ fontSize: '13px', color: '#a3e635', fontWeight: 500 }}>
          {valuesText || 'Belum ada nilai pH'}
        </span>
        <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px', maxWidth: '280px', lineHeight: '1.4' }}>
          *Grafik tren akan otomatis digambar setelah ada data minimal dari 2 periode yang berbeda.
        </span>
      </div>
    );
  }

  // Custom tool-tip matching the premium dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>{label}</p>
          {payload.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ color: '#9ca3af' }}>{item.name}:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.value.toFixed(2)} pH</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          dataKey={data[0] && data[0].month ? 'month' : 'week'} 
          stroke="#9ca3af" 
          fontSize={11} 
          tickLine={false} 
        />
        <YAxis 
          domain={[3, 9]} 
          stroke="#9ca3af" 
          fontSize={11} 
          tickLine={false} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle"
          wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
        />
        <Line
          type="monotone"
          dataKey="PG1"
          stroke="#3b82f6"
          strokeWidth={3}
          activeDot={{ r: 6 }}
          dot={{ r: 3 }}
          name="PG1"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="PG2"
          stroke="#ec4899"
          strokeWidth={3}
          activeDot={{ r: 6 }}
          dot={{ r: 3 }}
          name="PG2"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="PG3"
          stroke="#10b981"
          strokeWidth={3}
          activeDot={{ r: 6 }}
          dot={{ r: 3 }}
          name="PG3"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="PG4"
          stroke="#f59e0b"
          strokeWidth={3}
          activeDot={{ r: 6 }}
          dot={{ r: 3 }}
          name="PG4"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default pHChart;
