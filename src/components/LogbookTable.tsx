'use client';

import React from 'react';
import { usePKL } from '../context/PKLContext';
import { Printer, Calendar, Award } from 'lucide-react';

export const LogbookTable: React.FC = () => {
  const { state } = usePKL();

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'review':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'progres':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selesai': return 'Disetujui (Selesai)';
      case 'review': return 'Menunggu Review';
      case 'progres': return 'Sedang Dikerjakan';
      default: return 'Rencana';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Table Action Header (non-printable) */}
      <div className="flex justify-between items-center bg-white/3 border border-white/5 rounded-2xl p-4 glass print:hidden">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-indigo-400" />
          <h3 className="font-semibold text-gray-200 text-sm">Cetak Laporan Logbook Jurnal PKL</h3>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
        >
          <Printer size={14} />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Main Printable Logbook Container */}
      <div className="glass rounded-2xl p-8 border border-white/5 shadow-xl bg-slate-950/40 relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Printable Header Info */}
        <div className="flex flex-col gap-6 mb-8 border-b border-white/10 pb-6 print:border-black/20">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-100 uppercase tracking-wide print:text-black print:text-lg">
              Jurnal Kegiatan Harian (Logbook) PKL
            </h2>
            <p className="text-xs text-gray-400 mt-1 print:text-black/60">
              Program Praktek Kerja Lapangan & Monitoring Akademik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs">
            <div className="flex flex-col gap-1.5 text-gray-300 print:text-black">
              <div className="flex">
                <span className="w-32 text-gray-500 shrink-0 print:text-black/60">Nama Mahasiswa</span>
                <span className="font-semibold">: {state.studentName}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-500 shrink-0 print:text-black/60">Tempat PKL</span>
                <span className="font-semibold">: {state.companyName}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-gray-300 print:text-black">
              <div className="flex">
                <span className="w-32 text-gray-500 shrink-0 print:text-black/60">Pembimbing Lapangan</span>
                <span className="font-semibold">: {state.mentorName}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-500 shrink-0 print:text-black/60">Dosen Pembimbing</span>
                <span className="font-semibold">: {state.advisorName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase tracking-wider print:border-black/30 print:text-black">
                <th className="py-3 px-2 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-24">Kategori</th>
                <th className="py-3 px-4">Rincian Kegiatan</th>
                <th className="py-3 px-2 w-16 text-center">Mulai</th>
                <th className="py-3 px-2 w-16 text-center">Selesai</th>
                <th className="py-3 px-3 w-28 text-center print:w-24">Status</th>
                <th className="py-3 px-4 w-48 print:w-36">Evaluasi Pembimbing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black/10 text-gray-300 print:text-black">
              {state.cards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                    Belum ada catatan logbook harian.
                  </td>
                </tr>
              ) : (
                state.cards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-white/1 transition duration-150 print:hover:bg-transparent">
                    <td className="py-4 px-2 text-center font-medium">{index + 1}</td>
                    <td className="py-4 px-3 font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-gray-500 print:hidden" />
                      {new Date(card.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-2 py-0.5 rounded border border-white/5 bg-white/2 print:border-black/20 print:bg-transparent text-[11px]">
                        {card.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 leading-relaxed font-medium">
                      <div className="font-bold text-gray-100 print:text-black mb-0.5">{card.title}</div>
                      <div className="text-[11px] text-gray-400 print:text-black/75 line-clamp-2 print:line-clamp-none">
                        {card.description}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center text-gray-200 print:text-black font-semibold">
                      {card.startTime || '-'}
                    </td>
                    <td className="py-4 px-3 text-center text-gray-200 print:text-black font-semibold">
                      {card.endTime || '-'}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(card.columnId)} print:border-black/30 print:text-black print:bg-transparent`}>
                        {getStatusText(card.columnId)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 text-[10px]">
                        {/* Mentor Evaluation */}
                        {card.scoreMentor !== undefined ? (
                          <div className="flex flex-col gap-0.5 border-b border-white/5 pb-1 last:border-0 last:pb-0 print:border-black/10">
                            <div className="flex items-center gap-1 text-purple-400 font-bold text-[10px] print:text-black">
                              <Award size={10} className="print:hidden" />
                              Mentor: {card.scoreMentor}/100 (D:{card.scoreMentorDiscipline} K:{card.scoreMentorSkill} S:{card.scoreMentorAttitude})
                            </div>
                            {card.feedbackMentor && (
                              <div className="text-[9px] text-gray-400 italic leading-snug print:text-black/75">
                                &ldquo;{card.feedbackMentor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-[9px] border-b border-white/5 pb-1">Belum dinilai Mentor</span>
                        )}

                        {/* Guru Evaluation */}
                        {card.scoreAdvisor !== undefined ? (
                          <div className="flex flex-col gap-0.5 pt-0.5">
                            <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] print:text-black">
                              <Award size={10} className="print:hidden" />
                              Guru: {card.scoreAdvisor}/100 (D:{card.scoreAdvisorDiscipline} L:{card.scoreAdvisorReport} K:{card.scoreAdvisorCommunication})
                            </div>
                            {card.feedbackAdvisor && (
                              <div className="text-[9px] text-gray-400 italic leading-snug print:text-black/75">
                                &ldquo;{card.feedbackAdvisor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-[9px] pt-0.5">Belum dinilai Guru</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature Lines */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-16 text-xs text-black">
          <div className="flex flex-col items-center">
            <span>Mengetahui,</span>
            <span className="font-semibold mt-1">Pembimbing Lapangan</span>
            <div className="h-16" />
            <span className="font-bold underline">{state.mentorName}</span>
            <span className="text-[10px] text-black/60">{state.companyName}</span>
          </div>
          <div className="flex flex-col items-center">
            <span>Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-semibold mt-1">Mahasiswa PKL</span>
            <div className="h-16" />
            <span className="font-bold underline">{state.studentName}</span>
            <span className="text-[10px] text-black/60">NIM / NISN</span>
          </div>
        </div>

      </div>

      {/* Tailwind print helper styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide non-printable elements */
          nav, header, footer, button, .print\:hidden, [role="button"] {
            display: none !important;
          }
          /* Ensure columns take full width */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
};
