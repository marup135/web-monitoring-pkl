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
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200 font-sans pb-12">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-gray-700 pb-4 print:hidden">
        <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight uppercase">
          {t('appSettings')}
        </h2>
        {onBackToBoard && (
          <button
            onClick={onBackToBoard}
            className="text-xs font-bold text-primary hover:underline cursor-pointer min-h-[44px] px-2 flex items-center justify-center"
          >
            {t('backToBoard')}
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
                  <label className="text-xs text-[#64748B] dark:text-gray-300 font-bold">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('enterFullName')}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 text-sm focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px]"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-gray-300">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                    <span>Email</span>
                    <span className="font-semibold text-slate-700">{currentUser?.email || 'Belum diatur'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                    <span>{t('username')}</span>
                    <span className="font-semibold text-slate-700">{currentUser?.username}</span>
                  </div>
                  {currentUser?.nisn && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                      <span>{t('nisNisn')}</span>
                      <span className="font-semibold text-slate-700">{currentUser.nisn}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                    <span>{t('role')}</span>
                    <span className="font-semibold text-slate-700 capitalize">{currentUser?.role?.replace('_', ' ')}</span>
                  </div>
                  {currentUser?.school && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                      <span>{t('school')}</span>
                      <span className="font-semibold text-slate-700">{currentUser.school}</span>
                    </div>
                  )}
                  {currentUser?.company && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-700">
                      <span>{t('company')}</span>
                      <span className="font-semibold text-slate-700">{currentUser.company}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-[#243447] border border-slate-300 dark:border-gray-600 text-slate-700 rounded-xl text-xs font-bold min-h-[48px]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold min-h-[48px] shadow-sm"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>

              {/* KEAMANAN AKUN SECTION */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Key size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{t('accountSecurity')}</h3>
                </div>

                {/* Ubah Password Form */}
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3 mb-6 bg-white dark:bg-[#243447] p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">{t('changePassword')}</h4>
                  
                  {passwordMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t('oldPassword')}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('newPassword')}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmNewPassword')}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Memproses...' : t('changePassword')}
                  </button>
                </form>

                {/* Reset Password Button */}
                <div className="flex flex-col gap-3 bg-white dark:bg-[#243447] p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">{t('resetPasswordEmail')}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400">Kirim tautan reset password ke email Anda yang terdaftar.</p>
                  </div>
                  
                  {resetMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {resetMessage.text}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {isResetting ? 'Mengirim...' : t('resetPasswordEmail')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] hover:bg-slate-50 dark:hover:bg-[#2D435E] transition min-h-[64px] cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white block">{t('myProfile')}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-300 line-clamp-1">{currentUser?.name} • {currentUser?.role.replace('_', ' ')}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          )}
        </div>

        {/* WORKSPACE THEME TILE */}
        <div className="flex flex-col p-4 bg-white dark:bg-[#243447] min-h-[56px]">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
              <Palette size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">Workspace Theme</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">Customize your primary accent color</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap pl-14">
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
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ring-2 ring-transparent ring-offset-2 dark:ring-offset-[#243447] focus-visible:ring-primary"
                style={{ backgroundColor: t.color }}
                title={t.name}
              >
                {workspaceTheme === t.id && <Check size={16} className="text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

        {/* BOARD BACKGROUND TILE */}
        <div className="flex flex-col p-4 bg-white dark:bg-[#243447] min-h-[56px] relative">
          {isUploadingBackground && (
            <div className="absolute inset-0 bg-white/50 dark:bg-[#243447]/50 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          )}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
              <ImageIcon size={18} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">Board Background</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">Customize your Kanban board background</span>
            </div>
            {currentUser?.boardBackground && (
              <div 
                className="w-12 h-8 rounded shadow-sm border border-slate-200 dark:border-gray-700 bg-cover bg-center"
                style={{ 
                  background: currentUser.boardBackground.startsWith('http') || currentUser.boardBackground.startsWith('/') 
                    ? `url(${currentUser.boardBackground})` 
                    : currentUser.boardBackground
                }}
              />
            )}
          </div>
          
          {uploadError && (
            <div className="mb-3 pl-14 text-xs text-red-500 font-medium">
              {uploadError}
            </div>
          )}

          <div className="pl-14 flex flex-col gap-4">
            {/* Colors */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2 block">Solid Colors</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetBuiltinBackground(null)}
                  className={`w-8 h-8 rounded border-2 ${!currentUser?.boardBackground ? 'border-primary' : 'border-transparent'} bg-slate-100 dark:bg-gray-800 flex items-center justify-center hover:opacity-80 transition`}
                  title="Default"
                >
                  {!currentUser?.boardBackground && <Check size={16} className="text-slate-600 dark:text-gray-300" />}
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
                    className={`w-8 h-8 rounded border-2 ${currentUser?.boardBackground === t.color ? 'border-white ring-2 ring-primary' : 'border-transparent'} hover:opacity-80 transition flex items-center justify-center`}
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                  >
                    {currentUser?.boardBackground === t.color && <Check size={16} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradients */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2 block">Gradients</span>
              <div className="flex flex-wrap gap-2">
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
                    className={`w-12 h-8 rounded border-2 ${currentUser?.boardBackground === t.bg ? 'border-white ring-2 ring-primary' : 'border-transparent'} hover:opacity-80 transition flex items-center justify-center`}
                    style={{ background: t.bg }}
                    title={t.name}
                  >
                    {currentUser?.boardBackground === t.bg && <Check size={16} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2 block">Custom Upload</span>
              <div className="flex gap-2">
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 rounded cursor-pointer transition text-xs font-medium border border-slate-200 dark:border-gray-700">
                  <Upload size={14} />
                  Upload Background
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
                    className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-xs font-medium border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 block">
                JPG, PNG, WEBP (Max 10 MB)
              </span>
            </div>
          </div>
        </div>

        {/* DARK MODE TILE */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
              <Moon size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">{t('theme')}</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">{t('themeDesc')}</span>
            </div>
          </div>
          <select
            value={mounted ? theme : 'system'}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-700 dark:text-gray-200 font-semibold focus:outline-none focus:ring-0 text-right cursor-pointer"
          >
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
            <option value="system">{t('system')}</option>
          </select>
        </div>

        {/* BAHASA TILE */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] min-h-[56px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
              <Globe size={18} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{t('language')}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 max-w-[200px] leading-tight">
                {t('languageDesc')}
              </span>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-none text-sm text-slate-500 dark:text-gray-400 font-semibold focus:outline-none focus:ring-0 text-right cursor-pointer shrink-0"
          >
            <option value="id">🇮🇩 Indonesia</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        {/* TENTANG TILE */}
        <button 
          onClick={() => alert(`InternTrack v1.0.0 (Stable)\n${t('aboutDesc')}`)}
          className="flex items-center justify-between p-4 bg-white dark:bg-[#243447] hover:bg-slate-50 dark:hover:bg-[#2D435E] transition min-h-[56px] cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-600 shrink-0">
              <Info size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">{t('about')}</span>
              <span className="text-xs text-slate-500 dark:text-gray-300">{t('aboutDesc')}</span>
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
          <span className="text-sm font-semibold text-red-600 dark:text-red-500">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};
