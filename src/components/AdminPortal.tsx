/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { useLanguage } from '../context/LanguageContext';
import { PARTICIPANT_ROLES } from '../lib/constants';
import { getDashboardMetricsAction } from '@/app/actions/pkl';
import { 
  Building2, Users, FolderKanban, Plus, Edit2, Trash2, CheckSquare, 
  Square, ShieldAlert, Award, Calendar, FileSpreadsheet, RefreshCw
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { t } = useLanguage();
  const {
    classesList,
    companiesList,
    allUsersList,
    currentUser,
    fetchAdminData,
    createClass,
    updateClass,
    deleteClass,
    createCompany,
    updateCompany,
    deleteCompany,
    assignGuruToClass,
    assignMentorToCompany,
    assignSiswa,
    resetState,
    loading,
    getPendingUsers,
    verifyUser
  } = usePKL();

  const [activeTab, setActiveTab] = useState<'overview' | 'kelas' | 'perusahaan' | 'users' | 'verifikasi'>('overview');

  // Input states
  const [newClassName, setNewClassName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLat, setNewCompanyLat] = useState('');
  const [newCompanyLng, setNewCompanyLng] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');

  // Overview metrics state
  const [overallMetrics, setOverallMetrics] = useState<any>(null);
  const [pendingUsersList, setPendingUsersList] = useState<any[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');


  const reloadAll = async () => {
    await fetchAdminData();
    const m = await getDashboardMetricsAction(undefined, undefined);
    setOverallMetrics(m);
    if (getPendingUsers) {
      const pu = await getPendingUsers();
      if (pu.success && pu.data) {
        setPendingUsersList(pu.data);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadAll();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const res = await createClass(newClassName);
    if (res.success) {
      setNewClassName('');
    } else {
      alert(res.error || t('errAddClass'));
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const lat = parseFloat(newCompanyLat) || undefined;
    const lng = parseFloat(newCompanyLng) || undefined;
    const res = await createCompany(newCompanyName, lat, lng);
    if (res.success) {
      setNewCompanyName('');
      setNewCompanyLat('');
      setNewCompanyLng('');
    } else {
      alert(res.error || t('errAddCompany'));
    }
  };

  const handleUpdate = async (type: 'class' | 'company', id: string) => {
    if (!editText.trim()) return;
    let res;
    if (type === 'class') {
      res = await updateClass(id, editText);
    } else {
      const lat = parseFloat(editLat) || undefined;
      const lng = parseFloat(editLng) || undefined;
      res = await updateCompany(id, editText, lat, lng);
    }
    
    if (res.success) {
      setEditingId(null);
      setEditText('');
      setEditLat('');
      setEditLng('');
    } else {
      alert(res.error || t('errUpdateData'));
    }
  };

  const handleDelete = async (type: 'class' | 'company', id: string) => {
    if (!confirm(t('confirmDeleteData'))) return;
    const res = type === 'class' ? await deleteClass(id) : await deleteCompany(id);
    if (!res.success) {
      alert(res.error);
    }
  };

  // Checkbox assignments
  const handleGuruClassToggle = async (userId: string, currentIds: string[], classId: string) => {
    let newIds = [...currentIds];
    if (newIds.includes(classId)) {
      newIds = newIds.filter(id => id !== classId);
    } else {
      newIds.push(classId);
    }
    const res = await assignGuruToClass(userId, newIds);
    if (!res.success) alert(res.error);
  };

  const handleMentorCompanyToggle = async (userId: string, currentIds: string[], companyId: string) => {
    let newIds = [...currentIds];
    if (newIds.includes(companyId)) {
      newIds = newIds.filter(id => id !== companyId);
    } else {
      newIds.push(companyId);
    }
    const res = await assignMentorToCompany(userId, newIds);
    if (!res.success) alert(res.error);
  };

  const handleSiswaClassChange = async (userId: string, classId: string) => {
    const user = allUsersList.find((u: any) => u.id === userId);
    const companyId = user?.companyId || null;
    const res = await assignSiswa(userId, classId || null, companyId, user?.name, user?.nisn, user?.nip, user?.jabatan, user?.employeeId, user?.companyEmail, user?.companyName);
    if (!res.success) alert(res.error);
  };

  const handleSiswaCompanyChange = async (userId: string, companyId: string) => {
    const user = allUsersList.find((u: any) => u.id === userId);
    const classId = user?.classId || null;
    const res = await assignSiswa(userId, classId, companyId || null, user?.name, user?.nisn, user?.nip, user?.jabatan, user?.employeeId, user?.companyEmail, user?.companyName);
    if (!res.success) alert(res.error);
  };

  const handleUserProfileUpdate = async (
    userId: string, 
    updates: { name?: string; nisn?: string; nip?: string; jabatan?: string; employeeId?: string; companyEmail?: string; companyName?: string }
  ) => {
    const user = allUsersList.find((u: any) => u.id === userId);
    const classId = user?.classId || null;
    const companyId = user?.companyId || null;
    const name = updates.name !== undefined ? updates.name : user?.name;
    const nisn = updates.nisn !== undefined ? updates.nisn : user?.nisn;
    const nip = updates.nip !== undefined ? updates.nip : user?.nip;
    const jabatan = updates.jabatan !== undefined ? updates.jabatan : user?.jabatan;
    const employeeId = updates.employeeId !== undefined ? updates.employeeId : user?.employeeId;
    const companyEmail = updates.companyEmail !== undefined ? updates.companyEmail : user?.companyEmail;
    const companyName = updates.companyName !== undefined ? updates.companyName : user?.companyName;
    
    const res = await assignSiswa(userId, classId, companyId, name, nisn, nip, jabatan, employeeId, companyEmail, companyName);
    if (!res.success) alert(res.error);
  };

  const handleResetData = async () => {
    if (confirm(t('confirmResetDb'))) {
      await resetState();
      await reloadAll();
      alert(t('successResetDb'));
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200">
      {/* Header and Sync Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-gray-300 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            Portal Administrator {currentUser?.institution?.name || "SMKN 1 Bojong"}
          </h2>
          <p className="text-[11px] text-[#64748B] dark:text-gray-300">
            {t('adminPortalDesc')} {currentUser?.institution?.code && <span className="font-bold text-primary ml-1">KODE INSTITUSI: {currentUser.institution.code}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={reloadAll}
            className="p-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 rounded-xl transition cursor-pointer text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleResetData}
            className="px-4 py-2.5 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#E2E8F0] dark:border-gray-700 gap-4 overflow-x-auto py-1 whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {[
          { key: 'overview', label: t('tabOverview') },
          { key: 'verifikasi', label: t('tabVerification') },
          { key: 'kelas', label: t('tabClasses') },
          { key: 'perusahaan', label: t('tabCompanies') },
          { key: 'users', label: t('tabAssignments') }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2.5 px-1 text-sm md:text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-sm min-h-[300px]">
        {activeTab === 'verifikasi' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider mb-2">{t('pendingAccountsList')}</h3>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setVerificationFilter('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${verificationFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}>Semua</button>
              <button onClick={() => setVerificationFilter('siswa')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${PARTICIPANT_ROLES.includes(verificationFilter) ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}>Siswa / Mahasiswa</button>
              <button onClick={() => setVerificationFilter('INTERNAL_MENTOR')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${verificationFilter === 'INTERNAL_MENTOR' ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}>Internal Mentor</button>
              <button onClick={() => setVerificationFilter('EXTERNAL_MENTOR')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${verificationFilter === 'EXTERNAL_MENTOR' ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}>External Mentor</button>
            </div>

            {(pendingUsersList.filter(u => verificationFilter === 'ALL' ? true : (PARTICIPANT_ROLES.includes(verificationFilter) ? PARTICIPANT_ROLES.includes(u.role) : u.role === verificationFilter))).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-400">{t('noPendingAccounts')}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                      <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('nameAndEmail')}</th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('roleLabel')}</th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('additionalInfo')}</th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('statusLabel')}</th>
                      <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('actionCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsersList.filter(u => verificationFilter === 'ALL' ? true : (PARTICIPANT_ROLES.includes(verificationFilter) ? PARTICIPANT_ROLES.includes(u.role) : u.role === verificationFilter)).map(user => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-3">
                          <p className="text-xs font-bold text-slate-800 dark:text-gray-200">{user.name}</p>
                          <p className="text-[10px] text-slate-500">{user.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-600 dark:text-gray-300">
                          {user.role === 'EXTERNAL_MENTOR' ? (
                            <div className="flex flex-col gap-0.5">
                              <span><strong>{t('companyLabel')}</strong> {user.companyName || user.company || '-'}</span>
                              <span><strong>{t('positionLabel')}</strong> {user.jobTitle || user.jabatan || '-'}</span>
                              <span><strong>{t('employeeIdLabel')}</strong> {user.employeeId || '-'}</span>
                              <span><strong>{t('corpEmailLabel')}</strong> {user.companyEmail || '-'}</span>
                            </div>
                          ) : (
                            <span>{user.school || '-'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold rounded-md">
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                if (verifyUser) {
                                  const res = await verifyUser(user.id, 'ACTIVE');
                                  if (res.success) reloadAll();
                                  else alert(res.error);
                                }
                              }}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={async () => {
                                if (verifyUser) {
                                  const res = await verifyUser(user.id, 'REJECTED');
                                  if (res.success) reloadAll();
                                  else alert(res.error);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-300 uppercase block font-semibold">{t('totalStudents')}</span>
                  <span className="text-lg font-black text-slate-800 dark:text-gray-200">{overallMetrics?.totalStudents ?? 0} orang</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Calendar size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-300 uppercase block font-semibold">{t('activeToday')}</span>
                  <span className="text-lg font-black text-slate-800 dark:text-gray-200">{overallMetrics?.monitoringToday ?? 0} keg.</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><FileSpreadsheet size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-300 uppercase block font-semibold">{t('needReview')}</span>
                  <span className="text-lg font-black text-slate-800 dark:text-gray-200">{overallMetrics?.pendingReview ?? 0} log</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Award size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-300 uppercase block font-semibold">{t('schoolAvgScore')}</span>
                  <span className="text-lg font-black text-slate-800 dark:text-gray-200">{overallMetrics?.averageGrade ?? 0}/100</span>
                </div>
              </div>
            </div>

            <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-800/50">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">{t('journalStatusAll')}</h3>
              {overallMetrics ? (
                <div className="flex flex-col gap-3.5">
                  {Object.entries(overallMetrics.columnCounts).map(([col, val]: any) => {
                    const total = Object.values(overallMetrics.columnCounts).reduce((a: any, b: any) => a + b, 0) as number;
                    const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                    const label = col === 'rencana' ? 'Rencana' : col === 'progres' ? 'Progres' : col === 'review' ? 'Review' : 'Selesai';
                    const color = col === 'rencana' ? 'bg-blue-400' : col === 'progres' ? 'bg-yellow-400' : col === 'review' ? 'bg-purple-400' : 'bg-green-500';
                    return (
                      <div key={col} className="flex items-center gap-3 text-xs">
                        <span className="w-16 text-slate-500 dark:text-gray-300 font-semibold">{label}</span>
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                          <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full transition-all duration-500`} />
                        </div>
                        <span className="w-16 text-right font-bold text-slate-800 dark:text-gray-200">{val} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-gray-2000 italic">{t('loadingChart')}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kelas' && (
          <div className="flex flex-col gap-6">
            {/* Add Class Form */}
            <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder={t('addClassPlaceholder')}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm flex-1 text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] md:min-h-0 md:py-2 md:text-xs"
              />
              <button 
                type="submit"
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm md:text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer shadow-sm min-h-[48px] md:min-h-0 w-full sm:w-auto"
              >
                <Plus size={14} />
                Tambah Kelas
              </button>
            </form>

            {/* List */}
            <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold">
                    <th className="py-2.5 px-4">{t('classNameCol')}</th>
                    <th className="py-2.5 px-4 text-right">{t('studentActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {classesList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#2D435E] transition">
                      <td className="py-3 px-4 font-semibold">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary min-h-[44px] py-2"
                          />
                        ) : (
                          c.name
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === c.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdate('class', c.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg min-h-[36px]"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-lg min-h-[36px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end text-slate-500 dark:text-gray-300">
                            <button
                              onClick={() => { setEditingId(c.id); setEditText(c.name); }}
                              className="p-2.5 hover:text-primary hover:bg-primary/10 rounded transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Plus size={14} className="rotate-45" /> {/* Use custom rotation for edit icon mock */}
                            </button>
                            <button
                              onClick={() => handleDelete('class', c.id)}
                              className="p-2.5 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'perusahaan' && (
          <div className="flex flex-col gap-6">
            {/* Add Company Form */}
            <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder={t('addCompanyPlaceholder')}
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] md:min-h-0 md:py-2 md:text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (Cth: -6.1754)"
                  value={newCompanyLat}
                  onChange={(e) => setNewCompanyLat(e.target.value)}
                  className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] md:min-h-0 md:py-2 md:text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (Cth: 106.8272)"
                  value={newCompanyLng}
                  onChange={(e) => setNewCompanyLng(e.target.value)}
                  className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] md:min-h-0 md:py-2 md:text-xs"
                />
              </div>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm md:text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer shadow-sm min-h-[48px] md:min-h-0 w-full sm:w-auto"
              >
                <Plus size={14} />
                Tambah Perusahaan
              </button>
            </form>

            {/* List */}
            <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold">
                    <th className="py-2.5 px-4">{t('companyNameCol')}</th>
                    <th className="py-2.5 px-4">Koordinat (Lat, Lng)</th>
                    <th className="py-2.5 px-4 text-right">{t('studentActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {companiesList.map((co) => (
                    <tr key={co.id} className="hover:bg-slate-50 dark:hover:bg-[#2D435E] transition">
                      <td className="py-3 px-4 font-semibold">
                        {editingId === co.id ? (
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 w-full text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary min-h-[44px] py-2"
                          />
                        ) : (
                          co.name
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-gray-400">
                        {editingId === co.id ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="any"
                              placeholder="Lat"
                              value={editLat}
                              onChange={(e) => setEditLat(e.target.value)}
                              className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-2 w-24 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary min-h-[44px] py-2"
                            />
                            <input
                              type="number"
                              step="any"
                              placeholder="Lng"
                              value={editLng}
                              onChange={(e) => setEditLng(e.target.value)}
                              className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-2 w-24 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary min-h-[44px] py-2"
                            />
                          </div>
                        ) : (
                          <span className="text-xs">
                            {co.latitude && co.longitude ? `${co.latitude}, ${co.longitude}` : '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === co.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdate('company', co.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg min-h-[36px]"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-lg min-h-[36px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end text-slate-500 dark:text-gray-300">
                            <button
                              onClick={() => { 
                                setEditingId(co.id); 
                                setEditText(co.name); 
                                setEditLat(co.latitude?.toString() || '');
                                setEditLng(co.longitude?.toString() || '');
                              }}
                              className="p-2.5 hover:text-primary hover:bg-primary/10 rounded transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete('company', co.id)}
                              className="p-2.5 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col gap-6 text-xs">
            <h3 className="text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider mb-2">{t('assignmentsTitle')}</h3>
            
            <div className="flex flex-col gap-6">
              {/* Guru Section */}
              <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-800/40">
                <h4 className="font-bold text-primary text-xs uppercase mb-3 flex items-center gap-1.5">
                  Pembimbing Internal (Guru ↔ Kelas)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => u.role === 'INTERNAL_MENTOR').length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic py-2">{t('noInternalAdvisors')}</p>
                  ) : allUsersList.filter(u => u.role === 'INTERNAL_MENTOR').map((guru: any) => {
                    const currentClassIds = guru.classes?.map((c: any) => c.id) || [];
                    return (
                      <div key={guru.id} className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="flex-1 w-full md:w-auto">
                          <div className="flex flex-col sm:flex-row gap-3 mb-2">
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('fullNameLabel')}</label>
                              <input
                                type="text"
                                defaultValue={guru.name}
                                onBlur={(e) => handleUserProfileUpdate(guru.id, { name: e.target.value })}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">NIP</label>
                              <input
                                type="text"
                                defaultValue={guru.nip || ''}
                                placeholder={t('notFilled')}
                                onBlur={(e) => handleUserProfileUpdate(guru.id, { nip: e.target.value })}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mb-2">{t('usernameLabel')} {guru.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:max-w-[60%]">
                          {classesList.map(c => {
                            const isAssigned = currentClassIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => handleGuruClassToggle(guru.id, currentClassIds, c.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 md:px-2.5 md:py-1 rounded-xl md:rounded-lg transition cursor-pointer font-semibold min-h-[44px] md:min-h-0 text-xs md:text-[11px] ${
                                  isAssigned 
                                    ? 'bg-primary/10 border border-blue-200 text-primary' 
                                    : 'bg-white dark:bg-[#243447] border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-300'
                                }`}
                              >
                                {isAssigned ? <CheckSquare size={12} /> : <Square size={12} />}
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mentor Section */}
              <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-800/40">
                <h4 className="font-bold text-emerald-600 text-xs uppercase mb-3 flex items-center gap-1.5">
                  Pembimbing Eksternal (Mentor ↔ Perusahaan)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => u.role === 'EXTERNAL_MENTOR').length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic py-2">{t('noExternalAdvisors')}</p>
                  ) : allUsersList.filter(u => u.role === 'EXTERNAL_MENTOR').map((mentor: any) => {
                    const currentCompIds = mentor.companies?.map((c: any) => c.id) || [];
                    return (
                      <div key={mentor.id} className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="flex-1 w-full md:w-auto">
                          <div className="flex flex-col gap-2 mb-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('fullNameLabel')}</label>
                                <input
                                  type="text"
                                  defaultValue={mentor.name}
                                  onBlur={(e) => handleUserProfileUpdate(mentor.id, { name: e.target.value })}
                                  className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                                />
                              </div>
                              <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">ID Karyawan</label>
                                <input
                                  type="text"
                                  defaultValue={mentor.employeeId || ''}
                                  placeholder={t('notFilled')}
                                  onBlur={(e) => handleUserProfileUpdate(mentor.id, { employeeId: e.target.value })}
                                  className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Jabatan</label>
                                <input
                                  type="text"
                                  defaultValue={mentor.jabatan || ''}
                                  placeholder={t('notFilled')}
                                  onBlur={(e) => handleUserProfileUpdate(mentor.id, { jabatan: e.target.value })}
                                  className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mb-2">{t('usernameLabel')} {mentor.username}</p>
                        </div>
                        <div className="flex flex-col md:flex-row flex-wrap gap-2 md:max-w-[60%]">
                          {companiesList.map(co => {
                            const isAssigned = currentCompIds.includes(co.id);
                            return (
                              <button
                                key={co.id}
                                onClick={() => handleMentorCompanyToggle(mentor.id, currentCompIds, co.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 md:px-2.5 md:py-1 rounded-xl md:rounded-lg transition cursor-pointer font-semibold min-h-[44px] md:min-h-0 text-xs md:text-[11px] ${
                                  isAssigned 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' 
                                    : 'bg-white dark:bg-[#243447] border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-300'
                                }`}
                              >
                                {isAssigned ? <CheckSquare size={12} /> : <Square size={12} />}
                                {co.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Section */}
              <div className="border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-800/40">
                <h4 className="font-bold text-purple-600 text-xs uppercase mb-3 flex items-center gap-1.5">
                  Siswa (Siswa ↔ Kelas & Perusahaan)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => PARTICIPANT_ROLES.includes(u.role)).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic py-2">{t('noStudentsRegistered')}</p>
                  ) : allUsersList.filter(u => PARTICIPANT_ROLES.includes(u.role)).map((siswa: any) => {
                    return (
                      <div key={siswa.id} className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 p-3 rounded-lg flex flex-col gap-3">
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                          <div className="flex-1 flex flex-col sm:flex-row gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('fullNameLabel')}</label>
                              <input
                                type="text"
                                defaultValue={siswa.name}
                                onBlur={(e) => handleUserProfileUpdate(siswa.id, { name: e.target.value })}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl md:rounded-lg px-3 py-2 md:p-1.5 text-sm md:text-xs text-slate-800 dark:text-gray-200 focus:outline-none min-h-[48px] md:min-h-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('nisnLabel')}</label>
                              <input
                                type="text"
                                defaultValue={siswa.nisn || ''}
                                placeholder={t('notFilled')}
                                onBlur={(e) => handleUserProfileUpdate(siswa.id, { nisn: e.target.value })}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl md:rounded-lg px-3 py-2 md:p-1.5 text-sm md:text-xs text-slate-800 dark:text-gray-200 focus:outline-none min-h-[48px] md:min-h-0"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="flex flex-col gap-1 min-w-[120px] flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('studentClass')}</label>
                              <select
                                value={siswa.classId || ''}
                                onChange={(e) => handleSiswaClassChange(siswa.id, e.target.value)}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl md:rounded-lg px-3 py-2 md:p-1.5 text-sm md:text-xs focus:outline-none min-h-[48px] md:min-h-0 w-full"
                              >
                                <option value="">{t('noClassAssigned')}</option>
                                {classesList.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1 min-w-[150px] flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{t('company')}</label>
                              <select
                                value={siswa.companyId || ''}
                                onChange={(e) => handleSiswaCompanyChange(siswa.id, e.target.value)}
                                className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl md:rounded-lg px-3 py-2 md:p-1.5 text-sm md:text-xs focus:outline-none min-h-[48px] md:min-h-0 w-full"
                              >
                                <option value="">{t('noCompanyAssigned')}</option>
                                {companiesList.map(co => (
                                  <option key={co.id} value={co.id}>{co.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
