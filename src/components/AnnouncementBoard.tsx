'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, GraduationCap, Building2 } from 'lucide-react';
import { getAnnouncementsAction } from '@/app/actions/announcements';

export function AnnouncementBoard() {
  const [classAnnouncements, setClassAnnouncements] = useState<any[]>([]);
  const [companyAnnouncements, setCompanyAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      const res = await getAnnouncementsAction();
      if (res.success) {
        setClassAnnouncements(res.classAnnouncements || []);
        setCompanyAnnouncements(res.companyAnnouncements || []);
      }
      setIsLoading(false);
    };
    fetchAnnouncements();
  }, []);

  if (isLoading) return null;
  if (classAnnouncements.length === 0 && companyAnnouncements.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {classAnnouncements.map((item, index) => (
        <div key={item.id || `class-${index}`} className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-l-4 border-l-amber-500 border border-y-amber-100 border-r-amber-100 dark:border-y-amber-800/30 dark:border-r-amber-800/30 rounded-r-2xl p-4 shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <GraduationCap size={64} />
          </div>
          <div className="flex gap-3">
            <div className="mt-1">
              <Megaphone size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Pengumuman Kelas (Dari {item.author?.name || 'Guru'})
                </h4>
                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-semibold">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-amber-900/80 dark:text-amber-100/80 whitespace-pre-wrap leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        </div>
      ))}

      {companyAnnouncements.map((item, index) => (
        <div key={item.id || `company-${index}`} className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 border-l-4 border-l-blue-500 border border-y-blue-100 border-r-blue-100 dark:border-y-blue-800/30 dark:border-r-blue-800/30 rounded-r-2xl p-4 shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building2 size={64} />
          </div>
          <div className="flex gap-3">
            <div className="mt-1">
              <Megaphone size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Pengumuman Perusahaan (Dari {item.author?.name || 'Mentor'})
                </h4>
                <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-semibold">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-blue-900/80 dark:text-blue-100/80 whitespace-pre-wrap leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
