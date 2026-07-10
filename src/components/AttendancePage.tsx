'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { 
  getServerTimeAction, 
  getAttendanceTodayAction, 
  getAttendanceHistoryAction, 
  checkInAction, 
  checkOutAction 
} from '@/app/actions/attendance';
import { Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  createdAt: Date;
}

export function AttendancePage() {
  const { currentUser } = usePKL();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [serverTimeInfo, setServerTimeInfo] = useState<{
    dateString: string;
    timeString: string;
    formattedDate: string;
    hours: number;
    minutes: number;
  } | null>(null);
  const [clientTimeOffset, setClientTimeOffset] = useState<number>(0); // ms offset
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAttendanceData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      // Get server time
      const timeData = await getServerTimeAction();
      setServerTimeInfo(timeData);

      // Calculate time offset: serverTime - clientTime
      const serverMs = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getTime();
      const clientMs = Date.now();
      setClientTimeOffset(serverMs - clientMs);

      // Get today's attendance
      const todayRes = await getAttendanceTodayAction(currentUser.id);
      if (todayRes.success) {
        setTodayAttendance(todayRes.data as any);
      }

      // Get history
      const historyRes = await getAttendanceHistoryAction(currentUser.id);
      if (historyRes.success) {
        setHistory(historyRes.data as any);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Gagal memuat data absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [currentUser]);

  // Clock Ticker based on Server Time offset
  const [currentTimeString, setCurrentTimeString] = useState<string>('--:--:--');
  useEffect(() => {
    const timer = setInterval(() => {
      const currentClientMs = Date.now();
      const currentServerDate = new Date(currentClientMs + clientTimeOffset);
      
      const hours = String(currentServerDate.getHours()).padStart(2, '0');
      const minutes = String(currentServerDate.getMinutes()).padStart(2, '0');
      const seconds = String(currentServerDate.getSeconds()).padStart(2, '0');
      
      setCurrentTimeString(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [clientTimeOffset]);

  // Determine current Jakarta server hour/minute for validation in UI
  const getJakartaTimeNow = () => {
    const currentServerDate = new Date(Date.now() + clientTimeOffset);
    return {
      hours: currentServerDate.getHours(),
      minutes: currentServerDate.getMinutes(),
      timeInMinutes: currentServerDate.getHours() * 60 + currentServerDate.getMinutes()
    };
  };

  const { hours, minutes, timeInMinutes } = getJakartaTimeNow();

  // Rules:
  // Check-in: 07:00 - 09:00 WIB
  const checkInStart = 7 * 60; // 07:00
  const checkInEnd = 9 * 60; // 09:00

  // Check-out: 16:00 - 18:00 WIB
  const checkOutStart = 16 * 60; // 16:00
  const checkOutEnd = 18 * 60; // 18:00

  const canCheckIn = timeInMinutes >= checkInStart && timeInMinutes <= checkInEnd;
  const canCheckOut = timeInMinutes >= checkOutStart && timeInMinutes <= checkOutEnd;

  const handleCheckIn = async () => {
    if (!currentUser || actionLoading) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await checkInAction(currentUser.id);
      if (res.success) {
        setSuccessMsg('Absen masuk berhasil dilakukan!');
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal absen masuk.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat absen masuk.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser || actionLoading) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await checkOutAction(currentUser.id);
      if (res.success) {
        setSuccessMsg('Absen pulang berhasil dilakukan! Sampai jumpa besok.');
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal absen pulang.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat absen pulang.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return { label: 'Sudah Check-in', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'COMPLETED':
        return { label: 'Selesai / Sudah Check-out', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'ABSENT':
        return { label: 'Alfa / Tidak Hadir', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      default:
        return { label: 'Belum Absen', color: 'bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-400' };
    }
  };

  if (currentUser?.role !== 'siswa') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl shadow-sm text-center min-h-[300px]">
        <AlertCircle className="w-12 h-12 text-[#64748B] mb-4" />
        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Fitur Khusus Siswa</h3>
        <p className="text-xs text-[#64748B] dark:text-gray-300 max-w-sm mt-2">
          Fitur absensi masuk & pulang harian hanya dapat diakses oleh akun dengan peran Siswa/Mahasiswa PKL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {(errorMsg || successMsg) && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-3 fade-in duration-300">
          <div className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl shadow-xl border ${
            errorMsg 
              ? 'bg-white dark:bg-[#243447] border-red-200 text-[#0F172A] dark:text-gray-200 shadow-red-100/60' 
              : 'bg-white dark:bg-[#243447] border-green-200 text-[#0F172A] dark:text-gray-200 shadow-green-100/60'
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${errorMsg ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
              {errorMsg ? (
                <AlertCircle className="w-4 h-4 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#0F172A] dark:text-white">
                {errorMsg ? 'Terjadi Kesalahan' : 'Berhasil'}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-gray-300">
                {errorMsg || successMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Attendance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Server Time & Current Status */}
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jam Kerja Server</span>
              <button 
                onClick={fetchAttendanceData}
                disabled={loading}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[#0F172A] dark:text-white">
                  {currentTimeString}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-gray-300 mt-1 font-medium">
                  <Calendar size={13} />
                  <span>{serverTimeInfo?.formattedDate || 'Memuat...'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] dark:border-gray-700/60 pt-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Status Hari Ini</span>
            {loading ? (
              <div className="h-10 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-3">
                <div className={`px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-sm ${getStatusLabel(todayAttendance?.status || 'NOT_CHECKED_IN').color}`}>
                  {getStatusLabel(todayAttendance?.status || 'NOT_CHECKED_IN').label}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buttons Action Check-in & Check-out */}
        <div className="lg:col-span-2 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Absensi Harian PKL</h3>
            <p className="text-xs text-[#64748B] dark:text-gray-300 mt-1">
              Lakukan absensi masuk di pagi hari dan absensi pulang setelah selesai beraktivitas di tempat PKL.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 my-6">
              <div className="h-14 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              <div className="h-14 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              
              {/* Check-In Button Box */}
              <div className="border border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white block">Absen Masuk (Check-in)</span>
                  <span className="text-[10px] text-[#64748B] dark:text-gray-300 block mt-0.5">Sesi Pagi: 07.00 - 09.00 WIB</span>
                  
                  {/* Status Indicator inside box */}
                  {todayAttendance?.checkIn && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
                      <UserCheck size={14} /> Terabsen {todayAttendance.checkIn} WIB
                    </span>
                  )}
                </div>

                {!todayAttendance?.checkIn ? (
                  <div>
                    <button
                      onClick={handleCheckIn}
                      disabled={!canCheckIn || actionLoading}
                      className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer min-h-[42px] flex items-center justify-center ${
                        canCheckIn 
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md' 
                          : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {actionLoading ? 'Memproses...' : 'Absen Masuk'}
                    </button>
                    {!canCheckIn && (
                      <p className="text-[10px] text-red-500 font-medium mt-1.5 text-center">
                        {timeInMinutes < checkInStart 
                          ? 'Absensi masuk dibuka pukul 07.00 WIB.' 
                          : 'Waktu absensi masuk telah berakhir.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 px-4 bg-green-50 text-green-500 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-bold text-xs rounded-xl cursor-not-allowed min-h-[42px]">
                    Sudah Absen Masuk
                  </button>
                )}
              </div>

              {/* Check-Out Button Box */}
              <div className="border border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white block">Absen Pulang (Check-out)</span>
                  <span className="text-[10px] text-[#64748B] dark:text-gray-300 block mt-0.5">Sesi Sore: 16.00 - 18.00 WIB</span>
                  
                  {todayAttendance?.checkOut && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
                      <UserCheck size={14} /> Terabsen {todayAttendance.checkOut} WIB
                    </span>
                  )}
                </div>

                {!todayAttendance?.checkOut ? (
                  <div>
                    <button
                      onClick={handleCheckOut}
                      disabled={!todayAttendance?.checkIn || !canCheckOut || actionLoading}
                      className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer min-h-[42px] flex items-center justify-center ${
                        todayAttendance?.checkIn && canCheckOut
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md' 
                          : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {actionLoading ? 'Memproses...' : 'Absen Pulang'}
                    </button>
                    {!todayAttendance?.checkIn ? (
                      <p className="text-[10px] text-amber-500 font-medium mt-1.5 text-center">
                        Lakukan absen masuk terlebih dahulu.
                      </p>
                    ) : !canCheckOut ? (
                      <p className="text-[10px] text-red-500 font-medium mt-1.5 text-center">
                        {timeInMinutes < checkOutStart 
                          ? 'Absensi pulang dibuka pukul 16.00 WIB.' 
                          : 'Waktu absensi pulang telah berakhir.'}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 px-4 bg-green-50 text-green-500 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-bold text-xs rounded-xl cursor-not-allowed min-h-[42px]">
                    Absensi Hari Ini Selesai
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="border-t border-[#E2E8F0] dark:border-gray-700/60 pt-3">
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              * Jam absensi disinkronkan langsung dengan server UTC+7 (WIB). Pelanggaran waktu dapat menyebabkan status absensi terlambat atau alfa.
            </p>
          </div>
        </div>

      </div>

      {/* Attendance History Section */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-4">Riwayat Absensi</h3>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-gray-700 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-[#64748B] dark:text-gray-300 font-medium">Belum ada riwayat absensi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Jam Masuk</th>
                  <th className="p-3.5">Jam Pulang</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {history.map((item) => {
                  const labelInfo = getStatusLabel(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 text-[#0F172A] dark:text-gray-200">
                      <td className="p-3.5 font-medium">{item.date}</td>
                      <td className="p-3.5">{item.checkIn ? `${item.checkIn} WIB` : '-'}</td>
                      <td className="p-3.5">{item.checkOut ? `${item.checkOut} WIB` : '-'}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${labelInfo.color}`}>
                          {labelInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
