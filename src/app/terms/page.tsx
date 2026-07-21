import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
            &larr; Kembali ke Beranda
          </Link>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Syarat & Ketentuan</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 space-y-4">
          <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">1. Penerimaan Syarat</h2>
          <p>Dengan mengakses dan menggunakan platform NeboTrack, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan aplikasi kami.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">2. Penggunaan Layanan</h2>
          <p>NeboTrack adalah sistem manajemen Praktik Kerja Lapangan (PKL) dan magang. Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah secara hukum dan sesuai dengan pedoman institusi pendidikan atau perusahaan Anda.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">3. Akun Pengguna</h2>
          <p>Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda (username dan password). Semua aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">4. Batasan Tanggung Jawab</h2>
          <p>NeboTrack disediakan "sebagaimana adanya". Kami tidak menjamin bahwa layanan akan bebas dari gangguan, kesalahan, atau bug sepenuhnya, meskipun kami terus berupaya menjaga kualitas terbaik.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-6">5. Perubahan Syarat</h2>
          <p>Kami berhak untuk mengubah atau mengganti Syarat ini kapan saja. Perubahan yang signifikan akan diberitahukan melalui platform.</p>
        </div>
      </div>
    </div>
  );
}
