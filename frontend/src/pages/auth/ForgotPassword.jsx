import React, { useState } from 'react';
import api from '../../services/api';
import { AlertCircle, CheckCircle2, ArrowLeft, User } from 'lucide-react';

const ForgotPassword = ({ onNavigate }) => {
  const [indexPegawai, setIndexPegawai] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', { index_pegawai: indexPegawai });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim instruksi reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h2 className="auth-title">Reset Sandi</h2>
          <p className="auth-subtitle">Masukkan nomor indeks pegawai Anda untuk meminta reset</p>
        </div>

        {message && (
          <div className="alert-notice success">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert-notice error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Nomor Indeks Pegawai (NIP)</label>
            <div style={{ position: 'relative' }}>
              <User 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6b7280' 
                }} 
              />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Misal: 10234 atau admin" 
                value={indexPegawai}
                onChange={(e) => setIndexPegawai(e.target.value)}
                style={{ paddingLeft: '42px' }}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Mengirim...' : 'Kirim Instruksi Reset'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ArrowLeft size={14} /> Kembali ke Halaman Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
