import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] font-sans text-slate-800 dark:from-slate-800 dark:via-blue-900/50 dark:to-slate-800 dark:text-gray-200 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
      <div className="hidden dark:block absolute top-1/2 left-1/2 w-[600px] h-[400px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-600/50 sticky top-0 bg-white/70 dark:bg-slate-800/80">
        <div className="flex items-center gap-3">
          <img src="/nebo.png" alt="NEBOTRACK" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-xl shadow-sm border border-slate-200 dark:border-gray-700" />
          <div className="flex items-center gap-1">
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">NEBO</span>
            <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tight">TRACK</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 font-semibold text-sm text-slate-600 dark:text-gray-300">
          <button onClick={() => document.getElementById('beranda')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{language === 'id' ? 'Beranda' : 'Home'}</button>
          <button onClick={() => document.getElementById('fitur-utama')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{language === 'id' ? 'Fitur Utama' : 'Key Features'}</button>
          <button onClick={() => document.getElementById('panduan')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{language === 'id' ? 'Panduan' : 'Guide'}</button>
          <button onClick={() => document.getElementById('tentang-kami')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{language === 'id' ? 'Tentang Kami' : 'About Us'}</button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {mounted && (
            <div className="flex items-center gap-1 md:gap-2 mr-1 md:mr-2">
              <button
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="p-2 md:p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              >
                <Globe size={16} />
                <span className="text-xs font-bold uppercase">{language}</span>
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 md:p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          )}
          
          <button
            onClick={onLoginClick}
            className="px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-bold border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {language === 'id' ? 'Masuk' : 'Login'}
          </button>
          <button
            onClick={onRegisterClick}
            className="hidden sm:flex px-4 py-2 md:px-5 md:py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {language === 'id' ? 'Daftar' : 'Register'}
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
            {language === 'id' ? 'Platform Monitoring Terpadu' : 'Integrated Monitoring Platform'}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-6 text-slate-900 dark:text-white animate-in fade-in slide-in-from-bottom-6 duration-700">
            {language === 'id' ? 'Sistem Manajemen ' : 'Smart Management System for '}
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {language === 'id' ? 'PKL & Magang' : 'Internships'}
            </span>
            {language === 'id' ? ' Cerdas' : ''}
          </h1>

          <p className="text-base md:text-xl font-medium mb-10 max-w-2xl text-slate-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {language === 'id' ? 'Pantau kehadiran, jurnal harian, dan pencapaian kompetensi siswa secara real-time. Mempermudah kolaborasi antara sekolah, siswa, dan perusahaan.' : 'Monitor attendance, daily journals, and student competencies in real-time. Simplify collaboration between schools, students, and companies.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {language === 'id' ? 'Mulai Sekarang' : 'Get Started'}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

          </div>
        </div>

        {/* Features/Stats snippet at bottom */}
        <div id="fitur-utama" className="mt-20 md:mt-28 w-full max-w-6xl mx-auto px-4 animate-in fade-in duration-1000 delay-300">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-4">
              {language === 'id' ? 'Kenapa Memilih NeboTrack?' : 'Why Choose NeboTrack?'}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">
              {language === 'id' ? 'Sistem cerdas kami didesain khusus untuk memudahkan alur kerja siswa, guru, dan mentor perusahaan.' : 'Our smart system is specifically designed to streamline workflows for students, teachers, and company mentors.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                label: language === 'id' ? 'Jurnal Harian Digital' : 'Digital Daily Journal', 
                desc: language === 'id' ? 'Isi logbook dengan mudah menggunakan editor pintar.' : 'Fill logbooks easily using our smart editor.', 
                icon: '📝' 
              },
              { 
                label: language === 'id' ? 'Absensi Akurat' : 'Accurate Attendance', 
                desc: language === 'id' ? 'Sistem pencatatan kehadiran yang real-time.' : 'Real-time attendance tracking system.', 
                icon: '⏱️' 
              },
              { 
                label: language === 'id' ? 'Progress Board' : 'Progress Board', 
                desc: language === 'id' ? 'Manajemen tugas proyek magang secara visual.' : 'Visual task management for internship projects.', 
                icon: '📊' 
              },
              { 
                label: language === 'id' ? 'Notifikasi Otomatis' : 'Auto Notifications', 
                desc: language === 'id' ? 'Mengingatkan batas waktu dan persetujuan jurnal.' : 'Reminds about deadlines and journal approvals.', 
                icon: '🔔' 
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 dark:border-gray-700/60 shadow-lg shadow-slate-200/20 dark:shadow-none flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-xl hover:border-blue-500/30 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{item.label}</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values Section */}
        <div className="w-full max-w-5xl mx-auto px-4 mt-20 mb-10">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 md:p-12 text-white shadow-xl shadow-blue-500/20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="flex flex-col items-center justify-center text-center px-4 py-4 md:py-0">
              <span className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-wide">
                {language === 'id' ? 'Efisien' : 'Efficient'}
              </span>
              <span className="text-blue-100 text-xs md:text-sm font-medium uppercase tracking-wider">
                {language === 'id' ? 'Hemat Waktu & Biaya' : 'Save Time & Cost'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4 py-4 md:py-0">
              <span className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-wide whitespace-nowrap">
                Real-time
              </span>
              <span className="text-blue-100 text-xs md:text-sm font-medium uppercase tracking-wider">
                {language === 'id' ? 'Pantau Kapan Saja' : 'Monitor Anytime'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4 py-4 md:py-0">
              <span className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-wide">
                {language === 'id' ? 'Terkoneksi' : 'Connected'}
              </span>
              <span className="text-blue-100 text-xs md:text-sm font-medium uppercase tracking-wider">
                {language === 'id' ? 'Sekolah & Industri' : 'School & Industry'}
              </span>
            </div>
          </div>
        </div>

        {/* Panduan Section */}
        <div id="panduan" className="mt-24 max-w-6xl mx-auto px-4 w-full">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-4">
              {language === 'id' ? 'Bagaimana Cara Kerjanya?' : 'How Does It Work?'}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">
              {language === 'id' ? 'Tiga langkah mudah untuk memulai pengelolaan PKL dan Magang Anda.' : 'Three easy steps to start managing your Internships.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-blue-500 to-indigo-100 dark:from-slate-800 dark:via-blue-500 dark:to-slate-800 -translate-y-1/2 z-0 rounded-full opacity-50" />
            
            <div className="relative z-10 bg-white dark:bg-slate-700/60 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-600 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-sm flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:dark:border-blue-400/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-blue-500/30 dark:shadow-blue-600/40">1</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                {language === 'id' ? 'Daftar & Atur Profil' : 'Register & Setup Profile'}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 leading-relaxed">
                {language === 'id' ? 'Buat akun sesuai peran Anda (Siswa, Guru, atau Mentor Eksternal). Masukkan detail sekolah atau perusahaan Anda.' : 'Create an account based on your role (Student, Teacher, or Mentor). Enter your school or company details.'}
              </p>
            </div>
            
            <div className="relative z-10 bg-white dark:bg-slate-700/60 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-600 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-sm flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:dark:border-blue-400/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-blue-500/30 dark:shadow-blue-600/40">2</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                {language === 'id' ? 'Kolaborasi Tim' : 'Team Collaboration'}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 leading-relaxed">
                {language === 'id' ? 'Admin akan menyetujui akun. Setelahnya, Anda bisa saling memantau logbook, absensi, dan progress proyek bersama.' : 'Admin will approve the account. Afterwards, you can monitor logbooks, attendance, and project progress together.'}
              </p>
            </div>
            
            <div className="relative z-10 bg-white dark:bg-slate-700/60 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-600 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-sm flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:dark:border-blue-400/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-blue-500/30 dark:shadow-blue-600/40">3</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                {language === 'id' ? 'Ekspor Laporan' : 'Export Reports'}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 leading-relaxed">
                {language === 'id' ? 'Di akhir periode, seluruh aktivitas magang dapat di-export menjadi laporan PDF atau Excel yang terstruktur dan rapi.' : 'At the end of the period, all internship activities can be exported into structured PDF or Excel reports.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tentang Kami Section */}
        <div id="tentang-kami" className="mt-32 mb-20 max-w-6xl mx-auto px-4 w-full">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-[3rem] p-8 md:p-16 border border-blue-100 dark:border-slate-600 flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-blue-500/10 dark:shadow-none">
            <div className="flex-1 space-y-6 text-left">
              <div className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm">
                {language === 'id' ? 'Inisiatif Digital' : 'Digital Initiative'}
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight">
                {language === 'id' ? 'Misi Kami di ' : 'Our Mission at '}
                <span className="text-blue-600 dark:text-blue-400">NeboTrack</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                {language === 'id' 
                  ? 'Kami hadir untuk memodernisasi pelaksanaan Praktik Kerja Lapangan (PKL) dan Magang di Indonesia. Mengubah proses yang dulunya penuh tumpukan kertas menjadi alur digital yang efisien, transparan, dan dapat diakses kapan saja.' 
                  : 'We are here to modernize the implementation of Internships. Transforming paper-based processes into an efficient, transparent, and accessible digital workflow.'}
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 text-slate-700 dark:text-gray-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</div>
                  {language === 'id' ? 'Paperless & Ramah Lingkungan' : 'Paperless & Eco-Friendly'}
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-gray-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</div>
                  {language === 'id' ? 'Transparansi Penilaian' : 'Evaluation Transparency'}
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-gray-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</div>
                  {language === 'id' ? 'Mendukung Standar Kurikulum Merdeka' : 'Supports Independent Curriculum Standards'}
                </li>
              </ul>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                  alt="Kolaborasi Siswa dan Industri" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <span className="text-white font-bold text-xl md:text-2xl drop-shadow-md">
                    {language === 'id' ? 'Menjembatani Akademia & Industri' : 'Bridging Academia & Industry'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
