import React from 'react';
import Link from 'next/link';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] font-sans text-slate-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-gray-200 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-sm border-b border-slate-200/50 dark:border-gray-800/50 sticky top-0 bg-white/70 dark:bg-gray-900/70">
        <div className="flex items-center gap-3">
          <img src="/nebo.png" alt="NEBOTRACK" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-xl shadow-sm border border-slate-200 dark:border-gray-700" />
          <div className="flex items-center gap-1">
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">NEBO</span>
            <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tight">TRACK</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 font-semibold text-sm text-slate-600 dark:text-gray-300">
          <Link href="/#beranda" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Beranda</Link>
          <Link href="/#fitur-utama" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Fitur Utama</Link>
          <Link href="/#panduan" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Panduan</Link>
          <Link href="/#tentang-kami" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tentang Kami</Link>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onLoginClick}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Masuk
          </button>
          <button 
            onClick={onRegisterClick}
            className="hidden sm:flex px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Daftar Siswa
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main id="beranda" className="relative z-10 min-h-[calc(100vh-85px)] flex flex-col items-center justify-center text-center px-4 py-12 md:py-20">
        
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Platform Monitoring Terpadu
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-6 text-slate-900 dark:text-white animate-in fade-in slide-in-from-bottom-6 duration-700">
            Sistem Manajemen <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              PKL & Magang
            </span> Cerdas
          </h1>
          
          <p className="text-base md:text-xl font-medium mb-10 max-w-2xl text-slate-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Pantau kehadiran, jurnal harian, dan pencapaian kompetensi siswa secara real-time. Mempermudah kolaborasi antara sekolah, siswa, dan perusahaan (DUDI).
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
            <button 
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Mulai Sekarang
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <Link 
              href="/register-admin"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              Daftar Sebagai Admin
            </Link>
          </div>
        </div>

        {/* Features/Stats snippet at bottom */}
        <div id="fitur-utama" className="mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto w-full px-4 animate-in fade-in duration-1000 delay-300">
          {[
            { label: 'Jurnal Harian', desc: 'Logbook digital otomatis' },
            { label: 'Absensi', desc: 'Pencatatan kehadiran akurat' },
            { label: 'Progress Board', desc: 'Manajemen tugas proyek' },
            { label: 'Laporan', desc: 'Monitoring & rekapitulasi' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-5 rounded-2xl border border-white/80 dark:border-gray-700/50 shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
              <h3 className="font-bold text-slate-800 dark:text-white">{item.label}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 text-center">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Panduan Section */}
        <div id="panduan" className="mt-24 max-w-5xl mx-auto px-4 w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-8">Panduan Penggunaan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold mb-4">1</div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Daftar Akun</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Pilih peran Anda sebagai siswa, pembimbing, atau admin institusi dan lengkapi profil.</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold mb-4">2</div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Isi Jurnal & Absensi</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Catat kegiatan harian dan absen tepat waktu. Pembimbing akan memverifikasi catatan Anda.</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold mb-4">3</div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Pantau Progress</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Gunakan Progress Board untuk mengelola tugas dan melihat grafik pencapaian Anda.</p>
            </div>
          </div>
        </div>

        {/* Tentang Kami Section */}
        <div id="tentang-kami" className="mt-24 mb-20 max-w-4xl mx-auto px-4 w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6">Tentang Kami</h2>
          <p className="text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            NeboTrack adalah inisiatif digital untuk memodernisasi pelaksanaan Praktik Kerja Lapangan (PKL) dan Magang. Kami menjembatani komunikasi antara sekolah, siswa, dan dunia industri (DUDI) dalam satu platform yang terintegrasi, transparan, dan mudah digunakan.
          </p>
        </div>
      </main>
    </div>
  );
};
