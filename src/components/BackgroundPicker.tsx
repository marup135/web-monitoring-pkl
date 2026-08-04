'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { usePKL } from '../context/PKLContext';
import { updateBoardBackgroundAction, uploadBoardBackgroundAction } from '../app/actions/pkl';
import { useLanguage } from '../context/LanguageContext';

export const BackgroundPicker: React.FC = () => {
  const { currentUser, updateCurrentUserBackground } = usePKL();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [customBgInput, setCustomBgInput] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSetBuiltinBackground = async (url: string | null) => {
    updateCurrentUserBackground(url);
    try {
      await updateBoardBackgroundAction(url);
    } catch (err) {
      console.error('Failed to set background', err);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too big. Max 2MB");
      return;
    }

    setIsUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadBoardBackgroundAction(formData);
      if (result.success && result.url) {
        updateCurrentUserBackground(result.url);
        await updateBoardBackgroundAction(result.url);
      } else {
        alert(result.error || 'Failed to upload background');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploadingBackground(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700"
        title="Ubah Latar Board"
      >
        <ImageIcon size={14} className="text-slate-500 dark:text-gray-400" />
        <span className="hidden sm:inline">Latar</span>
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 w-[90vw] max-w-[320px] sm:w-80 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ImageIcon size={16} className="text-primary" />
              Ganti Latar
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Solid Colors */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Warna Solid</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetBuiltinBackground(null)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${!currentUser?.boardBackground ? 'border-primary shadow-sm' : 'border-slate-200 dark:border-gray-600'} bg-slate-100 dark:bg-gray-700 flex items-center justify-center`}
                  title="Default"
                >
                  {!currentUser?.boardBackground && <Check size={14} className="text-slate-600 dark:text-gray-300" />}
                </button>
                {(
                  [
                    { color: '#2563EB' }, { color: '#10B981' }, { color: '#8B5CF6' }, { color: '#F97316' },
                    { color: '#047857' }, { color: '#1E3A8A' }, { color: '#475569' },
                  ] as const
                ).map(t => (
                  <button
                    key={t.color}
                    onClick={() => handleSetBuiltinBackground(t.color)}
                    className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center ${currentUser?.boardBackground === t.color ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''}`}
                    style={{ backgroundColor: t.color }}
                  >
                    {currentUser?.boardBackground === t.color && <Check size={14} className="text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradients */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Gradien</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { bg: 'linear-gradient(to right, #3b82f6, #2dd4bf)' },
                    { bg: 'linear-gradient(to right, #8b5cf6, #d946ef)' },
                    { bg: 'linear-gradient(to right, #f97316, #eab308)' },
                    { bg: 'linear-gradient(to right, #047857, #10b981)' },
                    { bg: 'linear-gradient(to right, #1e3a8a, #8b5cf6)' },
                  ] as const
                ).map(t => (
                  <button
                    key={t.bg}
                    onClick={() => handleSetBuiltinBackground(t.bg)}
                    className={`w-12 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center ${currentUser?.boardBackground === t.bg ? 'ring-2 ring-offset-1 ring-primary scale-105' : ''}`}
                    style={{ background: t.bg }}
                  >
                    {currentUser?.boardBackground === t.bg && <Check size={14} className="text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpapers */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Wallpaper Alam</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'mountain', label: 'Gunung', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=800&q=80' },
                    { id: 'beach', label: 'Pantai', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
                    { id: 'space', label: 'Bintang', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80' },
                    { id: 'forest', label: 'Hutan', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80' },
                  ] as const
                ).map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => handleSetBuiltinBackground(wp.url)}
                    className={`h-14 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center relative overflow-hidden group ${currentUser?.boardBackground === wp.url ? 'ring-2 ring-offset-1 ring-primary scale-105' : ''}`}
                  >
                    <img src={wp.url} alt={wp.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-1">
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{wp.label}</span>
                    </div>
                    {currentUser?.boardBackground === wp.url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">URL Custom</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customBgInput.trim()) {
                    handleSetBuiltinBackground(customBgInput.trim());
                    setCustomBgInput('');
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="url"
                  placeholder="https://..."
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Pakai
                </button>
              </form>
            </div>

            {/* Upload */}
            <div>
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-gray-600 text-xs font-bold w-full text-center">
                <Upload size={14} />
                {isUploadingBackground ? 'Mengunggah...' : 'Unggah Gambar Lokal'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBackgroundUpload}
                  disabled={isUploadingBackground}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
