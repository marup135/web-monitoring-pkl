'use client';

import React, { useState } from 'react';
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
import { LayoutDashboard, FileSpreadsheet, BarChart3, Building2, UserCheck, RefreshCw } from 'lucide-react';

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative font-sans text-[#0F172A]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="NeboTrack Logo"
                className="w-10 h-10 object-contain rounded-xl shadow-sm border border-[#E2E8F0]"
              />
              <div>
                <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                  PORTAL PEMBIMBING - NEBOTRACK
                </h1>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
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

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative text-[#0F172A]">
      {/* App Header / Navigation Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-[#E2E8F0] pb-6 print:hidden">
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

      {/* Main Tab Controls */}
      <div className="flex border-b border-[#E2E8F0] mb-8 gap-2 print:hidden overflow-x-auto py-1">
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

function HomeWrapper() {
  const { currentUser, loading } = usePKL();

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

  return <DashboardContent />;
}

export default function Home() {
  return (
    <PKLProvider>
      <div className="min-h-screen flex flex-col justify-between font-sans bg-[#F8FAFC] text-[#0F172A]">
        <HomeWrapper />
        <footer className="py-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] print:hidden mt-12 bg-white">
          <span>&copy; 2026 NeboTrack. Built with Next.js & Tailwind CSS. Designed by Antigravity.</span>
        </footer>
      </div>
    </PKLProvider>
  );
}
