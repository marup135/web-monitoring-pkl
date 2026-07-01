const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');

function generateGuidebook() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Helper functions
  const addHeaderFooter = (pageNo, totalPages) => {
    if (pageNo === 1) return; // Skip cover page
    
    // Top Header line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NeboTrack - Buku Panduan Penggunaan Sistem Monitoring PKL", margin, 9);

    // Bottom Footer line
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(`Halaman ${pageNo} dari ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    doc.text("© 2026 NeboTrack System. Hak Cipta Dilindungi.", margin, pageHeight - 7);
  };

  // --- 1. COVER PAGE ---
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(0, 0, pageWidth, 85, 'F');

  // Accent Bar
  doc.setFillColor(37, 99, 235); // Royal Blue
  doc.rect(0, 85, pageWidth, 5, 'F');

  // Title on Dark Background
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("BUKU PANDUAN PENGGUNA", margin, 40);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 234, 254);
  doc.text("SYSTEM USER GUIDEBOOK", margin, 48);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NeboTrack Web Monitoring & Presensi PKL", margin, 68);

  // Body Cover Info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  
  let currY = 110;

  const coverBox = (y, title, desc, iconText) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`${iconText} ${title}`, margin + 5, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(desc, margin + 5, y + 19);
  };

  coverBox(currY, "Panduan Terpadu 4 Peran Pengguna", "Petunjuk penggunaan untuk Mahasiswa/Siswa, Mentor Industri, Guru Pembimbing, & Admin.", "[ROLES]");
  currY += 32;
  coverBox(currY, "Fitur Jurnal & Kanban Board Digital", "Pencatatan kegiatan PKL realtime, manajemen sub-tugas, lampiran file, & kolaborasi.", "[BOARD]");
  currY += 32;
  coverBox(currY, "Presensi Cerdas Wajah & Geofencing GPS", "Verifikasi kehadiran presisi berbasis lokasi lokasi instansi/perusahaan & deteksi wajah AI.", "[ATTENDANCE]");
  currY += 32;
  coverBox(currY, "Sistem Penilaian 3 Kriteria & Cetak Laporan", "Evaluasi transparan 3 kriteria dari pembimbing serta cetak dokumen laporan resmi berformat A4.", "[REPORT]");

  // Metadata Footer on Cover
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, 245, contentWidth, 30, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("INFORMASI DOKUMEN & SISTEM", margin + 6, 254);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Versi Aplikasi: 1.0 (Release 2026) | Domain: https://www.nebotrack.my.id", margin + 6, 261);
  doc.text("Target Pengguna: Mahasiswa PKL, Mentor Perusahaan, Guru/Dosen Pembimbing, Admin Institusi", margin + 6, 267);

  // --- 2. TABLE OF CONTENTS & CHAPTER 1 ---
  doc.addPage();
  currY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text("DAFTAR ISI & PENGENALAN SISTEM", margin, currY);
  
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 40, currY + 3);
  currY += 14;

  // TOC Table
  autoTable(doc, {
    startY: currY,
    head: [['Bab', 'Topik Panduan', 'Halaman']],
    body: [
      ['Bab 1', 'Pengenalan & Manfaat Utama NeboTrack', 'Halaman 2'],
      ['Bab 2', 'Hak Akses & Struktur Peran Pengguna (User Roles)', 'Halaman 2'],
      ['Bab 3', 'Panduan Penggunaan Mahasiswa / Siswa PKL', 'Halaman 3'],
      ['Bab 4', 'Panduan Penggunaan Mentor Perusahaan / Industri', 'Halaman 4'],
      ['Bab 5', 'Panduan Penggunaan Guru / Dosen Pembimbing Sekolah', 'Halaman 4'],
      ['Bab 6', 'Panduan Fitur Presensi Wajah & GPS Geofence', 'Halaman 5'],
      ['Bab 7', 'Panduan Cetak Laporan Jurnal & Lembar Pengesahan', 'Halaman 5'],
      ['Bab 8', 'Pertanyaan Umum (FAQ) & Problem Solving', 'Halaman 6'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 125 },
      2: { cellWidth: 35, alignment: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  currY = doc.lastAutoTable.finalY + 12;

  // Chapter 1 Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 1: PENGENALAN SISTEM NEBOTRACK", margin, currY);
  currY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const introText = "NeboTrack adalah platform web modern terpadu yang dirancang khusus untuk mempermudah monitoring, pencatatan jurnal kegiatan harian, dan verifikasi presensi Praktik Kerja Lapangan (PKL) / Magang. NeboTrack menghubungkan 4 pihak secara realtime: Mahasiswa/Siswa PKL, Mentor Perusahaan/Industri, Guru/Dosen Pembimbing Akademis, serta Admin Institusi.";
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, currY);
  currY += splitIntro.length * 4.5 + 4;

  // Benefits list box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currY, contentWidth, 38, 2, 2, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("Manfaat Utama Platform NeboTrack:", margin + 5, currY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("• Transparency & Realtime: Pembimbing dapat memantau jurnal & presensi siswa kapan saja secara langsung.", margin + 5, currY + 14);
  doc.text("• Smart Attendance AI: Absensi presisi berbasis GPS Geofencing (Radius) & Pengenalan Wajah (Face API).", margin + 5, currY + 20);
  doc.text("• Objective 3-Criteria Evaluation: Penilaian objektif 3 kriteria dari mentor industri & pembimbing sekolah.", margin + 5, currY + 26);
  doc.text("• Official PDF Export: Cetak otomatis laporan jurnal standar A4 lengkap dengan cover & 3 tanda tangan.", margin + 5, currY + 32);

  currY += 45;

  // Chapter 2 Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 2: STRUCTURE HAK AKSES PERAN (USER ROLES)", margin, currY);
  currY += 6;

  autoTable(doc, {
    startY: currY,
    head: [['Peran (Role)', 'Tanggung Jawab & Hak Akses Utama']],
    body: [
      ['Mahasiswa / Siswa PKL', 'Membuat kegiatan harian (Kanban), mengisi sub-tugas/checklist, upload file lampiran, mengajak kolaborator, melakukan presensi wajah & lokasi, serta mencetak jurnal PDF.'],
      ['Mentor Perusahaan / Industri', 'Memantau pekerjaan siswa bimbingan di perusahaan, mengevaluasi/menilai 3 kriteria (Kedisiplinan, Skill Pekerjaan, Sikap/Etika), meminta revisi kegiatan, & cek kehadiran.'],
      ['Guru / Dosen Pembimbing', 'Memantau jurnal siswa di sekolah/kampus, mengevaluasi 3 kriteria akademis (Kedisiplinan Jurnal, Kesesuaian Laporan, Komunikasi), memberikan Catatan Bimbingan, & cek rekap.'],
      ['Admin Institusi / Super Admin', 'Mengelola master data pengguna, data kelas, perusahaan mitra PKL, verifikasi persetujuan pendaftaran akun baru, serta pengiriman pengumuman global.']
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 130 }
    },
    margin: { left: margin, right: margin }
  });

  // --- 3. BAB 3: PANDUAN MAHASISWA ---
  doc.addPage();
  currY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 3: PANDUAN PENGGUNAAN MAHASISWA / SISWA PKL", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  const sectionBlock = (title, steps) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(title, margin, currY);
    currY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    steps.forEach((step) => {
      const splitStep = doc.splitTextToSize(`• ${step}`, contentWidth - 4);
      doc.text(splitStep, margin + 2, currY);
      currY += splitStep.length * 4.2 + 1.5;
    });
    currY += 3;
  };

  sectionBlock("3.1 Memahami Dashboard Statistik Personal", [
    "Target Jam Kerja PKL Standard: Sistem secara otomatis menghitung akumulasi durasi jam kerja dari seluruh kegiatan yang Anda selesaikan menuju target 200 jam.",
    "Distribusi Kategori Pekerjaan: Menampilkan statistik jam kerja & jumlah tugas pada kategori Coding, Design, Laporan, Networking, atau Lainnya (desimal jam telah dibulatkan secara presisi).",
    "Tren Aktivitas 7 Hari Terakhir: Grafik tren jam kerja harian yang mencatat keaktifan Anda dalam kurun waktu seminggu terakhir."
  ]);

  sectionBlock("3.2 Mengelola Kegiatan (Kanban Board)", [
    "Menambah Kegiatan Baru: Klik tombol '+ Tambah Kegiatan', isi Judul Kegiatan, Deskripsi Rincian, Tanggal Selesai (Tenggat), Waktu Mulai & Selesai (Jam), Kategori, serta Tingkat Prioritas (Rendah, Sedang, Tinggi, Mendesak).",
    "Pencatatan Otomatis Waktu Buat: Tanggal Pembuatan Kegiatan otomatis dicatat oleh sistem dari waktu saat Anda membuat kartu tersebut.",
    "Kolaborasi Tugas Kelompok: Anda dapat menambahkan teman sesama mahasiswa PKL sebagai Kolaborator untuk mengerjakan tugas bersama secara transparan.",
    "Sub-tugas & Checklist: Tambahkan daftar poin-poin pekerjaan di dalam detail kartu untuk memantau persentase progres penyelesaian (0% - 100%).",
    "Upload Lampiran/File Bukti: Lampirkan berkas bukti pekerjaan seperti screenshot, dokumen PDF, atau foto kegiatan langsung pada modal detail kartu."
  ]);

  sectionBlock("3.3 Alur Pergerakan Status Kegiatan (Workflow Status)", [
    "Rencana Kegiatan: Kartu awal saat baru direncanakan.",
    "Sedang Dikerjakan (Progres): Pindahkan kartu ke kolom ini saat Anda mulai mengeksekusi pekerjaan.",
    "Butuh Review: Pindahkan kartu ke kolom ini jika pekerjaan sudah selesai dan siap diverifikasi oleh Mentor Perusahaan atau Pembimbing Sekolah.",
    "Selesai (Disetujui): Status ini HANYA dapat diberikan oleh Mentor/Pembimbing setelah mereka menyetujui dan memberikan nilai evaluasi pada kegiatan Anda."
  ]);

  // --- 4. BAB 4 & 5: PANDUAN MENTOR & PEMBIMBING ---
  doc.addPage();
  currY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 4: PANDUAN MENTOR PERUSAHAAN / INDUSTRI", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  sectionBlock("4.1 Review & Penilaian Kegiatan Siswa Bimbingan", [
    "Membuka Kartu Review: Pada Kanban Board atau Logbook Table, pilih kartu kegiatan yang berada pada status 'Butuh Review'.",
    "Memberikan Nilai Evaluasi (3 Kriteria Mentor): Masukkan nilai angka (0 - 100) untuk 3 aspek: (1) Kedisiplinan & Kehadiran, (2) Keahlian / Skill Pekerjaan, serta (3) Sikap & Etika (Attitude). Tambahkan catatan feedback/saran.",
    "Persetujuan Otomatis ke Status Selesai: Setelah nilai disimpan, kartu kegiatan otomatis berpindah ke status 'Selesai (Disetujui)' dan rata-rata nilai terhitung transparan.",
    "Opsi Minta Revisi: Jika pekerjaan siswa belum memenuhi standar perusahaan, klik tombol 'Minta Revisi', tuliskan catatan perbaikan, dan kartu akan dikembalikan ke kolom 'Sedang Dikerjakan' milik siswa."
  ]);

  sectionBlock("4.2 Monitoring Kehadiran & Lokasi Siswa", [
    "Memantau Jam Absen: Mentor dapat melihat riwayat jam masuk, jam pulang, serta verifikasi foto wajah dan koordinat lokasi GPS siswa saat melakukan presensi harian."
  ]);

  currY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 5: PANDUAN GURU / DOSEN PEMBIMBING SEKOLAH", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  sectionBlock("5.1 Penilaian Akademis & Catatan Pembimbing", [
    "Penilaian Evaluasi Akademis (3 Kriteria Pembimbing): Berikan skor (0 - 100) untuk: (1) Kedisiplinan Jurnal, (2) Kesesuaian Laporan, serta (3) Komunikasi & Keaktifan.",
    "Fitur Advisor Notes (Catatan Pembimbing): Tuliskan bimbingan/pengarahan tertulis yang dapat dibaca langsung oleh siswa bimbingan pada dashboard mereka."
  ]);

  sectionBlock("5.2 Monitoring Rekapitulasi Jurnal Bimbingan", [
    "Memantau Pencapaian Jam Kerja: Memastikan siswa memenuhi akumulasi jam kerja target PKL sesuai ketentuan standar kurikulum sekolah/kampus."
  ]);

  // --- 5. BAB 6 & 7: PRESENSI WAJAH GPS & CETAK LAPORAN ---
  doc.addPage();
  currY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 6: PANDUAN PRESENSI WAJAH & GPS GEOFENCING", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  sectionBlock("6.1 Registrasi Wajah (Face Registration)", [
    "Langkah Pertama: Buka menu Presensi / Pengaturan, lalu klik 'Daftarkan Wajah'. Posisikan wajah tepat di depan kamera perangkat.",
    "Proses Ekstraksi AI: Sistem AI (Face-API) akan mencatat deskriptor vektor wajah unik Anda secara aman di dalam sistem."
  ]);

  sectionBlock("6.2 Absen Masuk & Absen Pulang Harian", [
    "Validasi Lokasi (Geofencing GPS): Tombol absen hanya akan aktif jika lokasi posisi koordinat GPS perangkat Anda terdeteksi berada di dalam radius resmi lokasi institusi/perusahaan.",
    "Verifikasi Match Wajah: Saat tombol presensi ditekan, kamera akan memverifikasi kesesuaian wajah Anda dengan data pendaftaran. Jika valid, waktu absen resmi dicatat."
  ]);

  currY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 7: CETAK LAPORAN JURNAL & LEMBAR PENGESAHAN", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  sectionBlock("7.1 Langkah Pencetakan Jurnal Resmi", [
    "Masuk ke Menu Logbook Jurnal: Pilih tab Logbook pada bilah navigasi utama.",
    "Atur Filter Sesuai Kebutuhan: Anda dapat menyaring jurnal berdasarkan Kategori, Status (Selesai/Review), atau Rentang Tanggal.",
    "Klik Tombol 'Cetak PDF' / 'Print': Sistem akan memicu dialog cetak resmi browser.",
    "Elemen Cetak Standar Resmi A4: Dokumen tercetak otomatis mencakup: (1) Cover Laporan Pengesahan Resmi, (2) Tabel Rekap Entri Kegiatan, serta (3) Kolom Tanda Tangan 3 Pihak (Pembimbing Eksternal Perusahaan, Pembimbing Internal Sekolah, & Mahasiswa)."
  ]);

  // --- 6. BAB 8: FAQ & PROBLEM SOLVING ---
  doc.addPage();
  currY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("BAB 8: PERTANYAAN UMUM (FAQ) & PROBLEM SOLVING", margin, currY);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, currY + 3, margin + 60, currY + 3);
  currY += 12;

  autoTable(doc, {
    startY: currY,
    head: [['Pertanyaan / Masalah', 'Solusi & Penjelasan']],
    body: [
      [
        'Mengapa lokasi GPS saya terdeteksi di luar radius?',
        'Pastikan izin akses lokasi (GPS/Location) pada browser dan perangkat sudah diizinkan (Allow), serta Anda memang berada di lokasi perusahaan/sekolah mitra PKL.'
      ],
      [
        'Mengapa siswa tidak dapat memindahkan kartu ke "Selesai"?',
        'Status "Selesai (Disetujui)" merupakan hak akses khusus Pembimbing/Mentor setelah memverifikasi dan memberikan penilaian evaluasi pada pekerjaan siswa.'
      ],
      [
        'Bagaimana jika lupa kata sandi (password) akun?',
        'Gunakan fitur Reset Password pada halaman login. Tautan pembaruan kata sandi akan dikirimkan otomatis ke alamat email terdaftar Anda.'
      ],
      [
        'Apakah laporan jurnal dapat di-export ke Microsoft Excel?',
        'Ya, selain tombol Cetak PDF, terdapat tombol "Export CSV" pada menu Logbook yang dapat diunduh dan dibuka langsung menggunakan Microsoft Excel.'
      ],
      [
        'Bagaimana cara mendaftarkan institusi/sekolah baru?',
        'Calon Admin Institusi dapat mendaftar melalui halaman "/register-admin". Akun akan diverifikasi oleh Super Admin sebelum aktif.'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 115 }
    },
    margin: { left: margin, right: margin }
  });

  // Apply Header & Footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Save PDF to workspace root directory
  const outputPath = path.join(__dirname, '..', 'Buku_Panduan_NeboTrack.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Guidebook PDF successfully created at: ${outputPath}`);
}

generateGuidebook();
