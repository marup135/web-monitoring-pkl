'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, Subtask, PriorityLevel } from '../types/pkl';
import { X, Calendar, Clock, MessageSquare, Award, Trash2, Edit2, Send, History, CheckCircle, CheckSquare, File, FileText, Image as ImageIcon, Paperclip, Loader2, Plus, ChevronDown, Users, Tag, AtSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CardModalProps {
  card: PKLCard;
  onClose: () => void;
  initialEdit?: boolean;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose, initialEdit }) => {
  const {
    activeRole,
    state,
    updateCardDetails,
    addComment,
    gradeCardByMentor,
    gradeCardByAdvisor,
    addAttachment,
    deleteAttachment,
    deleteCard,
    updateCardColumn,
    updateSubtasks,
    manageCollaborators,
    currentUser
  } = usePKL();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'collaborators'>('details');

  // Edit Mode states (for Student)
  const [isEditing, setIsEditing] = useState(initialEdit || false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description);
  const [editPriority, setEditPriority] = useState<PriorityLevel>(card.priority || 'medium');
  
  // Custom Category states
  const [selectCategory, setSelectCategory] = useState(
    ['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? card.category : 'Lainnya'
  );
  const [customCategory, setCustomCategory] = useState(
    ['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? '' : card.category
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  const [editDueDate, setEditDueDate] = useState(card.dueDate);
  const [editStartTime, setEditStartTime] = useState(card.startTime || '');
  const [editEndTime, setEditEndTime] = useState(card.endTime || '');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Grading / edit states for Mentor
  const [mentorDiscipline, setMentorDiscipline] = useState<number | ''>(card.scoreMentorDiscipline !== undefined ? card.scoreMentorDiscipline : '');
  const [mentorSkill, setMentorSkill] = useState<number | ''>(card.scoreMentorSkill !== undefined ? card.scoreMentorSkill : '');
  const [mentorAttitude, setMentorAttitude] = useState<number | ''>(card.scoreMentorAttitude !== undefined ? card.scoreMentorAttitude : '');
  const [mentorFeedback, setMentorFeedback] = useState(card.feedbackMentor || '');

  // Grading / edit states for Advisor (Guru)
  const [advisorDiscipline, setAdvisorDiscipline] = useState<number | ''>(card.scoreAdvisorDiscipline !== undefined ? card.scoreAdvisorDiscipline : '');
  const [advisorReport, setAdvisorReport] = useState<number | ''>(card.scoreAdvisorReport !== undefined ? card.scoreAdvisorReport : '');
  const [advisorCommunication, setAdvisorCommunication] = useState<number | ''>(card.scoreAdvisorCommunication !== undefined ? card.scoreAdvisorCommunication : '');
  const [advisorFeedback, setAdvisorFeedback] = useState(card.feedbackAdvisor || '');

  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Revision Request States (for Mentor/Advisor)
  const [isRevisionBoxOpen, setIsRevisionBoxOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    try {
      await addComment(card.id, `⚠️ MINTA REVISI dari ${currentUser?.name} (${activeRole}): ${revisionNote.trim()}`);
      await updateCardColumn(card.id, 'progres');
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || 'Gagal mengirim revisi.');
    }
  };
  
  // Collaborator management states
  const [newCollabNisn, setNewCollabNisn] = useState('');
  const [collaborators, setCollaborators] = useState(card.collaborators || []);
  const [canEdit, setCanEdit] = useState(card.collaboratorsCanEdit || false);
  const [editors, setEditors] = useState<string[]>(card.editorIds || []);

  // Sub-tasks checklist state & handlers
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const subtasks = card.subtasks || [];

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSubtask: Subtask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: newSubtaskText.trim(),
      isCompleted: false,
    };
    const updated = [...subtasks, newSubtask];
    setNewSubtaskText('');
    await updateSubtasks(card.id, updated);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const updated = subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st);
    await updateSubtasks(card.id, updated);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updated = subtasks.filter(st => st.id !== subtaskId);
    await updateSubtasks(card.id, updated);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (editStartTime && editEndTime) {
      const [startH, startM] = editStartTime.split(':').map(Number);
      const [endH, endM] = editEndTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      if (endMin < startMin) {
        setValidationError(t('errEndTime'));
        return;
      }
    }

    if (!editTitle.trim()) {
      setValidationError(t('errTitleRequired'));
      return;
    }

    const finalCategory = selectCategory === 'Lainnya' ? customCategory.trim() || 'Lainnya' : selectCategory;
    try {
      await updateCardDetails(
        card.id,
        editTitle.trim(),
        editDesc.trim(),
        finalCategory,
        editDueDate,
        editStartTime,
        editEndTime,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        editPriority
      );
      setIsEditing(false);
    } catch (err) {
      setValidationError((err as Error).message || t('errUpdateDetailsFailed'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setUploading(true);
    try {
      const { uploadFileAction } = await import('@/app/actions/pkl');
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadFileAction(formData);
      if (res.success && res.fileUrl && res.name && res.type) {
        await addAttachment(card.id, res.name, res.fileUrl, res.type);
      } else {
        setValidationError(res.error || t('errUploadFailed'));
      }
    } catch (err) {
      console.error(err);
      setValidationError(t('errUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleMentorGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const disc = Number(mentorDiscipline);
    const skl = Number(mentorSkill);
    const att = Number(mentorAttitude);

    if (isNaN(disc) || disc < 0 || disc > 100 ||
        isNaN(skl) || skl < 0 || skl > 100 ||
        isNaN(att) || att < 0 || att > 100) {
      setValidationError(t('errMentorScoreFormat'));
      return;
    }

    if (!mentorFeedback.trim()) {
      setValidationError(t('errMentorFeedbackRequired'));
      return;
    }

    try {
      await gradeCardByMentor(
        card.id,
        disc,
        skl,
        att,
        mentorFeedback.trim()
      );
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || t('errMentorGradeFailed'));
    }
  };

  const handleAdvisorGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const disc = Number(advisorDiscipline);
    const rep = Number(advisorReport);
    const comm = Number(advisorCommunication);

    if (isNaN(disc) || disc < 0 || disc > 100 ||
        isNaN(rep) || rep < 0 || rep > 100 ||
        isNaN(comm) || comm < 0 || comm > 100) {
      setValidationError(t('errTeacherScoreFormat'));
      return;
    }

    if (!advisorFeedback.trim()) {
      setValidationError(t('errTeacherFeedbackRequired'));
      return;
    }

    try {
      await gradeCardByAdvisor(
        card.id,
        disc,
        rep,
        comm,
        advisorFeedback.trim()
      );
      onClose();
    } catch (err) {
      setValidationError((err as Error).message || t('errTeacherGradeFailed'));
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!commentText.trim()) return;
    try {
      await addComment(card.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      setValidationError((err as Error).message || t('errCommentFailed'));
    }
  };

  const handleDelete = async () => {
    setValidationError(null);
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteCard(card.id);
        onClose();
      } catch (err) {
        setValidationError((err as Error).message || t('errDeleteFailed'));
      }
    }
  };

  const isStudent = activeRole === 'Mahasiswa';
  const isMentor = activeRole === 'Mentor';
  const isOwner = !currentUser || currentUser?.id === card.studentId;
  const isCollaborator = card.collaborators?.some(c => c.id === currentUser?.id);
  const userCanEdit = isOwner || (isCollaborator && (card.collaboratorsCanEdit || (currentUser && editors.includes(currentUser.id))));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#243447] rounded-t-3xl md:rounded-2xl w-full max-w-3xl max-h-[92vh] md:max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-gray-700 shadow-xl relative animate-in fade-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 text-[#0F172A] dark:text-gray-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              card.columnId === 'selesai' ? 'bg-green-50 text-green-700 border-green-100' :
              card.columnId === 'review' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
              card.columnId === 'progres' ? 'bg-primary/10 text-blue-700 border-blue-100' :
              'bg-slate-50 dark:bg-gray-800/50 text-slate-700 border-slate-100'
            }`}>
              {card.columnId === 'selesai' ? t('statusDone') :
               card.columnId === 'review' ? t('statusReview') :
               card.columnId === 'progres' ? t('statusProgress') :
               t('statusPlan')}
            </span>
            <span className="text-xs text-gray-300">•</span>

            {/* Quick Category / Label Change Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="text-xs text-slate-700 dark:text-gray-200 font-semibold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-1 cursor-pointer transition"
                title="Klik untuk ganti label/kategori"
              >
                <span>🏷️ {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700/60 mb-1">
                    Ganti Label / Kategori
                  </div>
                  {['Coding', 'Design', 'Laporan', 'Networking'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={async () => {
                        setIsCategoryDropdownOpen(false);
                        try {
                          await updateCardDetails(
                            card.id,
                            card.title,
                            card.description,
                            cat,
                            card.dueDate,
                            card.startTime || '',
                            card.endTime || '',
                            undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined,
                            card.priority
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#2D435E] transition-colors cursor-pointer ${
                        card.category === cat ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-gray-200'
                      }`}
                    >
                      <span>{cat === 'Laporan' ? t('report') : cat}</span>
                      {card.category === cat && <span className="text-primary text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-xs text-gray-300">•</span>

            {/* Quick Priority Change Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                className="text-xs font-semibold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-1 cursor-pointer transition"
                title="Klik untuk ganti prioritas"
              >
                <span>
                  {card.priority === 'urgent'
                    ? '⚡ Mendesak'
                    : card.priority === 'high'
                    ? '🔥 Tinggi'
                    : card.priority === 'low'
                    ? '🟢 Rendah'
                    : '🟡 Sedang'}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {isPriorityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700/60 mb-1">
                    Ganti Prioritas
                  </div>
                  {[
                    { id: 'low', label: '🟢 Rendah' },
                    { id: 'medium', label: '🟡 Sedang' },
                    { id: 'high', label: '🔥 Tinggi' },
                    { id: 'urgent', label: '⚡ Mendesak' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={async () => {
                        setIsPriorityDropdownOpen(false);
                        try {
                          await updateCardDetails(
                            card.id,
                            card.title,
                            card.description,
                            card.category,
                            card.dueDate,
                            card.startTime || '',
                            card.endTime || '',
                            undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined,
                            p.id as PriorityLevel
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#2D435E] transition-colors cursor-pointer ${
                        (card.priority || 'medium') === p.id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-gray-200'
                      }`}
                    >
                      <span>{p.label}</span>
                      {(card.priority || 'medium') === p.id && <span className="text-primary text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-300 hover:text-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] dark:border-gray-700 px-6 bg-[#F8FAFC] dark:bg-gray-900">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
            }`}
          >
            <MessageSquare size={14} />
            {t('tabDetails')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
            }`}
          >
            <History size={14} />
            {t('tabHistory')} ({card.history.length})
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'collaborators' ? 'border-primary text-primary' : 'border-transparent text-[#64748B] dark:text-gray-300 hover:text-[#0F172A] dark:text-gray-200'
            }`}
          >
            <Users size={14} />
            Anggota {card.collaborators && card.collaborators.length > 0 ? `(${card.collaborators.length})` : ''}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-left">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Description & Comments */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {validationError && !isEditing && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-[#EF4444] rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
                    <span>{validationError}</span>
                    <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600 dark:text-red-500 font-bold ml-2 text-sm cursor-pointer">×</button>
                  </div>
                )}

                {/* Approval & Review Status Banner */}
                {card.columnId === 'review' && (
                  <div className="p-4 rounded-xl border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Award className="text-purple-600 dark:text-purple-400 shrink-0" size={18} />
                        <div>
                          <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                            ⏳ Menunggu Persetujuan & Penilaian Pembimbing
                          </h4>
                          <p className="text-[11px] text-purple-700 dark:text-purple-300">
                            {isStudent
                              ? 'Kegiatan ini telah diajukan. Hanya Dosen Pembimbing atau Mentor Industri yang dapat menyetujui & memindahkan ke kolom Selesai.'
                              : 'Sebagai Guru/Mentor, Anda dapat memberikan penilaian & persetujuan atau meminta revisi.'}
                          </p>
                        </div>
                      </div>
                      {(activeRole === 'Dosen Pembimbing' || activeRole === 'Mentor') && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsRevisionBoxOpen(!isRevisionBoxOpen)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            🔴 Minta Revisi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline Revision Request Box */}
                    {isRevisionBoxOpen && (
                      <form onSubmit={handleRequestRevision} className="flex flex-col gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/60">
                        <label className="text-[11px] font-bold text-red-700 dark:text-red-300">Catatan/Alasan Revisi untuk Mahasiswa:</label>
                        <textarea
                          required
                          rows={2}
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                          placeholder="Jelaskan bagian mana yang perlu diperbaiki oleh mahasiswa..."
                          className="w-full bg-white dark:bg-gray-900 border border-red-300 rounded-lg p-2 text-xs text-slate-800 dark:text-gray-200 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsRevisionBoxOpen(false)}
                            className="px-3 py-1 text-xs text-slate-500 font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                          >
                            Kirim Revisi & Kembalikan Kartu
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {card.columnId === 'selesai' && (
                  <div className="p-3.5 rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          ✅ Telah Disetujui & Dinilai oleh Pembimbing
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          Kegiatan ini telah resmi diverifikasi. Nilai & masukan telah dicatat dalam sistem monitoring PKL.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description Box */}
                <div className="bg-[#F1F5F9] dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4">
                  {isEditing ? (
                    <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
                      {validationError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-lg text-xs font-semibold animate-in fade-in duration-200">
                          {validationError}
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('activityTitle')}</label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('activityDesc')}</label>
                        <textarea
                          required
                          rows={4}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary resize-none min-h-[80px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('category')}</label>
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-left text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#2D435E] transition cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2 md:rounded-lg md:text-xs"
                          >
                            <span>{selectCategory === 'Laporan' ? t('report') : selectCategory === 'Lainnya' ? t('others') : selectCategory}</span>
                            <ChevronDown size={12} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isCategoryDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                              {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setSelectCategory(cat);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 md:py-2 text-sm md:text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#2D435E] flex items-center justify-between cursor-pointer ${selectCategory === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700'}`}
                                >
                                  {cat === 'Laporan' ? t('report') : cat === 'Lainnya' ? t('others') : cat}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('dueDate')}</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none min-h-[48px] py-3 md:min-h-0 md:py-2 md:rounded-lg md:text-xs"
                          />
                        </div>
                      </div>

                      {selectCategory === 'Lainnya' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('category')}</label>
                          <input
                            type="text"
                            required
                            placeholder="Kategori kustom..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:rounded-lg"
                          />
                        </div>
                      )}

                      {/* Priority Level Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">Tingkat Prioritas</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'low', label: '🟢 Rendah' },
                            { id: 'medium', label: '🟡 Sedang' },
                            { id: 'high', label: '🔥 Tinggi' },
                            { id: 'urgent', label: '⚡ Mendesak' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setEditPriority(p.id as PriorityLevel)}
                              className={`py-1.5 px-1 text-xs rounded-lg border font-bold transition-all text-center ${
                                editPriority === p.id
                                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                  : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-[#243447] text-slate-600 dark:text-gray-300 hover:bg-slate-50'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('start')}</label>
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:rounded-lg md:text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold uppercase">{t('end')}</label>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:rounded-lg md:text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTitle(card.title);
                            setEditDesc(card.description);
                            setSelectCategory(['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? card.category : 'Lainnya');
                            setCustomCategory(['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? '' : card.category);
                            setEditDueDate(card.dueDate);
                            setEditStartTime(card.startTime || '');
                            setEditEndTime(card.endTime || '');
                            setIsEditing(false);
                          }}
                          className="w-full md:w-auto px-4 py-3 md:py-1.5 rounded-xl md:rounded-lg bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 text-sm md:text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] transition cursor-pointer min-h-[48px] md:min-h-0"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          className="w-full md:w-auto px-4 py-3 md:py-1.5 rounded-xl md:rounded-lg bg-primary hover:bg-primary-hover text-sm md:text-xs font-semibold text-white transition shadow-sm cursor-pointer min-h-[48px] md:min-h-0"
                        >
                          {t('save')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-lg">{card.title}</h3>
                        {canEdit && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-lg bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] text-slate-500 dark:text-gray-300 hover:text-primary transition cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      {/* Tanggal & Waktu Display */}
                      <div className="flex flex-col gap-1.5 mb-4 text-xs font-medium text-slate-600 dark:text-gray-300 border-b border-slate-100 dark:border-gray-700/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#94A3B8] font-normal w-12">{t('date')}</span>
                          <span>
                            {card.dueDate ? new Date(card.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        {(card.startTime || card.endTime) && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#94A3B8] font-normal w-12">Waktu</span>
                            <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {card.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sub-tasks & Checklist Section */}
                <div className="bg-[#F1F5F9] dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={16} className="text-primary" />
                      <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider">
                        Sub-tugas & Checklist ({subtasks.filter(s => s.isCompleted).length}/{subtasks.length})
                      </h4>
                    </div>
                    {subtasks.length > 0 && (
                      <span className="text-xs font-semibold text-primary">
                        {Math.round((subtasks.filter(s => s.isCompleted).length / subtasks.length) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="w-full bg-slate-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(subtasks.filter(s => s.isCompleted).length / subtasks.length) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* List of Subtasks */}
                  <div className="flex flex-col gap-2">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-lg text-xs group">
                        <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={st.isCompleted}
                            onChange={() => handleToggleSubtask(st.id)}
                            disabled={!userCanEdit}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer accent-primary"
                          />
                          <span className={`${st.isCompleted ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-200 font-medium'}`}>
                            {st.text}
                          </span>
                        </label>
                        {userCanEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(st.id)}
                            className="text-slate-400 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Hapus Sub-tugas"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}

                    {subtasks.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-gray-400 italic">Belum ada sub-tugas. Tambahkan langkah-langkah kerja di bawah.</p>
                    )}
                  </div>

                  {/* Add New Subtask Input */}
                  {userCanEdit && (
                    <form onSubmit={handleAddSubtask} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tambah sub-tugas baru..."
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        className="flex-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-gray-200 focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={!newSubtaskText.trim()}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Tambah</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="bg-[#F1F5F9] dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip size={14} className="text-primary" />
                      {t('attachments')} ({card.attachments ? card.attachments.length : 0})
                    </h4>
                    {isStudent && (
                      <div className="relative">
                        <input
                          type="file"
                          id="file-attachment"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <label
                          htmlFor="file-attachment"
                          className={`cursor-pointer px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {uploading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>{t('uploading')}</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>{t('uploadFile')}</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {(!card.attachments || card.attachments.length === 0) ? (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic">{t('emptyAttachments')}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {card.attachments.map((att, idx) => {
                        let IconComponent = File;
                        let colorClass = 'text-slate-500 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700';
                        if (att.type === 'image') {
                          IconComponent = ImageIcon;
                          colorClass = 'text-pink-700 bg-pink-50 border-pink-100';
                        } else if (att.type === 'pdf') {
                          IconComponent = FileText;
                          colorClass = 'text-red-700 bg-red-50 border-red-100';
                        } else if (att.type === 'doc') {
                          IconComponent = FileText;
                          colorClass = 'text-blue-700 bg-primary/10 border-blue-100';
                        }
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl text-xs gap-3 shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className={`p-1.5 rounded-lg border ${colorClass} shrink-0`}>
                                <IconComponent size={14} />
                              </div>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-slate-700 hover:text-primary transition truncate underline"
                              >
                                {att.name}
                              </a>
                            </div>
                            {isStudent && (
                              <button
                                onClick={() => deleteAttachment(card.id, idx)}
                                className="p-1 rounded bg-slate-50 dark:bg-gray-800/50 hover:bg-red-50 text-slate-400 hover:text-[#EF4444] transition shrink-0 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Score & Feedback Panel for Mentor */}
                <div className="bg-[#F1F5F9] dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} className="text-purple-600" />
                    {t('mentorEvalTitle')}
                  </h4>

                  {card.scoreMentor !== undefined ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4">
                        <div className="p-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl h-fit flex flex-col items-center justify-center min-w-[75px] shadow-sm">
                          <span className="text-[9px] uppercase font-bold text-purple-600">{t('mentor')}</span>
                          <span className="text-2xl font-black">{card.scoreMentor}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 text-xs">
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-gray-300">
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreMentorDiscipline}</span>
                              Kedisiplinan
                            </div>
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreMentorSkill}</span>
                              Keahlian
                            </div>
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreMentorAttitude}</span>
                              Sikap
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs bg-white dark:bg-[#243447] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-gray-700">
                        <span className="text-[10px] text-purple-600 font-semibold block mb-0.5">{t('mentorFeedbackTitle')}:</span>
                        <p className="text-slate-600 italic">&ldquo;{card.feedbackMentor || t('emptyFeedback')}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic">{t('notEvaluatedMentor')}</p>
                  )}
                </div>

                {/* Score & Feedback Panel for Guru */}
                <div className="bg-[#F1F5F9] dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} className="text-yellow-600" />
                    {t('teacherEvalTitle')}
                  </h4>

                  {card.scoreAdvisor !== undefined ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4">
                        <div className="p-3 bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-xl h-fit flex flex-col items-center justify-center min-w-[75px] shadow-sm">
                          <span className="text-[9px] uppercase font-bold text-yellow-600">{t('teacher')}</span>
                          <span className="text-2xl font-black">{card.scoreAdvisor}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 text-xs">
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-gray-300">
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreAdvisorDiscipline}</span>
                              Kedisiplinan
                            </div>
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreAdvisorReport}</span>
                              Laporan
                            </div>
                            <div className="bg-white dark:bg-[#243447] p-1.5 rounded border border-[#E2E8F0] dark:border-gray-700 text-center">
                              <span className="block font-bold text-slate-800 dark:text-gray-200">{card.scoreAdvisorCommunication}</span>
                              Komunikasi
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs bg-white dark:bg-[#243447] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-gray-700">
                        <span className="text-[10px] text-yellow-600 font-semibold block mb-0.5">{t('teacherFeedbackTitle')}:</span>
                        <p className="text-slate-600 italic">&ldquo;{card.feedbackAdvisor || t('emptyFeedback')}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-gray-2000 italic">{t('notEvaluatedAdvisor')}</p>
                  )}
                </div>

                {/* Grading form for Mentor */}
                {isMentor && (card.columnId === 'review' || card.columnId === 'selesai') && (
                  <form onSubmit={handleMentorGradeSubmit} className="bg-slate-50 dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                    {validationError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-lg text-xs font-semibold animate-in fade-in duration-200">
                        {validationError}
                      </div>
                    )}
                    <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Form Penilaian Mentor Lapangan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Kedisiplinan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorDiscipline}
                          onChange={(e) => setMentorDiscipline(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Keahlian (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorSkill}
                          onChange={(e) => setMentorSkill(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Sikap (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorAttitude}
                          onChange={(e) => setMentorAttitude(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">{t('mentorFeedbackTitle')}</label>
                      <textarea
                        required
                        rows={2}
                        value={mentorFeedback}
                        onChange={(e) => setMentorFeedback(e.target.value)}
                        placeholder="..."
                        className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary resize-none min-h-[80px] py-3 md:min-h-0 md:py-2.5 md:text-xs md:rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-sm transition w-full cursor-pointer min-h-[48px] md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                    >
                      {t('save')}
                    </button>
                  </form>
                )}

                {/* Grading form for Advisor (Guru) */}
                {activeRole === 'Dosen Pembimbing' && (card.columnId === 'review' || card.columnId === 'selesai') && (
                  <form onSubmit={handleAdvisorGradeSubmit} className="bg-slate-50 dark:bg-gray-800/50 border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-4">
                    {validationError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-lg text-xs font-semibold animate-in fade-in duration-200">
                        {validationError}
                      </div>
                    )}
                    <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      {t('teacherEvalTitle')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Kedisiplinan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorDiscipline}
                          onChange={(e) => setAdvisorDiscipline(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Laporan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorReport}
                          onChange={(e) => setAdvisorReport(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">Komunikasi (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorCommunication}
                          onChange={(e) => setAdvisorCommunication(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-500 min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B] dark:text-gray-300 font-semibold block mb-1">{t('teacherFeedbackTitle')}</label>
                      <textarea
                        required
                        rows={2}
                        value={advisorFeedback}
                        onChange={(e) => setAdvisorFeedback(e.target.value)}
                        placeholder="..."
                        className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3.5 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary resize-none min-h-[80px] py-3 md:min-h-0 md:py-2.5 md:text-xs md:rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-sm transition w-full cursor-pointer min-h-[48px] md:min-h-0 md:py-2 md:text-xs md:rounded-lg"
                    >
                      {t('save')}
                    </button>
                  </form>
                )}

                {/* Comment Section */}
                <div className="flex flex-col gap-4 border-t border-[#E2E8F0] dark:border-gray-700 pt-6">
                  <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-primary" />
                    {t('discussion')} ({card.comments.length})
                  </h4>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {card.comments.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-gray-2000 italic py-4 text-center">{t('emptyDiscussion')}</p>
                    ) : (
                      card.comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col bg-white dark:bg-[#243447] rounded-xl p-3 border border-[#E2E8F0] dark:border-gray-700 shadow-sm">
                          <div className="flex justify-between items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800 dark:text-white">{comment.userName}</span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                comment.role === 'Mentor' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                comment.role === 'Dosen Pembimbing' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                'bg-primary/10 text-blue-700 border border-blue-100'
                              }`}>
                                {comment.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {comment.text.split(/(@[A-Za-z0-9_'\s]+?)(?=\s|$)/g).map((part, i) => {
                              if (part.startsWith('@')) {
                                return (
                                  <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] border border-blue-200 dark:border-blue-800/60 mx-0.5">
                                    {part}
                                  </span>
                                );
                              }
                              return part;
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Mention Pills */}
                  {((card.collaborators && card.collaborators.length > 0) || currentUser) && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <AtSign size={11} className="text-primary" /> Tag:
                      </span>
                      {card.collaborators?.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCommentText(prev => (prev ? prev.trim() + ' ' : '') + `@${c.name.split(' ')[0]} `)}
                          className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary rounded-md border border-slate-200 dark:border-gray-700 transition cursor-pointer shrink-0 flex items-center gap-0.5"
                        >
                          <span>@{c.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis komentar... (gunakan @Nama untuk mention)"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-4 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2 md:text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm transition cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 md:min-h-0 md:min-w-0"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Sidebar Metrics */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider">{t('statusMetadata')}</h4>
                
                <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3.5 text-xs text-slate-700 shadow-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#E2E8F0] dark:border-gray-700">
                    <span className="text-slate-500 dark:text-gray-300 flex items-center gap-1.5">
                      <Calendar size={13} /> {t('dueDate')}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">{card.dueDate}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-[#E2E8F0] dark:border-gray-700">
                    <span className="text-slate-500 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock size={13} /> {t('start')}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">{card.startTime || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-[#E2E8F0] dark:border-gray-700">
                    <span className="text-slate-500 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock size={13} /> {t('end')}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">{card.endTime || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-[#E2E8F0] dark:border-gray-700">
                    <span className="text-slate-500 dark:text-gray-300">{t('createdAt')}</span>
                    <span className="text-slate-600">
                      {new Date(card.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 dark:text-gray-300">{t('owner')}</span>
                    <span className="font-medium text-slate-700">{state.studentName}</span>
                  </div>
                </div>

                {/* Status Transitions panel */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-[#64748B] dark:text-gray-300 uppercase tracking-wider">{t('moveStatus')}</h4>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'rencana', label: t('plan') },
                      { id: 'progres', label: t('progress') },
                      { id: 'review', label: t('review') },
                      { id: 'selesai', label: t('done') },
                    ].map((col) => {
                      const isLocked = card.columnId === 'selesai' && isStudent;
                      const isDisabled = card.columnId === col.id || (col.id === 'selesai' && isStudent) || isLocked;
                      return (
                        <button
                          key={col.id}
                          disabled={isDisabled}
                          onClick={() => updateCardColumn(card.id, col.id as PKLCard['columnId'])}
                          className={`w-full py-1.5 px-3 rounded-xl text-left text-xs font-semibold border transition cursor-pointer ${
                            card.columnId === col.id
                              ? 'bg-primary/10 border-blue-200 text-primary cursor-default'
                              : isDisabled
                              ? 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-white dark:bg-[#243447] border-[#E2E8F0] dark:border-gray-700 text-slate-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] hover:text-slate-900'
                          }`}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                    {isStudent && (
                      <span className="text-[10px] text-yellow-600/90 mt-1 italic leading-tight">
                        * {t('doneNote')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={handleDelete}
                  className="mt-auto py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#EF4444] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{t('deleteActivity')}</span>
                </button>
              </div>

            </div>
          ) : activeTab === 'history' ? (
            /* History Log Tab */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <History size={16} className="text-primary" />
                  <span>Riwayat Aktivitas Kegiatan</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total {card.history?.length || 0} entri
                </span>
              </div>

              {(!card.history || card.history.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-slate-400">
                  <Clock size={32} className="opacity-40 mb-2" />
                  <p className="text-xs font-semibold">Belum ada riwayat aktivitas pada kegiatan ini.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 relative pl-2">
                  {card.history.map((log, index) => {
                    let icon = '📌';
                    if (log.text.includes('dibuat')) icon = '✨';
                    else if (log.text.includes('dipindahkan') || log.text.includes('Status')) icon = '🔄';
                    else if (log.text.includes('komentar')) icon = '💬';
                    else if (log.text.includes('Sub-tugas')) icon = '☑️';
                    else if (log.text.includes('diperbarui') || log.text.includes('Detail')) icon = '✏️';

                    const dateObj = new Date(log.createdAt);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={log.id || index} className="flex gap-3.5 items-start relative pb-5 group">
                        {/* Vertical connecting line */}
                        {index < card.history.length - 1 && (
                          <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-slate-200 dark:bg-gray-700 group-hover:bg-primary/30 transition" />
                        )}
                        
                        {/* Indicator Icon Badge */}
                        <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center shrink-0 z-10 text-xs shadow-sm">
                          {icon}
                        </div>

                        {/* Log Text & Timestamp */}
                        <div className="flex-1 bg-slate-50/70 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-700/60 rounded-xl p-3">
                          <p className="text-xs font-medium text-slate-800 dark:text-gray-200 leading-relaxed">{log.text}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1.5 font-semibold">
                            <Clock size={10} />
                            <span>{formattedDate} • {formattedTime} WIB</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'collaborators' ? (
            /* Collaborators Tab */
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Anggota Kegiatan (Kolaborator)</h3>
              
              <div className="flex flex-col gap-2">
                {/* Tampilkan Pembuat Kegiatan */}
                {card.owner && (
                  <div key={card.owner.id} className="flex justify-between items-center bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 text-blue-600 flex items-center justify-center rounded-full font-bold uppercase">
                        {(card.owner.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-700 dark:text-white flex items-center gap-2">
                          {card.owner.name}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Pembuat</span>
                        </p>
                        <p className="text-xs text-slate-500">NISN: {card.owner.nisn || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText(prev => (prev ? prev.trim() + ' ' : '') + `@${card.owner!.name.split(' ')[0]} `);
                          setActiveTab('details');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title={`Mention ${card.owner.name}`}
                      >
                        <AtSign size={12} />
                        <span>Mention</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tampilkan Kolaborator */}
                {collaborators.length === 0 && !card.owner && (
                  <p className="text-sm text-slate-500">Belum ada kolaborator yang ditambahkan.</p>
                )}
                {collaborators.map(c => {
                  const isUserEditor = canEdit || editors.includes(c.id);
                  return (
                  <div key={c.id} className="flex justify-between items-center bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-slate-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 text-primary flex items-center justify-center rounded-full font-bold uppercase">
                        {(c.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-700 dark:text-white flex items-center gap-2">
                          {c.name}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${isUserEditor ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300 border-slate-300 dark:border-gray-600'}`}>
                            {isUserEditor ? 'Editor' : 'Kolaborator'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">NISN: {c.nisn || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText(prev => (prev ? prev.trim() + ' ' : '') + `@${c.name.split(' ')[0]} `);
                          setActiveTab('details');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title={`Mention ${c.name}`}
                      >
                        <AtSign size={12} />
                        <span>Mention</span>
                      </button>
                      {userCanEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editors.includes(c.id)) {
                              setEditors(prev => prev.filter(id => id !== c.id));
                            } else {
                              setEditors(prev => [...prev, c.id]);
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition border ${isUserEditor ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200' : 'bg-purple-100 text-purple-600 hover:bg-purple-200 border-purple-200'}`}
                          title={isUserEditor ? 'Cabut Akses Editor' : 'Jadikan Editor'}
                        >
                          {isUserEditor ? 'Cabut Akses' : 'Jadikan Editor'}
                        </button>
                      )}
                      {userCanEdit && (
                        <button 
                          onClick={() => {
                            setCollaborators(prev => prev.filter(collab => collab.id !== c.id));
                            setEditors(prev => prev.filter(id => id !== c.id));
                          }}
                          className="text-red-500 hover:text-red-600 p-2 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>
              
              {userCanEdit && (
                <div className="mt-4 flex flex-col gap-4 p-4 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                  
                  {/* Tambah Anggota Section */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Tambah Anggota Baru</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="new-collab-nisn"
                        placeholder="Masukkan NISN siswa"
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:border-primary"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('new-collab-nisn') as HTMLInputElement;
                          const nisn = input.value.trim();
                          if (!nisn) return;
                          setCollaborators(prev => [...prev, { id: 'temp-' + Date.now(), name: 'User ' + nisn, nisn }]);
                          input.value = '';
                        }}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      manageCollaborators(card.id, collaborators.map(c => c.nisn).filter(Boolean) as string[], editors);
                    }}
                    className="mt-2 w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};
