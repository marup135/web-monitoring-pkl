'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePKL } from '../context/PKLContext';
import { PARTICIPANT_ROLES } from '../lib/constants';
import { useLanguage } from '../context/LanguageContext';
import { 
  getServerTimeAction, 
  getAttendanceTodayAction, 
  getAttendanceHistoryAction, 
  checkInAction,
  checkOutAction,
  requestLeaveAction,
  approveLeaveAction
} from '@/app/actions/attendance';
import { getFaceDescriptorAction } from '@/app/actions/profile';
import { Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Camera, MapPin, X, Upload, Eye, WifiOff } from 'lucide-react';
import { useFaceApi } from '../hooks/useFaceApi';
import { useCameraLocation } from '../hooks/useCameraLocation';
import { useBlinkDetection } from '../hooks/useBlinkDetection';
import { FaceRegistrationModal } from './FaceRegistrationModal';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  createdAt: Date;
}

export function AttendancePage() {
  const { currentUser, selectedStudentId } = usePKL();
  const { t } = useLanguage();
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
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isFaceRegistrationModalOpen, setIsFaceRegistrationModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'SICK' | 'EXCUSED'>('SICK');
  const [leaveReason, setLeaveReason] = useState('');
  const [leavePhoto, setLeavePhoto] = useState<string | null>(null);
  
  // Modal for Viewing Proof
  const [proofModalData, setProofModalData] = useState<{
    date: string;
    checkInPhoto?: string | null;
    checkInLat?: number | null;
    checkInLng?: number | null;
    checkOutPhoto?: string | null;
    checkOutLat?: number | null;
    checkOutLng?: number | null;
    activityNotes?: string | null;
  } | null>(null);

  const {
    modelsLoaded,
    verifyingFace,
    savedFaceDescriptor,
    loadSavedDescriptor,
    verifyFace
  } = useFaceApi();

  const {
    isCameraModalOpen,
    cameraMode,
    location,
    locError,
    videoRef,
    canvasRef,
    fileInputRef,
    photoCaptured,
    setPhotoCaptured,
    activityNotes,
    setActivityNotes,
    capturePhoto,
    handleFileUpload,
    openModal,
    closeModal,
    startCamera
  } = useCameraLocation();

  const { hasBlinked, isDetecting, instruction, resetBlink } = useBlinkDetection(
    videoRef, 
    isCameraModalOpen && cameraMode === 'in' && !photoCaptured && modelsLoaded
  );

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const fetchAttendanceData = async () => {
    const targetUserId = selectedStudentId || currentUser?.id;
    if (!targetUserId) return;
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
      const todayRes = await getAttendanceTodayAction(targetUserId);
      if (todayRes.success) {
        setTodayAttendance(todayRes.data as any);
      }

      // Get history
      const historyRes = await getAttendanceHistoryAction(targetUserId);
      if (historyRes.success) {
        setHistory(historyRes.data as any);
      }

      // Get face descriptor
      const faceRes = await getFaceDescriptorAction(targetUserId);
      if (faceRes.success && faceRes.data) {
        loadSavedDescriptor(faceRes.data);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Gagal memuat data absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineAttendance = async () => {
    if (!currentUser) return;
    const key = `offline_attendance_${currentUser.id}`;
    const queued = localStorage.getItem(key);
    if (!queued) return;

    try {
      setSyncing(true);
      const items = JSON.parse(queued);
      if (!Array.isArray(items) || items.length === 0) return;

      let allSuccess = true;
      for (const item of items) {
        let res;
        if (item.type === 'in') {
          res = await checkInAction(currentUser.id, item.lat, item.lng, item.photo, item.offlineData);
        } else {
          res = await checkOutAction(currentUser.id, item.lat, item.lng, item.photo, item.notes, item.offlineData);
        }
        if (!res.success) {
          allSuccess = false;
          console.error("Failed to sync item", item, res.error);
        }
      }

      if (allSuccess) {
        localStorage.removeItem(key);
        setSuccessMsg("Semua data absensi offline berhasil disinkronisasi!");
        fetchAttendanceData();
      } else {
        setErrorMsg("Sebagian data absen offline gagal disinkronisasi. Akan dicoba lagi nanti.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineAttendance();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial sync check
    if (navigator.onLine) syncOfflineAttendance();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  useEffect(() => {
    fetchAttendanceData();
  }, [currentUser, selectedStudentId]);

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

  const handleConfirmAttendance = async () => {
    if (!currentUser || actionLoading || !photoCaptured || !location) return;
    
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      
      if (cameraMode === 'in') {
        // Only verify face if we are online, if offline we just trust the client side blink detection
        if (!isOffline) {
          const verifyResult = await verifyFace(photoCaptured);
          if (!verifyResult.success) {
            setErrorMsg(verifyResult.error || 'Verifikasi wajah gagal.');
            setActionLoading(false);
            return;
          }
        }
      }

      let res;
      if (isOffline) {
        const key = `offline_attendance_${currentUser.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        
        const currentServerDate = new Date(Date.now() + clientTimeOffset);
        const y = currentServerDate.getFullYear();
        const m = String(currentServerDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentServerDate.getDate()).padStart(2, '0');
        const h = String(currentServerDate.getHours()).padStart(2, '0');
        const min = String(currentServerDate.getMinutes()).padStart(2, '0');
        
        const offlineData = {
          timestamp: currentServerDate.getTime(),
          dateString: `${y}-${m}-${d}`,
          timeString: `${h}:${min}`
        };

        const newItem = {
          type: cameraMode,
          lat: location.lat,
          lng: location.lng,
          photo: photoCaptured,
          notes: activityNotes,
          offlineData
        };
        
        existing.push(newItem);
        localStorage.setItem(key, JSON.stringify(existing));
        
        setSuccessMsg(cameraMode === 'in' ? 'Anda sedang offline. Absen masuk disimpan sementara!' : 'Anda sedang offline. Absen pulang disimpan sementara!');
        closeModal();
        setActionLoading(false);
        return;
      }

      if (cameraMode === 'in') {
        res = await checkInAction(currentUser.id, location.lat, location.lng, photoCaptured);
      } else {
        if (!activityNotes.trim()) {
           setErrorMsg('Catatan kegiatan wajib diisi untuk absen keluar.');
           setActionLoading(false);
           return;
        }
        res = await checkOutAction(currentUser.id, location.lat, location.lng, photoCaptured, activityNotes);
      }

      if (res.success) {
        setSuccessMsg(cameraMode === 'in' ? 'Absen masuk berhasil dilakukan!' : 'Absen pulang berhasil dilakukan! Sampai jumpa besok.');
        closeModal();
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || `Gagal absen ${cameraMode === 'in' ? 'masuk' : 'pulang'}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat absensi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    if (!currentUser || !leaveReason.trim()) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      
      const res = await requestLeaveAction(currentUser.id, leaveType, leaveReason, leavePhoto || undefined);
      if (res.success) {
        setSuccessMsg(`Berhasil mengajukan ${leaveType === 'SICK' ? 'Sakit' : 'Izin'}. Menunggu persetujuan pembimbing.`);
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        setLeavePhoto(null);
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan izin/sakit.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLeave = async (attendanceId: string, isApproved: boolean) => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = await approveLeaveAction(attendanceId, isApproved);
      if (res.success) {
        setSuccessMsg(isApproved ? 'Berhasil menyetujui pengajuan.' : 'Pengajuan telah ditolak.');
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal merubah status.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return { label: t('statusCheckedIn'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'COMPLETED':
        return { label: t('statusCompleted'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'HALF_DAY':
        return { label: t('statusHalfDay'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'ABSENT':
        return { label: t('statusAbsent'), color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      case 'SICK':
        return { label: 'SAKIT', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'EXCUSED':
        return { label: 'IZIN', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' };
      case 'PENDING_SICK':
        return { label: 'MENUNGGU (SAKIT)', color: 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800' };
      case 'PENDING_EXCUSED':
        return { label: 'MENUNGGU (IZIN)', color: 'bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-400 dark:border-cyan-800' };
      default:
        return { label: t('statusNotCheckedIn'), color: 'bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-400' };
    }
  };

  if (!PARTICIPANT_ROLES.includes(currentUser?.role || '') && !selectedStudentId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl shadow-sm text-center min-h-[300px]">
        <AlertCircle className="w-12 h-12 text-[#64748B] mb-4" />
        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{t("studentFeatureOnly")}</h3>
        <p className="text-xs text-[#64748B] dark:text-gray-300 max-w-sm mt-2">
          {t("studentFeatureDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-amber-100 text-amber-800 p-3 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm mb-4 border border-amber-200">
          <WifiOff size={18} />
          <span>Anda sedang Offline! Data absen Anda akan tersimpan lokal dan disinkronkan saat terhubung internet.</span>
        </div>
      )}
      {syncing && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm mb-4 border border-blue-200">
          <RefreshCw size={18} className="animate-spin" />
          <span>Sedang menyinkronisasi data absen offline...</span>
        </div>
      )}

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
                {errorMsg ? t('errorTitle') : t('successTitle')}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-gray-300">
                {errorMsg || successMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera & Location Modal Overlay */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-white">
                {cameraMode === 'in' ? 'Verifikasi Absen Masuk' : 'Verifikasi Absen Pulang'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {/* Location Status */}
              <div className={`p-3 rounded-xl flex items-start gap-3 text-sm ${location ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                <MapPin size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{location ? 'Lokasi Ditemukan' : 'Mencari Lokasi...'}</p>
                  <p className="text-xs opacity-80">
                    {location 
                      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` 
                      : locError || 'Pastikan GPS Anda aktif dan berikan izin lokasi.'}
                  </p>
                </div>
              </div>

              {/* Camera Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] flex items-center justify-center border border-gray-200 dark:border-gray-700">
                {!photoCaptured ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    {cameraMode === 'in' && !hasBlinked && (
                      <div className="absolute top-4 left-4 right-4 z-10">
                        <div className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors duration-300 ${isDetecting ? 'bg-amber-400 text-amber-900' : 'bg-gray-800 text-white'}`}>
                          <Eye size={18} className={isDetecting ? 'animate-pulse' : ''} />
                          {instruction}
                        </div>
                      </div>
                    )}
                    {cameraMode === 'in' && hasBlinked && (
                      <div className="absolute top-4 left-4 right-4 z-10">
                        <div className="p-3 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                          <CheckCircle2 size={18} />
                          {instruction}
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button 
                        onClick={capturePhoto}
                        disabled={cameraMode === 'in' && !hasBlinked}
                        className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition ${cameraMode === 'in' && !hasBlinked ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'bg-white text-gray-900 hover:scale-105 active:scale-95'}`}
                      >
                        <Camera size={24} />
                      </button>
                      
                      {cameraMode === 'out' && (
                        <>
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload}
                            className="hidden" 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95"
                            title="Pilih dari Galeri"
                          >
                            <Upload size={24} />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <img src={photoCaptured} alt="Captured" className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                      <button 
                         onClick={() => {
                          setPhotoCaptured(null);
                          resetBlink();
                          startCamera();
                         }}
                        className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-gray-700 transition"
                      >
                        Ulangi Foto
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {cameraMode === 'in' && !savedFaceDescriptor && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex flex-col gap-2 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} /> Data wajah belum terdaftar.
                  </div>
                  <button 
                    onClick={() => {
                      closeModal();
                      setIsFaceRegistrationModalOpen(true);
                    }} 
                    className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                  >
                    Daftar Wajah Sekarang
                  </button>
                </div>
              )}
              
              {cameraMode === 'out' && photoCaptured && (
                <div className="mt-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Catatan Kegiatan Hari Ini <span className="text-red-500">*</span></label>
                  <textarea
                    value={activityNotes}
                    onChange={(e) => setActivityNotes(e.target.value)}
                    placeholder="Contoh: Menyelesaikan desain UI login page dan integrasi API..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none h-24 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E293B]">
              <button
                onClick={handleConfirmAttendance}
                disabled={!location || !photoCaptured || actionLoading || verifyingFace || (cameraMode === 'in' && !savedFaceDescriptor)}
                className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${
                  location && photoCaptured && (!cameraMode || savedFaceDescriptor || cameraMode === 'out')
                    ? 'bg-primary hover:bg-primary-hover text-white shadow-md'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                }`}
              >
                {(actionLoading || verifyingFace) ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {verifyingFace ? 'Memverifikasi Wajah...' : actionLoading ? 'Memproses...' : 'Kirim Absensi'}
              </button>
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("serverWorkHours")}</span>
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">{t("todayStatus")}</span>
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
        {!selectedStudentId && (
          <div className="lg:col-span-2 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">{t("attendanceDaily")}</h3>
            <p className="text-xs text-[#64748B] dark:text-gray-300 mt-1">
              {t("attendanceDailyDesc")} (Wajib melampirkan foto selfie dan lokasi)
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
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white block">{t("checkInBox")}</span>
                  <span className="text-[10px] text-[#64748B] dark:text-gray-300 block mt-0.5">{t("morningSession")}</span>
                  
                  {/* Status Indicator inside box */}
                  {todayAttendance?.checkIn && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
                      <UserCheck size={14} /> {t("checkedInAt").replace("{time}", todayAttendance.checkIn as string)}
                    </span>
                  )}
                </div>

                {!todayAttendance?.checkIn ? (
                  <div>
                    <button
                      onClick={() => openModal('in')}
                      disabled={!canCheckIn || actionLoading}
                      className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer min-h-[42px] flex items-center justify-center gap-2 ${
                        canCheckIn 
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md' 
                          : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <Camera size={14} />
                      {t("checkInButton")}
                    </button>
                    {!canCheckIn && (
                      <p className="text-[10px] text-red-500 font-medium mt-1.5 text-center">
                        {timeInMinutes < checkInStart 
                          ? t("checkInNotStarted") 
                          : t("checkInEnded")}
                      </p>
                    )}
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 px-4 bg-green-50 text-green-500 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-bold text-xs rounded-xl cursor-not-allowed min-h-[42px]">
                    {t("alreadyCheckedIn")}
                  </button>
                )}
              </div>

              {/* Check-Out Button Box */}
              <div className="border border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white block">{t("checkOutBox")}</span>
                  <span className="text-[10px] text-[#64748B] dark:text-gray-300 block mt-0.5">{t("afternoonSession")}</span>
                  
                  {todayAttendance?.checkOut && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
                      <UserCheck size={14} /> {t("checkedOutAt").replace("{time}", todayAttendance.checkOut as string)}
                    </span>
                  )}
                </div>

                {!todayAttendance?.checkOut ? (
                  <div>
                    <button
                      onClick={() => openModal('out')}
                      disabled={!todayAttendance?.checkIn || !canCheckOut || actionLoading}
                      className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer min-h-[42px] flex items-center justify-center gap-2 ${
                        todayAttendance?.checkIn && canCheckOut
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md' 
                          : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <Camera size={14} />
                      {t("checkOutButton")}
                    </button>
                    {!todayAttendance?.checkIn ? (
                      <p className="text-[10px] text-amber-500 font-medium mt-1.5 text-center">
                        {t("doCheckInFirst")}
                      </p>
                    ) : !canCheckOut ? (
                      <p className="text-[10px] text-red-500 font-medium mt-1.5 text-center">
                        {timeInMinutes < checkOutStart 
                          ? t("checkOutNotStarted") 
                          : t("checkOutEnded")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <button disabled className="w-full py-2.5 px-4 bg-green-50 text-green-500 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-bold text-xs rounded-xl cursor-not-allowed min-h-[42px]">
                    {t("todayAttendanceDone")}
                  </button>
                )}
              </div>

            </div>
          )}
            
          {!todayAttendance?.checkIn && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 shadow-sm"
              >
                Ajukan Izin / Sakit
              </button>
            </div>
          )}

          <div className="border-t border-[#E2E8F0] dark:border-gray-700/60 pt-3 mt-4">
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              {t("syncNote")} (Hanya browser/perangkat yang mendukung GPS dan Kamera yang dapat digunakan).
            </p>
          </div>
        </div>
        )}

      </div>

      {/* Attendance History Section */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-white mb-4">{t("attendanceHistory")}</h3>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-gray-700 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-[#64748B] dark:text-gray-300 font-medium">{t("noAttendanceHistory")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-400 font-bold">
                  <th className="p-3.5">{t("colDate")}</th>
                  <th className="p-3.5">{t("colCheckIn")}</th>
                  <th className="p-3.5">{t("colCheckOut")}</th>
                  <th className="p-3.5">Lokasi & Bukti</th>
                  <th className="p-3.5">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {history.map((item: any) => {
                  const labelInfo = getStatusLabel(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 text-[#0F172A] dark:text-gray-200">
                      <td className="p-3.5 font-medium">{item.date}</td>
                      <td className="p-3.5">{item.checkIn ? `${item.checkIn} WIB` : '-'}</td>
                      <td className="p-3.5">{item.checkOut ? `${item.checkOut} WIB` : '-'}</td>
                      <td className="p-3.5">
                        {item.checkInPhoto || item.checkOutPhoto ? (
                          <button 
                            onClick={() => setProofModalData(item)}
                            className="text-xs text-primary font-medium flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <CheckCircle2 size={12}/> Terekam (Lihat)
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${labelInfo.color}`}>
                          {labelInfo.label}
                        </span>
                        {currentUser && !PARTICIPANT_ROLES.includes(currentUser.role) && (item.status === 'PENDING_SICK' || item.status === 'PENDING_EXCUSED') && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleApproveLeave(item.id, true)} disabled={actionLoading} className="text-[10px] font-bold bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 shadow-sm transition disabled:opacity-50">Setujui</button>
                            <button onClick={() => handleApproveLeave(item.id, false)} disabled={actionLoading} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 shadow-sm transition disabled:opacity-50">Tolak</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Proof Modal */}
      {proofModalData && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-white">
                Bukti Absensi - {proofModalData.date}
              </h3>
              <button onClick={() => setProofModalData(null)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[80vh]">
              {/* Check-In Info */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Absen Masuk</h4>
                {proofModalData.checkInPhoto ? (
                  <>
                    <img src={proofModalData.checkInPhoto} alt="Bukti Masuk" className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                    {proofModalData.checkInLat && proofModalData.checkInLng && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${proofModalData.checkInLat},${proofModalData.checkInLng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg"
                      >
                        <MapPin size={14} /> Lihat Lokasi di Peta
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tidak ada data bukti absen masuk.</p>
                )}
              </div>

              {/* Check-Out Info */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Absen Pulang</h4>
                {proofModalData.checkOutPhoto ? (
                  <>
                    <img src={proofModalData.checkOutPhoto} alt="Bukti Pulang" className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                    {proofModalData.checkOutLat && proofModalData.checkOutLng && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${proofModalData.checkOutLat},${proofModalData.checkOutLng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg"
                      >
                        <MapPin size={14} /> Lihat Lokasi di Peta
                      </a>
                    )}
                    {proofModalData.activityNotes && (
                      <div className="mt-2 bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Catatan Kegiatan</span>
                        <p className="text-xs text-[#0F172A] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                          {proofModalData.activityNotes}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tidak ada data bukti absen pulang.</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E293B] flex justify-end">
              <button 
                onClick={() => setProofModalData(null)}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave/Sick Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-white">
                Pengajuan Izin / Sakit
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Tipe Pengajuan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setLeaveType('SICK')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition ${leaveType === 'SICK' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
                  >
                    Sakit
                  </button>
                  <button 
                    onClick={() => setLeaveType('EXCUSED')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition ${leaveType === 'EXCUSED' ? 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-400' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
                  >
                    Izin
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Alasan / Keterangan <span className="text-red-500">*</span></label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Jelaskan alasan izin atau sakit secara singkat..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none h-24 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Lampiran Bukti (Opsional)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setLeavePhoto(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden" 
                    id="leave-photo-upload"
                  />
                  {!leavePhoto ? (
                    <label 
                      htmlFor="leave-photo-upload" 
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <Upload size={20} className="text-gray-400 mb-2" />
                      <span className="text-xs font-medium text-gray-500">Pilih atau Ambil Foto Surat</span>
                    </label>
                  ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={leavePhoto} alt="Bukti" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setLeavePhoto(null)} 
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E293B]">
              <button
                onClick={handleRequestLeave}
                disabled={!leaveReason.trim() || actionLoading}
                className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${
                  leaveReason.trim()
                    ? 'bg-primary hover:bg-primary-hover text-white shadow-md'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                }`}
              >
                {actionLoading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {actionLoading ? 'Memproses...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Face Registration Modal */}
      {isFaceRegistrationModalOpen && (
        <FaceRegistrationModal 
          onClose={() => setIsFaceRegistrationModalOpen(false)}
          onSuccess={() => {
            setIsFaceRegistrationModalOpen(false);
            fetchAttendanceData();
            setTimeout(() => {
              openModal('in');
            }, 500);
          }}
        />
      )}
    </div>
  );
}
