/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
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

const PREDEFINED_CLASSES = [
  'XII PPLG 1', 'XII PPLG 2', 'XII PPLG 3',
  'XII TO 1', 'XII TO 2', 'XII TO 3',
  'XII TM 1', 'XII TM 2', 'XII TM 3',
  'XII KULINER 1', 'XII KULINER 2',
  'XII DB 1', 'XII DB 2',
  'XII MPLB 1', 'XII MPLB 2', 'XII MPLB 3',
  'XII APART', 'XII UPT',
  'XII AKL 1', 'XII AKL 2',
];

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
  field?: 'username' | 'password';
}

export const AuthPage: React.FC = () => {
  const { login, register, currentUser, companiesList } = usePKL();

  const [isLogin, setIsLogin] = useState(true);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('siswa');
  const [company, setCompany] = useState('');
  const [selectedClass, setSelectedClass] = useState('XII PPLG 1');
  const [nisn, setNisn] = useState('');

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

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
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setError = (message: string, type: AlertType = 'field', field?: 'username' | 'password') => {
    setErrorState({ message, type, field });
  };

  const clearError = () => setErrorState(null);

  const handleTabSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
    clearError();
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const cleanUsername = username.trim().toLowerCase();

    // --- Login validations ---
    if (isLogin) {
      if (!cleanUsername) {
        setError('Email wajib diisi.', 'field', 'username');
        return;
      }
      if (!password) {
        setError('Password wajib diisi.', 'field', 'password');
        return;
      }
    } else {
      // --- Register validations ---
      if (!cleanUsername) {
        setError('Email wajib diisi.', 'field', 'username');
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
        if (!selectedClass) {
          setError('Kelas wajib dipilih.', 'field');
          return;
        }
        if (!nisn.trim()) {
          setError('NIS/NISN wajib diisi.', 'field');
          return;
        }
        const cleanCompany = company.trim();
        if (!cleanCompany) {
          setError('Nama perusahaan tidak boleh kosong.', 'field');
          return;
        }
        if (cleanCompany.length < 3) {
          setError('Nama perusahaan harus terdiri dari minimal 3 karakter.', 'field');
          return;
        }
        if (cleanCompany.length > 100) {
          setError('Nama perusahaan maksimal 100 karakter.', 'field');
          return;
        }
      } else if (role === 'pembimbing_eksternal') {
        const cleanCompany = company.trim();
        if (!cleanCompany) {
          setError('Perusahaan wajib dipilih atau diisi.', 'field');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(cleanUsername, password);
        if (res.success) {
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
          } else {
            setError('Email atau password yang Anda masukkan salah.', 'credentials');
          }
        }
      } else {
        const res = await register(
          cleanUsername,
          password,
          name.trim(),
          role,
          (role === 'siswa' || role === 'pembimbing_eksternal') ? company.trim() : undefined,
          role === 'siswa' ? selectedClass : undefined,
          role === 'siswa' ? nisn.trim() : undefined
        );
        if (!res.success) {
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

  // Dynamic input border class
  const inputClass = (hasError: boolean) =>
    `w-full bg-white dark:bg-[#243447] border rounded-xl pl-10 pr-4 text-sm text-[#0F172A] dark:text-gray-200 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all duration-200 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
        : 'border-[#E2E8F0] dark:border-gray-700 focus:border-[#2563EB] focus:ring-blue-100'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] text-[#0F172A] dark:text-gray-200 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2563EB]/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/6 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-7 sm:p-9 border border-white shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-300">

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-[#2563EB]/10 blur-md scale-110" />
              <img
                src="/logo.jpg"
                alt="NeboTrack Logo"
                className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] object-contain rounded-2xl shadow-md border border-[#E2E8F0] dark:border-gray-700"
              />
            </div>
            <h1 className="text-2xl md:text-[28px] font-black text-[#0F172A] dark:text-white tracking-tight">
              NeboTrack
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium mt-1.5 text-center leading-relaxed max-w-[240px]">
              SMKN 1 Bojong · Monitoring & Logbook PKL
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-[#F1F5F9] dark:bg-gray-800 p-1 rounded-2xl mb-6 border border-[#E2E8F0] dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleTabSwitch(true)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-white dark:bg-[#243447] text-[#2563EB] shadow-sm border border-[#E2E8F0] dark:border-gray-700'
                  : 'text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch(false)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-white dark:bg-[#243447] text-[#2563EB] shadow-sm border border-[#E2E8F0] dark:border-gray-700'
                  : 'text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
              }`}
            >
              Daftar Baru
            </button>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* If Register: wrap fields in a grid */}
            {!isLogin && (
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
                        if (errorState?.type === 'field') clearError();
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
                        if (errorState?.type === 'field') clearError();
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

                {/* Role Dropdown */}
                <div className="flex flex-col gap-1.5 relative" ref={roleDropdownRef}>
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Peran (Role)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 text-left flex justify-between items-center focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all"
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
                              ? 'bg-[#2563EB]/8 text-[#2563EB] font-semibold'
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
            {!isLogin && role === 'siswa' && (
              <>
                {/* Kelas Dropdown */}
                <div
                  className="flex flex-col gap-1.5 relative"
                  ref={classDropdownRef}
                >
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Pilih Kelas
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 text-left flex justify-between items-center focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all"
                  >
                    <span>{selectedClass || 'Pilih kelas...'}</span>
                    <ChevronDown
                      size={14}
                      className={`text-[#94A3B8] transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isClassDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[160px] overflow-y-auto">
                      {PREDEFINED_CLASSES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedClass(c);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F1F5F9] dark:bg-gray-800 transition duration-150 block cursor-pointer ${
                            selectedClass === c
                              ? 'bg-[#2563EB]/8 text-[#2563EB] font-semibold'
                              : 'text-[#0F172A] dark:text-gray-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* NIS / NISN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    NIS / NISN
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Contoh: 222310123"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>

                {/* Perusahaan PKL (Text) */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                    Perusahaan PKL
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Contoh: PT Telkom Indonesia..."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Eksternal-specific fields — Register Only */}
            {!isLogin && role === 'pembimbing_eksternal' && (
              <div
                className="flex flex-col gap-1.5 relative md:col-span-2"
                ref={companyDropdownRef}
              >
                <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                  Pilih Perusahaan
                </label>
                <button
                  type="button"
                  onClick={() => setIsCompanyDropdownOpen((prev) => !prev)}
                  className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 text-left flex justify-between items-center focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all"
                >
                  <span>{company || 'Pilih perusahaan...'}</span>
                  <ChevronDown
                    size={14}
                    className={`text-[#94A3B8] transition-transform duration-200 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isCompanyDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[160px] overflow-y-auto">
                    {companiesList && companiesList.length > 0 ? (
                      companiesList.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCompany(c.name);
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F1F5F9] dark:bg-gray-800 transition duration-150 block cursor-pointer ${
                            company === c.name
                              ? 'bg-[#2563EB]/8 text-[#2563EB] font-semibold'
                              : 'text-[#0F172A] dark:text-gray-200'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-500 text-center">Belum ada perusahaan</div>
                    )}
                  </div>
                )}
              </div>
            )}
              </div>
            )}

            {/* If Login: fields are rendered in a simple flex column */}
            {isLogin && (
              <>
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
                        if (errorState?.type === 'field') clearError();
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
                        if (errorState?.type === 'field') clearError();
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

                {/* Remember Me */}
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium group-hover:text-[#0F172A] dark:text-gray-200 transition-colors select-none">
                      Ingat saya
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 min-h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Mendaftar...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Masuk' : 'Daftar Sekarang'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Error Alert — moved below the form! */}
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
                <p className={`font-bold text-[13px] ${errorState.type === 'server' ? 'text-orange-800' : 'text-red-800'}`}>
                  {errorState.type === 'server' ? 'Kesalahan Server' : 'Username / Password Salah'}
                </p>
                <p className={`mt-1 leading-snug ${errorState.type === 'server' ? 'text-orange-700' : 'text-red-700'}`}>
                  {errorState.message}
                </p>
              </div>
            </div>
          )}

          {/* Demo Credentials Panel */}
          {isLogin && (
            <div className="mt-7 border-t border-[#F1F5F9] pt-6">
              <h4 className="text-[10px] font-bold text-[#2563EB] mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
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
                      className="cursor-pointer hover:text-[#2563EB] transition-colors"
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
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#94A3B8] mt-5 font-medium">
          © 2026 NeboTrack · SMKN 1 Bojong
        </p>
      </div>
    </div>
  );
};