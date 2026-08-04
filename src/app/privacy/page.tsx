'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

export default function PrivacyPage() {
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
          {language === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 space-y-4">
          <p>
            {language === 'id' ? 'Terakhir diperbarui: ' : 'Last updated: '}{new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '1. Informasi yang Kami Kumpulkan' : '1. Information We Collect'}
          </h2>
          <p>
            {language === 'id' 
              ? 'Kami mengumpulkan informasi pribadi yang Anda berikan secara langsung kepada kami, seperti nama, alamat email, asal sekolah/institusi, dan data terkait pelaksanaan PKL. Kami juga mungkin menggunakan pengenalan wajah (Face API) khusus untuk fitur absensi.'
              : 'We collect personal information that you provide directly to us, such as your name, email address, school/institution, and data related to the implementation of PKL. We may also use facial recognition (Face API) specifically for the attendance feature.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '2. Penggunaan Informasi' : '2. Use of Information'}
          </h2>
          <p>
            {language === 'id'
              ? 'Informasi yang kami kumpulkan digunakan untuk memfasilitasi manajemen PKL, memverifikasi kehadiran Anda, memberikan akses yang sesuai dengan peran Anda, dan meningkatkan layanan NeboTrack.'
              : 'The information we collect is used to facilitate PKL management, verify your attendance, provide access according to your role, and improve NeboTrack services.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '3. Keamanan Data' : '3. Data Security'}
          </h2>
          <p>
            {language === 'id'
              ? 'Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah.'
              : 'We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, use, or disclosure.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '4. Berbagi Informasi' : '4. Sharing of Information'}
          </h2>
          <p>
            {language === 'id'
              ? 'Kami tidak akan menjual atau menyewakan informasi pribadi Anda. Informasi Anda hanya dibagikan kepada pihak sekolah, institusi, atau perusahaan yang secara sah terhubung dengan kegiatan PKL Anda di platform ini.'
              : 'We will not sell or rent your personal information. Your information is only shared with schools, institutions, or companies that are legally connected to your PKL activities on this platform.'}
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">
            {language === 'id' ? '5. Kontak Kami' : '5. Contact Us'}
          </h2>
          <p>
            {language === 'id'
              ? 'Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui email di support@nebotrac.my.id'
              : 'If you have any questions about this Privacy Policy, please contact us via email at support@nebotrac.my.id'}
          </p>
        </div>
      </div>
    </div>
  );
}
