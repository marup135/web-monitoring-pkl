'use client';

import React, { useState, useEffect } from 'react';
import { getTodayAttendancesAction, approveAttendanceAction, setCompanyIpPrefixAction } from '@/app/actions/pkl';
import { RefreshCw, Search, Eye, CheckCircle2, Clock, XCircle, Image as ImageIcon, FileSpreadsheet, FileText, Wifi } from 'lucide-react';
import Image from 'next/image';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../context/LanguageContext';
import { usePKL } from '../context/PKLContext';

interface DailyDashboardProps {
  onPantau: (studentId: string, tab?: 'board' | 'attendance', showTabs?: boolean) => void;
  role: 'EXTERNAL_MENTOR' | 'INTERNAL_MENTOR';
  selectedCompanyId?: string;
  selectedClassId?: string;
  selectedSchool?: string;
}

interface AttendanceRecord {
  userId: string;
  name: string;
  school: string | null;
  company: string | null;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  activityNotes: string | null;
  activityPhoto: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  activityPhotosList?: string[];
  date: string;
  isVerified?: boolean;
}

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  onPantau,
  role,
  selectedCompanyId,
  selectedClassId,
  selectedSchool
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = usePKL();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<AttendanceRecord | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const handleApprove = async (id: string, isApproved: boolean) => {
    setIsApproving(id);
    try {
      const res = await approveAttendanceAction(id, isApproved);
      if (res.success) {
        fetchAttendances();
      } else {
        alert(res.error || 'Gagal memproses persetujuan');
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    } finally {
      setIsApproving(null);
    }
  };


  const fetchAttendances = async () => {
    setLoading(true);
    try {
      // Fetch based on what is selected by the parent component (Mentor/Guru portal)
      const data = await getTodayAttendancesAction(selectedClassId, selectedCompanyId, selectedSchool);
      setAttendances(data);
    } catch (error) {
      console.error('Failed to fetch daily attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [selectedCompanyId, selectedClassId, selectedSchool]);

  const filteredData = attendances.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.school && a.school.toLowerCase().includes(search.toLowerCase()));
    const matchesSchool = !selectedSchool || a.school === selectedSchool;
    return matchesSearch && matchesSchool;
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const dataToExport = filteredData.map((student: any, index: number) => ({
        'No': index + 1,
        'Nama Siswa': student.name,
        'Asal Sekolah': student.school || '-',
        'Total Hadir': student.recap?.hadir || 0,
        'Total Izin': student.recap?.izin || 0,
        'Total Sakit': student.recap?.sakit || 0,
        'Total Alpha': student.recap?.alpha || 0,
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataToExport);

      const wscols = [
        { wch: 5 }, // No
        { wch: 30 }, // Nama
        { wch: 25 }, // Sekolah
        { wch: 15 }, // Hadir
        { wch: 15 }, // Izin
        { wch: 15 }, // Sakit
        { wch: 15 }, // Alpha
      ];
      worksheet['!cols'] = wscols;

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Rekap Keseluruhan");

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Rekap_Kehadiran_Keseluruhan_${dateStr}.xlsx`;

      xlsx.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Terjadi kesalahan saat mengekspor ke Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSetIp = async () => {
    const compId = selectedCompanyId || currentUser?.companies?.[0]?.id;
    if (!compId) return;
    try {
      const confirmSet = confirm('Apakah Anda yakin ingin mengatur IP WiFi untuk kantor ini?');
      if (!confirmSet) return;

      const resIp = await fetch('https://api.ipify.org?format=json');
      const data = await resIp.json();

      const company = currentUser?.companies?.find((c: any) => c.id === compId);
      const existingIps = (company as any)?.allowedIpPrefix ? (company as any).allowedIpPrefix : '';

      const alreadyHasIp = existingIps.includes(data.ip.split('.').slice(0, 3).join('.'));
      const defaultPrompt = existingIps
        ? (alreadyHasIp ? existingIps : `${existingIps}, ${data.ip}`)
        : data.ip;

      const manualIp = prompt('Konfirmasi atau edit IP Prefix (pisahkan dengan koma jika lebih dari satu):', defaultPrompt);
      if (!manualIp) return;

      const res = await setCompanyIpPrefixAction(compId, manualIp);
      if (res.success) {
        alert(`IP berhasil diatur! IP Prefix: ${res.prefix}`);
        window.location.reload();
      } else {
        alert(res.error || 'Gagal mengatur IP.');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat menghubungi server IP.');
      console.error(e);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      const doc = new jsPDF('landscape');

      doc.setFontSize(16);
      doc.text(`Rekap Kehadiran Keseluruhan Siswa`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Diekspor pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 28);

      const tableData = filteredData.map((student: any, index: number) => [
        index + 1,
        student.name,
        student.school || '-',
        `${student.recap?.hadir || 0} Hari`,
        `${student.recap?.izin || 0} Hari`,
        `${student.recap?.sakit || 0} Hari`,
        `${student.recap?.alpha || 0} Hari`,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', t('studentNameCol') || 'Nama Siswa', t('schoolOrigin') || 'Asal Sekolah', t('statusCompleted') || 'Hadir', 'Izin', 'Sakit', 'Alpha']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`Rekap_Absensi_${dateStr}.pdf`);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getStatusBadge = (status: string, isVerified?: boolean) => {
    if (['WFH', 'SAKIT', 'IZIN'].includes(status)) {
      if (isVerified) {
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <CheckCircle2 size={12} /> {status} (Disetujui)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <Clock size={12} /> {status} (Pending)
        </span>
      );
    }
    
    switch (status) {
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <CheckCircle2 size={12} /> {t('statusCompleted') || 'Hadir'}
          </span>
        );
      case 'NOT_CHECKED_IN':
        return (
          <span className="mx-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs">
            <Clock size={12} /> {t('statusNotCheckedIn') || 'Belum Absen'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs">
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-white flex items-center gap-2">
            📋 {t('attendanceList') || 'DAFTAR ABSENSI'}
          </h2>
          <p className="text-[11px] text-[#64748B] dark:text-gray-300 mt-1">
            {t('attendanceSummaryToday') || 'Ringkasan absen dan kegiatan untuk hari ini'} ({new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchStudentName') || 'Cari nama siswa...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          
          {role === 'EXTERNAL_MENTOR' && (selectedCompanyId || (currentUser?.companies && currentUser.companies.length > 0)) && (
            <button
              onClick={handleSetIp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-bold cursor-pointer border border-blue-200 dark:border-blue-800/50 whitespace-nowrap"
              title="Atur IP WiFi Kantor"
            >
              <Wifi size={16} />
              <span className="hidden sm:inline text-sm">Set IP WiFi</span>
            </button>
          )}

          <button
            onClick={fetchAttendances}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="hidden sm:flex border-l border-slate-200 dark:border-gray-700 h-6 mx-1"></div>
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredData.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 dark:hover:bg-emerald-900/40 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {isExportingExcel ? (
              <span className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileSpreadsheet size={16} className="sm:w-3.5 sm:h-3.5" />
            )}
            <span className="hidden sm:inline">{isExportingExcel ? t('exporting') || 'Mengekspor...' : t('exportExcel') || 'Rekap Excel'}</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || filteredData.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/40 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {isExportingPDF ? (
              <span className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileText size={16} className="sm:w-3.5 sm:h-3.5" />
            )}
            <span className="hidden sm:inline">Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="bg-slate-50/80 dark:bg-[#1E293B] text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5 text-left whitespace-nowrap">{t('studentNameCol') || 'Nama Siswa'}</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">{t('colStatus') || 'Status'}</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">{t('colCheckIn') || 'Jam Masuk'}</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">{t('colCheckOut') || 'Jam Keluar'}</th>
                <th className="px-5 py-3.5 text-left min-w-[220px]">{t('activityNotes') || 'Catatan Kegiatan'}</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">{t('photo') || 'Foto'}</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">{t('studentActions') || 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                    {t('loadingData') || 'Memuat data...'}
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium">
                    {t('noStudentToday') || 'Tidak ada data siswa untuk hari ini.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 align-middle">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{record.name}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{role === 'EXTERNAL_MENTOR' ? record.school || '-' : record.company || '-'}</div>
                    </td>
                    <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                      {getStatusBadge(record.status, record.isVerified)}
                    </td>
                    <td className="px-4 py-4 align-middle text-center font-mono text-xs">
                      {record.checkIn ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">{record.checkIn}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-normal text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-center font-mono text-xs">
                      {record.checkOut ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">{record.checkOut}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-normal text-sm">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle text-xs leading-relaxed max-w-sm">
                      {record.activityNotes ? (
                        <span className="text-slate-700 dark:text-slate-300 line-clamp-2">{record.activityNotes}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">{t('noNotes') || 'Belum ada catatan'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      {record.activityPhoto || record.checkInPhoto ? (
                        <button onClick={() => setSelectedPreview(record)} className="inline-flex relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:scale-105 transition-transform cursor-pointer shadow-xs">
                          <img src={(record.activityPhotosList && record.activityPhotosList.length > 0) ? record.activityPhotosList[0] : (record.activityPhoto && !record.activityPhoto.startsWith('[') ? record.activityPhoto : (record.checkInPhoto || ''))} alt="Bukti" className="w-full h-full object-cover bg-white" />
                        </button>
                      ) : (
                        <div className="inline-flex w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageIcon size={15} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                      <button
                        onClick={() => onPantau(record.userId, 'attendance')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 text-xs font-bold transition shadow-xs cursor-pointer border border-blue-200 dark:border-blue-800/30"
                      >
                        <Eye size={14} />
                        {t('detail') || 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPreview(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Jurnal: {selectedPreview.name}</h3>
              <button onClick={() => setSelectedPreview(null)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Jam Masuk</span>
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-gray-200">{selectedPreview.checkIn || '-'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Jam Keluar</span>
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-gray-200">{selectedPreview.checkOut || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2">Catatan Kegiatan</span>
                <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedPreview.activityNotes || <span className="italic text-slate-400">Tidak ada catatan</span>}
                </p>
              </div>

              {(selectedPreview.checkInPhoto || selectedPreview.checkOutPhoto || (selectedPreview.activityPhotosList && selectedPreview.activityPhotosList.length > 0)) ? (
                <div className="flex flex-col gap-4 mt-2">
                  {(selectedPreview.checkInPhoto || selectedPreview.checkOutPhoto) && (
                    <div className={`grid gap-4 ${selectedPreview.checkInPhoto && selectedPreview.checkOutPhoto ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {selectedPreview.checkInPhoto && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 relative">
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-sm">Absen Masuk</div>
                          <img src={selectedPreview.checkInPhoto} alt="Foto Absen Masuk" className="w-full h-auto max-h-[250px] object-cover bg-slate-100 dark:bg-slate-900" />
                        </div>
                      )}
                      {selectedPreview.checkOutPhoto && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 relative">
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-sm">Absen Keluar</div>
                          <img src={selectedPreview.checkOutPhoto} alt="Foto Absen Keluar" className="w-full h-auto max-h-[250px] object-cover bg-slate-100 dark:bg-slate-900" />
                        </div>
                      )}
                    </div>
                  )}
                  {selectedPreview.activityPhotosList && selectedPreview.activityPhotosList.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {selectedPreview.activityPhotosList.map((photo, index) => (
                        <div key={index} className="rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 relative">
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-sm">Foto Kegiatan (Jurnal) {selectedPreview.activityPhotosList!.length > 1 ? ` - ${index + 1}` : ''}</div>
                          <img src={photo} alt={`Foto Kegiatan ${index + 1}`} className="w-full h-auto max-h-[400px] object-contain bg-slate-100 dark:bg-slate-900" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedPreview.activityPhoto ? (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 relative">
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-sm">Foto Bukti</div>
                  <img src={selectedPreview.activityPhoto} alt="Foto Kegiatan" className="w-full h-auto max-h-[400px] object-contain bg-slate-100 dark:bg-slate-900" />
                </div>
              ) : null}
              
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-gray-700 pt-4">
                {selectedPreview.status === 'PENDING' || (['WFH', 'SAKIT', 'IZIN'].includes(selectedPreview.status) && !selectedPreview.isVerified) ? (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedPreview.userId, false);
                        setSelectedPreview(null);
                      }}
                      disabled={isApproving === selectedPreview.userId}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Tolak Jurnal
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedPreview.userId, true);
                        setSelectedPreview(null);
                      }}
                      disabled={isApproving === selectedPreview.userId}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isApproving === selectedPreview.userId ? 'Memproses...' : 'Setujui Jurnal'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedPreview(null)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
