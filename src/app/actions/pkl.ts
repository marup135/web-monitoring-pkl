/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { PKLCard, AdvisorNote, TaskCategory, PKLRole, PKLState } from '@/types/pkl';
import { cookies } from 'next/headers';
import { verifySession, hashPassword } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { calculateDuration } from '@/utils/time';

// Helper to check logged-in session and return user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  const userId = verifySession(sessionCookie.value);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      classes: true,
      companies: true,
    },
  });
}

type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;

function canMentorAccessStudent(
  currentUser: AuthenticatedUser,
  student: { companyId: string | null }
) {
  if (currentUser.role !== 'pembimbing_eksternal') return false;
  const mentorCompanyIds = currentUser.companies.map(
    (company: { id: string }) => company.id
  );
  return Boolean(student.companyId && mentorCompanyIds.includes(student.companyId));
}

function canAdvisorAccessStudent(
  currentUser: AuthenticatedUser,
  student: { classId: string | null }
) {
  if (currentUser.role !== 'pembimbing_internal') return false;
  const advisorClassIds = currentUser.classes.map(
    (kelas: { id: string }) => kelas.id
  );
  return Boolean(student.classId && advisorClassIds.includes(student.classId));
}

async function requireAdmin() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }
  return currentUser;
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
        const targetStudent = await prisma.user.findUnique({
          where: { id: selectedStudentId }
        });
        if (!targetStudent || targetStudent.role !== 'siswa') {
          throw new Error('Siswa tidak ditemukan');
        }

        // Data isolation checks
        if (currentUser.role === 'pembimbing_eksternal') {
          const mentorCompanyIds = currentUser.companies.map((c: { id: string }) => c.id);
          if (!targetStudent.companyId || !mentorCompanyIds.includes(targetStudent.companyId)) {
            throw new Error('Akses ditolak: Siswa dari perusahaan lain');
          }
        } else if (currentUser.role === 'pembimbing_internal') {
          const advisorClassIds = currentUser.classes.map((c: { id: string }) => c.id);
          if (!targetStudent.classId || !advisorClassIds.includes(targetStudent.classId)) {
            throw new Error('Akses ditolak: Siswa dari kelas lain');
          }
        }

        targetStudentId = selectedStudentId;
      } else {
        // Fallback to first available guided student
        let firstStudent = null;
        if (currentUser.role === 'pembimbing_eksternal') {
          const mentorCompanyIds = currentUser.companies.map((c: { id: string }) => c.id);
          firstStudent = await prisma.user.findFirst({
            where: { role: 'siswa', companyId: { in: mentorCompanyIds } }
          });
        } else if (currentUser.role === 'pembimbing_internal') {
          const advisorClassIds = currentUser.classes.map((c: { id: string }) => c.id);
          firstStudent = await prisma.user.findFirst({
            where: { role: 'siswa', classId: { in: advisorClassIds } }
          });
        } else {
          // Admin role
          firstStudent = await prisma.user.findFirst({
            where: { role: 'siswa' }
          });
        }

        if (firstStudent) {
          targetStudentId = firstStudent.id;
        } else {
          if (currentUser.role === 'admin') {
            await resetDatabaseAction();
            const seededStudent = await prisma.user.findFirst({
              where: { role: 'siswa' }
            });
            targetStudentId = seededStudent ? seededStudent.id : '';
          } else {
            targetStudentId = '';
          }
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
    const mappedCards: PKLCard[] = cards.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      columnId: c.columnId as PKLCard['columnId'],
      category: c.category,
      startTime: c.startTime,
      endTime: c.endTime,
      dueDate: c.dueDate,
      createdAt: c.createdAt.toISOString(),

      scoreMentor: c.scoreMentor ?? undefined,
      scoreMentorDiscipline: c.scoreMentorDiscipline ?? undefined,
      scoreMentorSkill: c.scoreMentorSkill ?? undefined,
      scoreMentorAttitude: c.scoreMentorAttitude ?? undefined,
      feedbackMentor: c.feedbackMentor ?? undefined,

      scoreAdvisor: c.scoreAdvisor ?? undefined,
      scoreAdvisorDiscipline: c.scoreAdvisorDiscipline ?? undefined,
      scoreAdvisorReport: c.scoreAdvisorReport ?? undefined,
      scoreAdvisorCommunication: c.scoreAdvisorCommunication ?? undefined,
      feedbackAdvisor: c.feedbackAdvisor ?? undefined,

      attachments: JSON.parse(c.attachmentsJson || '[]'),

      // Legacy compatibility mapping
      score: c.scoreMentor ?? undefined,
      feedback: c.feedbackMentor ?? undefined,

      comments: c.comments.map((comm: any) => ({
        id: comm.id,
        userName: comm.userName,
        role: comm.role as PKLRole,
        text: comm.text,
        createdAt: comm.createdAt.toISOString(),
      })),
      history: c.history.map((h: any) => ({
        id: h.id,
        text: h.text,
        createdAt: h.createdAt.toISOString(),
      })),
    }));

    const mappedNotes: AdvisorNote[] = advisorNotes.map((n: any) => ({
      id: n.id,
      advisorName: n.advisorName,
      text: n.text,
      createdAt: n.createdAt.toISOString(),
    }));

    // Find mentor assigned to student's company via relations
    let companyMentorName = 'Belum Ditugaskan';
    if (student.companyId) {
      const companyWithMentors = await prisma.perusahaan.findUnique({
        where: { id: student.companyId },
        include: { mentors: true }
      });
      if (companyWithMentors && companyWithMentors.mentors.length > 0) {
        companyMentorName = companyWithMentors.mentors.map(m => m.name).join(', ');
      }
    } else if (student.company) {
      const companyWithMentors = await prisma.perusahaan.findFirst({
        where: { name: student.company },
        include: { mentors: true }
      });
      if (companyWithMentors && companyWithMentors.mentors.length > 0) {
        companyMentorName = companyWithMentors.mentors.map(m => m.name).join(', ');
      } else {
        const legacyMentor = await prisma.user.findFirst({
          where: { role: 'pembimbing_eksternal', company: student.company }
        });
        if (legacyMentor) {
          companyMentorName = legacyMentor.name;
        }
      }
    }

    // Find school advisor assigned to student's class via relations
    let schoolAdvisorName = 'Belum Ditugaskan';
    if (student.classId) {
      const classWithAdvisors = await prisma.kelas.findUnique({
        where: { id: student.classId },
        include: { advisors: true }
      });
      if (classWithAdvisors && classWithAdvisors.advisors.length > 0) {
        schoolAdvisorName = classWithAdvisors.advisors.map(a => a.name).join(', ');
      }
    } else {
      const schoolAdvisor = await prisma.user.findFirst({
        where: { role: 'pembimbing_internal' }
      });
      if (schoolAdvisor) {
        schoolAdvisorName = schoolAdvisor.name;
      }
    }

    return {
      studentName: student.name,
      companyName: student.company || 'Belum Ditentukan',
      mentorName: companyMentorName,
      advisorName: schoolAdvisorName,
      cards: mappedCards,
      advisorNotes: mappedNotes,
      nisn: student.nisn || undefined,
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
  columnId: PKLCard['columnId'] = 'rencana',
  startTime: string = '',
  endTime: string = ''
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah.' };
    }

    if (currentUser.role !== 'siswa') {
      return { success: false, error: 'Hanya siswa yang dapat membuat rencana kegiatan' };
    }

    const card = await prisma.card.create({
      data: {
        title,
        description,
        category,
        dueDate,
        startTime,
        endTime,
        columnId,
        studentId: currentUser.id,
        history: {
          create: {
            text: `Card dibuat oleh ${currentUser.name} (Mahasiswa)`,
          },
        },
      },
    });
    return { success: true, cardId: card.id };
  } catch (error) {
    console.error('Failed to create card', error);
    return { success: false, error: 'Gagal membuat kegiatan.' };
  }
}

export async function updateCardColumnAction(
  cardId: string,
  targetColumn: PKLCard['columnId'],
  _actorName: string,
  _actorRole: PKLRole
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah atau telah berakhir.' };
    }

    if (targetColumn === 'selesai' && currentUser.role === 'siswa') {
      return {
        success: false,
        error: 'Siswa tidak dapat memindahkan kegiatan langsung ke status Selesai. Kegiatan harus dinilai/direview terlebih dahulu oleh Pembimbing.'
      };
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) return { success: false, error: 'Kegiatan tidak ditemukan.' };

    // RBAC validation
    if (currentUser.role === 'siswa') {
      if (card.studentId !== currentUser.id) {
        return { success: false, error: 'Akses ditolak: Anda bukan pemilik kegiatan ini.' };
      }
    } else if (currentUser.role === 'pembimbing_eksternal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canMentorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak: Siswa ini bukan dari perusahaan Anda.' };
      }
    } else if (currentUser.role === 'pembimbing_internal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canAdvisorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak: Siswa dari kelas lain.' };
      }
    }

    const columnNameIndonesian = {
      rencana: 'Rencana Kegiatan',
      progres: 'Sedang Dikerjakan',
      review: 'Butuh Review',
      selesai: 'Selesai (Disetujui)',
    };

    const displayRole = currentUser.role === 'siswa' ? 'Mahasiswa' : currentUser.role === 'pembimbing_eksternal' ? 'Mentor' : 'Dosen Pembimbing';
    const text = `Status dipindahkan dari [${columnNameIndonesian[card.columnId as PKLCard['columnId']]}] ke [${columnNameIndonesian[targetColumn]}] oleh ${currentUser.name} (${displayRole})`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumn,
          ...(targetColumn !== 'selesai' ? {
            scoreMentor: null,
            scoreMentorDiscipline: null,
            scoreMentorSkill: null,
            scoreMentorAttitude: null,
            feedbackMentor: null,
            scoreAdvisor: null,
            scoreAdvisorDiscipline: null,
            scoreAdvisorReport: null,
            scoreAdvisorCommunication: null,
            feedbackAdvisor: null
          } : {}),
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
    return { success: false, error: 'Gagal memproses perubahan kolom kegiatan.' };
  }
}

export async function updateCardDetailsAction(
  cardId: string,
  title: string,
  description: string,
  category: string,
  dueDate: string,
  startTime: string,
  endTime: string,
  _actorName: string,
  _actorRole: PKLRole,

  scoreMentor?: number | null,
  scoreMentorDiscipline?: number | null,
  scoreMentorSkill?: number | null,
  scoreMentorAttitude?: number | null,
  feedbackMentor?: string | null,

  scoreAdvisor?: number | null,
  scoreAdvisorDiscipline?: number | null,
  scoreAdvisorReport?: number | null,
  scoreAdvisorCommunication?: number | null,
  feedbackAdvisor?: string | null
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah atau telah berakhir.' };
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    const updateData: {
      title: string;
      description: string;
      category: string;
      dueDate: string;
      startTime: string;
      endTime: string;
      scoreMentor?: number | null;
      scoreMentorDiscipline?: number | null;
      scoreMentorSkill?: number | null;
      scoreMentorAttitude?: number | null;
      feedbackMentor?: string | null;
      scoreAdvisor?: number | null;
      scoreAdvisorDiscipline?: number | null;
      scoreAdvisorReport?: number | null;
      scoreAdvisorCommunication?: number | null;
      feedbackAdvisor?: string | null;
    } = {
      title,
      description,
      category,
      dueDate,
      startTime,
      endTime,
    };

    // Role-based field restrictions and auth verification
    if (currentUser.role === 'siswa') {
      if (card.studentId !== currentUser.id) {
        return { success: false, error: 'Akses ditolak: Anda bukan pemilik kegiatan ini.' };
      }
      // Siswa cannot change scores or feedback. They remain untouched.
    } else if (currentUser.role === 'pembimbing_eksternal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canMentorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak: Siswa dari perusahaan lain.' };
      }
      // Only external mentor can update mentor grades
      if (scoreMentor !== undefined) updateData.scoreMentor = scoreMentor;
      if (scoreMentorDiscipline !== undefined) updateData.scoreMentorDiscipline = scoreMentorDiscipline;
      if (scoreMentorSkill !== undefined) updateData.scoreMentorSkill = scoreMentorSkill;
      if (scoreMentorAttitude !== undefined) updateData.scoreMentorAttitude = scoreMentorAttitude;
      if (feedbackMentor !== undefined) updateData.feedbackMentor = feedbackMentor;
    } else if (currentUser.role === 'pembimbing_internal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canAdvisorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak: Siswa dari kelas lain.' };
      }
      // Only internal advisor can update advisor grades
      if (scoreAdvisor !== undefined) updateData.scoreAdvisor = scoreAdvisor;
      if (scoreAdvisorDiscipline !== undefined) updateData.scoreAdvisorDiscipline = scoreAdvisorDiscipline;
      if (scoreAdvisorReport !== undefined) updateData.scoreAdvisorReport = scoreAdvisorReport;
      if (scoreAdvisorCommunication !== undefined) updateData.scoreAdvisorCommunication = scoreAdvisorCommunication;
      if (feedbackAdvisor !== undefined) updateData.feedbackAdvisor = feedbackAdvisor;
    } else {
      return { success: false, error: 'Akses ditolak: Peran tidak sah.' };
    }

    const displayRole = currentUser.role === 'siswa' ? 'Mahasiswa' : currentUser.role === 'pembimbing_eksternal' ? 'Mentor' : 'Dosen Pembimbing';
    const text = `Detail kartu diperbarui oleh ${currentUser.name} (${displayRole})`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: updateData,
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
    return { success: false, error: 'Gagal memperbarui rincian kegiatan.' };
  }
}

export async function addCommentAction(
  cardId: string,
  text: string,
  _userName: string,
  _role: PKLRole
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah.' };
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    // Auth verification
    if (currentUser.role === 'siswa') {
      if (card.studentId !== currentUser.id) {
        return { success: false, error: 'Akses ditolak.' };
      }
    } else if (currentUser.role === 'pembimbing_eksternal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canMentorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak.' };
      }
    } else if (currentUser.role === 'pembimbing_internal') {
      const student = await prisma.user.findUnique({ where: { id: card.studentId } });
      if (!student || !canAdvisorAccessStudent(currentUser, student)) {
        return { success: false, error: 'Akses ditolak.' };
      }
    }

    const displayRole = currentUser.role === 'siswa' ? 'Mahasiswa' : currentUser.role === 'pembimbing_eksternal' ? 'Mentor' : 'Dosen Pembimbing';
    const historyText = `${currentUser.name} (${displayRole}) menambahkan komentar`;

    await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          cardId,
          text,
          userName: currentUser.name,
          role: displayRole,
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
    return { success: false, error: 'Gagal mengirim komentar.' };
  }
}

export async function gradeCardByMentorAction(
  cardId: string,
  discipline: number,
  skill: number,
  attitude: number,
  feedback: string,
  _mentorName: string
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'pembimbing_eksternal') {
      return { success: false, error: 'Akses ditolak: Hanya Mentor Lapangan yang dapat menilai kegiatan.' };
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    const student = await prisma.user.findUnique({ where: { id: card.studentId } });
    if (!student || !canMentorAccessStudent(currentUser, student)) {
      return { success: false, error: 'Akses ditolak: Siswa ini bukan dari perusahaan Anda.' };
    }

    // Input bounds validation (just in case)
    if (
      discipline < 0 || discipline > 100 ||
      skill < 0 || skill > 100 ||
      attitude < 0 || attitude > 100
    ) {
      return { success: false, error: 'Nilai harus berada dalam rentang 0 s.d 100.' };
    }

    const overallScore = Math.round((discipline + skill + attitude) / 3);
    const text = `Mentor ${currentUser.name} menyetujui & menilai (Rata-rata: ${overallScore}/100) - Disiplin: ${discipline}, Keahlian: ${skill}, Sikap: ${attitude}`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: 'selesai',
          scoreMentor: overallScore,
          scoreMentorDiscipline: discipline,
          scoreMentorSkill: skill,
          scoreMentorAttitude: attitude,
          feedbackMentor: feedback,
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
    console.error('Failed to grade card by mentor', error);
    return { success: false, error: 'Gagal memproses penilaian mentor.' };
  }
}

export async function gradeCardByAdvisorAction(
  cardId: string,
  discipline: number,
  report: number,
  communication: number,
  feedback: string,
  _advisorName: string
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'pembimbing_internal') {
      return { success: false, error: 'Akses ditolak: Hanya Pembimbing Internal (Sekolah) yang dapat menilai kegiatan.' };
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    const student = await prisma.user.findUnique({ where: { id: card.studentId } });
    if (!student || !canAdvisorAccessStudent(currentUser, student)) {
      return { success: false, error: 'Akses ditolak: Siswa dari kelas lain.' };
    }

    // Input bounds validation
    if (
      discipline < 0 || discipline > 100 ||
      report < 0 || report > 100 ||
      communication < 0 || communication > 100
    ) {
      return { success: false, error: 'Nilai harus berada dalam rentang 0 s.d 100.' };
    }

    const overallScore = Math.round((discipline + report + communication) / 3);
    const text = `Pembimbing Internal ${currentUser.name} menilai (Rata-rata: ${overallScore}/100) - Disiplin: ${discipline}, Laporan: ${report}, Komunikasi: ${communication}`;

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: cardId },
        data: {
          scoreAdvisor: overallScore,
          scoreAdvisorDiscipline: discipline,
          scoreAdvisorReport: report,
          scoreAdvisorCommunication: communication,
          feedbackAdvisor: feedback,
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
    console.error('Failed to grade card by advisor', error);
    return { success: false, error: 'Gagal memproses penilaian guru.' };
  }
}

export async function gradeCardAction(
  cardId: string,
  score: number,
  feedback: string,
  mentorName: string
) {
  return gradeCardByMentorAction(cardId, score, score, score, feedback, mentorName);
}

export async function uploadFileAction(formData: FormData) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah. Silakan masuk kembali.' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Berkas tidak ditemukan.' };
    }

    // Size limit check: 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Ukuran berkas melebihi batas 5MB.' };
    }

    // Sanitize filename & validate extension
    const ext = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.zip', '.rar'];
    if (!allowedExtensions.includes(ext)) {
      return { success: false, error: 'Tipe berkas tidak diizinkan. Hanya menerima gambar, PDF, Word, atau ZIP.' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine type
    let type = 'other';
    const mime = file.type.toLowerCase();
    if (mime.startsWith('image/')) type = 'image';
    else if (mime === 'application/pdf') type = 'pdf';
    else if (mime.includes('word') || mime.includes('officedocument') || ext === '.doc' || ext === '.docx') type = 'doc';

    // Environment Variable Check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Environment Variable untuk Supabase Storage belum dikonfigurasi (SUPABASE_URL, SUPABASE_ANON_KEY).' };
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload to Supabase Storage (bucket: 'attachments')
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, buffer, {
        contentType: mime,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { success: false, error: `Gagal mengunggah ke Supabase Storage: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName);

    return { success: true, fileUrl: publicUrlData.publicUrl, name: file.name, type };
  } catch (error) {
    console.error('File upload failed', error);
    return { success: false, error: 'Gagal mengunggah berkas.' };
  }
}

export async function addAttachmentAction(cardId: string, name: string, url: string, type: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah.' };
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return { success: false, error: 'Kegiatan tidak ditemukan.' };

    if (currentUser.role !== 'siswa' || card.studentId !== currentUser.id) {
      return { success: false, error: 'Akses ditolak: Hanya pemilik kegiatan yang dapat mengunggah lampiran.' };
    }

    const attachments = JSON.parse(card.attachmentsJson || '[]');
    attachments.push({ name, url, type });

    await prisma.card.update({
      where: { id: cardId },
      data: { attachmentsJson: JSON.stringify(attachments) }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to add attachment', error);
    return { success: false, error: 'Gagal menambahkan lampiran.' };
  }
}

export async function deleteAttachmentAction(cardId: string, index: number) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah.' };
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return { success: false, error: 'Kegiatan tidak ditemukan.' };

    if (currentUser.role !== 'siswa' || card.studentId !== currentUser.id) {
      return { success: false, error: 'Akses ditolak: Hanya pemilik kegiatan yang dapat menghapus lampiran.' };
    }

    const attachments = JSON.parse(card.attachmentsJson || '[]');
    attachments.splice(index, 1);

    await prisma.card.update({
      where: { id: cardId },
      data: { attachmentsJson: JSON.stringify(attachments) }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete attachment', error);
    return { success: false, error: 'Gagal menghapus lampiran.' };
  }
}

export async function addAdvisorNoteAction(text: string, advisorName: string, studentId: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'pembimbing_internal') {
      return { success: false, error: 'Akses ditolak: Hanya Guru Pembimbing yang dapat membuat catatan.' };
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'siswa' || !canAdvisorAccessStudent(currentUser, student)) {
      return { success: false, error: 'Akses ditolak: Siswa dari kelas lain.' };
    }

    const note = await prisma.advisorNote.create({
      data: {
        text,
        advisorName: currentUser.name,
        studentId,
        advisorId: currentUser.id,
      },
    });
    return { success: true, noteId: note.id };
  } catch (error) {
    console.error('Failed to add advisor note', error);
    return { success: false, error: 'Gagal menyimpan catatan bimbingan.' };
  }
}

export async function deleteCardAction(cardId: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak sah.' };
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return { success: false, error: 'Kegiatan tidak ditemukan.' };

    if (currentUser.role !== 'siswa' || card.studentId !== currentUser.id) {
      return { success: false, error: 'Akses ditolak: Hanya pemilik kegiatan yang dapat menghapusnya.' };
    }

    await prisma.card.delete({
      where: { id: cardId },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete card', error);
    return { success: false, error: 'Gagal menghapus kegiatan.' };
  }
}

export async function getStudentsAction(classId?: string, companyId?: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role === 'siswa') {
      return [];
    }

    const whereClause: {
      role: string;
      classId?: string | null | { in: string[] };
      companyId?: string | null | { in: string[] };
    } = { role: 'siswa' };

    // Apply role-based constraints and client-selected filters
    if (currentUser.role === 'pembimbing_eksternal') {
      const mentorCompanyIds = currentUser.companies.map((c: { id: string }) => c.id);
      if (mentorCompanyIds.length === 0) {
        return [];
      }
      if (companyId && mentorCompanyIds.includes(companyId)) {
        whereClause.companyId = companyId;
      } else {
        whereClause.companyId = { in: mentorCompanyIds };
      }
    } else if (currentUser.role === 'pembimbing_internal') {
      const advisorClassIds = currentUser.classes.map((c: { id: string }) => c.id);
      if (advisorClassIds.length === 0) {
        return [];
      }
      if (classId && advisorClassIds.includes(classId)) {
        whereClause.classId = classId;
      } else {
        whereClause.classId = { in: advisorClassIds };
      }
    } else if (currentUser.role === 'admin') {
      if (classId) {
        whereClause.classId = classId;
      }
      if (companyId) {
        whereClause.companyId = companyId;
      }
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        company: true,
        createdAt: true,
        classId: true,
        companyId: true,
        nisn: true,
        class: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        const cards = await prisma.card.findMany({
          where: { studentId: student.id },
          select: { columnId: true, startTime: true, endTime: true }
        });

        const totalHours = cards.reduce((sum, c) => sum + calculateDuration(c.startTime, c.endTime), 0);
        const completedCount = cards.filter(c => c.columnId === 'selesai').length;
        const totalCount = cards.length;

        return {
          id: student.id,
          name: student.name,
          company: student.company || '-',
          classId: student.classId || '-',
          className: student.class?.name || '-',
          companyId: student.companyId || '-',
          nisn: student.nisn || '-',
          totalTasks: totalCount,
          completedTasks: completedCount,
          hoursLogged: Math.round(totalHours),
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
      prisma.kelas.deleteMany(),
      prisma.perusahaan.deleteMany(),
    ]);

    // Seed Kelas
    const predefinedClasses = [
      'XII PPLG 1', 'XII PPLG 2', 'XII PPLG 3',
      'XII TO 1', 'XII TO 2', 'XII TO 3',
      'XII TM 1', 'XII TM 2', 'XII TM 3',
      'XII KULINER 1', 'XII KULINER 2',
      'XII DB 1', 'XII DB 2',
      'XII MPLB 1', 'XII MPLB 2', 'XII MPLB 3',
      'XII APART', 'XII UPT',
      'XII AKL 1', 'XII AKL 2'
    ];

    const seededClasses: Record<string, any> = {};
    for (const className of predefinedClasses) {
      const cls = await prisma.kelas.create({ data: { name: className } });
      seededClasses[className] = cls;
    }

    const class1 = seededClasses['XII PPLG 1'];
    const class2 = seededClasses['XII PPLG 2'];

    // Seed Perusahaan
    const comp1 = await prisma.perusahaan.create({ data: { name: 'PT Teknologi Nusantara' } });
    const comp2 = await prisma.perusahaan.create({ data: { name: 'PT Telkom Indonesia' } });
    await prisma.perusahaan.create({ data: { name: 'PT Astra International' } });
    await prisma.perusahaan.create({ data: { name: 'PLN' } });

    // Seed mock users
    const studentUser = await prisma.user.create({
      data: {
        username: 'siswa',
        password: hashPassword('siswa'),
        name: 'Rian Adriadi',
        role: 'siswa',
        company: 'PT Teknologi Nusantara',
        nisn: '222310123',
        classId: class1.id,
        companyId: comp1.id,
      }
    });

    await prisma.user.create({
      data: {
        username: 'mentor',
        password: hashPassword('mentor'),
        name: 'Budi Santoso, S.Kom.',
        role: 'pembimbing_eksternal',
        company: 'PT Teknologi Nusantara',
        companies: {
          connect: { id: comp1.id }
        }
      }
    });

    const advisorUser = await prisma.user.create({
      data: {
        username: 'dosen',
        password: hashPassword('dosen'),
        name: 'Dr. Ir. Heryanto, M.T.',
        role: 'pembimbing_internal',
        school: 'SMKN 1 BOJONG',
        classes: {
          connect: [
            { id: class1.id },
            { id: class2.id }
          ]
        }
      }
    });

    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashPassword('admin'),
        name: 'Administrator SMKN 1 Bojong',
        role: 'admin'
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
        startTime: '08:00',
        endTime: '16:00',
        dueDate: dateOffset(-8).toISOString().split('T')[0],
        createdAt: dateOffset(-12),
        scoreMentor: 92,
        scoreMentorDiscipline: 90,
        scoreMentorSkill: 95,
        scoreMentorAttitude: 91,
        feedbackMentor: 'Desain bersih, alur UX sangat intuitif, dan implementasi auto-layout Figma sangat baik. Lanjutkan ke tahap slicing code!',
        scoreAdvisor: 85,
        scoreAdvisorDiscipline: 80,
        scoreAdvisorReport: 90,
        scoreAdvisorCommunication: 85,
        feedbackAdvisor: 'Laporan tersusun dengan sangat baik, layout UI di Figma terlihat rapi.',
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
        startTime: '09:00',
        endTime: '17:00',
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
        startTime: '08:30',
        endTime: '17:00',
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
        startTime: '',
        endTime: '',
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
        startTime: '',
        endTime: '',
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
    return { success: false, error: 'Database reset failed.' };
  }
}

// --- Kelas Actions ---
export async function getClassesAction() {
  try {
    return prisma.kelas.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get classes', error);
    return [];
  }
}

export async function createClassAction(name: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data kelas.' };
    }

    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama kelas tidak boleh kosong.' };
    const existing = await prisma.kelas.findUnique({ where: { name: cleanName } });
    if (existing) return { success: false, error: 'Nama kelas sudah terdaftar.' };

    const kelas = await prisma.kelas.create({ data: { name: cleanName } });
    return { success: true, classId: kelas.id };
  } catch (error) {
    console.error('Failed to create class', error);
    return { success: false, error: 'Gagal membuat kelas.' };
  }
}

export async function updateClassAction(id: string, name: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data kelas.' };
    }

    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama kelas tidak boleh kosong.' };
    const existing = await prisma.kelas.findFirst({
      where: { name: cleanName, id: { not: id } }
    });
    if (existing) return { success: false, error: 'Nama kelas sudah terdaftar.' };

    await prisma.kelas.update({
      where: { id },
      data: { name: cleanName }
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update class', error);
    return { success: false, error: 'Gagal mengubah kelas.' };
  }
}

export async function deleteClassAction(id: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data kelas.' };
    }

    const usersCount = await prisma.user.count({ where: { classId: id } });
    if (usersCount > 0) {
      return { success: false, error: 'Kelas tidak bisa dihapus karena masih memiliki siswa.' };
    }
    await prisma.kelas.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete class', error);
    return { success: false, error: 'Gagal menghapus kelas.' };
  }
}

// --- Perusahaan Actions ---
export async function getCompaniesAction() {
  try {
    const currentUser = await getAuthenticatedUser();
    
    if (currentUser?.role === 'pembimbing_eksternal') {
      const mentorCompanyIds = currentUser.companies.map((c: { id: string }) => c.id);
      return prisma.perusahaan.findMany({
        where: { id: { in: mentorCompanyIds } },
        orderBy: { name: 'asc' },
      });
    }

    return prisma.perusahaan.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get companies', error);
    return [];
  }
}

export async function createCompanyAction(name: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data perusahaan.' };
    }

    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama perusahaan tidak boleh kosong.' };
    const existing = await prisma.perusahaan.findUnique({ where: { name: cleanName } });
    if (existing) return { success: false, error: 'Nama perusahaan sudah terdaftar.' };

    const company = await prisma.perusahaan.create({ data: { name: cleanName } });
    return { success: true, companyId: company.id };
  } catch (error) {
    console.error('Failed to create company', error);
    return { success: false, error: 'Gagal membuat perusahaan.' };
  }
}

export async function updateCompanyAction(id: string, name: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data perusahaan.' };
    }

    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama perusahaan tidak boleh kosong.' };
    const existing = await prisma.perusahaan.findFirst({
      where: { name: cleanName, id: { not: id } }
    });
    if (existing) return { success: false, error: 'Nama perusahaan sudah terdaftar.' };

    await prisma.perusahaan.update({
      where: { id },
      data: { name: cleanName }
    });

    // Sync company text strings for compatibility
    await prisma.user.updateMany({
      where: { companyId: id },
      data: { company: cleanName }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update company', error);
    return { success: false, error: 'Gagal mengubah perusahaan.' };
  }
}

export async function deleteCompanyAction(id: string) {
  try {
    const currentUser = await requireAdmin();
    if (!currentUser) {
      return { success: false, error: 'Hanya admin yang dapat mengelola data perusahaan.' };
    }

    const usersCount = await prisma.user.count({ where: { companyId: id } });
    if (usersCount > 0) {
      return { success: false, error: 'Perusahaan tidak bisa dihapus karena masih memiliki siswa.' };
    }
    await prisma.perusahaan.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete company', error);
    return { success: false, error: 'Gagal menghapus perusahaan.' };
  }
}

// --- User Management & Assignment Actions ---
export async function getAllUsersAction() {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }

    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        company: true,
        classId: true,
        companyId: true,
        nisn: true,
        classes: {
          select: {
            id: true,
            name: true
          }
        },
        companies: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Failed to fetch users', error);
    return [];
  }
}

export async function assignGuruToClassAction(userId: string, classIds: string[]) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Hanya admin yang dapat mengubah assignment.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'pembimbing_internal') {
      return { success: false, error: 'User bukan Pembimbing Internal.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        classes: {
          set: classIds.map(id => ({ id }))
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to assign guru to class', error);
    return { success: false, error: 'Gagal memperbarui hubungan Guru ↔ Kelas.' };
  }
}

export async function assignMentorToCompanyAction(userId: string, companyIds: string[]) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Hanya admin yang dapat mengubah assignment.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'pembimbing_eksternal') {
      return { success: false, error: 'User bukan Pembimbing Eksternal.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        companies: {
          set: companyIds.map(id => ({ id }))
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to assign mentor to company', error);
    return { success: false, error: 'Gagal memperbarui hubungan Mentor ↔ Perusahaan.' };
  }
}

export async function assignSiswaAction(
  userId: string,
  classId: string | null,
  companyId: string | null,
  name?: string,
  nisn?: string
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Hanya admin yang dapat mengubah assignment.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.role !== 'siswa') {
      return { success: false, error: 'User bukan Siswa.' };
    }

    let finalCompanyName = null;
    if (companyId) {
      const dbCompany = await prisma.perusahaan.findUnique({ where: { id: companyId } });
      if (dbCompany) {
        finalCompanyName = dbCompany.name;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        classId: classId || null,
        companyId: companyId || null,
        company: finalCompanyName,
        name: name !== undefined ? name.trim() : undefined,
        nisn: nisn !== undefined ? nisn.trim() : undefined
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to assign student', error);
    return { success: false, error: 'Gagal memperbarui assignment siswa.' };
  }
}

export async function getDashboardMetricsAction(classId?: string, companyId?: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role === 'siswa') {
      return null;
    }

    const whereClause: {
      role: string;
      classId?: string | null | { in: string[] };
      companyId?: string | null | { in: string[] };
    } = { role: 'siswa' };

    if (currentUser.role === 'pembimbing_eksternal') {
      const mentorCompanyIds = currentUser.companies.map((c: { id: string }) => c.id);
      if (mentorCompanyIds.length === 0) {
        return {
          totalStudents: 0,
          monitoringToday: 0,
          pendingReview: 0,
          pendingGrades: 0,
          averageGrade: 0,
          columnCounts: { rencana: 0, progres: 0, review: 0, selesai: 0 }
        };
      }
      if (companyId && mentorCompanyIds.includes(companyId)) {
        whereClause.companyId = companyId;
      } else {
        whereClause.companyId = { in: mentorCompanyIds };
      }
    } else if (currentUser.role === 'pembimbing_internal') {
      const advisorClassIds = currentUser.classes.map((c: { id: string }) => c.id);
      if (advisorClassIds.length === 0) {
        return {
          totalStudents: 0,
          monitoringToday: 0,
          pendingReview: 0,
          pendingGrades: 0,
          averageGrade: 0,
          columnCounts: { rencana: 0, progres: 0, review: 0, selesai: 0 }
        };
      }
      if (classId && advisorClassIds.includes(classId)) {
        whereClause.classId = classId;
      } else {
        whereClause.classId = { in: advisorClassIds };
      }
    } else if (currentUser.role === 'admin') {
      if (classId) whereClause.classId = classId;
      if (companyId) whereClause.companyId = companyId;
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    const totalStudents = students.length;

    if (studentIds.length === 0) {
      return {
        totalStudents: 0,
        monitoringToday: 0,
        pendingReview: 0,
        pendingGrades: 0,
        averageGrade: 0,
        columnCounts: { rencana: 0, progres: 0, review: 0, selesai: 0 }
      };
    }

    // Cards updated today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const monitoringToday = await prisma.card.count({
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: startOfToday }
      }
    });

    // Cards in review
    const pendingReview = await prisma.card.count({
      where: {
        studentId: { in: studentIds },
        columnId: 'review'
      }
    });

    // Pending grades & average grades
    let pendingGrades = 0;
    let averageGrade = 0;

    if (currentUser.role === 'pembimbing_internal' || currentUser.role === 'admin') {
      pendingGrades = await prisma.card.count({
        where: {
          studentId: { in: studentIds },
          columnId: { in: ['review', 'selesai'] },
          scoreAdvisor: null
        }
      });

      const gradesAggregate = await prisma.card.aggregate({
        where: {
          studentId: { in: studentIds },
          scoreAdvisor: { not: null }
        },
        _avg: {
          scoreAdvisor: true
        }
      });
      averageGrade = gradesAggregate._avg.scoreAdvisor ? Math.round(gradesAggregate._avg.scoreAdvisor) : 0;
    } else {
      pendingGrades = await prisma.card.count({
        where: {
          studentId: { in: studentIds },
          columnId: { in: ['review', 'selesai'] },
          scoreMentor: null
        }
      });

      const gradesAggregate = await prisma.card.aggregate({
        where: {
          studentId: { in: studentIds },
          scoreMentor: { not: null }
        },
        _avg: {
          scoreMentor: true
        }
      });
      averageGrade = gradesAggregate._avg.scoreMentor ? Math.round(gradesAggregate._avg.scoreMentor) : 0;
    }

    const columns = ['rencana', 'progres', 'review', 'selesai'];
    const columnCounts = { rencana: 0, progres: 0, review: 0, selesai: 0 };
    for (const col of columns) {
      const count = await prisma.card.count({
        where: {
          studentId: { in: studentIds },
          columnId: col
        }
      });
      columnCounts[col as keyof typeof columnCounts] = count;
    }

    return {
      totalStudents,
      monitoringToday,
      pendingReview,
      pendingGrades,
      averageGrade,
      columnCounts
    };
  } catch (error) {
    console.error('Failed to get dashboard metrics', error);
    return null;
  }
}
