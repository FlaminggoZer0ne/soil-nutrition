import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Lock, 
  UserCheck, 
  UserX,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [pgList, setPgList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add User Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '',
    index_pegawai: '',
    password: '',
    role: 'user',
    pg_akses: []
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit User Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    nama: '',
    index_pegawai: '',
    password: '',
    role: 'user',
    pg_akses: [],
    aktif: true
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPGs = async () => {
    try {
      const res = await api.get('/api/pg');
      setPgList(res.data);
    } catch (err) {
      console.error('Gagal mengambil list PG:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPGs();
  }, []);

  // Handle Add user
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');

    if (addForm.pg_akses.length === 0) {
      setAddError('Minimal harus memilih satu akses PG.');
      setAddLoading(false);
      return;
    }

    try {
      await api.post('/api/users', addForm);
      setIsAddOpen(false);
      setAddForm({ nama: '', index_pegawai: '', password: '', role: 'user', pg_akses: [] });
      fetchUsers();
      alert('Pengguna baru berhasil ditambahkan!');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Gagal menambahkan pengguna baru.');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit click
  const handleEditClick = (u) => {
    setEditForm({
      id: u.id,
      nama: u.nama,
      index_pegawai: u.index_pegawai,
      password: '', // Keep password empty unless changing
      role: u.role,
      pg_akses: u.pg_akses || [],
      aktif: u.aktif
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    if (editForm.pg_akses.length === 0) {
      setEditError('Minimal harus memilih satu akses PG.');
      setEditLoading(false);
      return;
    }

    try {
      await api.put(`/api/users/${editForm.id}`, editForm);
      setIsEditOpen(false);
      fetchUsers();
      alert('Data pengguna berhasil diperbarui!');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Gagal memperbarui data pengguna.');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle User Active Status
  const handleToggleStatus = async (id, currentStatus) => {
    if (confirm(`Apakah Anda yakin ingin ${currentStatus ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN'} pengguna ini?`)) {
      try {
        await api.put(`/api/users/${id}/toggle`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal mengubah status aktif pengguna.');
      }
    }
  };

  // PG checkboxes helper
  const handlePGAksesChange = (pgName, isAdd = true) => {
    if (isAdd) {
      const current = [...addForm.pg_akses];
      if (current.includes(pgName)) {
        setAddForm({ ...addForm, pg_akses: current.filter(x => x !== pgName) });
      } else {
        setAddForm({ ...addForm, pg_akses: [...current, pgName] });
      }
    } else {
      const current = [...editForm.pg_akses];
      if (current.includes(pgName)) {
        setEditForm({ ...editForm, pg_akses: current.filter(x => x !== pgName) });
      } else {
        setEditForm({ ...editForm, pg_akses: [...current, pgName] });
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Manajemen User</h2>
          <p className="page-title-desc">Kelola akun pengguna, peran akses, dan status keaktifan petugas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <UserPlus size={16} /> Tambah User Baru
        </button>
      </div>

      {error && (
        <div className="alert-notice error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Users List Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Memuat daftar pengguna...</div>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nama Petugas</th>
                  <th>NIP (Index Pegawai)</th>
                  <th>Peran (Role)</th>
                  <th>Akses PG</th>
                  <th>Status Akun</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                          {u.nama.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.nama}</span>
                      </div>
                    </td>
                    <td>{u.index_pegawai}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {u.pg_akses && u.pg_akses.length > 0 ? (
                          u.pg_akses.map(p => (
                            <span 
                              key={p} 
                              style={{ 
                                padding: '2px 6px', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '4px',
                                fontSize: '11px' 
                              }}
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '12px' }}>Tidak ada akses</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.aktif)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: u.aktif ? '#34d399' : '#fb7185',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        {u.aktif ? <UserCheck size={16} /> : <UserX size={16} />}
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn edit" onClick={() => handleEditClick(u)} title="Edit User">
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Pengguna Baru">
        <form onSubmit={handleAddSubmit}>
          {addError && (
            <div className="alert-notice error">
              <AlertCircle size={18} />
              <span>{addError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Misal: Ahmad Syafii"
              value={addForm.nama}
              onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor Indeks Pegawai (NIP)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Misal: 10234"
              value={addForm.index_pegawai}
              onChange={(e) => setAddForm({ ...addForm, index_pegawai: e.target.value })}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi Awal</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Minimal 6 karakter"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Peran Sistem (Role)</label>
            <select 
              className="form-control"
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
            >
              <option value="user">User (Petugas Lapangan)</option>
              <option value="admin">Admin (Akses Penuh)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Akses Plantation Grup (PG)</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {pgList.map(pgObj => {
                const p = pgObj.nama;
                return (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="checkbox" 
                      checked={addForm.pg_akses.includes(p)}
                      onChange={() => handlePGAksesChange(p, true)}
                    />
                    <span>{p}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Mendaftarkan...' : 'Tambah User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {isEditOpen && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Pengguna">
          <form onSubmit={handleEditSubmit}>
            {editError && (
              <div className="alert-notice error">
                <AlertCircle size={18} />
                <span>{editError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input 
                type="text" 
                className="form-control" 
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Indeks Pegawai (NIP)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editForm.index_pegawai}
                onChange={(e) => setEditForm({ ...editForm, index_pegawai: e.target.value })}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reset Sandi (Biarkan kosong jika tidak diubah)</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Masukkan kata sandi baru"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Peran Sistem (Role)</label>
              <select 
                className="form-control"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="user">User (Petugas Lapangan)</option>
                <option value="admin">Admin (Akses Penuh)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Akses Plantation Grup (PG)</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                {pgList.map(pgObj => {
                  const p = pgObj.nama;
                  return (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        checked={editForm.pg_akses.includes(p)}
                        onChange={() => handlePGAksesChange(p, false)}
                      />
                      <span>{p}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editForm.aktif}
                  onChange={(e) => setEditForm({ ...editForm, aktif: e.target.checked })}
                />
                <span className="form-label" style={{ margin: 0 }}>Akun Aktif</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={editLoading}>
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
