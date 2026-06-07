import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  Search, 
  Calendar, 
  Eye, 
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import Modal from '../../components/common/Modal';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedUser, setSelectedUser] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Selected Log detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (selectedUser) params.append('user_id', selectedUser);
    if (dateStart) params.append('date_start', dateStart);
    if (dateEnd) params.append('date_end', dateEnd);

    try {
      const logsRes = await api.get(`/api/logs?${params.toString()}`);
      setLogs(logsRes.data);
    } catch (err) {
      setError('Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRes = await api.get('/api/users');
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching users for filter:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, dateStart, dateEnd]);

  // Clean log descriptions helper
  const getActionLabel = (action) => {
    switch (action) {
      case 'create': return { text: 'TAMBAH DATA', color: '#10b981' };
      case 'update': return { text: 'EDIT DATA', color: '#f59e0b' };
      case 'delete': return { text: 'HAPUS DATA', color: '#ef4444' };
      case 'export': return { text: 'UNDUH DATA', color: '#3b82f6' };
      case 'import': return { text: 'IMPORT DATA', color: '#8b5cf6' };
      case 'login': return { text: 'LOG IN', color: '#10b981' };
      default: return { text: action.toUpperCase(), color: '#9ca3af' };
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Log Aktivitas</h2>
          <p className="page-title-desc">Riwayat pencatatan aktivitas pengguna sistem (audit trail)</p>
        </div>
      </div>

      {error && (
        <div className="alert-notice error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Card */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1.5, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Filter Petugas</label>
            <select 
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Semua Petugas</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nama} (NIP: {u.index_pegawai})</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Mulai Tanggal</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Hingga Tanggal</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Memuat riwayat log...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Belum ada log aktivitas yang tercatat.</div>
        ) : (
          <div className="table-container">
            <table className="modern-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Target Tabel</th>
                  <th>ID Record</th>
                  <th style={{ textAlign: 'right' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const label = getActionLabel(log.aksi);
                  return (
                    <tr key={log.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} style={{ color: '#6b7280' }} />
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.user?.nama || 'System'}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{log.user?.index_pegawai ? `NIP: ${log.user.index_pegawai}` : '-'}</div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontWeight: 700, 
                          fontSize: '10px',
                          border: `1px solid ${label.color}`,
                          color: label.color,
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                          {label.text}
                        </span>
                      </td>
                      <td><code style={{ color: '#93c5fd' }}>{log.tabel_target || '-'}</code></td>
                      <td>{log.data_id || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="icon-btn edit" 
                          onClick={() => setSelectedLog(log)}
                          title="Lihat Detail Log"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal 
          isOpen={!!selectedLog} 
          onClose={() => setSelectedLog(null)}
          title="Detail Audit Log"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Aksi</span>
              <span style={{ fontWeight: 600, color: getActionLabel(selectedLog.aksi).color }}>
                {getActionLabel(selectedLog.aksi).text}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Dilakukan Oleh</span>
              <span style={{ fontWeight: 600 }}>{selectedLog.user?.nama} {selectedLog.user?.index_pegawai ? `(NIP: ${selectedLog.user.index_pegawai})` : ''}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Waktu Kejadian</span>
              <span style={{ fontWeight: 500 }}>{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Detail Perubahan (JSON):</span>
              <pre style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '8px', 
                padding: '12px', 
                fontSize: '12px', 
                overflowX: 'auto', 
                fontFamily: 'monospace',
                maxHeight: '200px',
                color: '#34d399'
              }}>
                {JSON.stringify(selectedLog.detail, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Tutup</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LogsPage;
