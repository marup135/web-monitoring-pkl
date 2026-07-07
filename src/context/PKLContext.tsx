'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PKLState, PKLCard, PKLRole, TaskCategory } from '../types/pkl';
import {
  getPKLState,
  createCardAction,
  updateCardColumnAction,
  updateCardDetailsAction,
  addCommentAction,
  gradeCardAction,
  gradeCardByMentorAction,
  gradeCardByAdvisorAction,
  addAdvisorNoteAction,
  deleteCardAction,
  resetDatabaseAction,
  getStudentsAction,
  addAttachmentAction,
  deleteAttachmentAction,
} from '@/app/actions/pkl';
import {
  registerAction,
  loginAction,
  logoutAction,
  getCurrentUserAction,
} from '@/app/actions/auth';

interface PKLContextProps {
  state: PKLState;
  activeRole: PKLRole;
  activeTab: 'board' | 'logbook' | 'stats';
  loading: boolean;
  currentUser: any | null;
  studentsList: any[];
  selectedStudentId: string | null;
  setActiveTab: (tab: 'board' | 'logbook' | 'stats') => void;
  setSelectedStudentId: (studentId: string | null) => Promise<void>;
  addCard: (title: string, description: string, category: string, dueDate: string, columnId?: PKLCard['columnId']) => Promise<void>;
  updateCardColumn: (cardId: string, targetColumn: PKLCard['columnId']) => Promise<void>;
  updateCardDetails: (
    cardId: string,
    title: string,
    description: string,
    category: string,
    dueDate: string,
    startTime: string,
    endTime: string,
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
  ) => Promise<void>;
  addComment: (cardId: string, text: string) => Promise<void>;
  gradeCard: (cardId: string, score: number, feedback: string) => Promise<void>;
  gradeCardByMentor: (cardId: string, discipline: number, skill: number, attitude: number, feedback: string) => Promise<void>;
  gradeCardByAdvisor: (cardId: string, discipline: number, report: number, communication: number, feedback: string) => Promise<void>;
  addAttachment: (cardId: string, name: string, url: string, type: string) => Promise<void>;
  deleteAttachment: (cardId: string, index: number) => Promise<void>;
  addAdvisorNote: (text: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  resetState: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, name: string, role: string, company?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const PKLContext = createContext<PKLContextProps | undefined>(undefined);

export const PKLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PKLState>({
    studentName: 'Belum Login',
    companyName: '-',
    mentorName: '-',
    advisorName: '-',
    cards: [],
    advisorNotes: [],
  });
  const [activeTab, setActiveTab] = useState<'board' | 'logbook' | 'stats'>('board');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(null);

  const activeRole: PKLRole = currentUser
    ? currentUser.role === 'siswa'
      ? 'Mahasiswa'
      : currentUser.role === 'pembimbing_eksternal'
      ? 'Mentor'
      : 'Dosen Pembimbing'
    : 'Mahasiswa';

  // Fetch complete PKL state based on user role and selection
  const fetchState = async (user = currentUser, studentId = selectedStudentId) => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'siswa') {
        const dbState = await getPKLState();
        setState(dbState);
      } else {
        const list = await getStudentsAction();
        setStudentsList(list);

        let targetId = studentId;
        if (!targetId && list.length > 0) {
          targetId = list[0].id;
          setSelectedStudentIdState(targetId);
        }

        if (targetId) {
          const dbState = await getPKLState(targetId);
          setState(dbState);
        } else {
          // Empty state if no students
          setState({
            studentName: 'Belum ada siswa',
            companyName: '-',
            mentorName: '-',
            advisorName: '-',
            cards: [],
            advisorNotes: [],
          });
        }
      }
    } catch (e) {
      console.error('Error fetching PKL state', e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load to restore session
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUserAction();
        if (user) {
          setCurrentUser(user);
          await fetchState(user, null);
        }
      } catch (err) {
        console.error('Failed to restore auth session', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginAction(username, password);
      if (res.success) {
        setCurrentUser(res.user);
        setSelectedStudentIdState(null);
        await fetchState(res.user, null);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, name: string, role: string, company?: string) => {
    setLoading(true);
    try {
      const res = await registerAction(username, password, name, role, company);
      if (res.success) {
        setCurrentUser(res.user);
        setSelectedStudentIdState(null);
        await fetchState(res.user, null);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutAction();
      setCurrentUser(null);
      setStudentsList([]);
      setSelectedStudentIdState(null);
      setState({
        studentName: 'Belum Login',
        companyName: '-',
        mentorName: '-',
        advisorName: '-',
        cards: [],
        advisorNotes: [],
      });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedStudentId = async (studentId: string | null) => {
    setSelectedStudentIdState(studentId);
    if (studentId && currentUser) {
      await fetchState(currentUser, studentId);
    }
  };

  const addCard = async (title: string, description: string, category: string, dueDate: string, columnId?: PKLCard['columnId']) => {
    setLoading(true);
    try {
      await createCardAction(title, description, category, dueDate, state.studentName, activeRole, columnId);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal membuat kegiatan.');
      setLoading(false);
    }
  };

  const updateCardColumn = async (cardId: string, targetColumn: PKLCard['columnId']) => {
    const originalCards = state.cards;
    setState(prev => ({
      ...prev,
      cards: prev.cards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            columnId: targetColumn,
          };
        }
        return card;
      }),
    }));

    try {
      const actorName = currentUser ? currentUser.name : state.studentName;
      await updateCardColumnAction(cardId, targetColumn, actorName, activeRole);
      await fetchState();
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, cards: originalCards }));
      alert('Gagal memindahkan status kegiatan.');
    }
  };

  const updateCardDetails = async (
    cardId: string,
    title: string,
    description: string,
    category: string,
    dueDate: string,
    startTime: string,
    endTime: string,
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
  ) => {
    setLoading(true);
    try {
      const actorName = currentUser ? currentUser.name : state.studentName;
      await updateCardDetailsAction(
        cardId,
        title,
        description,
        category,
        dueDate,
        startTime,
        endTime,
        actorName,
        activeRole,
        scoreMentor,
        scoreMentorDiscipline,
        scoreMentorSkill,
        scoreMentorAttitude,
        feedbackMentor,
        scoreAdvisor,
        scoreAdvisorDiscipline,
        scoreAdvisorReport,
        scoreAdvisorCommunication,
        feedbackAdvisor
      );
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui detail kegiatan.');
      setLoading(false);
    }
  };

  const addComment = async (cardId: string, text: string) => {
    setLoading(true);
    try {
      const actorName = currentUser ? currentUser.name : state.studentName;
      await addCommentAction(cardId, text, actorName, activeRole);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menambahkan komentar.');
      setLoading(false);
    }
  };

  const gradeCard = async (cardId: string, score: number, feedback: string) => {
    setLoading(true);
    try {
      await gradeCardAction(cardId, score, feedback, state.mentorName);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menilai kegiatan.');
      setLoading(false);
    }
  };

  const gradeCardByMentor = async (cardId: string, discipline: number, skill: number, attitude: number, feedback: string) => {
    setLoading(true);
    try {
      await gradeCardByMentorAction(cardId, discipline, skill, attitude, feedback, state.mentorName);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menilai kegiatan (Mentor).');
      setLoading(false);
    }
  };

  const gradeCardByAdvisor = async (cardId: string, discipline: number, report: number, communication: number, feedback: string) => {
    setLoading(true);
    try {
      await gradeCardByAdvisorAction(cardId, discipline, report, communication, feedback, state.advisorName);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menilai kegiatan (Guru).');
      setLoading(false);
    }
  };

  const addAttachment = async (cardId: string, name: string, url: string, type: string) => {
    setLoading(true);
    try {
      await addAttachmentAction(cardId, name, url, type);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menambahkan lampiran.');
      setLoading(false);
    }
  };

  const deleteAttachment = async (cardId: string, index: number) => {
    setLoading(true);
    try {
      await deleteAttachmentAction(cardId, index);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus lampiran.');
      setLoading(false);
    }
  };

  const addAdvisorNote = async (text: string) => {
    setLoading(true);
    try {
      const targetStudentId = currentUser?.role === 'siswa' ? currentUser.id : selectedStudentId;
      if (!targetStudentId) throw new Error('No student selected');
      await addAdvisorNoteAction(text, state.advisorName, targetStudentId);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan catatan bimbingan.');
      setLoading(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    setLoading(true);
    try {
      await deleteCardAction(cardId);
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus kegiatan.');
      setLoading(false);
    }
  };

  const resetState = async () => {
    setLoading(true);
    try {
      await resetDatabaseAction();
      await fetchState();
    } catch (e) {
      console.error(e);
      alert('Gagal mereset data database.');
      setLoading(false);
    }
  };

  return (
    <PKLContext.Provider
      value={{
        state,
        activeRole,
        activeTab,
        loading,
        currentUser,
        studentsList,
        selectedStudentId,
        setActiveTab,
        setSelectedStudentId,
        addCard,
        updateCardColumn,
        updateCardDetails,
        addComment,
        gradeCard,
        gradeCardByMentor,
        gradeCardByAdvisor,
        addAttachment,
        deleteAttachment,
        addAdvisorNote,
        deleteCard,
        resetState,
        login,
        register,
        logout,
      }}
    >
      {children}
    </PKLContext.Provider>
  );
};

export const usePKL = () => {
  const context = useContext(PKLContext);
  if (context === undefined) {
    throw new Error('usePKL must be used within a PKLProvider');
  }
  return context;
};
