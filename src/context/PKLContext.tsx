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
  addAdvisorNoteAction,
  deleteCardAction,
  resetDatabaseAction,
  getStudentsAction,
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
  addCard: (title: string, description: string, category: TaskCategory, dueDate: string, columnId?: PKLCard['columnId']) => Promise<void>;
  updateCardColumn: (cardId: string, targetColumn: PKLCard['columnId']) => Promise<void>;
  updateCardDetails: (
    cardId: string,
    title: string,
    description: string,
    category: TaskCategory,
    dueDate: string,
    hoursLogged: number,
    score?: number | null,
    feedback?: string | null
  ) => Promise<void>;
  addComment: (cardId: string, text: string) => Promise<void>;
  gradeCard: (cardId: string, score: number, feedback: string) => Promise<void>;
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

  const addCard = async (title: string, description: string, category: TaskCategory, dueDate: string, columnId?: PKLCard['columnId']) => {
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
    category: TaskCategory,
    dueDate: string,
    hoursLogged: number,
    score?: number | null,
    feedback?: string | null
  ) => {
    setLoading(true);
    try {
      const actorName = currentUser ? currentUser.name : state.studentName;
      await updateCardDetailsAction(cardId, title, description, category, dueDate, hoursLogged, actorName, activeRole, score, feedback);
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
