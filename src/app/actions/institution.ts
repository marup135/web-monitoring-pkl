'use server';

import prisma from '@/lib/prisma';
import { sendAdminApprovalEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export async function getPendingInstitutionsAction() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return { success: false, error: 'Unauthorized' };
  const userId = verifySession(sessionCookie.value);
  if (!userId) return { success: false, error: 'Unauthorized' };

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden' };
  }

  try {
    const institutions = await prisma.institution.findMany({
      where: { status: 'PENDING' },
      include: {
        users: {
          where: { role: 'INSTITUTION_ADMIN' }
        }
      }
    });
    return { success: true, data: institutions };
  } catch (error) {
    return { success: false, error: 'Gagal mengambil data institusi' };
  }
}

export async function approveInstitutionAction(institutionId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return { success: false, error: 'Unauthorized' };
  const userId = verifySession(sessionCookie.value);
  if (!userId) return { success: false, error: 'Unauthorized' };

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden' };
  }

      try {
      let adminUsers: any[] = [];
      let instData: any = null;

      await prisma.$transaction(async (tx) => {
        instData = await tx.institution.update({
          where: { id: institutionId },
          data: { status: 'ACTIVE' }
        });
        
        // Find admins first before updating to get their emails
        adminUsers = await tx.user.findMany({
          where: { institutionId, role: 'INSTITUTION_ADMIN', status: 'PENDING' }
        });

        await tx.user.updateMany({
          where: { institutionId, role: 'INSTITUTION_ADMIN', status: 'PENDING' },
          data: { status: 'ACTIVE' }
        });
      });

      // Send emails asynchronously (don't await to block the UI)
      if (instData && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          if (admin.email) {
            sendAdminApprovalEmail(admin.email, admin.name, instData.name).catch(console.error);
          }
        }
      }

      return { success: true };
    } catch (error) {
    return { success: false, error: 'Gagal menyetujui institusi' };
  }
}

export async function rejectInstitutionAction(institutionId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return { success: false, error: 'Unauthorized' };
  const userId = verifySession(sessionCookie.value);
  if (!userId) return { success: false, error: 'Unauthorized' };

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id: institutionId },
        data: { status: 'REJECTED' }
      });
      await tx.user.updateMany({
        where: { institutionId, role: 'INSTITUTION_ADMIN', status: 'PENDING' },
        data: { status: 'REJECTED' }
      });
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Gagal menolak institusi' };
  }
}
