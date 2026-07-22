'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Loader2, Trash2 } from 'lucide-react';
import { getSecretNotesAction, addSecretNoteAction, deleteSecretNoteAction } from '@/app/actions/secretNotes';
import { usePKL } from '../context/PKLContext';
import { PARTICIPANT_ROLES } from '@/lib/constants';

interface SecretNote {
  id: string;
  text: string;
  authorName: string;
  authorRole: string;
  createdAt: string | Date;
  authorId: string;
}

interface SecretNotesPanelProps {
  studentId: string;
}

export function SecretNotesPanel({ studentId }: SecretNotesPanelProps) {
  const { currentUser } = usePKL();
  const [notes, setNotes] = useState<SecretNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !currentUser || PARTICIPANT_ROLES.includes(currentUser.role)) return;
    
    const fetchNotes = async () => {
      setIsLoading(true);
      const res = await getSecretNotesAction(studentId);
      if (res.success && res.notes) {
        setNotes(res.notes as SecretNote[]);
      }
      setIsLoading(false);
    };
    
    fetchNotes();
  }, [studentId, currentUser]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addSecretNoteAction(studentId, newNote);
    if (res.success && res.note) {
      setNotes([...notes, res.note as SecretNote]);
      setNewNote('');
    } else {
      alert(res.error || 'Gagal menambahkan catatan.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Hapus catatan ini?')) return;
    
    setDeletingId(noteId);
    const res = await deleteSecretNoteAction(noteId);
    if (res.success) {
      setNotes(notes.filter(n => n.id !== noteId));
    } else {
      alert(res.error || 'Gagal menghapus catatan.');
    }
    setDeletingId(null);
  };

  if (!currentUser || PARTICIPANT_ROLES.includes(currentUser.role)) return null;

  return (
    <div className="flex flex-col h-[500px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl shadow-indigo-900/10">
      {/* Header */}
      <div className="bg-indigo-950 p-5 pb-4 border-b border-indigo-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-100 text-base">Evaluasi Rahasia</h3>
            <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
              Hanya terlihat oleh Guru Pembimbing & Mentor
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-indigo-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
            <ShieldAlert size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">Belum ada catatan evaluasi rahasia.</p>
          </div>
        ) : (
          notes.map((note) => {
            const isMine = note.authorId === currentUser.id;
            return (
              <div key={note.id} className={`flex flex-col max-w-[85%] ${isMine ? 'self-end' : 'self-start'}`}>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400">
                    {note.authorName} <span className="text-indigo-400 ml-1">({note.authorRole === 'EXTERNAL_MENTOR' ? 'Mentor' : 'Guru'})</span>
                  </span>
                </div>
                <div 
                  className={`relative group p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isMine 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                  }`}
                >
                  {note.text}
                  
                  {isMine && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    >
                      {deletingId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1 text-right">
                  {new Date(note.createdAt).toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleAddNote} className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Tulis pesan rahasia (Guru / Mentor)..."
            disabled={isSubmitting}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newNote.trim() || isSubmitting}
            className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
