import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Plus, 
  Trash2, 
  Database, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  MapPin
} from 'lucide-react';

const PGBlocksManagementPage = () => {
  // Lists
  const [pgs, setPgs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingPgs, setLoadingPgs] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Filter Block by PG selection
  const [filterPg, setFilterPg] = useState('ALL');

  // Form States
  const [newPgName, setNewPgName] = useState('');
  const [pgSubmitting, setPgSubmitting] = useState(false);
  const [pgNotice, setPgNotice] = useState({ type: '', text: '' });

  const [statuses, setStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState({ type: '', text: '' });

  const [blockForm, setBlockForm] = useState({
    pg: '',
    block_code: '',
    status: '',
    luas: '',
    populasi: '',
    clone: '',
    wk_tanam: '',
    tahun_tanam: '',
    tanggal_tanam: ''
  });
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockNotice, setBlockNotice] = useState({ type: '', text: '' });

  // Fetch Data Functions
  const fetchPGs = async () => {
    setLoadingPgs(true);
    try {
      const res = await api.get('/api/pg');
      setPgs(res.data);
      if (res.data.length > 0 && !blockForm.pg) {
        setBlockForm(prev => ({ ...prev, pg: res.data[0].nama }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPgs(false);
    }
  };

  const fetchStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const res = await api.get('/api/statuses');
      setStatuses(res.data);
      if (res.data.length > 0 && !blockForm.status) {
        setBlockForm(prev => ({ ...prev, status: res.data[0].nama }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const url = filterPg === 'ALL' ? '/api/blocks' : `/api/blocks?pg=${filterPg}`;
      const res = await api.get(url);
      setBlocks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  useEffect(() => {
    fetchPGs();
    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [filterPg]);

  // Actions: PG
  const handleAddPg = async (e) => {
    e.preventDefault();
    if (!newPgName.trim()) return;

    setPgSubmitting(true);
    setPgNotice({ type: '', text: '' });

    try {
      const res = await api.post('/api/pg', { nama: newPgName });
      setPgNotice({ type: 'success', text: res.data.message || 'PG berhasil ditambahkan.' });
      setNewPgName('');
      fetchPGs();
    } catch (err) {
      setPgNotice({ type: 'error', text: err.response?.data?.message || 'Gagal menambahkan PG.' });
    } finally {
      setPgSubmitting(false);
    }
  };

  const handleDeletePg = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus criteria PG "${nama}"? Semua data blok di PG ini akan kehilangan referensi.`)) {
      return;
    }

    setPgNotice({ type: '', text: '' });
    try {
      const res = await api.delete(`/api/pg/${id}`);
      setPgNotice({ type: 'success', text: res.data.message || 'PG berhasil dihapus.' });
      fetchPGs();
      fetchBlocks();
    } catch (err) {
      setPgNotice({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus PG.' });
    }
  };

  // Actions: Block
  const handleBlockChange = (e) => {
    const { name, value } = e.target;
    setBlockForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    const { pg, block_code, status, luas, populasi, clone, wk_tanam, tahun_tanam, tanggal_tanam } = blockForm;

    if (!pg || !block_code || !status || !luas || !populasi || !clone || !wk_tanam || !tahun_tanam || !tanggal_tanam) {
      setBlockNotice({ type: 'error', text: 'Semua field blok wajib diisi.' });
      return;
    }

    setBlockSubmitting(true);
    setBlockNotice({ type: '', text: '' });

    try {
      const res = await api.post('/api/blocks', {
        pg,
        block_code,
        status,
        luas: parseFloat(luas),
        populasi: parseInt(populasi),
        clone,
        wk_tanam: parseInt(wk_tanam),
        tahun_tanam: parseInt(tahun_tanam),
        tanggal_tanam
      });

      setBlockNotice({ type: 'success', text: res.data.message || 'Blok tanam berhasil dibuat.' });
      
      // Reset form (keep PG selection)
      setBlockForm(prev => ({
        ...prev,
        block_code: '',
        status: statuses[0]?.nama || '',
        luas: '',
        populasi: '',
        clone: '',
        wk_tanam: '',
        tahun_tanam: '',
        tanggal_tanam: ''
      }));

      fetchBlocks();
    } catch (err) {
      setBlockNotice({ type: 'error', text: err.response?.data?.message || 'Gagal membuat blok tanam.' });
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id, code) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Blok "${code}"?`)) {
      return;
    }

    setBlockNotice({ type: '', text: '' });
    try {
      const res = await api.delete(`/api/blocks/${id}`);
      setBlockNotice({ type: 'success', text: res.data.message || 'Blok berhasil dihapus.' });
      fetchBlocks();
    } catch (err) {
      setBlockNotice({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus blok.' });
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    setStatusSubmitting(true);
    setStatusNotice({ type: '', text: '' });

    try {
      const res = await api.post('/api/statuses', { nama: newStatusName });
      setStatusNotice({ type: 'success', text: res.data.message || 'Status lokasi berhasil ditambahkan.' });
      setNewStatusName('');
      fetchStatuses();
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.response?.data?.message || 'Gagal menambahkan status lokasi.' });
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteStatus = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus status lokasi "${nama}"? Semua data blok dengan status ini akan kehilangan referensi.`)) {
      return;
    }

    setStatusNotice({ type: '', text: '' });
    try {
      const res = await api.delete(`/api/statuses/${id}`);
      setStatusNotice({ type: 'success', text: res.data.message || 'Status lokasi berhasil dihapus.' });
      fetchStatuses();
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus status lokasi.' });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Pengelolaan PG & Blok Tanam</h2>
          <p className="page-title-desc">Dinamisasi kriteria Plantation Grup dan registrasi Kode Blok Tebu oleh Administrator</p>
        </div>
      </div>

      <div className="responsive-grid-1-2">
        {/* PG & Status Management Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* PG Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Layers size={16} style={{ color: '#10b981' }} />
              Daftar Plantation Grup (PG)
            </h3>

            {pgNotice.text && (
              <div className={`alert-notice ${pgNotice.type}`} style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>
                {pgNotice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{pgNotice.text}</span>
              </div>
            )}

            {/* Add PG Form */}
            <form onSubmit={handleAddPg} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nama PG baru..."
                value={newPgName}
                onChange={(e) => setNewPgName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={pgSubmitting}>
                <Plus size={16} />
              </button>
            </form>

            {/* PG List */}
            {loadingPgs ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Memuat PG...</p>
            ) : pgs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Belum ada data PG.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {pgs.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{p.nama}</span>
                    <button 
                      onClick={() => handleDeletePg(p.id, p.nama)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Hapus PG"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Lokasi Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <MapPin size={16} style={{ color: '#10b981' }} />
              Daftar Status Lokasi
            </h3>

            {statusNotice.text && (
              <div className={`alert-notice ${statusNotice.type}`} style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>
                {statusNotice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{statusNotice.text}</span>
              </div>
            )}

            {/* Add Status Form */}
            <form onSubmit={handleAddStatus} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Status baru (e.g. TR)..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={statusSubmitting}>
                <Plus size={16} />
              </button>
            </form>

            {/* Status List */}
            {loadingStatuses ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Memuat status lokasi...</p>
            ) : statuses.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Belum ada data status lokasi.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {statuses.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{s.nama}</span>
                    <button 
                      onClick={() => handleDeleteStatus(s.id, s.nama)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Hapus Status"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Block Management Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add Block Form Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Database size={16} style={{ color: '#10b981' }} />
              Tambah Blok Tanam Baru
            </h3>

            {blockNotice.text && (
              <div className={`alert-notice ${blockNotice.type}`} style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>
                {blockNotice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{blockNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleAddBlock}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plantation Grup (PG)</label>
                  <select 
                    className="form-control" 
                    name="pg" 
                    value={blockForm.pg} 
                    onChange={handleBlockChange}
                    required
                  >
                    <option value="" disabled>Pilih PG...</option>
                    {pgs.map(p => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Kode Blok</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="block_code" 
                    placeholder="Misal: 554E2D"
                    value={blockForm.block_code} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Lokasi</label>
                  <select 
                    className="form-control" 
                    name="status" 
                    value={blockForm.status} 
                    onChange={handleBlockChange}
                    required
                  >
                    <option value="" disabled>Pilih Status...</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.nama}>{s.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Luas Blok (Ha)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    name="luas" 
                    placeholder="Misal: 12.5"
                    value={blockForm.luas} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimasi Populasi</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="populasi" 
                    placeholder="Misal: 18000"
                    value={blockForm.populasi} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clone (Varietas)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="clone" 
                    placeholder="Misal: Bululawang"
                    value={blockForm.clone} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Week Tanam</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="53" 
                    className="form-control" 
                    name="wk_tanam" 
                    placeholder="Misal: 45"
                    value={blockForm.wk_tanam} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tahun Tanam</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="tahun_tanam" 
                    placeholder="Misal: 2023"
                    value={blockForm.tahun_tanam} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Tanam</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="tanggal_tanam" 
                    value={blockForm.tanggal_tanam} 
                    onChange={handleBlockChange}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={blockSubmitting}>
                  {blockSubmitting ? 'Membuat Blok...' : 'Daftarkan Blok Tanam'}
                </button>
              </div>
            </form>
          </div>

          {/* Block List Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MapPin size={16} style={{ color: '#10b981' }} />
                Daftar Blok Terdaftar
              </h3>
              
              {/* PG Filter dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Filter PG:</span>
                <select 
                  className="form-control" 
                  value={filterPg} 
                  onChange={(e) => setFilterPg(e.target.value)}
                  style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }}
                >
                  <option value="ALL">Semua PG</option>
                  {pgs.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingBlocks ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Memuat data blok...</p>
            ) : blocks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Belum ada data blok tanam.</p>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>PG</th>
                      <th>Kode Blok</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th>Varietas (Clone)</th>
                      <th style={{ textAlign: 'center' }}>Luas (Ha)</th>
                      <th style={{ textAlign: 'center' }}>Populasi</th>
                      <th>Tgl Tanam</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map(b => (
                      <tr key={b.id}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{b.pg}</td>
                        <td style={{ fontWeight: 600, color: '#34d399' }}>{b.block_code}</td>
                        <td style={{ textAlign: 'center' }}><span className={`badge ${b.status}`}>{b.status}</span></td>
                        <td>{b.clone}</td>
                        <td style={{ textAlign: 'center' }}>{b.luas}</td>
                        <td style={{ textAlign: 'center' }}>{b.populasi.toLocaleString('id-ID')}</td>
                        <td style={{ fontSize: '12px' }}>{b.tanggal_tanam} <br/><span style={{ color: '#9ca3af', fontSize: '10px' }}>(Wk {b.wk_tanam} / {b.tahun_tanam})</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                            onClick={() => handleDeleteBlock(b.id, b.block_code)}
                            title="Hapus Blok"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGBlocksManagementPage;
