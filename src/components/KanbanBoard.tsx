'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, TaskCategory } from '../types/pkl';
import { Plus, Calendar, Clock, MessageSquare, Award, Search, Filter, BookOpen, ChevronDown } from 'lucide-react';

interface KanbanBoardProps {
  onOpenCard: (card: PKLCard) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenCard }) => {
  const { state, activeRole, addCard, updateCardColumn } = usePKL();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Inline card creation form
  const [activeAddColumn, setActiveAddColumn] = useState<PKLCard['columnId'] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Coding');
  const [customCategory, setCustomCategory] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  const handleAddCardSubmit = (e: React.FormEvent, colId: PKLCard['columnId']) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const categoryToSave = newCategory === 'Lainnya' ? customCategory.trim() || 'Lainnya' : newCategory;
    addCard(newTitle, newDesc, categoryToSave, newDueDate, colId);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Coding');
    setCustomCategory('');
    setActiveAddColumn(null);
  };

  // Filter cards based on search and category filter
  const filteredCards = state.cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: { id: PKLCard['columnId']; title: string; color: string; ringColor: string; bgBadge: string }[] = [
    { id: 'rencana', title: 'Rencana Kegiatan', color: 'border-t-slate-500', ringColor: 'focus-within:ring-slate-500/20', bgBadge: 'bg-slate-500/10 text-slate-300' },
    { id: 'progres', title: 'Sedang Dikerjakan', color: 'border-t-indigo-500', ringColor: 'focus-within:ring-indigo-500/20', bgBadge: 'bg-indigo-500/10 text-indigo-300' },
    { id: 'review', title: 'Butuh Review', color: 'border-t-amber-500', ringColor: 'focus-within:ring-amber-500/20', bgBadge: 'bg-amber-500/10 text-amber-300' },
    { id: 'selesai', title: 'Selesai (Disetujui)', color: 'border-t-emerald-500', ringColor: 'focus-within:ring-emerald-500/20', bgBadge: 'bg-emerald-500/10 text-emerald-300' }
  ];

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: PKLCard['columnId']) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const targetCard = state.cards.find(c => c.id === cardId);
    if (!targetCard) return;

    // Student is allowed to drag cards into any column in their personal logbook

    if (activeRole === 'Mentor') {
      // Mentor can drag back or to Selesai but usually shouldn't create new student tasks
    }

    if (activeRole === 'Dosen Pembimbing') {
      alert('Dosen Pembimbing hanya memiliki hak pantau (View-only) pada board utama.');
      return;
    }

    updateCardColumn(cardId, columnId);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'Coding': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'Design': return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'Laporan': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'Networking': return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  const getCategoryFilterStyle = (cat: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white/2 text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-300 hover:border-white/10';
    }
    switch (cat) {
      case 'Coding':
      case 'Semua':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Design':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Laporan':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Networking':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const standardCategories = ['Coding', 'Design', 'Laporan', 'Networking'];
  const existingCategories = Array.from(new Set(state.cards.map(c => c.category)));
  const filterCategories = ['Semua', ...Array.from(new Set([...standardCategories, ...existingCategories]))];

  return (
    <div className="flex flex-col gap-6">
      {/* Filtering and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/3 border border-white/5 rounded-2xl p-4 glass">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari tugas atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/2 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-1">
          <Filter size={16} className="text-gray-400 shrink-0" />
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${getCategoryFilterStyle(cat, selectedCategory === cat)}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const colCards = filteredCards.filter(c => c.columnId === col.id);
          const isOver = draggedOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl glass transition-all border border-white/5 border-t-[5px] ${col.color} p-4 min-h-[500px] ${
                isOver ? 'bg-white/5 ring-2 ring-indigo-500/20 scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 text-sm tracking-wide">{col.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.bgBadge}`}>
                  {colCards.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable={activeRole !== 'Dosen Pembimbing'}
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onClick={() => onOpenCard(card)}
                    className="glass-card rounded-xl p-4 cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(card.category)}`}>
                        {card.category}
                      </span>
                      {card.score !== undefined && (
                        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px] font-bold">
                          <Award size={12} />
                          <span>{card.score}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-200 text-sm line-clamp-2 mb-2 group-hover:text-indigo-400">
                      {card.title}
                    </h4>

                    <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                      {card.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-500" />
                        <span className={new Date(card.dueDate) < new Date() && card.columnId !== 'selesai' ? 'text-rose-400 font-medium' : ''}>
                          {card.dueDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {(card.startTime || card.endTime) && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={12} className="text-indigo-400" />
                            <span>{card.startTime || '-'}-{card.endTime || '-'}</span>
                          </div>
                        )}
                        {card.comments.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <MessageSquare size={12} className="text-gray-500" />
                            <span>{card.comments.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colCards.length === 0 && activeAddColumn !== col.id && (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-8 text-center text-gray-500 h-32">
                    <BookOpen size={20} className="mb-1 text-gray-600" />
                    <span className="text-xs">Belum ada kegiatan</span>
                  </div>
                )}
              </div>

              {/* Add Card Form in any Column */}
              {activeRole === 'Mahasiswa' && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  {activeAddColumn === col.id ? (
                    <form onSubmit={(e) => handleAddCardSubmit(e, col.id)} className="flex flex-col gap-3 p-3 bg-white/2 rounded-xl border border-white/5">
                      <input
                        type="text"
                        placeholder="Judul rencana kegiatan..."
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                      />
                      <textarea
                        placeholder="Deskripsi singkat..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Kategori</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-200 focus:outline-none flex justify-between items-center hover:border-indigo-500/50 transition cursor-pointer"
                              >
                                <span>{newCategory}</span>
                                <ChevronDown size={12} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {isDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-slate-950/95 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden glass">
                                  {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => {
                                        setNewCategory(cat);
                                        setIsDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-indigo-500/10 hover:text-indigo-300 flex items-center justify-between cursor-pointer ${newCategory === cat ? 'bg-indigo-500/15 text-indigo-400 font-semibold' : 'text-gray-300'}`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Tenggat Waktu</label>
                            <input
                              type="date"
                              value={newDueDate}
                              onChange={(e) => setNewDueDate(e.target.value)}
                              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none"
                            />
                          </div>
                        </div>
                        {newCategory === 'Lainnya' && (
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Isi Kategori Lainnya</label>
                            <input
                              type="text"
                              required
                              placeholder="Kategori baru..."
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => setActiveAddColumn(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 font-medium transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[11px] text-white font-medium shadow-md transition"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAddColumn(col.id);
                        setNewTitle('');
                        setNewDesc('');
                      }}
                      className="w-full py-2 border border-dashed border-white/10 hover:border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-indigo-300 bg-white/2 hover:bg-indigo-500/5 transition duration-300"
                    >
                      <Plus size={14} />
                      <span>Tambah Kegiatan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
