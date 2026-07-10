import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendAttendanceReminder } from '@/lib/email';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Verifikasi bahwa ini request dari Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ambil tanggal hari ini dalam format YYYY-MM-DD
    // Pastikan kita menggunakan timezone lokal (Asia/Jakarta)
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const today = jakartaTime.toISOString().split('T')[0];
    
    // Cari semua siswa yang aktif
    const students = await prisma.user.findMany({
      where: {
        role: 'siswa',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    let sentCount = 0;
    const errors: { studentId: string; error: string | undefined }[] = [];

    for (const student of students) {
      if (!student.email) continue; // Skip jika tidak ada email

      // Cek apakah siswa ini sudah absen masuk hari ini
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: student.id,
            date: today
          }
        }
      });

      // Jika belum ada record attendance (belum absen masuk)
      if (!attendance || !attendance.checkIn) {
        const res = await sendAttendanceReminder(student.email, student.name, 'pagi');
        if (res.success) {
          sentCount++;
        } else {
          errors.push({ studentId: student.id, error: res.error });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pagi reminder checked for ${students.length} students. Emails sent: ${sentCount}`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: unknown) {
    console.error('Error in reminder-pagi cron:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
