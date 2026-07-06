'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { hashPassword, signSession, verifySession } from '@/lib/auth';

export async function registerAction(
  username: string,
  password: string,
  name: string,
  role: string,
  company?: string
) {
  try {
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return { success: false, error: 'Username sudah digunakan' };
    }

    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        company: company || null
      }
    });

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set('session', signSession(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
  } catch (error) {
    console.error('Failed to register user', error);
    return { success: false, error: 'Gagal melakukan pendaftaran' };
  }
}

export async function loginAction(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return { success: false, error: 'Username atau password salah' };
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Username atau password salah' };
    }

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set('session', signSession(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role, company: user.company } };
  } catch (error) {
    console.error('Failed to login user', error);
    return { success: false, error: 'Gagal masuk' };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return { success: true };
  } catch (error) {
    console.error('Failed to logout user', error);
    return { success: false };
  }
}

export async function getCurrentUserAction() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return null;

    const userId = verifySession(sessionCookie.value);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        company: true,
        school: true
      }
    });

    return user;
  } catch (error) {
    console.error('Failed to get current user', error);
    return null;
  }
}
