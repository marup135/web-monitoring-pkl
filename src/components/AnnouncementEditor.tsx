'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Megaphone, Save, Check, Trash2, Plus, Edit2, X } from 'lucide-react';
import { getTargetAnnouncementsAction, addAnnouncementAction, updateAnnouncementAction, deleteAnnouncementAction } from '@/app/actions/announcements';
import { usePKL } from '../context/PKLContext';

interface AnnouncementEditorProps {
  type: 'class' | 'company';
  targetId: string;
  targetName: string;
}

export function AnnouncementEditor({ type, targetId, targetName }: AnnouncementEditorProps) {
  const { currentUser } = usePKL();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [targetId]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const res = await getTargetAnnouncementsAction(type, targetId);
    if (res.success && res.announcements) {
      setAnnouncements(res.announcements);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setIsSaving(true);
    const res = await addAnnouncementAction(type, targetId, newText);
    if (res.success && res.announcement) {
      setAnnouncements([res.announcement, ...announcements]);
      setNewText('');
      setIsAdding(false);
    } else {
      alert(res.error || 'Gagal menambahkan pengumuman.');
    }
    setIsSaving(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    setIsSaving(true);
    const res = await updateAnnouncementAction(id, editingText);
    if (res.success && res.announcement) {
      setAnnouncements(announcements.map(a => a.id === id ? res.announcement : a));
      setEditingId(null);
    } else {
      alert(res.error || 'Gagal menyimpan pengumuman.');
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    setDeletingId(id);
    const res = await deleteAnnouncementAction(id);
    if (res.success) {
      setAnnouncements(announcements.filter(a => a.id !== id));
      if (editingId === id) setEditingId(null);
    } else {
      alert(res.error || 'Gagal menghapus pengumuman.');
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <Megaphone size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm uppercase tracking-wider">
            Pengumuman {type === 'class' ? 'Kelas' : 'Perusahaan'}: <span className="text-blue-600 dark:text-blue-400">{targetName}</span>
          </h3>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus size={14} />
            Buat Pengumuman
          </button>
        )}
      </div>
      
      <p className="text-[11px] text-blue-600/80 dark:text-blue-300/70 mb-4 leading-relaxed">
        Tulis pesan atau pengumuman yang akan tampil di dashboard semua siswa yang berada di {type === 'class' ? 'kelas' : 'perusahaan'} ini. Anda bisa membuat banyak pengumuman.
      </p>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-5 bg-white/70 dark:bg-black/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Tulis pengumuman baru di sini..."
            className="w-full h-24 bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0 resize-none text-[#0F172A] dark:text-gray-200 mb-2"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-blue-100 dark:border-blue-800/50">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 transition"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={isSaving || !newText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Posting
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : announcements.length === 0 ? (
          <div className="text-center p-4 text-xs text-blue-600/60 dark:text-blue-400/60 italic">Belum ada pengumuman.</div>
        ) : (
          announcements.map(item => (
            <div key={item.id} className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30 group">
              {editingId === item.id ? (
                <div>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full h-20 bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0 resize-none text-[#0F172A] dark:text-gray-200 mb-2"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-100 dark:border-blue-800/50">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={isSaving || !editingText.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all disabled:opacity-70"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-blue-800 dark:text-blue-300">{item.author?.name || 'Seseorang'}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {currentUser && (item.authorId === currentUser.id || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INSTITUTION_ADMIN') && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(item.id); setEditingText(item.text); }}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                          title="Hapus"
                        >
                          {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {item.text}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
