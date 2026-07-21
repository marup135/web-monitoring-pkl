import { NextResponse } from 'next/server';
import { PARTICIPANT_ROLES } from '@/lib/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const today = jakartaTime.toISOString().split('T')[0];
    
    // Cari semua siswa yang aktif
    const students = await prisma.user.findMany({
      where: {
        role: { in: PARTICIPANT_ROLES },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    let updatedCount = 0;

    for (const student of students) {
      // Cari absensi hari ini
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: student.id,
            date: today
          }
        }
      });

      if (!attendance) {
        // Jika tidak ada absensi sama sekali (tidak absen masuk)
        await prisma.attendance.create({
          data: {
            userId: student.id,
            date: today,
            status: 'ABSENT'
          }
        });
        updatedCount++;
      } else if (!attendance.checkOut) {
        // Jika absen masuk tapi belum checkout
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { status: 'HALF_DAY' }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Close attendance completed. Updated/Created ${updatedCount} records.`
    });
  } catch (error: any) {
    console.error('Error in close-attendance cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
