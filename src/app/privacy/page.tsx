import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
            &larr; Kembali ke Beranda
          </Link>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Kebijakan Privasi</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 space-y-4">
          <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan informasi pribadi yang Anda berikan secara langsung kepada kami, seperti nama, alamat email, asal sekolah/institusi, dan data terkait pelaksanaan PKL. Kami juga mungkin menggunakan pengenalan wajah (Face API) khusus untuk fitur absensi.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">2. Penggunaan Informasi</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk memfasilitasi manajemen PKL, memverifikasi kehadiran Anda, memberikan akses yang sesuai dengan peran Anda, dan meningkatkan layanan NeboTrack.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">3. Keamanan Data</h2>
          <p>Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">4. Berbagi Informasi</h2>
          <p>Kami tidak akan menjual atau menyewakan informasi pribadi Anda. Informasi Anda hanya dibagikan kepada pihak sekolah, institusi, atau perusahaan yang secara sah terhubung dengan kegiatan PKL Anda di platform ini.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">5. Kontak Kami</h2>
          <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui email di smkn1bojong@gmail.com.</p>
        </div>
      </div>
    </div>
  );
}
