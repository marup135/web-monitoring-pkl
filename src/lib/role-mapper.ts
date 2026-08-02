export type InstitutionType = 'SCHOOL' | 'UNIVERSITY' | 'TRAINING_CENTER' | 'COMPANY' | 'OTHER';

export function getParticipantLabel(type: InstitutionType | undefined | null): string {
  switch (type) {
    case 'UNIVERSITY':
      return 'Mahasiswa';
    case 'TRAINING_CENTER':
      return 'Peserta Pelatihan';
    case 'COMPANY':
      return 'Peserta Magang';
    case 'SCHOOL':
    default:
      return 'Siswa';
  }
}

export function getInternalMentorLabel(type: InstitutionType | undefined | null): string {
  switch (type) {
    case 'SCHOOL':
      return 'Guru Pembimbing';
    case 'UNIVERSITY':
      return 'Dosen Pembimbing';
    case 'TRAINING_CENTER':
      return 'Instruktur';
    case 'COMPANY':
      return 'Internal Mentor';
    default:
      return 'Pembimbing Internal';
  }
}

export function getExternalMentorLabel(type: InstitutionType | undefined | null): string {
  switch (type) {
    case 'SCHOOL':
      return 'Pembimbing Lapangan';
    case 'UNIVERSITY':
      return 'Supervisor';
    case 'TRAINING_CENTER':
      return 'Mentor Industri';
    case 'COMPANY':
      return 'External Mentor';
    default:
      return 'Pembimbing Eksternal';
  }
}

export function getIdLabel(type: InstitutionType | undefined | null): string {
  switch (type) {
    case 'UNIVERSITY':
      return 'NIM';
    case 'SCHOOL':
      return 'NISN';
    case 'TRAINING_CENTER':
      return 'ID Peserta';
    case 'COMPANY':
      return 'ID Magang';
    default:
      return 'NISN';
  }
}

import { PARTICIPANT_ROLES } from './constants';

export function getRoleLabel(role: string, type?: InstitutionType | null): string {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'INSTITUTION_ADMIN') return 'Admin Institusi';
  if (role === 'INTERNAL_MENTOR') return getInternalMentorLabel(type);
  if (role === 'EXTERNAL_MENTOR') return getExternalMentorLabel(type);
  if (PARTICIPANT_ROLES.includes(role)) return getParticipantLabel(type);
  if (!role) return '';
  return role.replace('_', ' ');
}

