'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserAction } from './auth';

export async function getAnnouncementsAction() {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, error: 'Akses ditolak.' };

    const classAnnouncements = currentUser.classId 
      ? await prisma.announcement.findMany({
          where: { classId: currentUser.classId },
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        })
      : [];

    const companyAnnouncements = currentUser.companyId 
      ? await prisma.announcement.findMany({
          where: { companyId: currentUser.companyId },
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        })
      : [];

    return { 
      success: true, 
      classAnnouncements, 
      companyAnnouncements 
    };
  } catch (error) {
    console.error('Failed to get announcements', error);
    return { success: false, error: 'Gagal memuat pengumuman.' };
  }
}

export async function getTargetAnnouncementsAction(type: 'class' | 'company', targetId: string) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, error: 'Akses ditolak.' };

    const whereClause = type === 'class' ? { classId: targetId } : { companyId: targetId };

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: { author: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, announcements };
  } catch (error) {
    console.error(`Failed to get ${type} announcements`, error);
    return { success: false, error: 'Gagal memuat pengumuman.' };
  }
}

export async function addAnnouncementAction(type: 'class' | 'company', targetId: string, text: string) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, error: 'Akses ditolak.' };

    // Validate access
    if (type === 'class') {
      const isAdvisor = currentUser.classes?.some((c: any) => c.id === targetId);
      console.log('addAnnouncementAction debug:', { type, targetId, currentUserClasses: currentUser.classes, isAdvisor });
      if (!isAdvisor && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN') {
        return { success: false, error: 'Anda tidak memiliki akses ke kelas ini.' };
      }
    } else {
      const isMentor = currentUser.companies?.some((c: any) => c.id === targetId);
      if (!isMentor && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN') {
        return { success: false, error: 'Anda tidak memiliki akses ke perusahaan ini.' };
      }
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        text,
        authorId: currentUser.id,
        classId: type === 'class' ? targetId : null,
        companyId: type === 'company' ? targetId : null,
      },
      include: { author: { select: { name: true, role: true } } }
    });

    return { success: true, announcement: newAnnouncement };
  } catch (error) {
    console.error('Failed to add announcement', error);
    return { success: false, error: 'Gagal membuat pengumuman.' };
  }
}

export async function updateAnnouncementAction(id: string, text: string) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, error: 'Akses ditolak.' };

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Pengumuman tidak ditemukan.' };

    // Validasi wewenang (bisa diedit jika ini dibuat olehnya, atau dia adalah Admin)
    if (existing.authorId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN') {
      return { success: false, error: 'Hanya pembuat pengumuman yang dapat mengubahnya.' };
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { text },
      include: { author: { select: { name: true, role: true } } }
    });

    return { success: true, announcement: updated };
  } catch (error) {
    console.error('Failed to update announcement', error);
    return { success: false, error: 'Gagal memperbarui pengumuman.' };
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, error: 'Akses ditolak.' };

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Pengumuman tidak ditemukan.' };

    // Validasi wewenang
    if (existing.authorId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN') {
      return { success: false, error: 'Hanya pembuat pengumuman yang dapat menghapusnya.' };
    }

    await prisma.announcement.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete announcement', error);
    return { success: false, error: 'Gagal menghapus pengumuman.' };
  }
}
