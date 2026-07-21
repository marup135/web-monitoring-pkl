'use server';
import { PARTICIPANT_ROLES } from '@/lib/constants';


import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { hashPassword, signSession, verifySession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

async function verifyCaptchaToken(token?: string) {
  if (!token) return false;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  try {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export async function registerAction(
  username: string,
  email: string,
  password: string,
  name: string,
  role: string,
  companyName?: string,
  className?: string,
  nisn?: string,
  nip?: string,
  school?: string,
  jabatan?: string,
  employeeId?: string,
  companyEmail?: string,
  institutionCode?: string,
  captchaToken?: string
) {
  console.log(">>> REGISTER ACTION CALLED:", { username, email, role });
  try {
    if (!(await verifyCaptchaToken(captchaToken))) {
      return { success: false, error: 'Verifikasi CAPTCHA gagal. Silakan coba lagi.' };
    }
    // Admin cannot register via the form
    if (role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') {
      return { success: false, error: 'Akun Admin tidak dapat dibuat melalui registrasi biasa.' };
    }

    const allowedRoles = [...PARTICIPANT_ROLES, 'INTERNAL_MENTOR', 'EXTERNAL_MENTOR'];
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

    let status = 'PENDING';

    if (PARTICIPANT_ROLES.includes(role)) {
      status = 'ACTIVE';
      if (!className || !className.trim()) {
        return { success: false, error: 'Kelas / Program Studi wajib diisi.' };
      }
    } else if (role === 'INTERNAL_MENTOR') {
      if (!nip || !nip.trim()) {
        return { success: false, error: 'NIP / Nomor Identitas wajib diisi.' };
      }
    } else if (role === 'EXTERNAL_MENTOR') {
      const cleanCompany = companyName?.trim();
      if (!cleanCompany) {
        return { success: false, error: 'Nama Perusahaan wajib diisi.' };
      }
      if (cleanCompany.length < 3) {
        return { success: false, error: 'Nama perusahaan harus terdiri dari minimal 3 karakter.' };
      }
      if (!employeeId || !employeeId.trim()) {
        return { success: false, error: 'Nomor Identitas Karyawan wajib diisi.' };
      }
      if (!jabatan || !jabatan.trim()) {
        return { success: false, error: 'Jabatan wajib diisi.' };
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return { success: false, error: 'Email sudah terdaftar.' };
      }
      return { success: false, error: 'Username sudah digunakan.' };
    }
    
    if (!institutionCode || !institutionCode.trim()) {
      return { success: false, error: 'Kode Institusi wajib diisi.' };
    }

    const inst = await prisma.institution.findUnique({
      where: { code: institutionCode.trim() }
    });

    if (!inst) {
      return { success: false, error: 'Kode Institusi tidak ditemukan atau tidak valid.' };
    }
    
    const resolvedInstitutionId = inst.id;
    const resolvedSchoolName = inst.name;

    const hashedPassword = hashPassword(password);

    let resolvedClassId = null;
    if (PARTICIPANT_ROLES.includes(role) && className) {
      const trimmedClass = className.trim();
      let dbClass = await prisma.kelas.findFirst({ where: { name: trimmedClass, institutionId: resolvedInstitutionId } });
      if (!dbClass) {
        dbClass = await prisma.kelas.create({ data: { name: trimmedClass, institutionId: resolvedInstitutionId } });
      }
      resolvedClassId = dbClass.id;
    }

    let resolvedCompanyId = null;
    let finalCompany = null;
    if ((PARTICIPANT_ROLES.includes(role) || role === 'EXTERNAL_MENTOR') && companyName) {
      finalCompany = companyName.trim();
      let dbCompany = await prisma.perusahaan.findFirst({ where: { name: finalCompany, institutionId: resolvedInstitutionId } });
      if (!dbCompany) {
        dbCompany = await prisma.perusahaan.create({ data: { name: finalCompany, institutionId: resolvedInstitutionId } });
      }
      resolvedCompanyId = dbCompany.id;
    }

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
        role,
        institutionId: resolvedInstitutionId,
        company: finalCompany,
        nisn: PARTICIPANT_ROLES.includes(role) ? (nisn?.trim() || null) : null,
        nip: role === 'INTERNAL_MENTOR' ? (nip?.trim() || null) : null,
        jabatan: role === 'EXTERNAL_MENTOR' ? (jabatan?.trim() || null) : null,
        school: resolvedSchoolName,
        status,
        companyName: finalCompany,
        jobTitle: role === 'EXTERNAL_MENTOR' ? (jabatan?.trim() || null) : null,
        employeeId: role === 'EXTERNAL_MENTOR' ? (employeeId?.trim() || null) : null,
        companyEmail: role === 'EXTERNAL_MENTOR' ? (companyEmail?.trim() || null) : null,
        classId: resolvedClassId,
        companyId: PARTICIPANT_ROLES.includes(role) ? resolvedCompanyId : null,
        companies: role === 'EXTERNAL_MENTOR' && resolvedCompanyId ? {
          connect: { id: resolvedCompanyId }
        } : undefined,
      }
    });

    console.log("--- REGISTRATION LOG ---");
    console.log("Role:", role);
    console.log("Status:", status);
    console.log("InstitutionId:", resolvedInstitutionId);
    console.log("------------------------");

    // Set cookie session ONLY IF ACTIVE
    if (status === 'ACTIVE') {
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
          email: true,
          name: true,
          role: true,
          company: true,
          school: true,
          classId: true,
          companyId: true,
          nisn: true,
          nip: true,
          companyName: true,
          jobTitle: true,
          employeeId: true,
          companyEmail: true,
          profileImage: true,
          createdAt: true,
          institution: true,
          classes: {
            select: { id: true, name: true }
          },
          companies: {
            select: { id: true, name: true }
          }
        }
      });
      return { success: true, user: userWithRelations, pending: false };
    }

    // If PENDING, don't set cookie, just return success with pending flag
    return { success: true, pending: true, message: 'Akun Anda sedang menunggu verifikasi Admin. Silakan tunggu hingga akun disetujui.' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Gagal melakukan pendaftaran' };
  }
}

export async function registerInstitutionAdminAction(
  name: string,
  email: string,
  password: string,
  institutionName: string,
  institutionType: 'SCHOOL' | 'UNIVERSITY' | 'TRAINING_CENTER' | 'COMPANY' | 'OTHER',
  address: string,
  phone: string,
  website?: string
) {
  try {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });
    if (existingUser) {
      return { success: false, error: 'Email sudah terdaftar.' };
    }

    // Generate unique institution code
    let code = institutionName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
    let counter = 1;
    while(await prisma.institution.findUnique({ where: { code } })) {
      code = code.substring(0, 8) + counter;
      counter++;
    }

    const hashedPassword = hashPassword(password);
    const cleanUsername = "admin_" + code.toLowerCase() + "_" + Date.now().toString().substring(8);

    // Create Institution (PENDING)
    const inst = await prisma.institution.create({
      data: {
        name: institutionName,
        code,
        type: institutionType,
        address,
        phone,
        website,
        email: cleanEmail,
        status: 'PENDING'
      }
    });

    // Create User (PENDING)
    await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
        role: 'INSTITUTION_ADMIN',
        status: 'PENDING',
        institutionId: inst.id
      }
    });

    return { success: true, pending: true, message: 'Pendaftaran institusi berhasil disubmit. Menunggu persetujuan Super Admin.' };
  } catch(error) {
    console.error(error);
    return { success: false, error: 'Gagal mendaftarkan admin institusi' };
  }
}

export async function loginAction(identifier: string, password: string, captchaToken?: string) {
  try {
    if (!(await verifyCaptchaToken(captchaToken))) {
      return { success: false, error: 'Verifikasi CAPTCHA gagal. Silakan coba lagi.' };
    }
    const cleanIdentifier = identifier.trim().toLowerCase();

    const isEmail = cleanIdentifier.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier }
    });

    if (!user) {
      return { success: false, error: 'Username atau password salah' };
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Username atau password salah' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, error: 'Akun Anda sedang menunggu verifikasi Admin. Silakan tunggu hingga akun disetujui.' };
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
        email: true,
        name: true,
        role: true,
        company: true,
        school: true,
        classId: true,
        companyId: true,
        nisn: true,
        nip: true,
        companyName: true,
        jobTitle: true,
        employeeId: true,
        companyEmail: true,
        profileImage: true,
        createdAt: true,
        boardBackground: true,
        institution: true,
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
        email: true,
        name: true,
        role: true,
        company: true,
        school: true,
        classId: true,
        companyId: true,
        nisn: true,
        nip: true,
        companyName: true,
        jobTitle: true,
        employeeId: true,
        companyEmail: true,
        profileImage: true,
        createdAt: true,
        boardBackground: true,
        institution: true,
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

export async function forgotPasswordAction(email: string, origin: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user exists in our local Prisma DB
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return { success: true };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Config', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
      });
      return { success: false, error: 'Konfigurasi server bermasalah: Variabel environment Supabase tidak ditemukan.' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure user exists in Supabase Auth (create if missing)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && listData?.users) {
        const authUser = listData.users.find(u => u.email === cleanEmail);
        if (!authUser) {
          // Create user in Supabase Auth
          const { error: createError } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: 'temp_random_password_' + Date.now(),
            email_confirm: true,
          });
          if (createError) {
            console.error('Supabase createUser Error:', createError);
          }
        }
      } else if (listError) {
        console.error('Supabase listUsers Error:', listError);
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Skipping auth.admin checks.');
    }

    // Send reset password email using Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      console.error('Supabase Reset Password Error:', error.message || error);
      return { success: false, error: `Gagal mengirim email reset: ${error.message}` };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to process forgot password. Original Error:', error);
    const err = error as Error;
    return { success: false, error: err.message ? `Terjadi kesalahan: ${err.message}` : 'Terjadi kesalahan sistem.' };
  }
}

export async function updatePasswordAction(accessToken: string, newPassword: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase Config in updatePassword');
      return { success: false, error: 'Konfigurasi server bermasalah.' };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user || !user.email) {
      return { success: false, error: 'Tautan reset tidak valid atau sudah kadaluarsa.' };
    }

    // Try to update using admin API if service key is available, else use client API
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
      });
      if (updateError) {
        console.error('Supabase admin updateUser Error:', updateError);
        return { success: false, error: `Gagal memperbarui di Supabase: ${updateError.message}` };
      }
    } else {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) {
        console.error('Supabase updateUser Error:', updateError);
        return { success: false, error: `Gagal memperbarui di Supabase: ${updateError.message}` };
      }
    }

    // Hash and Update password in Prisma DB
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.updateMany({
      where: { email: user.email },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to update password. Original Error:', error);
    const err = error as Error;
    return { success: false, error: err.message ? `Kesalahan: ${err.message}` : 'Terjadi kesalahan saat menyimpan password baru.' };
  }
}

export async function changePasswordAction(oldPassword: string, newPassword: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return { success: false, error: 'Sesi tidak valid.' };

    const userId = verifySession(sessionCookie.value);
    if (!userId) return { success: false, error: 'Sesi tidak valid.' };

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const hashedOldPassword = hashPassword(oldPassword);
    if (user.password !== hashedOldPassword) {
      return { success: false, error: 'Password Lama salah.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Password Baru harus terdiri dari minimal 6 karakter.' };
    }

    const hashedNewPassword = hashPassword(newPassword);
    if (user.password === hashedNewPassword) {
      return { success: false, error: 'Password lama tidak boleh digunakan lagi.' };
    }

    // Attempt to update Supabase as well
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && listData?.users) {
        const authUser = listData.users.find(u => u.email === user.email);
        if (authUser) {
          await supabase.auth.admin.updateUserById(authUser.id, {
            password: newPassword
          });
        }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to change password:', error);
    const err = error as Error;
    return { success: false, error: err.message ? `Terjadi kesalahan: ${err.message}` : 'Terjadi kesalahan saat mengubah password.' };
  }
}
