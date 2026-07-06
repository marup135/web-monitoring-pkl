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

export type TaskCategory = 'Coding' | 'Design' | 'Laporan' | 'Networking' | 'Lainnya';

export interface PKLCard {
  id: string;
  title: string;
  description: string;
  columnId: 'rencana' | 'progres' | 'review' | 'selesai';
  category: TaskCategory;
  hoursLogged: number;
  dueDate: string;
  createdAt: string;
  score?: number;      // 1-100 assigned by mentor
  feedback?: string;   // final approval feedback from mentor
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
}
