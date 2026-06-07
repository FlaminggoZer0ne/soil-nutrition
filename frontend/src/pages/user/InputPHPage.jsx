import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  Calculator,
  ClipboardList
} from 'lucide-react';

const InputPHPage = () => {
  const { user } = useAuth();
  
  // Form Fields
  const [kodePercobaan, setKodePercobaan] = useState('');
  const [pg, setPg] = useState('');
  const [tanggalSampling, setTanggalSampling] = useState('');
  const [tanggalKirim, setTanggalKirim] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [tanggalTanam, setTanggalTanam] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [statusLokasi, setStatusLokasi] = useState('');
  const [noPlot, setNoPlot] = useState(1);
  const [samples, setSamples] = useState(['']); // Array of sample pH inputs

  // Dynamic Lists
  const [pgList, setPgList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Lookup results & Calculations
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupMessage, setLookupMessage] = useState({ type: '', text: '' });
  
  // Realtime calculated displays
  const [calcWeek, setCalcWeek] = useState('-');
  const [calcMonth, setCalcMonth] = useState('-');
  const [calcYear, setCalcYear] = useState('-');
  const [calcAge, setCalcAge] = useState('-');

  // Alert/Status
  const [submitStatus, setSubmitStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch PGs and Statuses on Mount
  useEffect(() => {
    const fetchPGs = async () => {
      try {
        const res = await api.get('/api/pg');
        setPgList(res.data);
        
        // Match user allowed PGs
        const allowedPGs = user?.pg_akses || [];
        const filteredPGs = user?.role === 'admin' 
          ? res.data 
          : res.data.filter(p => allowedPGs.includes(p.nama));

        if (filteredPGs.length > 0) {
          setPg(filteredPGs[0].nama);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar PG:', err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await api.get('/api/statuses');
        setStatuses(res.data);
        if (res.data.length > 0) {
          setStatusLokasi(res.data[0].nama);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar status lokasi:', err);
      }
    };

    fetchPGs();
    fetchStatuses();
  }, [user]);

  // Fetch Blocks when PG changes
  useEffect(() => {
    if (!pg) {
      setBlocksList([]);
      setLokasi('');
      setLookupResult(null);
      return;
    }

    const fetchBlocks = async () => {
      setLookupLoading(true);
      try {
        const res = await api.get(`/api/blocks?pg=${pg}`);
        setBlocksList(res.data);
        setLokasi('');
        setLookupResult(null);
      } catch (err) {
        console.error('Gagal mengambil daftar blok:', err);
      } finally {
        setLookupLoading(false);
      }
    };

    fetchBlocks();
  }, [pg]);

  // Run local lookup when lokasi (Block code) is selected
  useEffect(() => {
    if (!lokasi) {
      setLookupResult(null);
      setLookupMessage({ type: '', text: '' });
      return;
    }

    const blockDetails = blocksList.find(b => b.block_code === lokasi);
    if (blockDetails) {
      setLookupResult(blockDetails);
      setStatusLokasi(blockDetails.status);
      setLookupMessage({ 
        type: 'success', 
        text: `Blok ditemukan! Varietas: ${blockDetails.clone || '-'}, Tgl Tanam: ${blockDetails.tanggal_tanam || '-'}` 
      });
    } else {
      setLookupResult(null);
      setLookupMessage({ 
        type: 'warning', 
        text: 'Blok tidak terdaftar. Pastikan pilihan blok Anda benar.' 
      });
    }
  }, [lokasi, blocksList]);

  // Recalculate Week, Month, Year, and Age on Date Changes
  useEffect(() => {
    if (!tanggalSampling) {
      setCalcWeek('-');
      setCalcMonth('-');
      setCalcYear('-');
      setCalcAge('-');
      return;
    }

    const d = new Date(tanggalSampling);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    setCalcWeek(weekNo);
    setCalcMonth(d.getMonth() + 1);
    setCalcYear(d.getFullYear());

    // Calculate crop age if planting date exists (manual input priority over block lookup)
    const effectivePlantingDate = tanggalTanam || (lookupResult && lookupResult.tanggal_tanam ? lookupResult.tanggal_tanam : null);
    if (effectivePlantingDate) {
      const pDate = new Date(effectivePlantingDate);
      const yearsDiff = d.getFullYear() - pDate.getFullYear();
      const monthsDiff = d.getMonth() - pDate.getMonth();
      const totalMonths = (yearsDiff * 12) + monthsDiff;
      setCalcAge(totalMonths >= 0 ? `${totalMonths} bulan` : '0 bulan (Sampling sebelum tanam)');
    } else {
      setCalcAge('-');
    }
  }, [tanggalSampling, tanggalTanam, lookupResult]);

  // Handle Multi-Sample Controls
  const handleAddSample = () => {
    setSamples([...samples, '']);
  };

  const handleRemoveSample = (index) => {
    if (samples.length === 1) return;
    const next = [...samples];
    next.splice(index, 1);
    setSamples(next);
  };

  const handleSampleChange = (index, value) => {
    const next = [...samples];
    next[index] = value;
    setSamples(next);
  };

  // Real-time Average calculation
  const validPHs = samples
    .map(s => parseFloat(s))
    .filter(val => !isNaN(val) && val >= 0 && val <= 14);

  const avgPH = validPHs.length > 0 
    ? (validPHs.reduce((sum, val) => sum + val, 0) / validPHs.length).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', text: '' });
    
    if (validPHs.length === 0) {
      setSubmitStatus({ type: 'error', text: 'Minimal satu nilai pH sampel harus valid.' });
      return;
    }

    if (new Date(tanggalSelesai) < new Date(tanggalKirim)) {
      setSubmitStatus({ type: 'error', text: 'Tanggal selesai analisa tidak boleh sebelum tanggal kirim.' });
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/ph', {
        kode_percobaan: kodePercobaan || '-',
        pg,
        tanggal_sampling: tanggalSampling,
        tanggal_kirim: tanggalKirim,
        tanggal_selesai: tanggalSelesai,
        tanggal_tanam_manual: tanggalTanam || null,
        lokasi,
        status_lokasi: statusLokasi,
        no_plot: parseInt(noPlot),
        samples: validPHs
      });

      setSubmitStatus({ type: 'success', text: 'Data pH tanah untuk plot ini berhasil disimpan!' });
      
      // Reset form fields
      setKodePercobaan('');
      setLokasi('');
      setNoPlot(1);
      setSamples(['']);
      setLookupResult(null);
      setLookupMessage({ type: '', text: '' });
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        text: error.response?.data?.message || 'Gagal menyimpan data pH.' 
      });
    } finally {
      setSubmitting(false);
    }
  };



  // Allowed PGs for current user
  const allowedPGs = user?.pg_akses || [];
  const filteredPGList = user?.role === 'admin'
    ? pgList
    : pgList.filter(p => allowedPGs.includes(p.nama));

  return (
    <div className="animate-fade-in">
      <div className="top-bar">
        <div>
          <h2>Input Sampel pH Tanah</h2>
          <p className="page-title-desc">Formulir analisis laboratorium sampel tanah lapangan terstruktur per Plot</p>
        </div>
      </div>

      <div className="responsive-grid-2-1">
        {/* Main Input Form */}
        <div className="glass-card">
          {submitStatus.text && (
            <div className={`alert-notice ${submitStatus.type}`}>
              {submitStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{submitStatus.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kode Percobaan (Opsional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Misal: EXP-12 atau -"
                  value={kodePercobaan}
                  onChange={(e) => setKodePercobaan(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plantation Grup (PG)</label>
                <select 
                  className="form-control" 
                  value={pg}
                  onChange={(e) => setPg(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih PG...</option>
                  {filteredPGList.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Sampling (Acuan Hitung Umur)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tanggalSampling}
                  onChange={(e) => setTanggalSampling(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Tanam (Opsional - Menimpa bawaan Blok)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tanggalTanam}
                  onChange={(e) => setTanggalTanam(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Kirim Sampel</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tanggalKirim}
                  onChange={(e) => setTanggalKirim(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Selesai Analisa</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kode Lokasi (Blok Tanam)</label>
                <select 
                  className="form-control" 
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  required
                  disabled={!pg}
                >
                  <option value="">{pg ? 'Pilih Blok...' : 'Silakan pilih PG terlebih dahulu'}</option>
                  {blocksList.map(b => (
                    <option key={b.id} value={b.block_code}>
                      {b.block_code} ({b.clone})
                    </option>
                  ))}
                </select>
                {lookupLoading && <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>Memuat blok tanam...</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Status Lokasi</label>
                <select 
                  className="form-control" 
                  value={statusLokasi}
                  onChange={(e) => setStatusLokasi(e.target.value)}
                  required
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {lookupMessage.text && (
              <div 
                className="alert-notice info" 
                style={{ 
                  padding: '8px 14px', 
                  fontSize: '12px', 
                  marginBottom: '16px',
                  background: lookupMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  color: lookupMessage.type === 'success' ? '#34d399' : '#fbbf24',
                  borderColor: lookupMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  borderLeftWidth: '3px'
                }}
              >
                <span>{lookupMessage.text}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nomor Plot</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  placeholder="Misal: 1"
                  value={noPlot}
                  onChange={(e) => setNoPlot(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Nilai pH Sampel pada Plot ini</span>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleAddSample}
                >
                  + Tambah Sampel pH
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {samples.map((sample, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '80px' }}>Sampel {idx + 1}:</span>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="14"
                      className="form-control" 
                      placeholder="Masukkan nilai pH (misal: 6.2)"
                      value={sample}
                      onChange={(e) => handleSampleChange(idx, e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ 
                        padding: '8px 12px', 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        color: '#f87171',
                        cursor: 'pointer' 
                      }}
                      onClick={() => handleRemoveSample(idx)}
                      disabled={samples.length === 1}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              {/* Rata-rata pH Plot Real-time Display */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px 16px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px dashed rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Rata-rata pH Plot Terhitung:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: parseFloat(avgPH) < 5.0 ? '#f87171' : parseFloat(avgPH) <= 5.5 ? '#fbbf24' : parseFloat(avgPH) <= 6.0 ? '#a3e635' : '#34d399' }}>
                  {avgPH}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Data Plot'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setKodePercobaan('');
                  setLokasi('');
                  setNoPlot(1);
                  setSamples(['']);
                  setLookupResult(null);
                  setLookupMessage({ type: '', text: '' });
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Calculation Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
            <Calculator size={16} style={{ color: '#10b981' }} />
            Otomatisasi Sistem
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Week Sampling:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>
                {calcWeek !== '-' ? `Wk ${calcWeek}` : '-'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Bulan Sampling:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>
                {calcMonth !== '-' ? `Bulan ${calcMonth}` : '-'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Tahun Sampling:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>
                {calcYear}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span style={{ color: '#9ca3af' }}>Tanggal Tanam Blok:</span>
              <span style={{ fontWeight: 500, color: lookupResult ? '#ffffff' : '#6b7280' }}>
                {lookupResult ? lookupResult.tanggal_tanam : 'N/A'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Clone (Varietas):</span>
              <span style={{ fontWeight: 500, color: lookupResult ? '#ffffff' : '#6b7280' }}>
                {lookupResult ? lookupResult.clone : 'N/A'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Wk / Tahun Tanam:</span>
              <span style={{ fontWeight: 500, color: lookupResult ? '#ffffff' : '#6b7280' }}>
                {lookupResult ? `Wk ${lookupResult.wk_tanam} / ${lookupResult.tahun_tanam}` : 'N/A'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span style={{ color: '#9ca3af' }}>Umur Saat Sampling:</span>
              <span style={{ fontWeight: 600, color: calcAge !== '-' ? '#10b981' : '#6b7280' }}>
                {calcAge}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
            <ClipboardList size={14} style={{ color: '#3b82f6', marginBottom: '6px' }} />
            <strong>Catatan:</strong> Data Wk Tanam, Clone, dan Umur tanaman dihitung otomatis melalui sinkronisasi silang tabel populasi mingguan PG yang dipilih.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPHPage;
