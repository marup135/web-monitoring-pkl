export type PKLRole = 'Mahasiswa' | 'Mentor' | 'Dosen Pembimbing';

export interface Comment {
  id: string;
  userName: string;
  role: PKLRole;
  text: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  createdAt: string;
}

export type TaskCategory = string;

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface PKLCard {
  id: string;
  title: string;
  description: string;
  columnId: 'rencana' | 'progres' | 'review' | 'selesai';
  category: string;
  startTime: string;
  endTime: string;
  dueDate: string;
  createdAt: string;
  studentId: string;
  collaborators?: { id: string; name: string; nisn?: string; profileImage?: string }[];
  collaboratorsCanEdit?: boolean;
  
  // Mentor (Pembimbing Eksternal) grades
  scoreMentor?: number;
  scoreMentorDiscipline?: number;
  scoreMentorSkill?: number;
  scoreMentorAttitude?: number;
  feedbackMentor?: string;

  // Advisor (Pembimbing Internal / Guru) grades
  scoreAdvisor?: number;
  scoreAdvisorDiscipline?: number;
  scoreAdvisorReport?: number;
  scoreAdvisorCommunication?: number;
  feedbackAdvisor?: string;

  // Attachments
  attachments: Attachment[];

  // Legacy fields for compatibility
  score?: number;
  feedback?: string;

  comments: Comment[];
  history: HistoryItem[];
}

export interface AdvisorNote {
  id: string;
  advisorName: string;
  text: string;
  createdAt: string;
}

export interface PKLState {
  cards: PKLCard[];
  advisorNotes: AdvisorNote[];
  studentName: string;
  companyName: string;
  mentorName: string;
  advisorName: string;
  nisn?: string;
}
