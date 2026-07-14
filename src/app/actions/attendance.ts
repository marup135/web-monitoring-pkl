'use server';

import prisma from '@/lib/prisma';
import { createNotification } from './notifications';

// Helper function to notify mentors
async function notifyMentorsOnAttendance(userId: string, type: 'masuk' | 'pulang', time: string) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, classId: true, companyId: true }
    });
    
    if (!student) return;

    // Notify internal mentors (advisors for the class)
    if (student.classId) {
      const classData = await prisma.kelas.findUnique({
        where: { id: student.classId },
        include: { advisors: true }
      });
      if (classData && classData.advisors) {
        for (const advisor of classData.advisors) {
          await createNotification(
            advisor.id,
            `Absensi ${type === 'masuk' ? 'Masuk' : 'Pulang'}`,
            `Siswa ${student.name} telah melakukan absensi ${type} pada pukul ${time}.`,
            'INFO'
          );
        }
      }
    }

    // Notify external mentors (mentors for the company)
    if (student.companyId) {
      const companyData = await prisma.perusahaan.findUnique({
        where: { id: student.companyId },
        include: { mentors: true }
      });
      if (companyData && companyData.mentors) {
        for (const mentor of companyData.mentors) {
          await createNotification(
            mentor.id,
            `Absensi ${type === 'masuk' ? 'Masuk' : 'Pulang'}`,
            `Siswa ${student.name} telah melakukan absensi ${type} pada pukul ${time}.`,
            'INFO'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error notifying mentors:', error);
  }
}

// Helper to get Asia/Jakarta time elements
export async function getServerTimeAction() {
  const now = new Date();
  const jakartaString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const jakartaDateObj = new Date(jakartaString);

  const year = jakartaDateObj.getFullYear();
  const month = String(jakartaDateObj.getMonth() + 1).padStart(2, '0');
  const dateVal = String(jakartaDateObj.getDate()).padStart(2, '0');
  const hours = String(jakartaDateObj.getHours()).padStart(2, '0');
  const minutes = String(jakartaDateObj.getMinutes()).padStart(2, '0');

  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = daysIndo[jakartaDateObj.getDay()];

  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthsIndo[jakartaDateObj.getMonth()];

  const formattedDate = `${dayName}, ${dateVal} ${monthName} ${year}`;
  const dateString = `${year}-${month}-${dateVal}`; // YYYY-MM-DD
  const timeString = `${hours}:${minutes}`; // HH:mm

  return {
    dateString,
    timeString,
    formattedDate,
    hours: jakartaDateObj.getHours(),
    minutes: jakartaDateObj.getMinutes()
  };
}

export async function getAttendanceTodayAction(userId: string) {
  try {
    const serverTime = await getServerTimeAction();
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      }
    });

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in getAttendanceTodayAction:', error);
    return { success: false, error: error.message };
  }
}

export async function getAttendanceHistoryAction(userId: string) {
  try {
    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    return { success: true, data: history };
  } catch (error: any) {
    console.error('Error in getAttendanceHistoryAction:', error);
    return { success: false, error: error.message };
  }
}

export async function checkInAction(userId: string, lat?: number, lng?: number, photo?: string) {
  try {
    const serverTime = await getServerTimeAction();
    const currentHour = serverTime.hours;
    const currentMinutes = serverTime.minutes;
    const timeInMinutes = currentHour * 60 + currentMinutes;
    const startMinutes = 7 * 60; // 07:00
    const endMinutes = 9 * 60; // 09:00

    if (timeInMinutes < startMinutes) {
      return { success: false, error: 'Absensi masuk dibuka pukul 07.00 WIB.' };
    }

    if (timeInMinutes > endMinutes) {
      return { success: false, error: 'Waktu absensi masuk telah berakhir.' };
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      }
    });

    if (existing && existing.checkIn) {
      return { success: false, error: 'Anda sudah melakukan absen masuk hari ini.' };
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      },
      create: {
        userId,
        date: serverTime.dateString,
        checkIn: serverTime.timeString,
        checkInLat: lat,
        checkInLng: lng,
        checkInPhoto: photo,
        status: 'CHECKED_IN'
      },
      update: {
        checkIn: serverTime.timeString,
        checkInLat: lat,
        checkInLng: lng,
        checkInPhoto: photo,
        status: 'CHECKED_IN'
      }
    });

    // Notify mentors
    await notifyMentorsOnAttendance(userId, 'masuk', serverTime.timeString);

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in checkInAction:', error);
    return { success: false, error: error.message };
  }
}

export async function checkOutAction(userId: string, lat?: number, lng?: number, photo?: string, notes?: string) {
  try {
    const serverTime = await getServerTimeAction();
    const currentHour = serverTime.hours;
    const currentMinutes = serverTime.minutes;
    const timeInMinutes = currentHour * 60 + currentMinutes;
    const startMinutes = 16 * 60; // 16:00
    const endMinutes = 18 * 60; // 18:00

    if (timeInMinutes < startMinutes) {
      return { success: false, error: 'Absensi pulang dibuka pukul 16.00 WIB.' };
    }

    if (timeInMinutes > endMinutes) {
      return { success: false, error: 'Waktu absensi pulang telah berakhir.' };
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      }
    });

    if (!existing || !existing.checkIn) {
      return { success: false, error: 'Anda harus melakukan absen masuk terlebih dahulu.' };
    }

    if (existing.checkOut) {
      return { success: false, error: 'Anda sudah melakukan absen pulang hari ini.' };
    }

    const attendance = await prisma.attendance.update({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      },
      data: {
        checkOut: serverTime.timeString,
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutPhoto: photo,
        activityNotes: notes,
        status: 'COMPLETED'
      }
    });

    // Notify mentors
    await notifyMentorsOnAttendance(userId, 'pulang', serverTime.timeString);

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in checkOutAction:', error);
    return { success: false, error: error.message };
  }
}
