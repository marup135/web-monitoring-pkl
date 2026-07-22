'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { PARTICIPANT_ROLES } from '@/lib/constants';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  const userId = verifySession(sessionCookie.value);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export async function getStudentNotesAction() {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const notes = await prisma.studentNote.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, notes };
  } catch (error) {
    console.error('Failed to get student notes', error);
    return { success: false, error: 'Gagal memuat catatan.' };
  }
}

export async function addStudentNoteAction(text: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const note = await prisma.studentNote.create({
      data: {
        text,
        userId: currentUser.id
      }
    });

    return { success: true, note };
  } catch (error) {
    console.error('Failed to add student note', error);
    return { success: false, error: 'Gagal menambah catatan.' };
  }
}

export async function updateStudentNoteAction(id: string, text: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const existingNote = await prisma.studentNote.findUnique({ where: { id } });
    if (!existingNote || existingNote.userId !== currentUser.id) {
      return { success: false, error: 'Catatan tidak ditemukan atau akses ditolak.' };
    }

    const note = await prisma.studentNote.update({
      where: { id },
      data: { text }
    });

    return { success: true, note };
  } catch (error) {
    console.error('Failed to update student note', error);
    return { success: false, error: 'Gagal memperbarui catatan.' };
  }
}

export async function deleteStudentNoteAction(id: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const existingNote = await prisma.studentNote.findUnique({ where: { id } });
    if (!existingNote || existingNote.userId !== currentUser.id) {
      return { success: false, error: 'Catatan tidak ditemukan atau akses ditolak.' };
    }

    await prisma.studentNote.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete student note', error);
    return { success: false, error: 'Gagal menghapus catatan.' };
  }
}
