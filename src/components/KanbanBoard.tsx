'use client';

import React, { useState } from 'react';
import { usePKL } from '../context/PKLContext';
import { PKLCard, TaskCategory, PriorityLevel } from '../types/pkl';
import { Plus, Calendar as CalendarIcon, Clock, MessageSquare, Award, Search, Filter, ChevronDown, X, CheckSquare, Tag, AlertCircle, LayoutGrid, List, ChevronLeft, ChevronRight, Eye, ArrowUpDown, TrendingUp, Minus, Maximize2, Trash2, Pencil, Palette, Image as ImageIcon, Sparkles, Check, Loader2 } from 'lucide-react';
import { LogbookTable } from './LogbookTable';
import { BackgroundPicker } from './BackgroundPicker';
import { useLanguage } from '../context/LanguageContext';
import { updateBoardBackgroundAction } from '../app/actions/pkl';

interface KanbanBoardProps {
  onOpenCard: (card: PKLCard) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenCard }) => {
  const { t } = useLanguage();
  const { state, activeRole, addCard, updateCardColumn, currentUser, updateCurrentUserBackground } = usePKL();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedPriority, setSelectedPriority] = useState<string>('Semua');
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // View Mode state ('board' | 'list' | 'calendar')
  const [viewModeType, setViewModeType] = useState<'board' | 'list' | 'calendar'>('board');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Sorting & Column Collapse States (Feature 6: Automation & Flexibility)
  const [sortBy, setSortBy] = useState<'default' | 'dueDate' | 'priority' | 'title'>('default');
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const activeFiltersCount = (searchQuery ? 1 : 0) + (selectedCategory !== 'Semua' ? 1 : 0) + (selectedPriority !== 'Semua' ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  const toggleCollapseColumn = (colId: string) => {
    setCollapsedColumns(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
  };

  // Custom columns state (Trello Feature: Add Another List)
  const [customColumns, setCustomColumns] = useState<{ id: string; title: string; color?: string; bgBadge?: string }[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nebotrack_custom_columns');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    const newCol = {
      id: 'col_' + Date.now(),
      title: newColumnTitle.trim(),
      color: 'border-[#7C3AED]',
      bgBadge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'
    };
    const updated = [...customColumns, newCol];
    setCustomColumns(updated);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('nebotrack_custom_columns', JSON.stringify(updated)); } catch {}
    }
    setNewColumnTitle('');
    setIsAddColumnOpen(false);
  };

  const handleUpdateCustomColumnTitle = (colId: string, newTitleStr: string) => {
    if (!newTitleStr.trim()) return;
    const updated = customColumns.map(c => c.id === colId ? { ...c, title: newTitleStr.trim() } : c);
    setCustomColumns(updated);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('nebotrack_custom_columns', JSON.stringify(updated)); } catch {}
    }
    setEditingColId(null);
  };

  const handleDeleteCustomColumn = (colId: string) => {
    const updated = customColumns.filter(c => c.id !== colId);
    setCustomColumns(updated);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('nebotrack_custom_columns', JSON.stringify(updated)); } catch {}
    }
  };

  const todayString = new Date().toISOString().split('T')[0];

  // Modal / Custom Dropdown States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Coding');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [customCategory, setCustomCategory] = useState('');
  const [newColumnId, setNewColumnId] = useState<PKLCard['columnId']>('rencana');
  const [newDueDate, setNewDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newCollaborators, setNewCollaborators] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getColumnTitle = (id: PKLCard['columnId']) => {
    switch (id) {
      case 'rencana': return t('plan');
      case 'progres': return t('progress');
      case 'review': return t('review');
      case 'selesai': return t('done');
      default: return '';
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationError(null);
    setIsSubmitting(true);

    if (!newStartTime || !newEndTime) {
      setValidationError('Waktu mulai dan waktu selesai wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    const [startH, startM] = newStartTime.split(':').map(Number);
    const [endH, endM] = newEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (endMin < startMin) {
      setValidationError('Waktu selesai harus lebih besar dari waktu mulai.');
      setIsSubmitting(false);
      return;
    }

    if (!newTitle.trim()) {
      setIsSubmitting(false);
      return;
    }

    const isDuplicate = state.cards.some(
      (card) => card.title.trim().toLowerCase() === newTitle.trim().toLowerCase()
    );

    if (isDuplicate) {
      setValidationError('Kegiatan dengan judul tersebut sudah ada. Harap gunakan judul yang berbeda.');
      setIsSubmitting(false);
      return;
    }

    const categoryToSave = newCategory === 'Lainnya' ? customCategory.trim() || 'Lainnya' : newCategory;
    
    const collaboratorNisns = newCollaborators
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    try {
      await addCard(newTitle, newDesc, categoryToSave, newDueDate, newStartTime, newEndTime, newColumnId, collaboratorNisns, newPriority);
      
      setNewTitle('');
      setNewDesc('');
      setNewCategory('Coding');
      setNewPriority('medium');
      setCustomCategory('');
      setNewColumnId('rencana');
      setNewStartTime('');
      setNewEndTime('');
      setNewCollaborators('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getPriorityBadge = (priority?: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
            {t('priorityUrgent')}
          </span>
        );
      case 'high':
        return (
          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 flex items-center gap-1">
            {t('priorityHigh')}
          </span>
        );
      case 'low':
        return (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
            {t('priorityLow')}
          </span>
        );
      case 'medium':
      default:
        return (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
            {t('priorityMedium')}
          </span>
        );
    }
  };

  // Filter cards based on search, category filter, and priority filter
  const rawFilteredCards = state.cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || card.category === selectedCategory;
    const matchesPriority = selectedPriority === 'Semua' || (card.priority || 'medium') === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

  const filteredCards = [...rawFilteredCards].sort((a, b) => {
    if (sortBy === 'priority') {
      const wA = priorityWeights[a.priority || 'medium'] || 2;
      const wB = priorityWeights[b.priority || 'medium'] || 2;
      return wB - wA;
    }
    if (sortBy === 'dueDate') {
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Base Kanban Columns + Custom Columns
  const baseColumns = [
    { id: 'rencana', title: t('plan'), color: 'border-blue-500', bgBadge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
    { id: 'progres', title: t('progress'), color: 'border-amber-500', bgBadge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
    { id: 'review', title: t('review'), color: 'border-purple-500', bgBadge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' },
    { id: 'selesai', title: t('done'), color: 'border-emerald-500', bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
  ];

  const columns = [...baseColumns, ...customColumns];

  // Board Progress summary calculation
  const totalBoardCards = state.cards.length;
  const completedBoardCards = state.cards.filter(c => c.columnId === 'selesai').length;
  const boardProgressPercent = totalBoardCards > 0 ? Math.round((completedBoardCards / totalBoardCards) * 100) : 0;

  const renderCalendarGrid = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurr: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pDate = new Date(year, month - 1, d);
      const mStr = String(pDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${pDate.getFullYear()}-${mStr}-${dStr}`, dayNum: d, isCurr: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${year}-${mStr}-${dStr}`, dayNum: d, isCurr: true });
    }
    const rem = (35 - cells.length > 0) ? (35 - cells.length) : (42 - cells.length);
    for (let d = 1; d <= rem; d++) {
      const nDate = new Date(year, month + 1, d);
      const mStr = String(nDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${nDate.getFullYear()}-${mStr}-${dStr}`, dayNum: d, isCurr: false });
    }

    return (
      <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr">
        {cells.map((cell, idx) => {
          const dayCards = filteredCards.filter(c => c.dueDate === cell.dateStr);
          const isToday = cell.dateStr === todayString;

          return (
            <div
              key={idx}
              className={`min-h-[90px] md:min-h-[110px] p-1.5 md:p-2 rounded-xl border flex flex-col transition ${
                cell.isCurr
                  ? 'bg-white dark:bg-[#243447] border-slate-200 dark:border-gray-700'
                  : 'bg-slate-50/50 dark:bg-gray-800/30 border-slate-100 dark:border-gray-800 text-slate-400'
              } ${isToday ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                    isToday ? 'bg-primary text-white' : cell.isCurr ? 'text-slate-800 dark:text-gray-200' : 'text-slate-400'
                  }`}
                >
                  {cell.dayNum}
                </span>
                {dayCards.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300">
                    {dayCards.length}
                  </span>
                )}
              </div>

              {/* Day Tasks */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[75px] scrollbar-none">
                {dayCards.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onOpenCard(c)}
                    className="p-1 rounded bg-slate-100 dark:bg-gray-800/80 hover:bg-primary hover:text-white dark:hover:bg-primary border border-slate-200 dark:border-gray-700 cursor-pointer transition text-[10px] font-semibold truncate group"
                    title={`${c.title} (${c.category})`}
                  >
                    <div className="truncate flex items-center gap-1">
                      <span>{c.priority === 'urgent' ? '⚡' : c.priority === 'high' ? '🔥' : '📍'}</span>
                      <span className="truncate">{c.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
      alert(t('cantMoveToDone'));
      return;
    }

    if (targetCard.columnId === 'selesai' && activeRole === 'Mahasiswa') {
      alert('Kegiatan yang sudah disetujui (Selesai) tidak dapat dipindahkan kembali.');
      return;
    }

    updateCardColumn(cardId, columnId);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'Coding': return 'bg-primary/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50';
      case 'Design': return 'bg-purple-50 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800/50 dark:bg-purple-500/10';
      case 'Laporan': return 'bg-green-50 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/50 dark:bg-green-500/10';
      case 'Networking': return 'bg-sky-50 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-800/50 dark:bg-sky-500/10';
      default: return 'bg-slate-50 dark:bg-gray-800/50 text-slate-700 dark:text-gray-300 border-slate-100 dark:border-gray-700';
    }
  };

  const getCategoryFilterStyle = (cat: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white dark:bg-[#243447] text-[#64748B] dark:text-gray-300 border-[#E2E8F0] dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] hover:text-[#0F172A] dark:text-gray-200 hover:border-slate-300 dark:border-gray-600';
    }
    switch (cat) {
      case 'Coding':
      case 'Semua':
        return 'bg-primary/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Design':
        return 'bg-purple-50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50 dark:bg-purple-500/10';
      case 'Laporan':
        return 'bg-green-50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 dark:bg-green-500/10';
      case 'Networking':
        return 'bg-sky-50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50 dark:bg-sky-500/10';
      default:
        return 'bg-slate-50 dark:bg-gray-800/50 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700';
    }
  };

  const standardCategories = ['Coding', 'Design', 'Laporan', 'Networking'];
  const existingCategories = Array.from(new Set(state.cards.map(c => c.category)));
  const filterCategories = ['Semua', ...Array.from(new Set([...standardCategories, ...existingCategories]))];

  const boardBg = currentUser?.boardBackground;

  return (
    <div 
      className={`flex flex-col gap-6 font-sans relative ${boardBg ? 'min-h-[calc(100vh-140px)] -mx-4 md:-mx-8 p-4 md:p-8 rounded-b-2xl md:rounded-b-none' : ''}`}
    >
      
      <div className="relative flex flex-col gap-6">
      {/* Streamlined Compact Top Header Control Bar (Trello-Style Sub-Bar) */}
      <div className="sticky top-[56px] md:static z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white/[0.45] dark:bg-[#1E293B]/[0.45] backdrop-blur-md border border-[#E2E8F0]/30 dark:border-gray-700/30 rounded-xl p-2 px-3 md:px-4 shadow-sm -mt-1 md:-mt-2 mb-2">
        {/* Left: Board Title & View Mode Switcher */}
        <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-slate-800 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              Board Kegiatan
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-gray-700 hidden sm:block" />

          {/* View Mode Pills */}
          <div className="flex items-center bg-white/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-slate-200/60 dark:border-gray-700/60 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setViewModeType('board')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewModeType === 'board'
                  ? 'bg-white dark:bg-[#243447] text-primary shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Papan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewModeType('list')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewModeType === 'list'
                  ? 'bg-white dark:bg-[#243447] text-primary shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }`}
            >
              <List size={13} />
              <span>Daftar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewModeType('calendar')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewModeType === 'calendar'
                  ? 'bg-white dark:bg-[#243447] text-primary shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon size={13} />
              <span>Kalender</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Progress, Add Activity & Filter Sidebar Toggle Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-gray-700/60 pt-2 sm:pt-0">
          {totalBoardCards > 0 && (
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-800/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-gray-700/60 text-xs w-full sm:w-auto order-last sm:order-first mt-1 sm:mt-0 justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-[10px] text-slate-500 font-medium sm:hidden">Progres</span>
              </div>
              <div className="flex-1 sm:w-20 bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden mx-2 sm:mx-0">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${boardProgressPercent}%` }}
                />
              </div>
              <span className="font-extrabold text-slate-700 dark:text-gray-300 text-[10px]">
                {boardProgressPercent}%
              </span>
            </div>
          )}

          {activeRole === 'Mahasiswa' && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none flex justify-center items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg shadow-xs hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{t('addActivity')}</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          )}

          <BackgroundPicker />

          <button
            type="button"
            onClick={() => setIsFilterSidebarOpen(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              activeFiltersCount > 0
                ? 'bg-primary text-white border-primary shadow-primary/20'
                : 'bg-white/50 dark:bg-gray-800/50 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-700/80'
            }`}
          >
            <Filter size={13} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-primary text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* -------------------- 1. BOARD VIEW (TRELLO STYLE) -------------------- */}
      {viewModeType === 'board' && (
        <div className="flex flex-col lg:flex-row overflow-x-hidden lg:overflow-x-auto gap-4 lg:gap-3.5 items-start pb-6 pt-1 px-1 scrollbar-thin lg:snap-x lg:snap-mandatory scroll-smooth w-full min-h-[calc(100vh-260px)]">
          {columns.map((col) => {
            const colCards = filteredCards.filter(c => c.columnId === col.id);
            const isOver = draggedOverColumn === col.id;
            const isCollapsed = collapsedColumns.includes(col.id);
            const isCustom = col.id.startsWith('col_');

            if (isCollapsed) {
              return (
                <div
                  key={col.id}
                  onClick={() => toggleCollapseColumn(col.id)}
                  className={`flex flex-row lg:flex-col items-center justify-between lg:justify-start bg-slate-100/90 dark:bg-[#1E293B]/90 border border-slate-200 dark:border-gray-700 border-l-[4px] lg:border-l-0 lg:border-t-[4px] ${col.color || 'border-indigo-500'} p-3 lg:p-4 rounded-2xl transition-all cursor-pointer hover:bg-slate-200/60 dark:hover:bg-gray-700/80 shrink-0 select-none shadow-sm w-full lg:w-14 h-14 lg:h-auto`}
                  title={`Klik untuk membuka kolom ${col.title}`}
                >
                  <div className="flex flex-row lg:flex-col items-center justify-between w-full h-full gap-3">
                    <div className="flex items-center gap-2 lg:flex-col">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleCollapseColumn(col.id); }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 transition cursor-pointer"
                        title="Buka Kolom"
                      >
                        <Maximize2 size={14} />
                      </button>
                      <h3 className="font-bold text-xs text-slate-700 dark:text-gray-200 uppercase tracking-wider lg:[writing-mode:vertical-lr] lg:my-2">
                        {col.title}
                      </h3>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.bgBadge || 'bg-indigo-50 text-indigo-700'}`}>
                      {colCards.length}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-full lg:w-72 lg:shrink-0 lg:snap-center flex flex-col bg-slate-100/85 dark:bg-[#1E293B]/85 backdrop-blur-md border border-slate-200/80 dark:border-gray-700/70 border-t-[4px] ${col.color || 'border-indigo-500'} p-3 rounded-2xl shadow-md transition-all lg:max-h-[calc(100vh-260px)] ${
                  isOver ? 'bg-slate-200/90 ring-2 ring-primary/40 scale-[1.01]' : ''
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between w-full pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-gray-700/60 px-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {editingColId === col.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingColTitle}
                        onChange={(e) => setEditingColTitle(e.target.value)}
                        onBlur={() => handleUpdateCustomColumnTitle(col.id, editingColTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCustomColumnTitle(col.id, editingColTitle);
                          if (e.key === 'Escape') setEditingColId(null);
                        }}
                        className="bg-white dark:bg-gray-900 border border-primary rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-gray-200 font-bold focus:outline-none w-full"
                      />
                    ) : (
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-wide truncate">{col.title}</h3>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${col.bgBadge || 'bg-indigo-50 text-indigo-700'}`}>
                      {colCards.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCustom && editingColId !== col.id && (
                      <button
                        type="button"
                        onClick={() => { setEditingColId(col.id); setEditingColTitle(col.title); }}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 transition cursor-pointer"
                        title="Edit Nama Kolom"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomColumn(col.id)}
                        className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition cursor-pointer"
                        title="Hapus Kolom Kustom"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCollapseColumn(col.id)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 transition cursor-pointer"
                      title="Lipat Kolom"
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                </div>

                {/* Column Cards List */}
                <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[40px] lg:max-h-[calc(100vh-340px)] scrollbar-thin">
                  {colCards.length === 0 ? (
                    <div className="py-5 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-gray-700/50 rounded-xl bg-white/40 dark:bg-gray-800/30 px-3 flex flex-col items-center gap-1">
                      <span className="font-semibold">{col.id === 'selesai' ? t('lockedApproval') : t('empty')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {col.id === 'selesai' ? t('approvalDesc') : t('noActivities')}
                      </span>
                    </div>
                  ) : (
                    colCards.map((card) => {
                      const isOverdue = card.columnId !== 'selesai' && card.dueDate && card.dueDate < todayString;

                      const isOwner = !currentUser || card.studentId === currentUser.id;
                      const isCollaborator = card.collaborators?.some(c => c.id === currentUser?.id);
                      const cardEditorIds = card.editorIds || [];
                      const userCanEdit = isOwner || (isCollaborator && (card.collaboratorsCanEdit || cardEditorIds.includes(currentUser?.id || '')));
                      const isStudentWithoutPermission = activeRole === 'Mahasiswa' && !userCanEdit;

                      return (
                        <div
                          key={card.id}
                          draggable={!(activeRole === 'Mahasiswa' && card.columnId === 'selesai') && !isStudentWithoutPermission}
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          onClick={() => onOpenCard(card)}
                          className={`bg-white/95 dark:bg-[#243447]/95 backdrop-blur-sm border rounded-xl p-3.5 cursor-pointer relative shadow-xs hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-md hover:-translate-y-0.5 transition duration-200 group ${
                            isOverdue
                              ? 'border-red-200 hover:border-red-300 bg-red-50/10'
                              : 'border-[#E2E8F0] dark:border-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(card.category)}`}>
                                {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                              </span>
                              {getPriorityBadge(card.priority)}
                              {isOverdue && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-600 dark:text-red-500 border border-red-100">
                                  {t('late')}
                                </span>
                              )}
                            </div>
                            {card.score !== undefined && (
                              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <Award size={12} />
                                <span>{card.score}</span>
                              </div>
                            )}
                          </div>

                          <h4 className="font-semibold text-slate-800 dark:text-white text-xs md:text-sm mb-1.5 leading-snug group-hover:text-primary transition-colors">
                            {card.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {card.description || t('noDescription')}
                          </p>

                          {/* Subtask progress */}
                          {card.subtasks && card.subtasks.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                                <span className="flex items-center gap-1">
                                  <CheckSquare size={11} className="text-primary" />
                                  <span>Sub-tugas</span>
                                </span>
                                <span>
                                  {card.subtasks.filter(s => s.isCompleted).length}/{card.subtasks.length}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(card.subtasks.filter(s => s.isCompleted).length / card.subtasks.length) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-700/60 font-semibold">
                            <div className="flex items-center gap-1">
                              <CalendarIcon size={12} />
                              <span>{card.dueDate}</span>
                            </div>
                            {card.startTime && card.endTime && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{card.startTime}-{card.endTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inline "+ Tambah Kegiatan" Button at Bottom of List (Excluded for Selesai Column) */}
                {activeRole === 'Mahasiswa' && col.id !== 'selesai' && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewColumnId(col.id as any);
                      setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 p-2.5 hover:bg-slate-200/70 dark:hover:bg-gray-700/60 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold w-full mt-2 cursor-pointer transition"
                  >
                    <Plus size={15} />
                    <span>{t('addActivity')}</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* "+ Tambah Kolom Baru" (Trello-Style Add Another List Button) */}
          <div className="w-[85vw] max-w-[288px] sm:w-72 shrink-0 snap-center">
            {!isAddColumnOpen ? (
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(true)}
                className="w-full flex items-center gap-2.5 p-3.5 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 border border-dashed border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 rounded-2xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Plus size={16} className="text-primary" />
                <span>{t('addCustomColumn')}</span>
              </button>
            ) : (
              <form onSubmit={handleAddCustomColumn} className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-700 p-3.5 rounded-2xl shadow-xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{t('addCustomColumn').replace('+', '').trim()}</h4>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder={t('columnTitlePlaceholder')}
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsAddColumnOpen(false); setNewColumnTitle(''); }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-gray-400 font-bold transition cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    {t('saveAdd')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* -------------------- 2. LIST VIEW -------------------- */}
      {viewModeType === 'list' && (
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A] dark:text-gray-200">
              <thead className="bg-slate-50 dark:bg-gray-800/80 uppercase text-[10px] font-bold text-slate-500 dark:text-gray-400 tracking-wider border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4">Kegiatan</th>
                  <th className="py-3.5 px-3">Kategori</th>
                  <th className="py-3.5 px-3">Prioritas</th>
                  <th className="py-3.5 px-3">Batas Waktu</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60">
                {filteredCards.map((card) => {
                  const isOverdue = card.columnId !== 'selesai' && card.dueDate && card.dueDate < todayString;

                  return (
                    <tr key={card.id} className="hover:bg-slate-50/80 dark:hover:bg-[#2D435E] transition-colors group">
                      <td className="py-3 px-4 max-w-xs">
                        <div 
                          className="font-bold text-slate-800 dark:text-white hover:text-primary cursor-pointer transition line-clamp-1 text-xs"
                          onClick={() => onOpenCard(card)}
                        >
                          {card.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {card.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(card.category)}`}>
                          {card.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPriorityBadge(card.priority)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                          {card.dueDate}
                        </div>
                        {(card.startTime || card.endTime) && (
                          <div className="text-[10px] text-slate-400">
                            {card.startTime || '-'}-{card.endTime || '-'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={card.columnId}
                          disabled={activeRole === 'Mahasiswa' && card.columnId === 'selesai'}
                          onChange={(e) => updateCardColumn(card.id, e.target.value as PKLCard['columnId'])}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold focus:outline-none cursor-pointer ${
                            card.columnId === 'selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                            card.columnId === 'review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            card.columnId === 'progres' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}
                        >
                          <option value="rencana">{t('listRencana')}</option>
                          <option value="progres">{t('listProgres')}</option>
                          <option value="review">{t('listReview')}</option>
                          <option value="selesai">{t('listSelesai')}</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenCard(card)}
                          className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary rounded-lg font-bold text-slate-700 dark:text-gray-300 transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Eye size={12} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="text-3xl mb-2 opacity-50">📖</div>
                      <div>{t('emptyActivities')}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- 3. CALENDAR VIEW -------------------- */}
      {viewModeType === 'calendar' && (
        <div className="bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-2xl shadow-sm p-4 md:p-6 mb-8 flex flex-col gap-4">
          {/* Calendar Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                📅 {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h2>
              <button
                type="button"
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition"
              >
                Hari Ini
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 dark:text-gray-400 uppercase tracking-wider py-1">
            <span>Minggu</span>
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span>Sabtu</span>
          </div>

          {/* Calendar Grid Cells */}
          {renderCalendarGrid()}
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      {activeRole === 'Mahasiswa' && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="md:hidden fixed bottom-36 right-4 z-40 w-12 h-12 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 active:scale-90 transition-transform duration-200"
          title="Tambah Kegiatan"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Modal Tambah Kegiatan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#243447] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-gray-700 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-gray-700">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                {t('addActivity')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-300 hover:text-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleModalSubmit} className="p-5 md:p-6 overflow-y-auto flex flex-col gap-4 text-left">
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-lg text-xs font-semibold animate-in fade-in duration-200">
                  {validationError}
                </div>
              )}
              
              {/* Judul (1. Judul Kegiatan) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('activityTitle')}</label>
                <input
                  type="text"
                  placeholder={t('activityTitlePlaceholder') || 'Judul Kegiatan'}
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              {/* Due Date (Tanggal Selesai) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('dueDate')} (Selesai)</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              {/* Start & End Time (2. Waktu Mulai & 3. Waktu Selesai) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('start')}</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('end')}</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Dropdown (5. Kategori) */}
                <div className="relative text-left">
                  <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider block mb-1.5">{t('category')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsColumnDropdownOpen(false);
                    }}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-left text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#2D435E] transition cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2"
                  >
                    <span>{newCategory === 'Laporan' ? t('report') : newCategory === 'Lainnya' ? t('others') : newCategory}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                      {['Coding', 'Design', 'Laporan', 'Networking', 'Lainnya'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setNewCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#2D435E] flex items-center justify-between cursor-pointer ${newCategory === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-gray-200'}`}
                        >
                          {cat === 'Laporan' ? t('report') : cat === 'Lainnya' ? t('others') : cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column / Progress Status Dropdown (Status) */}
                <div className="relative text-left">
                  <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider block mb-1.5">{t('status')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsColumnDropdownOpen(!isColumnDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-left text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#2D435E] transition cursor-pointer min-h-[48px] py-3 md:min-h-0 md:py-2"
                  >
                    <span>{columns.find(c => c.id === newColumnId)?.title || getColumnTitle(newColumnId)}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isColumnDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {columns.filter(c => c.id !== 'selesai').map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setNewColumnId(col.id as PKLCard['columnId']);
                            setIsColumnDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#2D435E] flex items-center justify-between cursor-pointer ${newColumnId === col.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-gray-200'}`}
                        >
                          <span>{col.title}</span>
                          {newColumnId === col.id && <span className="text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Category Input if 'Lainnya' is selected */}
              {newCategory === 'Lainnya' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('category')}</label>
                  <input
                    type="text"
                    required
                    placeholder="..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                  />
                </div>
              )}

              {/* Priority Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('priorityLevelLabel')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'low', label: t('priorityLow') },
                    { id: 'medium', label: t('priorityMedium') },
                    { id: 'high', label: t('priorityHigh') },
                    { id: 'urgent', label: t('priorityUrgent') },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPriority(p.id as PriorityLevel)}
                      className={`py-2 px-1 text-xs rounded-xl border font-bold transition-all text-center ${
                        newPriority === p.id
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-[#243447] text-slate-600 dark:text-gray-300 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collaborators (NISN) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">
                  NISN Kolaborator (Opsional, pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  placeholder="Misal: 123456, 654321"
                  value={newCollaborators}
                  onChange={(e) => setNewCollaborators(e.target.value)}
                  className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              {/* Deskripsi (6. Deskripsi) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#64748B] dark:text-gray-300 font-semibold uppercase tracking-wider">{t('activityDesc')}</label>
                <textarea
                  placeholder="..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 rounded-xl px-3 text-sm text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px] py-3 md:min-h-0 md:py-2"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col md:flex-row gap-3 justify-end mt-4 border-t border-[#E2E8F0] dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-white dark:bg-[#243447] border border-[#E2E8F0] dark:border-gray-700 text-sm md:text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-[#2D435E] transition cursor-pointer min-h-[48px] md:min-h-0"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-4 py-3 md:py-2 rounded-xl bg-primary hover:bg-primary-hover text-sm md:text-xs font-semibold text-white shadow-sm hover:shadow-primary/10 transition cursor-pointer min-h-[48px] md:min-h-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : t('save')}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
      {/* -------------------- SIDEBAR FILTER & MENU DRAWER (TRELLO STYLE) -------------------- */}
      {isFilterSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsFilterSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1E293B] h-full shadow-2xl z-10 flex flex-col justify-between border-l border-slate-200 dark:border-gray-700/80 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-gray-700/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('filterMenuTitle')}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-gray-400">{t('filterMenuDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterSidebarOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('searchActivityLabel')}
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('searchActivity')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-2 text-xs text-[#0F172A] dark:text-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Kategori / Label */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('categoryLabel')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {filterCategories.map((cat) => {
                    let displayLabel = cat;
                    if (cat === 'Semua') displayLabel = t('all');
                    else if (cat === 'Laporan') displayLabel = t('report');
                    else if (cat === 'Lainnya') displayLabel = t('others');

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all duration-200 cursor-pointer ${getCategoryFilterStyle(cat, selectedCategory === cat)}`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Prioritas */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('priorityFilterLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Semua', label: t('all') },
                    { id: 'urgent', label: t('priorityUrgent') },
                    { id: 'high', label: t('priorityHigh') },
                    { id: 'medium', label: t('priorityMedium') },
                    { id: 'low', label: t('priorityLow') },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPriority(p.id)}
                      className={`text-xs px-3 py-2 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                        selectedPriority === p.id
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-gray-100 dark:text-slate-900 shadow-sm'
                          : 'bg-slate-50 dark:bg-gray-800/80 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urutkan Berdasarkan */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('sortActivityLabel')}
                </label>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'default', label: t('sortDefault') },
                    { id: 'dueDate', label: t('sortDueDate') },
                    { id: 'priority', label: t('sortPriority') },
                    { id: 'title', label: t('sortTitle') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSortBy(item.id as any)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        sortBy === item.id
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-slate-50 dark:bg-gray-800/80 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {sortBy === item.id && <span className="text-primary text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Summary in Drawer */}
              {totalBoardCards > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-primary" />
                      Progres Papan
                    </span>
                    <span className="text-primary">{boardProgressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${boardProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-gray-400">
                    {completedBoardCards} dari {totalBoardCards} kegiatan selesai
                  </span>
                </div>
              )}
            </div>

            {/* Footer / Reset Button */}
            <div className="p-4 border-t border-slate-100 dark:border-gray-700/80 bg-slate-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3">
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                    setSelectedPriority('Semua');
                    setSortBy('default');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Reset Semua Filter ({activeFiltersCount})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFilterSidebarOpen(false)}
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Terapkan & Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
