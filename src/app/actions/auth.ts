'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { hashPassword, signSession, verifySession } from '@/lib/auth';

export async function registerAction(
  username: string,
  password: string,
  name: string,
  role: string,
  companyName?: string,
  className?: string,
  nisn?: string
) {
  try {
    // Admin cannot register via the form
    if (role === 'admin') {
      return { success: false, error: 'Akun Admin tidak dapat dibuat melalui registrasi.' };
    }

    const allowedRoles = ['siswa', 'pembimbing_internal', 'pembimbing_eksternal'];
    if (!allowedRoles.includes(role)) {
      return { success: false, error: 'Peran registrasi tidak valid.' };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return { success: false, error: 'Username tidak valid. Harus minimal 3 karakter dan berupa alfanumerik.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password harus terdiri dari minimal 6 karakter.' };
    }
    const cleanName = name.trim();
    if (cleanName.length < 3) {
      return { success: false, error: 'Nama lengkap harus terdiri dari minimal 3 karakter.' };
    }

    if (role === 'siswa') {
      if (!className) {
        return { success: false, error: 'Kelas wajib dipilih.' };
      }
      if (!nisn || !nisn.trim()) {
        return { success: false, error: 'NIS/NISN wajib diisi.' };
      }
      const cleanCompany = companyName?.trim();
      if (!cleanCompany) {
        return { success: false, error: 'Nama perusahaan tidak boleh kosong.' };
      }
      if (cleanCompany.length < 3) {
        return { success: false, error: 'Nama perusahaan harus terdiri dari minimal 3 karakter.' };
      }
      if (cleanCompany.length > 100) {
        return { success: false, error: 'Nama perusahaan maksimal 100 karakter.' };
      }
    }

    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (existing) {
      return { success: false, error: 'Username sudah digunakan' };
    }

    const hashedPassword = hashPassword(password);

    let resolvedClassId = null;
    if (role === 'siswa' && className) {
      let dbClass = await prisma.kelas.findUnique({ where: { name: className } });
      if (!dbClass) {
        dbClass = await prisma.kelas.create({ data: { name: className } });
      }
      resolvedClassId = dbClass.id;
    }

    let resolvedCompanyId = null;
    let finalCompany = null;
    if ((role === 'siswa' || role === 'pembimbing_eksternal') && companyName) {
      finalCompany = companyName.trim();
      let dbCompany = await prisma.perusahaan.findUnique({ where: { name: finalCompany } });
      if (!dbCompany) {
        dbCompany = await prisma.perusahaan.create({ data: { name: finalCompany } });
      }
      resolvedCompanyId = dbCompany.id;
    }

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: cleanName,
        role,
        company: finalCompany,
        nisn: role === 'siswa' ? (nisn?.trim() || null) : null,
        classId: resolvedClassId,
        companyId: role === 'siswa' ? resolvedCompanyId : null,
        companies: role === 'pembimbing_eksternal' && resolvedCompanyId ? {
          connect: { id: resolvedCompanyId }
        } : undefined,
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

    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        company: true,
        school: true,
        classId: true,
        companyId: true,
        nisn: true,
        classes: {
          select: { id: true, name: true }
        },
        companies: {
          select: { id: true, name: true }
        }
      }
    });

    return { success: true, user: userWithRelations };
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

    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        company: true,
        school: true,
        classId: true,
        companyId: true,
        nisn: true,
        classes: {
          select: { id: true, name: true }
        },
        companies: {
          select: { id: true, name: true }
        }
      }
    });

    return { success: true, user: userWithRelations };
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
        school: true,
        classId: true,
        companyId: true,
        nisn: true,
        classes: {
          select: {
            id: true,
            name: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    });

    return user;
  } catch (error) {
    console.error('Failed to get current user', error);
    return null;
  }
}
