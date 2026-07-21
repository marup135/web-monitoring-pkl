'use client';

import React from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard } from '../types/pkl';
import { Printer, Calendar, Award, Clock, Eye, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PARTICIPANT_ROLES } from '../lib/constants';

interface LogbookTableProps {
  onOpenCard?: (card: PKLCard) => void;
  onEditCard?: (card: PKLCard) => void;
}

export const LogbookTable: React.FC<LogbookTableProps> = ({ onOpenCard, onEditCard }) => {
  const { t } = useLanguage();
  const { state, currentUser, deleteCard } = usePKL();

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800/50';
      case 'review':
        return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-800/50';
      case 'progres':
        return 'text-blue-700 dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/50';
      default:
        return 'text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selesai': return t('statusDone');
      case 'review': return t('statusReview');
      case 'progres': return t('statusProgress');
      default: return t('statusPlan');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-gray-200 font-sans">
      
      {/* Table Action Header (non-printable) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-primary" />
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{t('printTitle')}</h3>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 py-3 md:py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm md:text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[48px] md:min-h-0"
        >
          <Printer size={14} />
          <span>{t('printBtn')}</span>
        </button>
      </div>

      {/* Main Printable Logbook Container */}
      <div className="bg-white dark:bg-[#243447] rounded-2xl p-5 md:p-8 border border-[#E2E8F0] dark:border-gray-700 shadow-sm relative overflow-hidden print:overflow-visible print:bg-white dark:bg-[#243447] print:text-black print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        
        {/* Printable Cover Page */}
        <div className="hidden print:flex flex-col items-center justify-center min-h-[26cm] w-full" style={{ pageBreakAfter: 'always' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nebo.png" alt="Logo" className="w-48 h-48 object-contain mb-8" />
          <div className="flex flex-col items-center mb-12">
            <h1 className="text-2xl font-black uppercase text-black text-center tracking-wide leading-tight">{t("reportTitle")}</h1>
            <h1 className="text-2xl font-black uppercase text-black text-center tracking-wide leading-tight">{t("reportSubtitle")}</h1>
          </div>
          
          <table className="text-base font-bold text-black border-none text-left w-auto mx-auto">
            <tbody>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("studentName")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{state.studentName || '-'}</td></tr>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("nisn")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{state.nisn || '-'}</td></tr>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("schoolOrigin")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{(currentUser as any)?.school || '-'}</td></tr>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("internCompany")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{state.companyName || '-'}</td></tr>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("externalAdvisor")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{state.mentorName || '-'}</td></tr>
              <tr><td className="py-2.5 pr-12 whitespace-nowrap">{t("internalAdvisor")}</td><td className="py-2.5 px-3">:</td><td className="py-2.5 whitespace-nowrap">{state.advisorName || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Printable Header Info */}
        <div className="hidden print:block mb-6 border-b-[3px] border-black pb-4 mt-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide">
              {t('logbookTitle')}
            </h2>
            <p className="text-sm text-black/80 mt-1">
              {t('logbookSubtitle')}
            </p>
          </div>
        </div>

        {/* Table representation (Desktop) */}
        <div className="hidden md:block print:block overflow-x-auto print:overflow-visible w-full">
          <table className="w-full text-left border-collapse text-xs border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-hidden print:overflow-visible shadow-sm print:border-black print:rounded-none">
            <thead className="print:table-header-group">
              <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold uppercase tracking-wider bg-[#F8FAFC] dark:bg-gray-900 print:border-black print:text-black print:bg-gray-100">
                <th className="py-3 px-2 w-10 text-center print:border print:border-black print:py-3 print:px-2">{t("no")}</th>
                <th className="py-3 px-3 w-28 print:border print:border-black print:py-3 print:px-2">{t("date")}</th>
                <th className="py-3 px-3 w-24 print:border print:border-black print:py-3 print:px-2">{t("category")}</th>
                <th className="py-3 px-4 print:border print:border-black print:py-3 print:px-2">{t("details")}</th>
                <th className="py-3 px-3 w-20 text-center hidden print:table-cell print:border print:border-black print:py-3 print:px-2">{t("start")} / {t("end")}</th>
                <th className="py-3 px-3 w-24 text-center print:border print:border-black print:py-3 print:px-2">{t("status")}</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">{t("internalEvaluation")}</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">{t("externalEvaluation")}</th>
                <th className="py-3 px-4 w-48 print:hidden">{t('eval')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] print:divide-black text-slate-700 print:text-black">
              {state.cards.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-gray-2000 italic print:border print:border-black">
                    {t('emptyLogbook')}
                  </td>
                </tr>
              ) : (
                state.cards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150 print:hover:bg-transparent">
                    <td className="py-4 px-2 text-center font-medium print:border print:border-black print:py-2 align-top">{index + 1}</td>
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-medium flex items-center gap-1.5 whitespace-nowrap print:whitespace-normal">
                          <Calendar size={12} className="text-gray-400 print:hidden" />
                          {new Date(card.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        {(card.startTime || card.endTime) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold print:hidden">
                            <Clock size={11} className="text-primary" />
                            <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <span className="px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 print:border-none print:bg-transparent text-[11px] text-slate-700 dark:text-gray-300 print:px-0 print:py-0 print:font-medium">
                        {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 leading-relaxed font-medium print:border print:border-black print:py-2 align-top">
                      <div className="font-bold text-slate-800 dark:text-gray-200 print:text-black mb-1">{card.title}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-gray-300 print:text-black line-clamp-2 print:line-clamp-none whitespace-pre-wrap">
                        {card.description}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center text-slate-800 dark:text-gray-200 print:text-black font-semibold hidden print:table-cell whitespace-nowrap print:border print:border-black print:py-2 align-top">
                      {card.startTime || '-'} - {card.endTime || '-'}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap print:border print:border-black print:py-2 align-top">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(card.columnId)} print:border-none print:text-black print:bg-transparent print:px-0 print:py-0 print:text-xs`}>
                        {getStatusText(card.columnId)}
                      </span>
                    </td>
                    
                    {/* Pembimbing Internal (Sekolah) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreAdvisor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">{t('averageScore')}: {card.scoreAdvisor}/100</div>
                          {card.feedbackAdvisor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackAdvisor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Pembimbing Eksternal (Perusahaan) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreMentor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">{t('averageScore')}: {card.scoreMentor}/100</div>
                          {card.feedbackMentor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackMentor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Desktop/Screen Evaluation Combined */}
                    <td className="py-4 px-4 print:hidden">
                      <div className="flex flex-col gap-1.5 text-[10px]">
                        {card.scoreMentor !== undefined ? (
                          <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] dark:border-gray-700 pb-1 last:border-0 last:pb-0">
                            <div className="flex items-center gap-1 text-purple-600 font-bold text-[10px]">
                              <Award size={10} />
                              {t('mentor')}: {card.scoreMentor}/100 (D:{card.scoreMentorDiscipline} K:{card.scoreMentorSkill} S:{card.scoreMentorAttitude})
                            </div>
                            {card.feedbackMentor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug">
                                &ldquo;{card.feedbackMentor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] border-b border-[#E2E8F0] dark:border-gray-700 pb-1">{t('notEvaluatedMentor')}</span>
                        )}

                        {card.scoreAdvisor !== undefined ? (
                          <div className="flex flex-col gap-0.5 pt-0.5">
                            <div className="flex items-center gap-1 text-yellow-600 font-bold text-[10px]">
                              <Award size={10} />
                              {t('teacher')}: {card.scoreAdvisor}/100 (D:{card.scoreAdvisorDiscipline} L:{card.scoreAdvisorReport} K:{card.scoreAdvisorCommunication})
                            </div>
                            {card.feedbackAdvisor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug">
                                &ldquo;{card.feedbackAdvisor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] pt-0.5">{t('notEvaluatedAdvisor')}</span>
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
        <div className="md:hidden flex flex-col gap-8 mt-4 print:hidden relative pl-5 border-l border-slate-200 dark:border-gray-700 ml-3">
          {state.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl text-center text-slate-400 -ml-4">
              <span className="italic text-sm">{t('emptyLogbook')}</span>
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
              const isSiswa = currentUser?.role && PARTICIPANT_ROLES.includes(currentUser.role);

              return (
                <div key={card.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[25.5px] border-[1.5px] border-white dark:border-gray-900 top-7 shadow-sm z-10" />
                  
                  <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow transition duration-200 flex flex-col gap-4">
                  {/* Header: Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                      {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(card.columnId)}`}>
                      {getStatusText(card.columnId)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-1 leading-snug">{card.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-300 leading-relaxed line-clamp-2">{card.description}</p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-slate-600 dark:text-gray-300 border-t border-slate-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    {(card.startTime || card.endTime) && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-primary" />
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
                            <span>{t('mentor')}: {card.scoreMentor}/100</span>
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
                            <span>{t('teacher')}: {card.scoreAdvisor}/100</span>
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
                      <span>{t("detail")}</span>
                    </button>

                    {isSiswa && (
                      <>
                        <button
                          onClick={() => onEditCard?.(card)}
                          className="flex-1 flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-500/20 bg-primary/10/50 dark:bg-primary/100/10 hover:bg-primary/10 dark:hover:bg-primary/100/20 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-xs min-h-[48px] transition cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>{t("edit")}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("deleteConfirm"))) {
                              deleteCard(card.id);
                            }
                          }}
                          className="flex items-center justify-center w-[48px] border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl font-bold text-xs min-h-[48px] transition cursor-pointer shrink-0"
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
        <div className="hidden print:grid grid-cols-3 gap-8 mt-24 text-[11px] text-black" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex flex-col items-center text-center">
            <span>{t("signatureAcknowledged")}</span>
            <span className="font-bold mt-1">Pembimbing Eksternal (Perusahaan)</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.mentorName || '____________________'}</span>
            <span className="mt-1">{t("positionSignature")} ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>{t("signatureAcknowledged")}</span>
            <span className="font-bold mt-1">Pembimbing Internal (Sekolah)</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.advisorName || '____________________'}</span>
            <span className="mt-1">{t("nipSignature")} ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>Bojong, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-bold mt-1">{t("studentSignature")}</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.studentName || '____________________'}</span>
            <span className="mt-1">{state.nisn ? `NIS/NISN: ${state.nisn}` : 'NIS/NISN: ____________________'}</span>
          </div>
        </div>

        {/* Print Footer Elements */}
        <div className="hidden print:block fixed bottom-0 left-0 right-0 text-[10px] text-black pt-2 pb-2 mt-16">
           <div className="border-t-[1.5px] border-black pt-2 flex justify-between items-center">
             <div>
               {t("printedVia")} <strong>NeboTrack</strong> - https://nebotrack.vercel.app
             </div>
             <div>
               {t("printDate")} {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Halaman <span className="pageNumber"></span> {t("of")} <span className="totalPages"></span>
             </div>
           </div>
        </div>
      </div>

      {/* Tailwind print helper styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
          }
          /* Hide non-printable elements */
          nav, header, footer:not(.print\\:block), button, .print\\:hidden, [role="button"] {
            display: none !important;
          }
          /* Remove layout containers shadows */
          main, div, table, tr, td {
            box-shadow: none !important;
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
          /* Ensure table headers repeat on multi-page tables */
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          /* Format signature block nicely */
          .print\\:grid {
            display: grid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Fix fixed positioning for footer */
          .fixed.bottom-0 {
            position: fixed !important;
            bottom: 0 !important;
          }
          
          /* Page margins and layout */
          @page {
            size: A4 portrait;
            margin: 2cm;
          }
        }
      `}</style>
</div>
  );
};
