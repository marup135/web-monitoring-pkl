'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PKLState, PKLCard, PKLRole } from '../types/pkl';
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
  getClassesAction,
  createClassAction,
  updateClassAction,
  deleteClassAction,
  getCompaniesAction,
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
  getAllUsersAction,
  assignGuruToClassAction,
  assignMentorToCompanyAction,
  assignSiswaAction,
  getPendingUsersAction,
  verifyUserAction,
} from '@/app/actions/pkl';
import {
  registerAction,
  loginAction,
  logoutAction,
  getCurrentUserAction,
} from '@/app/actions/auth';

export interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: string;
  company?: string | null;
  school?: string | null;
  classId?: string | null;
  companyId?: string | null;
  classes?: { id: string; name: string }[];
  companies?: { id: string; name: string }[];
  nisn?: string | null;
  nip?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  employeeId?: string | null;
  companyEmail?: string | null;
  profileImage?: string | null;
  createdAt?: string | Date;
  boardBackground?: string | null;
}

export interface ClassItem {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CompanyItem {
  id: string;
  name: string;
  createdAt: Date;
}

export interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  company: string | null;
  school?: string;
  classId: string | null;
  companyId: string | null;
  nisn: string | null;
  classes: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  class?: { id: string; name: string } | null;
  perusahaan?: { id: string; name: string } | null;
}

export interface StudentMetric {
  id: string;
  name: string;
  company: string;
  classId: string;
  className: string;
  companyId: string;
  nisn: string;
  totalTasks: number;
  completedTasks: number;
  hoursLogged: number;
  completionPercent: number;
}

interface PKLContextProps {
  state: PKLState;
  activeRole: PKLRole;
  activeTab: 'board' | 'logbook' | 'stats' | 'attendance';
  loading: boolean;
  currentUser: UserProfile | null;
  studentsList: StudentMetric[];
  selectedStudentId: string | null;
  selectedClassId: string | null;
  selectedCompanyId: string | null;
  classesList: ClassItem[];
  companiesList: CompanyItem[];
  allUsersList: UserItem[];
  setActiveTab: (tab: 'board' | 'logbook' | 'stats' | 'attendance') => void;
  setSelectedStudentId: (studentId: string | null) => Promise<void>;
  setSelectedClassId: (classId: string | null) => Promise<void>;
  setSelectedCompanyId: (companyId: string | null) => Promise<void>;
  fetchAdminData: () => Promise<void>;
  createClass: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateClass: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteClass: (id: string) => Promise<{ success: boolean; error?: string }>;
  createCompany: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateCompany: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteCompany: (id: string) => Promise<{ success: boolean; error?: string }>;
  assignGuruToClass: (userId: string, classIds: string[]) => Promise<{ success: boolean; error?: string }>;
  assignMentorToCompany: (userId: string, companyIds: string[]) => Promise<{ success: boolean; error?: string }>;
  assignSiswa: (userId: string, classId: string | null, companyId: string | null, name?: string, nisn?: string) => Promise<{ success: boolean; error?: string }>;
  addCard: (title: string, description: string, category: string, dueDate: string, startTime: string, endTime: string, columnId?: PKLCard['columnId']) => Promise<void>;
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
  register: (username: string, email: string, password: string, name: string, role: string, companyName?: string, className?: string, nisn?: string, nip?: string, school?: string, jabatan?: string, employeeId?: string, companyEmail?: string, institutionCode?: string) => Promise<{ success: boolean; error?: string; pending?: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateCurrentUserName?: (name: string) => void;
  updateCurrentUserBackground: (url: string | null) => void;
  updateProfileContext: (updates: Partial<UserProfile>) => void;
  getPendingUsers?: () => Promise<{ success: boolean; error?: string; data: any[] }>;
  verifyUser?: (userId: string, status: string) => Promise<{ success: boolean; error?: string }>;
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
  const [activeTab, setActiveTab] = useState<'board' | 'logbook' | 'stats' | 'attendance'>('board');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [studentsList, setStudentsList] = useState<StudentMetric[]>([]);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassIdState] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [companiesList, setCompaniesList] = useState<CompanyItem[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserItem[]>([]);

  const activeRole: PKLRole = currentUser
    ? currentUser.role === 'PARTICIPANT' || currentUser.role === 'siswa'
      ? 'Mahasiswa'
      : currentUser.role === 'EXTERNAL_MENTOR' || currentUser.role === 'pembimbing_eksternal'
      ? 'Mentor'
      : 'Dosen Pembimbing'
    : 'Mahasiswa';

  const fetchAdminData = async () => {
    const cl = await getClassesAction();
    setClassesList(cl);
    const co = await getCompaniesAction();
    setCompaniesList(co);
    if (currentUser?.role === 'admin' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'INSTITUTION_ADMIN') {
      const u = await getAllUsersAction();
      setAllUsersList(u);
    }
  };

  const fetchState = async (
    user = currentUser,
    studentId = selectedStudentId,
    classId = selectedClassId,
    companyId = selectedCompanyId
  ) => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'siswa' || user.role === 'PARTICIPANT') {
        const dbState = await getPKLState();
        setState(dbState);
      } else {
        const activeClassFilter = user.role === 'pembimbing_internal' ? (classId || undefined) : undefined;
        const activeCompanyFilter = user.role === 'pembimbing_eksternal' ? (companyId || undefined) : undefined;
        const list = await getStudentsAction(activeClassFilter, activeCompanyFilter);
        setStudentsList(list);

        let targetId = studentId;
        if (targetId) {
          const exists = list.some(s => s.id === targetId);
          if (!exists) {
            targetId = list.length > 0 ? list[0].id : null;
          }
        } else {
          targetId = list.length > 0 ? list[0].id : null;
        }

        if (targetId) {
          setSelectedStudentIdState(targetId);
          const dbState = await getPKLState(targetId);
          setState(dbState);
        } else {
          setSelectedStudentIdState(null);
          setState({
            studentName: 'Belum ada Siswa',
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

  // Initial load to restore session & fetch public tables
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const cl = await getClassesAction();
        setClassesList(cl);
        const co = await getCompaniesAction();
        setCompaniesList(co);

        const user = await getCurrentUserAction();
        if (user) {
          setCurrentUser(user);
          
          let initialClassId = null;
          let initialCompanyId = null;
          
          if (user.role === 'pembimbing_internal' && user.classes && user.classes.length > 0) {
            initialClassId = user.classes[0].id;
            setSelectedClassIdState(initialClassId);
          }
          if (user.role === 'pembimbing_eksternal' && user.companies && user.companies.length > 0) {
            initialCompanyId = user.companies[0].id;
            setSelectedCompanyIdState(initialCompanyId);
          }
          
          await fetchState(user, null, initialClassId, initialCompanyId);
          
          if (user.role === 'admin' || user.role === 'SUPER_ADMIN' || user.role === 'INSTITUTION_ADMIN') {
            const u = await getAllUsersAction();
            setAllUsersList(u);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await loginAction(username, password);
      if (res.success && res.user) {
        setCurrentUser(res.user as UserProfile);
        setSelectedStudentIdState(null);
        
        let initialClassId = null;
        let initialCompanyId = null;
        if (res.user.role === 'pembimbing_internal' && res.user.classes && res.user.classes.length > 0) {
          initialClassId = res.user.classes[0].id;
          setSelectedClassIdState(initialClassId);
        }
        if (res.user.role === 'pembimbing_eksternal' && res.user.companies && res.user.companies.length > 0) {
          initialCompanyId = res.user.companies[0].id;
          setSelectedCompanyIdState(initialCompanyId);
        }

        await fetchState(res.user, null, initialClassId, initialCompanyId);
        
        if (res.user.role === 'admin' || res.user.role === 'SUPER_ADMIN' || res.user.role === 'INSTITUTION_ADMIN') {
          const cl = await getClassesAction();
          setClassesList(cl);
          const co = await getCompaniesAction();
          setCompaniesList(co);
          const u = await getAllUsersAction();
          setAllUsersList(u);
        }
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    }
  };

  const register = async (username: string, email: string, password: string, name: string, role: string, companyName?: string, className?: string, nisn?: string, nip?: string, school?: string, jabatan?: string, employeeId?: string, companyEmail?: string, institutionCode?: string) => {
    setLoading(true);
    try {
      const res = await registerAction(username, email, password, name, role, companyName, className, nisn, nip, school, jabatan, employeeId, companyEmail, institutionCode);
      if (res.success && res.user) {
        setCurrentUser(res.user as UserProfile);
        setSelectedStudentIdState(null);
        
        let initialClassId = null;
        let initialCompanyId = null;
        const regUser = res.user as UserProfile;
        if (regUser.role === 'pembimbing_internal' && regUser.classes && regUser.classes.length > 0) {
          initialClassId = regUser.classes[0].id;
          setSelectedClassIdState(initialClassId);
        }
        if (regUser.role === 'pembimbing_eksternal' && regUser.companies && regUser.companies.length > 0) {
          initialCompanyId = regUser.companies[0].id;
          setSelectedCompanyIdState(initialCompanyId);
        }

        await fetchState(res.user, null, initialClassId, initialCompanyId);
        
        if (res.user.role === 'admin' || res.user.role === 'SUPER_ADMIN' || res.user.role === 'INSTITUTION_ADMIN') {
          const cl = await getClassesAction();
          setClassesList(cl);
          const co = await getCompaniesAction();
          setCompaniesList(co);
          const u = await getAllUsersAction();
          setAllUsersList(u);
        }
        return { success: true };
      }
      if (res.success && res.pending) {
        return { success: true, pending: true, message: res.message };
      }
      return { success: false, error: res.error };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const getPendingUsers = async () => {
    return await getPendingUsersAction();
  };

  const verifyUser = async (userId: string, status: string) => {
    return await verifyUserAction(userId, status);
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
      await fetchState(currentUser, studentId, selectedClassId, selectedCompanyId);
    }
  };

  const setSelectedClassId = async (classId: string | null) => {
    setSelectedClassIdState(classId);
    if (currentUser) {
      const students = await getStudentsAction(classId || undefined, undefined);
      setStudentsList(students);
      const targetId = students.length > 0 ? students[0].id : null;
      setSelectedStudentIdState(targetId);
      await fetchState(currentUser, targetId, classId, selectedCompanyId);
    }
  };

  const setSelectedCompanyId = async (companyId: string | null) => {
    setSelectedCompanyIdState(companyId);
    if (currentUser) {
      const students = await getStudentsAction(undefined, companyId || undefined);
      setStudentsList(students);
      const targetId = students.length > 0 ? students[0].id : null;
      setSelectedStudentIdState(targetId);
      await fetchState(currentUser, targetId, selectedClassId, companyId);
    }
  };

  const createClass = async (name: string) => {
    setLoading(true);
    try {
      const res = await createClassAction(name);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (id: string, name: string) => {
    setLoading(true);
    try {
      const res = await updateClassAction(id, name);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    setLoading(true);
    try {
      const res = await deleteClassAction(id);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (name: string) => {
    setLoading(true);
    try {
      const res = await createCompanyAction(name);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, name: string) => {
    setLoading(true);
    try {
      const res = await updateCompanyAction(id, name);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id: string) => {
    setLoading(true);
    try {
      const res = await deleteCompanyAction(id);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const assignGuruToClass = async (userId: string, classIds: string[]) => {
    setLoading(true);
    try {
      const res = await assignGuruToClassAction(userId, classIds);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const assignMentorToCompany = async (userId: string, companyIds: string[]) => {
    setLoading(true);
    try {
      const res = await assignMentorToCompanyAction(userId, companyIds);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const assignSiswa = async (
    userId: string,
    classId: string | null,
    companyId: string | null,
    name?: string,
    nisn?: string
  ) => {
    setLoading(true);
    try {
      const res = await assignSiswaAction(userId, classId, companyId, name, nisn);
      if (res.success) {
        await fetchAdminData();
      }
      return res;
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem' };
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (title: string, description: string, category: string, dueDate: string, startTime: string, endTime: string, columnId?: PKLCard['columnId']) => {
    setLoading(true);
    try {
      const res = await createCardAction(title, description, category, dueDate, state.studentName, activeRole, columnId, startTime, endTime);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal membuat kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal membuat kegiatan.');
      setLoading(false);
      throw e;
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
      const res = await updateCardColumnAction(cardId, targetColumn, actorName, activeRole);
      if (res && !res.success) {
        throw new Error(res.error);
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, cards: originalCards }));
      alert((e as Error).message || 'Gagal memindahkan status kegiatan.');
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
      const res = await updateCardDetailsAction(
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
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal memperbarui rincian kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal memperbarui rincian kegiatan.');
      setLoading(false);
      throw e;
    }
  };

  const addComment = async (cardId: string, text: string) => {
    setLoading(true);
    try {
      const actorName = currentUser ? currentUser.name : state.studentName;
      const res = await addCommentAction(cardId, text, actorName, activeRole);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal mengirim komentar.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal mengirim komentar.');
      setLoading(false);
      throw e;
    }
  };

  const gradeCard = async (cardId: string, score: number, feedback: string) => {
    setLoading(true);
    try {
      const res = await gradeCardAction(cardId, score, feedback, state.mentorName);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menilai kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menilai kegiatan.');
      setLoading(false);
      throw e;
    }
  };

  const gradeCardByMentor = async (cardId: string, discipline: number, skill: number, attitude: number, feedback: string) => {
    setLoading(true);
    try {
      const res = await gradeCardByMentorAction(cardId, discipline, skill, attitude, feedback, state.mentorName);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menilai kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menilai kegiatan.');
      setLoading(false);
      throw e;
    }
  };

  const gradeCardByAdvisor = async (cardId: string, discipline: number, report: number, communication: number, feedback: string) => {
    setLoading(true);
    try {
      const res = await gradeCardByAdvisorAction(cardId, discipline, report, communication, feedback, state.advisorName);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menilai kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menilai kegiatan.');
      setLoading(false);
      throw e;
    }
  };

  const addAttachment = async (cardId: string, name: string, url: string, type: string) => {
    setLoading(true);
    try {
      const res = await addAttachmentAction(cardId, name, url, type);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menambahkan lampiran.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menambahkan lampiran.');
      setLoading(false);
      throw e;
    }
  };

  const deleteAttachment = async (cardId: string, index: number) => {
    setLoading(true);
    try {
      const res = await deleteAttachmentAction(cardId, index);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menghapus lampiran.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menghapus lampiran.');
      setLoading(false);
      throw e;
    }
  };

  const addAdvisorNote = async (text: string) => {
    setLoading(true);
    try {
      const targetStudentId = currentUser?.role === 'siswa' || currentUser?.role === 'PARTICIPANT' ? currentUser.id : selectedStudentId;
      if (!targetStudentId) throw new Error('No student selected');
      const res = await addAdvisorNoteAction(text, state.advisorName, targetStudentId);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menyimpan catatan bimbingan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menyimpan catatan bimbingan.');
      setLoading(false);
      throw e;
    }
  };

  const deleteCard = async (cardId: string) => {
    setLoading(true);
    try {
      const res = await deleteCardAction(cardId);
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal menghapus kegiatan.');
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Gagal menghapus kegiatan.');
      setLoading(false);
      throw e;
    }
  };

  const updateCurrentUserName = (name: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name });
    }
  };

  const updateCurrentUserBackground = (url: string | null) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, boardBackground: url });
    }
  };

  const updateProfileContext = (updates: Partial<UserProfile>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });
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
        selectedClassId,
        selectedCompanyId,
        classesList,
        companiesList,
        allUsersList,
        setActiveTab,
        setSelectedStudentId,
        setSelectedClassId,
        setSelectedCompanyId,
        fetchAdminData,
        createClass,
        updateClass,
        deleteClass,
        createCompany,
        updateCompany,
        deleteCompany,
        assignGuruToClass,
        assignMentorToCompany,
        assignSiswa,
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
        updateCurrentUserName,
        updateCurrentUserBackground,
        updateProfileContext,
        getPendingUsers,
        verifyUser,
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
