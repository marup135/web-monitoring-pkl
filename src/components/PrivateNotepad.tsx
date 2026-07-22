'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getStudentNotesAction, addStudentNoteAction, updateStudentNoteAction, deleteStudentNoteAction } from '@/app/actions/notes';
import { StickyNote, X, Loader2, Save, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePKL } from '../context/PKLContext';
import { PARTICIPANT_ROLES } from '@/lib/constants';

interface Note {
  id: string;
  text: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function PrivateNotepad() {
  const { currentUser } = usePKL();
  const { t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = async () => {
    setIsLoading(true);
    const res = await getStudentNotesAction();
    if (res.success && res.notes) {
      setNotes(res.notes);
    }
    setIsLoading(false);
  };

  const handleAddNote = async () => {
    setIsSaving(true);
    const res = await addStudentNoteAction('');
    if (res.success && res.note) {
      setNotes([res.note, ...notes]);
      setEditingId(res.note.id);
      setEditingText('');
    }
    setIsSaving(false);
  };

  const handleSaveNote = async (id: string) => {
    setIsSaving(true);
    const res = await updateStudentNoteAction(id, editingText);
    if (res.success && res.note) {
      setNotes(notes.map(n => n.id === id ? res.note : n));
      setEditingId(null);
    }
    setIsSaving(false);
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
    
    setDeletingId(id);
    const res = await deleteStudentNoteAction(id);
    if (res.success) {
      setNotes(notes.filter(n => n.id !== id));
      if (editingId === id) setEditingId(null);
    }
    setDeletingId(null);
  };

  if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200"
        title="Catatan Pribadi"
      >
        <StickyNote size={24} />
      </button>

      {/* Notepad Panel */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-[500px] max-h-[calc(100vh-140px)] bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl overflow-hidden border-2 border-yellow-200 dark:border-yellow-700/50 shadow-2xl shadow-yellow-900/10 backdrop-blur-xl">
          {/* Header */}
          <div className="bg-yellow-400 dark:bg-yellow-600 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-50">
              <StickyNote size={18} />
              <h3 className="font-bold text-sm tracking-wide">Catatan Pribadi</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNote}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-yellow-500 dark:hover:bg-yellow-500 text-yellow-900 dark:text-yellow-50 transition disabled:opacity-50"
                title="Tambah Catatan"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-yellow-500 dark:hover:bg-yellow-500 text-yellow-900 dark:text-yellow-50 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-yellow-600/60 dark:text-yellow-400/60 gap-2">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-xs font-semibold">Memuat catatan...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-yellow-600/60 dark:text-yellow-400/60 gap-3 text-center px-4">
                <StickyNote size={40} className="opacity-50" />
                <p className="text-sm font-medium">Belum ada catatan.</p>
                <p className="text-xs">Klik tombol + di atas untuk membuat catatan baru.</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white/80 dark:bg-black/20 rounded-xl p-3 shadow-sm border border-yellow-200/50 dark:border-yellow-700/30 group">
                  {editingId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder="Tulis catatan di sini..."
                        className="w-full h-32 bg-transparent border-none p-0 text-sm focus:ring-0 resize-none text-slate-700 dark:text-gray-200"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pt-2 border-t border-yellow-200 dark:border-yellow-700/50">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 transition"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveNote(note.id)}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-500">
                          {new Date(note.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingId(note.id);
                              setEditingText(note.text);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-500 transition"
                            title="Edit Catatan"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingId === note.id}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                            title="Hapus Catatan"
                          >
                            {deletingId === note.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {note.text || <span className="text-slate-400 italic">Catatan kosong...</span>}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
