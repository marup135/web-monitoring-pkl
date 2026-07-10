/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { forgotPasswordAction } from '../app/actions/auth';
import {
  Building2,
  User,
  Key,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';



const ROLES = [
  { value: 'siswa', label: 'Siswa PKL' },
  { value: 'pembimbing_internal', label: 'Pembimbing Internal (Sekolah)' },
  { value: 'pembimbing_eksternal', label: 'Pembimbing Eksternal (Perusahaan)' },
];

// Alert types
type AlertType = 'field' | 'credentials' | 'server';

interface ErrorState {
  message: string;
  type: AlertType;
  field?: 'username' | 'password' | 'confirmPassword';
}

export const AuthPage: React.FC = () => {
  const { login, register, currentUser } = usePKL();

  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgotPassword = view === 'forgot-password';

  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPendingSuccess, setIsPendingSuccess] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('siswa');
  const [company, setCompany] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [school, setSchool] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nisn, setNisn] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // If user is already logged in, the parent HomeWrapper will redirect automatically.
  // We guard here too as extra safety.
  useEffect(() => {
    if (currentUser) {
      // Parent HomeWrapper already handles showing DashboardContent when currentUser is set.
      // No explicit router.push needed since this app is SPA-like.
    }
  }, [currentUser]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setError = (message: string, type: AlertType = 'field', field?: 'username' | 'password' | 'confirmPassword') => {
    setErrorState({ message, type, field });
  };

  const clearError = () => {
    setErrorState(null);
    setSuccessMessage(null);
  };

  const handleTabSwitch = (newView: 'login' | 'register' | 'forgot-password') => {
    setView(newView);
    clearError();
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsPendingSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const cleanUsername = username.trim().toLowerCase();

    // --- Forgot Password handling ---
    if (isForgotPassword) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        setError('Email wajib diisi.', 'field');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError('Format email tidak valid.', 'field');
        return;
      }
      setLoading(true);
      try {
        const origin = window.location.origin;
        const res = await forgotPasswordAction(cleanEmail, origin);
        if (res.success) {
          clearError();
          setSuccessMessage('Jika email terdaftar, kami telah mengirimkan tautan untuk mengatur ulang password.');
        } else {
          setError(res.error || 'Gagal mengirim email reset password.', 'server');
        }
      } catch {
        setError('Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.', 'server');
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- Login validations ---
    if (isLogin) {
      if (!cleanUsername) {
        setError('Username atau Email wajib diisi.', 'field', 'username');
        return;
      }
      if (!password) {
        setError('Password wajib diisi.', 'field', 'password');
        return;
      }
    } else {
      // --- Register validations ---
      if (!name.trim()) {
        setError('Nama lengkap wajib diisi.', 'field');
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        setError('Email wajib diisi.', 'field');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError('Format email tidak valid.', 'field');
        return;
      }
      if (!cleanUsername) {
        setError('Username wajib diisi.', 'field', 'username');
        return;
      }
      if (cleanUsername.length < 3) {
        setError('Username harus terdiri dari minimal 3 karakter.', 'field', 'username');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
        setError('Username hanya boleh terdiri dari huruf, angka, titik, garis bawah, atau strip.', 'field', 'username');
        return;
      }
      if (!password) {
        setError('Password wajib diisi.', 'field', 'password');
        return;
      }
      if (password.length < 5) {
        setError('Password harus terdiri dari minimal 5 karakter.', 'field', 'password');
        return;
      }
      if (!confirmPassword) {
        setError('Konfirmasi Password wajib diisi.', 'field', 'confirmPassword');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password dan Konfirmasi Password tidak sama.', 'field', 'confirmPassword');
        return;
      }
      const cleanName = name.trim();
      if (cleanName.length < 3) {
        setError('Nama lengkap harus terdiri dari minimal 3 karakter.', 'field');
        return;
      }
      if (!/^[a-zA-Z\s.,']+$/.test(cleanName)) {
        setError('Nama hanya boleh mengandung huruf, spasi, titik, koma, atau tanda petik.', 'field');
        return;
      }
      if (role === 'siswa') {
        if (!selectedClass.trim()) {
          setError('Kelas / Program Studi wajib diisi.', 'field');
          return;
        }
        if (!school.trim()) {
          setError('Asal Sekolah / Kampus wajib diisi.', 'field');
          return;
        }
      } else if (role === 'pembimbing_internal') {
        if (!nip.trim()) {
          setError('NIP / Nomor Identitas wajib diisi.', 'field');
          return;
        }
        if (!school.trim()) {
          setError('Asal Sekolah / Kampus wajib diisi.', 'field');
          return;
        }
      } else if (role === 'pembimbing_eksternal') {
        const cleanCompany = company.trim();
        if (!cleanCompany) {
          setError('Nama perusahaan wajib diisi.', 'field');
          return;
        }
        if (!jabatan.trim()) {
          setError('Jabatan wajib diisi.', 'field');
          return;
        }
        if (!employeeId.trim()) {
          setError('Nomor Identitas Karyawan wajib diisi.', 'field');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(cleanUsername, password);
        if (res.success) {
          clearError();
          // Signal HomeWrapper to show success toast
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('login_success', 'true');
          }
          // HomeWrapper will automatically switch to DashboardContent because currentUser is now set
        } else {
          const errMsg = res.error ?? '';
          if (
            errMsg.toLowerCase().includes('database') ||
            errMsg.toLowerCase().includes('server') ||
            errMsg.toLowerCase().includes('connection') ||
            errMsg.toLowerCase().includes('system') ||
            errMsg.toLowerCase().includes('sistem')
          ) {
            setError('Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.', 'server');
          } else if (errMsg.includes('menunggu verifikasi') || errMsg.includes('disetujui')) {
            setError(errMsg, 'server');
          } else {
            setError(errMsg || 'Email atau password salah.', 'credentials');
          }
        }
      } else {
        const res = await register(
          cleanUsername,
          email.trim().toLowerCase(),
          password,
          name.trim(),
          role,
          (role === 'siswa' || role === 'pembimbing_eksternal') ? company.trim() : undefined,
          role === 'siswa' ? selectedClass.trim() : undefined,
          role === 'siswa' ? nisn.trim() : undefined,
          role === 'pembimbing_internal' ? nip.trim() : undefined,
          (role === 'siswa' || role === 'pembimbing_internal') ? school.trim() : undefined,
          role === 'pembimbing_eksternal' ? jabatan.trim() : undefined,
          role === 'pembimbing_eksternal' ? employeeId.trim() : undefined,
          role === 'pembimbing_eksternal' ? companyEmail.trim() : undefined
        );
        if (res.success && res.pending) {
          clearError();
          setIsPendingSuccess(true);
          setUsername('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setCompany('');
          setJabatan('');
          setEmployeeId('');
          setCompanyEmail('');
          setNisn('');
          setNip('');
        } else if (!res.success) {
          setError(res.error ?? 'Gagal melakukan pendaftaran.', 'server');
        }
      }
    } catch {
      setError('Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.', 'server');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleLabel = ROLES.find((r) => r.value === role)?.label ?? 'Pilih peran...';

  // Credentials error highlights both fields; field error highlights specific field
  const usernameHasError =
    errorState?.field === 'username' || errorState?.type === 'credentials';
  const passwordHasError =
    errorState?.field === 'password' || errorState?.type === 'credentials';
  const confirmPasswordHasError =
    errorState?.field === 'confirmPassword';

  // Dynamic input border class
  const inputClass = (hasError: boolean) =>
    `w-full bg-white dark:bg-[#243447] border rounded-xl pl-10 pr-4 text-sm text-[#0F172A] dark:text-gray-200 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all duration-200 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
        : 'border-[#E2E8F0] dark:border-gray-700 focus:border-primary focus:ring-blue-100'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] text-[#0F172A] dark:text-gray-200 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/6 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-7 sm:p-9 border border-white shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-300">

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md scale-110" />
              <img
                src="/interntrack.jpg"
                alt="InternTrack Logo"
                className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] object-contain rounded-2xl shadow-md border border-[#E2E8F0] dark:border-gray-700"
              />
            </div>
            <h1 className="text-2xl md:text-[28px] font-black text-[#0F172A] dark:text-white tracking-tight">
              InternTrack
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium mt-1.5 text-center leading-relaxed max-w-[240px]">
              Track Your Progress, Shape Your Future.
            </p>
          </div>

          {isPendingSuccess ? (
            <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 gap-4 mt-2">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-2">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Pendaftaran Berhasil</h2>
              <p className="text-sm text-[#64748B] dark:text-gray-300">
                Akun Anda sedang menunggu verifikasi Admin. Silakan tunggu hingga akun disetujui sebelum melakukan login.
              </p>
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="mt-6 w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Kembali ke Login
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Tab Toggle */}
              {!isForgotPassword && (
            <div className="flex bg-[#F1F5F9] dark:bg-gray-800 p-1 rounded-2xl mb-6 border border-[#E2E8F0] dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  isLogin
                    ? 'bg-white dark:bg-[#243447] text-primary shadow-sm border border-[#E2E8F0] dark:border-gray-700'
                    : 'text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  !isLogin
                    ? 'bg-white dark:bg-[#243447] text-primary shadow-sm border border-[#E2E8F0] dark:border-gray-700'
                    : 'text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
                }`}
              >
                Daftar Baru
              </button>
            </div>
          )}

          {isForgotPassword && (
            <div className="mb-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Lupa Password?</h2>
              <p className="text-xs text-[#64748B] dark:text-gray-300 mt-1">Masukkan email Anda untuk menerima tautan reset password.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* If Register: wrap fields in a grid */}
            {isRegister && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      placeholder="Masukkan alamat email..."
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value.toLowerCase().replace(/\s+/g, ''));
                        if (errorState) clearError();
                      }}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <User size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${usernameHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type="text"
                      placeholder="Masukkan username..."
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                        if (errorState) clearError();
                      }}
                      className={inputClass(usernameHasError)}
                    />
                  </div>
                  {usernameHasError && errorState?.type === 'field' && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errorState?.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Key size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${passwordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorState) clearError();
                      }}
                      className={`${inputClass(passwordHasError)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-lg transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordHasError && errorState?.type === 'field' && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errorState?.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Key size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${confirmPasswordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Ulangi password..."
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorState) clearError();
                      }}
                      className={`${inputClass(confirmPasswordHasError)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-lg transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPasswordHasError && errorState?.type === 'field' && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errorState?.message}
                    </p>
                  )}
                </div>

                {/* Role Dropdown */}
                <div className="flex flex-col gap-1.5 relative" ref={roleDropdownRef}>
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Peran (Role)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 text-left flex justify-between items-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all"
                  >
                    <span>{currentRoleLabel}</span>
                    <ChevronDown
                      size={14}
                      className={`text-[#94A3B8] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isRoleDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-xl dark:shadow-sm dark:shadow-slate-900/20 dark:border dark:bg-gray-800 z-50 overflow-hidden">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => {
                            setRole(r.value);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F1F5F9] dark:bg-gray-800 transition duration-150 block cursor-pointer ${
                            role === r.value
                              ? 'bg-primary/8 text-primary font-semibold'
                              : 'text-[#0F172A] dark:text-gray-200'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

            {/* Siswa-specific fields — Register Only */}
            {isRegister && role === 'siswa' && (
              <>
                {/* Asal Sekolah */}
                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Asal Sekolah / Kampus / Institusi
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Masukkan asal institusi..."
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                {/* Kelas / Program Studi (Text) */}
                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Kelas / Program Studi / Jurusan
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: XII PPLG 1 / S1 Informatika..."
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Pembimbing Internal fields — Register Only */}
            {isRegister && role === 'pembimbing_internal' && (
              <>
                {/* Asal Sekolah */}
                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Asal Sekolah / Kampus / Institusi
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Masukkan asal institusi..."
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                {/* NIP / NIDN */}
                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    NIP / NIDN / NUPTK / Nomor Identitas
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masukkan nomor identitas..."
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Eksternal-specific fields — Register Only */}
            {isRegister && role === 'pembimbing_eksternal' && (
              <>
                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Nama Perusahaan
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Masukkan nama perusahaan..."
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        if (errorState) clearError();
                      }}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Jabatan (Wajib)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: Manager / Software Engineer..."
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Nomor Identitas Karyawan (Employee ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masukkan Nomor Identitas Karyawan..."
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Email Perusahaan (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Masukkan email perusahaan..."
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </>
            )}
              </div>
            )}

            {/* If Login: fields are rendered in a simple flex column */}
            {isLogin && (
              <>
                {/* Username or Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Username atau Email
                  </label>
                  <div className="relative">
                    <User size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${usernameHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type="text"
                      placeholder="Masukkan username atau email..."
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                        if (errorState) clearError();
                      }}
                      className={inputClass(usernameHasError)}
                    />
                  </div>
                  {usernameHasError && errorState?.type === 'field' && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errorState?.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Key size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${passwordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorState) clearError();
                      }}
                      className={`${inputClass(passwordHasError)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-lg transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordHasError && errorState?.type === 'field' && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errorState?.message}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex justify-between items-center mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="h-4 w-4 rounded border-[#CBD5E1] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium group-hover:text-[#0F172A] dark:text-gray-200 transition-colors select-none">
                      Ingat saya
                    </span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot-password')}
                    className="text-[11px] font-bold text-primary hover:text-primary-hover dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
              </>
            )}

            {isForgotPassword && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <User size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errorState?.type === 'field' ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                    <input
                      type="email"
                      placeholder="Masukkan alamat email..."
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value.toLowerCase().replace(/\s+/g, ''));
                        if (errorState) clearError();
                      }}
                      className={inputClass(errorState?.type === 'field')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 min-h-[48px] bg-primary hover:bg-primary-hover active:bg-[#1E40AF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isLogin ? 'Signing in...' : isRegister ? 'Mendaftar...' : 'Memproses...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Masuk' : isRegister ? 'Daftar Sekarang' : 'Kirim Tautan Reset'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {isForgotPassword && (
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="w-full mt-2 min-h-[48px] bg-transparent hover:bg-slate-50 dark:hover:bg-gray-800 text-[#64748B] dark:text-gray-300 font-semibold text-sm rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-all duration-200 flex items-center justify-center cursor-pointer"
              >
                Kembali ke Login
              </button>
            )}
          </form>

          {/* Success Message */}
          {successMessage && (
            <div className="mt-5 p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-3 bg-green-50 border-green-200">
              <span className="shrink-0 text-green-500 mt-0.5">
                <ShieldCheck size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-green-800 mt-0.5">
                  Berhasil
                </p>
                <p className="mt-1 leading-snug text-green-700">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorState && errorState.type !== 'field' && (
            <div
              className={`mt-5 p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-3 ${
                errorState.type === 'server'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {errorState.type === 'server' ? (
                <span className="shrink-0 text-orange-500 mt-0.5">
                  <AlertCircle size={18} />
                </span>
              ) : (
                <span className="shrink-0 text-red-500 mt-0.5">
                  <AlertCircle size={18} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                {errorState.type === 'server' ? (
                  <>
                    <p className="font-bold text-[13px] text-orange-800">
                      Kesalahan Server
                    </p>
                    <p className="mt-1 leading-snug text-orange-700">
                      {errorState.message}
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-[13px] text-red-800 mt-0.5">
                    {errorState.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Demo Credentials Panel */}
          {isLogin && (
            <div className="mt-7 border-t border-[#F1F5F9] pt-6">
              <h4 className="text-[10px] font-bold text-primary mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck size={12} />
                Akun Demo (Simulasi)
              </h4>
              <ul className="flex flex-col gap-1.5 bg-[#F8FAFC] dark:bg-gray-900 p-3.5 rounded-xl border border-[#F1F5F9] font-mono text-[10px] text-[#64748B] dark:text-gray-300">
                {[
                  { role: 'Siswa', user: 'marup', pass: 'pppppp' },
                  { role: 'Pem. Eksternal', user: 'manajer', pass: 'pppppp' },
                  { role: 'Pem. Internal', user: 'ibuguru', pass: 'pppppp' },
                  { role: 'Admin', user: 'admin', pass: 'pppppp' },
                ].map((acc) => (
                  <li key={acc.user} className="flex items-center gap-1">
                    <span className="text-[#94A3B8] font-bold">{acc.role}:</span>
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setUsername(acc.user);
                        setPassword(acc.pass);
                      }}
                    >
                      {acc.user}
                    </span>
                    <span className="text-[#CBD5E1]">/</span>
                    <span>{acc.pass}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-[#CBD5E1] mt-2 text-center">
                Klik username untuk mengisi otomatis
              </p>
            </div>
          )}
          </>
        )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#94A3B8] mt-5 font-medium">
          © 2026 InternTrack · SMKN 1 Bojong
        </p>
      </div>
    </div>
  );
};