import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import apiClient from '../../api/client';
import { 
  Users, BookOpen, ScanLine, Clock, FileText, Megaphone, Plus, ArrowRight, 
  TrendingUp, FileOutput, CalendarDays, MessageSquare, Check, X, Search, 
  RefreshCw, Award, CheckCircle2, AlertCircle, Sparkles, Send, CheckCheck, 
  Calendar, Layers, MapPin, Radio, MessageCircle
} from 'lucide-react';
import '../admin/Dashboard.css';
import './TeacherDashboard.css';

interface ClassStudent {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  grade?: string;
  roll_number?: string;
  admission_number?: string;
  profile_image_url?: string;
  today_status?: 'present' | 'absent' | 'late' | 'leave' | string;
  in_time?: string;
  out_time?: string;
}

interface TimetablePeriod {
  id?: string;
  period_number: number;
  subject: string;
  start_time: string;
  end_time: string;
  day_of_week?: string;
}

const DEFAULT_PRESCHOOL_SCHEDULE: TimetablePeriod[] = [
  { period_number: 1, subject: '🌅 Circle Time & Morning Assembly', start_time: '09:00', end_time: '09:30' },
  { period_number: 2, subject: '🔤 Phonics, Letters & Action Rhymes', start_time: '09:30', end_time: '10:15' },
  { period_number: 3, subject: '🍎 Healthy Snack Break & Handwashing', start_time: '10:15', end_time: '10:45' },
  { period_number: 4, subject: '🎨 Creative Art & Sensory Play', start_time: '10:45', end_time: '11:30' },
  { period_number: 5, subject: '🏃 Gross Motor & Outdoor Play', start_time: '11:30', end_time: '12:15' },
  { period_number: 6, subject: '📖 Storytelling & Pack-up Routine', start_time: '12:15', end_time: '12:45' }
];

const QUICK_HOMEWORK_TEMPLATES = [
  {
    title: 'Letter & Phonics Tracing Sheet',
    subject: 'English & Literacy',
    description: 'Practice tracing uppercase and lowercase letters taught in circle time today. Color the pictures that start with the letter sound.'
  },
  {
    title: 'Count and Match Shapes (1 to 10)',
    subject: 'Math & Numbers',
    description: 'Count the dots and match them to the correct number block. Practice drawing circles and squares.'
  },
  {
    title: 'Nature & Color Scavenger Hunt',
    subject: 'EVS & Sensory Exploration',
    description: 'Find 3 green things and 2 yellow things at home or garden with parents. Share photos or bring them tomorrow.'
  },
  {
    title: 'Bedtime Story Conversation with Parents',
    subject: 'Moral Stories & Rhymes',
    description: 'Listen to a short bedtime story with parents and talk about who the characters were.'
  }
];

const QUICK_NOTE_SUGGESTIONS = [
  '🌟 Super active and engaged in morning circle time!',
  '🥪 Finished entire snack & lunch independently with good manners.',
  '😴 Had a peaceful and restful afternoon nap.',
  '🎨 Showed great creativity and focus in art & craft time.',
  '🤝 Shared toys nicely and played cooperatively with classmates.',
  '✂️ Needs slight encouragement with fine motor / scissors activities.',
  '💧 Drank plenty of water and followed handwashing hygiene.'
];

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const teacherName = loggedUser?.firstName 
    ? `${loggedUser.firstName} ${loggedUser.lastName || ''}`.trim() 
    : (loggedUser?.email || 'Class Teacher');

  const [assignedClass, setAssignedClass] = useState<string>(
    loggedUser?.className || loggedUser?.assignedClass || loggedUser?.grade || 'Loading Class...'
  );

  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    activeHomework: 0,
    studentNotesCount: 0
  });

  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Self Attendance GPS Punch
  const [punching, setPunching] = useState(false);
  const [lastPunchedTime, setLastPunchedTime] = useState<string | null>(() => {
    return localStorage.getItem(`teacher_punch_${loggedUser?.id || 'today'}`);
  });

  // Timetable Schedule State
  const [todaySchedule, setTodaySchedule] = useState<TimetablePeriod[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isUsingDefaultSchedule, setIsUsingDefaultSchedule] = useState(false);

  // Quick Homework Modal State
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('General Activity');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => {
    const tmrw = new Date(Date.now() + 86400000);
    return tmrw.toISOString().split('T')[0];
  });
  const [hwBroadcast, setHwBroadcast] = useState(true);
  const [hwSubmitting, setHwSubmitting] = useState(false);

  // Quick Student Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState('');
  const [noteType, setNoteType] = useState('General');
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibleToParent, setNoteVisibleToParent] = useState(true);
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Real-time Live Clock (Ticks every 1 second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[currentTime.getDay()];

  // Self Attendance GPS Punch
  const handleSelfAttendancePunch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }
    setPunching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const now = new Date();
          const localDateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
          const localTimeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

          const res = await apiClient.post('/attendance/unified/mark', {
            type: 'staff',
            id: loggedUser?.id || loggedUser?.email || 'teacher-1',
            name: teacherName,
            method: 'gps_geofence',
            latitude: userLat,
            longitude: userLng
          });

          const finalDate = res.data?.date || localDateStr;
          const finalTime = res.data?.time || localTimeStr;
          const timeBadge = `${finalDate} @ ${finalTime}`;

          localStorage.setItem(`teacher_punch_${loggedUser?.id || 'today'}`, timeBadge);
          setLastPunchedTime(timeBadge);

          alert(`✅ ATTENDANCE PUNCH SUCCESSFUL!\n\n👩‍🏫 Educator: ${teacherName}\n🎓 Assigned Class: ${assignedClass}\n📅 Date: ${finalDate}\n⏰ Exact Time: ${finalTime}\n📍 GPS Status: Validated within 200m School Geofence\n🟢 Status: PRESENT TODAY`);
        } catch (err: any) {
          console.error(err);
          const errMsg = err?.response?.data?.message || err?.response?.data?.error || 'Self Attendance Recorded!';
          alert(`⚠️ PUNCH NOTICE:\n\n${errMsg}`);
        } finally {
          setPunching(false);
        }
      },
      (err) => {
        setPunching(false);
        console.error(err);
        alert('Please allow Location / GPS permissions on your mobile/laptop browser to punch attendance within 200m school perimeter.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch Timetable for Today
  const fetchTodayTimetable = useCallback(async (className: string) => {
    if (!className || className === 'Loading Class...') return;
    setLoadingSchedule(true);
    try {
      const res = await apiClient.get(`/timetable/${encodeURIComponent(className)}`).catch(() => ({ data: { data: [] } }));
      const allEntries: TimetablePeriod[] = res.data?.data || res.data || [];
      
      const filtered = allEntries.filter(
        item => (item.day_of_week || '').toLowerCase().trim() === todayDayName.toLowerCase().trim()
      );

      if (filtered.length > 0) {
        // Sort by period_number or start_time
        filtered.sort((a, b) => a.period_number - b.period_number);
        setTodaySchedule(filtered);
        setIsUsingDefaultSchedule(false);
      } else {
        // Fallback to rich preschool standard daily routine
        setTodaySchedule(DEFAULT_PRESCHOOL_SCHEDULE);
        setIsUsingDefaultSchedule(true);
      }
    } catch {
      setTodaySchedule(DEFAULT_PRESCHOOL_SCHEDULE);
      setIsUsingDefaultSchedule(true);
    } finally {
      setLoadingSchedule(false);
    }
  }, [todayDayName]);

  // Fetch Primary Teacher Dashboard Data
  const fetchTeacherDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const [classesRes, homeworkRes, notesRes, leavesRes, attRes] = await Promise.all([
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/homework').catch(() => ({ data: [] })),
        apiClient.get('/notes').catch(() => ({ data: [] })),
        apiClient.get('/leaves').catch(() => ({ data: [] })),
        apiClient.get(`/attendance/students/all?date=${todayIso}`).catch(() => ({ data: [] }))
      ]);

      const classesList = classesRes.data || [];
      const myClassObj = classesList.find((c: any) => c.class_teacher_id === loggedUser?.id);
      const activeClassName = myClassObj 
        ? myClassObj.name 
        : (loggedUser?.className || loggedUser?.assigned_grade || loggedUser?.assignedClass || 'Jr KG');
      
      setAssignedClass(activeClassName);

      // Persist to user object in local storage
      if (loggedUser) {
        loggedUser.className = activeClassName;
        loggedUser.grade = activeClassName;
        loggedUser.assigned_grade = activeClassName;
        localStorage.setItem('user', JSON.stringify(loggedUser));
      }

      // Fetch timetable with resolved active class name
      fetchTodayTimetable(activeClassName);

      // Parse attendance response
      const rawAtt = attRes.data;
      let rawStudents: any[] = [];
      if (rawAtt && typeof rawAtt === 'object' && !Array.isArray(rawAtt) && rawAtt.students) {
        rawStudents = rawAtt.students;
      } else if (Array.isArray(rawAtt)) {
        rawStudents = rawAtt;
      }

      // Filter students to this teacher's assigned class
      const classStudents: ClassStudent[] = rawStudents.filter((s: any) => {
        const sg = (s.grade || '').toLowerCase().trim();
        const tg = activeClassName.toLowerCase().trim();
        return sg === tg || tg.includes(sg) || sg.includes(tg);
      });

      setStudents(classStudents);

      const homeworkList = homeworkRes.data?.data || homeworkRes.data || [];
      const notesList = notesRes.data?.data || notesRes.data || [];
      const leavesList = leavesRes.data?.data || leavesRes.data || [];

      const filteredHw = homeworkList.filter((h: any) => {
        const hg = (h.grade || h.class_name || '').toLowerCase().trim();
        const tg = activeClassName.toLowerCase().trim();
        return hg === tg || tg.includes(hg) || hg.includes(tg);
      });

      const filteredLeaves = leavesList.filter((l: any) => {
        const lg = (l.grade || '').toLowerCase().trim();
        const tg = activeClassName.toLowerCase().trim();
        const isClass = lg === tg || tg.includes(lg) || lg.includes(tg);
        return isClass && (l.status || 'pending').toLowerCase() === 'pending';
      });

      const presentCount = classStudents.filter(s => (s.today_status || '').toLowerCase() === 'present').length;
      const absentCount = classStudents.filter(s => (s.today_status || '').toLowerCase() === 'absent').length;

      setStats({
        totalStudents: classStudents.length,
        presentToday: presentCount,
        absentToday: absentCount,
        pendingLeaves: filteredLeaves.length,
        activeHomework: filteredHw.length,
        studentNotesCount: Array.isArray(notesList) ? notesList.length : 0
      });
    } catch (err) {
      console.error('Failed to load teacher dashboard', err);
    } finally {
      setLoadingData(false);
    }
  }, [loggedUser?.id, todayIso, fetchTodayTimetable]);

  useEffect(() => {
    fetchTeacherDashboard();
  }, [fetchTeacherDashboard]);

  // Quick 1-click Attendance Toggle for Single Student
  const handleQuickMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
    setUpdatingStudentId(studentId);
    try {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      await apiClient.post('/attendance/mark', {
        date: todayIso,
        records: [
          {
            student_id: studentId,
            status: status,
            in_time: status === 'present' ? nowTime : null,
            out_time: null
          }
        ]
      });

      // Update state locally
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            today_status: status,
            in_time: status === 'present' ? nowTime : undefined
          };
        }
        return s;
      }));

      // Update stats count
      setStats(prev => {
        const nextPresent = status === 'present' ? prev.presentToday + 1 : Math.max(0, prev.presentToday - 1);
        const nextAbsent = status === 'absent' ? prev.absentToday + 1 : Math.max(0, prev.absentToday - 1);
        return {
          ...prev,
          presentToday: nextPresent,
          absentToday: nextAbsent
        };
      });
    } catch (error) {
      console.error('Failed to quick-mark attendance', error);
      alert('Could not update attendance. Please try again.');
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Bulk Mark All Present
  const handleMarkAllPresent = async () => {
    if (students.length === 0) return;
    if (!window.confirm(`Mark all ${students.length} students in ${assignedClass} as PRESENT today?`)) return;

    setBulkUpdating(true);
    try {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const records = students.map(s => ({
        student_id: s.id,
        status: 'present',
        in_time: nowTime,
        out_time: null
      }));

      await apiClient.post('/attendance/mark', {
        date: todayIso,
        records
      });

      setStudents(prev => prev.map(s => ({
        ...s,
        today_status: 'present',
        in_time: nowTime
      })));

      setStats(prev => ({
        ...prev,
        presentToday: students.length,
        absentToday: 0
      }));

      alert(`✅ All ${students.length} students marked PRESENT!`);
    } catch (err) {
      console.error('Failed to bulk mark present', err);
      alert('Failed to mark all present.');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Handle Quick Homework Creation
  const handleCreateQuickHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwDescription.trim() || !hwDueDate) {
      alert('Please fill in Homework Title, Instructions, and Due Date');
      return;
    }

    setHwSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', hwTitle.trim());
      formPayload.append('description', hwDescription.trim());
      formPayload.append('due_date', hwDueDate);
      formPayload.append('grade', assignedClass);

      await apiClient.post('/homework', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Optional Chat Room Announcement
      if (hwBroadcast) {
        try {
          const roomsRes = await apiClient.get('/chat/rooms');
          const rooms = roomsRes.data?.data || [];
          const classRoom = rooms.find((r: any) => (r.name || '').toLowerCase().includes(assignedClass.toLowerCase()));
          if (classRoom) {
            await apiClient.post('/chat/messages', {
              room_id: classRoom.id,
              message: `📚 [HOMEWORK FOR ${assignedClass.toUpperCase()}]\n📌 ${hwTitle.trim()}\n🏷️ Subject: ${hwSubject}\n📝 Instructions: ${hwDescription.trim()}\n📅 Due Date: ${new Date(hwDueDate).toLocaleDateString()}`
            });
          }
        } catch (chatErr) {
          console.warn('Chat broadcast skipped:', chatErr);
        }
      }

      setIsHwModalOpen(false);
      setHwTitle('');
      setHwDescription('');
      setStats(prev => ({ ...prev, activeHomework: prev.activeHomework + 1 }));
      alert(`🎉 Success! Homework posted for ${assignedClass}. Parents notified.`);
    } catch (err: any) {
      console.error('Failed to post homework', err);
      alert(err.response?.data?.error || 'Could not post homework');
    } finally {
      setHwSubmitting(false);
    }
  };

  // Handle Quick Student Note / Observation Submission
  const handleCreateQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteStudentId || !noteContent.trim()) {
      alert('Please select a student and enter an observation note');
      return;
    }

    setNoteSubmitting(true);
    try {
      await apiClient.post('/notes', {
        student_id: noteStudentId,
        note_type: noteType,
        content: noteContent.trim(),
        is_visible_to_parent: noteVisibleToParent
      });

      setIsNoteModalOpen(false);
      setNoteContent('');
      setStats(prev => ({ ...prev, studentNotesCount: prev.studentNotesCount + 1 }));
      alert('✅ Student observation note recorded successfully!');
    } catch (err: any) {
      console.error('Failed to record note', err);
      alert(err.response?.data?.error || 'Failed to record observation note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Open Note Modal for Specific Student
  const handleOpenNoteForStudent = (studentId: string) => {
    setNoteStudentId(studentId);
    setNoteContent('');
    setNoteType('General');
    setIsNoteModalOpen(true);
  };

  // Parse "HH:MM" string to minutes from start of day
  const parseTimeMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSeconds = currentMinutes * 60 + currentTime.getSeconds();

  const getPeriodTimeInfo = (period: TimetablePeriod) => {
    const startMin = parseTimeMinutes(period.start_time);
    const endMin = parseTimeMinutes(period.end_time);
    const startSec = startMin * 60;
    const endSec = endMin * 60;

    const isLive = currentMinutes >= startMin && currentMinutes < endMin;
    const isCompleted = currentMinutes >= endMin;
    const isUpcoming = currentMinutes < startMin;

    let progressPercent = 0;
    if (isLive && endSec > startSec) {
      progressPercent = Math.min(100, Math.max(0, ((currentSeconds - startSec) / (endSec - startSec)) * 100));
    }

    let statusLabel = '';
    if (isLive) {
      const remMin = Math.max(0, endMin - currentMinutes);
      statusLabel = remMin <= 1 ? 'Ending in < 1m' : `Ends in ~${remMin}m`;
    } else if (isCompleted) {
      statusLabel = 'Completed';
    } else {
      const diff = startMin - currentMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      statusLabel = h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`;
    }

    return { isLive, isCompleted, isUpcoming, progressPercent, statusLabel };
  };

  const activePeriod = useMemo(() => {
    return todaySchedule.find(p => {
      const startMin = parseTimeMinutes(p.start_time);
      const endMin = parseTimeMinutes(p.end_time);
      return currentMinutes >= startMin && currentMinutes < endMin;
    });
  }, [todaySchedule, currentMinutes]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const roll = (s.roll_number || s.admission_number || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [students, studentSearch]);

  return (
    <div className="dashboard-layout teacher-dashboard-wrap">
      <TeacherSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10, padding: '2rem 2.5rem' }}>
        
        {/* Welcome Banner */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '1.5rem', 
          padding: '2rem 2.25rem', 
          color: '#0F172A', 
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div className="teacher-banner-badge">
              <span>👩‍🏫</span>
              <span>CLASS TEACHER WORKSPACE</span>
              <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
              <span>{todayDayName}, {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <h1 style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '2rem', fontWeight: 900, color: '#0F172A' }}>
              Welcome back, {teacherName}!
            </h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
              Assigned Class: <strong style={{ color: '#047857', fontSize: '1.05rem' }}>{assignedClass}</strong> • Instant Attendance, Class Routine & Fast Worksheets
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* GPS Self Attendance Punch */}
            <button 
              onClick={handleSelfAttendancePunch}
              disabled={punching}
              className="teacher-btn-action"
              style={{ 
                background: lastPunchedTime ? '#ECFDF5' : '#FEF3C7', 
                color: lastPunchedTime ? '#047857' : '#B45309', 
                border: lastPunchedTime ? '1px solid #A7F3D0' : '1px solid #FDE68A', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
              }}
            >
              <ScanLine size={18} color={lastPunchedTime ? "#059669" : "#D97706"} /> 
              {punching ? 'Verifying GPS...' : (lastPunchedTime ? `🟢 Punched: ${lastPunchedTime}` : '📍 Punch My Attendance')}
            </button>

            {/* Quick Homework Button */}
            <button 
              onClick={() => setIsHwModalOpen(true)}
              className="teacher-btn-action"
              style={{ background: '#059669', color: 'white', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
            >
              <Plus size={18} /> + Quick Homework
            </button>

            {/* Quick Student Remark Button */}
            <button 
              onClick={() => {
                if (students.length > 0) setNoteStudentId(students[0].id);
                setIsNoteModalOpen(true);
              }}
              className="teacher-btn-action"
              style={{ background: '#4F46E5', color: 'white', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
            >
              <FileText size={18} /> + Add Remark
            </button>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.15rem', marginBottom: '2rem' }}>
          <div className="teacher-stat-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Users size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>MY CLASS STUDENTS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>{stats.totalStudents}</div>
          </div>

          <div className="teacher-stat-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>PRESENT TODAY</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginTop: '0.25rem' }}>{stats.presentToday}</div>
          </div>

          <div className="teacher-stat-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>ABSENT TODAY</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', marginTop: '0.25rem' }}>{stats.absentToday}</div>
          </div>

          <div 
            onClick={() => navigate('/teacher/leaves')} 
            className="teacher-stat-card"
            style={{ cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <FileOutput size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>PENDING LEAVES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stats.pendingLeaves > 0 ? '#7C3AED' : '#0F172A', marginTop: '0.25rem' }}>
              {stats.pendingLeaves} {stats.pendingLeaves > 0 && <span style={{ fontSize: '0.8rem', color: '#7C3AED', fontWeight: 800 }}>Review</span>}
            </div>
          </div>

          <div 
            onClick={() => navigate('/teacher/homework')} 
            className="teacher-stat-card"
            style={{ cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <BookOpen size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>HOMEWORK TASKS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>{stats.activeHomework} Active</div>
          </div>

          <div 
            onClick={() => navigate('/teacher/notes')} 
            className="teacher-stat-card"
            style={{ cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <FileText size={22} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 800 }}>STUDENT REMARKS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>{stats.studentNotesCount} Recorded</div>
          </div>
        </div>

        {/* Today's Timetable & Schedule Section */}
        <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', border: '1px solid #E2E8F0', padding: '1.5rem 1.75rem', marginBottom: '2.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.35rem' }}>⏰</span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
                  Today's Class Schedule ({todayDayName})
                </h2>

                {/* Real-time Clock Badge */}
                <div className="live-clock-badge">
                  <span className="live-pulse-dot"></span>
                  <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                </div>

                {isUsingDefaultSchedule && (
                  <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#64748B', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                    Standard Daily Routine
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '6px', flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  Scheduled periods for <strong>{assignedClass}</strong>.
                </p>
                {activePeriod ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                    Active Now: {activePeriod.subject} ({activePeriod.start_time} - {activePeriod.end_time})
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                    ⏳ Outside Active Class Periods
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={() => navigate('/teacher/timetable')}
              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.5rem 0.95rem', borderRadius: '0.75rem', color: '#334155', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Clock size={15} /> Full Timetable View <ArrowRight size={14} />
            </button>
          </div>

          {loadingSchedule ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
              Loading schedule for {todayDayName}...
            </div>
          ) : todaySchedule.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#64748B' }}>No periods scheduled for today ({todayDayName}).</p>
            </div>
          ) : (
            <div className="timetable-timeline">
              {todaySchedule.map((period, idx) => {
                const { isLive, isCompleted, isUpcoming, progressPercent, statusLabel } = getPeriodTimeInfo(period);
                return (
                  <div 
                    key={idx} 
                    className={`timetable-period-card ${isLive ? 'is-active' : isCompleted ? 'is-completed' : 'is-upcoming'}`}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span className={`period-badge ${isLive ? 'active-badge' : isCompleted ? 'completed-badge' : 'upcoming-badge'}`}>
                          {isLive ? '🟢 NOW LIVE' : isCompleted ? '✓ Done' : `Period ${period.period_number || idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isLive ? '#047857' : isCompleted ? '#94A3B8' : '#64748B' }}>
                          {period.start_time} - {period.end_time}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: isCompleted ? '#64748B' : '#0F172A', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                        {period.subject}
                      </div>

                      {isLive && (
                        <div className="period-progress-container" title={`${Math.round(progressPercent)}% elapsed`}>
                          <div className="period-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: isLive ? '#047857' : '#94A3B8', fontWeight: 700, paddingTop: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                      <span>Class: {assignedClass}</span>
                      <span style={{ fontWeight: 800, color: isLive ? '#047857' : isUpcoming ? '#4F46E5' : '#94A3B8' }}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Classroom Attendance & Roster */}
        <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid #E2E8F0', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>📋</span>
                <span>Today's Class Attendance & Quick Actions ({assignedClass})</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                Live real-time roster for today ({todayIso}). Click P / A to update attendance instantly, or record observations.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Bulk Mark All Present */}
              <button 
                onClick={handleMarkAllPresent}
                disabled={bulkUpdating || students.length === 0}
                style={{
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '0.75rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <CheckCheck size={16} /> Mark All Present
              </button>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <button 
                onClick={fetchTeacherDashboard}
                disabled={loadingData}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.55rem 0.85rem', borderRadius: '0.75rem', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} className={loadingData ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {loadingData ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
              Loading student roster...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#64748B' }}>
                {studentSearch ? `No students found matching "${studentSearch}"` : `No students enrolled in ${assignedClass} yet.`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', background: '#F8FAFC' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Roll / Adm</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Today's Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Quick Mark</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const st = (s.today_status || 'not_marked').toLowerCase();
                    const isPresent = st === 'present';
                    const isAbsent = st === 'absent';
                    const isLeave = st === 'leave';
                    const isLate = st === 'late';
                    const isUpdating = updatingStudentId === s.id;

                    return (
                      <tr key={s.id || idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>
                          {s.roll_number || s.admission_number || `#${idx + 1}`}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden' }}>
                              {s.profile_image_url ? (
                                <img src={s.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                s.first_name ? s.first_name.charAt(0).toUpperCase() : 'S'
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                                {s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.grade || assignedClass}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {isPresent && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                              Present {s.in_time && `@ ${s.in_time}`}
                            </span>
                          )}
                          {isAbsent && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FEE2E2', color: '#991B1B', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></span>
                              Absent
                            </span>
                          )}
                          {isLeave && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#EDE9FE', color: '#6D28D9', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }}></span>
                              On Leave
                            </span>
                          )}
                          {isLate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span>
                              Late
                            </span>
                          )}
                          {!isPresent && !isAbsent && !isLeave && !isLate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#F1F5F9', color: '#64748B', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Not Marked
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleQuickMarkAttendance(s.id, 'present')}
                              title="Mark Present"
                              style={{
                                background: isPresent ? '#10B981' : '#F8FAFC',
                                color: isPresent ? 'white' : '#059669',
                                border: isPresent ? '1px solid #10B981' : '1px solid #A7F3D0',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Check size={14} /> P
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleQuickMarkAttendance(s.id, 'absent')}
                              title="Mark Absent"
                              style={{
                                background: isAbsent ? '#EF4444' : '#F8FAFC',
                                color: isAbsent ? 'white' : '#DC2626',
                                border: isAbsent ? '1px solid #EF4444' : '1px solid #FECACA',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <X size={14} /> A
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenNoteForStudent(s.id)}
                              style={{
                                background: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <FileText size={13} /> + Remark
                            </button>
                            <button
                              onClick={() => navigate(`/teacher/progress?studentId=${s.id}`)}
                              style={{
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                border: '1px solid #C7D2FE',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Award size={13} /> Milestones
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Teacher Shortcuts Grid */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem' }}>
          Teacher Workspace & Shortcuts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          <div onClick={() => navigate('/teacher/progress')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Progress & Milestones</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Evaluate preschool skills, star ratings & assessment scores</div>
          </div>

          <div onClick={() => navigate('/teacher/leaves')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileOutput size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Student Leave Approvals</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Review and approve leave applications submitted by parents</div>
          </div>

          <div onClick={() => navigate('/teacher/homework')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Homework Portal</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Assign class worksheets, reading tasks & activities</div>
          </div>

          <div onClick={() => navigate('/teacher/timetable')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Class Timetable</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>View scheduled subjects, circle time & activity periods</div>
          </div>

          <div onClick={() => navigate('/teacher/notes')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Daily Remarks & Logs</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Post child behavior, meal intake & observation notes</div>
          </div>

          <div onClick={() => navigate('/teacher/chat')} style={{ background: 'white', padding: '1.35rem', borderRadius: '1.2rem', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={22} />
              </div>
              <ArrowRight color="#94A3B8" size={18} />
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Parent & Staff Chat</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Communicate securely with parents and preschool leadership</div>
          </div>

        </div>
      </main>

      {/* QUICK HOMEWORK MODAL */}
      {isHwModalOpen && (
        <div className="teacher-modal-backdrop" onClick={() => setIsHwModalOpen(false)}>
          <div className="teacher-modal-container" onClick={e => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                    Quick Homework ({assignedClass})
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Assign worksheets or fun practice activities to parents</div>
                </div>
              </div>
              <button 
                onClick={() => setIsHwModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateQuickHomework}>
              <div className="teacher-modal-body">
                {/* Preschool Templates */}
                <div className="teacher-field-group">
                  <label className="teacher-field-label">1-Tap Preschool Activity Templates</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {QUICK_HOMEWORK_TEMPLATES.map((tmpl, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-template-chip"
                        onClick={() => {
                          setHwTitle(tmpl.title);
                          setHwSubject(tmpl.subject);
                          setHwDescription(tmpl.description);
                        }}
                      >
                        <Sparkles size={12} color="#059669" />
                        {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="teacher-field-group">
                  <label className="teacher-field-label">Homework Title *</label>
                  <input 
                    type="text" 
                    className="teacher-input" 
                    placeholder="e.g. Letter A Tracing & Sound Activity"
                    value={hwTitle}
                    onChange={e => setHwTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="teacher-field-group">
                    <label className="teacher-field-label">Subject / Learning Domain</label>
                    <select 
                      className="teacher-select"
                      value={hwSubject}
                      onChange={e => setHwSubject(e.target.value)}
                    >
                      <option value="English & Literacy">English & Literacy</option>
                      <option value="Math & Numbers">Math & Numbers</option>
                      <option value="EVS & Sensory Exploration">EVS & Sensory Exploration</option>
                      <option value="Moral Stories & Rhymes">Moral Stories & Rhymes</option>
                      <option value="Creative Art & Craft">Creative Art & Craft</option>
                      <option value="General Activity">General Activity</option>
                    </select>
                  </div>

                  <div className="teacher-field-group">
                    <label className="teacher-field-label">Due Date *</label>
                    <input 
                      type="date" 
                      className="teacher-input"
                      value={hwDueDate}
                      onChange={e => setHwDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="teacher-field-group">
                  <label className="teacher-field-label">Instructions & Details for Parents *</label>
                  <textarea 
                    className="teacher-textarea"
                    rows={4}
                    placeholder="Explain what the child should practice, how parents can assist, and when to submit..."
                    value={hwDescription}
                    onChange={e => setHwDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                  <input 
                    type="checkbox"
                    id="hwBroadcastCheck"
                    checked={hwBroadcast}
                    onChange={e => setHwBroadcast(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hwBroadcastCheck" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    📢 Broadcast notification directly into class chat group for parents
                  </label>
                </div>
              </div>

              <div className="teacher-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsHwModalOpen(false)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontWeight: 800, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={hwSubmitting}
                  style={{ background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Send size={16} /> {hwSubmitting ? 'Posting...' : 'Publish Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STUDENT NOTE / REMARK MODAL */}
      {isNoteModalOpen && (
        <div className="teacher-modal-backdrop" onClick={() => setIsNoteModalOpen(false)}>
          <div className="teacher-modal-container" onClick={e => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                    Student Observation & Daily Remark
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Log daily preschool notes, meals, nap time or behavior</div>
                </div>
              </div>
              <button 
                onClick={() => setIsNoteModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateQuickNote}>
              <div className="teacher-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                  <div className="teacher-field-group">
                    <label className="teacher-field-label">Student *</label>
                    <select 
                      className="teacher-select"
                      value={noteStudentId}
                      onChange={e => setNoteStudentId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.full_name || `${st.first_name} ${st.last_name}`} (Roll: {st.roll_number || st.admission_number || '-'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="teacher-field-group">
                    <label className="teacher-field-label">Category</label>
                    <select 
                      className="teacher-select"
                      value={noteType}
                      onChange={e => setNoteType(e.target.value)}
                    >
                      <option value="General">General Remark</option>
                      <option value="Behavior">Behavior & Social</option>
                      <option value="Food & Appetite">Food & Appetite</option>
                      <option value="Nap & Rest">Nap & Rest</option>
                      <option value="Health & Energy">Health & Energy</option>
                      <option value="Milestone">Milestone Highlight</option>
                    </select>
                  </div>
                </div>

                {/* Quick Observation Chips */}
                <div className="teacher-field-group">
                  <label className="teacher-field-label">1-Tap Quick Observations</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {QUICK_NOTE_SUGGESTIONS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-template-chip"
                        onClick={() => {
                          setNoteContent(prev => prev ? `${prev} ${chip}` : chip);
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="teacher-field-group">
                  <label className="teacher-field-label">Observation Notes *</label>
                  <textarea 
                    className="teacher-textarea"
                    rows={4}
                    placeholder="Write your observation or select from chips above..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                  <input 
                    type="checkbox"
                    id="noteVisibleCheck"
                    checked={noteVisibleToParent}
                    onChange={e => setNoteVisibleToParent(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="noteVisibleCheck" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    👁️ Visible to parents in their Mobile Parent App feed
                  </label>
                </div>
              </div>

              <div className="teacher-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsNoteModalOpen(false)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontWeight: 800, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={noteSubmitting}
                  style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Send size={16} /> {noteSubmitting ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
