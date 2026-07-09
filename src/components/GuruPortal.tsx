'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { getDashboardMetricsAction } from '@/app/actions/pkl';
import { Users, Calendar, FileSpreadsheet, Award, UserCheck, BarChart3, AlertCircle } from 'lucide-react';

interface GuruPortalProps {
  onPantau: (studentId: string) => void;
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
  const {
    currentUser,
    studentsList,
    selectedClassId,
    setSelectedClassId,
  } = usePKL();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    const loadMetrics = async () => {
      if (selectedClassId) {
        setLoadingMetrics(true);
        try {
          const m = await getDashboardMetricsAction(selectedClassId, undefined);
          setMetrics(m as DashboardMetrics);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMetrics(false);
        }
      }
    };
    loadMetrics();
  }, [selectedClassId]);

  const hasAssignment = currentUser?.classes && currentUser.classes.length > 0;
  const activeClassName = currentUser?.classes?.find((c: { id: string; name: string }) => c.id === selectedClassId)?.name || 'Kelas Aktif';

  // Empty state when no classes are assigned
  if (!hasAssignment) {
    return (
      <div className="flex flex-col gap-6 text-[#0F172A] dark:text-white">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <UserCheck size={36} className="text-[#2563EB]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Belum Ada Assignment</h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md leading-relaxed mb-4">
            Anda belum ditugaskan untuk membimbing kelas mana pun.
            Silakan hubungi <span className="font-semibold text-[#2563EB]">Administrator</span> untuk mendapatkan assignment kelas bimbingan.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-4 py-2.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span>Setelah Admin menugaskan kelas, dashboard akan otomatis menampilkan data siswa.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-white">
      {/* Header and Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 flex items-center gap-2">
            <UserCheck size={16} className="text-[#2563EB]" />
            Dashboard Monitoring Kelas: <span className="text-[#2563EB]">{activeClassName}</span>
          </h2>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">Tinjau dan verifikasi logbook harian siswa di bawah bimbingan Anda.</p>
        </div>

        {currentUser?.classes && currentUser.classes.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Pilih Kelas:</span>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB]"
            >
              {currentUser.classes.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Siswa */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-[#2563EB] rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold block uppercase">Total Siswa</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.totalStudents ?? 0} orang</span>
          </div>
        </div>

        {/* Card 2: Monitoring Hari Ini */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold block uppercase">Aktif Hari Ini</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.monitoringToday ?? 0} keg.</span>
          </div>
        </div>

        {/* Card 3: Belum Direview */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold block uppercase">Belum Direview</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.pendingReview ?? 0} log</span>
          </div>
        </div>

        {/* Card 4: Penilaian Belum Diisi */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold block uppercase">Belum Dinilai</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.pendingGrades ?? 0} keg.</span>
          </div>
        </div>

        {/* Card 5: Rata-rata Nilai */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-[#22C55E] rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold block uppercase">Rerata Nilai (Internal)</span>
            <span className="text-lg font-black text-[#0F172A] dark:text-white">{metrics?.averageGrade ?? 0}/100</span>
          </div>
        </div>
      </div>

      {/* Activity distribution and student list columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity breakdown */}
        <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-[#2563EB]" />
              Aktivitas Jurnal Kelas
            </h3>
            
            {loadingMetrics ? (
              <div className="flex flex-col gap-4 py-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="flex flex-col gap-1.5 animate-pulse">
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full w-24" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : metrics ? (
              <div className="flex flex-col gap-4">
                {Object.entries(metrics.columnCounts).map(([col, val]) => {
                  const total = Object.values(metrics.columnCounts).reduce((a, b) => a + b, 0);
                  const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                  const label = col === 'rencana' ? 'Rencana' : col === 'progres' ? 'Progres' : col === 'review' ? 'Review' : 'Selesai';
                  const color = col === 'rencana' ? 'bg-blue-400' : col === 'progres' ? 'bg-yellow-400' : col === 'review' ? 'bg-purple-400' : 'bg-green-500';
                  
                  return (
                    <div key={col} className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>{label}</span>
                        <span>{val} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full transition-all duration-500`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-8">Gagal memuat data grafik.</p>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Student Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <h3 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Users size={15} className="text-[#2563EB]" />
            Daftar Siswa Kelas {activeClassName}
          </h3>

          {studentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B] dark:text-slate-400">
              <Users size={32} className="mb-2 text-gray-300 animate-bounce" />
              <p className="text-xs">Belum ada siswa terdaftar pada kelas ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-700 text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-2">Nama Siswa</th>
                    <th className="py-2.5 px-2">Perusahaan PKL</th>
                    <th className="py-2.5 px-2 text-center">Penyelesaian</th>
                    <th className="py-2.5 px-2 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] dark:text-white">
                  {studentsList.map((student) => (
                    <tr key={student.id} className="hover:bg-[#F8FAFC] dark:bg-slate-900 transition duration-150">
                      <td className="py-3 px-2 font-semibold">
                        <div>{student.name}</div>
                        {student.nisn && <div className="text-[10px] text-slate-400 font-normal">NIS/NISN: {student.nisn}</div>}
                      </td>
                      <td className="py-3 px-2">{student.company}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-[#F1F5F9] dark:bg-slate-700 rounded-full overflow-hidden">
                            <div style={{ width: `${student.completionPercent}%` }} className="h-full bg-[#22C55E] rounded-full" />
                          </div>
                          <span className="font-bold text-[#22C55E]">{student.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onPantau(student.id)}
                          className="min-h-[44px] px-3.5 py-2 text-xs md:min-h-0 md:px-2.5 md:py-1 md:text-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition shadow-sm cursor-pointer w-full md:w-auto flex items-center justify-center"
                        >
                          Pantau
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
