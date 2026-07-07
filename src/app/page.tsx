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
import { PKLCard } from '../types/pkl';
import { LayoutDashboard, FileSpreadsheet, BarChart3, Building2, UserCheck, RefreshCw, Menu, X, User, Settings } from 'lucide-react';

function DashboardContent() {
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
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isPembimbing = currentUser && currentUser.role !== 'siswa';

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex-1 w-full relative font-sans text-[#0F172A]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 border-b border-[#E2E8F0] pb-4 md:pb-6">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="NeboTrack Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-sm border border-[#E2E8F0]"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">
                  PORTAL PEMBIMBING - NEBOTRACK
                </h1>
                <p className="text-[10px] md:text-xs text-[#64748B] font-medium mt-0.5">
                  Selamat datang, <span className="text-[#2563EB] font-bold">{currentUser.name}</span> (Peran:{' '}
                  {currentUser.role === 'admin'
                    ? 'Administrator'
                    : currentUser.role === 'pembimbing_internal'
                    ? 'Pembimbing Internal - Sekolah'
                    : 'Pembimbing Eksternal - Perusahaan'}
                  )
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={logout}
              className="w-full md:w-auto px-4 py-3 md:py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer min-h-[48px] md:min-h-0"
            >
              Keluar (Logout)
            </button>
          </div>
        </div>

        {/* Role Portal Conditional Selection */}
        {currentUser.role === 'admin' ? (
          <AdminPortal />
        ) : currentUser.role === 'pembimbing_internal' ? (
          <GuruPortal onPantau={handlePantauStudent} />
        ) : (
          <MentorPortal onPantau={handlePantauStudent} />
        )}
      </main>
    );
  }

  // Monitoring student logbook OR Normal student view
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex-1 w-full relative text-[#0F172A] pb-24 md:pb-8">
      {/* Mobile Sticky Navbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 flex md:hidden items-center justify-between px-4 h-14 -mx-4 sm:-mx-6 mb-6 print:hidden">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="w-6 h-6 object-contain rounded" />
          <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">
            {activeTab === 'board' ? 'Kanban Board' : activeTab === 'logbook' ? 'Logbook Jurnal' : 'Statistik'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
          {currentUser?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden print:hidden animate-in fade-in duration-200">
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-xl" />
                <span className="font-black text-slate-800 text-base">NeboTrack</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-700 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1">
              <button
                onClick={() => { setActiveTab('stats'); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 w-full text-left cursor-pointer min-h-[48px] ${
                  activeTab === 'stats' ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BarChart3 size={18} />
                Dashboard (Statistik)
              </button>
              <button
                onClick={() => { setActiveTab('board'); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 w-full text-left cursor-pointer min-h-[48px] ${
                  activeTab === 'board' ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={18} />
                Kanban Board
              </button>
              <button
                onClick={() => { setActiveTab('logbook'); setIsDrawerOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 w-full text-left cursor-pointer min-h-[48px] ${
                  activeTab === 'logbook' ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet size={18} />
                Jurnal Harian
              </button>
            </div>

            <div className="border-t border-[#E2E8F0] pt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{currentUser?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-[#EF4444] font-bold text-sm rounded-xl transition cursor-pointer min-h-[48px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex md:hidden items-center justify-around h-16 pb-safe shadow-lg print:hidden">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center w-14 h-14 cursor-pointer transition ${
            activeTab === 'stats' ? 'text-[#2563EB]' : 'text-slate-400'
          }`}
        >
          <BarChart3 size={20} />
          <span className="text-[9px] font-bold mt-1">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex flex-col items-center justify-center w-14 h-14 cursor-pointer transition ${
            activeTab === 'board' ? 'text-[#2563EB]' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold mt-1">Board</span>
        </button>
        <button
          onClick={() => setActiveTab('logbook')}
          className={`flex flex-col items-center justify-center w-14 h-14 cursor-pointer transition ${
            activeTab === 'logbook' ? 'text-[#2563EB]' : 'text-slate-400'
          }`}
        >
          <FileSpreadsheet size={20} />
          <span className="text-[9px] font-bold mt-1">Logbook</span>
        </button>
        <button
          onClick={() => {
            alert(`Profil Siswa:\nNama: ${state.studentName}\nNISN: ${state.nisn || '-'}\nPerusahaan: ${state.companyName}`);
          }}
          className="flex flex-col items-center justify-center w-14 h-14 cursor-pointer transition text-slate-400"
        >
          <User size={20} />
          <span className="text-[9px] font-bold mt-1">Users</span>
        </button>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-14 cursor-pointer transition text-slate-400"
        >
          <Settings size={20} />
          <span className="text-[9px] font-bold mt-1">Settings</span>
        </button>
      </div>

      {/* App Header / Navigation Info */}
      <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-[#E2E8F0] pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="NeboTrack Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-sm border border-[#E2E8F0]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                  NeboTrack
                </h1>
                {loading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 text-[10px] text-[#2563EB] font-semibold uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
                    Syncing
                  </div>
                )}
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                Monitoring & Logbook Harian PKL SMKN 1 Bojong
              </p>
            </div>
          </div>
        </div>

        {/* Action / Profile Header */}
        <div className="flex flex-wrap items-center gap-4 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
          {isPembimbing && (
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              ← Kembali ke Daftar Siswa
            </button>
          )}

          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#2563EB]" />
            <span className="text-xs font-semibold text-[#0F172A]">
              Siswa: <span className="text-[#2563EB] font-bold">{state.studentName}</span> {state.nisn ? `(NIS/NISN: ${state.nisn})` : ''} - {state.companyName}
            </span>
          </div>
          
          <span className="text-[#E2E8F0] hidden sm:inline">|</span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">
              Pengguna: <span className="font-semibold text-[#2563EB]">{currentUser?.name}</span>
            </span>
          </div>

          <span className="text-[#E2E8F0] hidden sm:inline">|</span>

          {currentUser?.role === 'siswa' && (
            <button 
              onClick={() => {
                if (confirm('Apakah Anda ingin mereset database ke data bawaan simulasi (data awal)? Semua akun baru yang terdaftar akan terhapus.')) {
                  resetState();
                }
              }}
              title="Reset Database"
              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
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
            className="w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
          >
            ← Kembali ke Daftar Siswa
          </button>
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="hidden md:flex border-b border-[#E2E8F0] mb-8 gap-2 print:hidden overflow-x-auto py-1">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            activeTab === 'board'
              ? 'bg-blue-50 border-[#2563EB]/30 text-[#2563EB]'
              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <LayoutDashboard size={14} />
          Kanban Board (Trello)
        </button>

        <button
          onClick={() => setActiveTab('logbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            activeTab === 'logbook'
              ? 'bg-blue-50 border-[#2563EB]/30 text-[#2563EB]'
              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <FileSpreadsheet size={14} />
          Jurnal Harian (Logbook)
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-blue-50 border-[#2563EB]/30 text-[#2563EB]'
              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <BarChart3 size={14} />
          Statistik Monitoring
        </button>
      </div>

      {/* Render Active View Tab */}
      <div className="min-h-[500px]">
        {activeTab === 'board' && (
          <KanbanBoard onOpenCard={(card) => setSelectedCard(card)} />
        )}
        {activeTab === 'logbook' && <LogbookTable />}
        {activeTab === 'stats' && <DashboardStats />}
      </div>

      {/* Modal Detail */}
      {activeCard && (
        <CardModal card={activeCard} onClose={() => setSelectedCard(null)} />
      )}
    </main>
  );
}

function LoginSuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-3 fade-in duration-300">
      <div className="flex items-center gap-3 bg-white border border-green-200 text-[#0F172A] pl-4 pr-5 py-3 rounded-2xl shadow-xl shadow-green-100/60">
        <div className="w-7 h-7 rounded-xl bg-[#22C55E] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#0F172A]">Login berhasil!</p>
          <p className="text-[11px] text-[#64748B]">Selamat datang kembali.</p>
        </div>
      </div>
    </div>
  );
}

function HomeWrapper() {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl border-4 border-slate-100 border-t-[#2563EB] animate-spin" />
          <span className="text-xs font-bold text-[#64748B] animate-pulse uppercase tracking-widest">Memuat Sesi...</span>
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
      <footer className="py-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] print:hidden mt-12 bg-white">
        <span>&copy; 2026 NeboTrack. Built with Next.js &amp; Tailwind CSS.</span>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <PKLProvider>
      <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A]">
        <HomeWrapper />
      </div>
    </PKLProvider>
  );
}
