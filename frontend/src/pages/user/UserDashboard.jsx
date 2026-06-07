import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PHChart from '../../components/charts/pHChart';
import { 
  FlaskConical, 
  Activity, 
  Clock, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';

const UserDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    monthCount: 0,
    avgPH: 0,
    lastInputDate: '-',
    lastInputWeek: '-'
  });
  const [recentData, setRecentData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('week');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pH data under user's scope
      const res = await api.get('/api/ph');
      const data = res.data;
      setRecentData(data.slice(0, 5)); // Keep latest 5 for listing

      // 2. Compute statistics client side for simplicity (Block-based)
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Filter for current month and count unique blocks
      const uniqueBlocksThisMonth = new Set(
        data
          .filter(item => item.bulan_sampling === currentMonth && item.tahun_sampling === currentYear)
          .map(item => `${item.pg}-${item.lokasi}`)
      );
      const monthBlocksCount = uniqueBlocksThisMonth.size;

      // Group samples by block to compute block averages, then average those averages
      const blockAverages = {};
      data.forEach(item => {
        const key = `${item.pg}-${item.lokasi}`;
        if (!blockAverages[key]) {
          blockAverages[key] = { sum: 0, count: 0 };
        }
        blockAverages[key].sum += parseFloat(item.ph_tanah);
        blockAverages[key].count++;
      });

      const blockAvgValues = Object.values(blockAverages).map(b => b.sum / b.count);
      const averagePH = blockAvgValues.length > 0
        ? (blockAvgValues.reduce((sum, val) => sum + val, 0) / blockAvgValues.length)
        : 0;

      let lastDate = '-';
      let lastWeek = '-';
      if (data.length > 0) {
        // Since data is sorted DESC in backend, first element is latest
        lastDate = data[0].tanggal_kirim;
        lastWeek = data[0].week_sampling;
      }

      setStats({
        monthCount: monthBlocksCount,
        avgPH: averagePH,
        lastInputDate: lastDate,
        lastInputWeek: lastWeek
      });

      // 3. Fetch trends for their PG
      const pgParam = user.pg_akses && user.pg_akses.length > 0 ? `&pg=${user.pg_akses[0]}` : '';
      const trendsRes = await api.get(`/api/dashboard/tren-ph?view=${trendView}${pgParam}`);
      setTrends(trendsRes.data);

    } catch (error) {
      console.error('Fetch User Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [trendView]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="top-bar">
        <div>
          <h2>Beranda Petugas</h2>
          <p className="page-title-desc">Ringkasan status input dan pemantauan pH tanah lingkup {user?.pg_akses?.join(', ')}</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => onNavigate('input-ph')}
        >
          <PlusCircle size={16} /> Input Sampel Baru
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="summary-grid">
        <div className="glass-card metric-card info">
          <div className="metric-header">
            <span className="metric-title">Blok Disampling (Bulan Ini)</span>
            <div className="metric-icon-wrapper">
              <FlaskConical size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : stats.monthCount}</div>
          <div className="metric-subtext">Jumlah blok terdata bulan ini</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Rata-rata pH Tanah</span>
            <div className="metric-icon-wrapper">
              <Activity size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : stats.avgPH.toFixed(2)}</div>
          <div className="metric-subtext">Rata-rata dari rata-rata per blok</div>
        </div>

        <div className="glass-card metric-card warning">
          <div className="metric-header">
            <span className="metric-title">Input Terakhir</span>
            <div className="metric-icon-wrapper">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: '20px', padding: '5px 0' }}>
            {loading ? '...' : stats.lastInputDate}
          </div>
          <div className="metric-subtext">
            {stats.lastInputWeek !== '-' ? `Week Sampling: Wk ${stats.lastInputWeek}` : 'Belum ada data'}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="charts-grid responsive-grid-dashboard">
        {/* Trend Line Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <TrendingUp size={18} style={{ color: '#10b981' }} />
              Tren pH Tanah {trendView === 'week' ? 'Mingguan' : 'Bulanan'} ({new Date().getFullYear()})
            </h3>
            <div style={{ display: 'inline-flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
              <button 
                type="button"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trendView === 'week' ? '#10b981' : 'transparent',
                  color: '#ffffff',
                  transition: 'background 0.2s'
                }}
                onClick={() => setTrendView('week')}
              >
                Minggu
              </button>
              <button 
                type="button"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: trendView === 'month' ? '#10b981' : 'transparent',
                  color: '#ffffff',
                  transition: 'background 0.2s'
                }}
                onClick={() => setTrendView('month')}
              >
                Bulan
              </button>
            </div>
          </div>
          <div className="chart-wrapper">
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                Memuat grafik tren...
              </div>
            ) : (
              <PHChart data={trends} />
            )}
          </div>
        </div>

        {/* Recent inputs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: '#3b82f6' }} />
              Riwayat Input Terbaru
            </h3>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('history'); }} 
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Semua <ArrowRight size={14} />
            </a>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '30px 0' }}>Memuat riwayat...</p>
            ) : recentData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '30px 0' }}>Belum ada data sampel yang diinput.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentData.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '12px 16px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.block_weekly}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Tgl: {item.tanggal_kirim} | Plot: {item.no_sample}
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontWeight: 700, 
                      fontSize: '15px',
                      background: parseFloat(item.ph_tanah) < 5.5 ? 'rgba(244, 63, 94, 0.15)' : parseFloat(item.ph_tanah) > 7.0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: parseFloat(item.ph_tanah) < 5.5 ? '#fb7185' : parseFloat(item.ph_tanah) > 7.0 ? '#60a5fa' : '#34d399',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {parseFloat(item.ph_tanah).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
