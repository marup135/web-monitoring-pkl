'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePKL } from '../context/PKLContext';
import { PARTICIPANT_ROLES } from '../lib/constants';
import { useLanguage } from '../context/LanguageContext';
import { 
  getAttendanceTodayAction, 
  getAttendanceHistoryAction, 
  checkInAction, 
  checkOutAction, 
  getServerTimeAction, 
  requestLeaveAction, 
  approveLeaveAction,
  approveWfhAction,
  rejectWfhAction,
  editAttendanceAction
} from '@/app/actions/attendance';
import { getFaceDescriptorAction } from '@/app/actions/profile';
import { Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Camera, MapPin, X, Upload, Eye, WifiOff, Download, Edit } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFaceApi } from '../hooks/useFaceApi';
import { useCameraLocation } from '../hooks/useCameraLocation';
import { useBlinkDetection } from '../hooks/useBlinkDetection';
import { FaceRegistrationModal } from './FaceRegistrationModal';
import { applyWatermark } from '../utils/watermark';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  locationStatus?: string;
  isVerified?: boolean;
  verifiedBy?: string | null;
  createdAt: Date;
}

export function parseActivityPhotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string' && Boolean(item));
  } catch (e) {
    // fallback for single photo
  }
  return typeof raw === 'string' && raw.trim() !== '' ? [raw] : [];
}

export function AttendancePage() {
  const { currentUser, selectedStudentId, state } = usePKL();
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
  const [showWfhPrompt, setShowWfhPrompt] = useState<{distance: number} | null>(null);
  
  // Modal for Viewing Proof
  const [proofModalData, setProofModalData] = useState<{
    id: string;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    isVerified?: boolean;
    checkInPhoto?: string | null;
    checkInLat?: number | null;
    checkInLng?: number | null;
    checkOutPhoto?: string | null;
    checkOutLat?: number | null;
    checkOutLng?: number | null;
    activityNotes?: string | null;
    activityPhoto?: string | null;
  } | null>(null);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [editNotesText, setEditNotesText] = useState("");
  const [editActivityPhotos, setEditActivityPhotos] = useState<string[]>([]);
  const [activityPhotos, setActivityPhotos] = useState<string[]>([]);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const activityFileInputRef = useRef<HTMLInputElement>(null);
  const editActivityFileInputRef = useRef<HTMLInputElement>(null);

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
    locationName,
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
    closeModal: originalCloseModal,
    startCamera
  } = useCameraLocation();

  const closeModal = () => {
    setEditingAttendanceId(null);
    setModalError(null);
    setActivityPhotos([]);
    originalCloseModal();
  };

  const { hasBlinked, isDetecting, instruction, resetBlink } = useBlinkDetection(
    videoRef, 
    isCameraModalOpen && (cameraMode === 'in' || cameraMode === 'out') && !photoCaptured && modelsLoaded
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rekap Absensi Siswa", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Nama Siswa / Mahasiswa: ${state.studentName || currentUser?.name || '-'}`, 14, 30);
    doc.text(`Tempat PKL: ${state.companyName || '-'}`, 14, 35);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 40);
    
    const tableColumn = ["Tanggal", "Masuk", "Pulang", "Status"];
    const tableRows: any[] = [];
    
    history.forEach(item => {
      const rowData = [
        item.date,
        item.checkIn ? `${item.checkIn} WIB` : '-',
        item.checkOut ? `${item.checkOut} WIB` : '-',
        item.status === 'PRESENT' ? 'Hadir' : item.status === 'LATE' ? 'Terlambat' : item.status === 'ABSENT' ? 'Alpa' : item.status
      ];
      tableRows.push(rowData);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid'
    });
    
    doc.save(`Rekap_Absensi_${selectedStudentId || 'Siswa'}.pdf`);
  };

  const handleDownloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isEditAllowed = (attendanceDate: string) => {
    if (!serverTimeInfo) return false;
    if (attendanceDate !== serverTimeInfo.dateString) return false;
    if (serverTimeInfo.hours >= 21) return false;
    return true;
  };

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
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
            applyWatermark(canvas, {
              type: 'Bukti Kegiatan',
              userName: currentUser?.name || 'User',
              lat: location?.lat,
              lng: location?.lng,
              locationName: locationName || undefined
            });
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            resolve('');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleActivityPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentList = isEdit ? editActivityPhotos : activityPhotos;
    const remainingSlots = 5 - currentList.length;

    if (remainingSlots <= 0) {
      alert("Maksimal 5 foto bukti kegiatan.");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const newPhotos = await Promise.all(filesToProcess.map(processImageFile));
    const validPhotos = newPhotos.filter(Boolean);

    if (isEdit) {
      setEditActivityPhotos((prev) => [...prev, ...validPhotos]);
    } else {
      setActivityPhotos((prev) => [...prev, ...validPhotos]);
    }

    if (e.target) e.target.value = '';
  };

  const removeActivityPhoto = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditActivityPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setActivityPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveNotes = async () => {
    if (!proofModalData || actionLoading) return;
    setActionLoading(true);
    const activityPhotoPayload = editActivityPhotos.length > 0 ? JSON.stringify(editActivityPhotos) : null;
    const res = await editAttendanceAction(proofModalData.id, { 
      activityNotes: editNotesText,
      activityPhoto: activityPhotoPayload
    });
    if (res.success) {
      setSuccessMsg('Catatan & foto kegiatan berhasil diperbarui!');
      setProofModalData({ ...proofModalData, activityNotes: editNotesText, activityPhoto: activityPhotoPayload });
      setIsEditingNotes(false);
      fetchAttendanceData();
    } else {
      setErrorMsg(res.error || 'Gagal memperbarui catatan.');
    }
    setActionLoading(false);
  };

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
      
      if (cameraMode === 'in' || cameraMode === 'out') {
        // Only verify face if we are online and face is registered
        if (!isOffline && savedFaceDescriptor) {
          const verifyResult = await verifyFace(photoCaptured);
          if (!verifyResult.success) {
            setModalError(verifyResult.error || 'Verifikasi wajah gagal. Silakan ulangi dengan wajah Anda sendiri.');
            setPhotoCaptured(null);
            resetBlink();
            startCamera();
            setActionLoading(false);
            return;
          }
        }
      }

      let res;
      const activityPhotoPayload = activityPhotos.length > 0 ? JSON.stringify(activityPhotos) : null;

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
          activityPhoto: activityPhotoPayload,
          offlineData
        };
        
        existing.push(newItem);
        localStorage.setItem(key, JSON.stringify(existing));
        
        setSuccessMsg(cameraMode === 'in' ? 'Anda sedang offline. Absen masuk disimpan sementara!' : 'Anda sedang offline. Absen pulang disimpan sementara!');
        closeModal();
        setActionLoading(false);
        return;
      }

      if (editingAttendanceId) {
        const updateData = cameraMode === 'in' 
          ? { checkInPhoto: photoCaptured } 
          : { checkOutPhoto: photoCaptured, activityNotes, activityPhoto: activityPhotoPayload };
        res = await editAttendanceAction(editingAttendanceId, updateData);
        if (res.success) {
          setSuccessMsg('Absensi berhasil diperbarui!');
          setEditingAttendanceId(null);
          closeModal();
          await fetchAttendanceData();
        } else {
          setErrorMsg(res.error || 'Gagal memperbarui absensi.');
        }
        setActionLoading(false);
        return;
      }

      if (cameraMode === 'in') {
        res = await checkInAction(currentUser.id, location.lat, location.lng, photoCaptured);
      } else {
        if (!activityNotes.trim()) {
           setModalError('Catatan kegiatan wajib diisi untuk absen keluar.');
           setActionLoading(false);
           return;
        }
        res = await checkOutAction(currentUser.id, location.lat, location.lng, photoCaptured, activityNotes, undefined, activityPhotoPayload || undefined);
      }

      if (res.success) {
        setSuccessMsg(cameraMode === 'in' ? 'Absen masuk berhasil dilakukan!' : 'Absen pulang berhasil dilakukan! Sampai jumpa besok.');
        closeModal();
        await fetchAttendanceData();
      } else {
        if (res.error === 'OUT_OF_RANGE') {
          setShowWfhPrompt({ distance: (res as any).distance || 0 });
        } else if (res.error === 'OUT_OF_RANGE_CHECKOUT') {
          setErrorMsg(`Gagal absen pulang. Jarak Anda ${(res as any).distance}m dari lokasi PKL (Maks: 100m).`);
        } else {
          setErrorMsg(res.error || `Gagal absen ${cameraMode === 'in' ? 'masuk' : 'pulang'}.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat absensi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWfhConfirm = async () => {
    if (!currentUser || !location || !photoCaptured) return;
    try {
      setActionLoading(true);
      setShowWfhPrompt(null);
      const res = await checkInAction(currentUser.id, location.lat, location.lng, photoCaptured, undefined, true);
      if (res.success) {
        setSuccessMsg('Absen masuk WFH berhasil diajukan! Menunggu persetujuan pembimbing.');
        closeModal();
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal absen masuk WFH.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
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

  const handleApproveWfh = async (attendanceId: string, isApproved: boolean) => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = isApproved ? await approveWfhAction(attendanceId) : await rejectWfhAction(attendanceId);
      if (res.success) {
        setSuccessMsg(isApproved ? 'Berhasil menyetujui WFH.' : 'Pengajuan WFH telah ditolak.');
        await fetchAttendanceData();
      } else {
        setErrorMsg(res.error || 'Gagal merubah status WFH.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string, locationStatus?: string) => {
    if (locationStatus === 'PENDING') {
      return { label: 'MENUNGGU WFH', color: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800' };
    }
    if (locationStatus === 'REJECTED') {
      return { label: 'WFH DITOLAK', color: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800' };
    }
    
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
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-white">
                {cameraMode === 'in' ? 'Verifikasi Absen Masuk' : 'Verifikasi Absen Pulang'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">

              {/* Location Status */}
              <div className={`p-3 rounded-xl flex items-start gap-3 text-sm ${location ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                <MapPin size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{location ? 'Lokasi Ditemukan' : 'Mencari Lokasi...'}</p>
                  <p className="text-xs opacity-80">
                    {locationName 
                      ? locationName
                      : location 
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
                    {(cameraMode === 'in' || cameraMode === 'out') && !hasBlinked && (
                      <div className="absolute top-4 left-4 right-4 z-10">
                        <div className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors duration-300 ${isDetecting ? 'bg-amber-400 text-amber-900' : 'bg-gray-800 text-white'}`}>
                          <Eye size={18} className={isDetecting ? 'animate-pulse' : ''} />
                          {instruction}
                        </div>
                      </div>
                    )}
                    {(cameraMode === 'in' || cameraMode === 'out') && hasBlinked && (
                      <div className="absolute top-4 left-4 right-4 z-10">
                        <div className="p-3 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                          <CheckCircle2 size={18} />
                          {instruction}
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button 
                        onClick={() => capturePhoto(cameraMode === 'in' ? 'Absen Masuk' : 'Absen Pulang')}
                        disabled={Boolean((cameraMode === 'in' || cameraMode === 'out') && savedFaceDescriptor && !hasBlinked)}
                        className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition ${(cameraMode === 'in' || cameraMode === 'out') && savedFaceDescriptor && !hasBlinked ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'bg-white text-gray-900 hover:scale-105 active:scale-95'}`}
                      >
                        <Camera size={24} />
                      </button>
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
                <div className="mt-3 space-y-3 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-200 dark:border-gray-700">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Foto Bukti Kegiatan ({activityPhotos.length}/5)
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">Dapat pilih beberapa foto</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {activityPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-slate-900 aspect-square shadow-sm">
                          <img src={photo} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeActivityPhoto(idx, false)} 
                            className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-600 transition shadow-md"
                            title="Hapus foto"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {activityPhotos.length < 5 && (
                        <div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            ref={activityFileInputRef} 
                            onChange={(e) => handleActivityPhotoUpload(e, false)} 
                            className="hidden" 
                          />
                          <button 
                            type="button" 
                            onClick={() => activityFileInputRef.current?.click()}
                            className="w-full h-full min-h-[80px] border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary rounded-xl text-xs text-gray-600 dark:text-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium p-2"
                          >
                            <Upload size={18} className="text-primary" />
                            <span className="text-[10px] text-center">{activityPhotos.length > 0 ? '+ Tambah' : 'Upload Foto'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Catatan Kegiatan Hari Ini <span className="text-red-500">*</span></label>
                    <textarea
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      placeholder="Contoh: Menyelesaikan desain UI login page dan integrasi API..."
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none h-24 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1E293B] shrink-0">
              {/* Modal Specific Error - Moved to bottom so it's always visible */}
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl text-xs flex items-center justify-between gap-2 font-medium border border-red-200 dark:border-red-800 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0 text-red-500" />
                    <span>{modalError}</span>
                  </div>
                  <button onClick={() => setModalError(null)} className="p-1 text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              )}
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
                <div className={`px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-sm ${getStatusLabel(todayAttendance?.status || 'NOT_CHECKED_IN', todayAttendance?.locationStatus).color}`}>
                  {getStatusLabel(todayAttendance?.status || 'NOT_CHECKED_IN', todayAttendance?.locationStatus).label}
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">{t("attendanceHistory")}</h3>
          {currentUser && !PARTICIPANT_ROLES.includes(currentUser.role) && history.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl text-xs font-bold transition"
            >
              <Download size={14} /> Rekap PDF
            </button>
          )}
        </div>
        
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
                  const statusUI = getStatusLabel(item.status, item.locationStatus);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 text-[#0F172A] dark:text-gray-200">
                      <td className="p-3.5 font-medium">{item.date}</td>
                      <td className="p-3.5">{item.checkIn ? `${item.checkIn} WIB` : '-'}</td>
                      <td className="p-3.5">{item.checkOut ? `${item.checkOut} WIB` : '-'}</td>
                      <td className="p-3.5">
                        {item.checkInPhoto || item.checkOutPhoto ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setProofModalData(item)}
                              className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg font-medium flex items-center gap-1 transition"
                            >
                              <Eye size={12}/> Lihat
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${statusUI.color}`}>
                          {statusUI.label}
                        </span>
                        {currentUser && !PARTICIPANT_ROLES.includes(currentUser.role) && (item.status === 'PENDING_SICK' || item.status === 'PENDING_EXCUSED') && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleApproveLeave(item.id, true)} disabled={actionLoading} className="text-[10px] font-bold bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 shadow-sm transition disabled:opacity-50">Setujui Izin</button>
                            <button onClick={() => handleApproveLeave(item.id, false)} disabled={actionLoading} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 shadow-sm transition disabled:opacity-50">Tolak</button>
                          </div>
                        )}
                        {currentUser && !PARTICIPANT_ROLES.includes(currentUser.role) && item.locationStatus === 'PENDING' && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleApproveWfh(item.id, true)} disabled={actionLoading} className="text-[10px] font-bold bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 shadow-sm transition disabled:opacity-50">Setujui WFH</button>
                            <button onClick={() => handleApproveWfh(item.id, false)} disabled={actionLoading} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 shadow-sm transition disabled:opacity-50">Tolak</button>
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
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-slate-50/70 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Bukti & Laporan Absensi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Tanggal: <span className="font-semibold text-slate-700 dark:text-gray-200">{proofModalData.date}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setProofModalData(null)} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              
              {/* Section 1: Presensi Masuk & Pulang (Equal 2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                
                {/* Card 1: Absen Masuk */}
                <div className="bg-slate-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-700/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-gray-700/60 pb-2.5 mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Absen Masuk
                      </span>
                      {proofModalData.checkIn ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                          {proofModalData.checkIn} WIB
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Belum Masuk</span>
                      )}
                    </div>

                    {proofModalData.checkInPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm bg-slate-900 cursor-pointer" onClick={() => setPreviewImage({ url: proofModalData.checkInPhoto!, title: `Wajah Absen Masuk (${proofModalData.date})` })}>
                        <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                          Foto Wajah Masuk
                        </span>
                        <img src={proofModalData.checkInPhoto} alt="Bukti Masuk" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadImage(proofModalData.checkInPhoto!, `Masuk_${proofModalData.date}.jpg`); }} 
                            className="p-2 bg-white/90 text-gray-800 hover:bg-white rounded-xl shadow-lg transition"
                            title="Unduh Foto"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <AlertCircle size={22} className="mb-1.5 opacity-50" />
                        <p className="text-xs italic">Tidak ada foto absen masuk</p>
                      </div>
                    )}
                  </div>

                  {proofModalData.checkInLat && proofModalData.checkInLng ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${proofModalData.checkInLat},${proofModalData.checkInLng}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full text-xs flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 transition bg-blue-50 dark:bg-blue-900/30 py-2.5 px-3 rounded-xl font-semibold border border-blue-100 dark:border-blue-800/50 shadow-sm mt-auto"
                    >
                      <MapPin size={14} /> Peta Lokasi Masuk
                    </a>
                  ) : null}
                </div>

                {/* Card 2: Absen Pulang */}
                <div className="bg-slate-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-700/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-gray-700/60 pb-2.5 mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Absen Pulang
                      </span>
                      {proofModalData.checkOut ? (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200/50">
                          {proofModalData.checkOut} WIB
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Belum Pulang</span>
                      )}
                    </div>

                    {proofModalData.checkOutPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm bg-slate-900 cursor-pointer" onClick={() => setPreviewImage({ url: proofModalData.checkOutPhoto!, title: `Wajah Absen Pulang (${proofModalData.date})` })}>
                        <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                          Foto Wajah Pulang
                        </span>
                        <img src={proofModalData.checkOutPhoto} alt="Bukti Pulang" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadImage(proofModalData.checkOutPhoto!, `Pulang_Wajah_${proofModalData.date}.jpg`); }} 
                            className="p-2 bg-white/90 text-gray-800 hover:bg-white rounded-xl shadow-lg transition"
                            title="Unduh Foto"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <AlertCircle size={22} className="mb-1.5 opacity-50" />
                        <p className="text-xs italic">Belum ada foto absen pulang</p>
                      </div>
                    )}
                  </div>

                  {proofModalData.checkOutLat && proofModalData.checkOutLng ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${proofModalData.checkOutLat},${proofModalData.checkOutLng}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full text-xs flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 transition bg-blue-50 dark:bg-blue-900/30 py-2.5 px-3 rounded-xl font-semibold border border-blue-100 dark:border-blue-800/50 shadow-sm mt-auto"
                    >
                      <MapPin size={14} /> Peta Lokasi Pulang
                    </a>
                  ) : null}
                </div>

              </div>

              {/* Section 2: Dedicated Activity Photos (Foto Bukti Kegiatan) */}
              {(() => {
                const parsedPhotos = parseActivityPhotos(proofModalData.activityPhoto);
                if (parsedPhotos.length === 0 && !isEditingNotes) return null;

                return (
                  <div className="bg-slate-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 dark:border-gray-700/60 pb-2.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>📸</span> Dokumentasi & Foto Bukti Kegiatan
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 bg-slate-200/60 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
                        {isEditingNotes ? editActivityPhotos.length : parsedPhotos.length} Foto
                      </span>
                    </div>

                    {!isEditingNotes ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {parsedPhotos.map((photo, pIdx) => (
                          <div 
                            key={pIdx} 
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-900 aspect-video sm:aspect-square shadow-sm cursor-pointer"
                            onClick={() => setPreviewImage({ url: photo, title: `Bukti Kegiatan #${pIdx + 1} (${proofModalData.date})` })}
                          >
                            <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-semibold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                              Bukti #{pIdx + 1}
                            </span>
                            <img src={photo} alt={`Bukti Kegiatan ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDownloadImage(photo, `Bukti_Kegiatan_${pIdx + 1}_${proofModalData.date}.jpg`); }} 
                                className="p-2 bg-white/90 text-gray-800 hover:bg-white rounded-xl shadow-lg transition"
                                title="Unduh Foto"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {/* Section 3: Catatan & Laporan Kegiatan Harian */}
              <div className="bg-slate-50/80 dark:bg-gray-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-gray-700/60 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      📝 Catatan & Laporan Kegiatan Harian
                    </span>
                  </div>
                  {currentUser && currentUser.role === 'siswa' && !isEditingNotes && (
                    isEditAllowed(proofModalData.date) ? (
                      <button 
                        onClick={() => { 
                          setIsEditingNotes(true); 
                          setEditNotesText(proofModalData.activityNotes || ''); 
                          setEditActivityPhotos(parseActivityPhotos(proofModalData.activityPhoto));
                        }} 
                        className="text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg font-bold border border-orange-200/60 dark:border-orange-800/50 transition"
                      >
                        <Edit size={13}/> Edit Catatan & Foto
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic bg-gray-200/70 dark:bg-gray-700/60 px-2.5 py-1 rounded-md font-medium">
                        Pengeditan Ditutup (Maks 21:00 WIB)
                      </span>
                    )
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="flex flex-col gap-4 mt-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">Teks Catatan Kegiatan</label>
                      <textarea 
                        value={editNotesText} 
                        onChange={(e) => setEditNotesText(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-inner"
                        rows={4}
                        placeholder="Tuliskan detail kegiatan yang Anda kerjakan..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          Kelola Foto Bukti Kegiatan ({editActivityPhotos.length}/5)
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 mb-2">
                        {editActivityPhotos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-slate-900 aspect-square shadow-sm">
                            <img src={photo} alt={`Bukti Edit ${pIdx + 1}`} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => removeActivityPhoto(pIdx, true)} 
                              className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-600 transition shadow-md z-10"
                              title="Hapus foto ini"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {editActivityPhotos.length < 5 && (
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              ref={editActivityFileInputRef} 
                              onChange={(e) => handleActivityPhotoUpload(e, true)} 
                              className="hidden" 
                            />
                            <button 
                              type="button" 
                              onClick={() => editActivityFileInputRef.current?.click()}
                              className="w-full h-full min-h-[80px] border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium p-1.5"
                            >
                              <Upload size={18} className="text-primary" />
                              <span className="text-[10px] text-center">{editActivityPhotos.length > 0 ? '+ Tambah' : 'Unggah Foto'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => setIsEditingNotes(false)} className="text-xs font-bold px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 transition">Batal</button>
                      <button onClick={handleSaveNotes} disabled={actionLoading} className="text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-md disabled:opacity-50 transition">Simpan Perubahan</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm">
                    {proofModalData.activityNotes ? (
                      <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                        {proofModalData.activityNotes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Belum ada catatan kegiatan yang diisi.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#1E293B] flex justify-end shrink-0">
              <button 
                onClick={() => setProofModalData(null)}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-gray-700 text-white">
              <span className="text-xs font-semibold">{previewImage.title}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadImage(previewImage.url, `${previewImage.title}.jpg`)} 
                  className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  title="Unduh Foto"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => setPreviewImage(null)} 
                  className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto flex-1 bg-black/50">
              <img src={previewImage.url} alt="Preview" className="max-h-[75vh] w-auto object-contain rounded-lg" />
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

      {/* WFH Prompt Modal */}
      {showWfhPrompt && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Lokasi di Luar Radius</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Jarak Anda dengan kantor adalah <strong>{showWfhPrompt.distance} meter</strong> (Maks: 100m). 
              Apakah Anda sedang WFH / Tugas Luar hari ini?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWfhPrompt(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl font-bold border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleWfhConfirm}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white transition flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : null}
                Ya, WFH
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
