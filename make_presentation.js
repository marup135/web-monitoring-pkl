const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing pptxgenjs...');
execSync('npm install pptxgenjs --no-save', { cwd: __dirname, stdio: 'inherit' });

const pptxgen = require('pptxgenjs');
let pptx = new pptxgen();

pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Tim NeboTrack';
pptx.title = 'Presentasi NeboTrack - Web Monitoring PKL';

// Theme colors
const NAVY = '0F172A';
const BLUE = '2563EB';
const LIGHT_BG = 'F8FAFC';
const WHITE = 'FFFFFF';
const DARK_TEXT = '1E293B';
const GRAY_TEXT = '64748B';
const ACCENT = '38BDF8';

// Slide 1: Title
let slide1 = pptx.addSlide();
slide1.background = { color: NAVY };

slide1.addText('🚀 NeboTrack', {
  x: 0.8, y: 1.8, w: '85%', h: 1.0,
  fontSize: 44, bold: true, color: ACCENT, fontFace: 'Arial'
});
slide1.addText('Sistem Monitoring & Logbook Jurnal Harian PKL Digital', {
  x: 0.8, y: 2.8, w: '85%', h: 0.8,
  fontSize: 24, bold: true, color: WHITE, fontFace: 'Arial'
});
slide1.addText('SMKN 1 Bojong • Solusi Modern Transparansi & Efisiensi PKL', {
  x: 0.8, y: 3.8, w: '85%', h: 0.5,
  fontSize: 16, color: GRAY_TEXT, fontFace: 'Arial'
});

// Helper for content slides
function createSlide(title, category = 'NEBOTRACK PRESENTATION') {
  let slide = pptx.addSlide();
  slide.background = { color: LIGHT_BG };
  
  // Header bar
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: NAVY } });
  slide.addText(category, { x: 0.8, y: 0.15, w: '50%', h: 0.3, fontSize: 11, color: ACCENT, bold: true, fontFace: 'Arial' });
  slide.addText(title, { x: 0.8, y: 0.4, w: '80%', h: 0.4, fontSize: 20, color: WHITE, bold: true, fontFace: 'Arial' });
  
  // Footer bar
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 7.0, w: '100%', h: 0.5, fill: { color: NAVY } });
  slide.addText('SMKN 1 Bojong - Web Monitoring PKL', { x: 0.8, y: 7.1, w: '50%', h: 0.3, fontSize: 11, color: GRAY_TEXT, fontFace: 'Arial' });
  
  return slide;
}

// Slide 2: Latar Belakang & Masalah
let slide2 = createSlide('Latar Belakang & Perubahan Sistem', 'PROBLEM & SOLUTION');
slide2.addText('Tantangan Sistem Konvensional vs Solusi NeboTrack', { x: 0.8, y: 1.2, w: 10, h: 0.4, fontSize: 16, bold: true, color: DARK_TEXT, fontFace: 'Arial' });

// Box 1: Masalah
slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: 'FEE2E2' }, line: { color: 'EF4444', width: 1.5 } });
slide2.addText('❌ Permasalahan Sistem Lama (Kertas)', { x: 1.0, y: 2.0, w: 5.2, h: 0.4, fontSize: 16, bold: true, color: '991B1B', fontFace: 'Arial' });
slide2.addText([
  { text: '• Jurnal Fisik Rentan Hilang / Rusak:\n  Buku jurnal berbasis kertas mudah terselisip.', options: { fontSize: 13, color: '7F1D1D' } },
  { text: '\n• Monitoring Tidak Real-Time:\n  Guru baru bisa melihat perkembangan saat kunjungan.', options: { fontSize: 13, color: '7F1D1D' } },
  { text: '\n• Sulit Koordinasi 3 Pihak:\n  Sekolah & Pembimbing Industri jarang terhubung langsung.', options: { fontSize: 13, color: '7F1D1D' } },
  { text: '\n• Risiko Manipulasi Absen:\n  Rekap kehadiran manual rawan kecurangan.', options: { fontSize: 13, color: '7F1D1D' } }
], { x: 1.0, y: 2.6, w: 5.2, h: 3.8, fontFace: 'Arial' });

// Box 2: Solusi NeboTrack
slide2.addShape(pptx.shapes.RECTANGLE, { x: 6.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: 'DCFCE7' }, line: { color: '22C55E', width: 1.5 } });
slide2.addText('✅ Solusi Digital NeboTrack', { x: 7.0, y: 2.0, w: 5.2, h: 0.4, fontSize: 16, bold: true, color: '166534', fontFace: 'Arial' });
slide2.addText([
  { text: '• Logbook Digital Terpusat:\n  Semua aktivitas tersimpan aman secara cloud.', options: { fontSize: 13, color: '14532D' } },
  { text: '\n• Pemantauan Real-Time:\n  Guru & mentor bisa memantau progres kapan saja.', options: { fontSize: 13, color: '14532D' } },
  { text: '\n• Integrasi 3 Pihak Terpadu:\n  Siswa, Sekolah, dan Industri dalam 1 platform.', options: { fontSize: 13, color: '14532D' } },
  { text: '\n• Absensi Berbasis Foto & Lokasi:\n  Meminimalisir kecurangan kehadiran.', options: { fontSize: 13, color: '14532D' } }
], { x: 7.0, y: 2.6, w: 5.2, h: 3.8, fontFace: 'Arial' });

// Slide 3: Fitur Utama
let slide3 = createSlide('Fitur-Fitur Unggulan NeboTrack', 'KEY FEATURES');

const features = [
  { title: '📋 Kanban Board Logbook', desc: 'Manajemen tugas ala Trello (Rencana, Dikerjakan, Review, Selesai) untuk kerapihan jurnal.' },
  { title: '📸 Absensi & Deteksi Wajah', desc: 'Check-in/Check-out harian dilengkapi validasi foto lokasi dan integrasi Face Recognition.' },
  { title: '📱 Mobile First & PWA', desc: 'Dapat diinstal di HP tanpa PlayStore, mendukung penggunaan offline & gestur mobile.' },
  { title: '👥 Multi-Role Access', desc: 'Hak akses terpisah & aman untuk Admin, Siswa, Guru Pembimbing, dan Mentor Perusahaan.' },
  { title: '📊 Dashboard & Statistik', desc: 'Grafik kehadiran, rekap jam kerja, dan penilaian harian yang ter-update secara otomatis.' },
  { title: '🌙 Dark Mode & UI Modern', desc: 'Antarmuka menarik, nyaman di mata, dan responsif di semua perangkat.' }
];

features.forEach((feat, idx) => {
  let row = Math.floor(idx / 3);
  let col = idx % 3;
  let x = 0.8 + col * 3.9;
  let y = 1.6 + row * 2.6;

  slide3.addShape(pptx.shapes.RECTANGLE, { x, y, w: 3.6, h: 2.3, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide3.addText(feat.title, { x: x + 0.2, y: y + 0.2, w: 3.2, h: 0.5, fontSize: 14, bold: true, color: BLUE, fontFace: 'Arial' });
  slide3.addText(feat.desc, { x: x + 0.2, y: y + 0.7, w: 3.2, h: 1.4, fontSize: 12, color: GRAY_TEXT, fontFace: 'Arial' });
});

// Slide 4: Teknologi / Tech Stack
let slide4 = createSlide('Teknologi & Arsitektur Sistem', 'TECHNICAL STACK');

const techStack = [
  { cat: 'FULLSTACK FRAMEWORK', title: 'Next.js 16 (App Router)', desc: 'Performa tinggi, SEO-friendly, dan arsitektur Server Actions modern.' },
  { cat: 'FRONTEND LIBRARY', title: 'React 19 & TypeScript', desc: 'Komponen interaktif dengan tipe data yang ketat dan bebas bug.' },
  { cat: 'STYLING & DESIGN', title: 'Tailwind CSS v4', desc: 'Desain responsif, fleksibel, serta mendukung tema Dark Mode.' },
  { cat: 'DATABASE & ORM', title: 'PostgreSQL & Prisma 6.16', desc: 'Penyimpanan data relasional yang stabil dengan ORM tipe aman.' },
  { cat: 'ARTIFICIAL INTELLIGENCE', title: '@vladmandic/face-api', desc: 'Library pengenalan wajah untuk kebutuhan verifikasi absensi.' },
  { cat: 'PROGRESSIVE WEB APP', title: 'Serwist (PWA)', desc: 'Memungkinkan aplikasi berjalan seperti APK native di smartphone.' }
];

techStack.forEach((tech, idx) => {
  let row = Math.floor(idx / 2);
  let col = idx % 2;
  let x = 0.8 + col * 5.9;
  let y = 1.6 + row * 1.7;

  slide4.addShape(pptx.shapes.RECTANGLE, { x, y, w: 5.6, h: 1.5, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 } });
  slide4.addText(tech.cat, { x: x + 0.2, y: y + 0.15, w: 5.2, h: 0.25, fontSize: 10, bold: true, color: BLUE, fontFace: 'Arial' });
  slide4.addText(tech.title, { x: x + 0.2, y: y + 0.4, w: 5.2, h: 0.35, fontSize: 14, bold: true, color: DARK_TEXT, fontFace: 'Arial' });
  slide4.addText(tech.desc, { x: x + 0.2, y: y + 0.8, w: 5.2, h: 0.6, fontSize: 12, color: GRAY_TEXT, fontFace: 'Arial' });
});

// Slide 5: Multi-Role Workflow
let slide5 = createSlide('Alur Kerja Pengguna (Multi-Role)', 'SYSTEM WORKFLOW');

const roles = [
  { role: '👤 SISWA', step: '1. Check-in Absen\n2. Isi Logbook (Kanban)\n3. Ajukan Review Task' },
  { role: '🏢 MENTOR (INDUSTRI)', step: '1. Cek Kehadiran Siswa\n2. Verifikasi Tugas (Review)\n3. Beri Feedback & Nilai' },
  { role: '👨‍🏫 GURU (SEKOLAH)', step: '1. Pantau Dashboard Progres\n2. Beri Catatan Pembimbing\n3. Rekap Evaluasi Akhir' },
  { role: '⚡ ADMIN', step: '1. Kelola Data User & Master\n2. Setering Jurusan & Industri\n3. Maintenance System' }
];

roles.forEach((r, idx) => {
  let x = 0.8 + idx * 2.9;
  let y = 1.8;

  slide5.addShape(pptx.shapes.RECTANGLE, { x, y, w: 2.7, h: 4.8, fill: { color: WHITE }, line: { color: BLUE, width: 1.5 } });
  slide5.addText(r.role, { x: x + 0.1, y: y + 0.3, w: 2.5, h: 0.5, fontSize: 13, bold: true, color: NAVY, fontFace: 'Arial', align: 'center' });
  slide5.addShape(pptx.shapes.LINE, { x: x + 0.3, y: y + 0.9, w: 2.1, h: 0, line: { color: 'E2E8F0', width: 1 } });
  slide5.addText(r.step, { x: x + 0.2, y: y + 1.2, w: 2.3, h: 3.2, fontSize: 12, color: DARK_TEXT, fontFace: 'Arial' });
});

// Slide 6: Kesimpulan & Penutup
let slide6 = pptx.addSlide();
slide6.background = { color: NAVY };

slide6.addText('TERIMA KASIH', {
  x: 0.8, y: 2.2, w: '85%', h: 1.0,
  fontSize: 44, bold: true, color: ACCENT, fontFace: 'Arial', align: 'center'
});
slide6.addText('NeboTrack - Wujudkan PKL Digital yang Transparan & Akuntabel', {
  x: 0.8, y: 3.3, w: '85%', h: 0.6,
  fontSize: 20, color: WHITE, fontFace: 'Arial', align: 'center'
});
slide6.addText('Ada Pertanyaan? (Sesi Tanya Jawab)', {
  x: 0.8, y: 4.2, w: '85%', h: 0.5,
  fontSize: 16, color: GRAY_TEXT, fontFace: 'Arial', align: 'center'
});

const outputPath = path.join(__dirname, 'Presentasi_NeboTrack.pptx');
pptx.writeFile({ fileName: outputPath }).then(fileName => {
  console.log(`PPTX successfully generated at: ${fileName}`);
}).catch(err => {
  console.error('Error generating PPTX:', err);
});
