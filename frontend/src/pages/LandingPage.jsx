import React from 'react';
import { ArrowRight, Leaf, ShieldAlert, Database, BarChart3 } from 'lucide-react';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="hero-section animate-fade-in">
      <div className="hero-logo">🌱</div>
      <h1 className="hero-title">Soil & Nutrition Monitoring</h1>
      <p className="hero-subtitle">
        Sistem manajemen dan pemantauan pH tanah laboratorium serta analisis nutrisi perkebunan secara real-time untuk optimalisasi hasil panen tebu.
      </p>

      <div style={{ marginBottom: '40px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => onNavigate('login')}
          style={{ fontSize: '16px', padding: '12px 28px' }}
        >
          Masuk ke Dashboard <ArrowRight size={18} />
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '24px', 
        width: '100%', 
        maxWidth: '900px',
        marginTop: '20px'
      }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ color: '#10b981', marginBottom: '12px' }}>
            <Leaf size={28} />
          </div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Input Cepat Lapangan</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
            Auto-kalkulasi nomor minggu sampling, bulan, tahun, serta integrasi otomatis data tanaman tebu.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ color: '#3b82f6', marginBottom: '12px' }}>
            <BarChart3 size={28} />
          </div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Visualisasi Tren & Heatmap</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
            Pemetaan tingkat keasaman tanah (pH) per blok dengan visualisasi heatmap warna interaktif.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ color: '#f59e0b', marginBottom: '12px' }}>
            <Database size={28} />
          </div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Ekspor Excel & CSV</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
            Download data terfilter yang kompatibel dengan format spreadsheet untuk laporan manajemen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
