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
  checkOutAction 
} from '@/app/actions/attendance';
import { getFaceDescriptorAction } from '@/app/actions/profile';
import * as faceapi from '@vladmandic/face-api';
import { Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Camera, MapPin, X, Upload } from 'lucide-react';

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

  // --- Camera & Location States ---
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('in');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState<string | null>(null);
  const [activityNotes, setActivityNotes] = useState<string>('');
  
  // Face Recognition states
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [savedFaceDescriptor, setSavedFaceDescriptor] = useState<Float32Array | null>(null);

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
        try {
          const parsedArr = JSON.parse(faceRes.data);
          setSavedFaceDescriptor(new Float32Array(parsedArr));
        } catch (e) {
          console.error("Failed to parse face descriptor", e);
        }
      } else {
        setSavedFaceDescriptor(null);
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
    // Load face-api models
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (e) {
        console.error('Failed to load face models', e);
      }
    };
    loadModels();
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

  // --- Camera & Location Methods ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setLocError("Akses kamera ditolak atau tidak tersedia.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation tidak didukung oleh browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error("Location error:", error);
        setLocError("Akses lokasi ditolak. Mohon izinkan akses lokasi.");
      },
      { enableHighAccuracy: true }
    );
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress image to save database space (base64)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setPhotoCaptured(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            setPhotoCaptured(dataUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = async (mode: 'in' | 'out') => {
    setCameraMode(mode);
    setPhotoCaptured(null);
    setLocation(null);
    setLocError('');
    setIsCameraModalOpen(true);
    fetchLocation();
    startCamera();
  };

  const closeModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
  };

  const handleConfirmAttendance = async () => {
    if (!currentUser || actionLoading || !photoCaptured || !location) return;
    
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      
      if (cameraMode === 'in') {
        if (!savedFaceDescriptor) {
          setErrorMsg('Wajah Anda belum terdaftar. Silakan daftar wajah di menu Pengaturan terlebih dahulu.');
          setActionLoading(false);
          return;
        }

        setVerifyingFace(true);
        // Create an image element from photoCaptured to run faceapi
        const img = document.createElement('img');
        img.src = photoCaptured;
        await new Promise((resolve) => { img.onload = resolve; });

        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
          setErrorMsg('Wajah tidak terdeteksi pada foto. Silakan ulangi.');
          setVerifyingFace(false);
          setActionLoading(false);
          return;
        }

        const distance = faceapi.euclideanDistance(detection.descriptor, savedFaceDescriptor);
        setVerifyingFace(false);

        if (distance > 0.5) { // Threshold
          setErrorMsg(`Wajah tidak cocok dengan data pendaftaran (Distance: ${distance.toFixed(2)}).`);
          setActionLoading(false);
          return;
        }
      }

      let res;
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
      setVerifyingFace(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return { label: t('statusCheckedIn'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'COMPLETED':
        return { label: t('statusCompleted'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'ABSENT':
        return { label: t('statusAbsent'), color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
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
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button 
                        onClick={capturePhoto}
                        className="bg-white text-gray-900 rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95"
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
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <AlertCircle size={16} /> Data wajah belum terdaftar. Silakan ke Pengaturan untuk registrasi.
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

          <div className="border-t border-[#E2E8F0] dark:border-gray-700/60 pt-3">
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

    </div>
  );
}
