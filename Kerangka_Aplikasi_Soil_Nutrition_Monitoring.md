# Kerangka Aplikasi Web: Soil & Nutrition Monitoring
### Sistem Monitoring pH Tanah & Data Nutrisi Perkebunan

---

## 1. Rekomendasi Teknologi

### Mengapa Pilihan Ini?

Berdasarkan kebutuhan aplikasi (multi-user, dashboard admin, input data lapangan, export file), rekomendasi stack teknologi adalah:

### Frontend
**React.js** (dengan Vite sebagai build tool)
- Komponen reusable cocok untuk form input yang repetitif
- Ekosistem library chart yang kaya (Recharts / Chart.js) untuk dashboard
- State management mudah dengan React Query atau Zustand

### Backend
**Node.js + Express.js**
- Ringan dan cepat untuk REST API
- Cocok untuk tim kecil / startup
- Banyak library siap pakai: multer (upload file), exceljs (export Excel), bcrypt (auth)

### Database
**PostgreSQL**
- Relasional, cocok untuk data terstruktur seperti pH per block/PG/minggu
- Mendukung query agregasi kompleks untuk dashboard admin

### Alternatif yang Lebih Sederhana
Jika tim kecil dan ingin cepat jalan:
- **Backend:** Laravel (PHP) — dokumentasi sangat lengkap dalam bahasa Indonesia
- **Database:** MySQL — sudah familiar di kebanyakan hosting Indonesia
- **Frontend:** Blade + Alpine.js (tetap dalam ekosistem Laravel)

> **Rekomendasi utama: React + Node.js + PostgreSQL** untuk skalabilitas jangka panjang. Gunakan Laravel jika tim lebih familiar dengan PHP.

---

## 2. Arsitektur Aplikasi

```
[User (Petugas Lapangan)]
        |
        | Input Data pH / Populasi
        v
[Web App - React Frontend]
        |
        | REST API (JSON)
        v
[Backend - Node.js/Express]
        |
   _____|_____
  |           |
  v           v
[PostgreSQL] [File Storage]
 (Data)      (Export Excel/PDF)
        |
        v
[Admin Dashboard]
(Ringkasan & Monitoring)
```

---

## 3. Struktur Halaman & Fitur

### 3.1 Halaman Publik (Tanpa Login)
- **Landing Page** — deskripsi singkat aplikasi, tombol Login

---

### 3.2 Modul Autentikasi
| Halaman | Fungsi |
|---|---|
| `/login` | Login dengan email + password |
| `/forgot-password` | Reset password via email |

**Role yang tersedia:**
- `admin` — akses penuh, melihat semua data semua PG
- `user` — input data, lihat data milik sendiri / PG-nya

---

### 3.3 Modul User (Petugas Lapangan)

#### Dashboard User (`/dashboard`)
- Ringkasan jumlah sampel yang sudah diinput bulan ini
- Status terakhir input (tanggal, minggu ke-)
- Grafik pH rata-rata per bulan (data milik sendiri)

#### Form Input Data pH (`/input/ph`)
Mengacu pada kolom di sheet **pH** file Excel:

| Field | Tipe Input | Keterangan |
|---|---|---|
| Kode Percobaan | Text | Opsional, bisa dikosongkan (`-`) |
| Pengirim Sampel | Text | Nama petugas / auto-fill dari login |
| PG | Dropdown | PG1, PG3, PG4 |
| Tanggal Kirim | Date Picker | |
| Tanggal Selesai Analisa | Date Picker | |
| Week Sampling | Number | Auto-hitung dari tanggal kirim |
| Bulan Sampling | Number | Auto-hitung |
| Tahun Sampling | Number | Auto-hitung |
| Lokasi (Kode Block) | Text / Dropdown | Contoh: `554E2A`, `055A3` |
| Status Lokasi | Dropdown | PSFC, PSSC, PSSR, PS3R, PS4R |
| No. Sample (Plot) | Number | Nomor urut sampel per lokasi |
| pH Tanah | Decimal | Nilai pH hasil analisa lab |

**Validasi:**
- pH harus antara 0–14
- Tanggal Selesai Analisa ≥ Tanggal Kirim
- Semua field wajib diisi kecuali Kode Percobaan

#### Riwayat Input (`/input/history`)
- Tabel data yang sudah diinput oleh user yang sedang login
- Filter: berdasarkan PG, bulan, minggu, tahun
- Tombol **Download Excel** (data milik sendiri)
- Tombol **Edit** (jika data < 24 jam setelah diinput)

#### Download Data (`/download`)
- Pilih filter: PG, Tahun, Rentang Minggu
- Pilih format: Excel (.xlsx) atau CSV
- Tombol unduh

---

### 3.4 Modul Admin

#### Dashboard Admin (`/admin/dashboard`)
Menampilkan ringkasan agregasi seluruh data:

**Kartu Ringkasan (Summary Cards):**
- Total sampel diinput (bulan ini / tahun ini)
- Rata-rata pH tanah keseluruhan
- Jumlah block yang sudah disampling
- Jumlah block belum disampling (bulan berjalan)

**Grafik & Visualisasi:**
- Grafik garis: Tren rata-rata pH per minggu (per PG atau keseluruhan)
- Grafik batang: Jumlah sampel per PG per bulan
- Tabel resume: pH rata-rata per block per bulan (seperti sheet **Resume** di Excel)
  - Kolom: PG | Block | Status | Tahun | Bulan -3 s/d Bulan +20
- Heatmap pH: visualisasi warna pH per block (merah = asam, hijau = normal)

#### Manajemen Data (`/admin/data`)
- Tabel semua data dari seluruh user
- Filter: PG, Block, Status Lokasi, Tahun, Minggu, Pengirim Sampel
- Pencarian bebas (full-text search)
- Aksi per baris: Edit, Hapus
- Tombol **Download Excel** (semua data / data terfilter)
- Tombol **Import Excel** (bulk upload dari file Excel yang ada)

#### Manajemen User (`/admin/users`)
- Daftar semua user
- Tambah user baru (nama, email, password, PG yang dikelola, role)
- Edit / nonaktifkan user
- Reset password user

#### Log Aktivitas (`/admin/logs`)
- Riwayat siapa menginput/edit/hapus data kapan
- Filter berdasarkan user dan tanggal

---

## 4. Desain Database

### Tabel: `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID / Serial | Primary key |
| nama | VARCHAR | Nama lengkap |
| email | VARCHAR UNIQUE | Untuk login |
| password_hash | VARCHAR | Bcrypt |
| role | ENUM | `admin` / `user` |
| pg_akses | VARCHAR[] | PG yang boleh diakses user |
| aktif | BOOLEAN | Status akun |
| created_at | TIMESTAMP | |

### Tabel: `ph_data`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Serial | Primary key |
| user_id | FK → users | Siapa yang menginput |
| kode_percobaan | VARCHAR | Opsional |
| pengirim_sampel | VARCHAR | Nama pengirim |
| pg | VARCHAR | PG1 / PG3 / PG4 |
| tanggal_kirim | DATE | |
| tanggal_selesai | DATE | |
| week_sampling | INTEGER | |
| bulan_sampling | INTEGER | |
| tahun_sampling | INTEGER | |
| lokasi | VARCHAR | Kode block, misal `554E2A` |
| status_lokasi | VARCHAR | PSFC, PSSC, PSSR, PS3R, PS4R |
| block_weekly | VARCHAR | Auto-generate (lokasi + suffix status) |
| wk_tanam | INTEGER | Dari lookup data weekly |
| tahun_tanam | INTEGER | |
| tanggal_tanam | DATE | |
| umur_saat_sampling | INTEGER | Dalam bulan |
| no_sample | INTEGER | Nomor plot |
| ph_tanah | DECIMAL(4,2) | Nilai pH |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Tabel: `weekly_populasi`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Serial | |
| pg | VARCHAR | |
| block | VARCHAR | Kode block |
| status | VARCHAR | |
| luas | DECIMAL | |
| populasi | INTEGER | |
| clone | VARCHAR | |
| wk_tanam | INTEGER | |
| tahun_tanam | INTEGER | |
| tanggal_tanam | DATE | |
| week_data | INTEGER | Minggu ke- data ini |
| tahun_data | INTEGER | |
| created_at | TIMESTAMP | |

### Tabel: `activity_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Serial | |
| user_id | FK → users | |
| aksi | VARCHAR | `create`, `update`, `delete`, `export` |
| tabel_target | VARCHAR | Tabel yang diubah |
| data_id | INTEGER | ID record yang diubah |
| detail | JSONB | Data sebelum/sesudah perubahan |
| created_at | TIMESTAMP | |

---

## 5. API Endpoint (REST)

### Auth
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/login` | Login, return JWT token |
| POST | `/api/auth/logout` | Invalidate token |
| POST | `/api/auth/forgot-password` | Kirim email reset |

### Data pH (User & Admin)
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/ph` | List data pH (filter: pg, tahun, minggu, user) |
| POST | `/api/ph` | Tambah data pH baru |
| PUT | `/api/ph/:id` | Edit data pH |
| DELETE | `/api/ph/:id` | Hapus data pH (admin only) |
| GET | `/api/ph/export` | Download data sebagai Excel/CSV |
| POST | `/api/ph/import` | Bulk import dari Excel |

### Dashboard
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/dashboard/summary` | Kartu ringkasan admin |
| GET | `/api/dashboard/tren-ph` | Data tren pH per minggu |
| GET | `/api/dashboard/resume` | Tabel resume per block |
| GET | `/api/dashboard/heatmap` | Data pH per block untuk heatmap |

### User Management (Admin Only)
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/users` | List semua user |
| POST | `/api/users` | Tambah user baru |
| PUT | `/api/users/:id` | Edit user |
| DELETE | `/api/users/:id` | Nonaktifkan user |

---

## 6. Fitur Download & Export

### Format yang Didukung
- **Excel (.xlsx):** Kolom sesuai template asli, siap digunakan langsung
- **CSV:** Untuk keperluan analisa data di tools lain

### Opsi Filter saat Export (User)
- Pilih PG
- Pilih Tahun
- Pilih rentang Minggu

### Opsi Filter saat Export (Admin)
- Semua opsi user +
- Pilih pengirim sampel
- Pilih status lokasi (PSFC, PSSC, dll.)
- Export seluruh data tanpa filter

### Template Export Excel (pH Sheet)
Kolom output mengikuti struktur file Excel yang ada:
`Kode Percobaan | Pengirim Sampel | PG | Tgl Kirim | Tgl Selesai | Week | Bulan | Tahun | Lokasi | Status Lokasi | Block Weekly | Wk Tanam | Tahun Tanam | Tgl Tanam | Umur (bln) | No Sample | pH Tanah`

### Template Export Resume
Output mengikuti sheet **Resume** — rata-rata pH per block per bulan (umur tanam -3 s/d +20).

---

## 7. Alur Kerja (Workflow)

```
[User Login]
    |
    v
[Input Data pH di Form]
    |
    v
[Validasi & Simpan ke Database]
    |
    v
[Data langsung tersedia di Admin Dashboard]
    |
    +---> [Admin lihat summary & grafik real-time]
    |
    +---> [User/Admin download data sebagai Excel]
```

---

## 8. Keamanan

- Autentikasi menggunakan **JWT (JSON Web Token)** dengan expiry 8 jam
- Setiap endpoint diproteksi dengan middleware `verifyToken`
- Endpoint admin diproteksi tambahan dengan middleware `isAdmin`
- Password di-hash dengan **bcrypt** (salt rounds: 12)
- User hanya bisa melihat/edit data PG yang sesuai `pg_akses` miliknya
- Rate limiting pada endpoint login (max 5 percobaan per menit)
- Input sanitization untuk mencegah SQL injection

---

## 9. Struktur Folder Proyek

```
soil-nutrition-app/
├── frontend/                    # React.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Button, Modal, Table, dll
│   │   │   ├── charts/          # GrafikTrenPH, HeatmapBlock, dll
│   │   │   └── forms/           # FormInputPH, FormFilterExport, dll
│   │   ├── pages/
│   │   │   ├── auth/            # Login, ForgotPassword
│   │   │   ├── user/            # Dashboard, InputPH, History, Download
│   │   │   └── admin/           # Dashboard, DataManagement, UserMgmt, Logs
│   │   ├── hooks/               # Custom hooks (useAuth, usePHData, dll)
│   │   ├── services/            # API calls (axios)
│   │   └── utils/               # Helper functions
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── controllers/         # authController, phController, dll
│   │   ├── middleware/          # verifyToken, isAdmin, rateLimiter
│   │   ├── models/              # Definisi tabel (Sequelize/Knex)
│   │   ├── routes/              # authRoutes, phRoutes, dashboardRoutes
│   │   ├── services/            # exportService, importService
│   │   └── utils/               # weekCalculator, excelParser
│   ├── migrations/              # Migrasi database
│   └── package.json
│
└── docker-compose.yml           # Opsional, untuk deployment
```

---

## 10. Rencana Pengembangan (Roadmap)

### Fase 1 — MVP (Minimum Viable Product)
- [ ] Autentikasi login/logout
- [ ] Form input data pH
- [ ] Riwayat data per user
- [ ] Download data sebagai Excel
- [ ] Dashboard admin (summary cards + tabel data)

### Fase 2 — Fitur Lengkap
- [ ] Grafik tren pH per minggu
- [ ] Tabel Resume otomatis (seperti sheet Resume)
- [ ] Import bulk dari Excel
- [ ] Manajemen user oleh admin
- [ ] Log aktivitas

### Fase 3 — Peningkatan
- [ ] Heatmap pH per block
- [ ] Notifikasi email jika ada block yang belum disampling
- [ ] Dashboard mobile-responsive untuk input di lapangan
- [ ] Integrasi data populasi dari sheet Weekly

---

## 11. Catatan Teknis Berdasarkan File Excel

Berdasarkan analisis file `Monitoring_data_pH_tanah_All_PG_Th_2023-Now`:

- File memiliki **4 sheet:** `Weekly 51 2023`, `Weekly 52 2024`, `pH`, `Resume`
- Sheet **pH** adalah data utama yang akan diinput user ke aplikasi
- Sheet **Resume** adalah agregasi otomatis — akan di-generate oleh backend menggunakan query `AVERAGEIFS` yang dikonversi ke SQL `AVG` + `GROUP BY`
- Sheet **Weekly** berisi data populasi yang menjadi referensi lookup untuk mengisi field `Wk Tanam`, `Tahun Tanam`, dan `Tanggal Tanam` secara otomatis
- Kode block menggunakan format seperti `554E2A`, `055A3`, `412C1-A1` — suffix `-A1`, `-A2`, `-A3` menunjukkan status lokasi (PSSC, PSSR, PS3R)
- PG dibedakan dari kode block: prefix `0xx` = PG1, `4xx` = PG4, `5xx` = PG3

---

*Dokumen ini dibuat sebagai kerangka awal. Setiap bagian dapat dikembangkan lebih lanjut sesuai kebutuhan tim.*
