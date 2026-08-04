'use client';

import React, { useState, useMemo } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard } from '../types/pkl';
import { 
  Printer, Calendar, Award, Clock, Eye, Edit2, Trash2, Search, Filter, Download, 
  CheckCircle2, AlertCircle, FileText, X, Star, Sparkles, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PARTICIPANT_ROLES } from '../lib/constants';
import { calculateDuration } from '@/utils/time';

interface LogbookTableProps {
  onOpenCard?: (card: PKLCard) => void;
  onEditCard?: (card: PKLCard) => void;
}

export const LogbookTable: React.FC<LogbookTableProps> = ({ onOpenCard, onEditCard }) => {
  const { t } = useLanguage();
  const { state, currentUser, deleteCard, gradeCardByMentor, gradeCardByAdvisor } = usePKL();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Grading Modal State
  const [gradingCard, setGradingCard] = useState<PKLCard | null>(null);
  const [discScore, setDiscScore] = useState<number>(85);
  const [skillOrRepScore, setSkillOrRepScore] = useState<number>(85);
  const [attOrCommScore, setAttOrCommScore] = useState<number>(85);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const isMentor = currentUser?.role === 'Mentor' || currentUser?.role === 'Mentor Perusahaan';
  const isAdvisor = currentUser?.role === 'Dosen Pembimbing' || currentUser?.role === 'Guru Pembimbing' || currentUser?.role === 'Guru';
  const isSiswa = currentUser?.role && PARTICIPANT_ROLES.includes(currentUser.role);

  const handlePrint = () => {
    window.print();
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return state.cards.filter(card => {
      // Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = card.title.toLowerCase().includes(query);
        const descMatch = (card.description || '').toLowerCase().includes(query);
        const catMatch = (card.category || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && card.category !== selectedCategory) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all' && card.columnId !== selectedStatus) {
        return false;
      }

      // Date Range Filter
      const cardDate = card.createdAt.split('T')[0];
      if (dateStart && cardDate < dateStart) return false;
      if (dateEnd && cardDate > dateEnd) return false;

      return true;
    });
  }, [state.cards, searchTerm, selectedCategory, selectedStatus, dateStart, dateEnd]);

  // Statistics Header for Logbook
  const totalLogbookHours = useMemo(() => {
    return Math.round(filteredCards.reduce((sum, c) => sum + calculateDuration(c.startTime, c.endTime), 0));
  }, [filteredCards]);

  const approvedCount = useMemo(() => filteredCards.filter(c => c.columnId === 'selesai').length, [filteredCards]);
  const reviewCount = useMemo(() => filteredCards.filter(c => c.columnId === 'review').length, [filteredCards]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredCards.length === 0) {
      alert('Tidak ada data jurnal untuk di-export.');
      return;
    }

    const headers = ['No', 'Tanggal Mulai', 'Tenggat Selesai', 'Waktu Kerja', 'Kategori', 'Judul Kegiatan', 'Rincian Deskripsi', 'Status', 'Nilai Mentor', 'Nilai Guru'];
    const rows = filteredCards.map((c, idx) => [
      idx + 1,
      c.createdAt.split('T')[0],
      c.dueDate || '-',
      `${c.startTime || ''} - ${c.endTime || ''}`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.columnId === 'selesai' ? 'Selesai' : c.columnId === 'review' ? 'Menunggu Review' : c.columnId === 'progres' ? 'Sedang Dikerjakan' : 'Rencana',
      c.scoreMentor ?? '-',
      c.scoreAdvisor ?? '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Logbook_Jurnal_PKL_${state.studentName || 'Siswa'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Grading Modal
  const openGradingModal = (card: PKLCard) => {
    setGradingCard(card);
    if (isMentor) {
      setDiscScore(card.scoreMentorDiscipline ?? 85);
      setSkillOrRepScore(card.scoreMentorSkill ?? 85);
      setAttOrCommScore(card.scoreMentorAttitude ?? 85);
      setFeedbackText(card.feedbackMentor || '');
    } else {
      setDiscScore(card.scoreAdvisorDiscipline ?? 85);
      setSkillOrRepScore(card.scoreAdvisorReport ?? 85);
      setAttOrCommScore(card.scoreAdvisorCommunication ?? 85);
      setFeedbackText(card.feedbackAdvisor || '');
    }
  };

  // Submit Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingCard) return;
    setIsSubmittingGrade(true);
    try {
      if (isMentor) {
        await gradeCardByMentor(gradingCard.id, Number(discScore), Number(skillOrRepScore), Number(attOrCommScore), feedbackText);
      } else {
        await gradeCardByAdvisor(gradingCard.id, Number(discScore), Number(skillOrRepScore), Number(attOrCommScore), feedbackText);
      }
      setGradingCard(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan nilai.');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800/50';
      case 'review':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800/50';
      case 'progres':
        return 'text-blue-700 dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/50';
      default:
        return 'text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selesai': return t('statusDone');
      case 'review': return t('statusReview');
      case 'progres': return t('statusProgress');
      default: return t('statusPlan');
    }
  };

  const formatTitleCase = (str?: string) => {
    if (!str || str === '-' || str === '____________________') return str || '-';
    return str
      .split(' ')
      .map((word) => {
        if (!word) return '';
        if (word === word.toUpperCase() && word.length <= 4) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const formatDateRange = (dueDateStr?: string, createdAtStr?: string) => {
    const start = createdAtStr ? createdAtStr.split('T')[0] : '';
    const end = dueDateStr || '';

    if (start && end && start !== end) {
      const startFmt = new Date(start).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const endFmt = new Date(end).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
      return `${startFmt} - ${endFmt}`;
    }

    const singleDate = start || end || createdAtStr?.split('T')[0];
    return singleDate ? new Date(singleDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  };

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200 font-sans">
      
      {/* 📊 Summary Cards (Non-Printable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalLogbookHours')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{totalLogbookHours} {t('hoursSuffix')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('logbookApproved')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{approvedCount} {t('journalSuffix')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('waitingReview')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{reviewCount} {t('journalSuffix')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalEntries')}</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block">{filteredCards.length} {t('entriesSuffix')}</span>
          </div>
        </div>
      </div>

      {/* 🔍 Search, Filter, & Action Header Bar (Non-Printable) */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col gap-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchLogbook')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>{t('printBtn')}</span>
            </button>
          </div>

        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
          
          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">{t('category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">{t('allCategories')}</option>
              <option value="Coding">{t('coding') || 'Coding'}</option>
              <option value="Design">{t('design') || 'Design'}</option>
              <option value="Laporan">{t('report') || 'Laporan'}</option>
              <option value="Networking">{t('networking') || 'Networking'}</option>
              <option value="Lainnya">{t('others') || 'Lainnya'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">{t('colStatus') || 'Status'}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="selesai">{t('statusDone')}</option>
              <option value="review">{t('statusReview')}</option>
              <option value="progres">{t('statusProgress')}</option>
              <option value="rencana">{t('statusPlan')}</option>
            </select>
          </div>

          {/* Date Start Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">{t('fromDate')}</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-gray-200 focus:outline-none"
            />
          </div>

          {/* Date End Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">{t('toDate')}</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-gray-200 focus:outline-none"
            />
          </div>

        </div>
      </div>

      {/* Main Printable Logbook Container */}
      <div className="bg-white dark:bg-[#243447] rounded-2xl p-5 md:p-8 border border-[#E2E8F0] dark:border-gray-700 shadow-sm relative overflow-hidden print:overflow-visible print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Printable Cover Page */}
        <div className="hidden print:flex flex-col items-center justify-between min-h-[25cm] w-full py-8 px-6 text-black box-border" style={{ pageBreakAfter: 'always' }}>
          <div className="flex flex-col items-center text-center w-full mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nebo.png" alt="Logo" className="w-36 h-36 object-contain mb-6" />
            <div className="border-b-2 border-black pb-4 mb-2 w-full max-w-xl">
              <h1 className="text-2xl font-black uppercase text-black tracking-wide leading-snug">{t("reportTitle")}</h1>
              <h2 className="text-xl font-bold uppercase text-black/80 tracking-wide mt-1">{t("reportSubtitle")}</h2>
            </div>
          </div>

          <div className="w-full max-w-xl bg-slate-50/50 p-6 rounded-xl border border-black/20 my-auto shadow-none">
            <table className="text-sm font-semibold text-black border-none text-left w-full">
              <tbody>
                <tr className="border-b border-gray-200/80"><td className="py-2.5 pr-6 text-black/70 w-44">{t("studentName")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{formatTitleCase(state.studentName)}</td></tr>
                <tr className="border-b border-gray-200/80"><td className="py-2.5 pr-6 text-black/70">{t("nisn")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{state.nisn || '-'}</td></tr>
                <tr className="border-b border-gray-200/80"><td className="py-2.5 pr-6 text-black/70">{t("schoolOrigin")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{formatTitleCase((currentUser as any)?.school || '-')}</td></tr>
                <tr className="border-b border-gray-200/80"><td className="py-2.5 pr-6 text-black/70">{t("internCompany")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{state.companyName || '-'}</td></tr>
                <tr className="border-b border-gray-200/80"><td className="py-2.5 pr-6 text-black/70">{t("externalAdvisor")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{formatTitleCase(state.mentorName)}</td></tr>
                <tr><td className="py-2.5 pr-6 text-black/70">{t("internalAdvisor")}</td><td className="py-2.5 px-2">:</td><td className="py-2.5 font-bold">{formatTitleCase(state.advisorName)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center text-center text-xs font-semibold text-black/70 mb-4">
            <p className="uppercase tracking-wider font-bold text-sm text-black">
              {formatTitleCase((currentUser as any)?.school || (currentUser as any)?.institution?.name || '-')}
            </p>
            <p className="mt-1">Tahun {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Printable Header Info */}
        <div className="hidden print:block mb-6 border-b-[3px] border-black pb-4 mt-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide">
              {t('logbookTitle')}
            </h2>
            <p className="text-sm text-black/80 mt-1">
              {t('logbookSubtitle')}
            </p>
          </div>
        </div>

        {/* Table representation (Desktop) */}
        <div className="hidden md:block print:block overflow-x-auto print:overflow-visible w-full">
          <table className="w-full text-left border-collapse text-xs border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-hidden print:overflow-visible shadow-sm print:border-black print:rounded-none">
            <thead className="print:table-header-group">
              <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold uppercase tracking-wider bg-[#F8FAFC] dark:bg-gray-900 print:border-black print:text-black print:bg-gray-100">
                <th className="py-3 px-2 w-10 text-center print:border print:border-black print:py-3 print:px-2">{t("no")}</th>
                <th className="py-3 px-3 w-36 print:border print:border-black print:py-3 print:px-2">TANGGAL MULAI - SELESAI</th>
                <th className="py-3 px-3 w-24 print:border print:border-black print:py-3 print:px-2">{t("category")}</th>
                <th className="py-3 px-4 print:border print:border-black print:py-3 print:px-2">{t("details")}</th>
                <th className="py-3 px-3 w-24 text-center print:border print:border-black print:py-3 print:px-2">{t("status")}</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">{t("internalEvaluation")}</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">{t("externalEvaluation")}</th>
                <th className="py-3 px-4 w-52 print:hidden">{t('eval')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] print:divide-black text-slate-700 print:text-black">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic print:border print:border-black">
                    Tidak ada kegiatan logbook yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150 print:hover:bg-transparent">
                    <td className="py-4 px-2 text-center font-medium print:border print:border-black print:py-2 align-top">{index + 1}</td>
                    
                    {/* Date Column: Start Date & Due Date */}
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-slate-800 dark:text-gray-100 flex items-center gap-1.5 whitespace-nowrap print:whitespace-normal">
                          <Calendar size={12} className="text-primary print:hidden" />
                          <span>{formatDateRange(card.dueDate, card.createdAt)}</span>
                        </div>
                        {(card.startTime || card.endTime) && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold print:hidden">
                            <Clock size={11} className="text-blue-500" />
                            <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <span className="px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 print:border-none print:bg-transparent text-[11px] font-semibold text-slate-700 dark:text-gray-300 print:px-0 print:py-0">
                        {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                      </span>
                    </td>

                    {/* Title & Description */}
                    <td className="py-4 px-4 leading-relaxed font-medium print:border print:border-black print:py-2 align-top">
                      <div className="font-bold text-slate-800 dark:text-gray-100 print:text-black mb-1">{card.title}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-gray-300 print:text-black whitespace-pre-wrap">
                        {card.description}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-3 text-center whitespace-nowrap print:border print:border-black print:py-2 align-top">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(card.columnId)} print:border-none print:text-black print:bg-transparent print:px-0 print:py-0 print:text-xs`}>
                        {getStatusText(card.columnId)}
                      </span>
                    </td>
                    
                    {/* Pembimbing Internal (Sekolah) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreAdvisor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">{t('averageScore')}: {card.scoreAdvisor}/100</div>
                          {card.feedbackAdvisor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackAdvisor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Pembimbing Eksternal (Perusahaan) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreMentor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">{t('averageScore')}: {card.scoreMentor}/100</div>
                          {card.feedbackMentor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackMentor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Desktop Screen Evaluations Column + Direct Grade Button */}
                    <td className="py-4 px-4 print:hidden align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1.5 text-[10px]">
                          {card.scoreMentor !== undefined ? (
                            <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] dark:border-gray-700 pb-1">
                              <div className="flex items-center gap-1 text-purple-600 font-bold">
                                <Award size={10} />
                                {t('mentor')}: {card.scoreMentor}/100
                              </div>
                              {card.feedbackMentor && (
                                <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic line-clamp-1">
                                  &ldquo;{card.feedbackMentor}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[9px] border-b border-slate-100 dark:border-gray-700 pb-1">{t('notEvaluatedMentor')}</span>
                          )}

                          {card.scoreAdvisor !== undefined ? (
                            <div className="flex flex-col gap-0.5 pt-0.5">
                              <div className="flex items-center gap-1 text-amber-600 font-bold">
                                <Award size={10} />
                                {t('teacher')}: {card.scoreAdvisor}/100
                              </div>
                              {card.feedbackAdvisor && (
                                <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic line-clamp-1">
                                  &ldquo;{card.feedbackAdvisor}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[9px] pt-0.5">{t('notEvaluatedAdvisor')}</span>
                          )}
                        </div>

                        {/* Direct Grade Button for Mentors / Advisors */}
                        {(isMentor || isAdvisor) && (
                          <button
                            onClick={() => openGradingModal(card)}
                            className="w-full py-1.5 px-2 bg-slate-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-slate-700 dark:text-gray-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Star size={11} className="text-amber-500" />
                            <span>{isMentor ? (card.scoreMentor ? 'Edit Nilai Mentor' : 'Beri Nilai Mentor') : (card.scoreAdvisor ? 'Edit Nilai Guru' : 'Beri Nilai Guru')}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Timeline/Card List (Mobile-only) */}
        <div className="md:hidden flex flex-col gap-6 mt-4 print:hidden relative pl-5 border-l border-slate-200 dark:border-gray-700 ml-3">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl text-center text-slate-400 -ml-4">
              <span className="italic text-xs">Tidak ada kegiatan logbook yang sesuai filter.</span>
            </div>
          ) : (
            filteredCards.map((card) => {
              const hasMentorScore = card.scoreMentor !== undefined && card.scoreMentor !== null;
              const hasAdvisorScore = card.scoreAdvisor !== undefined && card.scoreAdvisor !== null;

              return (
                <div key={card.id} className="relative">
                  <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[25.5px] border-[1.5px] border-white dark:border-gray-900 top-7 shadow-sm z-10" />
                  
                  <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow transition duration-200 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 text-[10px] font-bold text-slate-700 dark:text-gray-300 uppercase">
                        {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase ${getStatusBadge(card.columnId)}`}>
                        {getStatusText(card.columnId)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-1">{card.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-300 leading-relaxed">{card.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-slate-600 dark:text-gray-300 border-t border-slate-100 dark:border-gray-700 pt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary" />
                        <span>{formatDateRange(card.dueDate, card.createdAt)}</span>
                      </div>
                      {(card.startTime || card.endTime) && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-blue-500" />
                          <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                        </div>
                      )}
                    </div>

                    {/* Evaluations info */}
                    {(hasMentorScore || hasAdvisorScore) && (
                      <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3 border border-slate-100 dark:border-gray-700 flex flex-col gap-2 text-[10px]">
                        {hasMentorScore && (
                          <div className="flex items-center gap-1 text-purple-700 font-bold">
                            <Award size={12} />
                            <span>{t('mentor')}: {card.scoreMentor}/100</span>
                          </div>
                        )}
                        {hasAdvisorScore && (
                          <div className="flex items-center gap-1 text-amber-700 font-bold">
                            <Award size={12} />
                            <span>{t('teacher')}: {card.scoreAdvisor}/100</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t border-slate-100 dark:border-gray-700 pt-3">
                      <button
                        onClick={() => onOpenCard?.(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] text-slate-700 dark:text-gray-200 rounded-xl font-bold text-xs py-2 transition cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{t("detail")}</span>
                      </button>

                      {(isMentor || isAdvisor) && (
                        <button
                          onClick={() => openGradingModal(card)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs py-2 transition cursor-pointer"
                        >
                          <Star size={13} />
                          <span>Beri Nilai</span>
                        </button>
                      )}

                      {isSiswa && (
                        <>
                          <button
                            onClick={() => onEditCard?.(card)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-500/20 bg-primary/10 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-xs py-2 transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                            <span>{t("edit")}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t("deleteConfirm"))) {
                                deleteCard(card.id);
                              }
                            }}
                            className="px-3 border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-xl font-bold text-xs py-2 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Printable Signature Lines */}
        <div className="hidden print:grid grid-cols-3 gap-6 mt-16 text-[11px] text-black" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="flex flex-col items-center text-center">
            <span>{t("signatureAcknowledged")}</span>
            <span className="font-bold mt-1">Pembimbing Eksternal (Perusahaan)</span>
            <div className="h-20" />
            <span className="font-bold underline">{formatTitleCase(state.mentorName) !== '-' ? formatTitleCase(state.mentorName) : '____________________'}</span>
            <span className="mt-1">{t("positionSignature")} ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>{t("signatureAcknowledged")}</span>
            <span className="font-bold mt-1">Pembimbing Internal (Sekolah)</span>
            <div className="h-20" />
            <span className="font-bold underline">{formatTitleCase(state.advisorName) !== '-' ? formatTitleCase(state.advisorName) : '____________________'}</span>
            <span className="mt-1">{t("nipSignature")} ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>Bojong, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-bold mt-1">{t("studentSignature")}</span>
            <div className="h-20" />
            <span className="font-bold underline">{formatTitleCase(state.studentName) !== '-' ? formatTitleCase(state.studentName) : '____________________'}</span>
            <span className="mt-1">{state.nisn ? `NISN: ${state.nisn}` : 'NISN: ____________________'}</span>
          </div>
        </div>

        {/* Print Footer Elements */}
        <div className="hidden print:block fixed bottom-0 left-0 right-0 text-[10px] text-black pt-2 pb-2 mt-16 bg-white z-50">
           <div className="border-t-[1.5px] border-black pt-2 flex justify-between items-center px-4">
             <div>
               {t("printedVia")} <strong>NeboTrack</strong> - https://www.nebotrack.my.id
             </div>
             <div>
               {t("printDate")} {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
             </div>
           </div>
        </div>

      </div>

      {/* ⭐ Direct Supervisor Evaluation Modal */}
      {gradingCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#243447] border border-slate-200 dark:border-gray-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                  Evaluasi Kegiatan: {gradingCard.title}
                </h3>
              </div>
              <button onClick={() => setGradingCard(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                    {isMentor ? 'Kedisiplinan & Kehadiran' : 'Kedisiplinan Jurnal'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={discScore}
                    onChange={(e) => setDiscScore(Number(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-center font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                    {isMentor ? 'Keahlian / Skill Pekerjaan' : 'Kesesuaian Laporan'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={skillOrRepScore}
                    onChange={(e) => setSkillOrRepScore(Number(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-center font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                    {isMentor ? 'Sikap & Etika (Attitude)' : 'Komunikasi & Keaktifan'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={attOrCommScore}
                    onChange={(e) => setAttOrCommScore(Number(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-center font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-200">Catatan Masukan / Saran</label>
                <textarea
                  rows={3}
                  placeholder="Berikan saran atau apresiasi untuk kegiatan ini..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-xs text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setGradingCard(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-700 dark:text-gray-300 font-semibold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingGrade ? <RefreshCw size={14} className="animate-spin" /> : <Star size={14} />}
                  <span>Simpan Nilai</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind print helper styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, header, footer:not(.print\\:block), button, .print\\:hidden, [role="button"] {
            display: none !important;
          }
          main, div, table, tr, td {
            box-shadow: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          .print\\:grid {
            display: grid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .fixed.bottom-0 {
            position: fixed !important;
            bottom: 0 !important;
          }
          .pageNumber::after {
            content: counter(page);
          }
          .totalPages::after {
            content: counter(pages);
          }
        }
      `}</style>
    </div>
  );
};
