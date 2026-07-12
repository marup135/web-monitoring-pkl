'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Moon, Globe, Info, LogOut, ChevronRight, User, Image as ImageIcon, Upload, Trash2, Loader2, Key, Check, Palette, Shield, Settings, ArrowLeft, HelpCircle, Clock, Camera, Mail, Briefcase, GraduationCap, Hash } from 'lucide-react';
import { useTheme } from 'next-themes';
import { uploadBoardBackgroundAction, updateBoardBackgroundAction } from '../app/actions/pkl';
import { changePasswordAction, forgotPasswordAction } from '../app/actions/auth';
import { updateProfileInfoAction, uploadProfileImageAction } from '../app/actions/profile';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

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
  const { state, currentUser, logout, updateCurrentUserName, updateCurrentUserBackground, updateProfileContext } = usePKL();
  
  const { theme, setTheme } = useTheme();
  const [workspaceTheme, setWorkspaceThemeState] = useState<WorkspaceTheme>('ocean');
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Layout States
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'preferences' | 'about'>('profile');
  const [selectedMobileTab, setSelectedMobileTab] = useState<'profile' | 'security' | 'appearance' | 'preferences' | 'about' | null>(null);

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

  // Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(activeSection === 'profile');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const profileFileInputRef = React.useRef<HTMLInputElement>(null);

  // Extra Fields
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  React.useEffect(() => {
    if (currentUser?.id) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      const savedExtrasStr = localStorage.getItem(`profile_extras_${currentUser.id}`);
      if (savedExtrasStr) {
        try {
          const parsed = JSON.parse(savedExtrasStr);
          setPhone(parsed.phone || '');
          setGender(parsed.gender || '');
          setDob(parsed.dob || '');
          setAddress(parsed.address || '');
          setBio(parsed.bio || '');
        } catch(e) {}
      }
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setIsSavingProfile(true);
    
    try {
      // Save Extras to LocalStorage
      if (currentUser?.id) {
        localStorage.setItem(`profile_extras_${currentUser.id}`, JSON.stringify({
          phone, gender, dob, address, bio
        }));
      }

      // API Call for Database fields
      const res = await updateProfileInfoAction(name.trim(), email.trim());
      if (res.success) {
        updateProfileContext({ name: name.trim(), email: email.trim() });
        setProfileSuccessMsg('Profil berhasil diperbarui');
        setIsEditingProfile(false);
      } else {
        setProfileErrorMsg(res.error || 'Gagal mengupdate profil');
      }
    } catch (err) {
      setProfileErrorMsg('Terjadi kesalahan pada server');
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    }
  };

  const handleUploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setIsUploadingProfileImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadProfileImageAction(formData);
      if (res.success && res.profileImage) {
        updateProfileContext({ profileImage: res.profileImage });
        setProfileSuccessMsg('Foto profil berhasil diperbarui');
      } else {
        setProfileErrorMsg(res.error || 'Gagal mengunggah foto');
      }
    } catch (err) {
      setProfileErrorMsg('Terjadi kesalahan pada server');
    } finally {
      setIsUploadingProfileImage(false);
      if (profileFileInputRef.current) {
        profileFileInputRef.current.value = '';
      }
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    }
  };

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
      setActiveTab('profile');
      setSelectedMobileTab('profile');
      timer = setTimeout(() => setIsEditingProfile(true), 0);
    }
    if (activeSection && onClearActiveSection) {
      onClearActiveSection();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeSection, onClearActiveSection]);



  const tabs = [
    { id: 'profile', label: t('profile'), icon: User, desc: t('manageProfile') },
    { id: 'security', label: t('accountSecurity'), icon: Shield, desc: t('passwordAuth') },
    { id: 'appearance', label: t('appearance'), icon: Palette, desc: t('themeAndBackground') },
    { id: 'preferences', label: t('preferences'), icon: Settings, desc: t('languageRegion') },
    { id: 'about', label: 'Tentang', icon: Info, desc: t('appInfo') }
  ];

  const renderProfileTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {profileSuccessMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-sm font-bold">
          <Check size={18} />
          {profileSuccessMsg}
        </div>
      )}
      {profileErrorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold">
          {profileErrorMsg}
        </div>
      )}

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 md:p-8">
        
        {!isEditingProfile ? (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* View Avatar */}
            <div className="flex flex-col items-center gap-4 shrink-0 mx-auto md:mx-0">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-gray-700 shadow-sm bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                {currentUser?.profileImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300 dark:text-gray-600" />
                )}
              </div>
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-500/20">
                  {currentUser?.role?.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setIsEditingProfile(true)} className="mt-2 px-5 py-2.5 w-full bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200">
                {t('editProfile')}
              </button>
            </div>

            {/* View Details */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('fullName')}</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                  <User size={18} className="text-slate-400" />
                  <span className="font-semibold">{currentUser?.name}</span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Email</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                  <Mail size={18} className="text-slate-400" />
                  <span className="font-semibold">{currentUser?.email || '-'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Username</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50/50 dark:bg-gray-800/30 opacity-70">
                  <span className="text-slate-400 font-bold">@</span>
                  <span className="font-semibold text-slate-600 dark:text-gray-300">{currentUser?.username}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('companyOrigin')}</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                  <Briefcase size={18} className="text-slate-400" />
                  <span className="font-semibold">{state?.companyName || currentUser?.companyName || currentUser?.school || currentUser?.company || '-'}</span>
                </div>
              </div>

              {currentUser?.role === 'siswa' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Kelas / Program Studi</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                      <GraduationCap size={18} className="text-slate-400" />
                      <span className="font-semibold">{currentUser?.classes?.[0]?.name || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">NIS / NISN</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                      <Hash size={18} className="text-slate-400" />
                      <span className="font-semibold">{state?.nisn || currentUser?.nisn || '-'}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Extras */}
              {phone && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nomor HP</label>
                  <div className="px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50 font-semibold">
                    {phone}
                  </div>
                </div>
              )}
              {bio && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tentang Saya (Bio)</label>
                  <div className="px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50 font-semibold whitespace-pre-wrap">
                    {bio}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Edit Profil</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-xl text-sm font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSavingProfile} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center gap-2">
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : null}
                  {t('save')}
                </button>
              </div>
            </div>

            {/* Edit Avatar */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-gray-700 shadow-md bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                  {currentUser?.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300 dark:text-gray-600" />
                  )}
                  {isUploadingProfileImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 size={32} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  ref={profileFileInputRef} 
                  onChange={handleUploadProfileImage}
                />
                <button 
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  disabled={isUploadingProfileImage}
                  className="absolute bottom-0 right-0 p-2.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg transition cursor-pointer disabled:opacity-50 border-2 border-white dark:border-[#243447]"
                  title="Ganti Foto Profil"
                >
                  <Camera size={18} />
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">JPG, PNG, WEBP (Max. 5MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">{t('fullName')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('enterFullName')}
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan Email"
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                />
              </div>

              {/* Extras (Locally Stored) */}
              <div>
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Nomor HP</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan Nomor HP"
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Jenis Kelamin</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Tanggal Lahir</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Alamat</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan Alamat"
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-xs text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Tentang Saya (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tuliskan biografi singkat tentang Anda..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-800 dark:text-white resize-none"
                />
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-primary" /> {t('accountInfo')}
        </h3>
        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700/50 mb-6">
          <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Username</span>
          <span className="font-semibold text-slate-700 dark:text-gray-200">@{currentUser?.username}</span>
        </div>

        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Key size={20} className="text-orange-500" /> {t('changePassword')}
        </h3>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
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
            className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('newPassword')}
            className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('confirmNewPassword')}
            className="w-full bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {isChangingPassword ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('changePassword')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800">
          <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">{t('resetPasswordEmail')}</h4>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mb-4">{t('resetPasswordDesc')}</p>
          {resetMessage && (
            <div className={`mb-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${resetMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
              {resetMessage.text}
            </div>
          )}
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResetting}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            {isResetting ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('resetPasswordEmail')}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">{t('dangerZone')}</h3>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
        
        {/* THEME MODE */}
        <div className="mb-8">
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Moon size={18} className="text-emerald-500" /> {t('theme')}
          </h3>
          <div className="bg-slate-50 dark:bg-gray-800/50 p-2 rounded-xl border border-slate-100 dark:border-gray-700/50 flex">
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

        {/* WORKSPACE THEME */}
        <div className="mb-8">
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Palette size={18} className="text-purple-500" /> Workspace Theme
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            {(
              [
                { id: 'ocean', color: '#2563EB', name: 'Ocean' },
                { id: 'emerald', color: '#10B981', name: 'Emerald' },
                { id: 'purple', color: '#8B5CF6', name: 'Purple' },
                { id: 'orange', color: '#F97316', name: 'Orange' },
                { id: 'red', color: '#EF4444', name: 'Red' },
                { id: 'graphite', color: '#475569', name: 'Graphite' },
                { id: 'midnight', color: '#1E3A8A', name: 'Midnight' },
                { id: 'forest', color: '#047857', name: 'Forest' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setWorkspaceTheme(t.id as WorkspaceTheme)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm relative ${workspaceTheme === t.id ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:ring-2 ring-offset-1 ring-slate-300'}`}
                style={{ backgroundColor: t.color }}
                title={t.name}
              >
                {workspaceTheme === t.id && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-xl">
                    <Check size={20} className="text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BOARD BACKGROUND */}
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-500" /> Board Background
          </h3>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-500/20 rounded-xl text-xs font-bold">
              {uploadError}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSetBuiltinBackground(null)}
                className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-105 ${!currentUser?.boardBackground ? 'border-primary shadow-md' : 'border-slate-200'} bg-slate-100 dark:bg-gray-800 flex items-center justify-center`}
                title="Default"
              >
                {!currentUser?.boardBackground && <Check size={16} className="text-slate-600 dark:text-gray-300" />}
              </button>
              {(
                [
                  { color: '#2563EB' }, { color: '#10B981' }, { color: '#8B5CF6' }, { color: '#F97316' },
                  { color: '#047857' }, { color: '#1E3A8A' }, { color: '#475569' },
                ] as const
              ).map(t => (
                <button
                  key={t.color}
                  onClick={() => handleSetBuiltinBackground(t.color)}
                  className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center ${currentUser?.boardBackground === t.color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                  style={{ backgroundColor: t.color }}
                >
                  {currentUser?.boardBackground === t.color && <Check size={16} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { bg: 'linear-gradient(to right, #3b82f6, #2dd4bf)' },
                  { bg: 'linear-gradient(to right, #8b5cf6, #d946ef)' },
                  { bg: 'linear-gradient(to right, #f97316, #eab308)' },
                  { bg: 'linear-gradient(to right, #047857, #10b981)' },
                  { bg: 'linear-gradient(to right, #1e3a8a, #8b5cf6)' },
                ] as const
              ).map(t => (
                <button
                  key={t.bg}
                  onClick={() => handleSetBuiltinBackground(t.bg)}
                  className={`w-14 h-10 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center ${currentUser?.boardBackground === t.bg ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''}`}
                  style={{ background: t.bg }}
                >
                  {currentUser?.boardBackground === t.bg && <Check size={16} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E293B] hover:bg-slate-50 text-slate-700 dark:text-gray-200 rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-gray-700 text-sm font-bold shadow-sm">
                <Upload size={16} />
                {t('uploadImage')}
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
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              )}
            </div>

            <div 
              className="w-full sm:w-[320px] aspect-[4/3] rounded-2xl shadow-inner border-2 border-slate-100 dark:border-gray-800 bg-slate-100 dark:bg-gray-900 bg-cover bg-center overflow-hidden flex items-center justify-center relative mt-2"
              style={{ 
                background: currentUser?.boardBackground 
                  ? (currentUser.boardBackground.startsWith('http') || currentUser.boardBackground.startsWith('/') 
                    ? `url(${currentUser.boardBackground})` 
                    : currentUser.boardBackground)
                  : undefined
              }}
            >
              {!currentUser?.boardBackground && (
                <span className="text-slate-400 dark:text-gray-600 font-bold text-sm">{t('previewBoard')}</span>
              )}
              {isUploadingBackground && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
        
        <div className="mb-6">
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <Globe size={18} className="text-indigo-500" /> {t('language')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">{t('languageDesc')}</p>
          <div className="relative w-full md:w-1/2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full appearance-none bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="id">🇮🇩 Indonesia (ID)</option>
              <option value="en">🇺🇸 English (EN)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <ChevronRight size={16} className="text-slate-400 rotate-90" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-gray-800">
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> {t('timezoneLabel')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">{t('timezoneDescLabel')}</p>
          <div className="relative w-full md:w-1/2">
            <select
              disabled
              className="w-full appearance-none bg-slate-100 dark:bg-gray-800/30 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 dark:text-gray-500 cursor-not-allowed"
            >
              <option>{t('timezoneDefaultLabel')}</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden bg-white p-2">
            <img src="/nebo.png" alt="NEBO Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">NeboTrack</h2>
            <p className="text-sm text-slate-500 font-semibold">{t('appVersion')} 1.0.0 (Stable)</p>
          </div>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed font-medium">
            {t('aboutDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <button 
            onClick={() => alert(t('privacyText'))}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
              <span className="font-bold text-sm text-slate-700 dark:text-gray-200">{t('privacyPolicy')}</span>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => alert("{t('helpCenterDesc')}")}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
              <span className="font-bold text-sm text-slate-700 dark:text-gray-200">{t('helpCenter')}</span>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );

  const renderActiveTabContent = (tabId: string) => {
    switch (tabId) {
      case 'profile': return renderProfileTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'preferences': return renderPreferencesTab();
      case 'about': return renderAboutTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col font-sans pb-12 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t('settingsTitle')}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">
            {t('settingsDesc')}
          </p>
        </div>
        {onBackToBoard && (
          <button
            onClick={onBackToBoard}
            className="hidden md:block px-5 py-2.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-700 dark:text-gray-200 rounded-xl shadow-sm hover:shadow transition-all"
          >
            {t('backToBoard')}
          </button>
        )}
      </div>

      {/* DESKTOP LAYOUT (2 Columns) */}
      <div className="hidden md:flex gap-8 items-start">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2 sticky top-24">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm w-full text-left ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md shadow-primary/20 translate-x-1' 
                  : 'bg-transparent text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 dark:text-gray-500'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 w-full min-w-0">
          {renderActiveTabContent(activeTab)}
        </div>
      </div>

      {/* MOBILE LAYOUT (Master-Detail) */}
      <div className="md:hidden flex flex-col w-full">
        {selectedMobileTab === null ? (
          // Master List (Cards)
          <div className="flex flex-col gap-3 animate-in slide-in-from-left-4 duration-300">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedMobileTab(tab.id as any)}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-gray-800 shadow-[0_2px_10px_rgb(0,0,0,0.02)] active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center">
                    <tab.icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 dark:text-white text-[15px]">{tab.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{tab.desc}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        ) : (
          // Detail View
          <div className="flex flex-col w-full animate-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSelectedMobileTab(null)}
              className="flex items-center gap-2 text-slate-500 dark:text-gray-400 font-bold text-sm mb-6 pb-4 border-b border-slate-100 dark:border-gray-800 self-start hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              {t('backToCategory')}
            </button>
            <div className="w-full">
              {renderActiveTabContent(selectedMobileTab)}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};