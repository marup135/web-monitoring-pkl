<div align="center">
  <img src="public/nebo.png" alt="NEBO Logo" width="160" style="border-radius: 20px; margin-bottom: 20px;" />
  <h1>🚀 NeboTrack (Web Monitoring PKL)</h1>
  <p align="center">
    <strong>Sistem Monitoring & Logbook Jurnal Harian PKL Digital SMKN 1 Bojong</strong>
    <br />
    <em>Solusi modern untuk transparansi dan efisiensi kegiatan Praktek Kerja Lapangan.</em>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Prisma-6.16-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  </p>

  <p align="center">
    <a href="#-fitur-utama">Fitur</a> •
    <a href="#-teknologi-yang-digunakan">Teknologi</a> •
    <a href="#-cara-instalasi">Instalasi</a> •
    <a href="#-struktur-folder">Struktur</a> •
    <a href="#-skema-database">Database</a> •
    <a href="#-peran-pengguna-roles">Roles</a>
  </p>
</div>

---

## 📖 Deskripsi Aplikasi

**NeboTrack (Web Monitoring PKL)** adalah platform monitoring terpadu yang dirancang khusus untuk memfasilitasi program **Praktek Kerja Lapangan (PKL)** bagi siswa SMKN 1 Bojong. Aplikasi ini menjembatani komunikasi, pelaporan, dan evaluasi berkala antara tiga pihak utama:

*   👤 **Siswa**: Mencatat aktivitas harian, absensi kehadiran, dan memantau progres.
*   👨‍🏫 **Guru Pembimbing (Internal)**: Memantau dan mengevaluasi perkembangan siswa di lapangan.
*   🏢 **Mentor Perusahaan (Eksternal)**: Memberikan feedback dan verifikasi langsung atas pekerjaan siswa.

Dengan antarmuka yang modern, NeboTrack mendukung **Kanban Board** di Desktop untuk manajemen tugas yang terorganisir dan **Mobile Timeline** di Smartphone untuk kemudahan pengisian absensi & jurnal di mana saja.

---

## ✨ Fitur Utama

- 📊 **Dashboard & Statistik**: Pantau progress harian, jam kerja, dan nilai rata-rata siswa secara real-time.
- 📋 **Kanban Board**: Manajemen tugas bergaya Trello yang intuitif (Rencana, Sedang Dikerjakan, Review, Selesai).
- 📱 **Mobile-First Design**: Tampilan logbook bergaya *timeline* dengan interaksi gestur (bottom sheet).
- 📝 **Logbook Harian & Absensi**: Pencatatan jurnal kegiatan beserta absensi (check-in/check-out) dan evaluasi langsung.
- 🌙 **Dark Mode**: Dukungan tema gelap untuk kenyamanan mata.
- 👥 **Multi-Role Access**: Hak akses aman berbasis role untuk Admin, Siswa, Pembimbing Internal, dan Pembimbing Eksternal.

---

## 🛠 Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 16.2 (App Router)](https://nextjs.org/) |
| **UI Library** | [React 19.2](https://reactjs.org/) & [Lucide Icons](https://lucide.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database ORM** | [Prisma 6.16](https://prisma.io/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (Supabase) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📸 Tampilan Aplikasi

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Desktop (Kanban)</b></td>
      <td align="center"><b>Mobile (Timeline)</b></td>
    </tr>
    <tr>
      <td><img src="src/hasil-desktop.png" width="500px" alt="Desktop View" /></td>
      <td><img src="src/hasil-hp.jpg" width="220px" alt="Mobile View" /></td>
    </tr>
  </table>
</div>

---

## ⚙️ Cara Instalasi

Ikuti langkah-langkah berikut untuk menjalankan project di lingkungan lokal:

### 1. Persyaratan
- Node.js (v18 ke atas)
- npm / pnpm

### 2. Clone & Install
```bash
# Clone repositori
git clone https://github.com/username/web-monitoring-pkl.git

# Masuk ke folder
cd web-monitoring-pkl

# Instal dependensi (akan otomatis menjalankan 'prisma generate' via postinstall)
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root direktori dan sesuaikan konfigurasinya dengan database PostgreSQL Anda:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

### 4. Setup Database
```bash
# Sinkronisasi schema database dengan Prisma
npx prisma db push
```
*(Catatan: Anda tidak perlu `prisma generate` lagi jika script postinstall npm berhasil berjalan. Namun jika diperlukan, jalankan `npx prisma generate`)*

---

## 🚀 Menjalankan Project

Jalankan perintah berikut sesuai dengan kebutuhan (mengacu pada `package.json`):

```bash
# Menjalankan development server
npm run dev

# Melakukan build aplikasi untuk production
npm run build

# Menjalankan aplikasi hasil build production
npm run start
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📂 Struktur Folder

```bash
web-monitoring-pkl/
├── 📁 prisma/          # Schema database (schema.prisma) & config
├── 📁 public/          # Aset statis (Logo, Icon)
├── 📁 src/
│   ├── 📁 app/         # Next.js App Router (Pages, API, Actions)
│   ├── 📁 components/  # Komponen UI Reusable
│   ├── 📁 context/     # State Management
│   ├── 📁 lib/         # Utilitas & Konfigurasi (Prisma, Email, dll)
│   └── 📁 types/       # Definisi TypeScript
├── 📄 .env             # Variabel Lingkungan
├── 📄 package.json     # Dependensi Project & Script
└── 📄 tailwind.config  # Konfigurasi Styling
```

---

## 🗄 Skema Database

Aplikasi ini menggunakan skema relasional dengan model utama sebagai berikut:

- **`User`**: Menyimpan data pengguna termasuk kredensial, role, serta relasi ke institusi, kelas, dan perusahaan.
- **`Institution`**: Data institusi/sekolah.
- **`Kelas`**: Data kelas yang menampung siswa dan pembimbing.
- **`Perusahaan`**: Tempat siswa melaksanakan PKL beserta mentornya.
- **`Card`**: Logbook/tugas harian siswa pada Kanban board. Dilengkapi dengan penilaian (score) dan *feedback* dari mentor maupun pembimbing.
- **`Comment` & `HistoryItem`**: Komentar dan riwayat aktivitas dari setiap kartu Logbook (`Card`).
- **`AdvisorNote`**: Catatan dari pembimbing untuk siswa.
- **`Attendance`**: Pencatatan absensi harian (check-in, check-out, status kehadiran, foto lokasi).

---

## 🎭 Peran Pengguna (Roles)

Sistem menggunakan kontrol akses ketat berdasarkan field `role` di model `User`. Nilai role (sesuai *codebase*) beserta hak aksesnya adalah:

| Role | Nilai di DB | Deskripsi |
| :--- | :--- | :--- |
| **Admin** | `admin` | Manajemen data master, user, jurusan, dan perusahaan. *Catatan: Role admin tidak dapat didaftarkan secara publik melalui form registrasi biasa.* |
| **Siswa** | `siswa` | Mengisi jurnal/logbook harian, melapor absensi kehadiran, dan memantau nilai. |
| **Pembimbing Internal** | `pembimbing_internal` | Guru dari sekolah yang memantau perkembangan siswa dan memberikan nilai/evaluasi internal. |
| **Pembimbing Eksternal** | `pembimbing_eksternal` | Mentor dari pihak perusahaan (industri) yang memberikan verifikasi harian dan penilaian kinerja di industri. |

---

## 🤝 Kontributor

Kontribusi selalu terbuka! Jika Anda ingin meningkatkan aplikasi ini:
1. Fork Repositori.
2. Buat Branch Fitur (`git checkout -b feature/FiturKeren`).
3. Commit Perubahan (`git commit -m 'Menambah Fitur Keren'`).
4. Push ke Branch (`git push origin feature/FiturKeren`).
5. Buka Pull Request.

---

<div align="center">
  <p>Dibuat dengan ❤️ oleh <b>Tim Pengembang SMKN 1 Bojong</b></p>
  <p>
    <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status Active" />
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License MIT" />
  </p>
</div>
