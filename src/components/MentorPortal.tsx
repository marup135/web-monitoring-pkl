'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { useLanguage } from '../context/LanguageContext';
import { getDashboardMetricsAction, setFinalGradeAction, setCompanyIpPrefixAction } from '@/app/actions/pkl';
import { Users, Calendar, FileSpreadsheet, Award, Building2, BarChart3, AlertCircle, Download, FileText, Sun, Moon, Globe, Sparkles, LineChart, KanbanSquare, Wifi } from 'lucide-react';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from 'next-themes';
import { AnnouncementEditor } from './AnnouncementEditor';
import { DailyDashboard } from './DailyDashboard';
import { PendingReviewsList } from './PendingReviewsList';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BackgroundPicker } from './BackgroundPicker';

interface MentorPortalProps {
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

export const MentorPortal: React.FC<MentorPortalProps> = ({ onPantau }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDarkMode = (resolvedTheme || theme) === 'dark';
  const {
    currentUser,
    studentsList,
    setStudentsList,
    selectedCompanyId,
    setSelectedCompanyId,
  } = usePKL();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);
  const [gradingInput, setGradingInput] = useState<Record<string, string>>({});
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'attendance' | 'progress' | 'grading' | 'analytics' | 'students'>('overview');

  const schools = Array.from(new Set(studentsList.map((s: any) => s.school).filter(Boolean))) as string[];
  const filteredStudents = selectedSchool ? studentsList.filter((s: any) => s.school === selectedSchool) : studentsList;

  const handleSaveGrade = async () => {
    if (!gradingStudentId) return;

    // Calculate average
    const values = Object.values(gradingInput).map(v => parseInt(v) || 0);
    const validValues = values.filter(v => v > 0);
    const avg = validValues.length > 0 ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length) : 0;

    if (avg < 0 || avg > 100) {
      alert('Nilai harus antara 0 dan 100');
      return;
    }

    setIsSubmittingGrade(true);
    try {
      const numericDetails = Object.fromEntries(Object.entries(gradingInput).map(([k, v]) => [k, parseInt(v) || 0]));
      const res = await setFinalGradeAction(gradingStudentId, avg, numericDetails);
      if (res.success) {
        if (typeof setStudentsList === 'function') {
          setStudentsList((prev: any[]) => prev.map((s: any) =>
            s.id === gradingStudentId ? { ...s, finalGrade: avg, gradeDetails: numericDetails } : s
          ));
        }
        setGradingStudentId(null);
        setGradingInput({});
        alert('Nilai berhasil disimpan.');
      } else {
        alert(res.error || 'Gagal menyimpan nilai');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan nilai');
    } finally {
      setIsSubmittingGrade(false);
    }
  };
  useEffect(() => {
    const loadMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const m = await getDashboardMetricsAction(undefined, selectedCompanyId || undefined, selectedSchool || undefined);
        setMetrics(m as DashboardMetrics);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMetrics(false);
      }
    };
    loadMetrics();
  }, [selectedCompanyId, selectedSchool]);

  const hasAssignment = currentUser?.companies && currentUser.companies.length > 0;
  const activeCompanyName = selectedCompanyId
    ? (currentUser?.companies?.find((c: { id: string; name: string }) => c.id === selectedCompanyId)?.name || 'Perusahaan Aktif')
    : 'Semua Instansi';

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);


  const getGradeValue = (student: any, key: string) => {
    if (!student || !student.gradeDetails) return '-';
    let details = student.gradeDetails;
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch (e) {
        return '-';
      }
    }
    return details[key] ?? '-';
  };

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const dataToExport = filteredStudents.map((student: any, index: number) => ({
        'No': index + 1,
        'Nama Siswa': student.name,
        'NISN': student.nisn || '-',
        'Kelas': student.className || '-',
        'Asal Sekolah': student.school || '-',
        'Keahlian Teknis': getGradeValue(student, 'Keahlian Teknis'),
        'Kedisiplinan & Kehadiran': getGradeValue(student, 'Kedisiplinan & Kehadiran'),
        'Tanggung Jawab & Inisiatif': getGradeValue(student, 'Tanggung Jawab & Inisiatif'),
        'Kerja Sama & Komunikasi': getGradeValue(student, 'Kerja Sama & Komunikasi'),
        'Rata-rata Akhir': student.finalGrade || '-'
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataToExport);

      const wscols = [
        { wch: 5 }, // No
        { wch: 30 }, // Nama
        { wch: 15 }, // NISN
        { wch: 15 }, // Kelas
        { wch: 25 }, // Sekolah
        { wch: 20 }, // Keahlian
        { wch: 20 }, // Kedisiplinan
        { wch: 20 }, // Tanggung Jawab
        { wch: 20 }, // Kerja Sama
        { wch: 15 }, // Rata-rata
      ];
      worksheet['!cols'] = wscols;

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Penilaian Siswa");

      const dateStr = new Date().toISOString().split('T')[0];
      const safeCompanyName = activeCompanyName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Penilaian_Siswa_${safeCompanyName}_${dateStr}.xlsx`;

      xlsx.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Terjadi kesalahan saat mengekspor ke Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      const doc = new jsPDF('landscape');

      // Title
      doc.setFontSize(16);
      doc.text(`Penilaian Siswa Magang - ${activeCompanyName}`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Diekspor pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 28);

      const tableData = filteredStudents.map((student: any, index: number) => [
        index + 1,
        student.name,
        student.className || '-',
        student.school || '-',
        getGradeValue(student, 'Keahlian Teknis'),
        getGradeValue(student, 'Kedisiplinan & Kehadiran'),
        getGradeValue(student, 'Tanggung Jawab & Inisiatif'),
        getGradeValue(student, 'Kerja Sama & Komunikasi'),
        student.finalGrade || '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama Siswa', 'Kelas', 'Asal Sekolah', 'Keahlian Teknis', 'Kedisiplinan', 'Tanggung Jawab', 'Kerja Sama', 'Nilai Akhir']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const safeCompanyName = activeCompanyName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Penilaian_Siswa_${safeCompanyName}_${dateStr}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Empty state when no companies are assigned
  if (!hasAssignment) {
    return (
      <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Building2 size={36} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">{t('noAssignmentTitle')}</h2>
          <p className="text-sm text-[#64748B] dark:text-gray-300 max-w-md leading-relaxed mb-4">
            Anda belum ditugaskan untuk membimbing perusahaan mana pun.
            Silakan hubungi <span className="font-semibold text-primary">{t('adminContact')}</span> {t('toGetAssignmentMentor')}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-gray-300 bg-[#F8FAFC] dark:bg-gray-900 border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 py-2.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span>{t('assignmentNoteMentor')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200">
      {/* Header and Dropdown + Quick Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-gray-300 flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            {t('dashboardMentorCompany')} <span className="text-primary font-black">{activeCompanyName}</span>
          </h2>
          <p className="text-[11px] text-[#64748B] dark:text-gray-300">{t('mentorMonitorDesc')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {schools.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">Sekolah:</span>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="dark:bg-[#243447]">{t('schoolAll') || 'Semua Sekolah'}</option>
                {schools.map((school) => (
                  <option key={school} value={school} className="dark:bg-[#243447]">{school}</option>
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
      <div className="bg-white dark:bg-[#243447] p-1.5 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center gap-1.5 w-full sm:w-fit overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setViewMode('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'overview' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <BarChart3 size={16} />
          {t('summary') || 'Ringkasan'}
        </button>
        <button
          onClick={() => setViewMode('attendance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'attendance' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <Calendar size={16} />
          {t('todayActivity') || 'Absensi Siswa'}
        </button>
        <button
          onClick={() => setViewMode('progress')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'progress' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <KanbanSquare size={16} />
          {t('studentProgress') || 'Progres Siswa'}
        </button>
        <button
          onClick={() => setViewMode('grading')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'grading' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <Award size={16} />
          {t('finalGrading') || 'Penilaian Akhir'}
        </button>

        <button
          onClick={() => setViewMode('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'analytics' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <LineChart size={16} />
          {t('analytics') || 'Analitik'}
        </button>
        <button
          onClick={() => setViewMode('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${viewMode === 'students' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
        >
          <Users size={16} />
          {t('allStudents') || 'Semua Siswa'}
        </button>
      </div>

      {viewMode === 'attendance' && (
        <DailyDashboard
          role="EXTERNAL_MENTOR"
          onPantau={onPantau}
          selectedCompanyId={selectedCompanyId || undefined}
          selectedSchool={selectedSchool || undefined}
        />
      )}

      {viewMode === 'overview' && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Jumlah Siswa PKL */}
            <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('studentsCount')}</span>
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

            {/* Card 3: Menunggu Review */}
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

            {/* Card 5: Rata-rata Nilai Pembimbing Eksternal */}
            <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-green-50 text-[#22C55E] rounded-xl">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block uppercase">{t('avgGradeExt')}</span>
                <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.averageGrade ?? 0}/100</span>
              </div>
            </div>
          </div>

          {/* Announcement Editor */}
          {selectedCompanyId && (
            <AnnouncementEditor
              type="company"
              targetId={selectedCompanyId}
              targetName={activeCompanyName}
            />
          )}

          {/* Activity distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            {/* Left Column: Activity breakdown */}
            <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-primary" />
                  {t('activityJournalMentor')}
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
              role={currentUser.role}
              selectedCompanyId={selectedCompanyId || undefined}
              selectedSchool={selectedSchool || undefined}
              onViewAllTasks={() => setViewMode("progress")}
              onRefreshMetrics={() => {
                getDashboardMetricsAction(undefined, undefined).then(m => setMetrics(m as DashboardMetrics));
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
              {t('studentKanbanProgress') || 'PROGRES KANBAN SISWA'}
            </h2>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B] dark:text-gray-300 px-4">
              <Users size={36} className="mb-3 text-slate-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 mb-1">{t('noStudentsAssigned') || 'Belum Ada Siswa Ditugaskan'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pb-4">
              <table className="w-full min-w-[700px] text-sm text-left">
                <thead className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase bg-[#F8FAFC] dark:bg-gray-800/50 border-y border-[#E2E8F0] dark:border-gray-700 font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2">{t('studentNameCol') || 'Nama Siswa'}</th>
                    <th className="py-2.5 px-2 text-center">{t('statusPlan') || 'Rencana'}</th>
                    <th className="py-2.5 px-2 text-center">{t('statusProgress') || 'Progres'}</th>
                    <th className="py-2.5 px-2 text-center">{t('statusReview') || 'Review'}</th>
                    <th className="py-2.5 px-2 text-center">{t('statusDone') || 'Selesai'}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentActions') || 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={'prog_' + student.id} className="border-b border-[#F1F5F9] dark:border-gray-700/50 hover:bg-[#F8FAFC] dark:hover:bg-gray-800/50 transition duration-150">
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
                          <KanbanSquare size={14} /> {t('detailBoard') || 'Detail Board'}
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

      {viewMode === 'grading' && (
        <div className="bg-white/80 dark:bg-[#243447]/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-gray-700/50 overflow-hidden relative z-10 p-5 md:p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award size={18} className="text-primary" />
              {t('finalGradingTitle') || 'PENILAIAN AKHIR SISWA'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel || filteredStudents.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isExportingExcel ? t('exporting') || 'Mengekspor...' : 'Excel'}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF || filteredStudents.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isExportingPDF ? 'Mengekspor...' : 'PDF'}
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B] dark:text-gray-300 px-4">
              <Award size={36} className="mb-3 text-slate-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 mb-1">{t('noStudentsAssigned') || 'Belum Ada Siswa Ditugaskan'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pb-4">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase bg-[#F8FAFC] dark:bg-gray-800/50 border-y border-[#E2E8F0] dark:border-gray-700 font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2">{t('studentNameCol') || 'Nama Siswa'}</th>
                    <th className="py-2.5 px-2">{t('studentClass') || 'Kelas'}</th>
                    <th className="py-2.5 px-2 text-center">{t('completion') || 'Penyelesaian'}</th>
                    <th className="py-2.5 px-2 text-center">{t('finalScore') || 'Nilai Akhir'}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentActions') || 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={'grad_' + student.id} className="border-b border-[#F1F5F9] dark:border-gray-700/50 hover:bg-[#F8FAFC] transition duration-150">
                      <td className="py-3 px-2 font-semibold">
                        <div>{student.name}</div>
                        {student.nisn && <div className="text-[10px] text-slate-400 font-normal">NISN: {student.nisn}</div>}
                      </td>
                      <td className="py-3 px-2">{student.className || '-'}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-[#F1F5F9] dark:bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${student.completionPercent}%` }} className="h-full bg-[#22C55E] rounded-full" />
                          </div>
                          <span className="font-bold text-[#22C55E]">{student.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {student.finalGrade !== undefined && student.finalGrade !== null ? (
                          <div className="font-bold text-lg text-[#22C55E] dark:text-green-400">
                            {student.finalGrade} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingStudentId(student.id);
                              setGradingInput({});
                            }}
                            className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm mx-auto"
                          >
                            {t('giveScore') || 'Beri Nilai'}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => {
                            setGradingStudentId(student.id);
                            setGradingInput(student.gradeDetails ? Object.fromEntries(Object.entries(student.gradeDetails).map(([k, v]) => [k, String(v)])) : (student.finalGrade ? { 'Rata-rata Lama': student.finalGrade.toString() } : {}));
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors shadow-sm flex items-center gap-1 mx-auto"
                        >
                          {t('editScore') || 'Edit Nilai'}
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
          selectedCompanyId={selectedCompanyId || undefined}
          selectedSchool={selectedSchool || undefined}
        />
      )}

      {gradingStudentId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Beri Nilai Akhir</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Masukkan nilai (0-100) untuk setiap kriteria berikut.</p>

            <div className="space-y-4 mb-6">
              {['Keahlian Teknis', 'Kedisiplinan & Kehadiran', 'Tanggung Jawab & Inisiatif', 'Kerja Sama & Komunikasi'].map((kriteria) => (
                <div key={kriteria} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{kriteria}</label>
                  <input
                    type="number"
                    min="0" max="100"
                    placeholder="0 - 100"
                    value={gradingInput[kriteria] || ''}
                    onChange={(e) => setGradingInput({ ...gradingInput, [kriteria]: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6 flex justify-between items-center border border-blue-100 dark:border-blue-800/30">
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Rata-rata Nilai Akhir:</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {(() => {
                  const vals = Object.values(gradingInput).map(v => parseInt(v) || 0).filter(v => v > 0);
                  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                })()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGradingStudentId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveGrade}
                disabled={isSubmittingGrade}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/30 flex justify-center items-center"
              >
                {isSubmittingGrade ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewMode === 'students' && (
        <div className="bg-white/80 dark:bg-[#243447]/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-gray-700 p-6 flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {t('allStudentsTitle') || 'Semua Siswa'}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-gray-400 font-medium">{t('allStudentsDesc') || 'Daftar lengkap seluruh siswa bimbingan Anda.'}</p>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700">
              <Users size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('noStudentData')}</h4>
              <p className="text-xs">{t('noStudentGuru')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-2">{t('studentNameCol')}</th>
                    <th className="py-2.5 px-2">{t('schoolOrigin') || 'Sekolah'}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentCompletion')}</th>
                    <th className="py-2.5 px-2 text-center">{t('todayAttendance') || 'Kehadiran Hari Ini'}</th>
                    <th className="py-2.5 px-2 text-center">{t('studentActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-gray-200">
                  {filteredStudents.map((student: any) => (
                    <tr key={student.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150">
                      <td className="py-3 px-2 font-semibold">
                        <div>{student.name}</div>
                        {student.nisn && <div className="text-[10px] text-slate-400 font-normal">NISN: {student.nisn}</div>}
                      </td>
                      <td className="py-3 px-2">{student.school || '-'}</td>
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
