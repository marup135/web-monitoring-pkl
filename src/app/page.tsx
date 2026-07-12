/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { PKLProvider, usePKL } from '../context/PKLContext';
import { KanbanBoard } from '../components/KanbanBoard';
import { LogbookTable } from '../components/LogbookTable';
import { DashboardStats } from '../components/DashboardStats';
import { CardModal } from '../components/CardModal';
import { AuthPage } from '../components/AuthPage';
import { GuruPortal } from '../components/GuruPortal';
import { MentorPortal } from '../components/MentorPortal';
import { AdminPortal } from '../components/AdminPortal';
import { SuperAdminPortal } from '../components/SuperAdminPortal';
import { PKLCard } from '../types/pkl';
import { LayoutDashboard, FileSpreadsheet, BarChart3, Building2, UserCheck, RefreshCw, Menu, X, User, Settings, Key, LogOut, Clock } from 'lucide-react';
import { SettingsPage } from '../components/SettingsPage';
import { useLanguage } from '../context/LanguageContext';
import { AttendancePage } from '../components/AttendancePage';

function DashboardContent() {
  const { t } = useLanguage();
  const {
    state,
    activeTab,
    setActiveTab,
    resetState,
    loading,
    currentUser,
    studentsList,
    setSelectedStudentId,
    logout,
  } = usePKL();
  
  const [selectedCard, setSelectedCard] = useState<PKLCard | null>(null);
  const [selectedCardEditMode, setSelectedCardEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsActive, setIsSettingsActive] = useState(false);
  const [settingsActiveSection, setSettingsActiveSection] = useState<'profile' | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);

  const isPembimbing = currentUser && currentUser.role !== 'PARTICIPANT';

  // Sync selected card details if the state updates while open
  const activeCard = selectedCard
    ? state.cards.find(c => c.id === selectedCard.id) || null
    : null;

  const handlePantauStudent = async (studentId: string) => {
    await setSelectedStudentId(studentId);
    setViewMode('detail');
  };

  // Render Student List/Portal for Admin, Guru, and Mentor
  if (isPembimbing && viewMode === 'list') {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex-1 w-full relative font-sans text-[#0F172A] dark:text-gray-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 border-b border-[#E2E8F0] dark:border-gray-700 pb-4 md:pb-6">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/nebo.png"
                alt="NEBO Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-sm border border-[#E2E8F0] dark:border-gray-700"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                  PORTAL PEMBIMBING - NEBOTRACK
                </h1>
                <p className="text-[10px] md:text-xs text-[#64748B] dark:text-gray-300 font-medium mt-0.5">
                  Selamat datang, <span className="text-primary font-bold">{currentUser.name}</span> (Peran:{' '}
                  {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role === 'INSTITUTION_ADMIN' ? 'Admin Institusi' : currentUser.role === 'INTERNAL_MENTOR' ? 'Pembimbing Internal' : 'Pembimbing Eksternal'}
                  )
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={logout}
              className="w-full md:w-auto px-4 py-3 md:py-2.5 bg-[#EF4444] hover:bg-[#DC2626] dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 dark:border dark:border-red-500/20 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer min-h-[48px] md:min-h-0"
            >
              Keluar (Logout)
            </button>
          </div>
        </div>

        {/* Role Portal Conditional Selection */}
        {currentUser.role === 'SUPER_ADMIN' ? (
          <SuperAdminPortal />
        ) : currentUser.role === 'INSTITUTION_ADMIN' ? (
          <AdminPortal />
        ) : currentUser.role === 'INTERNAL_MENTOR' ? (
          <GuruPortal onPantau={handlePantauStudent} />
        ) : (
          <MentorPortal onPantau={handlePantauStudent} />
        )}
      </main>
    );
  }

  // Monitoring student logbook OR Normal student view
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex-1 w-full relative text-[#0F172A] dark:text-gray-200 pb-28 md:pb-8">
      {/* Mobile Sticky Navbar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 flex md:hidden items-center justify-between px-4 h-14 -mx-4 sm:-mx-6 mb-4 print:hidden shadow-sm">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:bg-gray-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/nebo.png" alt="Logo" className="w-6 h-6 object-contain rounded" />
          <span className="font-bold text-sm text-slate-800 dark:text-gray-200 uppercase tracking-tight">
            NeboTrack
          </span>
        </div>
        <button
          onClick={() => setIsUserMenuOpen(true)}
          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs cursor-pointer min-h-0 min-w-0 overflow-hidden shrink-0 border border-slate-200 dark:border-gray-700"
        >
          {currentUser?.profileImage ? (
            <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            currentUser?.name?.charAt(0).toUpperCase()
          )}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden print:hidden animate-in fade-in duration-200">
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="relative w-72 bg-white dark:bg-[#243447] h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img src="/nebo.png" alt="Logo" className="w-8 h-8 object-contain rounded-xl" />
                <span className="font-black text-slate-800 dark:text-gray-200 text-base">NeboTrack</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-gray-800/50 text-slate-500 dark:text-gray-300 hover:text-slate-700 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 flex-1 mt-4">
              <button
                onClick={() => { setActiveTab('stats'); setIsSettingsActive(false); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition duration-200 w-full text-left cursor-pointer min-h-[52px] ${
                  !isSettingsActive && activeTab === 'stats' ? 'bg-primary/10 dark:bg-primary/100/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <BarChart3 size={20} />
                {t('dashboard')}
              </button>
              <button
                onClick={() => { setActiveTab('board'); setIsSettingsActive(false); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition duration-200 w-full text-left cursor-pointer min-h-[52px] ${
                  !isSettingsActive && activeTab === 'board' ? 'bg-primary/10 dark:bg-primary/100/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <LayoutDashboard size={20} />
                {t('board')}
              </button>
              <button
                onClick={() => { setActiveTab('logbook'); setIsSettingsActive(false); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition duration-200 w-full text-left cursor-pointer min-h-[52px] ${
                  !isSettingsActive && activeTab === 'logbook' ? 'bg-primary/10 dark:bg-primary/100/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <FileSpreadsheet size={20} />
                {t('logbook')}
              </button>
              <button
                onClick={() => { setActiveTab('attendance'); setIsSettingsActive(false); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition duration-200 w-full text-left cursor-pointer min-h-[52px] ${
                  !isSettingsActive && activeTab === 'attendance' ? 'bg-primary/10 dark:bg-primary/100/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <Clock size={20} />
                {t('attendance')}
              </button>
              <button
                onClick={() => { setIsSettingsActive(true); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition duration-200 w-full text-left cursor-pointer min-h-[52px] ${
                  isSettingsActive ? 'bg-primary/10 dark:bg-primary/100/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <Settings size={20} />
                {t('settings')}
              </button>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-gray-300 font-bold text-sm shrink-0 overflow-hidden">
                    {currentUser?.profileImage ? (
                      <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate leading-tight">{currentUser?.name}</p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-gray-400 capitalize truncate mt-0.5">{currentUser?.role}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-gray-700 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 rounded-xl transition cursor-pointer shrink-0"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation — 5 items as requested */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-gray-700 flex md:hidden items-center justify-around h-16 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.06)] print:hidden">
        <button
          onClick={() => { setActiveTab('stats'); setIsSettingsActive(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            !isSettingsActive && activeTab === 'stats' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <BarChart3 size={20} />
          <span className="text-[9px] font-bold mt-0.5">{t('dashboard').split(' ')[0]}</span>
        </button>
        <button
          onClick={() => { setActiveTab('board'); setIsSettingsActive(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            !isSettingsActive && activeTab === 'board' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold mt-0.5">{t('board').split(' ')[0]}</span>
        </button>
        <button
          onClick={() => { setActiveTab('attendance'); setIsSettingsActive(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            !isSettingsActive && activeTab === 'attendance' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Clock size={20} />
          <span className="text-[9px] font-bold mt-0.5">{t('attendance').split(' ')[0]}</span>
        </button>
        <button
          onClick={() => { setActiveTab('logbook'); setIsSettingsActive(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            !isSettingsActive && activeTab === 'logbook' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <FileSpreadsheet size={20} />
          <span className="text-[9px] font-bold mt-0.5">{t('logbook').split(' ')[0]}</span>
        </button>
        {currentUser?.role !== 'siswa' && (
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
              isUserMenuOpen && !isSettingsActive ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <User size={20} />
            <span className="text-[9px] font-bold mt-0.5">{t('users')}</span>
          </button>
        )}
        <button
          onClick={() => setIsSettingsActive(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
            isSettingsActive ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Settings size={20} />
          <span className="text-[9px] font-bold mt-0.5">{t('settings').split(' ')[0]}</span>
        </button>
      </div>

      {/* App Header / Navigation Info */}
      <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-[#E2E8F0] dark:border-gray-700 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/nebo.png"
              alt="NEBO Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-sm border border-[#E2E8F0] dark:border-gray-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                  NEBO
                </h1>
                {loading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] text-primary font-semibold uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Syncing
                  </div>
                )}
              </div>
              <p className="text-xs text-[#64748B] dark:text-gray-300 font-medium mt-0.5">
                Network for Education & Business Opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Action / Profile Header */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-3 shadow-sm">
          {isPembimbing && (
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              ← Kembali ke Daftar Siswa
            </button>
          )}

          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <span className="text-xs font-semibold text-[#0F172A] dark:text-gray-200">
              Siswa: <span className="text-primary font-bold">{state.studentName}</span> {state.nisn ? `(NIS/NISN: ${state.nisn})` : ''} - {state.companyName}
            </span>
          </div>
          
          <span className="text-[#E2E8F0] hidden sm:inline">|</span>
          
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 p-1.5 pr-3 rounded-full transition"
              onClick={() => setIsDesktopUserMenuOpen(!isDesktopUserMenuOpen)}
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] overflow-hidden shrink-0 border border-slate-200 dark:border-gray-700">
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs text-[#64748B] dark:text-gray-300">
                Pengguna: <span className="font-semibold text-primary">{currentUser?.name}</span>
              </span>
            </div>

            {/* Desktop User Menu Popover */}
            {isDesktopUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDesktopUserMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-gray-800 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl overflow-hidden shrink-0 border-2 border-slate-100 dark:border-gray-700 shadow-sm">
                        {currentUser?.profileImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          currentUser?.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="overflow-hidden flex flex-col justify-center">
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-gray-100 truncate">{currentUser?.name}</h4>
                        
                        {(currentUser?.role === 'siswa' && (currentUser?.nisn || (currentUser as any)?.nis)) && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIS/NISN: {currentUser.nisn || (currentUser as any).nis}</p>
                        )}
                        {(currentUser?.role === 'mahasiswa' && (currentUser as any)?.nim) && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIM: {(currentUser as any).nim}</p>
                        )}
                        {(currentUser?.role?.includes('pembimbing') && (currentUser as any)?.nip) && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIP: {(currentUser as any).nip}</p>
                        )}

                        <div className="mt-1.5">
                          <span className="inline-block px-2.5 py-0.5 bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider rounded-md border border-blue-100/50 dark:border-blue-500/20">
                            {currentUser?.role?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-slate-50/50 dark:bg-gray-800/30 flex flex-col gap-1 border-t border-slate-100 dark:border-gray-800">
                    <button onClick={() => { setIsDesktopUserMenuOpen(false); setIsSettingsActive(true); setSettingsActiveSection('profile'); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-2xl text-xs font-bold text-slate-700 dark:text-gray-200 transition-all w-full text-left">
                      <User size={16} className="text-slate-400 dark:text-gray-400" />
                      <span>Lihat Detail Profil</span>
                    </button>
                    <button onClick={() => { setIsDesktopUserMenuOpen(false); setIsSettingsActive(true); setSettingsActiveSection(null as any); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-2xl text-xs font-bold text-slate-700 dark:text-gray-200 transition-all w-full text-left">
                      <Settings size={16} className="text-slate-400 dark:text-gray-400" />
                      <span>Pengaturan Aplikasi</span>
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-gray-800 my-1 mx-2" />
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300 transition-all w-full text-left">
                      <LogOut size={16} className="text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <span className="text-[#E2E8F0] hidden sm:inline">|</span>

          {currentUser?.role === 'siswa' && (
            <button 
              onClick={() => {
                if (confirm(t('confirmResetDbAlert'))) {
                  resetState();
                }
              }}
              title="Reset Database"
              className="p-1.5 rounded-lg bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 hover:bg-[#F8FAFC] dark:bg-gray-900 text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200 transition cursor-pointer"
            >
              <RefreshCw size={13} />
            </button>
          )}

          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#EF4444] font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Back to List View Trigger for Pembimbing */}
      {isPembimbing && viewMode === 'detail' && (
        <div className="flex md:hidden mb-4 print:hidden">
          <button
            onClick={() => setViewMode('list')}
            className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
          >
            ← Kembali ke Daftar Siswa
          </button>
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="hidden md:flex border-b border-[#E2E8F0] dark:border-gray-700 mb-6 gap-2 print:hidden overflow-x-auto py-1">
        <button
          onClick={() => { setActiveTab('board'); setIsSettingsActive(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            !isSettingsActive && activeTab === 'board'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-[#F8FAFC] dark:bg-gray-900 hover:text-[#0F172A] dark:text-gray-200'
          }`}
        >
          <LayoutDashboard size={14} />
          Kanban Board (Trello)
        </button>

        <button
          onClick={() => { setActiveTab('logbook'); setIsSettingsActive(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            !isSettingsActive && activeTab === 'logbook'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-[#F8FAFC] dark:bg-gray-900 hover:text-[#0F172A] dark:text-gray-200'
          }`}
        >
          <FileSpreadsheet size={14} />
          Jurnal Harian (Logbook)
        </button>

        <button
          onClick={() => { setActiveTab('stats'); setIsSettingsActive(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            !isSettingsActive && activeTab === 'stats'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-[#F8FAFC] dark:bg-gray-900 hover:text-[#0F172A] dark:text-gray-200'
          }`}
        >
          <BarChart3 size={14} />
          Statistik Monitoring
        </button>

        <button
          onClick={() => { setActiveTab('attendance'); setIsSettingsActive(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            !isSettingsActive && activeTab === 'attendance'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-[#F8FAFC] dark:bg-gray-900 hover:text-[#0F172A] dark:text-gray-200'
          }`}
        >
          <Clock size={14} />
          {t('attendance')}
        </button>

        <button
          onClick={() => setIsSettingsActive(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ml-auto ${
            isSettingsActive
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-[#F8FAFC] dark:bg-gray-900 hover:text-[#0F172A] dark:text-gray-200'
          }`}
        >
          <Settings size={14} />
          {t('settings')}
        </button>
      </div>

      {/* Render Active View Tab */}
      <div className="min-h-[500px]">
        {isSettingsActive ? (
          <SettingsPage 
            onBackToBoard={() => setIsSettingsActive(false)} 
            activeSection={settingsActiveSection}
            onClearActiveSection={() => setSettingsActiveSection(null)}
          />
        ) : (
          <>
            {activeTab === 'board' && (
              <KanbanBoard onOpenCard={(card) => setSelectedCard(card)} />
            )}
            {activeTab === 'logbook' && (
              <LogbookTable 
                onOpenCard={(card) => {
                  setSelectedCard(card);
                  setSelectedCardEditMode(false);
                }}
                onEditCard={(card) => {
                  setSelectedCard(card);
                  setSelectedCardEditMode(true);
                }}
              />
            )}
            {activeTab === 'stats' && <DashboardStats />}
            {activeTab === 'attendance' && <AttendancePage />}
          </>
        )}
      </div>

      {/* Modal Detail */}
      {activeCard && (
        <CardModal 
          card={activeCard} 
          onClose={() => {
            setSelectedCard(null);
            setSelectedCardEditMode(false);
          }} 
          initialEdit={selectedCardEditMode}
        />
      )}

      {/* User Menu Bottom Sheet */}
      {isUserMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden">
          <div 
            onClick={() => setIsUserMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-[28px] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.5)] dark:border-t dark:border-gray-800 flex flex-col z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto pb-safe">
            <div className="p-6">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-4">
                <div className="w-[72px] h-[72px] rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl overflow-hidden shrink-0 border-4 border-slate-50 dark:border-gray-800 shadow-sm">
                  {currentUser?.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden flex flex-col justify-center">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-gray-100 truncate">{currentUser?.name}</h3>
                  
                  {(currentUser?.role === 'siswa' && (currentUser?.nisn || (currentUser as any)?.nis)) && (
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIS/NISN: {currentUser.nisn || (currentUser as any).nis}</p>
                  )}
                  {(currentUser?.role === 'mahasiswa' && (currentUser as any)?.nim) && (
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIM: {(currentUser as any).nim}</p>
                  )}
                  {(currentUser?.role?.includes('pembimbing') && (currentUser as any)?.nip) && (
                    <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 truncate mt-0.5">NIP: {(currentUser as any).nip}</p>
                  )}

                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-100/50 dark:border-blue-500/20">
                      {currentUser?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-gray-800/30 flex flex-col gap-2 border-t border-slate-100 dark:border-gray-800 flex-1">
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsSettingsActive(true);
                  setSettingsActiveSection('profile');
                }}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-2xl text-slate-700 dark:text-gray-200 font-bold text-sm text-left transition-all w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-slate-500 dark:text-gray-400 shrink-0">
                  <User size={20} />
                </div>
                <span>Lihat Detail Profil</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsSettingsActive(true);
                  setSettingsActiveSection(null as any);
                }}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-2xl text-slate-700 dark:text-gray-200 font-bold text-sm text-left transition-all w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-slate-500 dark:text-gray-400 shrink-0">
                  <Settings size={20} />
                </div>
                <span>Pengaturan Aplikasi</span>
              </button>

              <div className="h-px bg-slate-200 dark:bg-gray-700 my-2 mx-4" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-[#EF4444] dark:text-red-400 font-bold text-sm text-left transition-all w-full mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-[#EF4444] dark:text-red-400 shrink-0">
                  <LogOut size={20} />
                </div>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function LoginSuccessToast({ visible }: { visible: boolean }) {
  const { t } = useLanguage();
  if (!visible) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-3 fade-in duration-300">
      <div className="flex items-center gap-3 bg-white dark:bg-[#243447] border border-green-200 text-[#0F172A] dark:text-gray-200 pl-4 pr-5 py-3 rounded-2xl shadow-xl shadow-green-100/60">
        <div className="w-7 h-7 rounded-xl bg-[#22C55E] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#0F172A] dark:text-white">{t('loginSuccess')}</p>
          <p className="text-[11px] text-[#64748B] dark:text-gray-300">{t('welcomeBack')}</p>
        </div>
      </div>
    </div>
  );
}

function HomeWrapper() {
  const { t } = useLanguage();
  const { currentUser, loading } = usePKL();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (currentUser && typeof window !== 'undefined' && sessionStorage.getItem('login_success') === 'true') {
      sessionStorage.removeItem('login_success');
      const showTimer = setTimeout(() => {
        setShowToast(true);
      }, 0);
      const hideTimer = setTimeout(() => {
        setShowToast(false);
      }, 3500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [currentUser]);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl border-4 border-slate-100 border-t-[#2563EB] animate-spin" />
          <span className="text-xs font-bold text-[#64748B] dark:text-gray-300 animate-pulse uppercase tracking-widest">{t('loadingSession')}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <>
      <LoginSuccessToast visible={showToast} />
      <DashboardContent />
      <footer className="py-6 border-t border-[#E2E8F0] dark:border-gray-700 text-center text-xs text-[#64748B] dark:text-gray-300 print:hidden mt-12 bg-white dark:bg-[#243447]">
        <span>&copy; 2026 NeboTrack. Built with Next.js &amp; Tailwind CSS.</span>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <PKLProvider>
      <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] dark:bg-gray-900 text-[#0F172A] dark:text-gray-200">
        <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] dark:bg-gray-900 text-[#0F172A] dark:text-gray-200">
        <HomeWrapper />
      </div>
      </div>
    </PKLProvider>
  );
}
