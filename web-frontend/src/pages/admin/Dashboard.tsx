import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  IndianRupee, 
  Bell,
  BookOpen, Bus, Megaphone, CalendarDays, Baby, FileQuestion, Clock, Ribbon, FileText, 
  Receipt, Box, Building2, Briefcase, ScanLine, Images, MessageSquare, 
  Image, FileOutput, Video, TrendingUp, Activity, Plus, Search, X, ChevronRight, UtensilsCrossed, Info,
  ShieldCheck, MapPin, Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import SmartSidebar from '../../components/SmartSidebar';
import { useLanguage } from '../../utils/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import './Dashboard.css';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendance: string;
  attendancePresent?: number;
  attendanceTotal?: number;
  attendancePercent?: number;
  pendingFees: number;
  todayCollected?: number;
  activeHomework?: number;
  totalStudentNotes?: number;
  recentNotices?: Array<{ id: string; title: string; content: string; targetAudience?: string; createdAt?: string }>;
  recentActivities: Array<{ action: string; entityType: string; createdAt: string }>;
  graphs?: {
    enquiriesVsAdmissions: Array<{ name: string; enquiries: number; admissions: number }>;
    feesCollection: Array<{ name: string; collected: number; pending: number }>;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'daycare' | 'finance' | 'communication'>('all');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdmin = loggedUser?.role === 'super_admin' || loggedUser?.role === 'owner' || loggedUser?.email === 'admin@edunive.com';
  const isTeacher = (loggedUser?.role || '').toLowerCase() === 'teacher';
  const userName = loggedUser?.firstName || (isTeacher ? 'Teacher' : 'Admin');

  const getTimeGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'goodMorning';
    if (hour < 17) return 'goodAfternoon';
    return 'goodEvening';
  };

  const userBranchName = (() => {
    if (loggedUser?.branchName) return loggedUser.branchName;
    if (loggedUser?.school_name) return loggedUser.school_name;
    const str = `${loggedUser?.firstName || ''} ${loggedUser?.lastName || ''} ${loggedUser?.email || ''}`.toLowerCase();
    if (str.includes('chikhali')) return 'Chikhali Branch';
    if (str.includes('dudulgaon')) return 'Dudulgaon Branch';
    return 'Chinchwad Branch';
  })();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState(() => {
    if (isSuperAdmin) return 'ALL';
    return userBranchName;
  });

  // Real-Time Clock State (ticks every 1000ms)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const defaultGrade = loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.class || 'Nursery';
  const [selectedRoutineGrade, setSelectedRoutineGrade] = useState<string>(defaultGrade);
  const [routineEntries, setRoutineEntries] = useState<any[]>([]);
  const [isDbRoutine, setIsDbRoutine] = useState<boolean>(false);
  const [routineLoading, setRoutineLoading] = useState<boolean>(false);

  const PRESCHOOL_TEMPLATES: Record<string, { period_number: number; subject: string; start_time: string; end_time: string; description: string }[]> = {
    playgroup: [
      { period_number: 1, subject: '🌅 Gentle Welcome & Free Exploration', start_time: '09:00', end_time: '09:30', description: 'Soft toys, gentle nursery rhyme & warm teacher greeting' },
      { period_number: 2, subject: '🎶 Action Rhymes & Sensory Play', start_time: '09:30', end_time: '10:15', description: 'Musical movement, hand clapping & tactile textures' },
      { period_number: 3, subject: '🍎 Fruit Bites & Warm Water Break', start_time: '10:15', end_time: '10:45', description: 'Healthy snacking, bibs on & guided hand hygiene routine' },
      { period_number: 4, subject: '🎨 Color Splashes & Finger Fun', start_time: '10:45', end_time: '11:30', description: 'Crayon scribbling, play dough & soft building blocks' },
      { period_number: 5, subject: '🏃 Toddler Movement & Ball Fun', start_time: '11:30', end_time: '12:00', description: 'Crawling tunnels, rolling balls & coordination games' },
      { period_number: 6, subject: '👋 Rhyme Wrap-Up & Parent Handover', start_time: '12:00', end_time: '12:30', description: 'Calm lullaby song, bag packing & safe guardian dismissal' }
    ],
    nursery: [
      { period_number: 1, subject: '🌅 Morning Circle & Assembly', start_time: '09:00', end_time: '09:30', description: 'Warm-up, rhymes, daily weather check & attendance' },
      { period_number: 2, subject: '🔤 Phonics, Letters & Rhymes Fun', start_time: '09:30', end_time: '10:15', description: 'Letter sounds, picture flashcards & pencil grip practice' },
      { period_number: 3, subject: '🍎 Healthy Snack & Fruit Break', start_time: '10:15', end_time: '10:45', description: 'Hand hygiene, table manners & social interaction' },
      { period_number: 4, subject: '✏️ Numbers & Math Worksheets', start_time: '10:45', end_time: '11:30', description: 'Counting 1-20, shape recognition & coloring fun' },
      { period_number: 5, subject: '🎨 Sensory Play & Story Time', start_time: '11:30', end_time: '12:15', description: 'Clay modeling, puppet theater & interactive moral story' },
      { period_number: 6, subject: '👋 Diary Check & Safe Dismissal', start_time: '12:15', end_time: '12:45', description: 'Bag packing, parent OTP verification & guardian handover' }
    ],
    'jr kg': [
      { period_number: 1, subject: '🌅 Assembly, Prayer & Daily Focus', start_time: '09:00', end_time: '09:30', description: 'Warm-up stretches, school prayer & day focus discussion' },
      { period_number: 2, subject: '🔤 Early English & Sight Words', start_time: '09:30', end_time: '10:15', description: '3-letter CVC blending, sight word reading & stroke tracing' },
      { period_number: 3, subject: '🍎 Nutritious Snack & Napkin Habits', start_time: '10:15', end_time: '10:45', description: 'Clean eating habits, napkin folding & hydration break' },
      { period_number: 4, subject: '🔢 Pre-Math Concepts & Numbers', start_time: '10:45', end_time: '11:30', description: 'Writing 1-50, more/less comparison & number patterns' },
      { period_number: 5, subject: '🌍 General Awareness & Nature Walk', start_time: '11:30', end_time: '12:15', description: 'Animals, seasons, plants & classroom community helpers' },
      { period_number: 6, subject: '📖 Interactive Story & Pack-Up', start_time: '12:15', end_time: '12:45', description: 'Expressive storytelling, diary updates & safe dispersal' }
    ],
    'sr kg': [
      { period_number: 1, subject: '🌅 Assembly & Mindful Breathing', start_time: '09:00', end_time: '09:30', description: 'National anthem, pledge & positive affirmation thoughts' },
      { period_number: 2, subject: '🔤 Advanced Phonics & Sentence Reading', start_time: '09:30', end_time: '10:15', description: 'Reading short sentences, vowels & cursive pencil control' },
      { period_number: 3, subject: '🍎 Snack Break & Table Etiquette', start_time: '10:15', end_time: '10:45', description: 'Wholesome breakfast/snack, etiquette & cleanup' },
      { period_number: 4, subject: '🔢 Mathematics & Problem Solving', start_time: '10:45', end_time: '11:30', description: 'Simple addition, subtraction basics & clock time concepts' },
      { period_number: 5, subject: '🔬 Junior STEM & Creative Crafts', start_time: '11:30', end_time: '12:15', description: 'Hands-on simple science experiments & paper origami' },
      { period_number: 6, subject: '📝 Diary Review & Orderly Dispersal', start_time: '12:15', end_time: '12:45', description: 'Homework recording, packing bags & guardian handover' }
    ],
    daycare: [
      { period_number: 1, subject: '🌅 Arrival, Breakfast & Free Play', start_time: '09:00', end_time: '10:30', description: 'Welcome greeting, healthy morning bites & soft play' },
      { period_number: 2, subject: '🎨 Guided Sensory & Learning Activities', start_time: '10:30', end_time: '12:00', description: 'Color recognition, building blocks & musical movement' },
      { period_number: 3, subject: '🍲 Nutritious Lunch & Hygiene Routine', start_time: '12:00', end_time: '13:00', description: 'Warm lunch, handwash & gentle relaxation' },
      { period_number: 4, subject: '💤 Quiet Afternoon Nap & Rest', start_time: '13:00', end_time: '15:00', description: 'Cots, lullaby music & supervised peaceful sleep' },
      { period_number: 5, subject: '🥛 Evening Milk & Fruit Snack', start_time: '15:00', end_time: '16:00', description: 'Hydration, fresh fruits & circle chat' },
      { period_number: 6, subject: '🏃 Indoor/Outdoor Fun & Dispersal', start_time: '16:00', end_time: '17:30', description: 'Story session, parent OTP handover' }
    ]
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const trimmed = timeStr.trim().toLowerCase();
    const isPM = trimmed.includes('pm');
    const isAM = trimmed.includes('am');
    const clean = trimmed.replace(/am|pm/g, '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const formatDisplayTime = (timeStr: string): string => {
    if (!timeStr) return '';
    if (/am|pm/i.test(timeStr)) return timeStr.toUpperCase();
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (isNaN(h)) return timeStr;
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
  };

  const getPeriodRealtimeStatus = (startTime: string, endTime: string) => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const s = parseTimeToMinutes(startTime);
    const e = parseTimeToMinutes(endTime);
    if (nowMins >= s && nowMins < e) {
      const remaining = e - nowMins;
      return { status: 'current', remaining, label: `🔴 LIVE NOW (${remaining} min left)` };
    } else if (nowMins < s) {
      const startsIn = s - nowMins;
      return { status: 'upcoming', startsIn, label: startsIn > 60 ? `⏳ Starts in ${Math.floor(startsIn/60)}h ${startsIn%60}m` : `⏳ Starts in ${startsIn}m` };
    } else {
      return { status: 'completed', remaining: 0, label: '✓ Completed' };
    }
  };

  const getRoutineCategory = (subject: string) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('snack') || s.includes('lunch') || s.includes('hygiene') || s.includes('fruit') || s.includes('milk') || s.includes('bites') || s.includes('breakfast')) {
      return { tag: 'Nutrition', bg: '#FEF3C7', color: '#D97706' };
    }
    if (s.includes('circle') || s.includes('prayer') || s.includes('assembly') || s.includes('welcome') || s.includes('arrival') || s.includes('anthem')) {
      return { tag: 'Routine', bg: '#ECFDF5', color: '#059669' };
    }
    if (s.includes('nap') || s.includes('rest') || s.includes('quiet') || s.includes('sleep')) {
      return { tag: 'Rest & Care', bg: '#F3E8FF', color: '#7E22CE' };
    }
    if (s.includes('art') || s.includes('sensory') || s.includes('play') || s.includes('motor') || s.includes('games') || s.includes('story') || s.includes('stem')) {
      return { tag: 'Activity', bg: '#FDF2F8', color: '#DB2777' };
    }
    if (s.includes('dismissal') || s.includes('pack') || s.includes('bye') || s.includes('handover') || s.includes('dispersal')) {
      return { tag: 'Dismissal', bg: '#F1F5F9', color: '#475569' };
    }
    return { tag: 'Academic', bg: '#EEF2FF', color: '#4F46E5' };
  };

  const fetchTodayClassroomRoutine = async () => {
    try {
      setRoutineLoading(true);
      const res = await apiClient.get(`/timetable/${encodeURIComponent(selectedRoutineGrade)}`);
      const allRows = res.data?.data || [];
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      const todayRows = allRows.filter((r: any) => 
        r.day_of_week && r.day_of_week.toLowerCase() === currentDay.toLowerCase()
      );

      if (todayRows.length > 0) {
        todayRows.sort((a: any, b: any) => {
          if (a.period_number && b.period_number) return a.period_number - b.period_number;
          return parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time);
        });
        setRoutineEntries(todayRows);
        setIsDbRoutine(true);
      } else {
        // No periods in database yet
        setRoutineEntries([]);
        setIsDbRoutine(true);
      }
    } catch (err) {
      console.error('Failed to fetch timetable for routine:', err);
      setRoutineEntries([]);
      setIsDbRoutine(true);
    } finally {
      setRoutineLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayClassroomRoutine();
    const interval = setInterval(fetchTodayClassroomRoutine, 30000);
    return () => clearInterval(interval);
  }, [selectedRoutineGrade]);

  const fetchStats = async () => {
    try {
      const selectedBranchObj = branchData.find(b => b.name === selectedBranchFilter || b.name?.toLowerCase().includes(selectedBranchFilter.toLowerCase().replace(' branch', '')));
      let schoolId = selectedBranchObj?.id || loggedUser?.school_id;
      if (!schoolId && !isSuperAdmin) {
        const userB = branchData.find(b => b.name?.toLowerCase().includes(userBranchName.toLowerCase().replace(' branch', '')));
        if (userB) schoolId = userB.id;
      }
      const params = (selectedBranchFilter !== 'ALL' || !isSuperAdmin) ? (schoolId ? { school_id: schoolId } : {}) : {};
      
      const [statsRes, branchRes] = await Promise.all([
        apiClient.get('/admin/dashboard-stats', { params }),
        apiClient.get('/franchise/branches').catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data);
      setBranchData(branchRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [selectedBranchFilter]);

  const adminStatCards = [
    { 
      title: t('totalActiveStudents'), 
      value: stats?.totalStudents || 0, 
      icon: <GraduationCap size={24} />, 
      color: '#4F46E5', 
      bg: '#EEF2FF', 
      path: '/admin/students',
      trend: t('thisMonthGrowth'),
      trendType: 'up',
      barColor: '#4F46E5',
      progressWidth: '85%'
    },
    { 
      title: t('totalStaffTeachers'), 
      value: stats?.totalTeachers || 0, 
      icon: <Users size={24} />, 
      color: '#EC4899', 
      bg: '#FDF2F8', 
      path: '/admin/staff',
      trend: t('fullyStaffed'),
      trendType: 'neutral',
      barColor: '#EC4899',
      progressWidth: '100%'
    },
    { 
      title: t('todayAttendance'), 
      value: stats?.todayAttendance || '0/0', 
      icon: <CalendarCheck size={24} />, 
      color: '#10B981', 
      bg: '#ECFDF5', 
      path: '/admin/attendance',
      trend: stats?.attendancePercent !== undefined ? `${stats.attendancePercent}% Marked Today` : t('activeSession'),
      trendType: 'up',
      barColor: '#10B981',
      progressWidth: `${stats?.attendancePercent || 0}%`
    },
    { 
      title: t('pendingFees'), 
      value: `₹ ${(stats?.pendingFees || 0).toLocaleString()}`, 
      icon: <IndianRupee size={24} />, 
      color: '#F59E0B', 
      bg: '#FEF3C7', 
      path: '/admin/fees',
      trend: t('actionNeeded'),
      trendType: 'warning',
      barColor: '#F59E0B',
      progressWidth: '60%'
    },
  ];

  const teacherStatCards = [
    { 
      title: 'My Class Students', 
      value: stats?.totalStudents ?? 0, 
      icon: <GraduationCap size={24} />, 
      color: '#4F46E5', 
      bg: '#EEF2FF', 
      path: '/admin/students',
      trend: `${stats?.totalStudents ?? 0} Enrolled in Batch`,
      trendType: 'up',
      barColor: '#4F46E5',
      progressWidth: stats?.totalStudents ? '100%' : '15%'
    },
    { 
      title: "Today's Attendance", 
      value: stats?.todayAttendance || '0/0', 
      icon: <CalendarCheck size={24} />, 
      color: '#10B981', 
      bg: '#ECFDF5', 
      path: '/admin/attendance',
      trend: stats?.attendancePercent !== undefined ? `${stats.attendancePercent}% Marked Today` : '200m Geofenced',
      trendType: (stats?.attendancePercent || 0) > 0 ? 'up' : 'neutral',
      barColor: '#10B981',
      progressWidth: `${stats?.attendancePercent || 0}%`
    },
    { 
      title: 'Active Homework', 
      value: stats?.activeHomework !== undefined ? `${stats.activeHomework} Active` : '0 Active', 
      icon: <BookOpen size={24} />, 
      color: '#F59E0B', 
      bg: '#FEF3C7', 
      path: '/admin/homework',
      trend: 'Daily Phonics & Worksheets',
      trendType: (stats?.activeHomework || 0) > 0 ? 'up' : 'neutral',
      barColor: '#F59E0B',
      progressWidth: stats?.activeHomework ? '100%' : '20%'
    },
    { 
      title: 'Student Diary & Notes', 
      value: stats?.totalStudentNotes !== undefined ? `${stats.totalStudentNotes} Notes` : '0 Notes', 
      icon: <FileText size={24} />, 
      color: '#EC4899', 
      bg: '#FDF2F8', 
      path: '/admin/notes',
      trend: 'Parent Observations',
      trendType: 'neutral',
      barColor: '#EC4899',
      progressWidth: stats?.totalStudentNotes ? '80%' : '15%'
    },
  ];

  const statCards = isTeacher ? teacherStatCards : adminStatCards;

  const allModules = [
    // Academic & Students
    { id: '1', titleKey: 'studentsDirectory', icon: <Users size={22} />, path: '/admin/students', color: '#4F46E5', bgHex: '#EEF2FF', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '2', titleKey: 'staffDirectory', icon: <GraduationCap size={22} />, path: '/admin/staff', color: '#EC4899', bgHex: '#FDF2F8', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '3', titleKey: 'classesManagement', icon: <BookOpen size={22} />, path: '/admin/classes', color: '#10B981', bgHex: '#ECFDF5', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '4', titleKey: 'homework', icon: <BookOpen size={22} />, path: '/admin/homework', color: '#6366F1', bgHex: '#EEF2FF', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '5', titleKey: 'timetable', icon: <Clock size={22} />, path: '/admin/timetable', color: '#F59E0B', bgHex: '#FEF3C7', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '6', titleKey: 'certificates', icon: <Ribbon size={22} />, path: '/admin/certificates', color: '#8B5CF6', bgHex: '#F3E8FF', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '7', titleKey: 'studentNotes', icon: <FileText size={22} />, path: '/admin/notes', color: '#0D9488', bgHex: '#CCFBF1', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '8', titleKey: 'healthRecords', icon: <Activity size={22} />, path: '/admin/health', color: '#EF4444', bgHex: '#FEF2F2', category: 'academic', categoryLabelKey: 'tabAcademic' },
    { id: '9', titleKey: 'progressReports', icon: <TrendingUp size={22} />, path: '/admin/progress', color: '#10B981', bgHex: '#ECFDF5', category: 'academic', categoryLabelKey: 'tabAcademic' },

    // Daycare & Special
    { id: '10', titleKey: 'daycareManagement', icon: <Baby size={22} />, path: '/admin/daycare', color: '#F59E0B', bgHex: '#FEF3C7', category: 'daycare', categoryLabelKey: 'tabDaycare' },
    { id: '11', titleKey: 'admissionEnquiries', icon: <FileQuestion size={22} />, path: '/admin/enquiries', color: '#0D9488', bgHex: '#CCFBF1', category: 'daycare', categoryLabelKey: 'tabDaycare' },
    { id: '12', titleKey: 'schoolCalendar', icon: <CalendarDays size={22} />, path: '/admin/calendar', color: '#3B82F6', bgHex: '#DBEAFE', category: 'daycare', categoryLabelKey: 'tabDaycare' },
    { id: '26', titleKey: 'foodMenuManagement', icon: <UtensilsCrossed size={22} />, path: '/admin/food-menu', color: '#F97316', bgHex: '#FFEDD5', category: 'daycare', categoryLabelKey: 'tabDaycare' },
    { id: '27', titleKey: 'ptmScheduler', icon: <Users size={22} />, path: '/admin/ptm', color: '#0D9488', bgHex: '#CCFBF1', category: 'daycare', categoryLabelKey: 'tabDaycare' },

    // Operations & Finance
    { id: '13', titleKey: 'feesPayments', icon: <IndianRupee size={22} />, path: '/admin/fees', color: '#10B981', bgHex: '#ECFDF5', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '30', titleKey: 'feeStructures', icon: <FileText size={22} />, path: '/admin/fee-structures', color: '#0D9488', bgHex: '#CCFBF1', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '14', titleKey: 'expensesManagement', icon: <Receipt size={22} />, path: '/admin/expenses', color: '#EF4444', bgHex: '#FEF2F2', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '15', titleKey: 'hrPayroll', icon: <Briefcase size={22} />, path: '/admin/hr', color: '#3B82F6', bgHex: '#EFF6FF', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '16', titleKey: 'transportRoutes', icon: <Bus size={22} />, path: '/admin/transport', color: '#F43F5E', bgHex: '#FFE4E6', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '17', titleKey: 'inventoryStock', icon: <Box size={22} />, path: '/admin/inventory', color: '#10B981', bgHex: '#ECFDF5', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '18', titleKey: 'franchiseNetwork', icon: <Building2 size={22} />, path: '/admin/franchise', color: '#8B5CF6', bgHex: '#F3E8FF', category: 'finance', categoryLabelKey: 'tabFinance' },
    { id: '19', titleKey: 'digitalAttendance', icon: <ScanLine size={22} />, path: '/admin/attendance', color: '#10B981', bgHex: '#ECFDF5', category: 'finance', categoryLabelKey: 'tabFinance' },

    // Communication & Media
    { id: '20', titleKey: 'storyFeed', icon: <Images size={22} />, path: '/admin/stories', color: '#6366F1', bgHex: '#EEF2FF', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '21', titleKey: 'notices', icon: <Megaphone size={22} />, path: '/admin/notices', color: '#F59E0B', bgHex: '#FEF3C7', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '22', titleKey: 'chatPortal', icon: <MessageSquare size={22} />, path: '/admin/chat', color: '#F43F5E', bgHex: '#FFE4E6', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '23', titleKey: 'schoolGallery', icon: <Image size={22} />, path: '/admin/gallery', color: '#F59E0B', bgHex: '#FEF3C7', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '24', titleKey: 'leaveApprovals', icon: <FileOutput size={22} />, path: '/admin/leaves', color: '#8B5CF6', bgHex: '#F3E8FF', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '25', titleKey: 'cctvAccess', icon: <Video size={22} />, path: '/admin/cctv', color: '#1E293B', bgHex: '#F1F5F9', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '28', titleKey: 'libraryBooks', icon: <BookOpen size={22} />, path: '/admin/library', color: '#10B981', bgHex: '#ECFDF5', category: 'communication', categoryLabelKey: 'tabCommunication' },
    { id: '29', titleKey: 'aboutUs', icon: <Info size={22} />, path: '/admin/about', color: '#6366F1', bgHex: '#EEF2FF', category: 'communication', categoryLabelKey: 'tabCommunication' },
  ];

  const rawAllowed = loggedUser?.allowed_screens || loggedUser?.allowedScreens;
  let allowedScreensList: string[] | null = null;
  if (rawAllowed && !isSuperAdmin) {
    try {
      allowedScreensList = typeof rawAllowed === 'string' ? JSON.parse(rawAllowed) : rawAllowed;
    } catch {
      allowedScreensList = null;
    }
  }

  const teacherForbiddenModules = [
    'staffDirectory', 'classesManagement', 'admissionEnquiries',
    'feesPayments', 'feeStructures', 'expensesManagement', 'hrPayroll', 'transportRoutes',
    'inventoryStock', 'franchiseNetwork', 'cctvAccess', 'ptmScheduler'
  ];

  const availableModules = allModules.filter(m => {
    if (isTeacher && teacherForbiddenModules.includes(m.titleKey)) return false;
    if (Array.isArray(allowedScreensList) && allowedScreensList.length > 0) {
      return allowedScreensList.includes(m.path);
    }
    return true;
  });

  const filteredModules = availableModules.filter(m => {
    const matchesTab = activeTab === 'all' || m.category === activeTab;
    const titleText = t(m.titleKey);
    const categoryText = t(m.categoryLabelKey);
    const matchesSearch = titleText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          categoryText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      <SmartSidebar />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Modern Hero Greeting Banner */}
        <header className="dash-hero-card">
          <div className="hero-left">
            <div className="hero-badge-row">
              <span className="hero-badge">
                <Sparkles size={14} color="#F5B000" />
                {t('appName')}
              </span>
              {isTeacher ? (
                <span className="hero-badge" style={{ background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }}>
                  <GraduationCap size={14} />
                  Class Teacher • Preschool
                </span>
              ) : (
                <span className="hero-badge" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
                  <CheckCircle2 size={13} />
                  Since 2013 • ISO Certified
                </span>
              )}
            </div>
            <h1 className="hero-title">{t(getTimeGreetingKey())}, {userName}!</h1>
            <p className="hero-subtitle">
              {isTeacher 
                ? 'Welcome to your Teacher Academic Workspace. Manage your class attendance, worksheets, and student activities • ' 
                : `${t('heroSubtitle')} `}
              <span style={{ color: '#4F46E5', fontWeight: 700 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>.
            </p>
          </div>

          <div className="hero-actions">
            {/* Language Selector Dropdown */}
            <LanguageSelector />

            {/* Super Admin / Branch Selector Pill */}
            {isSuperAdmin ? (
              <div className="branch-select-pill">
                <MapPin size={16} color="#4F46E5" />
                <label>{t('branch')}:</label>
                <select 
                  value={selectedBranchFilter} 
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                >
                  <option value="ALL">🌐 {t('allBranches')}</option>
                  {branchData.map((b: any) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="branch-select-pill">
                <ShieldCheck size={16} color="#4F46E5" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4F46E5' }}>
                  {userBranchName}
                </span>
              </div>
            )}

            {isTeacher ? (
              <>
                <button 
                  className="btn-admission" 
                  style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }} 
                  onClick={() => navigate('/admin/homework')}
                >
                  <BookOpen size={18} /> Give Homework
                </button>
                <button 
                  className="btn-admission" 
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} 
                  onClick={() => navigate('/admin/attendance')}
                >
                  <CalendarCheck size={18} /> Attendance
                </button>
              </>
            ) : (
              <button className="btn-admission" onClick={() => navigate('/admin/students')}>
                <Plus size={18} /> {t('newAdmission')}
              </button>
            )}

            <button className="btn-icon-glass" title="Notifications" onClick={() => navigate('/admin/notices')}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#F43F5E' }}></span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-center" style={{ height: '45vh', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p style={{ fontWeight: 700, color: '#64748B', fontSize: '0.95rem' }}>Fetching live preschool telemetry...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="stats-grid">
              {statCards.map((card, index) => (
                <div 
                  key={index} 
                  className="stat-card-modern" 
                  onClick={() => navigate(card.path)}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: card.bg, color: card.color }}>
                      {card.icon}
                    </div>
                    <span className={`trend-chip ${card.trendType}`}>
                      {card.trend}
                    </span>
                  </div>

                  <div className="stat-card-body">
                    <h3>{card.title}</h3>
                    <p className="stat-value">{card.value}</p>
                  </div>

                  <div className="stat-footer-bar">
                    <div 
                      className="stat-footer-progress" 
                      style={{ width: card.progressWidth, backgroundColor: card.barColor }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Role-Specific Telemetry Hub */}
            {isTeacher ? (
              <>
                {/* Dedicated Teacher Classroom Schedule & Toolkit Hub */}
                <div className="teacher-schedule-grid">
                
                {/* Today's Classroom Routine & Timetable */}
                <div className="teacher-routine-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '0.85rem', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                        <Clock size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#0F172A' }}>
                            Today's Classroom Routine
                          </h2>
                          <div className="routine-live-badge">
                            <span className="routine-live-dot"></span>
                            LIVE • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                          Preschool Schedule • {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => navigate('/admin/timetable')}
                        style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.45rem 0.9rem', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        Full Timetable <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Grade Switcher & Data Source Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginRight: '0.2rem' }}>Class:</span>
                      {['Playgroup', 'Nursery', 'Jr KG', 'Sr KG', 'Daycare'].map(g => (
                        <button
                          key={g}
                          className={`routine-grade-pill-btn ${selectedRoutineGrade.toLowerCase() === g.toLowerCase() ? 'active' : ''}`}
                          onClick={() => setSelectedRoutineGrade(g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {routineEntries.length > 0 ? (
                        <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.65rem', borderRadius: '999px', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                          ✅ Database Timetable ({routineEntries.length} Periods in DB)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#64748B', padding: '0.2rem 0.65rem', borderRadius: '999px', fontWeight: 800, border: '1px solid #E2E8F0' }}>
                          📭 No DB Records
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Period Status Alert Bar */}
                  <div style={{ marginTop: '0.85rem' }}>
                    {(() => {
                      const currentActive = routineEntries.find(p => {
                        const status = getPeriodRealtimeStatus(p.start_time, p.end_time);
                        return status.status === 'current';
                      });

                      if (currentActive) {
                        const status = getPeriodRealtimeStatus(currentActive.start_time, currentActive.end_time);
                        return (
                          <div style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid #C7D2FE', borderRadius: '0.85rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="routine-live-dot" style={{ background: '#4F46E5', boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.2)' }}></span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#3730A3' }}>ONGOING RIGHT NOW:</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E1B4B' }}>{currentActive.subject}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338CA' }}>({formatDisplayTime(currentActive.start_time)} - {formatDisplayTime(currentActive.end_time)})</span>
                            </div>
                            <span style={{ fontSize: '0.74rem', fontWeight: 900, background: '#4F46E5', color: '#FFFFFF', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                              ⏳ {status.remaining} min remaining
                            </span>
                          </div>
                        );
                      }
                      
                      const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                      const firstPeriod = routineEntries[0];
                      const lastPeriod = routineEntries[routineEntries.length - 1];
                      const firstStart = firstPeriod ? parseTimeToMinutes(firstPeriod.start_time) : 540;
                      const lastEnd = lastPeriod ? parseTimeToMinutes(lastPeriod.end_time) : 780;

                      if (nowMins < firstStart) {
                        const minsToStart = firstStart - nowMins;
                        return (
                          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.85rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803D' }}>
                              🌅 School day starts at {formatDisplayTime(firstPeriod?.start_time || '09:00')} (in {minsToStart > 60 ? `${Math.floor(minsToStart/60)}h ${minsToStart%60}m` : `${minsToStart}m`})
                            </span>
                          </div>
                        );
                      } else if (nowMins >= lastEnd) {
                        return (
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.85rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                              🌙 Today's classroom sessions completed for {selectedRoutineGrade} ({formatDisplayTime(firstPeriod?.start_time)} - {formatDisplayTime(lastPeriod?.end_time)}). Showing full daily schedule below.
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Routine List */}
                  <div className="routine-list">
                    {routineLoading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }}></div>
                        Syncing real-time routine...
                      </div>
                    ) : routineEntries.length === 0 ? (
                      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1', margin: '0.5rem 0' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <CalendarDays size={22} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                          No Timetable Published in Database Yet
                        </h4>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                          School Admin hasn't configured periods for {selectedRoutineGrade} on {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}.
                        </p>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                          Official timetable is maintained and published by School Administration.
                        </p>
                      </div>
                    ) : (
                      routineEntries.map((period, idx) => {
                        const { status, label } = getPeriodRealtimeStatus(period.start_time, period.end_time);
                        const cat = getRoutineCategory(period.subject);
                        const isCurrent = status === 'current';
                        const isCompleted = status === 'completed';

                        return (
                          <div 
                            key={period.id || idx} 
                            className={`routine-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                          >
                            <div 
                              className="routine-time-box"
                              style={isCurrent ? { background: '#4F46E5', color: '#FFFFFF', border: 'none', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)' } : {}}
                            >
                              {formatDisplayTime(period.start_time)} - {formatDisplayTime(period.end_time)}
                            </div>

                            <div className="routine-desc-box">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <h4 className="routine-title" style={isCurrent ? { color: '#1E1B4B', fontSize: '1rem' } : {}}>
                                  {period.subject}
                                </h4>
                                {isCurrent && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 900, background: '#EF4444', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '0.04em' }}>
                                    <span className="routine-live-dot" style={{ background: '#FFFFFF', width: '6px', height: '6px' }}></span>
                                    ONGOING
                                  </span>
                                )}
                                {isCompleted && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <CheckCircle2 size={13} /> Completed
                                  </span>
                                )}
                              </div>
                              <p className="routine-sub">
                                {period.description || `Period ${period.period_number || idx + 1} • Guided preschool development`}
                              </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                              <span className="routine-tag" style={{ background: cat.bg, color: cat.color }}>
                                {cat.tag}
                              </span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isCurrent ? '#4F46E5' : isCompleted ? '#94A3B8' : '#D97706' }}>
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Teacher Quick Classroom Toolkit */}
                <div className="teacher-tools-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.85rem', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                        Teacher Classroom Toolkit
                      </h2>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                        Quick actions for today's preschool class
                      </span>
                    </div>
                  </div>

                  <div className="teacher-tools-grid">
                    <div className="teacher-action-tile" onClick={() => navigate('/admin/homework')}>
                      <div className="teacher-tile-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                        <BookOpen size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Give Homework</h4>
                      <p className="teacher-tile-sub">Upload daily worksheets & tasks</p>
                    </div>

                    <div className="teacher-action-tile" onClick={() => navigate('/admin/attendance')}>
                      <div className="teacher-tile-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                        <CalendarCheck size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Mark Attendance</h4>
                      <p className="teacher-tile-sub">200m Geofenced biometric roll-call</p>
                    </div>

                    <div className="teacher-action-tile" onClick={() => navigate('/admin/chat')}>
                      <div className="teacher-tile-icon" style={{ background: '#F3E8FF', color: '#8B5CF6' }}>
                        <MessageSquare size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Parent Chat</h4>
                      <p className="teacher-tile-sub">Direct parent communication & chats</p>
                    </div>

                    <div className="teacher-action-tile" onClick={() => navigate('/admin/notes')}>
                      <div className="teacher-tile-icon" style={{ background: '#CCFBF1', color: '#0D9488' }}>
                        <FileText size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Daily Diary Notes</h4>
                      <p className="teacher-tile-sub">Direct parent communication</p>
                    </div>

                    <div className="teacher-action-tile" onClick={() => navigate('/admin/stories')}>
                      <div className="teacher-tile-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                        <Images size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Story Feed</h4>
                      <p className="teacher-tile-sub">Share photos & activities with parents</p>
                    </div>

                    <div className="teacher-action-tile" onClick={() => navigate('/admin/progress')}>
                      <div className="teacher-tile-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                        <TrendingUp size={20} />
                      </div>
                      <h4 className="teacher-tile-title">Progress Reports</h4>
                      <p className="teacher-tile-sub">Developmental milestones & skills</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Live School Notice Alert for Teachers */}
              {stats?.recentNotices && stats.recentNotices.length > 0 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '1.25rem', padding: '1.1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 900, background: '#F59E0B', color: '#FFFFFF', padding: '0.15rem 0.55rem', borderRadius: '999px', letterSpacing: '0.04em' }}>
                          LATEST NOTICE
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400E' }}>
                          {stats.recentNotices[0].title}
                        </h4>
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#B45309', fontWeight: 600 }}>
                        {stats.recentNotices[0].content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/notices')}
                    style={{ background: '#F59E0B', color: '#FFFFFF', border: 'none', padding: '0.45rem 1rem', borderRadius: '0.75rem', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                  >
                    All Notices <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
            </>
            ) : (
              <>
                {/* Analytics & Graphs Hub (Admin View) */}
                {stats?.graphs && (
                  <div className="graphs-container">
                    
                    {/* Enquiries vs Admissions Graph */}
                    <div className="chart-card-modern">
                      <div className="chart-card-header">
                        <div className="chart-title-group">
                          <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <h2 className="chart-title">{t('enquiriesVsAdmissions')}</h2>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('monthlyTrend')}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', background: '#EEF2FF', color: '#4F46E5', padding: '0.35rem 0.75rem', borderRadius: '999px', fontWeight: 800 }}>
                          {t('liveMonthlyTrend')}
                        </span>
                      </div>

                      <div style={{ height: '260px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.graphs.enquiriesVsAdmissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', background: '#FFFFFF', padding: '12px' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                            <Area type="monotone" dataKey="enquiries" name={t('enquiries')} stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorEnq)" />
                            <Area type="monotone" dataKey="admissions" name={t('admissions')} stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAdm)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Fees Collection Trend Graph */}
                    <div className="chart-card-modern">
                      <div className="chart-card-header">
                        <div className="chart-title-group">
                          <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                            <IndianRupee size={20} />
                          </div>
                          <div>
                            <h2 className="chart-title">{t('feesCollectionTrend')}</h2>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('collectedVsPending')}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#D97706', padding: '0.35rem 0.75rem', borderRadius: '999px', fontWeight: 800 }}>
                          {t('financialOverview')}
                        </span>
                      </div>

                      <div style={{ height: '260px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.graphs.feesCollection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 11, fill: '#64748B' }} 
                              tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', background: '#FFFFFF', padding: '12px' }}
                              formatter={(value) => [`₹ ${Number(value).toLocaleString()}`, 'Amount']}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                            <Bar dataKey="collected" name={t('collected')} fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="pending" name={t('pending')} fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                )}

                {/* Franchise Network Hub (Super Admin Overview) */}
                <div className="franchise-network-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        {t('franchiseNetworkControl')}
                      </span>
                      <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0.4rem 0 0 0', fontWeight: 900 }}>
                        {t('franchiseOverviewTitle')}
                      </h2>
                    </div>
                    <button 
                      onClick={() => navigate('/admin/franchise')} 
                      style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '0.55rem 1.1rem', borderRadius: '0.85rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {t('manageSuppliesKits')} <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.25rem' }}>
                    {branchData.length === 0 ? (
                      <div style={{ padding: '2rem', color: '#94A3B8', textAlign: 'center', gridColumn: '1 / -1', fontWeight: 600 }}>
                        No branch data found in database.
                      </div>
                    ) : (
                      branchData.map((b: any, idx: number) => {
                        const studentCount = parseInt(b.student_count) || 0;
                        const staffCount = parseInt(b.teacher_count) || 0;
                        const dressRequired = studentCount * 2;

                        return (
                          <div key={b.id || idx} className="branch-card-modern">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 900 }}>📍 {b.name}</h3>
                              <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 800 }}>
                                Active
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                              <div>
                                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800 }}>{t('studentsCount')}</span>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#2563EB', fontWeight: 900 }}>🎓 {studentCount}</p>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800 }}>{t('staffCount')}</span>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#EC4899', fontWeight: 900 }}>👩‍🏫 {staffCount}</p>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800 }}>{t('uniformsRequired')}</span>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#059669', fontWeight: 900 }}>👗 {dressRequired}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Categorized & Searchable Quick Access Module Hub */}
            <div className="module-hub-card">
              <div className="module-hub-header">
                <div className="module-hub-title-group">
                  <h2>{isTeacher ? 'Classroom Modules & Toolkit' : t('preschoolOpsTitle')}</h2>
                  <p className="module-hub-subtitle">
                    {isTeacher 
                      ? 'Quick access to your academic, daily activities, and student care features' 
                      : t('preschoolOpsSubtitle')}
                  </p>
                </div>

                <div className="hub-search-box">
                  <Search size={16} color="#64748B" />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <X size={16} color="#64748B" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="category-tabs-bar">
                <button 
                  className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  {t('allModules')} ({availableModules.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('academic')}
                >
                  {t('tabAcademic')}
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'daycare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('daycare')}
                >
                  {t('tabDaycare')}
                </button>
                {!isTeacher && (
                  <button 
                    className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('finance')}
                  >
                    {t('tabFinance')}
                  </button>
                )}
                <button 
                  className={`tab-btn ${activeTab === 'communication' ? 'active' : ''}`}
                  onClick={() => setActiveTab('communication')}
                >
                  {t('tabCommunication')}
                </button>
              </div>

              {/* Modules Grid */}
              {filteredModules.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>No modules match "{searchTerm}"</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setActiveTab('all'); }} 
                    style={{ marginTop: '0.75rem', background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '0.45rem 1rem', borderRadius: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {t('clearFilter')}
                  </button>
                </div>
              ) : (
                <div className="features-grid-modern">
                  {filteredModules.map((item) => (
                    <div 
                      key={item.id} 
                      className="feature-card-modern"
                      onClick={() => navigate(item.path)}
                    >
                      <div className="feature-icon-box" style={{ backgroundColor: item.bgHex, color: item.color }}>
                        {item.icon}
                      </div>
                      <div className="feature-meta">
                        <h3 className="feature-title-modern">{t(item.titleKey)}</h3>
                        <span className="feature-category-tag">{t(item.categoryLabelKey)}</span>
                      </div>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent System Activity Feed */}
            <div className="activity-card-modern">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 900, margin: 0 }}>{t('recentSystemActivities')}</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('realTimeAuditLog')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity, index) => (
                    <div key={index} className="activity-timeline-item">
                      <div className="activity-avatar-badge">
                        <Activity size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.92rem' }}>
                          {activity.action} on <span style={{ color: '#4F46E5' }}>{activity.entityType}</span>
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                    {t('noRecentActivity')}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
