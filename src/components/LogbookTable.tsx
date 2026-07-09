'use client';

import React from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard } from '../types/pkl';
import { Printer, Calendar, Award, Clock, Eye, Edit2, Trash2 } from 'lucide-react';

interface LogbookTableProps {
  onOpenCard?: (card: PKLCard) => void;
  onEditCard?: (card: PKLCard) => void;
}

export const LogbookTable: React.FC<LogbookTableProps> = ({ onOpenCard, onEditCard }) => {
  const { state, currentUser, deleteCard } = usePKL();

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'review':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'progres':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700';
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
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200 font-sans">
      
      {/* Table Action Header (non-printable) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-[#2563EB]" />
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Cetak Laporan Logbook Jurnal PKL</h3>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 py-3 md:py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm md:text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[48px] md:min-h-0"
        >
          <Printer size={14} />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Main Printable Logbook Container */}
      <div className="bg-white dark:bg-[#243447] rounded-2xl p-5 md:p-8 border border-[#E2E8F0] dark:border-gray-700 shadow-sm relative overflow-hidden print:bg-white dark:bg-[#243447] print:text-black print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Printable Header Info */}
        <div className="flex flex-col gap-6 mb-8 border-b border-[#E2E8F0] dark:border-gray-700 pb-6 print:border-black/20">
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-[#0F172A] dark:text-white uppercase tracking-wide print:text-black print:text-lg">
              Jurnal Kegiatan Harian (Logbook) PKL
            </h2>
            <p className="text-xs text-[#64748B] dark:text-gray-300 mt-1 print:text-black/60">
              Program Praktek Kerja Lapangan & Monitoring Akademik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs">
            <div className="flex flex-col gap-1.5 text-slate-700 print:text-black">
              <div className="flex">
                <span className="w-28 sm:w-36 text-[#64748B] dark:text-gray-300 shrink-0 print:text-black/60">Nama Siswa</span>
                <span className="font-semibold">: {state.studentName}</span>
              </div>
              {state.nisn && (
                <div className="flex">
                  <span className="w-28 sm:w-36 text-[#64748B] dark:text-gray-300 shrink-0 print:text-black/60">NIS / NISN</span>
                  <span className="font-semibold">: {state.nisn}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-28 sm:w-36 text-[#64748B] dark:text-gray-300 shrink-0 print:text-black/60">Tempat PKL</span>
                <span className="font-semibold">: {state.companyName}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-slate-700 print:text-black">
              <div className="flex">
                <span className="w-28 sm:w-36 text-[#64748B] dark:text-gray-300 shrink-0 print:text-black/60">Pembimbing Lapangan</span>
                <span className="font-semibold">: {state.mentorName}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-36 text-[#64748B] dark:text-gray-300 shrink-0 print:text-black/60">Pembimbing Internal</span>
                <span className="font-semibold">: {state.advisorName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table representation (Desktop) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold uppercase tracking-wider bg-[#F8FAFC] dark:bg-gray-900 print:border-black/30 print:text-black print:bg-transparent">
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
            <tbody className="divide-y divide-[#E2E8F0] print:divide-black/10 text-slate-700 print:text-black">
              {state.cards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-gray-2000 italic">
                    Belum ada catatan logbook harian.
                  </td>
                </tr>
              ) : (
                state.cards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150 print:hover:bg-transparent">
                    <td className="py-4 px-2 text-center font-medium">{index + 1}</td>
                    <td className="py-4 px-3 font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-gray-400 print:hidden" />
                      {new Date(card.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 print:border-black/20 print:bg-transparent text-[11px] text-slate-700">
                        {card.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 leading-relaxed font-medium">
                      <div className="font-bold text-slate-800 dark:text-gray-200 print:text-black mb-0.5">{card.title}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-gray-300 print:text-black/75 line-clamp-2 print:line-clamp-none">
                        {card.description}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center text-slate-800 dark:text-gray-200 print:text-black font-semibold">
                      {card.startTime || '-'}
                    </td>
                    <td className="py-4 px-3 text-center text-slate-800 dark:text-gray-200 print:text-black font-semibold">
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
                          <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] dark:border-gray-700 pb-1 last:border-0 last:pb-0 print:border-black/10">
                            <div className="flex items-center gap-1 text-purple-600 font-bold text-[10px] print:text-black">
                              <Award size={10} className="print:hidden" />
                              Mentor: {card.scoreMentor}/100 (D:{card.scoreMentorDiscipline} K:{card.scoreMentorSkill} S:{card.scoreMentorAttitude})
                            </div>
                            {card.feedbackMentor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug print:text-black/75">
                                &ldquo;{card.feedbackMentor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] border-b border-[#E2E8F0] dark:border-gray-700 pb-1">Belum dinilai Mentor</span>
                        )}

                        {/* Guru Evaluation */}
                        {card.scoreAdvisor !== undefined ? (
                          <div className="flex flex-col gap-0.5 pt-0.5">
                            <div className="flex items-center gap-1 text-yellow-600 font-bold text-[10px] print:text-black">
                              <Award size={10} className="print:hidden" />
                              Guru: {card.scoreAdvisor}/100 (D:{card.scoreAdvisorDiscipline} L:{card.scoreAdvisorReport} K:{card.scoreAdvisorCommunication})
                            </div>
                            {card.feedbackAdvisor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug print:text-black/75">
                                &ldquo;{card.feedbackAdvisor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] pt-0.5">Belum dinilai Guru</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Timeline/Card List (Mobile-only) */}
        <div className="md:hidden flex flex-col gap-6 mt-4 print:hidden relative pl-4 border-l-2 border-slate-200 dark:border-gray-700 ml-4">
          {state.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl text-center text-slate-400 -ml-4">
              <span className="italic text-sm">Belum ada catatan logbook harian.</span>
            </div>
          ) : (
            state.cards.map((card) => {
              const formattedDate = new Date(card.createdAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const hasMentorScore = card.scoreMentor !== undefined && card.scoreMentor !== null;
              const hasAdvisorScore = card.scoreAdvisor !== undefined && card.scoreAdvisor !== null;
              const isSiswa = currentUser?.role === 'siswa';

              return (
                <div key={card.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute w-3.5 h-3.5 bg-[#2563EB] rounded-full -left-[23px] border-2 border-white top-6 shadow-sm z-10" />
                  
                  <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow transition duration-200 flex flex-col gap-4">
                  {/* Header: Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {card.category}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(card.columnId)}`}>
                      {getStatusText(card.columnId)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-1 leading-snug">{card.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-300 leading-relaxed line-clamp-2">{card.description}</p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-gray-300 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    {(card.startTime || card.endTime) && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#2563EB]" />
                        <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                      </div>
                    )}
                  </div>

                  {/* Evaluations info */}
                  {(hasMentorScore || hasAdvisorScore) && (
                    <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2.5 text-[10px] text-slate-700">
                      {hasMentorScore && (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-purple-700 font-bold">
                            <Award size={12} />
                            <span>Mentor: {card.scoreMentor}/100</span>
                          </div>
                          {card.feedbackMentor && (
                            <p className="text-slate-500 dark:text-gray-300 italic pl-4">&ldquo;{card.feedbackMentor}&rdquo;</p>
                          )}
                        </div>
                      )}
                      {hasAdvisorScore && (
                        <div className={`flex flex-col gap-0.5 ${hasMentorScore ? 'border-t border-slate-200 dark:border-gray-700/50 pt-2' : ''}`}>
                          <div className="flex items-center gap-1 text-yellow-700 font-bold">
                            <Award size={12} />
                            <span>Guru: {card.scoreAdvisor}/100</span>
                          </div>
                          {card.feedbackAdvisor && (
                            <p className="text-slate-500 dark:text-gray-300 italic pl-4">&ldquo;{card.feedbackAdvisor}&rdquo;</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 border-t border-slate-100 pt-4 mt-1">
                    <button
                      onClick={() => onOpenCard?.(card)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] text-slate-700 rounded-xl font-bold text-xs min-h-[48px] transition cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>Detail</span>
                    </button>

                    {isSiswa && (
                      <>
                        <button
                          onClick={() => onEditCard?.(card)}
                          className="flex-1 flex items-center justify-center gap-1.5 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-xs min-h-[48px] transition cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
                              deleteCard(card.id);
                            }
                          }}
                          className="flex items-center justify-center border border-red-100 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl font-bold text-xs min-h-[48px] px-3.5 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                </div>
              );
            })
          )}
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
            <span>Bojong, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-semibold mt-1">Siswa PKL</span>
            <div className="h-16" />
            <span className="font-bold underline">{state.studentName}</span>
            <span className="text-[10px] text-black/60">{state.nisn ? `NIS/NISN: ${state.nisn}` : 'NIS / NISN'}</span>
          </div>
        </div>

      </div>

      {/* Tailwind print helper styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          /* Hide non-printable elements */
          nav, header, footer, button, .print\:hidden, [role="button"] {
            display: none !important;
          }
          /* Remove layout containers shadows */
          main, div, table, tr, td {
            box-shadow: none !important;
            border-color: #94a3b8 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          /* Prevent row splitting across pages */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Format signature block nicely */
          .print\:grid {
            display: grid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Page margins and layout */
          @page {
            size: A4 portrait;
            margin: 1.5cm 1cm 1.5cm 1cm;
          }
        }
      `}</style>

    </div>
  );
};
