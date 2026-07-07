'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { Building2, User, Key, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';

const PREDEFINED_CLASSES = [
  'XII PPLG 1', 'XII PPLG 2', 'XII PPLG 3',
  'XII TO 1', 'XII TO 2', 'XII TO 3',
  'XII TM 1', 'XII TM 2', 'XII TM 3',
  'XII KULINER 1', 'XII KULINER 2',
  'XII DB 1', 'XII DB 2',
  'XII MPLB 1', 'XII MPLB 2', 'XII MPLB 3',
  'XII APART', 'XII UPT',
  'XII AKL 1', 'XII AKL 2'
];

const ROLES = [
  { value: 'siswa', label: 'Siswa PKL' },
  { value: 'pembimbing_internal', label: 'Pembimbing Internal (Sekolah)' },
  { value: 'pembimbing_eksternal', label: 'Pembimbing Eksternal (Perusahaan)' }
];

export const AuthPage: React.FC = () => {
  const { login, register } = usePKL();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('siswa'); // 'siswa' | 'pembimbing_internal' | 'pembimbing_eksternal'
  const [company, setCompany] = useState('');
  const [selectedClass, setSelectedClass] = useState('XII PPLG 1');
  const [nisn, setNisn] = useState('');

  // Dropdown Custom States
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika klik di luar area masing-masing dropdown
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError('Username harus terdiri dari minimal 3 karakter.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username hanya boleh terdiri dari huruf, angka, garis bawah (_), atau strip (-).');
      return;
    }
    if (password.length < 6) {
      setError('Password harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (!isLogin) {
      const cleanName = name.trim();
      if (cleanName.length < 3) {
        setError('Nama lengkap harus terdiri dari minimal 3 karakter.');
        return;
      }
      if (!/^[a-zA-Z\s.,']+$/.test(cleanName)) {
        setError('Nama lengkap hanya boleh mengandung huruf, spasi, titik, koma, atau tanda petik.');
        return;
      }
      if (role === 'siswa') {
        if (!selectedClass) {
          setError('Kelas wajib dipilih.');
          return;
        }
        if (!nisn.trim()) {
          setError('NIS/NISN wajib diisi.');
          return;
        }
        const cleanCompany = company.trim();
        if (!cleanCompany) {
          setError('Nama perusahaan tidak boleh kosong.');
          return;
        }
        if (cleanCompany.length < 3) {
          setError('Nama perusahaan harus terdiri dari minimal 3 karakter.');
          return;
        }
        if (cleanCompany.length > 100) {
          setError('Nama perusahaan maksimal 100 karakter.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(cleanUsername, password);
        if (!res.success) {
          setError(res.error || 'Username atau password salah.');
        }
      } else {
        const res = await register(
          cleanUsername,
          password,
          name.trim(),
          role,
          role === 'siswa' ? company.trim() : undefined,
          role === 'siswa' ? selectedClass : undefined,
          role === 'siswa' ? nisn.trim() : undefined
        );
        if (!res.success) {
          setError(res.error || 'Gagal melakukan pendaftaran.');
        }
      }
    } catch {
      setError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Mencari label peran saat ini untuk ditampilkan di tombol
  const currentRoleLabel = ROLES.find(r => r.value === role)?.label || 'Pilih peran...';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden font-sans">
      {/* Soft background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2563EB]/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="NeboTrack Logo"
            className="w-[100px] h-[100px] object-contain rounded-2xl mb-4 shadow-sm border border-[#E2E8F0]"
          />
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            NeboTrack
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1 text-center max-w-[280px]">
            SMKN 1 Bojong - Monitoring & Logbook Harian PKL
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-6 border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
              isLogin ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
              !isLogin ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-[#EF4444] text-xs font-medium leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name (For Register Only) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Custom Dropdown Peran (Role) - For Register Only */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5 relative" ref={roleDropdownRef}>
              <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Peran (Role)</label>
              
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] text-left flex justify-between items-center focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <span>{currentRoleLabel}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F1F5F9] transition duration-150 block cursor-pointer ${
                        role === r.value ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold' : 'text-[#0F172A]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- KHUSUS FORM SISWA (Hanya Muncul Jika Register & Role === siswa) --- */}
          {!isLogin && role === 'siswa' && (
            <>
              {/* Custom Dropdown Kelas - Terbatas & Bisa Scroll */}
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200 relative" ref={classDropdownRef}>
                <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Pilih Kelas</label>
                
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] text-left flex justify-between items-center focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
                >
                  <span>{selectedClass || 'Pilih kelas...'}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isClassDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 max-h-[140px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                    {PREDEFINED_CLASSES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedClass(c);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F1F5F9] transition duration-150 block cursor-pointer ${
                          selectedClass === c ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold' : 'text-[#0F172A]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* NIS / NISN Input */}
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">NIS / NISN</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 222310123"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Perusahaan PKL */}
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Perusahaan PKL</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Telkom Indonesia, PT Astra International, PLN, dsb..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition duration-200 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar Sekarang'}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        {isLogin && (
          <div className="mt-8 border-t border-[#E2E8F0] pt-6 text-[10px] text-[#64748B]">
            <h4 className="font-semibold text-[#2563EB] mb-2 flex items-center gap-1">
              <ShieldCheck size={12} />
              Akun Simulasi (Demo Credentials):
            </h4>
            <ul className="flex flex-col gap-1 bg-[#F1F5F9] p-3 rounded-xl border border-[#E2E8F0] font-mono">
              <li>
                <span className="text-gray-600 font-semibold">Siswa:</span> marup / pppppp
              </li>
              <li>
                <span className="text-gray-600 font-semibold">Pem. Eksternal:</span> manajer / pppppp
              </li>
              <li>
                <span className="text-gray-600 font-semibold">Pem. Internal:</span> ibuguru / pppppp
              </li>
              <li>
                <span className="text-gray-600 font-semibold">Admin:</span> admin / pppppp
              </li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};