'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, TaskCategory } from '../types/pkl';
import { X, Calendar, Clock, MessageSquare, Award, Trash2, Edit2, Send, History, CheckCircle } from 'lucide-react';

interface CardModalProps {
  card: PKLCard;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const { activeRole, state, updateCardDetails, addComment, gradeCard, deleteCard, updateCardColumn } = usePKL();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Edit Mode states (for Student)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description);
  const [editCategory, setEditCategory] = useState<TaskCategory>(card.category);
  const [editDueDate, setEditDueDate] = useState(card.dueDate);
  const [editHours, setEditHours] = useState(card.hoursLogged);

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Grading / edit states for student notes
  const [editScore, setEditScore] = useState<number | ''>(card.score !== undefined ? card.score : '');
  const [editFeedback, setEditFeedback] = useState(card.feedback || '');

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateCardDetails(
      card.id,
      editTitle,
      editDesc,
      editCategory,
      editDueDate,
      Number(editHours),
      editScore !== '' ? Number(editScore) : null,
      editFeedback
    );
    setIsEditing(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(card.id, commentText);
    setCommentText('');
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gradeCard(card.id, editScore !== '' ? Number(editScore) : 0, editFeedback);
    onClose();
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

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Kategori</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none"
                          >
                            <option value="Coding">Coding</option>
                            <option value="Design">Design</option>
                            <option value="Laporan">Laporan</option>
                            <option value="Networking">Networking</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
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
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Jam Kerja</label>
                          <input
                            type="number"
                            min="0"
                            value={editHours}
                            onChange={(e) => setEditHours(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-1">
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Nilai Mentor (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Belum dinilai"
                            value={editScore}
                            onChange={(e) => setEditScore(e.target.value !== '' ? Number(e.target.value) : '')}
                            className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase">Catatan / Umpan Balik Mentor</label>
                          <input
                            type="text"
                            placeholder="Catatan dari pembimbing lapangan..."
                            value={editFeedback}
                            onChange={(e) => setEditFeedback(e.target.value)}
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
                            setEditCategory(card.category);
                            setEditDueDate(card.dueDate);
                            setEditHours(card.hoursLogged);
                            setEditScore(card.score !== undefined ? card.score : '');
                            setEditFeedback(card.feedback || '');
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

                {/* Score & Feedback Panel (If Graded) */}
                {card.score !== undefined && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg h-fit flex flex-col items-center justify-center min-w-[70px]">
                      <span className="text-[10px] uppercase font-bold text-emerald-500">Nilai</span>
                      <span className="text-2xl font-black">{card.score}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle size={14} />
                        Persetujuan & Umpan Balik Mentor
                      </h4>
                      <p className="text-sm text-gray-300 italic">
                        &ldquo;{card.feedback || 'Kegiatan disetujui tanpa catatan tambahan.'}&rdquo;
                      </p>
                    </div>
                  </div>
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
                      <Clock size={13} /> Jam Kerja
                    </span>
                    <span className="font-semibold text-gray-200">{card.hoursLogged} jam</span>
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
