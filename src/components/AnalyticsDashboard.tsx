'use client';

import React, { useState, useEffect } from 'react';
import { getAnalyticsDataAction } from '@/app/actions/pkl';
import { RefreshCw, TrendingUp, BookOpen, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsDashboardProps {
  selectedClassId?: string | null;
  selectedCompanyId?: string | null;
  selectedSchool?: string | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  selectedClassId,
  selectedCompanyId,
  selectedSchool
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsDataAction(selectedClassId || undefined, selectedCompanyId || undefined, selectedSchool || undefined);
      setData(res as any);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClassId, selectedCompanyId, selectedSchool]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-gray-400 animate-pulse">{t('preparingAnalytics') || 'Menyiapkan Analitik...'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">{t('failedLoadAnalytics') || 'Gagal memuat data analitik atau data tidak tersedia.'}</p>
        <button onClick={fetchAnalytics} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 transition cursor-pointer">
          <RefreshCw size={16} /> {t('tryAgain') || 'Coba Lagi'}
        </button>
      </div>
    );
  }

  // Calculate totals for empty states
  const totalLogbooks = data.logbookStatus.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const totalGrades = data.gradeDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Attendance Trend Chart */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white">{t('attendanceTrendTitle') || 'Tren Kehadiran (7 Hari Terakhir)'}</h3>
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">{t('attendanceTrendDesc') || 'Grafik pergerakan absensi harian'}</p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.attendanceTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" name={t('statusCompleted') || "Hadir"} dataKey="hadir" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" name={t('statusLeave') || "Izin"} dataKey="izin" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              <Line type="monotone" name={t('statusSick') || "Sakit"} dataKey="sakit" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              <Line type="monotone" name={t('statusAbsent') || "Alpha"} dataKey="alpha" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logbook Status Chart */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F172A] dark:text-white">{t('dailyJournalStatus') || 'Status Jurnal Harian'}</h3>
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">{t('logbookCompletionProp') || 'Proporsi penyelesaian logbook'}</p>
            </div>
          </div>
          
          <div className="h-[250px] w-full flex items-center justify-center">
            {totalLogbooks === 0 ? (
              <p className="text-sm font-semibold text-slate-400 italic">{t('noLogbookData') || 'Belum ada data logbook.'}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.logbookStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => (percent || 0) > 0 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {data.logbookStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} ${t('activitiesCount') || 'Kegiatan'}`, name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grade Distribution Chart */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F172A] dark:text-white">{t('gradingDistribution') || 'Distribusi Penilaian'}</h3>
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">{t('gradingSpreadDesc') || 'Sebaran nilai dari pembimbing'}</p>
            </div>
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            {totalGrades === 0 ? (
              <p className="text-sm font-semibold text-slate-400 italic">{t('noGradesGiven') || 'Belum ada nilai yang diberikan.'}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gradeDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} ${t('taskCountPlural') || 'Tugas'}`, t('amountCount') || 'Jumlah']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
