import { PKLState } from '../types/pkl';

export const INITIAL_PKL_STATE: PKLState = {
  studentName: 'Rian Adriadi',
  companyName: 'PT Teknologi Nusantara',
  mentorName: 'Budi Santoso, S.Kom.',
  advisorName: 'Dr. Ir. Heryanto, M.T.',
  advisorNotes: [
    {
      id: 'note-1',
      advisorName: 'Dr. Ir. Heryanto, M.T.',
      text: 'Progress Rian di minggu pertama sangat baik. Harap pastikan dokumentasi modul API juga dilampirkan dalam draf laporan mingguan.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ],
  cards: [
    {
      id: 'card-1',
      title: 'Desain UI mockup dashboard di Figma',
      description: 'Membuat rancangan antarmuka pengguna untuk dashboard monitoring admin menggunakan Figma. Desain mencakup view mobile dan desktop dengan mengikuti brand guidelines perusahaan.',
      columnId: 'selesai',
      category: 'Design',
      startTime: '08:00',
      endTime: '16:00',
      dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
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
      attachments: [],
      comments: [
        {
          id: 'c-1',
          userName: 'Rian Adriadi',
          role: 'Mahasiswa',
          text: 'Pak Budi, saya sudah menyelesaikan desain dashboard. Mohon review-nya apakah layout sidebar sudah sesuai dengan ekspektasi.',
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'c-2',
          userName: 'Budi Santoso, S.Kom.',
          role: 'Mentor',
          text: 'Sudah sangat bagus Rian. Untuk menu dropdown profil, buat agar memicu modal alih-alih menu hover agar lebih ramah di perangkat mobile.',
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
        },
        {
          id: 'c-3',
          userName: 'Rian Adriadi',
          role: 'Mahasiswa',
          text: 'Baik Pak, sudah saya revisi menjadi modal popup. Saya pindahkan ke kolom review ya.',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      history: [
        {
          id: 'h-1',
          text: 'Card dibuat oleh Rian Adriadi',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-2',
          text: 'Pindah ke Sedang Dikerjakan',
          createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-3',
          text: 'Pindah ke Butuh Review',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-4',
          text: 'Disetujui dan diberi nilai 92 oleh Budi Santoso, S.Kom.',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 7200000).toISOString()
        }
      ]
    },
    {
      id: 'card-2',
      title: 'Refactoring state management menggunakan Context',
      description: 'Mengganti local state prop drilling pada halaman dashboard utama menggunakan React Context API agar data tersinkronisasi lebih bersih dan rapi antar panel monitoring.',
      columnId: 'review',
      category: 'Coding',
      startTime: '09:00',
      endTime: '17:00',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [
        {
          id: 'c-4',
          userName: 'Rian Adriadi',
          role: 'Mahasiswa',
          text: 'Saya sudah mengimplementasikan Context provider di `/src/context/PKLContext.tsx` untuk membungkus halaman dashboard. Mohon dicek kinerjanya Pak.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      history: [
        {
          id: 'h-5',
          text: 'Card dibuat oleh Rian Adriadi',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-6',
          text: 'Pindah ke Sedang Dikerjakan',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-7',
          text: 'Pindah ke Butuh Review',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'card-3',
      title: 'Integrasi front-end dengan backend API auth',
      description: 'Menyambungkan form login dan register dengan rest API auth jwt perusahaan. Menyimpan accessToken di secure cookies dan setup interceptors axios untuk header otorisasi.',
      columnId: 'progres',
      category: 'Coding',
      startTime: '08:30',
      endTime: '17:00',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [],
      history: [
        {
          id: 'h-8',
          text: 'Card dibuat oleh Rian Adriadi',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'h-9',
          text: 'Pindah ke Sedang Dikerjakan',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
        }
      ]
    },
    {
      id: 'card-4',
      title: 'Membuat modul test cases untuk API',
      description: 'Menyusun test cases menggunakan Jest untuk memvalidasi endpoint-endpoint utama PKL seperti getLogs, createCard, dan updateCardStatus.',
      columnId: 'rencana',
      category: 'Coding',
      startTime: '',
      endTime: '',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [],
      history: [
        {
          id: 'h-10',
          text: 'Card dibuat oleh Rian Adriadi',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'card-5',
      title: 'Menulis Bab 3 Laporan PKL',
      description: 'Menuliskan metodologi penelitian dan rancangan arsitektur sistem (flowchart, DFD, dan ERD) pada Bab 3 dokumen draf Laporan PKL.',
      columnId: 'rencana',
      category: 'Laporan',
      startTime: '',
      endTime: '',
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      comments: [],
      history: [
        {
          id: 'h-11',
          text: 'Card dibuat oleh Rian Adriadi',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ]
};
