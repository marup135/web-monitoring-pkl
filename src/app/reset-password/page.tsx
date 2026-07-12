/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { updatePasswordAction } from '../actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; type: 'field' | 'server'; field?: 'password' | 'confirmPassword' } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase redirects to /reset-password#access_token=...&type=recovery
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
      } else {
        setErrorState({ message: t('errResetLinkInvalid'), type: 'server' });
      }
    } else {
      setErrorState({ message: t('errResetLinkNotFound'), type: 'server' });
    }
  }, []);

  const setError = (message: string, type: 'field' | 'server' = 'field', field?: 'password' | 'confirmPassword') => {
    setErrorState({ message, type, field });
  };

  const clearError = () => setErrorState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!token) {
      setError(t('errTokenNotFound'), 'server');
      return;
    }

    if (!password) {
      setError(t('errNewPasswordRequired'), 'field', 'password');
      return;
    }
    if (password.length < 5) {
      setError(t('errPasswordLength'), 'field', 'password');
      return;
    }
    if (!confirmPassword) {
      setError(t('errConfirmPasswordRequired'), 'field', 'confirmPassword');
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errPasswordMismatch'), 'field', 'confirmPassword');
      return;
    }

    setLoading(true);

    try {
      const res = await updatePasswordAction(token, password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(res.error || t('errUpdatePasswordFailed'), 'server');
      }
    } catch {
      setError(t('errServer'), 'server');
    } finally {
      setLoading(false);
    }
  };

  const passwordHasError = errorState?.field === 'password';
  const confirmPasswordHasError = errorState?.field === 'confirmPassword';

  const inputClass = (hasError: boolean) =>
    `w-full bg-white dark:bg-[#243447] border rounded-xl pl-10 pr-4 text-sm text-[#0F172A] dark:text-gray-200 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] py-3 md:min-h-0 md:py-2.5 md:text-xs transition-all duration-200 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
        : 'border-[#E2E8F0] dark:border-gray-700 focus:border-primary focus:ring-blue-100'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#EFF6FF] text-[#0F172A] dark:text-gray-200 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/6 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-7 sm:p-9 border border-white shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md scale-110" />
              <img
                src="/nebo.png"
                alt="NEBO Logo"
                className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] object-contain rounded-2xl shadow-md border border-[#E2E8F0] dark:border-gray-700"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight text-center">
              Atur Ulang Password
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium mt-1.5 text-center leading-relaxed">
              Masukkan password baru untuk akun Anda.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <ShieldCheck size={24} />
              </div>
              <p className="text-sm font-bold text-green-800 text-center">
                Password berhasil diperbarui!
              </p>
              <p className="text-xs text-green-700 text-center">
                Mengarahkan Anda ke halaman login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                  Password Baru
                </label>
                <div className="relative">
                  <Key size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${passwordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t("newPasswordPlaceholder")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorState) clearError();
                    }}
                    className={`${inputClass(passwordHasError)} pr-11`}
                    disabled={!token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-lg transition-colors cursor-pointer"
                    disabled={!token}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordHasError && errorState?.type === 'field' && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle size={11} />
                    {errorState?.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#64748B] dark:text-gray-300 uppercase font-bold tracking-wider">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Key size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${confirmPasswordHasError ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t("confirmNewPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorState) clearError();
                    }}
                    className={`${inputClass(confirmPasswordHasError)} pr-11`}
                    disabled={!token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#64748B] dark:text-gray-300 focus:outline-none rounded-lg transition-colors cursor-pointer"
                    disabled={!token}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPasswordHasError && errorState?.type === 'field' && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle size={11} />
                    {errorState?.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full mt-2 min-h-[48px] bg-primary hover:bg-primary-hover active:bg-[#1E40AF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('saveNewPassword')}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error Alert */}
          {errorState && errorState.type === 'server' && (
            <div className="mt-5 p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-3 bg-red-50 border-red-200">
              <span className="shrink-0 text-red-500 mt-0.5">
                <AlertCircle size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-red-800 mt-0.5">
                  Kesalahan
                </p>
                <p className="mt-1 leading-snug text-red-700">
                  {errorState.message}
                </p>
                {(!token || errorState.message.includes('tidak valid')) && (
                  <button
                    onClick={() => router.push('/')}
                    className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                  >
                    Kembali ke Halaman Login
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
