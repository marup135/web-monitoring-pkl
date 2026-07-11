import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendAttendanceReminder } from '@/lib/email';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // Jika dipanggil di Production, kembalikan 403 Forbidden
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    console.log('Cron Started');
    console.log('Checking Students');

    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const today = jakartaTime.toISOString().split('T')[0];

    const students = await prisma.user.findMany({
      where: {
        role: 'siswa',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastMorningReminder: true
      }
    });

    console.log(`Total User dari Database: ${students.length}`);
    console.log('Daftar Email yang ditemukan:');
    students.forEach(s => {
      if (s.email) {
        console.log(s.email);
      }
    });

    let emailSent = 0;
    let failed = 0;
    const errorDetails: { name: string; email: string; message: string; stack?: string }[] = [];

    for (const student of students) {
      if (!student.email) continue;
      
      // Anti-Spam Check
      if (student.lastMorningReminder === today) {
        continue;
      }

      // Cek absensi masuk hari ini
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: student.id,
            date: today
          }
        }
      });

      // Jika belum absen masuk
      if (!attendance || !attendance.checkIn) {
        console.log(`Sending email to ${student.email}`);
        
        // Gunakan fungsi Reminder yang sudah ada
        const res = await sendAttendanceReminder(student.email, student.name, 'pagi');
        
        if (res.success) {
          console.log('Email Success');
          emailSent++;
          
          await prisma.user.update({
            where: { id: student.id },
            data: { lastMorningReminder: today }
          });
        } else {
          console.log('Email Failed');
          console.log('Error Detail:', res.error);
          failed++;
          errorDetails.push({
            name: student.name,
            email: student.email,
            message: res.error || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined
          });
        }
      }
    }

    console.log('Cron Finished');

    return NextResponse.json({
      success: true,
      totalStudent: students.length,
      emailSent: emailSent,
      failed: failed,
      errors: errorDetails.length > 0 ? errorDetails : undefined
    });
  } catch (error: unknown) {
    console.error('Error in debug route:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
