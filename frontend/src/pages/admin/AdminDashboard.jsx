import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PHChart from '../../components/charts/pHChart';
import Heatmap from '../../components/charts/Heatmap';
import ResumeTable from '../../components/charts/ResumeTable';
import Modal from '../../components/common/Modal';
import { 
  Database, 
  TrendingUp, 
  Map, 
  Table, 
  RefreshCw,
  FlaskConical,
  Activity,
  Layers,
  FileWarning
} from 'lucide-react';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [resume, setResume] = useState([]);
  const [pgList, setPgList] = useState([]);
  const [selectedPG, setSelectedPG] = useState('');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendView, setTrendView] = useState('week');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch summary cards
      const summaryRes = await api.get('/api/dashboard/summary');
      setSummary(summaryRes.data);

      // Fetch trends (with PG & view filter)
      const trendsRes = await api.get(`/api/dashboard/tren-ph?view=${trendView}${selectedPG ? `&pg=${selectedPG}` : ''}`);
      setTrends(trendsRes.data);

      // Fetch heatmap blocks
      const heatmapRes = await api.get(`/api/dashboard/heatmap${selectedPG ? `?pg=${selectedPG}` : ''}`);
      setHeatmap(heatmapRes.data);

      // Fetch resume table
      const resumeRes = await api.get(`/api/dashboard/resume${selectedPG ? `?pg=${selectedPG}` : ''}`);
      setResume(resumeRes.data);

    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
      setError('Gagal memuat beberapa data dashboard. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPGs = async () => {
      try {
        const res = await api.get('/api/pg');
        setPgList(res.data);
      } catch (err) {
        console.error('Gagal mengambil daftar PG:', err);
      }
    };
    fetchPGs();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPG, trendView]);

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div className="top-bar">
        <div>
          <h2>Dashboard Analitik</h2>
          <p className="page-title-desc">Ringkasan hasil monitoring pH tanah dan nutrisi semua Plantation Grup (PG)</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '8px 12px' }}
            value={selectedPG}
            onChange={(e) => setSelectedPG(e.target.value)}
          >
            <option value="">Semua PG</option>
            {pgList.map(p => (
              <option key={p.id} value={p.nama}>{p.nama}</option>
            ))}
          </select>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={fetchDashboardData}
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-notice error">
          <FileWarning size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="summary-grid">
        <div className="glass-card metric-card info">
          <div className="metric-header">
            <span className="metric-title">Blok Disampling (Tahun Ini)</span>
            <div className="metric-icon-wrapper">
              <FlaskConical size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : summary?.totalYearSamples || 0}</div>
          <div className="metric-subtext">Blok dengan minimal 1 sampel</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Rata-rata pH Tanah</span>
            <div className="metric-icon-wrapper">
              <Activity size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : summary?.averagePH?.toFixed(2) || '0.00'}</div>
          <div className="metric-subtext">Rata-rata dari rata-rata per blok</div>
        </div>

        <div className="glass-card metric-card warning">
          <div className="metric-header">
            <span className="metric-title">Blok Disampling</span>
            <div className="metric-icon-wrapper">
              <Layers size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : summary?.sampledBlocksCount || 0}</div>
          <div className="metric-subtext">Dari total {summary?.totalBlocksCount || 0} blok terdaftar</div>
        </div>

        <div className="glass-card metric-card danger">
          <div className="metric-header">
            <span className="metric-title">Blok Belum Disampling</span>
            <div className="metric-icon-wrapper">
              <FileWarning size={20} />
            </div>
          </div>
          <div className="metric-value">{loading ? '...' : summary?.unsampledBlocksCount || 0}</div>
          <div className="metric-subtext">Bulan berjalan (perlu sampling)</div>
        </div>
      </div>

      {/* Charts & Visualization Section */}
      <div className="charts-grid">
        {/* Weekly Trend Chart */}
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

        {/* Heatmap Blocks */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={18} style={{ color: '#3b82f6' }} />
              Klasifikasi pH per Blok
            </h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6b7280', padding: '40px 0' }}>
                Memuat data peta blok...
              </div>
            ) : (
              <Heatmap data={heatmap} onSelectBlock={(block) => setSelectedBlock(block)} />
            )}
          </div>
        </div>
      </div>

      {/* Resume Pivot Table */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={18} style={{ color: '#f59e0b' }} />
            Tabel Resume: pH Rata-rata per Blok berdasarkan Umur Tanam
          </h3>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            Memuat tabel resume...
          </div>
        ) : (
          <ResumeTable data={resume} />
        )}
      </div>

      {/* Block Details Modal */}
      {selectedBlock && (
        <Modal 
          isOpen={!!selectedBlock} 
          onClose={() => setSelectedBlock(null)}
          title={`Detail Blok: ${selectedBlock.block}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Plantation Grup (PG)</span>
              <span style={{ fontWeight: 600 }}>{selectedBlock.pg}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Status Lokasi</span>
              <span style={{ fontWeight: 600 }}>{selectedBlock.status_lokasi}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>Nilai Rata-rata pH</span>
              <span style={{ fontWeight: 600, color: selectedBlock.colorClass === 'red' ? '#f87171' : selectedBlock.colorClass === 'yellow' ? '#fbbf24' : selectedBlock.colorClass === 'lightgreen' ? '#a3e635' : '#34d399' }}>
                {selectedBlock.ph.toFixed(2)} ({selectedBlock.status})
              </span>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBlock(null)}>Tutup</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
