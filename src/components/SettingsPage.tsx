'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Key, Moon, Globe, Info, Shield, LogOut, Check, ChevronRight } from 'lucide-react';

interface SettingsPageProps {
  onBackToBoard?: () => void;
  activeSection?: 'profile' | 'password' | null;
  onClearActiveSection?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onBackToBoard,
  activeSection,
  onClearActiveSection
}) => {
  const { currentUser, logout, state, updateCurrentUserName } = usePKL();
  
  // Local Settings States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('id'); // 'id' | 'en'
  
  // Edit Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(activeSection === 'profile');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Scroll to active section if specified
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSection === 'profile') {
      timer = setTimeout(() => setIsEditingProfile(true), 0);
      const el = document.getElementById('profile-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (activeSection === 'password') {
      const el = document.getElementById('password-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    // Clear the parameter after scrolling
    if (activeSection && onClearActiveSection) {
      onClearActiveSection();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeSection, onClearActiveSection]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Update name in context safely
    if (updateCurrentUserName) {
      updateCurrentUserName(name.trim());
    }
    setProfileSuccessMsg('Profil berhasil diperbarui!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
    setIsEditingProfile(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg('Semua kolom password wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    // Success simulation
    setPasswordSuccessMsg('Password berhasil diperbarui!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccessMsg(''), 3500);
  };

  // Toggle Dark Mode cosmetically
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] font-sans pb-12">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 print:hidden">
        <h2 className="text-lg font-black text-[#0F172A] tracking-tight uppercase">
          Pengaturan Aplikasi
        </h2>
        {onBackToBoard && (
          <button
            onClick={onBackToBoard}
            className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer min-h-[44px] px-2 flex items-center justify-center"
          >
            Kembali ke Board
          </button>
        )}
      </div>

      {/* 1. PROFILE SECTION CARD */}
      <div id="profile-section" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-800 text-sm truncate">{currentUser?.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{currentUser?.role.replace('_', ' ')}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.username}@nebotrack.com</p>
          </div>
        </div>

        {profileSuccessMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check size={14} className="shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        <hr className="border-[#E2E8F0]" />

        {isEditingProfile ? (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] min-h-[48px] py-3"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Username</span>
                <span className="font-semibold text-slate-700">{currentUser?.username}</span>
              </div>
              {currentUser?.nisn && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>NIS / NISN</span>
                  <span className="font-semibold text-slate-700">{currentUser.nisn}</span>
                </div>
              )}
              {state.companyName && state.companyName !== '-' && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Perusahaan PKL</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{state.companyName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 px-4 py-3 bg-white border border-[#E2E8F0] text-slate-700 rounded-xl text-xs font-bold min-h-[48px] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold min-h-[48px] shadow-sm transition cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span>Username</span>
                <span className="font-medium text-slate-700">{currentUser?.username}</span>
              </div>
              {currentUser?.nisn && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span>NIS / NISN</span>
                  <span className="font-medium text-slate-700">{currentUser.nisn}</span>
                </div>
              )}
              {state.companyName && state.companyName !== '-' && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span>Perusahaan PKL</span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{state.companyName}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold min-h-[48px] transition cursor-pointer"
            >
              Edit Profil
            </button>
          </div>
        )}
      </div>

      {/* 2. SECURITY CARD (GANTI PASSWORD) */}
      <div id="password-section" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#2563EB]">
          <Key size={18} />
          <h3 className="font-bold text-slate-800 text-sm">Ganti Password</h3>
        </div>

        {passwordSuccessMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check size={14} className="shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            {passwordErrorMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Password Lama</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] min-h-[48px] py-3"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Password Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password minimal 6 karakter..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] min-h-[48px] py-3"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] min-h-[48px] py-3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold min-h-[48px] shadow-sm transition cursor-pointer"
          >
            Perbarui Password
          </button>
        </form>
      </div>

      {/* 3. APP PREFERENCES CARD (DARK MODE & LANGUAGE) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#2563EB]">
          <Globe size={18} />
          <h3 className="font-bold text-slate-800 text-sm">Preferensi Aplikasi</h3>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Moon size={18} className="text-slate-500" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Dark Mode</span>
              <span className="text-[10px] text-slate-400">Gunakan tema gelap</span>
            </div>
          </div>
          <button
            onClick={handleToggleDarkMode}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <hr className="border-slate-100" />

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Globe size={18} className="text-slate-500" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Bahasa</span>
              <span className="text-[10px] text-slate-400">Atur bahasa antarmuka</span>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs p-2 text-slate-700 font-bold focus:outline-none focus:border-[#2563EB] min-h-[40px]"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* 4. ABOUT & INFO CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#2563EB]">
          <Info size={18} />
          <h3 className="font-bold text-slate-800 text-sm">Tentang NeboTrack</h3>
        </div>

        <div className="text-xs text-slate-600 leading-relaxed">
          <p className="mb-2">
            <strong>NeboTrack</strong> adalah aplikasi monitoring dan logbook jurnal harian untuk program Praktek Kerja Lapangan (PKL) siswa SMKN 1 Bojong.
          </p>
          <p>
            Mempermudah komunikasi dan evaluasi berkala antara siswa, mentor perusahaan (eksternal), dan guru pembimbing (internal).
          </p>
        </div>

        <hr className="border-slate-100" />

        <div className="flex flex-col gap-2.5 text-xs text-slate-500">
          <div className="flex justify-between items-center py-1">
            <span>Versi Aplikasi</span>
            <span className="font-bold text-slate-700">v1.0.0 (Stable)</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-slate-400" />
              <span>Kebijakan Privasi</span>
            </div>
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                alert("Kebijakan Privasi:\nData jurnal Anda disimpan dengan aman dan hanya dapat diakses oleh Anda, Mentor PKL, Guru Pembimbing, dan Administrator sekolah.");
              }}
              className="text-[#2563EB] font-bold hover:underline flex items-center"
            >
              <span>Lihat Detail</span>
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* 5. LOGOUT BUTTON CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50/50 hover:bg-red-50 border border-red-200 hover:border-red-300 text-[#EF4444] rounded-xl text-sm font-bold min-h-[48px] transition cursor-pointer"
        >
          <LogOut size={16} />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
};
