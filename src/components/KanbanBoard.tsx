'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, TaskCategory } from '../types/pkl';
import { Plus, Calendar, Clock, MessageSquare, Award, Search, Filter, ChevronDown, X } from 'lucide-react';

interface KanbanBoardProps {
  onOpenCard: (card: PKLCard) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenCard }) => {
  const { state, activeRole, addCard, updateCardColumn } = usePKL();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const todayString = new Date().toISOString().split('T')[0];

  // Modal / Custom Dropdown States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Coding');
  const [customCategory, setCustomCategory] = useState('');
  const [newColumnId, setNewColumnId] = useState<PKLCard['columnId']>('rencana');
  const [newDueDate, setNewDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  const getColumnTitle = (id: PKLCard['columnId']) => {
    switch (id) {
      case 'rencana': return 'Rencana Kegiatan';
      case 'progres': return 'Sedang Dikerjakan';
      case 'review': return 'Butuh Review';
      case 'selesai': return 'Selesai (Disetujui)';
      default: return '';
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const categoryToSave = newCategory === 'Lainnya' ? customCategory.trim() || 'Lainnya' : newCategory;
    addCard(newTitle, newDesc, categoryToSave, newDueDate, newColumnId);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Coding');
    setCustomCategory('');
    setNewColumnId('rencana');
    setIsAddModalOpen(false);
  };

  // Filter cards based on search and category filter
  const filteredCards = state.cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: { id: PKLCard['columnId']; title: string; color: string; ringColor: string; bgBadge: string }[] = [
    { id: 'rencana', title: 'Rencana Kegiatan', color: 'border-t-slate-400', ringColor: 'focus-within:ring-slate-500/10', bgBadge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 border border-slate-200 dark:border-slate-700/50' },
    { id: 'progres', title: 'Sedang Dikerjakan', color: 'border-t-blue-500', ringColor: 'focus-within:ring-blue-500/10', bgBadge: 'bg-blue-50 text-blue-700 border border-blue-100' },
    { id: 'review', title: 'Butuh Review', color: 'border-t-yellow-500', ringColor: 'focus-within:ring-yellow-500/10', bgBadge: 'bg-yellow-50 text-yellow-700 border border-yellow-100' },
    { id: 'selesai', title: 'Selesai (Disetujui)', color: 'border-t-green-500', ringColor: 'focus-within:ring-green-500/10', bgBadge: 'bg-green-50 text-green-700 border border-green-100' }
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

    if (columnId === 'selesai' && activeRole === 'Mahasiswa') {
      alert('Anda tidak dapat memindahkan kegiatan langsung ke kolom Selesai. Kegiatan harus dinilai/direview terlebih dahulu oleh Pembimbing.');
      return;
    }

    updateCardColumn(cardId, columnId);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'Coding': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Design': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Laporan': return 'bg-green-50 text-green-700 border-green-100';
      case 'Networking': return 'bg-sky-50 text-sky-700 border-sky-100';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryFilterStyle = (cat: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#0F172A] dark:text-white hover:border-slate-300 dark:border-slate-600';
    }
    switch (cat) {
      case 'Coding':
      case 'Semua':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Design':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Laporan':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Networking':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 border-slate-200 dark:border-slate-700';
    }
  };

  const standardCategories = ['Coding', 'Design', 'Laporan', 'Networking'];
  const existingCategories = Array.from(new Set(state.cards.map(c => c.category)));
  const filterCategories = ['Semua', ...Array.from(new Set([...standardCategories, ...existingCategories]))];

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] dark:text-white font-sans">
      {/* Filtering and Search Controls */}
      <div className="sticky top-[56px] md:static z-30 flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 border-b md:border border-[#E2E8F0] dark:border-slate-700 md:rounded-2xl p-4 md:shadow-sm -mx-4 md:mx-0">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto flex-1">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 md:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 md:bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-full md:rounded-xl pl-11 md:pl-10 pr-4 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] min-h-[48px] py-3 md:min-h-0 md:py-2 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-2 scrollbar-none scroll-smooth mask-linear-fade">
            <Filter size={16} className="text-gray-400 shrink-0 hidden md:block" />
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-sm md:text-xs px-4 py-2 md:px-3 md:py-1.5 rounded-full md:rounded-lg border font-medium whitespace-nowrap transition-all duration-300 cursor-pointer min-h-[40px] md:min-h-0 ${getCategoryFilterStyle(cat, selectedCategory === cat)}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {activeRole === 'Mahasiswa' && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex w-full lg:w-auto px-4 py-3 md:py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm md:text-xs rounded-xl shadow-sm transition items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer min-h-[48px] md:min-h-0"
          >
            <Plus size={14} />
            <span>Tambah Kegiatan</span>
          </button>
        )}
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 pb-20 md:pb-4 items-start scroll-smooth">
        {columns.map((col) => {
          const colCards = filteredCards.filter(c => c.columnId === col.id);
          const isOver = draggedOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-transparent md:bg-[#F1F5F9] dark:bg-slate-700 md:border border-[#E2E8F0] dark:border-slate-700 md:border-t-[4px] md:${col.color} md:p-4 md:rounded-2xl md:shadow-sm transition-all w-full md:min-h-[500px] h-fit md:shrink-1 ${
                isOver ? 'md:bg-slate-200/60 ring-2 ring-[#2563EB]/15 scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/50 px-2 md:px-0">
                <div className={`w-3 h-3 rounded-full md:hidden ${col.bgBadge.split(' ')[0]} border ${col.bgBadge.split(' ')[2]}`} />
                <h3 className="font-bold text-[#0F172A] dark:text-white text-base md:text-sm tracking-wide md:font-semibold flex-1">{col.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 md:px-2 md:py-0.5 rounded-full ${col.bgBadge}`}>
                  {colCards.length} Task
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex flex-col gap-4 md:gap-3 flex-1 md:overflow-y-auto md:max-h-[600px] md:pr-1 px-1 md:px-0">
                {colCards.map((card) => {
                  const isOverdue = card.columnId !== 'selesai' && card.dueDate && card.dueDate < todayString;

                  return (
                    <div
                      key={card.id}
                      draggable={activeRole !== 'Dosen Pembimbing'}
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => onOpenCard(card)}
                      className={`bg-white dark:bg-slate-800 border rounded-2xl md:rounded-xl p-5 md:p-4 cursor-pointer relative shadow-sm hover:border-slate-300 dark:border-slate-600 hover:shadow transition duration-200 group ${
                        isOverdue
                          ? 'border-red-200 hover:border-red-300 bg-red-50/10'
                          : 'border-[#E2E8F0] dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(card.category)}`}>
                            {card.category}
                          </span>
                          {isOverdue && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-100">
                              Terlambat
                            </span>
                          )}
                        </div>
                        {card.score !== undefined && (
                          <div className="flex items-center gap-1 text-[#22C55E] bg-green-50 px-2 py-0.5 rounded border border-green-100 text-[11px] font-bold">
                            <Award size={12} />
                            <span>{card.score}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 mb-2 group-hover:text-[#2563EB] transition-colors">
                        {card.title}
                      </h4>

                      <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                        {card.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 border-t border-[#E2E8F0] dark:border-slate-700 pt-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span className={isOverdue ? 'text-[#EF4444] font-bold' : ''}>
                            {card.dueDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {(card.startTime || card.endTime) && (
                            <div className="flex items-center gap-1 text-[#64748B] dark:text-slate-400">
                              <Clock size={12} className="text-[#2563EB]" />
                              <span>{card.startTime || '-'}-{card.endTime || '-'}</span>
                            </div>
                          )}
                          {card.comments.length > 0 && (
                            <div className="flex items-center gap-0.5">
                              <MessageSquare size={12} className="text-gray-400" />
                              <span>{card.comments.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50/50 md:bg-white/40 rounded-2xl md:rounded-xl p-8 text-center text-[#64748B] dark:text-slate-400 h-40 md:h-32">
                    <div className="text-4xl mb-3 md:mb-2 opacity-50">📖</div>
                    <span className="text-sm md:text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Belum ada kegiatan.</span>
                    {activeRole === 'Mahasiswa' && col.id === 'rencana' && (
                       <button
                         onClick={() => setIsAddModalOpen(true)}
                         className="text-xs text-[#2563EB] font-bold mt-2 md:hidden bg-blue-50 px-4 py-2 rounded-full active:scale-95 transition-transform"
                       >
                         + Tambah Kegiatan
                       </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button (Mobile Only) */}
      {activeRole === 'Mahasiswa' && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-full flex items-center justify-center text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] active:scale-90 transition-transform duration-200"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal Tambah Kegiatan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-slate-700 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-slate-700">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-[#2563EB]" />
                Tambah Kegiatan Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleModalSubmit} className="p-5 md:p-6 overflow-y-auto flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider">Judul Rencana Kegiatan</label>
                <input
                  type="text"
                  placeholder="Masukkan judul kegiatan..."
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] min-h-[48px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider">Deskripsi Singkat</label>
                <textarea
                  placeholder="Masukkan deskripsi detail kegiatan..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none min-h-[80px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div className="relative text-left">
                  <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Kategori</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsColumnDropdownOpen(false);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-left text-sm text-[#0F172A] dark:text-white focus:outline-none flex justify-between items-center hover:bg-slate-50 dark:bg-slate-800/50 transition cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2"
                  >
                    <span>{newCategory}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
                      {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setNewCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between cursor-pointer ${newCategory === cat ? 'bg-blue-50 text-[#2563EB] font-semibold' : 'text-slate-700'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column / Progress Status Dropdown */}
                <div className="relative text-left">
                  <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Status Proses</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsColumnDropdownOpen(!isColumnDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-left text-sm text-[#0F172A] dark:text-white focus:outline-none flex justify-between items-center hover:bg-slate-50 dark:bg-slate-800/50 transition cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2"
                  >
                    <span>{getColumnTitle(newColumnId)}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isColumnDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
                      {[
                        { id: 'rencana', title: 'Rencana Kegiatan' },
                        { id: 'progres', title: 'Sedang Dikerjakan' },
                        { id: 'review', title: 'Butuh Review' }
                      ].map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setNewColumnId(col.id as PKLCard['columnId']);
                            setIsColumnDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between cursor-pointer ${newColumnId === col.id ? 'bg-blue-50 text-[#2563EB] font-semibold' : 'text-slate-700'}`}
                        >
                          {col.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Category Input if 'Lainnya' is selected */}
              {newCategory === 'Lainnya' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider">Isi Kategori Lainnya</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama kategori baru..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] min-h-[48px] py-3 md:min-h-0 md:py-2"
                  />
                </div>
              )}

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider">Tenggat Waktu</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] min-h-[48px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col md:flex-row gap-3 justify-end mt-4 border-t border-[#E2E8F0] dark:border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-sm md:text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 transition cursor-pointer min-h-[48px] md:min-h-0"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-sm md:text-xs font-semibold text-white shadow-sm hover:shadow-indigo-500/10 transition cursor-pointer min-h-[48px] md:min-h-0"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
