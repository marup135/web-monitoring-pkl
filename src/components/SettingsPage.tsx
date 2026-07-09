'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Moon, Globe, Info, LogOut, ChevronRight, User } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsPageProps {
  onBackToBoard?: () => void;
  activeSection?: 'profile' | null;
  onClearActiveSection?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onBackToBoard,
  activeSection,
  onClearActiveSection
}) => {
  const { currentUser, logout, updateCurrentUserName } = usePKL();
  
  // Local Settings States
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('id'); // 'id' | 'en'

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  
  // Edit Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(activeSection === 'profile');

  // Scroll to active section if specified
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSection === 'profile') {
      timer = setTimeout(() => setIsEditingProfile(true), 0);
      const el = document.getElementById('profile-section');
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

  // Theme is handled by next-themes

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200 font-sans pb-12">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-gray-700 pb-4 print:hidden">
        <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight uppercase">
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

      <div className="bg-white dark:bg-[#243447] border-y md:border border-[#E2E8F0] dark:border-gray-700 md:rounded-2xl shadow-sm divide-y divide-[#E2E8F0] -mx-4 md:mx-0">
        {/* PROFILE SECTION TILE */}
        <div id="profile-section" className="flex flex-col">
          {isEditingProfile ? (
            <div className="p-4 bg-slate-50 dark:bg-gray-800/50">
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 text-sm focus:outline-none focus:border-[#2563EB] dark:focus:border-blue-500 min-h-[48px]"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-gray-300">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                    <span>Username</span>
                    <span className="font-semibold text-slate-700">{currentUser?.username}</span>
                  </div>
                  {currentUser?.nisn && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                      <span>NIS / NISN</span>
                      <span className="font-semibold text-slate-700">{currentUser.nisn}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-[#243447] border border-slate-300 dark:border-gray-600 text-slate-700 rounded-xl text-xs font-bold min-h-[48px]"
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
              className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] hover:bg-slate-50 dark:hover:bg-[#2D435E] transition min-h-[64px] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <User size={18} className="text-[#2563EB]" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white block">Profil Saya</span>
                  <span className="text-xs text-slate-500 dark:text-gray-300 line-clamp-1">{currentUser?.name} • {currentUser?.role.replace('_', ' ')}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          )}
        </div>

        {/* DARK MODE TILE */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
              <Moon size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">Tema Tampilan</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">Pilih tema aplikasi</span>
            </div>
          </div>
          <select
            value={mounted ? theme : 'system'}
            onChange={(e) => setTheme(e.target.value)}
            disabled={!mounted}
            className="bg-transparent border-none text-sm text-slate-700 dark:text-gray-200 font-semibold focus:outline-none focus:ring-0 text-right cursor-pointer disabled:opacity-50"
          >
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
            <option value="system">📱 System</option>
          </select>
        </div>

        {/* BAHASA TILE */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">Bahasa</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">Antarmuka aplikasi</span>
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
          className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] hover:bg-slate-50 dark:hover:bg-[#2D435E] transition min-h-[56px] cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 shrink-0">
              <Info size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">Tentang</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">Versi & Informasi</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </button>

        {/* LOGOUT TILE */}
        <button 
          onClick={logout}
          className="flex items-center p-4 bg-white dark:bg-[#243447] hover:bg-red-50 dark:hover:bg-red-500/10 transition min-h-[56px] cursor-pointer text-left w-full gap-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-500 shrink-0 transition">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-semibold text-red-600 dark:text-red-500">Logout</span>
        </button>
      </div>
    </div>
  );
};
