'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard } from '../types/pkl';
import { X, Calendar, Clock, MessageSquare, Award, Trash2, Edit2, Send, History, CheckCircle, File, FileText, Image as ImageIcon, Paperclip, Loader2, Plus, ChevronDown } from 'lucide-react';
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
    updateCardColumn
  } = usePKL();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Edit Mode states (for Student)
  const [isEditing, setIsEditing] = useState(initialEdit || false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description);
  
  // Custom Category states
  const [selectCategory, setSelectCategory] = useState(
    ['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? card.category : 'Lainnya'
  );
  const [customCategory, setCustomCategory] = useState(
    ['Coding', 'Design', 'Laporan', 'Networking'].includes(card.category) ? '' : card.category
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

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
        editEndTime
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
  const canEdit = true;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#243447] rounded-t-3xl md:rounded-2xl w-full max-w-3xl max-h-[92vh] md:max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-gray-700 shadow-xl relative animate-in fade-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 text-[#0F172A] dark:text-gray-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-gray-700">
          <div className="flex items-center gap-3">
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
            <span className="text-xs text-[#64748B] dark:text-gray-300 font-medium">{card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}</span>
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
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis tanggapan atau saran..."
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
                      const isDisabled = card.columnId === col.id || (col.id === 'selesai' && isStudent);
                      return (
                        <button
                          key={col.id}
                          disabled={isDisabled}
                          onClick={() => updateCardColumn(card.id, col.id as PKLCard['columnId'])}
                          className={`w-full py-1.5 px-3 rounded-xl text-left text-xs font-semibold border transition cursor-pointer ${
                            card.columnId === col.id
                              ? 'bg-primary/10 border-blue-200 text-primary cursor-default'
                              : col.id === 'selesai' && isStudent
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
          ) : (
            /* History Log Tab */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {card.history.map((log, index) => (
                  <div key={log.id} className="flex gap-4 items-start relative pb-6 group">
                    {/* Vertical connecting line */}
                    {index < card.history.length - 1 && (
                      <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-200 group-hover:bg-primary/10 transition" />
                    )}
                    {/* Indicator Dot */}
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-blue-200 flex items-center justify-center shrink-0 z-10 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {/* Text content */}
                    <div className="flex-1">
                      <p className="text-xs text-slate-800 dark:text-gray-200 leading-normal">{log.text}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
