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

export async function getSecretNotesAction(studentId: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const notes = await prisma.secretNote.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, notes };
  } catch (error) {
    console.error('Failed to get secret notes', error);
    return { success: false, error: 'Gagal memuat catatan rahasia.' };
  }
}

export async function addSecretNoteAction(studentId: string, text: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    if (!text.trim()) {
      return { success: false, error: 'Catatan tidak boleh kosong.' };
    }

    const note = await prisma.secretNote.create({
      data: {
        text,
        studentId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role
      }
    });

    return { success: true, note };
  } catch (error) {
    console.error('Failed to add secret note', error);
    return { success: false, error: 'Gagal menyimpan catatan rahasia.' };
  }
}

export async function deleteSecretNoteAction(noteId: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || PARTICIPANT_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const note = await prisma.secretNote.findUnique({ where: { id: noteId } });
    if (!note) return { success: false, error: 'Catatan tidak ditemukan.' };

    if (note.authorId !== currentUser.id && currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Anda tidak berhak menghapus catatan ini.' };
    }

    await prisma.secretNote.delete({ where: { id: noteId } });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete secret note', error);
    return { success: false, error: 'Gagal menghapus catatan rahasia.' };
  }
}
