'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { getDashboardMetricsAction } from '@/app/actions/pkl';
import { 
  Building2, Users, FolderKanban, Plus, Edit2, Trash2, CheckSquare, 
  Square, ShieldAlert, Award, Calendar, FileSpreadsheet, RefreshCw
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    classesList,
    companiesList,
    allUsersList,
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
    loading
  } = usePKL();

  const [activeTab, setActiveTab] = useState<'overview' | 'kelas' | 'perusahaan' | 'users'>('overview');

  // Input states
  const [newClassName, setNewClassName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Overview metrics state
  const [overallMetrics, setOverallMetrics] = useState<any>(null);

  const reloadAll = async () => {
    await fetchAdminData();
    const m = await getDashboardMetricsAction(undefined, undefined);
    setOverallMetrics(m);
  };

  useEffect(() => {
    reloadAll();
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
      alert(res.error || 'Gagal menambahkan kelas.');
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const res = await createCompany(newCompanyName);
    if (res.success) {
      setNewCompanyName('');
    } else {
      alert(res.error || 'Gagal menambahkan perusahaan.');
    }
  };

  const handleUpdate = async (type: 'class' | 'company', id: string) => {
    if (!editText.trim()) return;
    const res = type === 'class' ? await updateClass(id, editText) : await updateCompany(id, editText);
    if (res.success) {
      setEditingId(null);
      setEditText('');
    } else {
      alert(res.error || 'Gagal memperbarui data.');
    }
  };

  const handleDelete = async (type: 'class' | 'company', id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
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
    const res = await assignSiswa(userId, classId || null, companyId, user?.name, user?.nisn);
    if (!res.success) alert(res.error);
  };

  const handleSiswaCompanyChange = async (userId: string, companyId: string) => {
    const user = allUsersList.find((u: any) => u.id === userId);
    const classId = user?.classId || null;
    const res = await assignSiswa(userId, classId, companyId || null, user?.name, user?.nisn);
    if (!res.success) alert(res.error);
  };

  const handleSiswaProfileUpdate = async (userId: string, name: string, nisn: string) => {
    const user = allUsersList.find((u: any) => u.id === userId);
    const classId = user?.classId || null;
    const companyId = user?.companyId || null;
    const res = await assignSiswa(userId, classId, companyId, name, nisn);
    if (!res.success) alert(res.error);
  };

  const handleResetData = async () => {
    if (confirm('PERINGATAN: Ini akan menghapus seluruh data siswa, logbook, dan mereset ke data awal. Lanjutkan?')) {
      await resetState();
      await reloadAll();
      alert('Database berhasil direset.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#0F172A]">
      {/* Header and Sync Actions */}
      <div className="flex justify-between items-center bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            Portal Administrator SMKN 1 Bojong
          </h2>
          <p className="text-[11px] text-[#64748B]">Kelola data master kelas, perusahaan, dan hubungan pembimbing siswa.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={reloadAll}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-slate-600"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        {[
          { key: 'overview', label: 'Ringkasan' },
          { key: 'kelas', label: 'Data Kelas' },
          { key: 'perusahaan', label: 'Data Perusahaan' },
          { key: 'users', label: 'Penugasan (Assignment)' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2 px-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Siswa</span>
                  <span className="text-lg font-black text-slate-800">{overallMetrics?.totalStudents ?? 0} orang</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Calendar size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Aktif Hari Ini</span>
                  <span className="text-lg font-black text-slate-800">{overallMetrics?.monitoringToday ?? 0} keg.</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><FileSpreadsheet size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Menunggu Review</span>
                  <span className="text-lg font-black text-slate-800">{overallMetrics?.pendingReview ?? 0} log</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Award size={20} /></div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rerata Nilai Sekolah</span>
                  <span className="text-lg font-black text-slate-800">{overallMetrics?.averageGrade ?? 0}/100</span>
                </div>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">Status Jurnal Seluruh Siswa</h3>
              {overallMetrics ? (
                <div className="flex flex-col gap-3.5">
                  {Object.entries(overallMetrics.columnCounts).map(([col, val]: any) => {
                    const total = Object.values(overallMetrics.columnCounts).reduce((a: any, b: any) => a + b, 0) as number;
                    const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                    const label = col === 'rencana' ? 'Rencana' : col === 'progres' ? 'Progres' : col === 'review' ? 'Review' : 'Selesai';
                    const color = col === 'rencana' ? 'bg-blue-400' : col === 'progres' ? 'bg-yellow-400' : col === 'review' ? 'bg-purple-400' : 'bg-green-500';
                    return (
                      <div key={col} className="flex items-center gap-3 text-xs">
                        <span className="w-16 text-slate-500 font-semibold">{label}</span>
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                          <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full transition-all duration-500`} />
                        </div>
                        <span className="w-16 text-right font-bold text-slate-800">{val} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Memuat grafik...</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kelas' && (
          <div className="flex flex-col gap-6">
            {/* Add Class Form */}
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Tambah nama kelas baru (Contoh: XII PPLG 3)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs flex-1 text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                Tambah Kelas
              </button>
            </form>

            {/* List */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Nama Kelas</th>
                    <th className="py-2.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {classesList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#0F172A] focus:outline-none"
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
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-lg"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end text-slate-500">
                            <button
                              onClick={() => { setEditingId(c.id); setEditText(c.name); }}
                              className="p-1 hover:text-[#2563EB] hover:bg-blue-50 rounded transition cursor-pointer"
                            >
                              <Plus size={14} className="rotate-45" /> {/* Use custom rotation for edit icon mock */}
                            </button>
                            <button
                              onClick={() => handleDelete('class', c.id)}
                              className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
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
            <form onSubmit={handleAddCompany} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Tambah nama perusahaan baru (Contoh: GoTo)"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs flex-1 text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                Tambah Perusahaan
              </button>
            </form>

            {/* List */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Nama Perusahaan</th>
                    <th className="py-2.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {companiesList.map((co) => (
                    <tr key={co.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold">
                        {editingId === co.id ? (
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#0F172A] focus:outline-none"
                          />
                        ) : (
                          co.name
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === co.id ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdate('company', co.id)}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-lg"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end text-slate-500">
                            <button
                              onClick={() => { setEditingId(co.id); setEditText(co.name); }}
                              className="p-1 hover:text-[#2563EB] hover:bg-blue-50 rounded transition cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete('company', co.id)}
                              className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Penugasan Pembimbing & Siswa</h3>
            
            <div className="flex flex-col gap-6">
              {/* Guru Section */}
              <div className="border border-[#E2E8F0] rounded-xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-[#2563EB] text-xs uppercase mb-3 flex items-center gap-1.5">
                  Pembimbing Internal (Guru ↔ Kelas)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => u.role === 'pembimbing_internal').length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Belum ada Pembimbing Internal terdaftar.</p>
                  ) : allUsersList.filter(u => u.role === 'pembimbing_internal').map((guru: any) => {
                    const currentClassIds = guru.classes?.map((c: any) => c.id) || [];
                    return (
                      <div key={guru.id} className="bg-white border border-[#E2E8F0] p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{guru.name}</p>
                          <p className="text-[10px] text-slate-400">Username: {guru.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {classesList.map(c => {
                            const isAssigned = currentClassIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => handleGuruClassToggle(guru.id, currentClassIds, c.id)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${
                                  isAssigned 
                                    ? 'bg-blue-50 border border-blue-200 text-[#2563EB]' 
                                    : 'bg-white border border-slate-200 text-slate-500'
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
              <div className="border border-[#E2E8F0] rounded-xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-emerald-600 text-xs uppercase mb-3 flex items-center gap-1.5">
                  Pembimbing Eksternal (Mentor ↔ Perusahaan)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => u.role === 'pembimbing_eksternal').length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Belum ada Pembimbing Eksternal terdaftar.</p>
                  ) : allUsersList.filter(u => u.role === 'pembimbing_eksternal').map((mentor: any) => {
                    const currentCompIds = mentor.companies?.map((c: any) => c.id) || [];
                    return (
                      <div key={mentor.id} className="bg-white border border-[#E2E8F0] p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{mentor.name}</p>
                          <p className="text-[10px] text-slate-400">Username: {mentor.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {companiesList.map(co => {
                            const isAssigned = currentCompIds.includes(co.id);
                            return (
                              <button
                                key={co.id}
                                onClick={() => handleMentorCompanyToggle(mentor.id, currentCompIds, co.id)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${
                                  isAssigned 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' 
                                    : 'bg-white border border-slate-200 text-slate-500'
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
              <div className="border border-[#E2E8F0] rounded-xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-purple-600 text-xs uppercase mb-3 flex items-center gap-1.5">
                  Siswa (Siswa ↔ Kelas & Perusahaan)
                </h4>
                <div className="flex flex-col gap-3">
                  {allUsersList.filter(u => u.role === 'siswa').length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Belum ada Siswa terdaftar.</p>
                  ) : allUsersList.filter(u => u.role === 'siswa').map((siswa: any) => {
                    return (
                      <div key={siswa.id} className="bg-white border border-[#E2E8F0] p-3 rounded-lg flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex-1 flex flex-col sm:flex-row gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nama Lengkap</label>
                              <input
                                type="text"
                                defaultValue={siswa.name}
                                onBlur={(e) => handleSiswaProfileUpdate(siswa.id, e.target.value, siswa.nisn || '')}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">NIS / NISN</label>
                              <input
                                type="text"
                                defaultValue={siswa.nisn || ''}
                                placeholder="Belum diisi"
                                onBlur={(e) => handleSiswaProfileUpdate(siswa.id, siswa.name, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Kelas</label>
                              <select
                                value={siswa.classId || ''}
                                onChange={(e) => handleSiswaClassChange(siswa.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                              >
                                <option value="">-- Tanpa Kelas --</option>
                                {classesList.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1 min-w-[150px]">
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Perusahaan</label>
                              <select
                                value={siswa.companyId || ''}
                                onChange={(e) => handleSiswaCompanyChange(siswa.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                              >
                                <option value="">-- Tanpa Perusahaan --</option>
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
