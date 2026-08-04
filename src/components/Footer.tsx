import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  const { language } = useLanguage();

  return (
    <footer className="w-full bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-blue-900/30 pt-16 pb-8 px-6 md:px-12 mt-auto print:hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
        {/* Logo & Info */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-1 mb-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">NEBO</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tight">TRACK</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
            {language === 'id' 
              ? 'Solusi digital modern untuk memantau, mengelola, dan mengevaluasi kegiatan Praktik Kerja Lapangan (PKL) dan Magang siswa secara efektif.' 
              : 'Modern digital solution to effectively monitor, manage, and evaluate student Internships and Field Work Practices.'}
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white mb-4">
            {language === 'id' ? 'Navigasi' : 'Navigation'}
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-gray-400">
            <li><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{language === 'id' ? 'Beranda' : 'Home'}</Link></li>
            <li><Link href="/#fitur-utama" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{language === 'id' ? 'Fitur Utama' : 'Key Features'}</Link></li>
            <li><Link href="/#panduan" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{language === 'id' ? 'Panduan Penggunaan' : 'User Guide'}</Link></li>
            <li><Link href="/#tentang" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{language === 'id' ? 'Tentang Kami' : 'About Us'}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 dark:text-white mb-4">
            {language === 'id' ? 'Layanan Institusi' : 'Institution Services'}
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-gray-400">
            <li>
              <Link href="/register-admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                {language === 'id' ? 'Daftar Sebagai Admin' : 'Register as Admin'}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {language === 'id' ? 'BARU' : 'NEW'}
                </span>
              </Link>
            </li>
            <li>
              {onLoginClick ? (
                <button onClick={onLoginClick} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {language === 'id' ? 'Masuk Portal' : 'Login Portal'}
                </button>
              ) : (
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left">
                  {language === 'id' ? 'Masuk Portal' : 'Login Portal'}
                </Link>
              )}
            </li>
            <li><a href="mailto:support@nebotrack.my.id?subject=Bantuan%20Aplikasi" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{language === 'id' ? 'Pusat Bantuan (FAQ)' : 'Help Center (FAQ)'}</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white mb-4">
            {language === 'id' ? 'Hubungi Kami' : 'Contact Us'}
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:support@nebotrack.my.id" className="hover:text-blue-600 transition-colors">support@nebotrack.my.id</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+62 264 831 5007</span>
            </li>
            <li className="flex items-start gap-2 mt-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="leading-tight">JL. RAYA KEC. BOJONG, Kec.<br /> Bojong, Kab. Purwakarta,<br></br> Prov. Jawa Barat</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 border-t border-slate-200 dark:border-blue-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} NeboTrack. {language === 'id' ? 'Seluruh hak cipta dilindungi.' : 'All rights reserved.'}
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">
            {language === 'id' ? 'Syarat & Ketentuan' : 'Terms & Conditions'}
          </Link>
          <Link href="/privacy" className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">
            {language === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
          </Link>
        </div>
      </div>
    </footer>
  );
};
