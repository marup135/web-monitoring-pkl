'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { registerInstitutionAdminAction } from '../actions/auth';
import { Footer } from '../../components/Footer';

type AlertType = 'field' | 'server';

interface ErrorState {
  message: string;
  type: AlertType;
  field?: string;
}

export default function RegisterAdminPage() {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPendingSuccess, setIsPendingSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'UNIVERSITY' | 'TRAINING_CENTER' | 'COMPANY' | 'OTHER'>('SCHOOL');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  const setError = (message: string, type: AlertType = 'field', field?: string) => {
    setErrorState({ message, type, field });
  };

  const clearError = () => {
    setErrorState(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Basic Validation
    if (!name.trim()) return setError('Nama lengkap wajib diisi.', 'field', 'name');
    if (!email.trim()) return setError('Email wajib diisi.', 'field', 'email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Format email tidak valid.', 'field', 'email');
    if (!password) return setError('Password wajib diisi.', 'field', 'password');
    if (password.length < 5) return setError('Password minimal 5 karakter.', 'field', 'password');
    if (password !== confirmPassword) return setError('Password dan Konfirmasi tidak sama.', 'field', 'confirmPassword');
    if (!institutionName.trim()) return setError('Nama Institusi wajib diisi.', 'field', 'institutionName');
    if (!phone.trim()) return setError('Nomor HP wajib diisi.', 'field', 'phone');
    if (!address.trim()) return setError('Alamat wajib diisi.', 'field', 'address');

    setLoading(true);

    try {
      const res = await registerInstitutionAdminAction(
        name.trim(),
        email.trim(),
        password,
        institutionName.trim(),
        institutionType,
        address.trim(),
        phone.trim(),
        website.trim()
      );

      if (res.success) {
        setIsPendingSuccess(true);
      } else {
        setError(res.error || 'Terjadi kesalahan saat pendaftaran.', 'server');
      }
    } catch {
      setError('Gagal menghubungi server.', 'server');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-white dark:bg-[#243447] border rounded-xl pl-10 pr-4 text-sm text-[#0F172A] dark:text-gray-200 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all duration-200 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
        : 'border-[#E2E8F0] dark:border-gray-700 focus:border-primary focus:ring-blue-100'
    }`;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] text-[#0F172A] dark:text-gray-200 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/6 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Card Wrapper */}
      <div className="w-full max-w-[600px] relative z-10 my-8">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-7 sm:p-10 border border-white dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md scale-110" />
              <img
                src="/nebo.png"
                alt="NEBO Logo"
                className="relative w-[64px] h-[64px] object-contain rounded-2xl shadow-md border border-[#E2E8F0] dark:border-gray-700"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight text-center">
              Pendaftaran Admin Institusi
            </h1>
            <p className="text-sm text-[#64748B] dark:text-gray-300 font-medium mt-2 text-center leading-relaxed">
              Daftarkan sekolah, kampus, atau perusahaan Anda ke sistem NEBO.
            </p>
          </div>

          {isPendingSuccess ? (
            <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 gap-4 mt-2">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-2">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Pendaftaran Berhasil Dikirim</h2>
              <p className="text-sm text-[#64748B] dark:text-gray-300">
                Permohonan Anda akan ditinjau oleh Super Admin sebelum akun admin diaktifkan. Kami akan memberitahu Anda setelah akun disetujui.
              </p>
              <Link
                href="/"
                className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Kembali ke Beranda
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorState && errorState.type === 'server' && (
                <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-start gap-2.5 animate-in shake duration-300">
                  <div className="mt-0.5 shrink-0"><Lock size={16} /></div>
                  <p>{errorState.message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Nama Lengkap PIC</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Nama PIC"
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'name')}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Email Akun</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="email"
                        placeholder="admin@sekolah.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'email')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'password')}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Konfirmasi Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'confirmPassword')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Institusi */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Nama Institusi</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: SMKN 1 Bojong"
                        value={institutionName}
                        onChange={(e) => { setInstitutionName(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'institutionName')}
                      />
                    </div>
                  </div>

                  {/* Jenis Institusi */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Jenis Institusi</label>
                    <div className="relative group">
                      <select
                        value={institutionType}
                        onChange={(e) => setInstitutionType(e.target.value as any)}
                        className={inputClass(false) + " pl-4 appearance-none"}
                      >
                        <option value="SCHOOL">Sekolah (SMK/SMA)</option>
                        <option value="UNIVERSITY">Perguruan Tinggi</option>
                        <option value="TRAINING_CENTER">Lembaga Pelatihan (LPK)</option>
                        <option value="COMPANY">Perusahaan</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nomor HP */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Nomor HP / Telp</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="081234567890"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); clearError(); }}
                        className={inputClass(errorState?.field === 'phone')}
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Website (Opsional)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={website}
                        onChange={(e) => { setWebsite(e.target.value); clearError(); }}
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2">Alamat Lengkap</label>
                  <div className="relative group">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
                    </div>
                    <textarea
                      placeholder="Alamat lengkap institusi"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); clearError(); }}
                      rows={3}
                      className={inputClass(errorState?.field === 'address') + " pt-3"}
                    />
                  </div>
                </div>
              </div>

              {/* Error Message for Fields below */}
              {errorState && errorState.type === 'field' && (
                <div className="text-red-500 text-xs font-medium text-center">
                  {errorState.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 active:bg-blue-800 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar sebagai Admin Institusi</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <Link href="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                  ← Kembali ke Halaman Utama
                </Link>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
