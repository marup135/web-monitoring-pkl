'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

export async function getNotificationsAction() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // limit to last 20 notifications for performance
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return { success: true, data: { notifications, unreadCount } };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
}

export async function markAsReadAction(notificationId: string) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function markAllAsReadAction() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
}

// Internal function to create a notification, used by other server actions
export async function createNotification(userId: string, title: string, message: string, type: string = 'INFO') {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
}
