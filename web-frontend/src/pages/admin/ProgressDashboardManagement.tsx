import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import { 
  Search, TrendingUp, Calendar, BookOpen, MessageSquare, Activity, 
  GraduationCap, Users, Star, Plus, Sparkles, CheckCircle2, Award, 
  Edit3, Save, X, RefreshCw
} from 'lucide-react';
import './Directory.css';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number?: string;
  roll_number?: string;
  class_name?: string;
  grade?: string;
  school_name?: string;
  branch_name?: string;
  profile_image_url?: string;
}

interface AttendanceRecord {
  status: string;
  count: string;
}

interface ExamRecord {
  name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
}

interface NoteRecord {
  note_type: string;
  content: string;
  created_at: string;
}

interface MilestoneSkill {
  skill: string;
  status: string;
  rating: number;
  remark: string;
}

interface MilestoneDomain {
  domain: string;
  skills: MilestoneSkill[];
}

interface ProgressData {
  student?: any;
  attendance: AttendanceRecord[];
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number;
  };
  cumulativePercentage?: number | null;
  overallGrade?: string;
  recentExams: ExamRecord[];
  exams?: ExamRecord[];
  notes: NoteRecord[];
  milestones?: MilestoneDomain[];
  teacherRemarks?: string;
}

const STANDARD_PRESCHOOL_DOMAINS = [
  {
    domain: 'Physical & Motor Skills',
    skills: [
      { skill: 'Pencil / Crayon Grip & Scribbling', status: 'Excellent', rating: 5, remark: 'Firm tripod grip developed; colors within boundaries' },
      { skill: 'Scissor Skills & Paper Folding', status: 'Good', rating: 4, remark: 'Safe usage; cuts straight lines with guided supervision' },
      { skill: 'Gross Motor & Balance Activities', status: 'Excellent', rating: 5, remark: 'Active participation in outdoor running, hopping and obstacle courses' },
      { skill: 'Hand-Eye Coordination', status: 'Excellent', rating: 5, remark: 'Proficient in bead threading, puzzle solving and block stacking' }
    ]
  },
  {
    domain: 'Language & Literacy',
    skills: [
      { skill: 'Phonics & Letter Sound Recognition', status: 'Excellent', rating: 5, remark: 'Accurately identifies initial phonics sounds (A-Z)' },
      { skill: 'Rhymes Recitation & Rhythm', status: 'Excellent', rating: 5, remark: 'Loves singing classroom rhymes with expressive actions' },
      { skill: 'Listening Comprehension & Storytelling', status: 'Good', rating: 4, remark: 'Attentive during story hour; answers simple story questions' },
      { skill: 'Vocabulary & Self Expression', status: 'Excellent', rating: 5, remark: 'Expresses needs and curiosities confidently with peers & teachers' }
    ]
  },
  {
    domain: 'Cognitive & Numeracy Skills',
    skills: [
      { skill: 'Number Counting & Quantity (1-20)', status: 'Excellent', rating: 5, remark: 'Counts objects with one-to-one correspondence accurately' },
      { skill: 'Color & 2D Shape Identification', status: 'Excellent', rating: 5, remark: 'Quickly distinguishes Circle, Triangle, Square and Rectangle' },
      { skill: 'Pattern Matching & Sorting', status: 'Good', rating: 4, remark: 'Classifies toys and flashcards by color and size categories' },
      { skill: 'Curiosity & Inquiry Mindset', status: 'Excellent', rating: 5, remark: 'Eager to explore new science & nature sensory themes' }
    ]
  },
  {
    domain: 'Social & Emotional Development',
    skills: [
      { skill: 'Sharing & Cooperative Play', status: 'Excellent', rating: 5, remark: 'Shares toys willingly; polite and friendly in group play' },
      { skill: 'Following Classroom Routines', status: 'Excellent', rating: 5, remark: 'Follows instructions and cleans up after play sessions' },
      { skill: 'Independence & Self-Care Habits', status: 'Good', rating: 4, remark: 'Manages snack box and water bottle independently' },
      { skill: 'Empathy & Peer Interaction', status: 'Excellent', rating: 5, remark: 'Comforts friends and shows kindness in circle time' }
    ]
  },
  {
    domain: 'Creative Arts & Music',
    skills: [
      { skill: 'Freehand Drawing & Finger Painting', status: 'Excellent', rating: 5, remark: 'Vibrant color choices and joyful artistic creativity' },
      { skill: 'Music, Dance & Movement', status: 'Excellent', rating: 5, remark: 'Follows musical beats with enthusiasm during morning assembly' },
      { skill: 'Clay & Dough Craft Modeling', status: 'Good', rating: 4, remark: 'Enjoys molding playdough into imaginative shapes' }
    ]
  }
];

const ProgressDashboardManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlStudentId = searchParams.get('studentId');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isTeacher = (loggedUser?.role || '').toLowerCase() === 'teacher';
  const teacherAssignedGrade = loggedUser?.className || loggedUser?.assignedClass || loggedUser?.grade || loggedUser?.assigned_grade || '';

  // Left Panel Data
  const [students, setStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id?: string; name: string }[]>([
    { name: 'Playgroup' },
    { name: 'Nursery' },
    { name: 'Jr KG' },
    { name: 'Sr KG' },
    { name: 'Daycare' }
  ]);
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && teacherAssignedGrade) return teacherAssignedGrade;
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Right Panel Data
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'milestones' | 'exams' | 'attendance' | 'notes'>('milestones');

  // Real-time Action Feedback
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);

  // Modals & Form States
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', marks_obtained: '', total_marks: '25' });

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ note_type: 'Academic Excellence', content: '' });

  const [editingMilestone, setEditingMilestone] = useState<{ domain: string; skill: string; remark: string; rating: number; status: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showBanner = (msg: string) => {
    setRealtimeNotice(msg);
    setTimeout(() => setRealtimeNotice(null), 3500);
  };

  const fetchData = async () => {
    setLoadingStudents(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        apiClient.get('/admin/students').catch(() => ({ data: [] })),
        apiClient.get('/classes').catch(() => ({ data: [] }))
      ]);

      const fetchedStudents: Student[] = studentsRes.data?.data || studentsRes.data || [];
      setStudents(fetchedStudents);

      const fetchedClasses = classesRes.data || [];
      if (Array.isArray(fetchedClasses) && fetchedClasses.length > 0) {
        setAvailableClasses(fetchedClasses);
      }

      // Auto-select targeted student from URL parameter or first class student
      if (fetchedStudents.length > 0) {
        let targetStudent = urlStudentId ? fetchedStudents.find(s => s.id === urlStudentId) : null;
        if (!targetStudent && isTeacher && teacherAssignedGrade) {
          targetStudent = fetchedStudents.find(s => {
            const g = (s.grade || s.class_name || '').toLowerCase().trim();
            const tg = teacherAssignedGrade.toLowerCase().trim();
            return g === tg || tg.includes(g) || g.includes(tg);
          });
        }
        handleSelectStudent(targetStudent || fetchedStudents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch progress dashboard data', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setProgressData(null);
    setLoadingProgress(true);

    try {
      const response = await apiClient.get(`/progress/${student.id}`);
      setProgressData(response.data);
    } catch (error) {
      console.error('Failed to fetch progress data', error);
      setProgressData({ attendance: [], recentExams: [], notes: [], milestones: [] });
    } finally {
      setLoadingProgress(false);
    }
  };

  // Real-time rating update on click
  const handleUpdateMilestoneRating = async (domain: string, skill: string, newRating: number, currentRemark: string) => {
    if (!selectedStudent) return;
    const newStatus = newRating >= 5 ? 'Excellent' : newRating >= 4 ? 'Good' : 'Developing';

    // Optimistically update UI
    if (progressData && progressData.milestones) {
      const updatedDomains = progressData.milestones.map(dom => {
        if (dom.domain !== domain) return dom;
        return {
          ...dom,
          skills: dom.skills.map(s => s.skill === skill ? { ...s, rating: newRating, status: newStatus } : s)
        };
      });
      setProgressData({ ...progressData, milestones: updatedDomains });
    }

    try {
      await apiClient.post(`/progress/${selectedStudent.id}/milestone`, {
        domain,
        skill,
        rating: newRating,
        status: newStatus,
        remark: currentRemark
      });
      showBanner(`Updated "${skill}" to ${newRating} Stars in Real-Time!`);
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  // Real-time remark edit save
  const handleSaveMilestoneRemark = async () => {
    if (!selectedStudent || !editingMilestone) return;
    setSavingAction(true);
    try {
      await apiClient.post(`/progress/${selectedStudent.id}/milestone`, {
        domain: editingMilestone.domain,
        skill: editingMilestone.skill,
        rating: editingMilestone.rating,
        status: editingMilestone.status,
        remark: editingMilestone.remark
      });

      // Update in local state
      if (progressData && progressData.milestones) {
        const updatedDomains = progressData.milestones.map(dom => {
          if (dom.domain !== editingMilestone.domain) return dom;
          return {
            ...dom,
            skills: dom.skills.map(s => s.skill === editingMilestone.skill ? { ...s, remark: editingMilestone.remark, rating: editingMilestone.rating, status: editingMilestone.status } : s)
          };
        });
        setProgressData({ ...progressData, milestones: updatedDomains });
      }

      setEditingMilestone(null);
      showBanner(`Saved observation note for "${editingMilestone.skill}"!`);
    } catch (err) {
      console.error('Failed to save milestone remark:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Apply Full Preschool Framework Template for this student in real time
  const handleApplyMilestoneTemplate = async () => {
    if (!selectedStudent) return;
    setSavingAction(true);
    try {
      const flatSkills = STANDARD_PRESCHOOL_DOMAINS.flatMap(d => d.skills.map(s => ({ ...s, domain: d.domain })));
      await apiClient.put(`/progress/${selectedStudent.id}/milestones`, { milestones: flatSkills });
      
      // Refresh student progress
      const res = await apiClient.get(`/progress/${selectedStudent.id}`);
      setProgressData(res.data);
      showBanner(`Initialized 19 Preschool Milestones for ${selectedStudent.first_name} in Real-Time!`);
    } catch (err) {
      console.error('Failed to apply template:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Add Real Exam Assessment
  const handleAddExamResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !examForm.name || !examForm.marks_obtained) return;
    setSavingAction(true);
    try {
      await apiClient.post(`/progress/${selectedStudent.id}/exam-result`, {
        exam_name: examForm.name,
        marks_obtained: parseFloat(examForm.marks_obtained),
        total_marks: parseFloat(examForm.total_marks || '25')
      });

      const res = await apiClient.get(`/progress/${selectedStudent.id}`);
      setProgressData(res.data);
      setShowAddExamModal(false);
      setExamForm({ name: '', marks_obtained: '', total_marks: '25' });
      showBanner(`Added Exam Evaluation "${examForm.name}" in Real-Time!`);
    } catch (err) {
      console.error('Failed to add exam:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Add Real Teacher Note
  const handleAddTeacherNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !noteForm.content) return;
    setSavingAction(true);
    try {
      await apiClient.post(`/progress/${selectedStudent.id}/note`, {
        note_type: noteForm.note_type,
        content: noteForm.content,
        is_visible_to_parent: true
      });

      const res = await apiClient.get(`/progress/${selectedStudent.id}`);
      setProgressData(res.data);
      setShowAddNoteModal(false);
      setNoteForm({ note_type: 'Academic Excellence', content: '' });
      showBanner(`Added Teacher Observation Log in Real-Time!`);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingAction(false);
    }
  };

  const matchesClass = (student: Student, className: string) => {
    if (className === 'ALL') return true;
    const grade = (student.class_name || student.grade || '').toLowerCase().trim();
    const target = className.toLowerCase().trim();
    if (grade === target) return true;
    if (target === 'jr kg' && (grade.includes('jr') || grade.includes('junior') || grade === 'lkg')) return true;
    if (target === 'sr kg' && (grade.includes('sr') || grade.includes('senior') || grade === 'ukg')) return true;
    if (target === 'playgroup' && grade.includes('play')) return true;
    if (target === 'nursery' && grade.includes('nursery')) return true;
    if (target === 'daycare' && grade.includes('daycare')) return true;
    return grade.includes(target);
  };

  const getStudentCountForClass = (className: string) => {
    return students.filter(s => matchesClass(s, className)).length;
  };

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const classStudents = students.filter(s => matchesClass(s, newClass));
    if (classStudents.length > 0) {
      if (!selectedStudent || !classStudents.some(s => s.id === selectedStudent.id)) {
        handleSelectStudent(classStudents[0]);
      }
    } else {
      setSelectedStudent(null);
      setProgressData(null);
    }
  };

  const filteredStudents = students
    .filter(s => matchesClass(s, selectedClass))
    .filter(s => {
      if (!searchQuery) return true;
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const adm = (s.admission_number || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || adm.includes(query);
    });

  const getClassBadgeStyle = (gradeStr?: string) => {
    const g = (gradeStr || '').toLowerCase();
    if (g.includes('play')) return { bg: '#FCE7F3', text: '#BE185D' };
    if (g.includes('nursery')) return { bg: '#FEF3C7', text: '#B45309' };
    if (g.includes('jr')) return { bg: '#EFF6FF', text: '#1D4ED8' };
    if (g.includes('sr')) return { bg: '#ECFDF5', text: '#047857' };
    return { bg: '#F1F5F9', text: '#475569' };
  };

  const totalSkillsCount = progressData?.milestones?.flatMap(m => m.skills).length || 0;
  const examsList = progressData?.exams || progressData?.recentExams || [];

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        
        {/* Top Header */}
        <header style={{ marginBottom: '1.25rem', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="welcome-text" style={{ color: '#4338CA', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
              <TrendingUp size={28} color="#4F46E5" /> Progress & Milestone Management
            </h1>
            <p className="date-text" style={{ margin: '0.2rem 0 0 0' }}>
              Real-time evaluation of holistic early childhood milestones, assessments & teacher notes
            </p>
          </div>

          {realtimeNotice && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #10B981',
              color: '#065F46',
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(16,185,129,0.15)'
            }}>
              <CheckCircle2 size={16} color="#059669" /> {realtimeNotice}
            </div>
          )}
        </header>

        <div style={{ display: 'flex', flex: 1, background: 'white', borderRadius: '1rem', border: '1px solid #E0E7FF', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          {/* Left Panel: Class Selection & Student List */}
          <div style={{ width: '360px', borderRight: '1px solid #E0E7FF', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
            
            {/* 1. Class Selection Section */}
            <div style={{ padding: '1.25rem 1.25rem 0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                  <GraduationCap size={16} color="#4F46E5" /> 1. Select Class
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '12px' }}>
                  {filteredStudents.length} Students
                </span>
              </div>

              {/* Class Dropdown */}
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  background: 'white',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  marginBottom: '0.75rem'
                }}
              >
                <option value="ALL">🏫 All Classes ({students.length} Total)</option>
                {availableClasses.map(cls => (
                  <option key={cls.name} value={cls.name}>
                    🎓 {cls.name} ({getStudentCountForClass(cls.name)} Students)
                  </option>
                ))}
              </select>

              {/* Quick Class Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }} className="no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleClassChange('ALL')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: selectedClass === 'ALL' ? '#4F46E5' : '#E2E8F0',
                    color: selectedClass === 'ALL' ? 'white' : '#475569'
                  }}
                >
                  All ({students.length})
                </button>
                {availableClasses.map(cls => {
                  const isSel = selectedClass === cls.name;
                  const count = getStudentCountForClass(cls.name);
                  return (
                    <button
                      key={cls.name}
                      type="button"
                      onClick={() => handleClassChange(cls.name)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        border: isSel ? 'none' : '1px solid #CBD5E1',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: isSel ? '#4F46E5' : 'white',
                        color: isSel ? 'white' : '#334155'
                      }}
                    >
                      {cls.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder={`Search students...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.2rem', borderRadius: '1.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#F8FAFC' }}
                />
              </div>
            </div>

            {/* Student List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingStudents ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>Loading students...</div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const badge = getClassBadgeStyle(student.class_name || student.grade);
                  const isSelected = selectedStudent?.id === student.id;

                  return (
                    <div 
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      style={{ 
                        padding: '0.85rem 1.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.85rem', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelected ? 'white' : 'transparent',
                        borderLeft: isSelected ? '4px solid #4F46E5' : '4px solid transparent',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: isSelected ? '2px solid #4F46E5' : 'none' }}>
                        {student.profile_image_url ? (
                          <img src={student.profile_image_url} alt={student.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4338CA' }}>{student.first_name[0]}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.first_name} {student.last_name}
                          </h3>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            padding: '2px 6px', 
                            borderRadius: '6px',
                            background: badge.bg,
                            color: badge.text,
                            flexShrink: 0
                          }}>
                            {student.class_name || student.grade || 'Student'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                          {student.admission_number ? `Adm: ${student.admission_number}` : (student.roll_number ? `Roll: #${student.roll_number}` : 'Active Student')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#475569', fontSize: '0.95rem' }}>No students found</h4>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Real-Time Performance & Milestone Management */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflowY: 'auto' }}>
            {selectedStudent ? (
              <div style={{ padding: '1.75rem' }}>
                
                {/* Student Info Card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', backgroundColor: 'white', padding: '1.25rem 1.5rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid #C7D2FE' }}>
                      {selectedStudent.profile_image_url ? (
                        <img src={selectedStudent.profile_image_url} alt={selectedStudent.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4338CA' }}>{selectedStudent.first_name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F172A' }}>
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </h2>
                        <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                          {selectedStudent.class_name || selectedStudent.grade || 'Preschool'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                        Admission ID: {selectedStudent.admission_number || 'N/A'} • Overall Standing: <strong>{progressData?.overallGrade || 'N/A'}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={() => handleSelectStudent(selectedStudent)}
                      title="Refresh real-time data"
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '0.65rem',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs for Real-Time Management */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: activeTab === 'milestones' ? '#0F172A' : '#FFFFFF',
                      color: activeTab === 'milestones' ? '#FFFFFF' : '#64748B',
                      border: activeTab === 'milestones' ? 'none' : '1px solid #CBD5E1'
                    }}
                  >
                    🌟 Developmental Milestones ({totalSkillsCount})
                  </button>

                  <button
                    onClick={() => setActiveTab('exams')}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: activeTab === 'exams' ? '#0F172A' : '#FFFFFF',
                      color: activeTab === 'exams' ? '#FFFFFF' : '#64748B',
                      border: activeTab === 'exams' ? 'none' : '1px solid #CBD5E1'
                    }}
                  >
                    📝 Assessments & Exams ({examsList.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: activeTab === 'notes' ? '#0F172A' : '#FFFFFF',
                      color: activeTab === 'notes' ? '#FFFFFF' : '#64748B',
                      border: activeTab === 'notes' ? 'none' : '1px solid #CBD5E1'
                    }}
                  >
                    💬 Teacher Observation Notes ({progressData?.notes?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('attendance')}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: activeTab === 'attendance' ? '#0F172A' : '#FFFFFF',
                      color: activeTab === 'attendance' ? '#FFFFFF' : '#64748B',
                      border: activeTab === 'attendance' ? 'none' : '1px solid #CBD5E1'
                    }}
                  >
                    📅 Attendance Summary ({progressData?.attendanceStats?.percentage || 0}%)
                  </button>
                </div>

                {loadingProgress ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#4F46E5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Activity size={40} color="#C7D2FE" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600 }}>Loading real-time progress data...</p>
                  </div>
                ) : (
                  <div>
                    {/* 1. MILESTONES TAB (Real-Time Interactive Editor) */}
                    {activeTab === 'milestones' && (
                      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Sparkles size={18} color="#4F46E5" /> Early Childhood Holistic Milestones Matrix
                            </h3>
                            <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                              Click stars directly to change rating or click edit to update teacher observation notes in real-time.
                            </p>
                          </div>

                          {(!progressData?.milestones || progressData.milestones.length === 0) && (
                            <button
                              onClick={handleApplyMilestoneTemplate}
                              disabled={savingAction}
                              style={{
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                padding: '0.55rem 1.1rem',
                                borderRadius: '0.75rem',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 2px 6px rgba(79,70,229,0.25)'
                              }}
                            >
                              <Sparkles size={15} /> Apply 19-Skill Preschool Framework
                            </button>
                          )}
                        </div>

                        {progressData?.milestones && progressData.milestones.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {progressData.milestones.map((domain, dIdx) => (
                              <div key={dIdx} style={{ background: '#F8FAFC', borderRadius: '0.85rem', border: '1px solid #E2E8F0', padding: '1rem 1.25rem' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ color: '#4F46E5' }}>●</span> {domain.domain}
                                </h4>

                                <div style={{ overflowX: 'auto' }}>
                                  <table className="data-table" style={{ background: 'white', borderRadius: '0.65rem' }}>
                                    <thead>
                                      <tr style={{ background: '#F1F5F9' }}>
                                        <th style={{ width: '30%' }}>Skill</th>
                                        <th style={{ width: '15%' }}>Proficiency</th>
                                        <th style={{ width: '20%' }}>Real-Time Rating</th>
                                        <th>Teacher Progress Note</th>
                                        <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {domain.skills.map((s, sIdx) => {
                                        const isExc = s.rating >= 5;
                                        return (
                                          <tr key={sIdx}>
                                            <td style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>{s.skill}</td>
                                            <td>
                                              <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                background: isExc ? '#DCFCE7' : '#EEF2FF',
                                                color: isExc ? '#15803D' : '#4338CA'
                                              }}>
                                                {s.status}
                                              </span>
                                            </td>
                                            <td>
                                              <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }} title="Click any star to update rating in real time">
                                                {[1, 2, 3, 4, 5].map((starVal) => (
                                                  <button
                                                    key={starVal}
                                                    type="button"
                                                    onClick={() => handleUpdateMilestoneRating(domain.domain, s.skill, starVal, s.remark)}
                                                    style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                                                  >
                                                    <Star
                                                      size={16}
                                                      fill={starVal <= s.rating ? '#F59E0B' : 'none'}
                                                      color="#F59E0B"
                                                    />
                                                  </button>
                                                ))}
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', marginLeft: '4px' }}>
                                                  ({s.rating}/5)
                                                </span>
                                              </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                                              {s.remark || <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>No remark added</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                              <button
                                                onClick={() => setEditingMilestone({
                                                  domain: domain.domain,
                                                  skill: s.skill,
                                                  rating: s.rating,
                                                  status: s.status,
                                                  remark: s.remark || ''
                                                })}
                                                title="Edit observation remark"
                                                style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                                              >
                                                <Edit3 size={13} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                            <Sparkles size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                            <h4 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Milestones Configured Yet</h4>
                            <p style={{ margin: '0.35rem 0 1.25rem 0', fontSize: '0.85rem' }}>
                              Click below to initialize the standard 19-skill Early Childhood Development Framework for {selectedStudent.first_name}.
                            </p>
                            <button
                              onClick={handleApplyMilestoneTemplate}
                              disabled={savingAction}
                              style={{
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                padding: '0.65rem 1.25rem',
                                borderRadius: '0.75rem',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Sparkles size={16} /> Apply 19-Skill Preschool Framework
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. ASSESSMENTS & EXAMS TAB */}
                    {activeTab === 'exams' && (
                      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <BookOpen size={18} color="#059669" /> Academic Assessments & Formal Evaluations
                            </h3>
                            <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                              Cumulative standing: <strong>{progressData?.cumulativePercentage ? `${progressData.cumulativePercentage}% (Grade ${progressData.overallGrade})` : 'Pending'}</strong>
                            </p>
                          </div>

                          <button
                            onClick={() => setShowAddExamModal(true)}
                            style={{
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '0.75rem',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 6px rgba(5,150,105,0.25)'
                            }}
                          >
                            <Plus size={15} /> Add Assessment Score
                          </button>
                        </div>

                        {examsList.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                              <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                  <th>Evaluation Component / Exam Name</th>
                                  <th>Marks Obtained</th>
                                  <th>Total Marks</th>
                                  <th>Percentage</th>
                                  <th>Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {examsList.map((ex, idx) => {
                                  const tot = ex.total_marks || 1;
                                  const pct = Math.round((ex.marks_obtained / tot) * 100);
                                  return (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 800, color: '#0F172A' }}>{ex.name}</td>
                                      <td style={{ fontWeight: 900, color: '#059669' }}>{ex.marks_obtained}</td>
                                      <td style={{ fontWeight: 700, color: '#64748B' }}>{ex.total_marks}</td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#10B981', borderRadius: '999px' }} />
                                          </div>
                                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A' }}>{pct}%</span>
                                        </div>
                                      </td>
                                      <td>
                                        <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 900, fontSize: '0.85rem' }}>
                                          {ex.grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : 'B')}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                            <BookOpen size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                            <h4 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Assessments Recorded</h4>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Click "+ Add Assessment Score" to log formal evaluations.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. TEACHER NOTES TAB */}
                    {activeTab === 'notes' && (
                      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <MessageSquare size={18} color="#D97706" /> Teacher Observations & Feedback Log
                            </h3>
                            <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                              These notes appear in real-time on the Parent Portal Progress Report.
                            </p>
                          </div>

                          <button
                            onClick={() => setShowAddNoteModal(true)}
                            style={{
                              background: '#D97706',
                              color: 'white',
                              border: 'none',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '0.75rem',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 6px rgba(217,119,6,0.25)'
                            }}
                          >
                            <Plus size={15} /> Add Observation Note
                          </button>
                        </div>

                        {progressData?.notes && progressData.notes.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {progressData.notes.map((n, i) => (
                              <div key={i} style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid #F59E0B' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>{n.note_type}</span>
                                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>{n.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                            <MessageSquare size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                            <h4 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Observation Notes Logged</h4>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Click "+ Add Observation Note" to record teacher feedback.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. ATTENDANCE TAB */}
                    {activeTab === 'attendance' && (
                      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                          <Calendar size={18} color="#14B8A6" />
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Attendance Overview</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                          <div style={{ backgroundColor: '#D1FAE5', padding: '1.25rem', borderRadius: '0.85rem', textAlign: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#10B981' }}>
                              {progressData?.attendanceStats?.presentDays || 0}
                            </h2>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>Days Present</p>
                          </div>

                          <div style={{ backgroundColor: '#FEE2E2', padding: '1.25rem', borderRadius: '0.85rem', textAlign: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#EF4444' }}>
                              {progressData?.attendanceStats?.absentDays || 0}
                            </h2>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>Days Absent</p>
                          </div>

                          <div style={{ backgroundColor: '#EFF6FF', padding: '1.25rem', borderRadius: '0.85rem', textAlign: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#2563EB' }}>
                              {progressData?.attendanceStats?.totalDays || 0}
                            </h2>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>Total Days</p>
                          </div>

                          <div style={{ backgroundColor: '#ECFDF5', padding: '1.25rem', borderRadius: '0.85rem', textAlign: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>
                              {progressData?.attendanceStats?.percentage || 0}%
                            </h2>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>Attendance Rate</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', padding: '2rem', textAlign: 'center' }}>
                <TrendingUp size={72} color="#C7D2FE" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontWeight: 800, fontSize: '1.25rem' }}>
                  Student Progress & Milestone Management
                </h3>
                <p style={{ margin: 0, maxWidth: '420px', color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {selectedClass === 'ALL'
                    ? 'Select a class or click on a student to evaluate their milestones and assessments.'
                    : `Click on any student in ${selectedClass} from the list to manage.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Edit Milestone Remark & Rating */}
        {editingMilestone && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Edit Observation: {editingMilestone.skill}
                </h3>
                <button onClick={() => setEditingMilestone(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                  Rating (1 to 5 Stars):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingMilestone({
                        ...editingMilestone,
                        rating: s,
                        status: s >= 5 ? 'Excellent' : s >= 4 ? 'Good' : 'Developing'
                      })}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star
                        size={24}
                        fill={s <= editingMilestone.rating ? '#F59E0B' : 'none'}
                        color="#F59E0B"
                      />
                    </button>
                  ))}
                  <span style={{ fontWeight: 800, color: '#4F46E5', marginLeft: '0.5rem', alignSelf: 'center' }}>
                    {editingMilestone.status} ({editingMilestone.rating}/5)
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                  Teacher Observation & Progress Note:
                </label>
                <textarea
                  rows={3}
                  value={editingMilestone.remark}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, remark: e.target.value })}
                  placeholder="Enter detailed feedback or observation for this skill..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMilestoneRemark}
                  disabled={savingAction}
                  style={{ background: '#4F46E5', border: 'none', color: 'white', padding: '0.55rem 1.25rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={15} /> Save Real-Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Assessment Score */}
        {showAddExamModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <form onSubmit={handleAddExamResult} style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '450px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Add Assessment Score for {selectedStudent?.first_name}
                </h3>
                <button type="button" onClick={() => setShowAddExamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>Exam / Subject Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phonics & Rhymes Evaluation"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>Marks Obtained:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 24"
                    value={examForm.marks_obtained}
                    onChange={(e) => setExamForm({ ...examForm, marks_obtained: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>Total Marks:</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={examForm.total_marks}
                    onChange={(e) => setExamForm({ ...examForm, total_marks: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  style={{ background: '#059669', border: 'none', color: 'white', padding: '0.55rem 1.25rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={15} /> Save Assessment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Teacher Observation Note */}
        {showAddNoteModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <form onSubmit={handleAddTeacherNote} style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Add Observation Note for {selectedStudent?.first_name}
                </h3>
                <button type="button" onClick={() => setShowAddNoteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>Observation Category:</label>
                <select
                  value={noteForm.note_type}
                  onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                >
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Social & Emotional">Social & Emotional</option>
                  <option value="Gross & Fine Motor">Gross & Fine Motor</option>
                  <option value="Creative Arts & Music">Creative Arts & Music</option>
                  <option value="General Guidance">General Guidance</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>Observation Feedback Content:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed feedback note visible to parents..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.65rem', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  style={{ background: '#D97706', border: 'none', color: 'white', padding: '0.55rem 1.25rem', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={15} /> Save Real-Time Note
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};

export default ProgressDashboardManagement;
