/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePKL } from '../context/PKLContext';
import { PARTICIPANT_ROLES } from '../lib/constants';
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
import ReCAPTCHA from 'react-google-recaptcha';



const ROLES = [
  { value: 'siswa', label: 'Peserta / Siswa / Mahasiswa' },
  { value: 'INTERNAL_MENTOR', label: 'Pembimbing Internal (Guru/Dosen/Instruktur)' },
  { value: 'EXTERNAL_MENTOR', label: 'Pembimbing Eksternal (Perusahaan)' },
];

// Alert types
type AlertType = 'field' | 'credentials' | 'server';

interface ErrorState {
  message: string;
  type: AlertType;
  field?: 'username' | 'password' | 'confirmPassword' | 'institutionCode';
}

interface AuthPageProps {
  initialView?: 'login' | 'register' | 'forgot-password';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'login' }) => {
  const { login, register, currentUser } = usePKL();

  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>(initialView);
  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgotPassword = view === 'forgot-password';

  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPendingSuccess, setIsPendingSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
  const [institutionCode, setInstitutionCode] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nisn, setNisn] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const setError = (message: string, type: AlertType = 'field', field?: 'username' | 'password' | 'confirmPassword' | 'institutionCode') => {
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
    setCaptchaToken(null);
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
      if (!captchaToken) {
        setError('Silakan verifikasi CAPTCHA.', 'server');
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
      if (PARTICIPANT_ROLES.includes(role)) {
        if (!selectedClass.trim()) {
          setError('Kelas / Program Studi wajib diisi.', 'field');
          return;
        }
        if (!school.trim()) {
          setError('Asal Sekolah / Kampus wajib diisi.', 'field');
          return;
        }
        if (!nisn.trim()) {
          setError('NIS / NISN / NIM wajib diisi.', 'field');
          return;
        }
      } else if (role === 'INTERNAL_MENTOR') {
        if (!nip.trim()) {
          setError('NIP / Nomor Identitas wajib diisi.', 'field');
          return;
        }
        if (!school.trim()) {
          setError('Asal Sekolah / Kampus wajib diisi.', 'field');
          return;
        }
      } else if (role === 'EXTERNAL_MENTOR') {
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

      if (!institutionCode.trim()) {
        setError('Kode Institusi wajib diisi.', 'field');
        return;
      }

      if (!captchaToken) {
        setError('Silakan verifikasi CAPTCHA.', 'server');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(cleanUsername, password, captchaToken);
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
          (PARTICIPANT_ROLES.includes(role) || role === 'EXTERNAL_MENTOR') ? company.trim() : undefined,
          PARTICIPANT_ROLES.includes(role) ? selectedClass.trim() : undefined,
          PARTICIPANT_ROLES.includes(role) ? nisn.trim() : undefined,
          role === 'INTERNAL_MENTOR' ? nip.trim() : undefined,
          (PARTICIPANT_ROLES.includes(role) || role === 'INTERNAL_MENTOR') ? school.trim() : undefined,
          role === 'EXTERNAL_MENTOR' ? jabatan.trim() : undefined,
          role === 'EXTERNAL_MENTOR' ? employeeId.trim() : undefined,
          role === 'EXTERNAL_MENTOR' ? companyEmail.trim() : undefined,
          institutionCode.trim() ? institutionCode.trim() : undefined,
          captchaToken
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
          if (res.error?.includes('Kode Institusi')) {
            setError(res.error, 'field', 'institutionCode');
          } else {
            setError(res.error ?? 'Gagal melakukan pendaftaran.', 'server');
          }
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
  const institutionCodeHasError =
    errorState?.field === 'institutionCode';

  // Dynamic input border class
  const inputClass = (hasError: boolean) =>
    `w-full bg-white dark:bg-[#243447] border rounded-xl pl-10 pr-4 text-sm text-[#0F172A] dark:text-gray-200 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all duration-200 ${hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
      : 'border-[#E2E8F0] dark:border-gray-700 focus:border-primary focus:ring-blue-100'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] text-[#0F172A] dark:text-gray-200 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/6 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Card Wrapper - Max 560px */}
      <div className="w-full max-w-[560px] relative z-10 my-8">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-7 sm:p-10 border border-white dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50 animate-in fade-in zoom-in-95 duration-300">

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md scale-110" />
              <img
                src="/nebo.png"
                alt="NEBO Logo"
                className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] object-contain rounded-2xl shadow-md border border-[#E2E8F0] dark:border-gray-700"
              />
            </div>
            <h1 className="text-2xl md:text-[28px] font-black text-[#0F172A] dark:text-white tracking-tight">
              NEBO
            </h1>
            <p className="text-sm text-[#64748B] dark:text-gray-300 font-medium mt-2 text-center leading-relaxed max-w-[280px]">
              Network for Education & Business Opportunities
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
                className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Kembali ke Login
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Modern Segmented Tab Toggle */}
              {!isForgotPassword && (
                <div className="relative flex bg-slate-100 dark:bg-gray-800 p-1 rounded-[16px] mb-8 border border-slate-200 dark:border-gray-700 isolate overflow-hidden">
                  <div
                    className="absolute inset-y-1 bg-white dark:bg-[#1E293B] shadow-sm rounded-xl transition-all duration-300 ease-out"
                    style={{
                      width: 'calc(50% - 4px)',
                      left: isLogin ? '4px' : 'calc(50%)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer ${isLogin ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer ${!isLogin ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                  >
                    Daftar
                  </button>
                </div>
              )}



              {isForgotPassword && (
                <div className="mb-8 text-center animate-in fade-in zoom-in-95 duration-200">
                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Lupa Password?</h2>
                  <p className="text-sm text-[#64748B] dark:text-gray-300 mt-2">Masukkan email Anda untuk menerima tautan reset password.</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

                {/* If Register: Fields in 1 Column with Sections */}
                {isRegister && (
                  <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* SECTION 1: INFORMASI AKUN */}
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Section 1</h3>
                      <h2 className="text-sm font-black text-slate-800 dark:text-white mb-3">Informasi Akun</h2>
                      <div className="h-[1px] w-full bg-slate-100 dark:bg-gray-800 mb-5" />

                      <div className="flex flex-col gap-5">
                        {/* Role Dropdown */}
                        <div className="flex flex-col gap-1.5 relative" ref={roleDropdownRef}>
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Pilih Peran (Role)
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                            className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl px-4 text-sm text-[#0F172A] dark:text-gray-200 text-left flex justify-between items-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 cursor-pointer min-h-[48px] transition-all"
                          >
                            <span className="flex items-center gap-2">
                              {PARTICIPANT_ROLES.includes(role) && '🎓 '}
                              {role === 'INTERNAL_MENTOR' && '👨‍🏫 '}
                              {role === 'EXTERNAL_MENTOR' && '🏢 '}
                              {currentRoleLabel}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`text-[#94A3B8] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isRoleDropdownOpen && (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl shadow-xl dark:shadow-slate-900/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5">
                              {ROLES.map((r) => (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => {
                                    setRole(r.value);
                                    setIsRoleDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-3 text-sm rounded-xl transition duration-150 block cursor-pointer flex items-center gap-2 ${role === r.value
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-primary font-bold'
                                    : 'text-[#0F172A] dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 font-medium'
                                    }`}
                                >
                                  {r.value === 'siswa' && '🎓 '}
                                  {r.value === 'INTERNAL_MENTOR' && '👨‍🏫 '}
                                  {r.value === 'EXTERNAL_MENTOR' && '🏢 '}
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Full Name */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Nama Lengkap
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                              type="text"
                              placeholder="Siswa "
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className={inputClass(false)}
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Email
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                              type="email"
                              placeholder="siswa@gmail.com"
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
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Username
                          </label>
                          <div className="relative">
                            <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${usernameHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                            <input
                              type="text"
                              placeholder="siswa123"
                              value={username}
                              onChange={(e) => {
                                setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                                if (errorState) clearError();
                              }}
                              className={inputClass(usernameHasError)}
                            />
                          </div>
                          {usernameHasError && errorState?.type === 'field' && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle size={14} />
                              {errorState?.message}
                            </p>
                          )}
                        </div>

                        {/* Password Fields */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Password
                          </label>
                          <div className="relative">
                            <Key size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${passwordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (errorState) clearError();
                              }}
                              className={`${inputClass(passwordHasError)} pr-12`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-xl transition-colors cursor-pointer"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {passwordHasError && errorState?.type === 'field' && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle size={14} />
                              {errorState?.message}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Konfirmasi Password
                          </label>
                          <div className="relative">
                            <Key size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${confirmPasswordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errorState) clearError();
                              }}
                              className={`${inputClass(confirmPasswordHasError)} pr-12`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-xl transition-colors cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {confirmPasswordHasError && errorState?.type === 'field' && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle size={14} />
                              {errorState?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: INFORMASI TAMBAHAN */}
                    <div key={`section2-${role}`} className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Section 2</h3>
                      <h2 className="text-sm font-black text-slate-800 dark:text-white mb-3">Informasi Tambahan</h2>
                      <div className="h-[1px] w-full bg-slate-100 dark:bg-gray-800 mb-5" />

                      <div className="flex flex-col gap-5">
                        {/* Siswa */}
                        {PARTICIPANT_ROLES.includes(role) && (
                          <>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Asal Sekolah / Kampus <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                                <input
                                  type="text"
                                  placeholder="SMKN 1 BOJONG"
                                  value={school}
                                  onChange={(e) => {
                                    setSchool(e.target.value);
                                    if (errorState) clearError();
                                  }}
                                  className={`${inputClass(false)} pl-10`}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Kelas / Program Studi / Jurusan
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="XII PPLG 1"
                                  value={selectedClass}
                                  onChange={(e) => setSelectedClass(e.target.value)}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                NIS / NISN / NIM <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="1234567890"
                                  value={nisn}
                                  onChange={(e) => setNisn(e.target.value)}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Pembimbing Internal */}
                        {role === 'INTERNAL_MENTOR' && (
                          <>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Asal Sekolah / Kampus <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                                <input
                                  type="text"
                                  placeholder="SMKN 1 BOJONG"
                                  value={school}
                                  onChange={(e) => {
                                    setSchool(e.target.value);
                                    if (errorState) clearError();
                                  }}
                                  className={`${inputClass(false)} pl-10`}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                NIP / Nomor Identitas
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="198001012010011001"
                                  value={nip}
                                  onChange={(e) => setNip(e.target.value)}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-blue-500" />
                              Akun akan diverifikasi Admin.
                            </p>
                          </>
                        )}

                        {/* Pembimbing Eksternal */}
                        {role === 'EXTERNAL_MENTOR' && (
                          <>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Nama Perusahaan
                              </label>
                              <div className="relative">
                                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                                <input
                                  type="text"
                                  placeholder="PT Teknologi Nusantara"
                                  value={company}
                                  onChange={(e) => {
                                    setCompany(e.target.value);
                                    if (errorState) clearError();
                                  }}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Jabatan
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Software Engineer Manager"
                                  value={jabatan}
                                  onChange={(e) => setJabatan(e.target.value)}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                                Nomor Induk Karyawan
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="NIK / Employee ID"
                                  value={employeeId}
                                  onChange={(e) => setEmployeeId(e.target.value)}
                                  className={inputClass(false)}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-blue-500" />
                              Akun akan diverifikasi Admin.
                            </p>
                          </>
                        )}

                        {/* Institution Code (For all roles) */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                            Kode Institusi <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="KODE-INSTITUSI"
                              value={institutionCode}
                              onChange={(e) => setInstitutionCode(e.target.value)}
                              className={inputClass(institutionCodeHasError)}
                            />
                          </div>
                          {institutionCodeHasError && errorState?.type === 'field' ? (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle size={14} />
                              {errorState?.message}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 mt-0.5">Wajib diisi dengan kode yang diberikan oleh Admin Sekolah Siswa.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* If Login: fields are rendered in a simple flex column */}
                {isLogin && (
                  <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                        Username atau Email
                      </label>
                      <div className="relative">
                        <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${usernameHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                        <input
                          type="text"
                          placeholder="siswa@gmail.com"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                            if (errorState) clearError();
                          }}
                          className={inputClass(usernameHasError)}
                        />
                      </div>
                      {usernameHasError && errorState?.type === 'field' && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle size={14} />
                          {errorState?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                        Password
                      </label>
                      <div className="relative">
                        <Key size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${passwordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorState) clearError();
                          }}
                          className={`${inputClass(passwordHasError)} pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-xl transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordHasError && errorState?.type === 'field' && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle size={14} />
                          {errorState?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs text-[#64748B] dark:text-gray-300 font-medium group-hover:text-[#0F172A] dark:text-gray-200 transition-colors select-none">
                          Ingat saya
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleTabSwitch('forgot-password')}
                        className="text-xs font-bold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        Lupa Password?
                      </button>
                    </div>
                  </div>
                )}

                {isForgotPassword && (
                  <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">
                        Email
                      </label>
                      <div className="relative">
                        <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${errorState?.type === 'field' ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                        <input
                          type="email"
                          placeholder="siswa@gmail.com"
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

                {/* Submit Section */}
                <div className="mt-4 flex flex-col gap-4">
                  {isRegister && (
                    <label className="flex items-start gap-3 cursor-pointer group p-3 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 dark:text-gray-300 font-medium leading-tight">
                        Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi yang berlaku untuk penggunaan NeboTrack.
                      </span>
                    </label>
                  )}

                  {!isForgotPassword && (
                    <div className="flex justify-center w-full overflow-hidden">
                      <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => {
                          setCaptchaToken(token);
                          if (errorState && errorState.message === 'Silakan verifikasi CAPTCHA.') {
                            clearError();
                          }
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (isRegister && !agreedToTerms)}
                    className="w-full min-h-[52px] bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 active:bg-blue-800 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>{isLogin ? 'Signing in...' : isRegister ? 'Mendaftar...' : 'Memproses...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? 'Masuk Sekarang' : isRegister ? 'Daftar Sekarang' : 'Kirim Tautan Reset'}</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                {/* Bottom Links */}
                {!isForgotPassword && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                      {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch(isLogin ? 'register' : 'login')}
                        className="text-primary font-bold hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {isLogin ? 'Daftar' : 'Masuk'}
                      </button>
                    </p>
                  </div>
                )}

                {isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="w-full min-h-[52px] bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold text-sm rounded-2xl border-2 border-slate-200 dark:border-gray-700 transition-all duration-200 flex items-center justify-center cursor-pointer mt-2"
                  >
                    Kembali ke Login
                  </button>
                )}
              </form>

              {/* Success Message */}
              {successMessage && (
                <div className="mt-6 p-4 rounded-2xl border text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20">
                  <span className="shrink-0 text-green-500 mt-0.5">
                    <ShieldCheck size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-800 dark:text-green-400">
                      Berhasil
                    </p>
                    <p className="mt-1 text-green-700 dark:text-green-500">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorState && (!errorState.field || errorState.type !== 'field') && (
                <div
                  className={`mt-6 p-4 rounded-2xl border text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 ${errorState.type === 'server'
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'
                    : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                    }`}
                >
                  <span className={`shrink-0 mt-0.5 ${errorState.type === 'server' ? 'text-orange-500' : 'text-red-500'}`}>
                    <AlertCircle size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    {errorState.type === 'server' ? (
                      <>
                        <p className="font-bold text-orange-800 dark:text-orange-400">
                          Kesalahan Server
                        </p>
                        <p className="mt-1 text-orange-700 dark:text-orange-500">
                          {errorState.message}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-red-800 dark:text-red-400">
                        {errorState.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Demo Credentials Panel */}
              {isLogin && (
                <div className="mt-8 border-t-2 border-slate-100 dark:border-gray-800 pt-6">
                  <h4 className="text-[11px] font-black text-primary mb-3 flex items-center gap-1.5 uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    Akun Demo (Simulasi)
                  </h4>
                  <ul className="flex flex-col gap-2 bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-800 font-mono text-xs text-slate-500 dark:text-gray-400">
                    {[
                      { role: 'Siswa', user: 'marup', pass: 'pppppp' },
                      { role: 'Pem. Eksternal', user: 'manajer', pass: 'pppppp' },
                      { role: 'Pem. Internal', user: 'ibuguru', pass: 'pppppp' },
                      { role: 'Admin', user: 'adminnebo', pass: 'pppppp' },
                      { role: 'superadmin', user: 'superadmin', pass: 'pppppp' },
                    ].map((acc) => (
                      <li key={acc.user} className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold min-w-[100px]">{acc.role}</span>
                        <span
                          className="cursor-pointer hover:text-primary transition-colors text-slate-700 dark:text-gray-300 font-semibold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm"
                          onClick={() => {
                            setUsername(acc.user);
                            setPassword(acc.pass);
                          }}
                        >
                          {acc.user}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 mt-3 text-center font-medium">
                    Klik username untuk mengisi otomatis
                  </p>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
};
