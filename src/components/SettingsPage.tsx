'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Moon, Globe, Info, LogOut, ChevronRight, User, Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { uploadBoardBackgroundAction, updateBoardBackgroundAction } from '../app/actions/pkl';
import { changePasswordAction, forgotPasswordAction } from '../app/actions/auth';
import { Key } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { Check, Palette } from 'lucide-react';

type WorkspaceTheme = 'ocean' | 'emerald' | 'purple' | 'orange' | 'red' | 'graphite' | 'midnight' | 'forest';

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
  const { currentUser, logout, updateCurrentUserName, updateCurrentUserBackground } = usePKL();
  
  const { theme, setTheme } = useTheme();
  const [workspaceTheme, setWorkspaceThemeState] = useState<WorkspaceTheme>('ocean');
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('workspace_theme') as WorkspaceTheme;
    if (saved) {
      setWorkspaceThemeState(saved);
    }
  }, []);

  const setWorkspaceTheme = (newTheme: WorkspaceTheme) => {
    setWorkspaceThemeState(newTheme);
    localStorage.setItem('workspace_theme', newTheme);
    document.documentElement.setAttribute('data-workspace-theme', newTheme);
  };
  
  // Board Background States
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBackground(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadBoardBackgroundAction(formData);
      if (result.success && result.url) {
        await updateBoardBackgroundAction(result.url);
        updateCurrentUserBackground(result.url);
      } else {
        setUploadError(result.error || 'Gagal mengunggah background.');
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setIsUploadingBackground(false);
      e.target.value = '';
    }
  };

  const handleSetBuiltinBackground = async (url: string | null) => {
    setIsUploadingBackground(true);
    setUploadError('');
    try {
      const result = await updateBoardBackgroundAction(url);
      if (result.success) {
        updateCurrentUserBackground(url);
      } else {
        setUploadError(result.error || 'Gagal mengatur background.');
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setIsUploadingBackground(false);
    }
  };

  // Edit Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(activeSection === 'profile');

  // Security States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('confirmNewPassword') + ' harus sama.' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage(null);
    const result = await changePasswordAction(oldPassword, newPassword);
    setIsChangingPassword(false);
    
    if (result.success) {
      setPasswordMessage({ type: 'success', text: t('passwordChangedSuccess') });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Terjadi kesalahan.' });
    }
  };

  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    setIsResetting(true);
    setResetMessage(null);
    
    const result = await forgotPasswordAction(currentUser.email, window.location.origin);
    setIsResetting(false);
    
    if (result.success) {
      setResetMessage({ type: 'success', text: t('resetEmailSent') });
    } else {
      if (result.error && result.error.toLowerCase().includes('rate limit')) {
        setResetMessage({ type: 'error', text: t('rateLimitError') });
      } else {
        setResetMessage({ type: 'error', text: result.error || 'Gagal mengirim email reset.' });
      }
    }
  };

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
    <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 text-[#0F172A] dark:text-gray-200 font-sans pb-12 animate-in fade-in duration-300">
      
      {/* HEADER SETTINGS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10 border border-slate-200/60 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-2">
              <span className="text-4xl">⚙️</span> Pengaturan
            </h1>
            <p className="text-slate-500 dark:text-gray-400 font-medium">
              Kelola preferensi akun dan tampilan aplikasi Anda.
            </p>
          </div>
          {onBackToBoard && (
            <button
              onClick={onBackToBoard}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-700 dark:text-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:scale-[1.02]"
            >
              {t('backToBoard')}
            </button>
          )}
        </div>
      </div>

      {/* GRID FOR CARDS */}
      <div className="grid grid-cols-1 gap-6 md:gap-8">
        
        {/* PROFILE HERO CARD */}
        <div id="profile-section" className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4 shrink-0 mx-auto md:mx-0">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                  {currentUser?.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-primary/50" />
                  )}
                </div>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-500/20">
                    {currentUser?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{currentUser?.name}</h2>
                  <p className="text-slate-500 dark:text-gray-400 font-medium">{currentUser?.email || 'Email belum diatur'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                    <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Status Akun</span>
                    <span className="font-semibold text-slate-700 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Aktif
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                    <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Tanggal Bergabung</span>
                    <span className="font-semibold text-slate-700 dark:text-gray-200">
                      {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                    <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Username</span>
                    <span className="font-semibold text-slate-700 dark:text-gray-200">@{currentUser?.username}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                    <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Asal {currentUser?.role === 'siswa' || currentUser?.role === 'pembimbing_internal' ? 'Sekolah' : 'Instansi'}</span>
                    <span className="font-semibold text-slate-700 dark:text-gray-200">{currentUser?.school || currentUser?.company || currentUser?.companyName || '-'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2">
                  <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                    {isEditingProfile ? 'Batal Edit Profil' : 'Edit Profil'}
                  </button>
                </div>
              </div>
            </div>

            {/* EDIT PROFILE FORM */}
            {isEditingProfile && (
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider">{t('fullName')}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('enterFullName')}
                      className="w-full bg-slate-50 dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-2">
                    <button type="submit" className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY & PASSWORD CARD */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">{t('accountSecurity')}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">Ubah password atau reset kata sandi Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/50">
              <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200">{t('changePassword')}</h4>
              
              {passwordMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('oldPassword')}
                className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPassword')}
                className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmNewPassword')}
                className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={isChangingPassword}
                className="mt-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isChangingPassword ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('changePassword')}
              </button>
            </form>

            <div className="flex flex-col gap-4 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/50">
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">{t('resetPasswordEmail')}</h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Kirim tautan reset password ke email Anda yang terdaftar jika Anda lupa kata sandi.</p>
              </div>
              
              {resetMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${resetMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                  {resetMessage.text}
                </div>
              )}

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="mt-auto w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm"
              >
                {isResetting ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('resetPasswordEmail')}
              </button>
            </div>
          </div>
        </div>

        {/* WORKSPACE THEME CARD */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Workspace Theme</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">Customize your primary accent color</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/50">
            {(
              [
                { id: 'ocean', color: '#2563EB', name: 'Ocean Blue' },
                { id: 'emerald', color: '#10B981', name: 'Emerald Green' },
                { id: 'purple', color: '#8B5CF6', name: 'Royal Purple' },
                { id: 'orange', color: '#F97316', name: 'Sunset Orange' },
                { id: 'red', color: '#EF4444', name: 'Ruby Red' },
                { id: 'graphite', color: '#475569', name: 'Graphite' },
                { id: 'midnight', color: '#1E3A8A', name: 'Midnight Blue' },
                { id: 'forest', color: '#047857', name: 'Forest Green' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setWorkspaceTheme(t.id as WorkspaceTheme)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none shadow-sm relative overflow-hidden ${workspaceTheme === t.id ? 'ring-4 ring-offset-2 ring-primary dark:ring-offset-[#1E293B] scale-110' : 'hover:ring-2 ring-offset-2 ring-slate-300 dark:ring-gray-600'}`}
                style={{ backgroundColor: t.color }}
                title={t.name}
              >
                {workspaceTheme === t.id && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Check size={24} className="text-white drop-shadow-md animate-in zoom-in duration-200" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOARD BACKGROUND CARD */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8 relative overflow-hidden">
          {isUploadingBackground && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
              <p className="font-bold text-slate-700 dark:text-gray-200">Mengunggah Background...</p>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">Board Background</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Customize your Kanban board background</p>
                </div>
              </div>
              
              {uploadError && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-xl text-sm font-bold flex items-center gap-2">
                  {uploadError}
                </div>
              )}

              <div className="flex flex-col gap-6 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                {/* Colors */}
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Solid Colors</span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleSetBuiltinBackground(null)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-105 ${!currentUser?.boardBackground ? 'border-primary shadow-md' : 'border-slate-200 dark:border-gray-600'} bg-slate-100 dark:bg-gray-800 flex items-center justify-center`}
                      title="Default"
                    >
                      {!currentUser?.boardBackground && <Check size={18} className="text-slate-600 dark:text-gray-300" />}
                    </button>
                    {(
                      [
                        { color: '#2563EB', name: 'Ocean Blue' },
                        { color: '#10B981', name: 'Emerald' },
                        { color: '#8B5CF6', name: 'Purple' },
                        { color: '#F97316', name: 'Sunset' },
                        { color: '#047857', name: 'Forest' },
                        { color: '#1E3A8A', name: 'Midnight' },
                        { color: '#475569', name: 'Slate' },
                      ] as const
                    ).map(t => (
                      <button
                        key={t.color}
                        onClick={() => handleSetBuiltinBackground(t.color)}
                        className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center relative ${currentUser?.boardBackground === t.color ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-[#1E293B] shadow-md scale-110' : 'hover:ring-2 ring-offset-1 ring-slate-300 dark:ring-gray-600 shadow-sm'}`}
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      >
                        {currentUser?.boardBackground === t.color && <Check size={18} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradients */}
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Gradients</span>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        { bg: 'linear-gradient(to right, #3b82f6, #2dd4bf)', name: 'Blue Gradient' },
                        { bg: 'linear-gradient(to right, #8b5cf6, #d946ef)', name: 'Purple Gradient' },
                        { bg: 'linear-gradient(to right, #f97316, #eab308)', name: 'Sunset Gradient' },
                        { bg: 'linear-gradient(to right, #047857, #10b981)', name: 'Forest Gradient' },
                        { bg: 'linear-gradient(to right, #1e3a8a, #8b5cf6)', name: 'Aurora Gradient' },
                      ] as const
                    ).map(t => (
                      <button
                        key={t.bg}
                        onClick={() => handleSetBuiltinBackground(t.bg)}
                        className={`w-16 h-10 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center relative ${currentUser?.boardBackground === t.bg ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-[#1E293B] shadow-md scale-105' : 'hover:ring-2 ring-offset-1 ring-slate-300 dark:ring-gray-600 shadow-sm'}`}
                        style={{ background: t.bg }}
                        title={t.name}
                      >
                        {currentUser?.boardBackground === t.bg && <Check size={18} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Upload */}
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Custom Upload</span>
                  <div className="flex gap-3">
                    <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 rounded-xl cursor-pointer transition-all shadow-sm font-bold text-sm border border-slate-200 dark:border-gray-700 hover:-translate-y-0.5">
                      <Upload size={18} />
                      Upload Gambar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleBackgroundUpload}
                        disabled={isUploadingBackground}
                      />
                    </label>
                    {currentUser?.boardBackground && (
                      <button
                        onClick={() => handleSetBuiltinBackground(null)}
                        disabled={isUploadingBackground}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 rounded-xl transition-all font-bold text-sm hover:-translate-y-0.5"
                      >
                        <Trash2 size={18} />
                        Hapus
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-gray-500 mt-2 block font-medium">
                    Mendukung format JPG, PNG, WEBP (Max 10 MB)
                  </span>
                </div>
              </div>
            </div>

            {/* Background Preview */}
            <div className="w-full lg:w-[400px] shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block mb-3 lg:mt-6">Preview Saat Ini</span>
              <div 
                className="w-full aspect-[4/3] rounded-2xl shadow-inner border-4 border-slate-50 dark:border-gray-800 bg-slate-100 dark:bg-gray-900 bg-cover bg-center bg-no-repeat overflow-hidden flex items-center justify-center relative"
                style={{ 
                  background: currentUser?.boardBackground 
                    ? (currentUser.boardBackground.startsWith('http') || currentUser.boardBackground.startsWith('/') 
                      ? `url(${currentUser.boardBackground})` 
                      : currentUser.boardBackground)
                    : undefined
                }}
              >
                {!currentUser?.boardBackground && (
                  <span className="text-slate-400 dark:text-gray-600 font-bold">Default Board</span>
                )}
                {/* Mock UI Overlay to look like a board */}
                <div className="absolute inset-4 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] rounded-xl border border-white/30 dark:border-white/10 flex gap-2 p-2">
                  <div className="w-1/3 h-full bg-white/40 dark:bg-black/40 rounded-lg p-2">
                    <div className="w-full h-4 bg-white/50 rounded mb-2"></div>
                    <div className="w-full h-12 bg-white/60 rounded mb-2"></div>
                    <div className="w-full h-16 bg-white/60 rounded"></div>
                  </div>
                  <div className="w-1/3 h-full bg-white/40 dark:bg-black/40 rounded-lg p-2">
                    <div className="w-full h-4 bg-white/50 rounded mb-2"></div>
                    <div className="w-full h-10 bg-white/60 rounded mb-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREFERENCES GRID (THEME & LANGUAGE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* THEME (DARK/LIGHT/SYSTEM) */}
          <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Moon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">{t('theme')}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">{t('themeDesc')}</p>
              </div>
            </div>
            
            <div className="mt-auto bg-slate-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-slate-100 dark:border-gray-700/50 flex">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mounted && theme === mode ? 'bg-white dark:bg-[#1E293B] shadow-sm text-primary border border-slate-200 dark:border-gray-700' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                >
                  {mode === 'light' && '☀️ Light'}
                  {mode === 'dark' && '🌙 Dark'}
                  {mode === 'system' && '💻 System'}
                </button>
              ))}
            </div>
          </div>

          {/* LANGUAGE */}
          <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">{t('language')}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">{t('languageDesc')}</p>
              </div>
            </div>

            <div className="mt-auto relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full appearance-none bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="id">🇮🇩 Indonesia (ID)</option>
                <option value="en">🇺🇸 English (EN)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                <ChevronRight size={20} className="text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEM CARDS (ABOUT & LOGOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* ABOUT CARD */}
          <button 
            onClick={() => alert(`NeboTrack v1.0.0 (Stable)\n${t('aboutDesc')}`)}
            className="group bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 p-6 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Info size={24} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">{t('about')}</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Versi aplikasi dan informasi</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </button>

          {/* LOGOUT CARD */}
          <button 
            onClick={logout}
            className="group bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 p-6 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <LogOut size={24} />
              </div>
              <div>
                <h2 className="text-base font-black text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">{t('logout')}</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 group-hover:text-slate-600 dark:group-hover:text-gray-300">Keluar dari sesi saat ini</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-red-300 dark:text-red-800 group-hover:text-red-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};