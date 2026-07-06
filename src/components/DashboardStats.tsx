'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Clock, CheckSquare, Award, MessageSquare, Plus, FileText, Calendar } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { state, activeRole, addAdvisorNote } = usePKL();
  const [newNoteText, setNewNoteText] = useState('');

  // Calculate statistics
  const totalCards = state.cards.length;
  const completedCards = state.cards.filter(c => c.columnId === 'selesai');
  const reviewCards = state.cards.filter(c => c.columnId === 'review');
  const progressCards = state.cards.filter(c => c.columnId === 'progres');
  const plannedCards = state.cards.filter(c => c.columnId === 'rencana');

  const totalHours = state.cards.reduce((sum, card) => sum + card.hoursLogged, 0);
  
  const gradedCards = state.cards.filter(c => c.score !== undefined);
  const averageScore = gradedCards.length > 0
    ? Math.round(gradedCards.reduce((sum, card) => sum + (card.score || 0), 0) / gradedCards.length)
    : 0;

  // Category counts
  const categoryCounts = state.cards.reduce((acc, card) => {
    acc[card.category] = (acc[card.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addAdvisorNote(newNoteText);
    setNewNoteText('');
  };



  return (
    <div className="flex flex-col gap-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Hours */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Total Jam Kerja</span>
            <span className="text-3xl font-black text-gray-100">{totalHours} <span className="text-sm font-normal text-gray-400">jam</span></span>
          </div>
        </div>

        {/* Metric 2: Completion Rate */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Persentase Selesai</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-100">
                {totalCards > 0 ? Math.round((completedCards.length / totalCards) * 100) : 0}%
              </span>
              <span className="text-xs text-gray-400">({completedCards.length}/{totalCards} tugas)</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Score */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Rata-Rata Nilai</span>
            <span className="text-3xl font-black text-gray-100">
              {averageScore > 0 ? averageScore : '-'}{' '}
              {averageScore > 0 && <span className="text-xs font-semibold text-emerald-400">/ 100</span>}
            </span>
          </div>
        </div>

        {/* Metric 4: Review Pending */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Menunggu Review</span>
            <span className="text-3xl font-black text-gray-100">{reviewCards.length} <span className="text-sm font-normal text-gray-400">tugas</span></span>
          </div>
        </div>

      </div>

      {/* Main Grid: Details breakdown & Advisor notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side (2 cols): Charts / Detailed progress */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-6">
            <h3 className="font-bold text-gray-200 text-base">Distribusi Status & Kategori Kegiatan</h3>
            
            {/* Status Breakdown Bars */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Progres Kegiatan</h4>
              <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                <div style={{ width: `${totalCards > 0 ? (completedCards.length / totalCards) * 100 : 0}%` }} className="bg-emerald-500" title="Selesai" />
                <div style={{ width: `${totalCards > 0 ? (reviewCards.length / totalCards) * 100 : 0}%` }} className="bg-amber-500" title="Butuh Review" />
                <div style={{ width: `${totalCards > 0 ? (progressCards.length / totalCards) * 100 : 0}%` }} className="bg-indigo-500" title="Sedang Dikerjakan" />
                <div style={{ width: `${totalCards > 0 ? (plannedCards.length / totalCards) * 100 : 0}%` }} className="bg-slate-500" title="Rencana" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-300">Selesai ({completedCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-300">Review ({reviewCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs text-gray-300">Dikerjakan ({progressCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-xs text-gray-300">Rencana ({plannedCards.length})</span>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Distribusi Kategori Pekerjaan</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const percent = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
                  return (
                    <div key={cat} className="bg-white/2 border border-white/5 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-200">{cat}</span>
                        <span className="text-gray-400">{count} tugas ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${
                            cat === 'Coding' ? 'bg-indigo-500' :
                            cat === 'Design' ? 'bg-purple-500' :
                            cat === 'Laporan' ? 'bg-emerald-500' :
                            cat === 'Networking' ? 'bg-sky-500' :
                            'bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Advisor notes (Dosen Pembimbing) */}
        <div className="flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-6 h-full min-h-[400px]">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              <h3 className="font-bold text-gray-200 text-base">Catatan Dosen Pembimbing</h3>
            </div>

            {/* Advisor form for student to document notes */}
            <form onSubmit={handleNoteSubmit} className="flex flex-col gap-3">
              <textarea
                placeholder="Catat saran, masukan, atau arahan dari Dosen Pembimbing Anda..."
                required
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <Plus size={14} />
                <span>Simpan Catatan Bimbingan</span>
              </button>
            </form>

            {/* List of notes */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] flex-1 pr-1">
              {state.advisorNotes.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-8">Belum ada catatan bimbingan.</p>
              ) : (
                state.advisorNotes.map((note) => (
                  <div key={note.id} className="bg-white/2 border-l-2 border-indigo-500 rounded-r-xl p-3 flex flex-col gap-2">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                      &ldquo;{note.text}&rdquo;
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-2">
                      <span className="font-semibold text-gray-400">{note.advisorName}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(note.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
