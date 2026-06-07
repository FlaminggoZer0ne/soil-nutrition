import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';

const DownloadPage = () => {
  const { user } = useAuth();
  
  // State
  const [pg, setPg] = useState('');
  const [pgList, setPgList] = useState([]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [mingguMulai, setMingguMulai] = useState('');
  const [mingguSelesai, setMingguSelesai] = useState('');
  const [format, setFormat] = useState('xlsx'); // 'xlsx' or 'csv'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Set default PG and fetch list
  useEffect(() => {
    const fetchPGs = async () => {
      try {
        const res = await api.get('/api/pg');
        setPgList(res.data);
        if (user && user.pg_akses && user.pg_akses.length > 0) {
          const defaultPg = res.data.find(p => user.pg_akses.includes(p.nama))?.nama || res.data[0]?.nama;
          setPg(defaultPg || '');
        } else if (res.data.length > 0) {
          setPg(res.data[0].nama);
        }
      } catch (err) {
        console.error('Failed to load PGs:', err);
      }
    };
    fetchPGs();
  }, [user]);

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const params = new URLSearchParams();
    if (pg) params.append('pg', pg);
    if (tahun) params.append('tahun', tahun);
    if (mingguMulai) params.append('minggu_mulai', mingguMulai);
    if (mingguSelesai) params.append('minggu_selesai', mingguSelesai);
    params.append('format', format);

    try {
      // Fetch as blob for correct authorized downloads (avoids window.open cookie/header issues)
      const response = await api.get(`/api/ph/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ph_data_export_${pg || 'ALL'}_${tahun || 'ALL'}.${format}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess(true);
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Gagal mengekspor data. Pastikan filter valid dan database memiliki record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Download Data</h2>
          <p className="page-title-desc">Unduh data pH tanah untuk dianalisis dalam aplikasi eksternal</p>
        </div>
      </div>

      <div className="responsive-grid-1-5-1">
        {/* Filter Form Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Download size={18} style={{ color: '#10b981' }} />
            Pilih Filter Ekspor
          </h3>

          {error && (
            <div className="alert-notice error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-notice success">
              <CheckCircle2 size={18} />
              <span>File data berhasil diunduh ke folder download Anda!</span>
            </div>
          )}

          <form onSubmit={handleDownload}>
            <div className="form-group">
              <label className="form-label">Plantation Grup (PG)</label>
              <select 
                className="form-control"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
              >
                {user?.role === 'admin' && <option value="">Semua PG (Semua data akses)</option>}
                {user?.role === 'admin' ? (
                  pgList.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))
                ) : (
                  pgList.filter(p => user?.pg_akses?.includes(p.nama)).map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tahun Sampling</label>
              <input 
                type="number" 
                className="form-control"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rentang Minggu Mulai</label>
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="Misal: 1"
                  value={mingguMulai}
                  onChange={(e) => setMingguMulai(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rentang Minggu Selesai</label>
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="Misal: 52"
                  value={mingguSelesai}
                  onChange={(e) => setMingguSelesai(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Format File Unduhan</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ 
                  flex: 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '10px', 
                  padding: '16px', 
                  background: format === 'xlsx' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.15)',
                  border: format === 'xlsx' ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="xlsx"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                    style={{ display: 'none' }} 
                  />
                  <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Excel (.xlsx)</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Format asli ter-styling</div>
                  </div>
                </label>

                <label style={{ 
                  flex: 1,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '10px', 
                  padding: '16px', 
                  background: format === 'csv' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.15)',
                  border: format === 'csv' ? '1px solid var(--color-info)' : '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="csv"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    style={{ display: 'none' }} 
                  />
                  <FileCode size={20} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>CSV (.csv)</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Data mentah (comma separated)</div>
                  </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              <Download size={16} /> {loading ? 'Memproses Ekspor...' : 'Unduh Data Sekarang'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
            <Calendar size={16} style={{ color: '#10b981' }} />
            Catatan Ekspor
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
            File Excel (.xlsx) yang diunduh mencakup kolom terstruktur yang sama persis dengan format template laboratorium lapangan.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#9ca3af', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
            <strong>Daftar Kolom Output:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontStyle: 'italic', fontFamily: 'monospace' }}>
              <span>• Kode Percobaan</span>
              <span>• Status Lokasi</span>
              <span>• Pengirim</span>
              <span>• Block Weekly</span>
              <span>• PG</span>
              <span>• Wk Tanam</span>
              <span>• Tgl Kirim/Selesai</span>
              <span>• Tgl Tanam</span>
              <span>• Week/Bulan/Tahun</span>
              <span>• Umur (bulan)</span>
              <span>• Kode Block</span>
              <span>• pH Tanah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
