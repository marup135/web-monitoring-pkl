<div align="center">
  <img src="public/logo.jpg" alt="NeboTrack Logo" width="120" />
  <h1>NeboTrack</h1>
  <p><strong>Aplikasi Monitoring & Logbook Jurnal Harian PKL SMKN 1 Bojong</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)](https://prisma.io/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
</div>

<hr />

## 📖 Deskripsi Aplikasi

**NeboTrack** adalah platform monitoring terpadu yang dirancang khusus untuk memfasilitasi program Praktek Kerja Lapangan (PKL) bagi siswa SMKN 1 Bojong. Aplikasi ini menjembatani komunikasi, pelaporan, dan evaluasi berkala antara tiga pihak utama: **Siswa**, **Guru Pembimbing (Internal)**, dan **Mentor Perusahaan (Eksternal)**.

Dengan antarmuka yang modern—mendukung *Kanban Board* di Desktop dan *Mobile Timeline* di *Smartphone*—NeboTrack membuat proses dokumentasi kegiatan PKL menjadi transparan, efisien, dan mudah dipantau secara *real-time*.

---

## ✨ Fitur Utama

- 📊 **Dashboard & Statistik**: Pantau progress harian, jam kerja, dan nilai rata-rata siswa secara langsung.
- 📋 **Kanban Board**: Manajemen tugas bergaya Trello yang intuitif (Rencana Kegiatan, Menunggu Review, Sedang Dikerjakan, Selesai).
- 📱 **Mobile-First Design**: Tampilan logbook bergaya *timeline* dan interaksi gestur (bottom sheet) khusus perangkat *mobile*.
- 📝 **Logbook Harian**: Fitur pencatatan jurnal kegiatan beserta evaluasi dan *feedback* langsung dari Mentor dan Guru.
- 🌙 **Dark Mode & Multilingual**: Dukungan mode gelap (*Dark Mode*) dan pergantian bahasa (Indonesia/English).
- 👥 **Multi-Role Access**: Hak akses yang dibedakan secara aman untuk Admin, Guru Pembimbing, Mentor, dan Siswa.

---

## 🛠 Teknologi yang Digunakan

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Library UI**: [React 19](https://reactjs.org/) & [Lucide Icons](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **ORM & Database**: [Prisma](https://prisma.io/) (Adapter MariaDB) & MariaDB
- **Deployment**: [Vercel](https://vercel.com/) (Frontend/Backend) & [Railway](https://railway.app/) (Database)

---

## 📸 Screenshot

| Desktop (Kanban Board) | Mobile (Timeline Logbook) |
| :---: | :---: |
| ![Desktop Board Placeholder] (src/hasil-desktop.png) | ![Mobile Logbook Placeholder](https://placehold.co/300x500/2563EB/FFF?text=Mobile+Timeline) |

> *(Ganti URL gambar di atas dengan screenshot asli saat project siap dipublikasikan).*

---

## ⚙️ Cara Instalasi

Pastikan Anda telah menginstal **Node.js** (v18+) dan **Git** di komputer Anda.

1. Clone repositori ini:
   ```bash
   git clone https://github.com/username/nebotrack.git
   cd nebotrack
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
   *(Sesuaikan nilai di dalam `.env` dengan kredensial database Anda).*

---

## 🚀 Cara Menjalankan Project

Jalankan *development server* menggunakan perintah berikut:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

---

## 🔐 Environment Variables

Aplikasi membutuhkan konfigurasi environment berikut. Buat file `.env` di *root directory*:

```env
# Koneksi Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# Secret Key (Contoh untuk JWT/Session)
NEXTAUTH_SECRET="your_secret_key_here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🗄 Prisma Migration

Untuk melakukan sinkronisasi skema database:

1. Buat migrasi baru setelah mengubah skema:
   ```bash
   npx prisma migrate dev --name init
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

---

## 🌱 Seeder (Data Awal)

Untuk mengisi database dengan data awal (Siswa, Mentor, Admin), jalankan seeder:

```bash
npx prisma db seed
```
*(Pastikan file `prisma/seed.ts` sudah dikonfigurasi di `package.json`).*

---

## 📂 Struktur Folder

```text
nebotrack/
├── prisma/             # Schema database dan file seeder
├── public/             # Aset statis (Logo, Font, Gambar)
├── src/
│   ├── app/            # Next.js App Router (Halaman & API Routes)
│   ├── components/     # Komponen React Reusable (KanbanBoard, Settings, dll)
│   ├── context/        # React Context (State Management Global)
│   ├── lib/            # Utility & Prisma Client Config
│   └── types/          # Definisi Tipe TypeScript
├── .env                # Variabel Lingkungan Lokal
├── package.json        # Konfigurasi Dependensi
└── tailwind.config.js  # Konfigurasi Styling
```

---

## 🎭 Role User

Terdapat 4 *role* utama di dalam NeboTrack:

1. **Admin (`admin`)**: Mengelola data *master* seluruh pengguna, jurusan, dan perusahaan.
2. **Guru Pembimbing (`pembimbing`)**: Memantau progress beberapa siswa sekaligus, memberikan evaluasi internal.
3. **Mentor (`mentor`)**: Pihak perusahaan tempat PKL, berhak menyetujui logbook harian dan memberikan nilai performa pekerjaan.
4. **Siswa (`siswa`)**: Mengisi jurnal kegiatan harian, memperbarui status pekerjaan, dan melihat evaluasi.

---

## 🔑 Cara Login

Silakan login menggunakan *username* atau *NIS/NIP* yang telah terdaftar melalui halaman utama aplikasi:

- **Siswa**: Gunakan **NISN** dan *password* default (atau yang diberikan Admin).
- **Guru/Mentor/Admin**: Gunakan **Username** dan *password* masing-masing.

---

## ☁️ Database Railway

Database utama direkomendasikan untuk di-hosting di [Railway](https://railway.app/).
1. Buat proyek baru di Railway dan tambahkan layanan **MySQL/MariaDB**.
2. Salin *Connection URL* yang diberikan oleh Railway.
3. Masukkan ke dalam `DATABASE_URL` di Vercel atau di lokal `.env`.

---

## 🚀 Deploy ke Vercel

Aplikasi ini dioptimalkan untuk di-deploy di Vercel:

1. Push kode ke repositori GitHub.
2. Impor project di Vercel Dashboard.
3. Tambahkan environment variables (`DATABASE_URL`, dll).
4. Di bagian Build Command, pastikan sudah terdapat `prisma generate`:
   ```bash
   npm run postinstall && npm run build
   ```
5. Klik **Deploy**!

---

## 🤝 Kontributor

Kami menyambut kontribusi dari siapa saja! Jika Anda ingin berkontribusi:
1. *Fork* repository ini.
2. Buat *branch* fitur Anda (`git checkout -b feature/AmazingFeature`).
3. *Commit* perubahan Anda (`git commit -m 'Add some AmazingFeature'`).
4. *Push* ke branch (`git push origin feature/AmazingFeature`).
5. Buka sebuah *Pull Request*.

---

## 📄 Lisensi

Didistribusikan di bawah **MIT License**. Lihat file `LICENSE` untuk informasi lebih lanjut.

---
<div align="center">
  Dibuat dengan ❤️ untuk kemajuan pendidikan Vokasi Indonesia.
</div>
