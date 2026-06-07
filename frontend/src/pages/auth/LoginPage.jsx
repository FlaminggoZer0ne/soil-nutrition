import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Lock, User } from 'lucide-react';

const LoginPage = ({ onNavigate }) => {
  const [indexPegawai, setIndexPegawai] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(indexPegawai, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">🌱</div>
          <h2 className="auth-title">Selamat Datang</h2>
          <p className="auth-subtitle">Silakan login untuk memantau data pH & Nutrisi</p>
        </div>

        {error && (
          <div className="alert-notice error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
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

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock 
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
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '42px' }}
                required 
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('forgot-password'); }}
              style={{ fontSize: '13px' }}
            >
              Lupa Kata Sandi?
            </a>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Memproses Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            Hubungi Administrator jika akun Anda belum terdaftar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
