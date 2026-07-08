'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Key, Moon, Globe, Info, LogOut, Check, ChevronRight, User } from 'lucide-react';

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
  const { currentUser, logout, updateCurrentUserName } = usePKL();
  
  // Local Settings States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('id'); // 'id' | 'en'
  
  // Edit Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(activeSection === 'profile');

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

      <div className="bg-white border-y md:border border-[#E2E8F0] md:rounded-2xl shadow-sm divide-y divide-[#E2E8F0] -mx-4 md:mx-0">
        {/* PROFILE SECTION TILE */}
        <div id="profile-section" className="flex flex-col">
          {isEditingProfile ? (
            <div className="p-4 bg-slate-50">
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#64748B] font-bold">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm focus:outline-none focus:border-[#2563EB] min-h-[48px]"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>Username</span>
                    <span className="font-semibold text-slate-700">{currentUser?.username}</span>
                  </div>
                  {currentUser?.nisn && (
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>NIS / NISN</span>
                      <span className="font-semibold text-slate-700">{currentUser.nisn}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold min-h-[48px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold min-h-[48px] shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition min-h-[64px] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <User size={18} className="text-[#2563EB]" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Profil Saya</span>
                  <span className="text-xs text-slate-500 line-clamp-1">{currentUser?.name} • {currentUser?.role.replace('_', ' ')}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          )}
        </div>

        {/* SECURITY CARD (GANTI PASSWORD) */}
        <div id="password-section" className="flex flex-col">
          {activeSection === 'password' || passwordErrorMsg || passwordSuccessMsg ? (
            <div className="p-4 bg-slate-50">
              {passwordSuccessMsg && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check size={14} className="shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}
              {passwordErrorMsg && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {passwordErrorMsg}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#64748B] font-bold">Password Lama</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm focus:outline-none focus:border-[#2563EB] min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#64748B] font-bold">Password Baru</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm focus:outline-none focus:border-[#2563EB] min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#64748B] font-bold">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 text-sm focus:outline-none focus:border-[#2563EB] min-h-[48px]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold min-h-[48px] shadow-sm mt-2"
                >
                  Perbarui Password
                </button>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => {
                const el = document.getElementById('password-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                onClearActiveSection?.();
                if(onClearActiveSection) {
                   // This is a hack, usually you'd handle state internally if it wasn't passed down
                   alert('Gunakan form password dari menu ini dengan activeSection');
                }
                // To keep it simple, we just toggle an internal state or use the props
                setPasswordErrorMsg('');
                setPasswordSuccessMsg('');
                // If it's not open, we can force it open by rendering form
                document.getElementById('password-section-form')?.classList.toggle('hidden');
              }}
              className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition min-h-[56px] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Key size={18} />
                </div>
                <span className="text-sm font-semibold text-slate-800">Ganti Password</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          )}
        </div>

        {/* DARK MODE TILE */}
        <div className="flex items-center justify-between p-4 bg-white min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Moon size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Dark Mode</span>
              <span className="text-xs text-slate-500">Gunakan tema gelap</span>
            </div>
          </div>
          <button
            onClick={handleToggleDarkMode}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${isDarkMode ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* BAHASA TILE */}
        <div className="flex items-center justify-between p-4 bg-white min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Bahasa</span>
              <span className="text-xs text-slate-500">Antarmuka aplikasi</span>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-700 font-semibold focus:outline-none focus:ring-0 text-right cursor-pointer"
          >
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* TENTANG TILE */}
        <button 
          onClick={() => alert('NeboTrack v1.0.0 (Stable)\nAplikasi monitoring dan logbook jurnal harian.')}
          className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition min-h-[56px] cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Info size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Tentang</span>
              <span className="text-xs text-slate-500">Versi & Informasi</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </button>

        {/* LOGOUT TILE */}
        <button 
          onClick={logout}
          className="flex items-center p-4 bg-white hover:bg-red-50 transition min-h-[56px] cursor-pointer text-left w-full gap-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center text-red-500 shrink-0 transition">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-semibold text-red-600">Logout</span>
        </button>
      </div>
    </div>
  );
};
