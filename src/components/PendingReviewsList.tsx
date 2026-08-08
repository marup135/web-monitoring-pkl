'use client';

import React, { useState, useEffect } from 'react';
import { getPendingReviewCardsAction, batchApproveCardsAction } from '@/app/actions/pkl';
import { CheckCircle2, Clock, CheckCheck, FileText, User, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PendingReviewsListProps {
  role?: string;
  selectedClassId?: string;
  selectedCompanyId?: string;
  selectedSchool?: string;
  onRefreshMetrics?: () => void;
  onViewAllTasks?: () => void;
}

export const PendingReviewsList: React.FC<PendingReviewsListProps> = ({
  role,
  selectedClassId,
  selectedCompanyId,
  selectedSchool,
  onRefreshMetrics,
  onViewAllTasks
}) => {
  const { t } = useLanguage();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [scoreDiscipline, setScoreDiscipline] = useState<number | ''>('');
  const [scoreSkill, setScoreSkill] = useState<number | ''>('');
  const [scoreAttitude, setScoreAttitude] = useState<number | ''>('');

  const fetchPendingCards = async () => {
    setLoading(true);
    try {
      const data = await getPendingReviewCardsAction(selectedClassId, selectedCompanyId, selectedSchool);
      setCards(data);
    } catch (e) {
      console.error('Error fetching pending cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCards();
  }, [selectedClassId, selectedCompanyId, selectedSchool]);

  const handleApproveOne = async (cardId: string, scoresObj?: any) => {
    setProcessingId(cardId);
    try {
      const res = await batchApproveCardsAction([cardId], scoresObj);
      if (res.success) {
        setCards(prev => prev.filter(c => c.id !== cardId));
        if (onRefreshMetrics) onRefreshMetrics();
      } else {
        alert(res.error || 'Gagal menyetujui');
      }
    } catch (e) {
      console.error('Error approving card:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    if (cards.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menyetujui semua (${cards.length}) tugas/jurnal yang menunggu ini?`)) return;

    setIsBatchProcessing(true);
    try {
      const cardIds = cards.map(c => c.id);
      const res = await batchApproveCardsAction(cardIds);
      if (res.success) {
        setCards([]);
        if (onRefreshMetrics) onRefreshMetrics();
      } else {
        alert(res.error || 'Gagal menyetujui secara masal');
      }
    } catch (e) {
      console.error('Error batch approving:', e);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={16} className="text-amber-500" />
            {t('journalPendingApproval') || 'Jurnal / Tugas Menunggu Persetujuan'}
          </h3>
          
          {cards.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBatchProcessing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <CheckCheck size={15} />
              )}
              {t('approveAll') || 'Setujui Semua'} ({cards.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 py-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-gray-500">
            <CheckCircle2 size={32} className="text-green-500/50 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">{t('noPendingJournals') || 'Tidak ada jurnal yang menantikan persetujuan.'}</p>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mb-4">{t('allJournalsReviewed') || 'Semua laporan kegiatan siswa telah di-review!'}</p>
            {onViewAllTasks && (
              <button
                onClick={onViewAllTasks}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >{t('viewAllTasksBtn') || 'Lihat Semua Tugas'}</button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
            {cards.map(card => (
              <div 
                key={card.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition"
              >
                <div 
                  className="flex items-start gap-2.5 min-w-0 cursor-pointer flex-1"
                  onClick={() => { setPreviewCard(card); setScoreDiscipline(''); setScoreSkill(''); setScoreAttitude(''); }}
                >
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate">{card.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-gray-300">
                        <User size={10} />
                        {card.studentName}
                      </span>
                      <span>•</span>
                      <span>{new Date(card.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewCard(card); setScoreDiscipline(''); setScoreSkill(''); setScoreAttitude(''); }}
                  disabled={processingId === card.id || isBatchProcessing}
                  className="ml-2 flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 transition shrink-0 disabled:opacity-50 cursor-pointer"
                  title="Setujui Jurnal Ini"
                >
                  {processingId === card.id ? (
                    <span className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  {t('approveAndGrade') || 'Setujui & Nilai'}
                </button>
              </div>
            ))}
            
            {onViewAllTasks && cards.length > 0 && (
              <button
                onClick={onViewAllTasks}
                className="w-full mt-2 py-2.5 text-center text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              ><span dangerouslySetInnerHTML={{ __html: t('viewAllTasksLink') || 'Lihat Semua Tugas &amp; Progres Siswa &amp;rarr;' }} /></button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {/* Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-gray-700 bg-white dark:bg-[#1E293B] z-10 relative shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-gray-200">Detail Jurnal / Aktivitas</h3>
              <button 
                onClick={() => setPreviewCard(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row overflow-hidden flex-1">
              {/* Left Side: Content */}
              <div className="p-6 flex-1 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 dark:border-gray-700 bg-white dark:bg-[#1E293B]">
                <h4 className="font-bold text-xl text-slate-800 dark:text-gray-100 mb-4 leading-tight">{previewCard.title}</h4>
                <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-gray-400 mb-6 border-b border-slate-100 dark:border-gray-700 pb-5">
                  <span className="flex items-center gap-1.5 font-medium"><User size={16} /> {previewCard.studentName}</span>
                  <span className="flex items-center gap-1.5 font-medium"><Clock size={16} /> {new Date(previewCard.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="text-sm text-slate-700 dark:text-gray-300">
                  <p className="font-semibold mb-3 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest">Deskripsi Kegiatan</p>
                  {previewCard.description ? (
                    <div className="whitespace-pre-wrap leading-relaxed p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-gray-700 custom-scrollbar">{previewCard.description}</div>
                  ) : (
                    <p className="italic text-slate-400">Tidak ada deskripsi tambahan.</p>
                  )}
                </div>

                {/* Status Nilai Pembimbing Lain */}
                <div className="mt-6 border-t border-slate-100 dark:border-gray-700 pt-5">
                  <p className="font-semibold mb-3 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                    Status Penilaian Pembimbing
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nilai Mentor (Perusahaan) */}
                    <div className="p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Pembimbing Eksternal (Mentor)</span>
                        {previewCard.scoreMentor !== null && previewCard.scoreMentor !== undefined ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {previewCard.scoreMentor}/100
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Belum Menilai</span>
                        )}
                      </div>
                      {previewCard.scoreMentor !== null && previewCard.scoreMentor !== undefined && (
                        <div className="text-[11px] text-slate-600 dark:text-gray-300 space-y-0.5 mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                          <div>Kedisiplinan: <b>{previewCard.scoreMentorDiscipline ?? '-'}</b></div>
                          <div>Keahlian: <b>{previewCard.scoreMentorSkill ?? '-'}</b></div>
                          <div>Sikap & Etika: <b>{previewCard.scoreMentorAttitude ?? '-'}</b></div>
                          {previewCard.feedbackMentor && (
                            <div className="italic text-[10px] text-slate-500 mt-1">&ldquo;{previewCard.feedbackMentor}&rdquo;</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nilai Advisor (Guru Sekolah) */}
                    <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Pembimbing Internal (Guru)</span>
                        {previewCard.scoreAdvisor !== null && previewCard.scoreAdvisor !== undefined ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {previewCard.scoreAdvisor}/100
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Belum Menilai</span>
                        )}
                      </div>
                      {previewCard.scoreAdvisor !== null && previewCard.scoreAdvisor !== undefined && (
                        <div className="text-[11px] text-slate-600 dark:text-gray-300 space-y-0.5 mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/30">
                          <div>Kedisiplinan: <b>{previewCard.scoreAdvisorDiscipline ?? '-'}</b></div>
                          <div>Laporan: <b>{previewCard.scoreAdvisorReport ?? '-'}</b></div>
                          <div>Komunikasi: <b>{previewCard.scoreAdvisorCommunication ?? '-'}</b></div>
                          {previewCard.feedbackAdvisor && (
                            <div className="italic text-[10px] text-slate-500 mt-1">&ldquo;{previewCard.feedbackAdvisor}&rdquo;</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Grading Panel */}
              <div className="p-6 md:w-80 lg:w-96 bg-slate-50 dark:bg-[#182235] flex flex-col shrink-0">
                <div className="flex-1 flex flex-col gap-5">
                  <div className="w-full">
                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-5 block border-b border-slate-200 dark:border-gray-700 pb-3">
                      Beri Nilai <span className="text-slate-400 font-normal text-xs ml-1">(Opsional)</span>
                    </label>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kedisiplinan</label>
                        <input 
                          type="number" min="0" max="100" placeholder="0-100"
                          value={scoreDiscipline} onChange={(e) => setScoreDiscipline(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 font-semibold text-slate-700 dark:text-gray-200"
                        />
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{role === 'INTERNAL_MENTOR' ? 'Laporan' : 'Keahlian'}</label>
                        <input 
                          type="number" min="0" max="100" placeholder="0-100"
                          value={scoreSkill} onChange={(e) => setScoreSkill(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 font-semibold text-slate-700 dark:text-gray-200"
                        />
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{role === 'INTERNAL_MENTOR' ? 'Komunikasi' : 'Sikap'}</label>
                        <input 
                          type="number" min="0" max="100" placeholder="0-100"
                          value={scoreAttitude} onChange={(e) => setScoreAttitude(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 font-semibold text-slate-700 dark:text-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-3 w-full mt-6 pt-5 border-t border-slate-200 dark:border-gray-700">
                  <button 
                    onClick={() => {
                      const hasScores = scoreDiscipline !== '' || scoreSkill !== '' || scoreAttitude !== '';
                      const scoresObj = hasScores ? {
                        discipline: scoreDiscipline !== '' ? scoreDiscipline : undefined,
                        skillOrReport: scoreSkill !== '' ? scoreSkill : undefined,
                        attitudeOrCommunication: scoreAttitude !== '' ? scoreAttitude : undefined
                      } : undefined;
                      handleApproveOne(previewCard.id, scoresObj);
                      setPreviewCard(null);
                    }}
                    disabled={processingId === previewCard.id || isBatchProcessing}
                    className="w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {processingId === previewCard.id ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Setujui & Simpan
                  </button>
                  <button 
                    onClick={() => setPreviewCard(null)} 
                    className="w-full py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
