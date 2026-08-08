'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { useLanguage } from '../context/LanguageContext';
import { getDashboardMetricsAction, getMonthlyReportDataAction, setFinalGradeAction } from '@/app/actions/pkl';
import { Users, Calendar, FileSpreadsheet, Award, UserCheck, BarChart3, AlertCircle, Download, FileBarChart, FileText, Sun, Moon, Globe, Sparkles, LineChart, KanbanSquare } from 'lucide-react';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from 'next-themes';
import { AnnouncementEditor } from './AnnouncementEditor';
import { DailyDashboard } from './DailyDashboard';
import { PendingReviewsList } from './PendingReviewsList';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BackgroundPicker } from './BackgroundPicker';


interface GuruPortalProps {
  onPantau: (studentId: string, tab?: 'board' | 'attendance', showTabs?: boolean) => void;
}

interface DashboardMetrics {
  totalStudents: number;
  monitoringToday: number;
  pendingReview: number;
  pendingGrades: number;
  averageGrade: number;
  columnCounts: {
    rencana: number;
    progres: number;
    review: number;
    selesai: number;
  };
}

export const GuruPortal: React.FC<GuruPortalProps> = ({ onPantau }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDarkMode = (resolvedTheme || theme) === 'dark';
  const {
    currentUser,
    studentsList,
    selectedClassId,
    setSelectedClassId,
  } = usePKL();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'attendance' | 'progress' | 'analytics' | 'students'>('overview');

  useEffect(() => {
    const loadMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const m = await getDashboardMetricsAction(selectedClassId || undefined, undefined);
        console.log('METRICS: ', m); setMetrics(m as DashboardMetrics);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMetrics(false);
      }
    };
    loadMetrics();
  }, [selectedClassId]);

  const hasAssignment = currentUser?.classes && currentUser.classes.length > 0;
  const activeClassName = currentUser?.classes?.find((c: { id: string; name: string }) => c.id === selectedClassId)?.name || 'Kelas Aktif';

  const [isExportingExcelList, setIsExportingExcelList] = useState(false);
  const [isExportingPDFList, setIsExportingPDFList] = useState(false);

  const handleExportExcelList = () => {
    try {
      setIsExportingExcelList(true);
      const dataToExport = studentsList.map((student: any, index: number) => ({
        'No': index + 1,
        'Nama Siswa': student.name,
        'NISN/NIM': student.nisn || '-',
        'Kelas': student.className || '-',
        'Sekolah': student.school || '-',
        'Kehadiran (Status)': student.attendanceStatus === 'CHECKED_IN' ? 'Hadir' : student.attendanceStatus === 'HALF_DAY' ? 'Setengah Hari' : student.attendanceStatus === 'ABSENT' ? 'Absen' : 'Selesai/Belum Absen',
        'Check-In': student.checkIn || '-',
        'Check-Out': student.checkOut || '-',
        'Progress (%)': student.completionPercent || 0
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      
      const wscols = [
        { wch: 5 }, // No
        { wch: 30 }, // Nama
        { wch: 15 }, // NISN
        { wch: 15 }, // Kelas
        { wch: 25 }, // Sekolah
        { wch: 20 }, // Kehadiran
        { wch: 15 }, // Check-In
        { wch: 15 }, // Check-Out
        { wch: 15 }, // Progress
      ];
      worksheet['!cols'] = wscols;

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Daftar Siswa");
      
      const dateStr = new Date().toISOString().split('T')[0];
      const safeClassName = activeClassName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Daftar_Siswa_${safeClassName}_${dateStr}.xlsx`;
      
      xlsx.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Terjadi kesalahan saat mengekspor ke Excel.');
    } finally {
      setIsExportingExcelList(false);
    }
  };

  const handleExportPDFList = () => {
    try {
      setIsExportingPDFList(true);
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text(`Data Siswa - ${activeClassName}`, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Diekspor pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 28);
      
      const tableData = studentsList.map((student: any, index: number) => [
        index + 1,
        student.name,
        student.nisn || '-',
        student.className || '-',
        student.school || '-',
        student.attendanceStatus === 'CHECKED_IN' ? 'Hadir' : student.attendanceStatus === 'HALF_DAY' ? 'Setengah Hari' : student.attendanceStatus === 'ABSENT' ? 'Absen' : 'Selesai/Belum',
        student.checkIn ? `${student.checkIn} - ${student.checkOut || '...'}` : '-',
        `${student.completionPercent || 0}%`
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama Siswa', 'NISN', 'Kelas', 'Asal Sekolah', 'Status Kehadiran', 'Jam Absen', 'Progress']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const safeClassName = activeClassName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Daftar_Siswa_${safeClassName}_${dateStr}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF.');
    } finally {
      setIsExportingPDFList(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportMonthly = async () => {
    if (!selectedClassId) return;
    try {
      setIsExporting(true);
      const res = await getMonthlyReportDataAction(selectedClassId);
      if (res.success && res.data) {
        const worksheet = xlsx.utils.json_to_sheet(res.data);
        
        // Auto-size columns
        const wscols = [
          { wch: 5 }, // No
          { wch: 25 }, // Nama
          { wch: 15 }, // NIS
          { wch: 30 }, // Tempat PKL
          { wch: 15 }, // Total Hadir
          { wch: 15 }, // Total Alpha
          { wch: 20 }, // Rata-rata Nilai Mentor
          { wch: 20 }, // Rata-rata Nilai Guru
        ];
        worksheet['!cols'] = wscols;

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Rekap Bulanan");
        
        const dateStr = new Date().toISOString().split('T')[0];
        const safeClassName = activeClassName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Rekap_Bulanan_${safeClassName}_${dateStr}.xlsx`;
        
        xlsx.writeFile(workbook, fileName);
      } else {
        alert(res.error || 'Gagal mengambil data laporan bulanan');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Terjadi kesalahan saat mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  // Empty state when no classes are assigned
  const handleExportExcel = () => {
    if (!studentsList || studentsList.length === 0) return;

    // Transform studentsList into Excel rows
    const excelData = studentsList.map((student, index) => {
      let status = 'Belum Absen';
      if (student.attendanceStatus === 'CHECKED_IN') status = 'Masuk';
      if (student.attendanceStatus === 'COMPLETED') status = 'Selesai';
      if (student.attendanceStatus === 'HALF_DAY') status = 'Hanya Masuk';
      if (student.attendanceStatus === 'ABSENT') status = 'Alpha';

      let waktuAbsen = '-';
      if (student.checkIn) {
        waktuAbsen = student.checkIn;
        if (student.checkOut) waktuAbsen += ` - ${student.checkOut}`;
      }

      return {
        'No': index + 1,
        'Nama Siswa': student.name,
        'NISN': student.nisn || '-',
        'Tempat PKL': student.company || '-',
        'Penyelesaian Jurnal (%)': student.completionPercent || 0,
        'Status Kehadiran Hari Ini': status,
        'Waktu Absen': waktuAbsen,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const wscols = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 15 }, // NIS
      { wch: 30 }, // Tempat PKL
      { wch: 22 }, // Jurnal
      { wch: 25 }, // Status
      { wch: 20 }, // Waktu
    ];
    worksheet['!cols'] = wscols;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan PKL");
    
    // Generate filename based on class name and date
    const dateStr = new Date().toISOString().split('T')[0];
    const safeClassName = activeClassName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Laporan_PKL_${safeClassName}_${dateStr}.xlsx`;
    
    xlsx.writeFile(workbook, fileName);
  };

  if (!hasAssignment) {
    return (
      <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <UserCheck size={36} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">{t('noAssignmentTitle')}</h2>
          <p className="text-sm text-[#64748B] dark:text-gray-300 max-w-md leading-relaxed mb-4">
            Anda belum ditugaskan untuk membimbing kelas mana pun.
            Silakan hubungi <span className="font-semibold text-primary">{t('adminContact')}</span> {t('toGetAssignmentGuru')}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-gray-300 bg-[#F8FAFC] dark:bg-gray-900 border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 py-2.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span>{t('assignmentNoteGuru')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200">
      {/* Header and Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-gray-300 flex items-center gap-2">
            <UserCheck size={16} className="text-primary" />
            {t('dashboardMonitoringClass')} <span className="text-primary">{activeClassName}</span>
          </h2>
          <p className="text-[11px] text-[#64748B] dark:text-gray-300">{t('guruMonitorDesc')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">

          
          {currentUser?.classes && currentUser.classes.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">{t('selectClass')}</span>
              <select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value === '' ? null : e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="dark:bg-[#243447]">Semua Kelas</option>
                {currentUser.classes.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id} className="dark:bg-[#243447]">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Settings Group */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-gray-700">
            {/* Background Picker */}
            <BackgroundPicker />

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition cursor-pointer"
              title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700 transition text-xs font-bold cursor-pointer"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe size={14} className="text-primary" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation Segmented Control */}
      <div className="bg-white/90 dark:bg-[#243447]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 shadow-sm flex items-center gap-1.5 w-full sm:w-fit overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setViewMode('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'overview' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <BarChart3 size={16} />
          Ringkasan
        </button>
        <button 
          onClick={() => setViewMode('attendance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'attendance' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <Calendar size={16} />
          Absensi & Kehadiran
        </button>
        <button 
          onClick={() => setViewMode('progress')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'progress' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <KanbanSquare size={16} />
          Progres Siswa
        </button>

        <button 
          onClick={() => setViewMode('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'analytics' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <LineChart size={16} />
          Analitik
        </button>
        <button 
          onClick={() => setViewMode('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'students' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <Users size={16} />
          Daftar Siswa Lengkap
        </button>
      </div>

      {viewMode === 'attendance' && (
        <DailyDashboard 
          role="INTERNAL_MENTOR" 
          onPantau={onPantau} 
          selectedClassId={selectedClassId || undefined} 
        />
      )}

      {viewMode === 'overview' && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Card 1: Total Siswa */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('totalStudents')}</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.totalStudents ?? 0} {t('personCount')}</span>
          </div>
        </div>

        {/* Card 2: Monitoring Hari Ini */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('activeToday')}</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.monitoringToday ?? 0} {t('activitiesCount')}</span>
          </div>
        </div>

        {/* Card 3: Belum Direview */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('needReview')}</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.pendingReview ?? 0} {t('logsCount')}</span>
          </div>
        </div>

        {/* Card 4: Penilaian Belum Diisi */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 dark:text-red-500 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('notGraded')}</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.pendingGrades ?? 0} {t('activitiesCount')}</span>
          </div>
        </div>

        {/* Card 5: Rata-rata Nilai */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-[#22C55E] rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('avgGradeInt')}</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.averageGrade ?? 0}/100</span>
          </div>
        </div>
      </div>

      {/* Announcement Editor */}
      {selectedClassId && (
        <AnnouncementEditor 
          type="class" 
          targetId={selectedClassId} 
          targetName={activeClassName}
        />
      )}

      {/* Activity distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Left Column: Activity breakdown */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-primary" />
              {t('activityJournalGuru')}
            </h3>
            
            {loadingMetrics ? (
              <div className="flex flex-col gap-4 py-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="flex flex-col gap-1.5 animate-pulse">
                    <div className="h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full w-24" />
                    <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : metrics ? (
              <div className="flex flex-col gap-4">
                {Object.entries(metrics.columnCounts).map(([col, val]) => {
                  const total = Object.values(metrics.columnCounts).reduce((a, b) => a + b, 0);
                  const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                  const label = col === 'rencana' ? t('statusPlan') : col === 'progres' ? t('statusProgress') : col === 'review' ? t('statusReview') : t('statusDone');
                  const color = col === 'rencana' ? 'bg-blue-400' : col === 'progres' ? 'bg-yellow-400' : col === 'review' ? 'bg-purple-400' : 'bg-green-500';
                  
                  return (
                    <div key={col} className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>{label}</span>
                        <span>{val} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full transition-all duration-500`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-2000 italic text-center py-8">{t('chartLoadFailed')}</p>
            )}
          </div>
        </div>

        {/* Right Column: Pending Reviews / Quick Approval */}
        <PendingReviewsList 
          role="INTERNAL_MENTOR"
          selectedClassId={selectedClassId || undefined} 
          onRefreshMetrics={() => {
            getDashboardMetricsAction(selectedClassId || undefined, undefined).then(m => setMetrics(m as DashboardMetrics));
          }}
        />
      </div>
      </>
      )}

      {viewMode === 'progress' && (
        <div className="bg-white/80 dark:bg-[#243447]/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-gray-700/50 overflow-hidden relative z-10 p-5 md:p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <KanbanSquare size={18} className="text-primary" /> 
              PROGRES KANBAN SISWA
            </h2>
          </div>

          {studentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B] dark:text-gray-300 px-4">
              <Users size={36} className="mb-3 text-slate-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 mb-1">Belum Ada Siswa Ditugaskan</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pb-4">
              <table className="w-full min-w-[700px] text-sm text-left">
                <thead className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase bg-[#F8FAFC] dark:bg-gray-800/50 border-y border-[#E2E8F0] dark:border-gray-700 font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2">Nama Siswa</th>
                    <th className="py-2.5 px-2 text-center">Rencana</th>
                    <th className="py-2.5 px-2 text-center">Progres</th>
                    <th className="py-2.5 px-2 text-center">Review</th>
                    <th className="py-2.5 px-2 text-center">Selesai</th>
                    <th className="py-2.5 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-gray-200">
                  {studentsList.map((student) => (
                    <tr key={'prog_'+student.id} className="border-b border-[#F1F5F9] dark:border-gray-700/50 hover:bg-[#F8FAFC] dark:hover:bg-gray-800/50 transition duration-150">
                      <td className="py-3 px-2 font-semibold">
                        <div>{student.name}</div>
                        {student.nisn && <div className="text-[10px] text-slate-400 font-normal">NISN: {student.nisn}</div>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded font-bold">{student.boardCounts?.rencana || 0}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-bold">{student.boardCounts?.progres || 0}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded font-bold">{student.boardCounts?.review || 0}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-bold">{student.boardCounts?.selesai || 0}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onPantau(student.id, 'board')}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <KanbanSquare size={14} /> Detail Board
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === 'analytics' && (
        <AnalyticsDashboard 
          selectedClassId={selectedClassId || undefined} 
        />
      )}

      {viewMode === 'students' && (
        <div className="lg:col-span-2 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} className="text-primary" />
              {t('studentListClass')} {activeClassName}
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcelList}
                disabled={isExportingExcelList || studentsList.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExportingExcelList ? (
                  <span className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <FileSpreadsheet size={14} />
                )}
                Excel
              </button>
              <button
                onClick={handleExportPDFList}
                disabled={isExportingPDFList || studentsList.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExportingPDFList ? (
                  <span className="w-3.5 h-3.5 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <FileText size={14} />
                )}
                PDF
              </button>
            </div>
          </div>

          {studentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B] dark:text-gray-300">
              <Users size={32} className="mb-2 text-gray-300 animate-bounce" />
              <p className="text-xs">{t('noStudentGuru')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-2">{t('studentNameCol')}</th>
                    <th className="py-2.5 px-2">{t('companyCol')}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentCompletion')}</th>
                    <th className="py-2.5 px-2 text-center">{t('todayAttendance') || 'Kehadiran Hari Ini'}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-gray-200">
                  {studentsList.map((student) => (
                    <tr key={student.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150">
                      <td className="py-3 px-2 font-semibold">
                        <div>{student.name}</div>
                        {student.nisn && <div className="text-[10px] text-slate-400 font-normal">NISN: {student.nisn}</div>}
                      </td>
                      <td className="py-3 px-2">{student.company}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-[#F1F5F9] dark:bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${student.completionPercent}%` }} className="h-full bg-[#22C55E] rounded-full" />
                          </div>
                          <span className="font-bold text-[#22C55E]">{student.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {student.attendanceStatus === 'CHECKED_IN' ? (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md text-[10px] font-bold">{t('statusIn') || 'Masuk'}</span>
                          ) : student.attendanceStatus === 'COMPLETED' ? (
                            <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md text-[10px] font-bold">{t('statusCompleted') || 'Selesai'}</span>
                          ) : student.attendanceStatus === 'ABSENT' ? (
                            <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md text-[10px] font-bold">{t('statusAbsent') || 'Alpha'}</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded-md text-[10px] font-bold">{t('statusNotCheckedIn') || 'Belum Absen'}</span>
                          )}
                          {student.checkIn && (
                            <span className="text-[9px] text-slate-500 dark:text-gray-400">{student.checkIn} {student.checkOut ? `- ${student.checkOut}` : ''}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onPantau(student.id, 'board', true)}
                          className="min-h-[44px] px-3.5 py-2 text-xs md:min-h-0 md:px-2.5 md:py-1 md:text-[10px] bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition shadow-sm cursor-pointer w-full md:w-auto flex items-center justify-center"
                        >
                          {t('monitorAction') || 'Pantau'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

