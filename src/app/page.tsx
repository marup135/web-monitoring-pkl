'use client';

import React, { useState } from 'react';
import { PKLProvider, usePKL } from '../context/PKLContext';
import { KanbanBoard } from '../components/KanbanBoard';
import { LogbookTable } from '../components/LogbookTable';
import { DashboardStats } from '../components/DashboardStats';
import { CardModal } from '../components/CardModal';
import { AuthPage } from '../components/AuthPage';
import { PKLCard } from '../types/pkl';
import { LayoutDashboard, FileSpreadsheet, BarChart3, GraduationCap, Building2, UserCheck, RefreshCw } from 'lucide-react';

function DashboardContent() {
  const {
    state,
    activeTab,
    setActiveTab,
    resetState,
    loading,
    currentUser,
    studentsList,
    selectedStudentId,
    setSelectedStudentId,
    logout,
  } = usePKL();
  
  const [selectedCard, setSelectedCard] = useState<PKLCard | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Check if pembimbing is viewing
  const isPembimbing = currentUser && currentUser.role !== 'siswa';

  // Sync selected card details if the state updates while open
  const activeCard = selectedCard
    ? state.cards.find(c => c.id === selectedCard.id) || null
    : null;

  // Render Student List for Advisors and Mentors
  if (isPembimbing && viewMode === 'list') {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
                  PORTAL PEMBIMBING - TELTRACK NEBO
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Selamat datang, <span className="text-indigo-400 font-bold">{currentUser.name}</span> (Peran: {currentUser.role === 'pembimbing_internal' ? 'Pembimbing Internal - Sekolah' : 'Pembimbing Eksternal - Perusahaan'})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Apakah Anda ingin mereset database ke data bawaan simulasi (data awal)? Semua akun baru yang terdaftar akan terhapus.')) {
                  resetState();
                }
              }}
              title="Reset Database"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={14} />
              Reset DB Demo
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
            >
              Keluar (Logout)
            </button>
          </div>
        </div>

        {/* Student list grid */}
        <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-indigo-400" />
            Daftar Siswa PKL Terdaftar (SMKN 1 BOJONG)
          </h2>
          
          {studentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <UserCheck size={32} className="mb-2 text-gray-600" />
              <p className="text-xs">Belum ada siswa yang terdaftar di dalam sistem.</p>
              <p className="text-[10px] text-gray-600 mt-1">Siswa harus membuat akun terlebih dahulu melalui form pendaftaran.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Nama Siswa</th>
                    <th className="py-3 px-3">Perusahaan (Tempat PKL)</th>
                    <th className="py-3 px-3 text-center">Total Tugas</th>
                    <th className="py-3 px-3 text-center">Total Jam</th>
                    <th className="py-3 px-3 text-center">Tingkat Penyelesaian</th>
                    <th className="py-3 px-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {studentsList.map((student) => (
                    <tr key={student.id} className="hover:bg-white/2 transition duration-150">
                      <td className="py-4 px-3 font-semibold text-gray-100">{student.name}</td>
                      <td className="py-4 px-3">{student.company}</td>
                      <td className="py-4 px-3 text-center font-medium">{student.totalTasks} kegiatan</td>
                      <td className="py-4 px-3 text-center font-medium">{student.hoursLogged} jam</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div style={{ width: `${student.completionPercent}%` }} className="h-full bg-emerald-500 rounded-full" />
                          </div>
                          <span className="font-semibold text-emerald-400">{student.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={async () => {
                            await setSelectedStudentId(student.id);
                            setViewMode('detail');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition shadow-md cursor-pointer"
                        >
                          Pantau Jurnal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Monitoring student logbook OR Normal student view
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative">
      {/* App Header / Navigation Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/5 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
                  TelTrack Nebo
                </h1>
                {loading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-semibold uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                    Syncing
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Tracking & Logbook Harian PKL SMKN 1 BOJONG (Telkom Tracking)
              </p>
            </div>
          </div>
        </div>

        {/* Action / Profile Header */}
        <div className="flex flex-wrap items-center gap-4 bg-white/2 border border-white/5 rounded-2xl p-4 glass">
          {isPembimbing && (
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              ← Kembali ke Daftar Siswa
            </button>
          )}

          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-indigo-400" />
            <span className="text-xs font-semibold text-gray-300">
              Siswa: <span className="text-indigo-300 font-bold">{state.studentName}</span> ({state.companyName})
            </span>
          </div>
          
          <span className="text-gray-600 hidden sm:inline">|</span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Pengguna: <span className="font-semibold text-purple-400">{currentUser.name}</span>
            </span>
          </div>

          <span className="text-gray-600 hidden sm:inline">|</span>

          {currentUser.role === 'siswa' && (
            <button 
              onClick={() => {
                if (confirm('Apakah Anda ingin mereset database ke data bawaan simulasi (data awal)? Semua akun baru yang terdaftar akan terhapus.')) {
                  resetState();
                }
              }}
              title="Reset Database"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            >
              <RefreshCw size={13} />
            </button>
          )}

          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-white/5 mb-8 gap-2 print:hidden overflow-x-auto py-1">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 ${
            activeTab === 'board'
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
              : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/4 hover:text-gray-300'
          }`}
        >
          <LayoutDashboard size={14} />
          Kanban Board (Trello)
        </button>

        <button
          onClick={() => setActiveTab('logbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 ${
            activeTab === 'logbook'
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
              : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/4 hover:text-gray-300'
          }`}
        >
          <FileSpreadsheet size={14} />
          Jurnal Harian (Logbook)
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition duration-200 ${
            activeTab === 'stats'
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
              : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/4 hover:text-gray-300'
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
  const { currentUser } = usePKL();

  if (!currentUser) {
    return <AuthPage />;
  }

  return <DashboardContent />;
}

export default function Home() {
  return (
    <PKLProvider>
      <div className="min-h-screen flex flex-col justify-between font-sans">
        <HomeWrapper />
        <footer className="py-6 border-t border-white/5 text-center text-xs text-gray-500 print:hidden mt-12 bg-black/20">
          <span>&copy; 2026 TelTrack Nebo. Built with Next.js & Tailwind CSS. Designed by Antigravity.</span>
        </footer>
      </div>
    </PKLProvider>
  );
}
