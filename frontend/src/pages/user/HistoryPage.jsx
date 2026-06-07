import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { 
  Edit2, 
  Trash2, 
  Upload, 
  Filter, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2,
  Download
} from 'lucide-react';

const HistoryPage = () => {
  const { user, isAdmin } = useAuth();
  
  // Data
  const [data, setData] = useState([]);
  const [pgList, setPgList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expandable Row State
  const [expandedPlots, setExpandedPlots] = useState({});

  // Filter States
  const [filterPG, setFilterPG] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterMinggu, setFilterMinggu] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterPengirim, setFilterPengirim] = useState('');

  // Bulk Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState({ type: '', text: '', details: [] });
  const [importLoading, setImportLoading] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState({ type: '', text: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load PGs and Statuses on Mount
  useEffect(() => {
    const fetchPGs = async () => {
      try {
        const res = await api.get('/api/pg');
        setPgList(res.data);
      } catch (err) {
        console.error('Failed to load PGs:', err);
      }
    };
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/api/statuses');
        setStatusList(res.data);
      } catch (err) {
        console.error('Failed to load statuses:', err);
      }
    };
    fetchPGs();
    fetchStatuses();
  }, []);

  // Load records based on current filters
  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (filterPG) params.append('pg', filterPG);
    if (filterTahun) params.append('tahun', filterTahun);
    if (filterMinggu) params.append('minggu', filterMinggu);
    if (filterLokasi) params.append('lokasi', filterLokasi);
    if (filterPengirim) params.append('pengirim', filterPengirim);

    try {
      const response = await api.get(`/api/ph?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError('Gagal memuat riwayat data pH tanah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filterPG, filterTahun, filterMinggu, filterLokasi, filterPengirim]);

  // Grouping Function (grouped by Block + Status + Date + Plot)
  const groupDataByPlot = (records) => {
    const groups = {};
    records.forEach(r => {
      const key = `${r.pg}_${r.lokasi}_${r.status_lokasi}_${r.tanggal_kirim}_${r.no_plot || 1}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          pg: r.pg,
          lokasi: r.lokasi,
          status_lokasi: r.status_lokasi,
          block_weekly: r.block_weekly,
          kode_percobaan: r.kode_percobaan,
          tanggal_sampling: r.tanggal_sampling,
          tanggal_tanam: r.tanggal_tanam,
          tanggal_kirim: r.tanggal_kirim,
          tanggal_selesai: r.tanggal_selesai,
          week_sampling: r.week_sampling,
          bulan_sampling: r.bulan_sampling,
          no_plot: r.no_plot || 1,
          pengirim_sampel: r.pengirim_sampel,
          created_at: r.created_at,
          samples: [] // Individual samples in this plot
        };
      }
      groups[key].samples.push({
        id: r.id,
        no_sample: r.no_sample,
        ph_tanah: r.ph_tanah,
        created_at: r.created_at
      });
    });

    return Object.values(groups).map(g => {
      g.samples.sort((a, b) => a.no_sample - b.no_sample);
      const sum = g.samples.reduce((acc, curr) => acc + parseFloat(curr.ph_tanah), 0);
      g.avg_ph = g.samples.length > 0 ? (sum / g.samples.length) : 0;
      return g;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const groupedPlots = groupDataByPlot(data);

  const toggleExpandPlot = (key) => {
    setExpandedPlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle Edit Action
  const handleEditClick = (record) => {
    setEditingRecord({
      id: record.id,
      kode_percobaan: record.kode_percobaan || '-',
      pg: record.pg,
      tanggal_sampling: record.tanggal_sampling || '',
      tanggal_tanam_manual: record.tanggal_tanam || '',
      tanggal_kirim: record.tanggal_kirim || '',
      tanggal_selesai: record.tanggal_selesai || '',
      lokasi: record.lokasi,
      status_lokasi: record.status_lokasi,
      no_plot: record.no_plot,
      no_sample: record.no_sample,
      ph_tanah: record.ph_tanah
    });
    setEditStatus({ type: '', text: '' });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditStatus({ type: '', text: '' });

    try {
      await api.put(`/api/ph/${editingRecord.id}`, editingRecord);
      setIsEditOpen(false);
      setEditingRecord(null);
      fetchRecords(); // Reload
      alert('Data pH tanah berhasil diperbarui!');
    } catch (err) {
      setEditStatus({ 
        type: 'error', 
        text: err.response?.data?.message || 'Gagal memperbarui data.' 
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Action
  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/ph/${deletingId}`);
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchRecords(); // Reload
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Import Action
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportStatus({ type: '', text: '', details: [] });

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/api/ph/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { imported, skipped, errors } = response.data;
      setImportStatus({
        type: 'success',
        text: `Proses import selesai. Berhasil: ${imported} baris, Dilewati: ${skipped} baris.`,
        details: errors
      });
      setImportFile(null);
      fetchRecords(); // Reload
    } catch (err) {
      setImportStatus({
        type: 'error',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah file.'
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/api/ph/template', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_ph.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download template:', err);
      setImportStatus({ type: 'error', text: 'Gagal mengunduh template Excel.' });
    }
  };

  // Takes a created_at string (not a full record object)
  const isWithin24Hours = (created_at) => {
    if (isAdmin) return true;
    const now = new Date();
    const createdAt = new Date(created_at);
    const hoursDiff = Math.abs(now - createdAt) / 36e5;
    return hoursDiff <= 24;
  };

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Riwayat Data pH (Struktur Plot)</h2>
          <p className="page-title-desc">Daftar rekaman sampel pH tanah terkelompok per Plot dan rata-ratanya</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setImportStatus({ type: '', text: '', details: [] });
              setIsImportOpen(true);
            }}
          >
            <Upload size={16} /> Bulk Import Excel
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Filter size={15} style={{ color: '#10b981' }} />
          Filter Data Riwayat
        </h3>
        
        <div className="filter-container">
          <div className="filter-item" style={{ minWidth: '120px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>PG</label>
            <select className="form-control" style={{ padding: '8px 12px' }} value={filterPG} onChange={(e) => setFilterPG(e.target.value)}>
              <option value="">Semua PG</option>
              {user?.role === 'admin' ? (
                pgList.map(p => <option key={p.id} value={p.nama}>{p.nama}</option>)
              ) : (
                pgList.filter(p => user?.pg_akses?.includes(p.nama)).map(p => <option key={p.id} value={p.nama}>{p.nama}</option>)
              )}
            </select>
          </div>

          <div className="filter-item" style={{ minWidth: '100px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Tahun</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Misal: 2026" 
              style={{ padding: '8px 12px' }}
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
            />
          </div>

          <div className="filter-item" style={{ minWidth: '100px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Minggu ke-</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Misal: 19" 
              style={{ padding: '8px 12px' }}
              value={filterMinggu}
              onChange={(e) => setFilterMinggu(e.target.value)}
            />
          </div>

          <div className="filter-item" style={{ minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Lokasi (Blok)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari Kode Blok..." 
              style={{ padding: '8px 12px' }}
              value={filterLokasi}
              onChange={(e) => setFilterLokasi(e.target.value)}
            />
          </div>

          <div className="filter-item" style={{ minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Pengirim Sampel</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari Nama Pengirim..." 
              style={{ padding: '8px 12px' }}
              value={filterPengirim}
              onChange={(e) => setFilterPengirim(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {error && (
          <div className="alert-notice error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Memuat riwayat sampling...</div>
        ) : groupedPlots.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Tidak ada riwayat input yang cocok dengan filter.</div>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Block Weekly</th>
                  <th>PG</th>
                  <th>Tgl Sampling</th>
                  <th>Tgl Kirim</th>
                  <th>Week/Bulan</th>
                  <th style={{ textAlign: 'center' }}>Plot</th>
                  <th style={{ textAlign: 'center' }}>Rata-rata pH Plot</th>
                  <th style={{ textAlign: 'center' }}>Jumlah Sampel</th>
                  <th>Pengirim</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {groupedPlots.map((plot) => {
                  const isExpanded = !!expandedPlots[plot.key];
                  return (
                    <React.Fragment key={plot.key}>
                      <tr 
                        style={{ cursor: 'pointer', transition: 'background 0.2s' }} 
                        onClick={() => toggleExpandPlot(plot.key)}
                        className={isExpanded ? 'expanded-row' : ''}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{plot.block_weekly}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Exp: {plot.kode_percobaan}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{plot.pg}</td>
                        <td>
                          <div>{plot.tanggal_sampling || '-'}</div>
                          <div style={{ fontSize: '11px', color: '#10b981' }}>Tanam: {plot.tanggal_tanam || '-'}</div>
                        </td>
                        <td>{plot.tanggal_kirim}</td>
                        <td>
                          <div>Wk {plot.week_sampling}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Bulan {plot.bulan_sampling}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{plot.no_plot}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${plot.avg_ph < 5.0 ? 'badge-ph-red' : plot.avg_ph <= 5.5 ? 'badge-ph-yellow' : plot.avg_ph <= 6.0 ? 'badge-ph-lightgreen' : 'badge-ph-darkgreen'}`}>
                            {plot.avg_ph.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {plot.samples.length} sampel
                          </span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{plot.pengirim_sampel}</td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={(e) => { e.stopPropagation(); toggleExpandPlot(plot.key); }}
                          >
                            {isExpanded ? 'Sembunyikan' : 'Lihat Sampel'}
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" style={{ background: 'rgba(255, 255, 255, 0.015)', padding: '16px 24px' }}>
                            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '16px' }}>
                              <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#9ca3af' }}>Rincian Sampel pH pada Plot {plot.no_plot}:</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                {plot.samples.map((sample) => (
                                  <div 
                                    key={sample.id} 
                                    style={{ 
                                      background: 'rgba(255, 255, 255, 0.02)', 
                                      border: '1px solid rgba(255, 255, 255, 0.05)', 
                                      borderRadius: '6px', 
                                      padding: '10px 12px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sampel {sample.no_sample}: </span>
                                      <span style={{ fontWeight: 700, color: sample.ph_tanah < 5.0 ? '#f87171' : sample.ph_tanah <= 5.5 ? '#fbbf24' : sample.ph_tanah <= 6.0 ? '#a3e635' : '#34d399' }}>
                                        {parseFloat(sample.ph_tanah).toFixed(2)}
                                      </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      {isWithin24Hours(sample.created_at) ? (
                                        <button 
                                          className="icon-btn edit" 
                                          style={{ padding: '4px' }}
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleEditClick({
                                              ...plot,
                                              id: sample.id,
                                              no_sample: sample.no_sample,
                                              ph_tanah: sample.ph_tanah,
                                              created_at: sample.created_at
                                            }); 
                                          }} 
                                          title="Edit Sampel"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                      ) : (
                                        <span style={{ fontSize: '11px', color: '#4b5563' }} title="Terkunci (> 24 Jam)">🔒</span>
                                      )}
                                      
                                      {(isAdmin || isWithin24Hours(sample.created_at)) && (
                                        <button 
                                          className="icon-btn delete" 
                                          style={{ padding: '4px' }}
                                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(sample.id); }} 
                                          title="Hapus Sampel"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Bulk Upload pH Tanah (.xlsx)">
        <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Gunakan template Excel resmi agar format kolom sesuai:</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              onClick={handleDownloadTemplate}
            >
              <Download size={13} style={{ color: '#10b981' }} />
              Unduh Template
            </button>
          </div>
          
          {importStatus.text && (
            <div className={`alert-notice ${importStatus.type}`}>
              {importStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{importStatus.text}</span>
            </div>
          )}

          {importStatus.details && importStatus.details.length > 0 && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239,68,68,0.1)', 
              borderRadius: '8px', 
              padding: '10px', 
              maxHeight: '120px', 
              overflowY: 'auto', 
              fontSize: '11px', 
              color: '#fca5a5' 
            }}>
              <strong>Daftar Error Baris:</strong>
              <ul style={{ paddingLeft: '14px', marginTop: '4px' }}>
                {importStatus.details.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div 
            className="upload-zone"
            onClick={() => document.getElementById('excel-file-input').click()}
          >
            <FileSpreadsheet size={32} className="upload-icon" />
            {importFile ? (
              <p style={{ fontWeight: 600, color: '#ffffff' }}>{importFile.name}</p>
            ) : (
              <>
                <p>Klik di sini untuk mengunggah file Excel template</p>
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', display: 'block' }}>
                  Format Kolom: Kode Percobaan | Pengirim Sampel | PG | Tgl Sampling | Tgl Kirim | Tgl Selesai | Lokasi | Status Lokasi | Tgl Tanam | No Plot | No Sample | pH Tanah
                </span>
              </>
            )}
            <input 
              id="excel-file-input"
              type="file" 
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              onChange={(e) => setImportFile(e.target.files[0])}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsImportOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={importLoading || !importFile}>
              {importLoading ? 'Mengimpor...' : 'Mulai Import'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Record Modal */}
      {editingRecord && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Data pH Tanah">
          <form onSubmit={handleEditSubmit}>
            {editStatus.text && (
              <div className={`alert-notice ${editStatus.type}`}>
                <AlertCircle size={18} />
                <span>{editStatus.text}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Kode Percobaan</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingRecord.kode_percobaan}
                onChange={(e) => setEditingRecord({ ...editingRecord, kode_percobaan: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PG</label>
                <select 
                  className="form-control"
                  value={editingRecord.pg}
                  onChange={(e) => setEditingRecord({ ...editingRecord, pg: e.target.value })}
                  required
                >
                  {pgList.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Lokasi</label>
                <select 
                  className="form-control"
                  value={editingRecord.status_lokasi}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status_lokasi: e.target.value })}
                  required
                >
                  {statusList.map(s => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Sampling</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={editingRecord.tanggal_sampling}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tanggal_sampling: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Tanam</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={editingRecord.tanggal_tanam_manual}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tanggal_tanam_manual: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Kirim</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={editingRecord.tanggal_kirim}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tanggal_kirim: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Selesai</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={editingRecord.tanggal_selesai}
                  onChange={(e) => setEditingRecord({ ...editingRecord, tanggal_selesai: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lokasi (Blok)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingRecord.lokasi}
                  onChange={(e) => setEditingRecord({ ...editingRecord, lokasi: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Plot</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={editingRecord.no_plot}
                  onChange={(e) => setEditingRecord({ ...editingRecord, no_plot: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">No. Sample</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={editingRecord.no_sample}
                  onChange={(e) => setEditingRecord({ ...editingRecord, no_sample: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">pH Tanah</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="14"
                  className="form-control"
                  value={editingRecord.ph_tanah}
                  onChange={(e) => setEditingRecord({ ...editingRecord, ph_tanah: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={editLoading}>
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Konfirmasi Hapus Data">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
            Apakah Anda yakin ingin menghapus data sampel pH ini secara permanen? Tindakan ini tidak dapat dibatalkan dan akan dicatat di log audit.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleteLoading}>Batal</button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryPage;
