'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

export default function TermsPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
            &larr; {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </Link>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
          {language === 'id' ? 'Syarat & Ketentuan' : 'Terms & Conditions'}
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 space-y-4">
          <p>
            {language === 'id' ? 'Terakhir diperbarui: ' : 'Last updated: '}{new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
          </p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '1. Penerimaan Syarat' : '1. Acceptance of Terms'}
          </h2>
          <p>
            {language === 'id'
              ? 'Dengan mengakses dan menggunakan platform NeboTrack, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan aplikasi kami.'
              : 'By accessing and using the NeboTrack platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our application.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '2. Penggunaan Layanan' : '2. Use of Services'}
          </h2>
          <p>
            {language === 'id'
              ? 'NeboTrack adalah sistem manajemen Praktik Kerja Lapangan (PKL) dan magang. Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah secara hukum dan sesuai dengan pedoman institusi pendidikan atau perusahaan Anda.'
              : 'NeboTrack is a field work practice (PKL) and internship management system. You agree to use this service only for lawful purposes and in accordance with the guidelines of your educational institution or company.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '3. Akun Pengguna' : '3. User Accounts'}
          </h2>
          <p>
            {language === 'id'
              ? 'Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda (username dan password). Semua aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya.'
              : 'You are responsible for maintaining the confidentiality of your account credentials (username and password). All activities that occur under your account are your sole responsibility.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '4. Batasan Tanggung Jawab' : '4. Limitation of Liability'}
          </h2>
          <p>
            {language === 'id'
              ? 'NeboTrack disediakan "sebagaimana adanya". Kami tidak menjamin bahwa layanan akan bebas dari gangguan, kesalahan, atau bug sepenuhnya, meskipun kami terus berupaya menjaga kualitas terbaik.'
              : 'NeboTrack is provided "as is". We do not guarantee that the service will be entirely free from interruptions, errors, or bugs, although we continually strive to maintain the highest quality.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '5. Perubahan Syarat' : '5. Changes to Terms'}
          </h2>
          <p>
            {language === 'id'
              ? 'Kami berhak untuk mengubah atau mengganti Syarat ini kapan saja. Perubahan yang signifikan akan diberitahukan melalui platform.'
              : 'We reserve the right to modify or replace these Terms at any time. Significant changes will be notified through the platform.'}
          </p>
        </div>
      </div>
    </div>
  );
}
