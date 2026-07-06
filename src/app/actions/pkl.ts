'use server';

import prisma from '@/lib/prisma';
import { PKLCard, AdvisorNote, TaskCategory, PKLRole, PKLState } from '@/types/pkl';
import { cookies } from 'next/headers';
import { verifySession, hashPassword } from '@/lib/auth';

// Helper to check logged-in session and return user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  const userId = verifySession(sessionCookie.value);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getPKLState(selectedStudentId?: string): Promise<PKLState> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    // Determine target student
    let targetStudentId = currentUser.id;
    if (currentUser.role !== 'siswa') {
      if (selectedStudentId) {
        targetStudentId = selectedStudentId;
      } else {
        // Fallback to first available student, or auto-seed if none exist
        const firstStudent = await prisma.user.findFirst({
          where: { role: 'siswa' }
        });
        if (firstStudent) {
          targetStudentId = firstStudent.id;
        } else {
          await resetDatabaseAction();
          const seededStudent = await prisma.user.findFirst({
            where: { role: 'siswa' }
          });
          targetStudentId = seededStudent ? seededStudent.id : '';
        }
      }
    }

    // Fetch the target student info
    const student = await prisma.user.findUnique({
      where: { id: targetStudentId }
    });

    if (!student) {
      return {
        studentName: 'Belum ada Siswa',
        companyName: '-',
        mentorName: '-',
        advisorName: '-',
        cards: [],
        advisorNotes: [],
      };
    }

    const cards = await prisma.card.findMany({
      where: { studentId: targetStudentId },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        history: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const advisorNotes = await prisma.advisorNote.findMany({
      where: { studentId: targetStudentId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapped cards
    const mappedCards: PKLCard[] = cards.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      columnId: c.columnId as PKLCard['columnId'],
      category: c.category as TaskCategory,
      hoursLogged: c.hoursLogged,
      dueDate: c.dueDate,
      createdAt: c.createdAt.toISOString(),
      score: c.score ?? undefined,
      feedback: c.feedback ?? undefined,
      comments: c.comments.map(comm => ({
        id: comm.id,
        userName: comm.userName,
        role: comm.role as PKLRole,
        text: comm.text,
        createdAt: comm.createdAt.toISOString(),
      })),
      history: c.history.map(h => ({
        id: h.id,
        text: h.text,
        createdAt: h.createdAt.toISOString(),
      })),
    }));

    const mappedNotes: AdvisorNote[] = advisorNotes.map(n => ({
      id: n.id,
      advisorName: n.advisorName,
      text: n.text,
      createdAt: n.createdAt.toISOString(),
    }));

    // Find mentor assigned to student's company
    const companyMentor = student.company
      ? await prisma.user.findFirst({
          where: { role: 'pembimbing_eksternal', company: student.company }
        })
      : null;

    // Find school advisor
    const schoolAdvisor = await prisma.user.findFirst({
      where: { role: 'pembimbing_internal' }
    });

    return {
      studentName: student.name,
      companyName: student.company || 'Belum Ditentukan',
      mentorName: companyMentor ? companyMentor.name : 'Belum Ditugaskan',
      advisorName: schoolAdvisor ? schoolAdvisor.name : 'Belum Ditugaskan',
      cards: mappedCards,
      advisorNotes: mappedNotes,
    };
  } catch (error) {
    console.error('Failed to get PKL state from database', error);
    return {
      studentName: 'Error',
      companyName: 'Error',
      mentorName: 'Error',
      advisorName: 'Error',
      cards: [],
      advisorNotes: [],
    };
  }
}

export async function createCardAction(
  title: string,
  description: string,
  category: TaskCategory,
  dueDate: string,
  studentName: string,
  activeRole: PKLRole,
  columnId: PKLCard['columnId'] = 'rencana'
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) throw new Error('Unauthorized');

    // Create cards for the student account
    const card = await prisma.card.create({
      data: {
        title,
        description,
        category,
        dueDate,
        columnId,
        studentId: currentUser.id,
        history: {
          create: {
            text: `Card dibuat oleh ${studentName} (${activeRole})`,
          },
        },
      },
    });
    return { success: true, cardId: card.id };
  } catch (error) {
    console.error('Failed to create card', error);
    throw new Error('Database operation failed');
  }
}

export async function updateCardColumnAction(
  cardId: string,
  targetColumn: PKLCard['columnId'],
  actorName: string,
  actorRole: PKLRole
) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) throw new Error('Card not found');

    const columnNameIndonesian = {
      rencana: 'Rencana Kegiatan',
      progres: 'Sedang Dikerjakan',
      review: 'Butuh Review',
      selesai: 'Selesai (Disetujui)',
    };

    const text = `Status dipindahkan dari [${columnNameIndonesian[card.columnId as PKLCard['columnId']]}] ke [${columnNameIndonesian[targetColumn]}] oleh ${actorName} (${actorRole})`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumn,
          ...(targetColumn !== 'selesai' ? { score: null, feedback: null } : {}),
        },
      });

      await tx.historyItem.create({
        data: {
          cardId,
          text,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update card column', error);
    throw new Error('Database operation failed');
  }
}

export async function updateCardDetailsAction(
  cardId: string,
  title: string,
  description: string,
  category: TaskCategory,
  dueDate: string,
  hoursLogged: number,
  actorName: string,
  actorRole: PKLRole,
  score?: number | null,
  feedback?: string | null
) {
  try {
    const text = `Detail kartu diperbarui oleh ${actorName} (${actorRole})`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          title,
          description,
          category,
          dueDate,
          hoursLogged,
          score: score !== undefined ? score : undefined,
          feedback: feedback !== undefined ? feedback : undefined,
        },
      });

      await tx.historyItem.create({
        data: {
          cardId,
          text,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update card details', error);
    throw new Error('Database operation failed');
  }
}

export async function addCommentAction(
  cardId: string,
  text: string,
  userName: string,
  role: PKLRole
) {
  try {
    const historyText = `${userName} (${role}) menambahkan komentar`;

    await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          cardId,
          text,
          userName,
          role,
        },
      });

      await tx.historyItem.create({
        data: {
          cardId,
          text: historyText,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to add comment', error);
    throw new Error('Database operation failed');
  }
}

export async function gradeCardAction(
  cardId: string,
  score: number,
  feedback: string,
  mentorName: string
) {
  try {
    const text = `Disetujui dan dinilai (${score}/100) oleh Mentor ${mentorName}`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: 'selesai',
          score,
          feedback,
        },
      });

      await tx.historyItem.create({
        data: {
          cardId,
          text,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to grade card', error);
    throw new Error('Database operation failed');
  }
}

export async function addAdvisorNoteAction(text: string, advisorName: string, studentId: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) throw new Error('Unauthorized');

    const note = await prisma.advisorNote.create({
      data: {
        text,
        advisorName,
        studentId,
        advisorId: currentUser.id,
      },
    });
    return { success: true, noteId: note.id };
  } catch (error) {
    console.error('Failed to add advisor note', error);
    throw new Error('Database operation failed');
  }
}

export async function deleteCardAction(cardId: string) {
  try {
    await prisma.card.delete({
      where: { id: cardId },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete card', error);
    throw new Error('Database operation failed');
  }
}

export async function getStudentsAction() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'siswa' },
      select: {
        id: true,
        name: true,
        company: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });

    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        const cards = await prisma.card.findMany({
          where: { studentId: student.id },
          select: { columnId: true, hoursLogged: true }
        });

        const totalHours = cards.reduce((sum, c) => sum + c.hoursLogged, 0);
        const completedCount = cards.filter(c => c.columnId === 'selesai').length;
        const totalCount = cards.length;

        return {
          id: student.id,
          name: student.name,
          company: student.company || '-',
          totalTasks: totalCount,
          completedTasks: completedCount,
          hoursLogged: totalHours,
          completionPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        };
      })
    );

    return studentsWithMetrics;
  } catch (error) {
    console.error('Failed to fetch students', error);
    return [];
  }
}

export async function resetDatabaseAction() {
  try {
    // Clear all existing data
    await prisma.$transaction([
      prisma.comment.deleteMany(),
      prisma.historyItem.deleteMany(),
      prisma.card.deleteMany(),
      prisma.advisorNote.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Seed mock users
    const studentUser = await prisma.user.create({
      data: {
        username: 'siswa',
        password: hashPassword('siswa'),
        name: 'Rian Adriadi',
        role: 'siswa',
        company: 'PT Teknologi Nusantara'
      }
    });

    const mentorUser = await prisma.user.create({
      data: {
        username: 'mentor',
        password: hashPassword('mentor'),
        name: 'Budi Santoso, S.Kom.',
        role: 'pembimbing_eksternal',
        company: 'PT Teknologi Nusantara'
      }
    });

    const advisorUser = await prisma.user.create({
      data: {
        username: 'dosen',
        password: hashPassword('dosen'),
        name: 'Dr. Ir. Heryanto, M.T.',
        role: 'pembimbing_internal',
        school: 'SMKN 1 BOJONG'
      }
    });

    const dateOffset = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Create cards for the student
    
    // Card 1
    await prisma.card.create({
      data: {
        studentId: studentUser.id,
        title: 'Desain UI mockup dashboard di Figma',
        description: 'Membuat rancangan antarmuka pengguna untuk dashboard monitoring admin menggunakan Figma. Desain mencakup view mobile dan desktop dengan mengikuti brand guidelines perusahaan.',
        columnId: 'selesai',
        category: 'Design',
        hoursLogged: 16,
        dueDate: dateOffset(-8).toISOString().split('T')[0],
        createdAt: dateOffset(-12),
        score: 92,
        feedback: 'Desain bersih, alur UX sangat intuitif, dan implementasi auto-layout Figma sangat baik. Lanjutkan ke tahap slicing code!',
        history: {
          createMany: {
            data: [
              { text: 'Card dibuat oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-12) },
              { text: 'Status dipindahkan dari [Rencana Kegiatan] ke [Sedang Dikerjakan] oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-11) },
              { text: 'Status dipindahkan dari [Sedang Dikerjakan] ke [Butuh Review] oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-8) },
              { text: 'Disetujui dan dinilai (92/100) oleh Mentor Budi Santoso, S.Kom.', createdAt: dateOffset(-8) },
            ],
          },
        },
        comments: {
          createMany: {
            data: [
              {
                userName: 'Rian Adriadi',
                role: 'Mahasiswa',
                text: 'Pak Budi, saya sudah menyelesaikan desain dashboard. Mohon review-nya apakah layout sidebar sudah sesuai dengan ekspektasi.',
                createdAt: dateOffset(-9),
              },
              {
                userName: 'Budi Santoso, S.Kom.',
                role: 'Mentor',
                text: 'Sudah sangat bagus Rian. Untuk menu dropdown profil, buat agar memicu modal alih-alih menu hover agar lebih ramah di perangkat mobile.',
                createdAt: dateOffset(-9),
              },
              {
                userName: 'Rian Adriadi',
                role: 'Mahasiswa',
                text: 'Baik Pak, sudah saya revisi menjadi modal popup. Saya pindahkan ke kolom review ya.',
                createdAt: dateOffset(-8),
              },
            ],
          },
        },
      },
    });

    // Card 2
    await prisma.card.create({
      data: {
        studentId: studentUser.id,
        title: 'Refactoring state management menggunakan Context',
        description: 'Mengganti local state prop drilling pada halaman dashboard utama menggunakan React Context API agar data tersinkronisasi lebih bersih dan rapi antar panel monitoring.',
        columnId: 'review',
        category: 'Coding',
        hoursLogged: 8,
        dueDate: dateOffset(-1).toISOString().split('T')[0],
        createdAt: dateOffset(-3),
        history: {
          createMany: {
            data: [
              { text: 'Card dibuat oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-3) },
              { text: 'Status dipindahkan dari [Rencana Kegiatan] ke [Sedang Dikerjakan] oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-2) },
              { text: 'Status dipindahkan dari [Sedang Dikerjakan] ke [Butuh Review] oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-1) },
            ],
          },
        },
        comments: {
          create: {
            userName: 'Rian Adriadi',
            role: 'Mahasiswa',
            text: 'Saya sudah mengimplementasikan Context provider di `/src/context/PKLContext.tsx` untuk membungkus halaman dashboard. Mohon dicek kinerjanya Pak.',
            createdAt: dateOffset(-1),
          },
        },
      },
    });

    // Card 3
    await prisma.card.create({
      data: {
        studentId: studentUser.id,
        title: 'Integrasi front-end dengan backend API auth',
        description: 'Menyambungkan form login dan register dengan rest API auth jwt perusahaan. Menyimpan accessToken di secure cookies dan setup interceptors axios untuk header otorisasi.',
        columnId: 'progres',
        category: 'Coding',
        hoursLogged: 12,
        dueDate: dateOffset(2).toISOString().split('T')[0],
        createdAt: dateOffset(-4),
        history: {
          createMany: {
            data: [
              { text: 'Card dibuat oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-4) },
              { text: 'Status dipindahkan dari [Rencana Kegiatan] ke [Sedang Dikerjakan] oleh Rian Adriadi (Mahasiswa)', createdAt: dateOffset(-4) },
            ],
          },
        },
      },
    });

    // Card 4
    await prisma.card.create({
      data: {
        studentId: studentUser.id,
        title: 'Membuat modul test cases untuk API',
        description: 'Menyusun test cases menggunakan Jest untuk memvalidasi endpoint-endpoint utama PKL seperti getLogs, createCard, dan updateCardStatus.',
        columnId: 'rencana',
        category: 'Coding',
        hoursLogged: 0,
        dueDate: dateOffset(5).toISOString().split('T')[0],
        createdAt: dateOffset(-1),
        history: {
          create: {
            text: 'Card dibuat oleh Rian Adriadi (Mahasiswa)',
            createdAt: dateOffset(-1),
          },
        },
      },
    });

    // Card 5
    await prisma.card.create({
      data: {
        studentId: studentUser.id,
        title: 'Menulis Bab 3 Laporan PKL',
        description: 'Menuliskan metodologi penelitian dan rancangan arsitektur sistem (flowchart, DFD, dan ERD) pada Bab 3 dokumen draf Laporan PKL.',
        columnId: 'rencana',
        category: 'Laporan',
        hoursLogged: 0,
        dueDate: dateOffset(8).toISOString().split('T')[0],
        createdAt: dateOffset(-1),
        history: {
          create: {
            text: 'Card dibuat oleh Rian Adriadi (Mahasiswa)',
            createdAt: dateOffset(-1),
          },
        },
      },
    });

    // Advisor Note 1
    await prisma.advisorNote.create({
      data: {
        studentId: studentUser.id,
        advisorId: advisorUser.id,
        advisorName: advisorUser.name,
        text: 'Progress Rian di minggu pertama sangat baik. Harap pastikan dokumentasi modul API juga dilampirkan dalam draf laporan mingguan.',
        createdAt: dateOffset(-5),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to reset/seed database', error);
    throw new Error('Reset failed');
  }
}
