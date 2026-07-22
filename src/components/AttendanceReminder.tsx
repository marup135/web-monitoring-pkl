'use client';

import React, { useState, useEffect } from 'react';
import { usePKL } from '../context/PKLContext';
import { getAttendanceTodayAction, getServerTimeAction } from '../app/actions/attendance';
import { Clock, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PARTICIPANT_ROLES } from '@/lib/constants';

export function AttendanceReminder({ onGoToAttendance }: { onGoToAttendance: () => void }) {
  const { currentUser } = usePKL();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [reminderType, setReminderType] = useState<'masuk' | 'pulang' | null>(null);

  useEffect(() => {
    if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) return;

    const checkReminder = async () => {
      try {
        const timeRes = await getServerTimeAction();
        const { hours } = timeRes;

        // Cek apakah ini jam masuk (06:00 - 09:00) atau jam pulang (15:00 - 18:00)
        const isMorning = hours >= 6 && hours < 9;
        const isAfternoon = hours >= 15 && hours < 18;

        if (!isMorning && !isAfternoon) return;

        const attRes = await getAttendanceTodayAction(currentUser.id);
        if (attRes.success) {
          const attendance = attRes.data;
          
          if (isMorning && (!attendance || !attendance.checkIn)) {
            setReminderType('masuk');
            setIsVisible(true);
          } else if (isAfternoon && attendance && attendance.checkIn && !attendance.checkOut) {
            setReminderType('pulang');
            setIsVisible(true);
          }
        }
      } catch (e) {
        console.error('Error checking attendance reminder', e);
      }
    };

    // Delay sedikit agar tidak mengganggu inisialisasi awal
    const timer = setTimeout(checkReminder, 2000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-500/30 rounded-2xl shadow-xl overflow-hidden flex items-start gap-3 p-4">
        <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2 rounded-xl shrink-0 mt-0.5">
          <Clock size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 dark:text-white mb-1">
            Waktunya Absen {reminderType === 'masuk' ? 'Masuk' : 'Pulang'}!
          </h4>
          <p className="text-xs text-slate-600 dark:text-gray-300 mb-3">
            {reminderType === 'masuk' 
              ? 'Anda belum melakukan absensi masuk hari ini. Jangan sampai terlambat ya!' 
              : 'Saatnya melakukan absensi pulang. Jangan lupa isi logbook juga!'}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsVisible(false);
                onGoToAttendance();
              }}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm shadow-orange-500/20 transition-colors"
            >
              Absen Sekarang
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 font-bold text-xs rounded-lg transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
