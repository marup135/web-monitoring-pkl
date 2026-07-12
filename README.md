<div align="center">
  <img src="public/nebo.png" alt="NEBO Logo" width="160" style="border-radius: 20px; margin-bottom: 20px;" />
  <h1>🚀 NeboTrack</h1>
  <p align="center">
    <strong>Sistem Monitoring & Logbook Jurnal Harian PKL Digital SMKN 1 Bojong</strong>
    <br />
    <em>Solusi modern untuk transparansi dan efisiensi kegiatan Praktek Kerja Lapangan.</em>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.1.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Prisma-6.2.1-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  </p>

  <p align="center">
    <a href="#-fitur-utama">Fitur</a> •
    <a href="#-teknologi-yang-digunakan">Teknologi</a> •
    <a href="#-cara-instalasi">Instalasi</a> •
    <a href="#-struktur-folder">Struktur</a> •
    <a href="#-kontributor">Kontribusi</a>
  </p>
</div>

---

## 📖 Deskripsi Aplikasi

**NeboTrack** adalah platform monitoring terpadu yang dirancang khusus untuk memfasilitasi program **Praktek Kerja Lapangan (PKL)** bagi siswa SMKN 1 Bojong. Aplikasi ini menjembatani komunikasi, pelaporan, dan evaluasi berkala antara tiga pihak utama:

*   👤 **Siswa**: Mencatat aktivitas harian dan memantau progres.
*   👨‍🏫 **Guru Pembimbing (Internal)**: Memantau dan mengevaluasi perkembangan siswa di lapangan.
*   🏢 **Mentor Perusahaan (Eksternal)**: Memberikan feedback dan verifikasi langsung atas pekerjaan siswa.

Dengan antarmuka yang modern, NeboTrack mendukung **Kanban Board** di Desktop untuk manajemen tugas yang terorganisir dan **Mobile Timeline** di Smartphone untuk kemudahan pengisian jurnal di mana saja.

---

## ✨ Fitur Utama

- 📊 **Dashboard & Statistik**: Pantau progress harian, jam kerja, dan nilai rata-rata siswa secara real-time.
- 📋 **Kanban Board**: Manajemen tugas bergaya Trello yang intuitif (Rencana, Sedang Dikerjakan, Review, Selesai).
- 📱 **Mobile-First Design**: Tampilan logbook bergaya *timeline* dengan interaksi gestur (bottom sheet).
- 📝 **Logbook Harian**: Pencatatan jurnal kegiatan beserta evaluasi dan feedback langsung.
- 🌙 **Dark Mode**: Dukungan tema gelap untuk kenyamanan mata.
- 👥 **Multi-Role Access**: Hak akses aman berbasis role untuk Admin, Guru, Mentor, dan Siswa.

---

## 🛠 Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **UI Library** | [React 19](https://reactjs.org/) & [Lucide Icons](https://lucide.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database ORM** | [Prisma](https://prisma.io/) (Adapter MariaDB) |
| **Database** | [MariaDB](https://mariadb.org/) |
| **Deployment** | [Vercel](https://vercel.com/) & [Railway](https://railway.app/) |

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
- npm / yarn / pnpm

### 2. Clone & Install
```bash
# Clone repositori
git clone https://github.com/username/nebotrack.git

# Masuk ke folder
cd nebotrack

# Instal dependensi
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasinya:
```bash
cp .env.example .env
```
Isi variabel berikut:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
NEXTAUTH_SECRET="buat_secret_key_yang_aman"
```

### 4. Setup Database
```bash
# Generate client prisma
npx prisma generate

# Jalankan migrasi
npx prisma migrate dev --name init

# Isi data awal (optional)
npx prisma db seed
```

---

## 🚀 Menjalankan Project

```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📂 Struktur Folder

```bash
nebotrack/
├── 📁 prisma/          # Schema database & seeder
├── 📁 public/          # Aset statis (Logo, Icon)
├── 📁 src/
│   ├── 📁 app/         # Next.js App Router (Pages & API)
│   ├── 📁 components/  # Komponen UI Reusable
│   ├── 📁 context/     # State Management
│   ├── 📁 lib/         # Utilitas & Konfigurasi Prisma
│   └── 📁 types/        # Definisi TypeScript
├── 📄 .env             # Variabel Lingkungan
├── 📄 package.json     # Dependensi Project
└── 📄 tailwind.config  # Konfigurasi Styling
```

---

## 🎭 Peran Pengguna (Roles)

| Role | Deskripsi |
| :--- | :--- |
| **Admin** | Manajemen data master, user, jurusan, dan perusahaan. |
| **Pembimbing** | Memantau perkembangan dan memberikan nilai internal. |
| **Mentor** | Verifikasi harian dan penilaian kinerja di industri. |
| **Siswa** | Mengisi jurnal dan melaporkan progress tugas. |

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

