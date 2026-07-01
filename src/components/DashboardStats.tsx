'use client';

import React, { useState, useMemo } from 'react';
import { usePKL } from '../context/PKLContext';
import { 
  Clock, CheckSquare, Award, MessageSquare, Plus, FileText, Calendar, Activity, 
  Target, TrendingUp, Code, Palette, FileSpreadsheet, Globe, Settings, ChevronRight, CheckCircle2, AlertCircle, Hourglass, Sparkles
} from 'lucide-react';
import { calculateDuration } from '@/utils/time';
import { useLanguage } from '../context/LanguageContext';
import { SecretNotesPanel } from './SecretNotesPanel';
import { PARTICIPANT_ROLES } from '@/lib/constants';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

export const DashboardStats: React.FC = () => {
  const { state, addAdvisorNote, currentUser, selectedStudentId } = usePKL();
  const { t } = useLanguage();
  const [newNoteText, setNewNoteText] = useState('');

  // Target Jam PKL Standard (200 jam)
  const TARGET_HOURS = 200;

  // Calculate statistics
  const totalCards = state.cards.length;
  const completedCards = state.cards.filter(c => c.columnId === 'selesai');
  const reviewCards = state.cards.filter(c => c.columnId === 'review');
  const progressCards = state.cards.filter(c => c.columnId === 'progres');
  const plannedCards = state.cards.filter(c => c.columnId === 'rencana');

  const totalHours = Math.round(
    state.cards.reduce((sum, card) => sum + calculateDuration(card.startTime, card.endTime), 0)
  );

  const targetPercentage = Math.min(100, Math.round((totalHours / TARGET_HOURS) * 100));
  
  const mentorGradedCards = state.cards.filter(c => c.scoreMentor !== undefined && c.scoreMentor !== null);
  const averageScoreMentor = mentorGradedCards.length > 0
    ? Math.round(mentorGradedCards.reduce((sum, card) => sum + (card.scoreMentor || 0), 0) / mentorGradedCards.length)
    : 0;

  const advisorGradedCards = state.cards.filter(c => c.scoreAdvisor !== undefined && c.scoreAdvisor !== null);
  const averageScoreAdvisor = advisorGradedCards.length > 0
    ? Math.round(advisorGradedCards.reduce((sum, card) => sum + (card.scoreAdvisor || 0), 0) / advisorGradedCards.length)
    : 0;

  // Category counts & total hours
  const categoryStats = useMemo(() => {
    const defaultCategories = ['Coding', 'Design', 'Laporan', 'Networking'];
    const stats: Record<string, { count: number; hours: number }> = {};
    
    // Initialize default categories
    defaultCategories.forEach(cat => {
      stats[cat] = { count: 0, hours: 0 };
    });

    state.cards.forEach(card => {
      const cat = card.category || 'Lainnya';
      if (!stats[cat]) stats[cat] = { count: 0, hours: 0 };
      stats[cat].count += 1;
      stats[cat].hours += calculateDuration(card.startTime, card.endTime);
    });
    Object.keys(stats).forEach(cat => {
      stats[cat].hours = Math.round(stats[cat].hours * 10) / 10;
    });
    return stats;
  }, [state.cards]);

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addAdvisorNote(newNoteText);
    setNewNoteText('');
  };

  // --- RECHARTS DATA PREPARATION ---
  
  // Status Donut Data
  const statusData = useMemo(() => {
    return [
      { name: t('done'), value: completedCards.length, color: '#22C55E' },
      { name: t('review'), value: reviewCards.length, color: '#F59E0B' },
      { name: t('progress'), value: progressCards.length, color: '#3B82F6' },
      { name: t('plan'), value: plannedCards.length, color: '#94A3B8' }
    ].filter(d => d.value > 0);
  }, [completedCards.length, reviewCards.length, progressCards.length, plannedCards.length, t]);

  // Rolling 7-day Timeline Data for continuous timeline
  const timeSeriesData = useMemo(() => {
    const dateMap: Record<string, { display: string; hours: number }> = {};
    
    // Generate last 7 days keys
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dateMap[isoKey] = { display, hours: 0 };
    }

    // Populate actual card hours
    state.cards.forEach(card => {
      if (!card.createdAt) return;
      const cardDateISO = new Date(card.createdAt).toISOString().split('T')[0];
      const hours = calculateDuration(card.startTime, card.endTime);
      if (dateMap[cardDateISO]) {
        dateMap[cardDateISO].hours += hours;
      } else {
        const display = new Date(card.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        dateMap[cardDateISO] = { display, hours };
      }
    });

    return Object.keys(dateMap)
      .sort()
      .map(key => ({
        date: dateMap[key].display,
        hours: Math.round(dateMap[key].hours * 10) / 10
      }));
  }, [state.cards]);

  // Helper theme for categories
  const getCategoryTheme = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'coding':
        return { icon: Code, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', bar: 'bg-blue-500' };
      case 'design':
        return { icon: Palette, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', bar: 'bg-purple-500' };
      case 'laporan':
        return { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500' };
      case 'networking':
        return { icon: Globe, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800', bar: 'bg-sky-500' };
      default:
        return { icon: Settings, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', bar: 'bg-slate-500' };
    }
  };

  // Recent 5 activities
  const recentCards = useMemo(() => {
    return [...state.cards]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [state.cards]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">{label || payload[0].name}</p>
          <p className="text-sm text-slate-800 dark:text-gray-100 font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: payload[0].payload.fill || payload[0].color || '#3B82F6' }}></span>
            {payload[0].value} {payload[0].dataKey === 'hours' ? t('hours') : t('tasks')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 text-[#0F172A] dark:text-gray-200 font-sans">
      
      {/* 🎯 Target Progress Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-7 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold w-fit border border-white/20">
              <Sparkles size={14} className="text-yellow-300 animate-pulse" />
              <span>Target Jam Kerja PKL</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Pencapaian {totalHours} dari {TARGET_HOURS} Jam Kerja PKL ({targetPercentage}%)
            </h2>
            <p className="text-xs md:text-sm text-blue-100 font-medium">
              {completedCards.length} tugas telah diselesaikan dan disetujui. Pertahankan konsistensi harianmu!
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[240px] lg:w-72 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Progres Target</span>
              <span>{targetPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${targetPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-blue-100/80 text-right">Sisa {Math.max(0, TARGET_HOURS - totalHours)} Jam Lagi</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Metric 1: Total Hours */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 text-blue-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-gray-400 tracking-wider block">{t('totalHours')}</span>
            <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-gray-100">{totalHours} <span className="text-xs md:text-sm font-normal text-[#64748B] dark:text-gray-400">{t('hours')}</span></span>
          </div>
        </div>

        {/* Metric 2: Completion Rate */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-600 rounded-2xl">
            <CheckSquare size={24} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-gray-400 tracking-wider block">{t('completionRate')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-gray-100">
                {totalCards > 0 ? Math.round((completedCards.length / totalCards) * 100) : 0}%
              </span>
              <span className="text-[10px] md:text-xs text-[#64748B] dark:text-gray-400 font-semibold">({completedCards.length}/{totalCards} tugas)</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Score */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800 text-purple-600 rounded-2xl">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-gray-400 tracking-wider block mb-1">{t('averageScore')}</span>
            <div className="flex flex-col gap-1 text-[11px] font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[#64748B] dark:text-gray-400">Eksternal:</span> 
                <span className="font-bold text-purple-600 dark:text-purple-400">{averageScoreMentor > 0 ? `${averageScoreMentor}/100` : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748B] dark:text-gray-400">Internal:</span> 
                <span className="font-bold text-amber-600 dark:text-amber-400">{averageScoreAdvisor > 0 ? `${averageScoreAdvisor}/100` : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Review Pending */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800 text-amber-600 rounded-2xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-gray-400 tracking-wider block">{t('pendingReview')}</span>
            <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-gray-100">{reviewCards.length} <span className="text-xs md:text-sm font-normal text-[#64748B] dark:text-gray-400">{t('tasks')}</span></span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid - Responsive Order */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* 🍩 Status Donut Chart (Mobile: 1st, Desktop: Top-Right) */}
        <div className="lg:col-start-3 lg:col-span-1 lg:row-start-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col gap-6 justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-100 text-base text-center mb-1">{t('statusProgressTitle')}</h3>
            <p className="text-xs text-slate-400 dark:text-gray-400 text-center mb-4">Ringkasan status tugas logbook</p>
          </div>

          <div className="h-[180px] w-full relative">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">Belum ada data tugas</div>
            )}
            
            {/* Center Label for Donut */}
            {statusData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{totalCards}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Tugas</span>
              </div>
            )}
          </div>
          
          {/* Detailed Status Breakdown List */}
          <div className="flex flex-col gap-2 pt-4 border-t border-[#E2E8F0] dark:border-gray-700">
            <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Selesai (Disetujui)</span>
              </span>
              <span className="font-bold">{completedCards.length} ({totalCards > 0 ? Math.round((completedCards.length/totalCards)*100) : 0}%)</span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                <span>Butuh Review</span>
              </span>
              <span className="font-bold">{reviewCards.length} ({totalCards > 0 ? Math.round((reviewCards.length/totalCards)*100) : 0}%)</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
              <span className="flex items-center gap-2">
                <Hourglass size={14} className="text-blue-500" />
                <span>Sedang Dikerjakan</span>
              </span>
              <span className="font-bold">{progressCards.length} ({totalCards > 0 ? Math.round((progressCards.length/totalCards)*100) : 0}%)</span>
            </div>
          </div>
        </div>

        {/* 🎨 Rich Category Progress Cards (Mobile: 2nd, Desktop: Top-Left) */}
        <div className="lg:col-start-1 lg:col-span-2 lg:row-start-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-100 text-base mb-1">{t('categoryDistribution')}</h3>
            <p className="text-xs text-slate-400 dark:text-gray-400">Pembagian fokus pekerjaan berdasarkan kategori bidang PKL</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(categoryStats).map((catKey) => {
              const { count, hours } = categoryStats[catKey];
              const theme = getCategoryTheme(catKey);
              const IconComp = theme.icon;
              const percent = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;

              return (
                <div key={catKey} className="bg-slate-50/80 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${theme.color}`}>
                        <IconComp size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-gray-200 text-sm">{catKey}</h4>
                        <span className="text-[11px] text-slate-400">{Math.round(hours * 10) / 10} Jam Kerja</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-gray-300">{count} Tugas</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span>Progres Kategori</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${theme.bar} transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 📈 Time-Series Chart (Mobile: 3rd, Desktop: Bottom-Left) */}
        <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-gray-100 text-base">Tren Aktivitas Jam Kerja (7 Hari Terakhir)</h3>
                <p className="text-xs text-slate-400 dark:text-gray-400">Grafik konsistensi pengisian logbook harian</p>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="linear" dataKey="hours" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" activeDot={{ r: 7, fill: '#3B82F6', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📝 Advisor Notes Section (Mobile: 4th, Desktop: Bottom-Right) */}
        <div className="lg:col-start-3 lg:col-span-1 lg:row-start-2 flex flex-col gap-6">

          <div className="bg-gradient-to-br from-white to-blue-50/20 dark:from-[#243447] dark:to-[#1e2a3b] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col gap-5 h-full">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-gray-700 pb-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-gray-100 text-base">{t('advisorNotesTitle')}</h3>
                <p className="text-[10px] text-slate-400">Catatan arahan dari dosen / guru pembimbing</p>
              </div>
            </div>

            <form onSubmit={handleNoteSubmit} className="flex flex-col gap-3">
              <textarea
                placeholder={t('advisorNotesPlaceholder')}
                required
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 resize-none shadow-sm min-h-[75px]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={15} />
                <span>{t('saveNote')}</span>
              </button>
            </form>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] flex-1 pr-1 custom-scrollbar">
              {state.advisorNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 opacity-60">
                  <MessageSquare size={28} className="text-slate-300 mb-1" />
                  <p className="text-xs text-slate-500 italic text-center">{t('emptyNotes')}</p>
                </div>
              ) : (
                state.advisorNotes.map((note) => (
                  <div key={note.id} className="bg-white dark:bg-[#1E293B] border-l-4 border-primary border border-[#E2E8F0] dark:border-gray-700 rounded-r-xl p-3 shadow-sm">
                    <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed font-medium mb-2">
                      "{note.text}"
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-primary">{note.advisorName}</span>
                      <span className="flex items-center gap-1 bg-slate-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        <Calendar size={10} />
                        {new Date(note.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Secret Notes Panel (Only for Mentors/Gurus/Admin) */}
          {currentUser && !PARTICIPANT_ROLES.includes(currentUser.role) && (
            <SecretNotesPanel 
              studentId={selectedStudentId || (PARTICIPANT_ROLES.includes(currentUser.role) ? currentUser.id : '')} 
            />
          )}
        </div>

      </div>

    </div>
  );
};
