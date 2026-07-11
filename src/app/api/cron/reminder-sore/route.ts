import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendAttendanceReminder } from '@/lib/email';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV !== 'development') {
      if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const today = jakartaTime.toISOString().split('T')[0];
    
    console.log(`[CRON] Started: reminder-sore. Date: ${today}`);

    // Cari semua siswa yang aktif
    const students = await prisma.user.findMany({
      where: {
        role: 'siswa',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastAfternoonReminder: true
      }
    });

    let sentCount = 0;
    const errors: { studentId: string; error: string | undefined }[] = [];

    for (const student of students) {
      if (!student.email) continue;

      // Anti-Spam Check: Pastikan belum dikirim hari ini
      if (student.lastAfternoonReminder === today) {
        continue;
      }

      // Cari absensi hari ini
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: student.id,
            date: today
          }
        }
      });

      // Jika sudah absen masuk, tapi...
      if (attendance && attendance.checkIn) {
        let isMissingLogbook = false;
        
        // Cek logbook hari ini (card created today)
        const logbookCount = await prisma.card.count({
          where: {
            studentId: student.id,
            createdAt: {
              gte: new Date(`${today}T00:00:00.000Z`),
              lt: new Date(`${today}T23:59:59.999Z`)
            }
          }
        });

        if (logbookCount === 0) {
          isMissingLogbook = true;
        }

        const isMissingCheckOut = !attendance.checkOut;

        if (isMissingCheckOut || isMissingLogbook) {
          console.log(`[CRON] Sending email sore to: ${student.email}`);
          const res = await sendAttendanceReminder(student.email, student.name, 'sore');
          if (res.success) {
            console.log(`[CRON] Email Sent successfully to: ${student.email}`);
            sentCount++;
            // Update lastAfternoonReminder
            await prisma.user.update({
              where: { id: student.id },
              data: { lastAfternoonReminder: today }
            });
          } else {
            console.error(`[CRON] Email Failed to send to: ${student.email}, error: ${res.error}`);
            errors.push({ studentId: student.id, error: res.error });
          }
        }
      }
    }

    console.log(`[CRON] Finished: reminder-sore. Total Email checked: ${students.length}. Total Email Sent: ${sentCount}. Total Email Failed: ${errors.length}.`);

    return NextResponse.json({
      success: true,
      message: `Sore reminder checked for ${students.length} students. Emails sent: ${sentCount}`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: unknown) {
    console.error('Error in reminder-sore cron:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
