'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { Clock, CheckSquare, Award, MessageSquare, Plus, FileText, Calendar } from 'lucide-react';
import { calculateDuration } from '@/utils/time';

export const DashboardStats: React.FC = () => {
  const { state, addAdvisorNote } = usePKL();
  const [newNoteText, setNewNoteText] = useState('');

  // Calculate statistics
  const totalCards = state.cards.length;
  const completedCards = state.cards.filter(c => c.columnId === 'selesai');
  const reviewCards = state.cards.filter(c => c.columnId === 'review');
  const progressCards = state.cards.filter(c => c.columnId === 'progres');
  const plannedCards = state.cards.filter(c => c.columnId === 'rencana');

  const totalHours = Math.round(
    state.cards.reduce((sum, card) => sum + calculateDuration(card.startTime, card.endTime), 0)
  );
  
  const mentorGradedCards = state.cards.filter(c => c.scoreMentor !== undefined && c.scoreMentor !== null);
  const averageScoreMentor = mentorGradedCards.length > 0
    ? Math.round(mentorGradedCards.reduce((sum, card) => sum + (card.scoreMentor || 0), 0) / mentorGradedCards.length)
    : 0;

  const advisorGradedCards = state.cards.filter(c => c.scoreAdvisor !== undefined && c.scoreAdvisor !== null);
  const averageScoreAdvisor = advisorGradedCards.length > 0
    ? Math.round(advisorGradedCards.reduce((sum, card) => sum + (card.scoreAdvisor || 0), 0) / advisorGradedCards.length)
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
    <div className="flex flex-col gap-6 md:gap-8 text-[#0F172A] font-sans">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Metric 1: Total Hours */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/2 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-blue-50 border border-blue-100 text-[#2563EB] rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Total Jam Kerja</span>
            <span className="text-2xl md:text-3xl font-black text-slate-800">{totalHours} <span className="text-xs md:text-sm font-normal text-[#64748B]">jam</span></span>
          </div>
        </div>

        {/* Metric 2: Completion Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-green-50 border border-green-100 text-[#22C55E] rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Persentase Selesai</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-800">
                {totalCards > 0 ? Math.round((completedCards.length / totalCards) * 100) : 0}%
              </span>
              <span className="text-[10px] md:text-xs text-[#64748B]">({completedCards.length}/{totalCards} tugas)</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Score */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">Rata-Rata Nilai</span>
            <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-700">
              <div>
                Eksternal: <span className="text-sm font-bold text-purple-600">{averageScoreMentor > 0 ? `${averageScoreMentor}/100` : '-'}</span>
              </div>
              <div>
                Internal: <span className="text-sm font-bold text-yellow-600">{averageScoreAdvisor > 0 ? `${averageScoreAdvisor}/100` : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Review Pending */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3.5 bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Menunggu Review</span>
            <span className="text-2xl md:text-3xl font-black text-slate-800">{reviewCards.length} <span className="text-xs md:text-sm font-normal text-[#64748B]">tugas</span></span>
          </div>
        </div>

      </div>

      {/* Main Grid: Details breakdown & Advisor notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 text-left">
        
        {/* Left Side (2 cols): Charts / Detailed progress */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-6">
            <h3 className="font-bold text-slate-800 text-base">Distribusi Status & Kategori Kegiatan</h3>
            
            {/* Status Breakdown Bars */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status Progres Kegiatan</h4>
              <div className="flex h-3 rounded-full overflow-hidden bg-[#F1F5F9]">
                <div style={{ width: `${totalCards > 0 ? (completedCards.length / totalCards) * 100 : 0}%` }} className="bg-[#22C55E]" title="Selesai" />
                <div style={{ width: `${totalCards > 0 ? (reviewCards.length / totalCards) * 100 : 0}%` }} className="bg-[#F59E0B]" title="Butuh Review" />
                <div style={{ width: `${totalCards > 0 ? (progressCards.length / totalCards) * 100 : 0}%` }} className="bg-[#2563EB]" title="Sedang Dikerjakan" />
                <div style={{ width: `${totalCards > 0 ? (plannedCards.length / totalCards) * 100 : 0}%` }} className="bg-slate-400" title="Rencana" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-xs text-slate-700">Selesai ({completedCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-xs text-slate-700">Review ({reviewCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span className="text-xs text-slate-700">Dikerjakan ({progressCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-700">Rencana ({plannedCards.length})</span>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="flex flex-col gap-4 border-t border-[#E2E8F0] pt-6">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Distribusi Kategori Pekerjaan</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(new Set([...['Coding', 'Design', 'Laporan', 'Networking'], ...Object.keys(categoryCounts)])).map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const percent = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
                  return (
                    <div key={cat} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{cat}</span>
                        <span className="text-[#64748B]">{count} tugas ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${
                            cat === 'Coding' ? 'bg-[#2563EB]' :
                            cat === 'Design' ? 'bg-purple-600' :
                            cat === 'Laporan' ? 'bg-[#22C55E]' :
                            cat === 'Networking' ? 'bg-sky-500' :
                            'bg-slate-400'
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
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-6 h-full min-h-[400px]">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" />
              <h3 className="font-bold text-slate-800 text-base">Catatan Pembimbing Internal</h3>
            </div>

            {/* Advisor form for student to document notes */}
            <form onSubmit={handleNoteSubmit} className="flex flex-col gap-3">
              <textarea
                placeholder="Catat saran, masukan, atau arahan dari Pembimbing Internal Anda..."
                required
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3.5 text-sm md:text-xs focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none shadow-sm min-h-[80px] md:min-h-0 md:p-3"
              />
              <button
                type="submit"
                className="w-full py-3 md:py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm md:text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[48px] md:min-h-0"
              >
                <Plus size={14} />
                <span>Simpan Catatan Bimbingan</span>
              </button>
            </form>

            {/* List of notes */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] flex-1 pr-1">
              {state.advisorNotes.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">Belum ada catatan bimbingan.</p>
              ) : (
                state.advisorNotes.map((note) => (
                  <div key={note.id} className="bg-[#F8FAFC] border-l-2 border-[#2563EB] border-y border-r border-[#E2E8F0] rounded-r-xl p-3 flex flex-col gap-2 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      &ldquo;{note.text}&rdquo;
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-[#E2E8F0] pt-2">
                      <span className="font-semibold text-slate-500">{note.advisorName}</span>
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
