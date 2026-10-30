import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import {
  TrendingUp, ArrowLeft, Printer, Award, Calendar, BookOpen,
  Sparkles, Star, CheckCircle2, Heart, ShieldCheck
} from 'lucide-react';
import '../admin/Dashboard.css';

interface StudentInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  admission_number?: string;
  roll_number?: string;
  grade?: string;
  school_name?: string;
  school_address?: string;
  date_of_birth?: string;
  blood_group?: string;
  profile_image_url?: string;
}

interface SkillItem {
  skill: string;
  status: string;
  rating: number;
  remark: string;
}

interface MilestoneDomain {
  domain: string;
  skills: SkillItem[];
}

interface ExamItem {
  name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
}

interface NoteItem {
  note_type: string;
  content: string;
  created_at: string;
}

const ParentProgress: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'milestones' | 'exams' | 'attendance' | 'remarks'>('milestones');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0
  });
  const [milestones, setMilestones] = useState<MilestoneDomain[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [overallGrade, setOverallGrade] = useState('N/A');
  const [cumulativePercentage, setCumulativePercentage] = useState<number | null>(null);
  const [term, setTerm] = useState('Term 1 (Academic Year 2026 - 2027)');
  const [teacherRemarks, setTeacherRemarks] = useState('');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const fallbackChildName = loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'My Child');
  const fallbackChildClass = loggedUser?.className || loggedUser?.grade || 'Preschool';
  const fallbackBranchName = loggedUser?.school_name || loggedUser?.branchName || 'Main Branch';

  const fetchProgressReport = async () => {
    try {
      setLoading(true);
      const studentId = loggedUser?.student_id;
      const url = studentId ? `/progress/${studentId}` : '/progress/my';

      const response = await apiClient.get(url);
      const data = response.data;

      if (data) {
        if (data.student) setStudent(data.student);
        if (data.attendanceStats) setAttendanceStats(data.attendanceStats);
        setMilestones(Array.isArray(data.milestones) ? data.milestones : []);
        const exList = Array.isArray(data.exams) ? data.exams : (Array.isArray(data.recentExams) ? data.recentExams : []);
        setExams(exList);
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        if (data.overallGrade) setOverallGrade(data.overallGrade);
        if (data.cumulativePercentage !== undefined) setCumulativePercentage(data.cumulativePercentage);
        if (data.term) setTerm(data.term);
        if (data.teacherRemarks !== undefined) setTeacherRemarks(data.teacherRemarks);
      }
    } catch (err) {
      console.error('Failed to fetch child progress report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressReport();
  }, []);

  const childName = student 
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
    : fallbackChildName;
  const childClass = student?.grade || fallbackChildClass;
  const branchName = student?.school_name || fallbackBranchName;
  const admissionNo = student?.admission_number || (loggedUser?.student_id ? `ADM-${loggedUser.student_id.slice(0, 4).toUpperCase()}` : 'N/A');

  // Total skills count
  const allSkills = milestones.flatMap(m => m.skills);
  const totalSkillsCount = allSkills.length;
  const masteredSkillsCount = allSkills.filter(s => s.rating >= 4).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Top Header Bar */}
        <header className="header flex-between no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: '#FFFFFF', 
                color: 'var(--text-main)', 
                border: '1px solid #E2E8F0', 
                padding: '0.55rem', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }} 
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                <TrendingUp color="#4F46E5" size={30} />
                Child Progress & Development Report
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Comprehensive holistic developmental assessment & report card for <strong>{childName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
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
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(79,70,229,0.3)'
              }}
            >
              <Printer size={16} /> Print Official Report Card
            </button>
          </div>
        </header>

        {/* Printable Official Report Card Container */}
        <div className="printable-report-card">
          
          {/* Official Preschool Header for Report Card */}
          <div style={{ background: 'white', borderRadius: '1.2rem', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #EEF2FF', paddingBottom: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img 
                  src="/logopre.png" 
                  alt="EduNeev Kids Preschool" 
                  style={{ height: '65px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
                    EDUNEEV KIDS PRESCHOOL
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 700 }}>
                    A Foundation for the future... Since 2013 • {branchName}
                  </p>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                    Holistic Child Development & Early Childhood Progress Profile (2026 - 2027)
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  background: '#ECFDF5', 
                  color: '#047857', 
                  border: '1px solid #A7F3D0', 
                  padding: '0.45rem 1rem', 
                  borderRadius: '999px', 
                  fontSize: '0.85rem', 
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Award size={16} /> Grade: {overallGrade}
                </span>
                <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                  Assessment Period: {term}
                </div>
              </div>
            </div>

            {/* Student Biodata Bar */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '1rem', 
              background: '#F8FAFC', 
              padding: '1rem 1.25rem', 
              borderRadius: '0.85rem',
              border: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>STUDENT NAME</span>
                <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{childName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>CLASS / GRADE</span>
                <strong style={{ fontSize: '1rem', color: '#4F46E5' }}>{childClass}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>ADMISSION ID</span>
                <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{admissionNo}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>ATTENDANCE RATE</span>
                <strong style={{ fontSize: '1rem', color: '#059669' }}>{attendanceStats.percentage}% ({attendanceStats.presentDays}/{attendanceStats.totalDays} Days)</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block' }}>CAMPUS BRANCH</span>
                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{branchName}</strong>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>OVERALL STANDING</span>
                <Award color="#4F46E5" size={20} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4F46E5', marginTop: '0.35rem' }}>{overallGrade}</div>
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                {cumulativePercentage !== null ? `Cumulative Score: ${cumulativePercentage}%` : 'Evaluation in Progress'}
              </span>
            </div>

            <div style={{ background: '#ECFDF5', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#047857', fontSize: '0.85rem', fontWeight: 700 }}>ATTENDANCE RATE</span>
                <ShieldCheck color="#047857" size={20} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', marginTop: '0.35rem' }}>{attendanceStats.percentage}%</div>
              <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 700 }}>
                {attendanceStats.presentDays} Days Present out of {attendanceStats.totalDays} Total
              </span>
            </div>

            <div style={{ background: '#FEF3C7', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#B45309', fontSize: '0.85rem', fontWeight: 700 }}>MILESTONES MASTERED</span>
                <Sparkles color="#B45309" size={20} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#B45309', marginTop: '0.35rem' }}>
                {totalSkillsCount > 0 ? `${masteredSkillsCount} / ${totalSkillsCount} Skills` : '0 Skills'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700 }}>
                {totalSkillsCount > 0 ? 'Assessed Developmental Skills' : 'No Milestones Recorded'}
              </span>
            </div>

            <div style={{ background: '#FDF2F8', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #FBCFE8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#9D174D', fontSize: '0.85rem', fontWeight: 700 }}>TEACHER OBSERVATIONS</span>
                <Heart color="#EC4899" size={20} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#BE185D', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {notes.length > 0 ? notes[0].note_type : 'Observations Log'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#9D174D', fontWeight: 700 }}>
                {notes.length > 0 ? `${notes.length} Observation${notes.length === 1 ? '' : 's'} on Record` : 'No Notes on Record'}
              </span>
            </div>
          </div>

          {/* Tab Navigation (Hidden in Print) */}
          <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('milestones')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.85rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'milestones' ? '#0F172A' : '#FFFFFF',
                color: activeTab === 'milestones' ? '#FFFFFF' : '#64748B',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: activeTab === 'milestones' ? 'none' : '1px solid #E2E8F0'
              }}
            >
              🌟 Developmental Milestones ({totalSkillsCount})
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.85rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'exams' ? '#0F172A' : '#FFFFFF',
                color: activeTab === 'exams' ? '#FFFFFF' : '#64748B',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: activeTab === 'exams' ? 'none' : '1px solid #E2E8F0'
              }}
            >
              📝 Term Assessments & Scores ({exams.length})
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.85rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'attendance' ? '#0F172A' : '#FFFFFF',
                color: activeTab === 'attendance' ? '#FFFFFF' : '#64748B',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: activeTab === 'attendance' ? 'none' : '1px solid #E2E8F0'
              }}
            >
              📅 Attendance Profile ({attendanceStats.percentage}%)
            </button>

            <button
              onClick={() => setActiveTab('remarks')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.85rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'remarks' ? '#0F172A' : '#FFFFFF',
                color: activeTab === 'remarks' ? '#FFFFFF' : '#64748B',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: activeTab === 'remarks' ? 'none' : '1px solid #E2E8F0'
              }}
            >
              💬 Teacher Remarks & Log ({notes.length})
            </button>
          </div>

          {/* Section 1: Developmental Milestones (Preschool Domain Matrix) */}
          {(activeTab === 'milestones' || true) && (
            <div className={activeTab !== 'milestones' ? 'print-only' : ''} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} color="#4F46E5" />
                    Early Childhood Holistic Milestone Matrix
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                    Observations evaluated across fine motor, language, pre-math, social and creative domains
                  </p>
                </div>
                <span style={{ fontSize: '0.78rem', background: '#F1F5F9', padding: '0.3rem 0.75rem', borderRadius: '6px', fontWeight: 800, color: '#334155' }}>
                  Rating Scale: 5/5 ⭐ (Excellent) • 4/5 ⭐ (Good) • 3/5 ⭐ (Developing)
                </span>
              </div>

              {milestones.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {milestones.map((domain, dIdx) => (
                    <div key={dIdx} style={{ background: '#F8FAFC', borderRadius: '0.9rem', border: '1px solid #E2E8F0', padding: '1rem 1.25rem' }}>
                      <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#4F46E5' }}>●</span> {domain.domain}
                      </h4>

                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ background: 'white', borderRadius: '0.65rem' }}>
                          <thead>
                            <tr style={{ background: '#F1F5F9' }}>
                              <th style={{ width: '35%' }}>Developmental Skill</th>
                              <th style={{ width: '18%' }}>Proficiency Level</th>
                              <th style={{ width: '15%' }}>Score / Stars</th>
                              <th>Teacher Observation & Progress Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domain.skills.map((s, sIdx) => {
                              const isExc = s.rating >= 5;
                              return (
                                <tr key={sIdx}>
                                  <td style={{ fontWeight: 800, color: '#0F172A' }}>{s.skill}</td>
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
                                    <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                                      {Array.from({ length: 5 }).map((_, starIdx) => (
                                        <Star 
                                          key={starIdx} 
                                          size={13} 
                                          fill={starIdx < s.rating ? '#F59E0B' : 'none'} 
                                          color="#F59E0B" 
                                        />
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                    {s.remark}
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
                  <h4 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Developmental Milestones Recorded</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Evaluations entered by the class teacher will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Formal Assessments & Evaluations */}
          {(activeTab === 'exams' || true) && (
            <div className={activeTab !== 'exams' ? 'print-only' : ''} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} color="#059669" />
                  Academic Assessments & Evaluation Scores
                </h3>
                <span style={{ fontSize: '0.8rem', background: '#ECFDF5', color: '#047857', padding: '0.3rem 0.75rem', borderRadius: '6px', fontWeight: 800 }}>
                  Cumulative Assessment: {cumulativePercentage !== null ? `${cumulativePercentage}% (Grade ${overallGrade})` : 'Pending Assessment'}
                </span>
              </div>

              {exams.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        <th>Subject / Evaluation Component</th>
                        <th>Marks Obtained</th>
                        <th>Total Marks</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th>Performance Band</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((ex, idx) => {
                        const totalM = ex.total_marks || 1;
                        const pct = Math.round((ex.marks_obtained / totalM) * 100);
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
                            <td style={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                              {pct >= 90 ? 'Outstanding ⭐⭐⭐' : pct >= 75 ? 'Very Good ⭐⭐' : 'Good Progress ⭐'}
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
                  <h4 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Exam Evaluations Recorded</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Formal assessment marks entered by teachers will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Attendance Summary */}
          {(activeTab === 'attendance' || true) && (
            <div className={activeTab !== 'attendance' ? 'print-only' : ''} style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#D97706" />
                Student Attendance & Punctuality Record
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                  <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 800 }}>DAYS PRESENT</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803D', marginTop: '0.2rem' }}>{attendanceStats.presentDays}</div>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>Full Classroom Attendance</span>
                </div>

                <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #FECACA', textAlign: 'center' }}>
                  <div style={{ color: '#991B1B', fontSize: '0.8rem', fontWeight: 800 }}>DAYS ABSENT</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem' }}>{attendanceStats.absentDays}</div>
                  <span style={{ fontSize: '0.75rem', color: '#991B1B' }}>Excused / Leave applied</span>
                </div>

                <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                  <div style={{ color: '#1E40AF', fontSize: '0.8rem', fontWeight: 800 }}>TOTAL WORKING DAYS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563EB', marginTop: '0.2rem' }}>{attendanceStats.totalDays}</div>
                  <span style={{ fontSize: '0.75rem', color: '#1E40AF' }}>Preschool Academic Term</span>
                </div>

                <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                  <div style={{ color: '#065F46', fontSize: '0.8rem', fontWeight: 800 }}>PUNCTUALITY INDEX</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>{attendanceStats.percentage}%</div>
                  <span style={{ fontSize: '0.75rem', color: '#065F46' }}>Regular & On-Time Arrival</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Teacher's Remarks, Observations & Official Signatures */}
          <div style={{ background: 'white', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={20} color="#EC4899" />
              Class Teacher’s Holistic Observations & Future Guidance
            </h3>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1.25rem', borderRadius: '0.9rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#78350F', lineHeight: 1.6, fontWeight: 500 }}>
                "{teacherRemarks || 'No formal observations or remarks have been entered by the class teacher yet.'}"
              </p>
            </div>

            {/* Recent Classroom Notes from Teacher */}
            {notes.length > 0 ? (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
                  Recent Teacher Feedback Logs:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notes.map((n, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.75rem', borderLeft: '4px solid #4F46E5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4338CA' }}>{n.note_type}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '2rem', color: '#64748B', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No additional teacher observation notes on record.
              </div>
            )}

            {/* Official Report Card Signatures */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '2rem', 
              marginTop: '2.5rem', 
              borderTop: '2px dashed #E2E8F0', 
              paddingTop: '1.75rem' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #94A3B8', marginBottom: '0.5rem' }}></div>
                <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>Class Teacher</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>EduNeev Kids Preschool</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #94A3B8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800 }}>[Verified & Approved]</span>
                </div>
                <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>Principal / Branch Head</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{branchName}</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #94A3B8', marginBottom: '0.5rem' }}></div>
                <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>Parent Signature</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Acknowledged by Parent</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .parent-sidebar, .no-print, header button, .btn-parent-logout {
            display: none !important;
          }
          .dashboard-layout {
            display: block !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .printable-report-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .print-only {
            display: block !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ParentProgress;
