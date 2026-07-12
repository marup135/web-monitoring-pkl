'use client';

import React, { useState, useEffect } from 'react';
import { getPendingInstitutionsAction, approveInstitutionAction, rejectInstitutionAction } from '../app/actions/institution';
import { CheckCircle, XCircle, Building2 } from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const [pendingInstitutions, setPendingInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    const res = await getPendingInstitutionsAction();
    if (res.success && res.data) {
      setPendingInstitutions(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Setujui institusi ini?')) return;
    const res = await approveInstitutionAction(id);
    if (res.success) {
      alert('Institusi disetujui.');
      fetchPending();
    } else {
      alert(res.error || 'Gagal');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Tolak institusi ini?')) return;
    const res = await rejectInstitutionAction(id);
    if (res.success) {
      alert('Institusi ditolak.');
      fetchPending();
    } else {
      alert(res.error || 'Gagal');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-[#E2E8F0] dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Building2 className="text-primary" /> Approval Institusi Baru
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : pendingInstitutions.length === 0 ? (
        <p className="text-gray-500">Tidak ada pendaftaran institusi baru yang pending.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-3 px-4 font-semibold text-sm">Nama Institusi</th>
                <th className="py-3 px-4 font-semibold text-sm">Tipe</th>
                <th className="py-3 px-4 font-semibold text-sm">Admin Email</th>
                <th className="py-3 px-4 font-semibold text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingInstitutions.map(inst => (
                <tr key={inst.id} className="border-b dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <p className="font-bold">{inst.name}</p>
                    <p className="text-xs text-gray-500">Kode: {inst.code}</p>
                  </td>
                  <td className="py-3 px-4">{inst.type}</td>
                  <td className="py-3 px-4">
                    {inst.users && inst.users.length > 0 ? inst.users[0].email : '-'}
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button onClick={() => handleApprove(inst.id)} className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleReject(inst.id)} className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200">
                      <XCircle size={16} /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
