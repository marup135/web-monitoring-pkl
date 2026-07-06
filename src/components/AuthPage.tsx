'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { GraduationCap, Building2, User, Key, ArrowRight, ShieldCheck } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(username, password);
        if (!res.success) {
          setError(res.error || 'Username atau password salah.');
        }
      } else {
        if (!name.trim()) {
          setError('Nama lengkap wajib diisi.');
          setLoading(false);
          return;
        }
        const res = await register(username, password, name, role, company);
        if (!res.success) {
          setError(res.error || 'Gagal melakukan pendaftaran.');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
            TelTrack Nebo
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-1 text-center max-w-[280px]">
            SMKN 1 BOJONG - Telkom Tracking & Logbook PKL
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-black/20 p-1 rounded-xl mb-6 border border-white/5">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
              isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Masuk Akun
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
              !isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name (For Register Only) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/2 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full bg-white/2 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/2 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Role (For Register Only) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Peran (Role)</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="siswa">Siswa PKL</option>
                  <option value="pembimbing_eksternal">Pembimbing Eksternal (Perusahaan)</option>
                  <option value="pembimbing_internal">Pembimbing Internal (Sekolah)</option>
                </select>
              </div>
            </div>
          )}

          {/* Company (For Siswa / Pembimbing Eksternal Register) */}
          {!isLogin && (role === 'siswa' || role === 'pembimbing_eksternal') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Nama Perusahaan (Tempat PKL)</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Telkom Indonesia, dsb..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-white/2 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar Sekarang'}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        {isLogin && (
          <div className="mt-8 border-t border-white/5 pt-6 text-[10px] text-gray-400">
            <h4 className="font-semibold text-indigo-400 mb-2 flex items-center gap-1">
              <ShieldCheck size={12} />
              Akun Simulasi (Demo Credentials):
            </h4>
            <ul className="flex flex-col gap-1 bg-white/2 p-3 rounded-xl border border-white/5 font-mono">
              <li>
                <span className="text-gray-300 font-semibold">Siswa:</span> siswa / siswa
              </li>
              <li>
                <span className="text-gray-300 font-semibold">Pem. Eksternal:</span> mentor / mentor
              </li>
              <li>
                <span className="text-gray-300 font-semibold">Pem. Internal:</span> dosen / dosen
              </li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};
