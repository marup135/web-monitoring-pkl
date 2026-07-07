'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, TaskCategory } from '../types/pkl';
import { X, Calendar, Clock, MessageSquare, Award, Trash2, Edit2, Send, History, CheckCircle, File, FileText, Image as ImageIcon, Paperclip, Loader2, Plus, ChevronDown } from 'lucide-react';

interface CardModalProps {
  card: PKLCard;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
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
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Edit Mode states (for Student)
  const [isEditing, setIsEditing] = useState(false);
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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = selectCategory === 'Lainnya' ? customCategory.trim() || 'Lainnya' : selectCategory;
    updateCardDetails(
      card.id,
      editTitle,
      editDesc,
      finalCategory,
      editDueDate,
      editStartTime,
      editEndTime
    );
    setIsEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadFileAction } = await import('@/app/actions/pkl');
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadFileAction(formData);
      if (res.success && res.fileUrl && res.name && res.type) {
        await addAttachment(card.id, res.name, res.fileUrl, res.type);
      } else {
        alert('Gagal mengunggah file.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  const handleMentorGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gradeCardByMentor(
      card.id,
      Number(mentorDiscipline),
      Number(mentorSkill),
      Number(mentorAttitude),
      mentorFeedback
    );
    onClose();
  };

  const handleAdvisorGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gradeCardByAdvisor(
      card.id,
      Number(advisorDiscipline),
      Number(advisorReport),
      Number(advisorCommunication),
      advisorFeedback
    );
    onClose();
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(card.id, commentText);
    setCommentText('');
  };



  const handleDelete = () => {
    if (confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
      deleteCard(card.id);
      onClose();
    }
  };

  const isStudent = activeRole === 'Mahasiswa';
  const isMentor = activeRole === 'Mentor';
  const canEdit = true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              card.columnId === 'selesai' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
              card.columnId === 'review' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
              card.columnId === 'progres' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
              'bg-slate-500/10 text-slate-300 border-slate-500/20'
            }`}>
              {card.columnId === 'selesai' ? 'Selesai' :
               card.columnId === 'review' ? 'Butuh Review' :
               card.columnId === 'progres' ? 'Sedang Dikerjakan' :
               'Rencana Kegiatan'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400 font-medium">{card.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-white/5 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageSquare size={14} />
            Detail & Diskusi
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <History size={14} />
            Riwayat Aktivitas ({card.history.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Description & Comments */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Description Box */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4">
                  {isEditing ? (
                    <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 font-semibold uppercase">Judul</label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 font-semibold uppercase">Deskripsi</label>
                        <textarea
                          required
                          rows={4}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Kategori</label>
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-left text-xs text-gray-200 focus:outline-none flex justify-between items-center hover:border-indigo-500/50 transition cursor-pointer"
                          >
                            <span>{selectCategory}</span>
                            <ChevronDown size={12} className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isCategoryDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 bg-slate-950/95 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden glass">
                              {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setSelectCategory(cat);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-indigo-500/10 hover:text-indigo-300 flex items-center justify-between cursor-pointer ${selectCategory === cat ? 'bg-indigo-500/15 text-indigo-400 font-semibold' : 'text-gray-300'}`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Tenggat</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none"
                          />
                        </div>
                      </div>

                      {selectCategory === 'Lainnya' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Isi Kategori Lainnya</label>
                          <input
                            type="text"
                            required
                            placeholder="Kategori kustom..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Waktu Mulai</label>
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Waktu Selesai</label>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-2">
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
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition shadow-md"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold text-gray-200 text-lg">{card.title}</h3>
                        {canEdit && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {card.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip size={14} className="text-indigo-400" />
                      Berkas Lampiran ({card.attachments ? card.attachments.length : 0})
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
                          className={`cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {uploading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Mengunggah...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>Unggah File</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {(!card.attachments || card.attachments.length === 0) ? (
                    <p className="text-xs text-gray-500 italic">Belum ada file lampiran.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {card.attachments.map((att, idx) => {
                        let IconComponent = File;
                        let colorClass = 'text-gray-400 bg-gray-500/10 border-gray-500/20';
                        if (att.type === 'image') {
                          IconComponent = ImageIcon;
                          colorClass = 'text-pink-400 bg-pink-500/10 border-pink-500/20';
                        } else if (att.type === 'pdf') {
                          IconComponent = FileText;
                          colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                        } else if (att.type === 'doc') {
                          IconComponent = FileText;
                          colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                        }
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl text-xs gap-3">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className={`p-1.5 rounded-lg border ${colorClass} shrink-0`}>
                                <IconComponent size={14} />
                              </div>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-gray-300 hover:text-indigo-400 transition truncate underline"
                              >
                                {att.name}
                              </a>
                            </div>
                            {isStudent && (
                              <button
                                onClick={() => deleteAttachment(card.id, idx)}
                                className="p-1 rounded bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition shrink-0"
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
                <div className="bg-white/2 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} className="text-purple-400" />
                    Penilaian Mentor (Pembimbing Eksternal)
                  </h4>

                  {card.scoreMentor !== undefined ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4">
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl h-fit flex flex-col items-center justify-center min-w-[75px] shadow-sm">
                          <span className="text-[9px] uppercase font-bold text-purple-400">Mentor</span>
                          <span className="text-2xl font-black">{card.scoreMentor}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 text-xs">
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400">
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreMentorDiscipline}</span>
                              Kedisiplinan
                            </div>
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreMentorSkill}</span>
                              Keahlian
                            </div>
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreMentorAttitude}</span>
                              Sikap
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-purple-400 font-semibold block mb-0.5">Umpan Balik Mentor:</span>
                        <p className="text-gray-300 italic">&ldquo;{card.feedbackMentor || 'Kegiatan disetujui tanpa catatan tambahan.'}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Belum dinilai oleh Mentor Lapangan.</p>
                  )}
                </div>

                {/* Score & Feedback Panel for Advisor (Guru) */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    Penilaian Guru (Pembimbing Internal)
                  </h4>

                  {card.scoreAdvisor !== undefined ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl h-fit flex flex-col items-center justify-center min-w-[75px] shadow-sm">
                          <span className="text-[9px] uppercase font-bold text-amber-400">Guru</span>
                          <span className="text-2xl font-black">{card.scoreAdvisor}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 text-xs">
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400">
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreAdvisorDiscipline}</span>
                              Kedisiplinan
                            </div>
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreAdvisorReport}</span>
                              Laporan
                            </div>
                            <div className="bg-white/2 p-1.5 rounded border border-white/5 text-center">
                              <span className="block font-semibold text-gray-300">{card.scoreAdvisorCommunication}</span>
                              Komunikasi
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-amber-400 font-semibold block mb-0.5">Umpan Balik Guru:</span>
                        <p className="text-gray-300 italic">&ldquo;{card.feedbackAdvisor || 'Belum ada catatan tambahan.'}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Belum dinilai oleh Guru Pembimbing.</p>
                  )}
                </div>

                {/* Grading form for Mentor */}
                {isMentor && (card.columnId === 'review' || card.columnId === 'selesai') && (
                  <form onSubmit={handleMentorGradeSubmit} className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Form Penilaian Mentor Lapangan
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Kedisiplinan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorDiscipline}
                          onChange={(e) => setMentorDiscipline(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Keahlian (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorSkill}
                          onChange={(e) => setMentorSkill(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Sikap (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={mentorAttitude}
                          onChange={(e) => setMentorAttitude(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold block mb-1">Catatan / Umpan Balik Mentor</label>
                      <textarea
                        required
                        rows={2}
                        value={mentorFeedback}
                        onChange={(e) => setMentorFeedback(e.target.value)}
                        placeholder="Berikan umpan balik atau instruksi revisi..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-md transition w-full"
                    >
                      Kirim Penilaian Mentor & Setujui
                    </button>
                  </form>
                )}

                {/* Grading form for Advisor (Guru) */}
                {activeRole === 'Dosen Pembimbing' && (card.columnId === 'review' || card.columnId === 'selesai') && (
                  <form onSubmit={handleAdvisorGradeSubmit} className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Form Penilaian Guru Pembimbing (Internal)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Kedisiplinan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorDiscipline}
                          onChange={(e) => setAdvisorDiscipline(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Laporan (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorReport}
                          onChange={(e) => setAdvisorReport(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold block mb-1">Komunikasi (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={advisorCommunication}
                          onChange={(e) => setAdvisorCommunication(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold block mb-1">Catatan / Umpan Balik Guru</label>
                      <textarea
                        required
                        rows={2}
                        value={advisorFeedback}
                        onChange={(e) => setAdvisorFeedback(e.target.value)}
                        placeholder="Berikan umpan balik atau saran akademik..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-md transition w-full"
                    >
                      Kirim Penilaian Guru
                    </button>
                  </form>
                )}

                {/* Comment Section */}
                <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-indigo-400" />
                    Kolom Diskusi ({card.comments.length})
                  </h4>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {card.comments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-4 text-center">Belum ada diskusi untuk tugas ini.</p>
                    ) : (
                      card.comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col bg-white/2 rounded-xl p-3 border border-white/5">
                          <div className="flex justify-between items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-200">{comment.userName}</span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                comment.role === 'Mentor' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/10' :
                                comment.role === 'Dosen Pembimbing' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' :
                                'bg-indigo-500/15 text-indigo-400 border border-indigo-500/10'
                              }`}>
                                {comment.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
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
                      className="flex-1 bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Sidebar Metrics */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status & Metadata</h4>
                
                <div className="glass rounded-xl p-4 flex flex-col gap-3.5 border border-white/5 text-xs text-gray-300">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Calendar size={13} /> Due Date
                    </span>
                    <span className="font-semibold text-gray-200">{card.dueDate}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock size={13} /> Waktu Mulai
                    </span>
                    <span className="font-semibold text-gray-200">{card.startTime || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock size={13} /> Waktu Selesai
                    </span>
                    <span className="font-semibold text-gray-200">{card.endTime || '-'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Dibuat</span>
                    <span className="text-gray-400">
                      {new Date(card.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-400">Pemilik</span>
                    <span className="font-medium text-gray-300">{state.studentName}</span>
                  </div>
                </div>

                {/* Status Transitions panel */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pindahkan Status</h4>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'rencana', label: 'Rencana Kegiatan' },
                      { id: 'progres', label: 'Sedang Dikerjakan' },
                      { id: 'review', label: 'Butuh Review' },
                      { id: 'selesai', label: 'Selesai (Disetujui)' },
                    ].map((col) => (
                      <button
                        key={col.id}
                        disabled={card.columnId === col.id}
                        onClick={() => updateCardColumn(card.id, col.id as PKLCard['columnId'])}
                        className={`w-full py-1.5 px-3 rounded-xl text-left text-xs font-medium border transition ${
                          card.columnId === col.id
                            ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 cursor-default'
                            : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-300'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={handleDelete}
                  className="mt-auto py-2.5 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 size={13} />
                  <span>Hapus Kegiatan</span>
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
                      <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-white/5 group-hover:bg-indigo-500/10 transition" />
                    )}
                    {/* Indicator Dot */}
                    <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 z-10 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                    {/* Text content */}
                    <div className="flex-1">
                      <p className="text-xs text-gray-200 leading-normal">{log.text}</p>
                      <span className="text-[10px] text-gray-500">
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
