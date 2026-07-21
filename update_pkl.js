const fs = require('fs');

let content = fs.readFileSync('src/app/actions/pkl.ts', 'utf8');

// 1. getClassesAction
content = content.replace(
  `export async function getClassesAction() {
  try {
    return prisma.kelas.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {`,
  `export async function getClassesAction() {
  try {
    const currentUser = await getAuthenticatedUser();
    let whereClause = {};
    if (currentUser?.institutionId) {
      whereClause = { institutionId: currentUser.institutionId };
    }
    return prisma.kelas.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  } catch (error) {`
);

// 2. createClassAction
content = content.replace(
  `export async function createClassAction(name: string) {
  try {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama kelas tidak valid.' };

    const existing = await prisma.kelas.findUnique({ where: { name: cleanName } });`,
  `export async function createClassAction(name: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !currentUser.institutionId) {
      return { success: false, error: 'User tidak memiliki institusi.' };
    }
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama kelas tidak valid.' };

    const existing = await prisma.kelas.findFirst({ where: { name: cleanName, institutionId: currentUser.institutionId } });`
);
content = content.replace(
  `await prisma.kelas.create({ data: { name: cleanName } });`,
  `await prisma.kelas.create({ data: { name: cleanName, institutionId: currentUser.institutionId } });`
);

// 3. getCompaniesAction
content = content.replace(
  `export async function getCompaniesAction() {
  try {
    return prisma.perusahaan.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {`,
  `export async function getCompaniesAction() {
  try {
    const currentUser = await getAuthenticatedUser();
    let whereClause = {};
    if (currentUser?.institutionId) {
      whereClause = { institutionId: currentUser.institutionId };
    }
    return prisma.perusahaan.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  } catch (error) {`
);

// 4. createCompanyAction
content = content.replace(
  `export async function createCompanyAction(name: string) {
  try {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama perusahaan tidak valid.' };

    const existing = await prisma.perusahaan.findUnique({ where: { name: cleanName } });`,
  `export async function createCompanyAction(name: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || !currentUser.institutionId) {
      return { success: false, error: 'User tidak memiliki institusi.' };
    }
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Nama perusahaan tidak valid.' };

    const existing = await prisma.perusahaan.findFirst({ where: { name: cleanName, institutionId: currentUser.institutionId } });`
);
content = content.replace(
  `await prisma.perusahaan.create({ data: { name: cleanName } });`,
  `await prisma.perusahaan.create({ data: { name: cleanName, institutionId: currentUser.institutionId } });`
);

// 5. getAllUsersAction
content = content.replace(
  `    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN')) {
      return [];
    }

    const whereClause: any = {};
    if (currentUser.role === 'INSTITUTION_ADMIN' && currentUser.institutionId) {
      whereClause.institutionId = currentUser.institutionId;
    }`,
  `    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN' && currentUser.role !== 'admin')) {
      return [];
    }

    const whereClause: any = {};
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.institutionId) {
      whereClause.institutionId = currentUser.institutionId;
    }`
);

// 6. getDashboardMetricsAction
content = content.replace(
  `    const whereClause: {
      role: string | { in: string[] };
      classId?: string | null | { in: string[] };
      companyId?: string | null | { in: string[] };
    } = { role: { in: PARTICIPANT_ROLES } };`,
  `    const whereClause: {
      role: string | { in: string[] };
      classId?: string | null | { in: string[] };
      companyId?: string | null | { in: string[] };
      institutionId?: string | null;
    } = { role: { in: PARTICIPANT_ROLES } };`
);
content = content.replace(
  `    } else if ((currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INSTITUTION_ADMIN')) {
      if (classId) whereClause.classId = classId;
      if (companyId) whereClause.companyId = companyId;
    }`,
  `    } else if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INSTITUTION_ADMIN' || currentUser.role === 'admin') {
      if (currentUser.role !== 'SUPER_ADMIN' && currentUser.institutionId) {
        whereClause.institutionId = currentUser.institutionId;
      }
      if (classId) whereClause.classId = classId;
      if (companyId) whereClause.companyId = companyId;
    }`
);

// 7. assignSiswaAction -> updateUserByAdminAction
content = content.replace(
  `export async function assignSiswaAction(
  userId: string,
  classId: string | null,
  companyId: string | null,
  name?: string,
  nisn?: string
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN')) {
      return { success: false, error: 'Hanya admin yang dapat mengubah assignment.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || !PARTICIPANT_ROLES.includes(targetUser.role)) {
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
}`,
  `export async function updateUserByAdminAction(
  userId: string,
  classId?: string | null,
  companyId?: string | null,
  name?: string,
  nisn?: string,
  nip?: string,
  jabatan?: string,
  employeeId?: string,
  companyEmail?: string,
  companyName?: string
) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'INSTITUTION_ADMIN' && currentUser.role !== 'admin')) {
      return { success: false, error: 'Hanya admin yang dapat mengubah data pengguna.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    let finalCompanyName = targetUser.company;
    if (companyId !== undefined) {
      if (companyId === null) {
        finalCompanyName = null;
      } else {
        const dbCompany = await prisma.perusahaan.findUnique({ where: { id: companyId } });
        if (dbCompany) {
          finalCompanyName = dbCompany.name;
        }
      }
    }
    if (companyName !== undefined) {
      finalCompanyName = companyName ? companyName.trim() : null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(classId !== undefined ? { classId: classId || null } : {}),
        ...(companyId !== undefined ? { companyId: companyId || null } : {}),
        company: finalCompanyName,
        companyName: finalCompanyName,
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(nisn !== undefined ? { nisn: nisn.trim() } : {}),
        ...(nip !== undefined ? { nip: nip.trim() } : {}),
        ...(jabatan !== undefined ? { jabatan: jabatan.trim(), jobTitle: jabatan.trim() } : {}),
        ...(employeeId !== undefined ? { employeeId: employeeId.trim() } : {}),
        ...(companyEmail !== undefined ? { companyEmail: companyEmail.trim() } : {})
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update user', error);
    return { success: false, error: 'Gagal memperbarui data pengguna.' };
  }
}`
);

fs.writeFileSync('src/app/actions/pkl.ts', content);
