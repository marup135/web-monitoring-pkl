'use server';

import prisma from '@/lib/prisma';
import { createNotification } from './notifications';

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

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

export async function checkInAction(userId: string, lat?: number, lng?: number, photo?: string, offlineData?: { timestamp: number, dateString: string, timeString: string }, isWfh: boolean = false) {
  try {
    const serverTime = await getServerTimeAction();
    const useTime = offlineData || serverTime;
    const currentHour = offlineData ? new Date(offlineData.timestamp).getHours() : serverTime.hours;
    const currentMinutes = offlineData ? new Date(offlineData.timestamp).getMinutes() : serverTime.minutes;
    const timeInMinutes = currentHour * 60 + currentMinutes;
    const startMinutes = 7 * 60; // 07:00
    const endMinutes = 9 * 60; // 09:00

    if (!offlineData) {
      if (timeInMinutes < startMinutes) {
        return { success: false, error: 'Absensi masuk dibuka pukul 07.00 WIB.' };
      }

      if (timeInMinutes > endMinutes) {
        return { success: false, error: 'Waktu absensi masuk telah berakhir.' };
      }
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: useTime.dateString
        }
      }
    });

    if (existing && existing.checkIn) {
      return { success: false, error: 'Anda sudah melakukan absen masuk hari ini.' };
    }

    // Distance checking logic
    let locStatus = 'VALID';
    if (!isWfh && lat && lng) {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        include: { perusahaan: true }
      });
      
      if (student?.perusahaan?.latitude != null && student?.perusahaan?.longitude != null) {
        const distance = calculateDistance(lat, lng, student.perusahaan.latitude, student.perusahaan.longitude);
        if (distance > 50) {
          return { success: false, error: 'OUT_OF_RANGE', distance: Math.round(distance) };
        }
      } else {
        return { success: false, error: 'Koordinat perusahaan belum diatur. Minta Admin untuk mengisinya di portal Admin.' };
      }
    } else if (isWfh) {
      locStatus = 'PENDING'; // WFH requires approval
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: useTime.dateString
        }
      },
      create: {
        userId,
        date: useTime.dateString,
        checkIn: useTime.timeString,
        checkInLat: lat,
        checkInLng: lng,
        checkInPhoto: photo,
        status: 'CHECKED_IN',
        locationStatus: locStatus
      },
      update: {
        checkIn: useTime.timeString,
        checkInLat: lat,
        checkInLng: lng,
        checkInPhoto: photo,
        status: 'CHECKED_IN',
        locationStatus: locStatus
      }
    });

    // Notify mentors
    await notifyMentorsOnAttendance(userId, 'masuk', useTime.timeString);

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in checkInAction:', error);
    return { success: false, error: error.message };
  }
}

export async function checkOutAction(userId: string, lat?: number, lng?: number, photo?: string, notes?: string, offlineData?: { timestamp: number, dateString: string, timeString: string }) {
  try {
    const serverTime = await getServerTimeAction();
    const useTime = offlineData || serverTime;
    const currentHour = offlineData ? new Date(offlineData.timestamp).getHours() : serverTime.hours;
    const currentMinutes = offlineData ? new Date(offlineData.timestamp).getMinutes() : serverTime.minutes;
    const timeInMinutes = currentHour * 60 + currentMinutes;
    const startMinutes = 16 * 60; // 16:00
    const endMinutes = 18 * 60; // 18:00

    if (!offlineData) {
      if (timeInMinutes < startMinutes) {
        return { success: false, error: 'Absensi pulang dibuka pukul 16.00 WIB.' };
      }

      if (timeInMinutes > endMinutes) {
        return { success: false, error: 'Waktu absensi pulang telah berakhir.' };
      }
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: useTime.dateString
        }
      }
    });

    if (!existing || !existing.checkIn) {
      return { success: false, error: 'Anda harus melakukan absen masuk terlebih dahulu.' };
    }

    if (existing.checkOut) {
      return { success: false, error: 'Anda sudah melakukan absen pulang hari ini.' };
    }

    // Distance checking logic for checkout
    // Only check if they are NOT WFH (i.e. their locStatus from checkIn was VALID)
    if (lat && lng && existing.locationStatus === 'VALID') {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        include: { perusahaan: true }
      });
      
      if (student?.perusahaan?.latitude != null && student?.perusahaan?.longitude != null) {
        const distance = calculateDistance(lat, lng, student.perusahaan.latitude, student.perusahaan.longitude);
        if (distance > 50) {
          return { success: false, error: 'OUT_OF_RANGE_CHECKOUT', distance: Math.round(distance) };
        }
      } else {
        return { success: false, error: 'Koordinat perusahaan belum diatur. Minta Admin untuk mengisinya di portal Admin.' };
      }
    }

    const attendance = await prisma.attendance.update({
      where: {
        userId_date: {
          userId,
          date: useTime.dateString
        }
      },
      data: {
        checkOut: useTime.timeString,
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutPhoto: photo,
        activityNotes: notes,
        status: 'COMPLETED'
      }
    });

    // Notify mentors
    await notifyMentorsOnAttendance(userId, 'pulang', useTime.timeString);

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in checkOutAction:', error);
    return { success: false, error: error.message };
  }
}

export async function requestLeaveAction(userId: string, type: 'SICK' | 'EXCUSED', reason: string, proofPhoto?: string) {
  try {
    const serverTime = await getServerTimeAction();
    
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: serverTime.dateString
        }
      }
    });

    if (existing && existing.checkIn && !existing.checkOut) {
      return { success: false, error: 'Anda sudah melakukan absen masuk hari ini. Tidak dapat mengajukan izin.' };
    }
    
    if (existing && (existing.status === 'PENDING_SICK' || existing.status === 'PENDING_EXCUSED' || existing.status === 'SICK' || existing.status === 'EXCUSED')) {
      return { success: false, error: 'Anda sudah mengajukan izin/sakit hari ini.' };
    }
    
    const pendingType = type === 'SICK' ? 'PENDING_SICK' : 'PENDING_EXCUSED';

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
        status: pendingType,
        activityNotes: reason,
        checkInPhoto: proofPhoto,
        checkIn: serverTime.timeString // Set as submission time for reference
      },
      update: {
        status: pendingType,
        activityNotes: reason,
        checkInPhoto: proofPhoto,
        checkIn: serverTime.timeString
      }
    });

    // Notify mentors for leave request
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, classId: true, companyId: true }
    });
    
    if (student) {
      const typeLabel = type === 'SICK' ? 'Sakit' : 'Izin';
      const notifTitle = `Persetujuan ${typeLabel} Dibutuhkan`;
      const notifMsg = `Siswa ${student.name} mengajukan ${typeLabel} untuk hari ini dan menunggu persetujuan Anda. Alasan: ${reason}`;
      
      // Notify internal mentors
      if (student.classId) {
        const classData = await prisma.kelas.findUnique({
          where: { id: student.classId },
          include: { advisors: true }
        });
        if (classData && classData.advisors) {
          for (const advisor of classData.advisors) {
            await createNotification(advisor.id, notifTitle, notifMsg, 'INFO');
          }
        }
      }
  
      // Notify external mentors
      if (student.companyId) {
        const companyData = await prisma.perusahaan.findUnique({
          where: { id: student.companyId },
          include: { mentors: true }
        });
        if (companyData && companyData.mentors) {
          for (const mentor of companyData.mentors) {
            await createNotification(mentor.id, notifTitle, notifMsg, 'INFO');
          }
        }
      }
    }

    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error in requestLeaveAction:', error);
    return { success: false, error: error.message };
  }
}

export async function approveLeaveAction(attendanceId: string, isApproved: boolean) {
  try {
    const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId }, include: { user: true } });
    if (!attendance) {
      return { success: false, error: 'Data absensi tidak ditemukan' };
    }

    if (attendance.status !== 'PENDING_SICK' && attendance.status !== 'PENDING_EXCUSED') {
      return { success: false, error: 'Status absensi tidak dalam status menunggu persetujuan.' };
    }

    let newStatus = 'ABSENT';
    if (isApproved) {
      newStatus = attendance.status === 'PENDING_SICK' ? 'SICK' : 'EXCUSED';
    } else {
      // If rejected, we just revert to absent or leave it as rejected? 
      // We will set to ABSENT for now, they can still check-in if it's not late.
      newStatus = 'NOT_CHECKED_IN';
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status: newStatus }
    });
    
    // Notify student
    const typeLabel = attendance.status === 'PENDING_SICK' ? 'Sakit' : 'Izin';
    const statusLabel = isApproved ? 'DISETUJUI' : 'DITOLAK';
    await createNotification(
      attendance.userId,
      `Pengajuan ${typeLabel} ${statusLabel}`,
      `Pengajuan ${typeLabel} Anda pada tanggal ${attendance.date} telah ${statusLabel} oleh Pembimbing.`,
      'INFO'
    );

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error approving leave:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWfhAction(attendanceId: string) {
  try {
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { locationStatus: 'APPROVED' }
    });
    
    await createNotification(
      attendance.userId,
      'Absensi WFH Disetujui',
      `Pengajuan absensi WFH (Tugas Luar) Anda pada tanggal ${attendance.date} telah disetujui.`,
      'SUCCESS'
    );
    
    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error approving WFH:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectWfhAction(attendanceId: string) {
  try {
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { locationStatus: 'REJECTED' }
    });
    
    await createNotification(
      attendance.userId,
      'Absensi WFH Ditolak',
      `Pengajuan absensi WFH (Tugas Luar) Anda pada tanggal ${attendance.date} telah ditolak. Silakan hubungi pembimbing.`,
      'ERROR'
    );
    
    return { success: true, data: attendance };
  } catch (error: any) {
    console.error('Error rejecting WFH:', error);
    return { success: false, error: error.message };
  }
}
