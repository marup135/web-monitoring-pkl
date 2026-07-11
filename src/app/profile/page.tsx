'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PKLProvider, usePKL } from '@/context/PKLContext';
import { updateProfileInfoAction, uploadProfileImageAction } from '@/app/actions/profile';
import { Camera, ArrowLeft, Save, Loader2, User, Mail, Briefcase, GraduationCap, Clock, Hash, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ProfileContent() {
  const { currentUser, updateProfileContext, loading } = usePKL();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-gray-900">
        <p className="text-slate-500">Silakan login untuk melihat profil.</p>
        <Link href="/" className="ml-4 text-primary font-bold">Ke Beranda</Link>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(true);
    try {
      const res = await updateProfileInfoAction(name, email);
      if (res.success) {
        updateProfileContext({ name, email });
        setSuccessMsg('Profil berhasil diperbarui');
        setIsEditing(false);
      } else {
        setErrorMsg(res.error || 'Gagal mengupdate profil');
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan pada server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadProfileImageAction(formData);
      if (res.success && res.profileImage) {
        updateProfileContext({ profileImage: res.profileImage });
        setSuccessMsg('Foto profil berhasil diperbarui');
      } else {
        setErrorMsg(res.error || 'Gagal mengunggah foto');
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan pada server');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full text-[#0F172A] dark:text-gray-200 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition cursor-pointer text-slate-500 dark:text-gray-400">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Profil Pengguna</h1>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-xl transition cursor-pointer"
          >
            Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setName(currentUser.name || '');
                setEmail(currentUser.email || '');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-sm font-bold">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="bg-white dark:bg-[#243447] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 shrink-0 mx-auto md:mx-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-gray-700 shadow-md bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300 dark:text-gray-600" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleUploadImage}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg transition cursor-pointer disabled:opacity-50 border-2 border-white dark:border-[#243447]"
                title="Ganti Foto Profil"
              >
                <Camera size={18} />
              </button>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-500/20">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* User Details Form/View */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nama Lengkap</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-semibold"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                  <User size={18} className="text-slate-400" />
                  <span className="font-semibold">{currentUser.name}</span>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Email</label>
              {isEditing ? (
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-semibold"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                  <Mail size={18} className="text-slate-400" />
                  <span className="font-semibold">{currentUser.email || '-'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Username</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50/50 dark:bg-gray-800/30 opacity-70 cursor-not-allowed">
                <span className="text-slate-400 font-bold">@</span>
                <span className="font-semibold text-slate-600 dark:text-gray-300">{currentUser.username}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Asal {currentUser.role === 'siswa' || currentUser.role === 'pembimbing_internal' ? 'Sekolah' : 'Instansi'}</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                <Briefcase size={18} className="text-slate-400" />
                <span className="font-semibold">{currentUser.companyName || currentUser.school || currentUser.company || '-'}</span>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {currentUser.role === 'siswa' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Kelas / Program Studi</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <GraduationCap size={18} className="text-slate-400" />
                    <span className="font-semibold">{currentUser.classes?.[0]?.name || '-'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">NIS / NISN</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <Hash size={18} className="text-slate-400" />
                    <span className="font-semibold">{currentUser.nisn || '-'}</span>
                  </div>
                </div>
              </>
            )}

            {currentUser.role === 'pembimbing_internal' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">NIP / NIDN / NUPTK</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <Hash size={18} className="text-slate-400" />
                    <span className="font-semibold">{currentUser.nip || '-'}</span>
                  </div>
                </div>
              </>
            )}

            {currentUser.role === 'pembimbing_eksternal' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Jabatan</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <Briefcase size={18} className="text-slate-400" />
                    <span className="font-semibold">{currentUser.jobTitle || '-'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Employee ID</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <Hash size={18} className="text-slate-400" />
                    <span className="font-semibold">{currentUser.employeeId || '-'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tanggal Bergabung</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-slate-50 dark:bg-gray-800/50">
                    <Clock size={18} className="text-slate-400" />
                    <span className="font-semibold">
                      {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <PKLProvider>
      <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] dark:bg-gray-900 text-[#0F172A] dark:text-gray-200">
        <ProfileContent />
      </div>
    </PKLProvider>
  );
}
