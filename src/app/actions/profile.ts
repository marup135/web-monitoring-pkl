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

export async function updateProfileInfoAction(name: string, email: string) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Belum login' };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });

    return { success: true, user: { name: updatedUser.name, email: updatedUser.email } };
  } catch (error) {
    console.error('Failed to update profile info', error);
    return { success: false, error: 'Gagal mengupdate profil' };
  }
}

export async function uploadProfileImageAction(formData: FormData) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Belum login' };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'File tidak ditemukan' };

    // Validasi ukuran (Maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Ukuran file maksimal 5 MB' };
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Hanya file JPG, PNG, dan WEBP yang diperbolehkan' };
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Konfigurasi Supabase tidak ditemukan' };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = `profile/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { success: false, error: `Gagal mengunggah foto: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    const profileImage = publicUrlData.publicUrl;

    await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
    });

    return { success: true, profileImage };
  } catch (error) {
    console.error('Failed to upload profile image', error);
    return { success: false, error: 'Gagal mengunggah foto profil' };
  }
}

export async function registerFaceAction(descriptorStr: string) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return { success: false, error: 'Belum login' };

    await prisma.user.update({
      where: { id: userId },
      data: { faceDescriptor: descriptorStr },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to register face descriptor', error);
    return { success: false, error: 'Gagal mendaftarkan wajah' };
  }
}

export async function getFaceDescriptorAction(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceDescriptor: true }
    });
    
    if (!user || !user.faceDescriptor) {
      return { success: false, error: 'Wajah belum terdaftar' };
    }
    
    return { success: true, data: user.faceDescriptor };
  } catch (error) {
    console.error('Failed to get face descriptor', error);
    return { success: false, error: 'Gagal mendapatkan data wajah' };
  }
}
