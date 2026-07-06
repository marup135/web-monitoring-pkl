# 📋 Web Monitoring PKL (100% Pakai AI)

Aplikasi berbasis web modern untuk memantau, melaporkan, dan mengevaluasi kegiatan siswa selama melaksanakan **Praktek Kerja Lapangan (PKL)**. Proyek ini memfasilitasi komunikasi dan kolaborasi yang efisien antara **Siswa**, **Pembimbing Internal (Sekolah)**, dan **Pembimbing Eksternal (Perusahaan)**.

---

## 🚀 Deskripsi Proyek

Aplikasi **Web Monitoring PKL** ini dirancang untuk menggantikan pencatatan logbook fisik yang rentan hilang atau rusak. Dengan fitur alur kerja berbasis Kanban dan sistem penilaian langsung, pembimbing sekolah dan perusahaan dapat terus memantau perkembangan siswa secara *real-time*.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan teknologi modern berikut:

- **Framework & Rendering:** [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Logic:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM:** [Prisma v7.8.0](https://www.prisma.io/)
- **Database Engine:** MySQL / MariaDB
- **Icons:** [Lucide React](https://lucide.dev/)
- **Compiler:** React Compiler (Babel plugin)

---

## 🔑 Fitur Utama Berdasarkan Peran (Multi-Role)

Aplikasi mendukung tiga tipe akun pengguna:

1. **Siswa (`siswa`)**
   - Mengisi logbook harian melalui **Kanban Board** yang interaktif (*Rencana*, *Sedang Dikerjakan*, *Selesai*).
   - Mencatat jumlah jam kerja (`hoursLogged`) pada setiap tugas.
   - Melihat feedback dan nilai (`score`) dari pembimbing.
   - Diskusi interaktif dengan pembimbing melalui kolom komentar di setiap tugas.

2. **Pembimbing Internal (`pembimbing_internal`) & Pembimbing Eksternal (`pembimbing_eksternal`)**
   - **Dashboard Stats:** Melihat ringkasan grafik dan statistik kemajuan siswa.
   - **Logbook Table:** Membuka tabel rekap logbook lengkap siswa secara detail.
   - **Evaluasi & Feedback:** Memberikan nilai (`score`) dan masukan (`feedback`) langsung pada detail tugas siswa.
   - **Advisor Notes:** Menulis catatan bimbingan resmi yang dikhususkan bagi siswa bimbingan.

---

## 📁 Struktur Folder Proyek

```text
pkl-monitoring2/
├── prisma/
│   └── schema.prisma        # Definisi skema database Prisma (MySQL)
├── public/                  # Aset gambar statis dan ikon
├── src/
│   ├── app/
│   │   ├── actions/         # Server Actions (Autentikasi, Logbook, dll)
│   │   ├── globals.css      # Konfigurasi Tailwind CSS v4
│   │   ├── layout.tsx       # Root layout aplikasi
│   │   └── page.tsx         # Dashboard utama, Kanban, & Halaman Login
│   ├── components/          # Komponen UI reusable
│   │   ├── AuthPage.tsx       # Halaman Autentikasi (Login & Register)
│   │   ├── CardModal.tsx      # Modal Detail & Form Edit Aktivitas (Kanban Card)
│   │   ├── DashboardStats.tsx # Ringkasan statistik monitoring
│   │   ├── KanbanBoard.tsx    # Kanban Board utama untuk tracking aktivitas siswa
│   │   └── LogbookTable.tsx   # Tabel komprehensif rekap logbook siswa
│   ├── context/             # React Context untuk state management
│   ├── lib/                 # Inisialisasi library (Prisma client dll)
│   ├── types/               # Definisi tipe TypeScript
│   └── utils/               # Fungsi utilitas helper
├── .env                     # Konfigurasi variabel lingkungan (Local)
├── package.json             # Dependensi dan script NPM
└── tsconfig.json            # Konfigurasi TypeScript
```

---

## ⚙️ Persyaratan Sistem (Prerequisites)

Sebelum menjalankan aplikasi di lokal, pastikan perangkat Anda telah terinstal:
- [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
- [MySQL](https://www.mysql.com/) atau [MariaDB](https://mariadb.org/) Server yang aktif berjalan

---

## 🚀 Langkah Instalasi & Menjalankan Proyek

1. **Clone Repositori**
   ```bash
   git clone https://github.com/Marup135/web-monitoring-pkl.git
   cd web-monitoring-pkl
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Variabel Lingkungan (`.env`)**
   Buat file `.env` di root folder proyek (jika belum ada) dan sesuaikan link database MySQL Anda:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/minitor_pkl"
   ```
   *Sesuaikan `username`, `password`, dan port `3306` dengan konfigurasi database MySQL/MariaDB lokal Anda.*

4. **Singkronisasi Database & Generate Prisma Client**
   Jalankan perintah berikut untuk membuat tabel database berdasarkan skema Prisma:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Jalankan Aplikasi dalam Mode Pengembangan (Development)**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

6. **Build untuk Produksi (Production)**
   ```bash
   npm run build
   npm run start
   ```

---

## 📊 Skema Database (Prisma Models)

Berikut gambaran relasi tabel database pada proyek ini:

- **`User`**: Menyimpan profil akun siswa dan pembimbing.
- **`Card`**: Representasi tugas/aktivitas harian siswa pada Kanban Board.
- **`Comment`**: Menyimpan riwayat komentar diskusi di setiap aktivitas `Card`.
- **`HistoryItem`**: Log pencatatan perubahan status atau aktivitas yang terjadi pada kartu.
- **`AdvisorNote`**: Catatan resmi atau evaluasi umum yang diberikan oleh pembimbing untuk siswa.

---

Dibuat dengan ❤️ untuk kemudahan monitoring PKL siswa **SMKN 1 BOJONG**.
