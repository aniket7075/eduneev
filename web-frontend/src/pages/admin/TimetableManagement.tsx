import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import { 
  Plus, ArrowLeft, Calendar, Edit2, Trash2, X, Clock, Settings, 
  Printer, Sparkles, LayoutGrid, List, Copy, Check, ChevronRight, BookOpen, Layers
} from 'lucide-react';
import './Directory.css';

interface TimetableEntry {
  id: string;
  grade: string;
  day_of_week: string;
  period_number: number;
  subject: string;
  start_time: string;
  end_time: string;
}

interface ClassData {
  id: string;
  name: string;
}

const PRESET_CLASSES = [
  { name: 'Playgroup', icon: '👶', color: '#EC4899', desc: 'Age 1.5 - 2.5 yrs' },
  { name: 'Nursery', icon: '🌱', color: '#10B981', desc: 'Age 2.5 - 3.5 yrs' },
  { name: 'Jr KG', icon: '⭐', color: '#F59E0B', desc: 'Age 3.5 - 4.5 yrs' },
  { name: 'Sr KG', icon: '🎓', color: '#6366F1', desc: 'Age 4.5 - 5.5 yrs' },
  { name: 'Daycare', icon: '🧸', color: '#06B6D4', desc: 'Full Day Care' }
];

const PRESCHOOL_ROUTINES: Record<string, { period_number: number; subject: string; start_time: string; end_time: string }[]> = {
  nursery: [
    { period_number: 1, subject: '🌅 Circle Time & Morning Assembly', start_time: '09:00', end_time: '09:30' },
    { period_number: 2, subject: '🔤 Phonics, Letters & Rhymes Fun', start_time: '09:30', end_time: '10:15' },
    { period_number: 3, subject: '🍎 Healthy Snack & Hygiene Routine', start_time: '10:15', end_time: '10:45' },
    { period_number: 4, subject: '🎨 Creative Art, Coloring & Sensory Play', start_time: '10:45', end_time: '11:30' },
    { period_number: 5, subject: '🏃 Gross Motor & Outdoor Play', start_time: '11:30', end_time: '12:15' },
    { period_number: 6, subject: '📖 Storytelling, Good Day Song & Pack-up', start_time: '12:15', end_time: '12:45' }
  ],
  daycare: [
    { period_number: 1, subject: '🌅 Arrival, Breakfast & Free Play', start_time: '09:00', end_time: '10:30' },
    { period_number: 2, subject: '🎨 Guided Sensory & Learning Activities', start_time: '10:30', end_time: '12:00' },
    { period_number: 3, subject: '🍲 Nutritious Lunch & Hygiene Routine', start_time: '12:00', end_time: '01:00' },
    { period_number: 4, subject: '💤 Quiet Afternoon Nap & Rest', start_time: '01:00', end_time: '03:00' },
    { period_number: 5, subject: '🥛 Evening Milk, Fruit Snack & Rhymes', start_time: '03:00', end_time: '04:00' },
    { period_number: 6, subject: '🏃 Indoor/Outdoor Games & Dispersal', start_time: '04:00', end_time: '05:30' }
  ]
};

const QUICK_SUBJECT_SUGGESTIONS = [
  '🌅 Circle Time & Assembly',
  '🔤 Phonics & Alphabets',
  '🔢 Numbers & Math Concepts',
  '🍎 Healthy Snack Break',
  '🎨 Sensory Play & Art Craft',
  '🏃 Gross Motor / Outdoor Play',
  '📖 Storytelling & Moral Stories',
  '🎵 Rhymes & Action Songs',
  '🧩 Montessori Activity',
  '💤 Nap Time & Quiet Rest'
];

const getActivityStyle = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('snack') || s.includes('lunch') || s.includes('milk') || s.includes('fruit') || s.includes('breakfast')) {
    return {
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#B45309',
      badge: '🍎 Break & Meal',
      accent: '#F59E0B'
    };
  }
  if (s.includes('art') || s.includes('color') || s.includes('craft') || s.includes('drawing') || s.includes('sensory')) {
    return {
      bg: '#FDF2F8',
      border: '#FBCFE8',
      color: '#BE185D',
      badge: '🎨 Creative Art',
      accent: '#EC4899'
    };
  }
  if (s.includes('outdoor') || s.includes('motor') || s.includes('play') || s.includes('game') || s.includes('exercise')) {
    return {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      color: '#15803D',
      badge: '🏃 Physical Play',
      accent: '#10B981'
    };
  }
  if (s.includes('story') || s.includes('book') || s.includes('reading')) {
    return {
      bg: '#F5F3FF',
      border: '#DDD6FE',
      color: '#6D28D9',
      badge: '📖 Story Time',
      accent: '#8B5CF6'
    };
  }
  if (s.includes('rhyme') || s.includes('music') || s.includes('song') || s.includes('dance')) {
    return {
      bg: '#FDF4FF',
      border: '#F5D0FE',
      color: '#A21CAF',
      badge: '🎵 Rhymes & Music',
      accent: '#D946EF'
    };
  }
  if (s.includes('phonic') || s.includes('letter') || s.includes('alphabet') || s.includes('english') || s.includes('math') || s.includes('number')) {
    return {
      bg: '#EEF2FF',
      border: '#C7D2FE',
      color: '#3730A3',
      badge: '🔤 Early Learning',
      accent: '#6366F1'
    };
  }
  if (s.includes('circle') || s.includes('assembly') || s.includes('prayer') || s.includes('welcome')) {
    return {
      bg: '#FEFCE8',
      border: '#FEF08A',
      color: '#854D0E',
      badge: '🌅 Circle Time',
      accent: '#EAB308'
    };
  }
  if (s.includes('nap') || s.includes('rest') || s.includes('sleep')) {
    return {
      bg: '#F1F5F9',
      border: '#CBD5E1',
      color: '#475569',
      badge: '💤 Rest Time',
      accent: '#64748B'
    };
  }
  return {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#334155',
    badge: '📚 Activity',
    accent: '#3B82F6'
  };
};

const TimetableManagement: React.FC = () => {
  const navigate = useNavigate();

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || '').toLowerCase();
  const isAdminOrSuperAdmin = userRole === 'admin' || userRole === 'school_admin' || userRole === 'super_admin' || userRole === 'owner';
  
  // Dedicated Teacher Assigned Grade Resolution
  const teacherAssignedGrade = loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.class || loggedUser?.class_name || loggedUser?.department || '';

  // Data States
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States - Default to teacher's class if logged in as teacher
  const [selectedGrade, setSelectedGrade] = useState(() => {
    if (userRole === 'teacher' && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'Nursery';
  });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [presetTargetScope, setPresetTargetScope] = useState<'day' | 'week'>('week');
  
  const emptyForm = { id: '', subject: '', period_number: '', start_time: '', end_time: '', day_of_week: '' };
  const [formData, setFormData] = useState(emptyForm);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newTs, setNewTs] = useState({ teacher_id: '', subject: '', weekly_periods: 5 });

  // Dedicated Class Teacher State (Preschool Single Educator Model)
  const DEFAULT_CLASS_TEACHERS: Record<string, string> = {
    'Playgroup': 'Mrs. Sunita Rao',
    'Nursery': 'Mrs. Priya Deshmukh',
    'Jr KG': 'Mrs. Ananya Sharma',
    'Sr KG': 'Mrs. Radhika Kulkarni',
    'Daycare': 'Mrs. Meena Joshi'
  };

  const [classTeachers, setClassTeachers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('eduneev_class_teachers');
      return saved ? JSON.parse(saved) : DEFAULT_CLASS_TEACHERS;
    } catch {
      return DEFAULT_CLASS_TEACHERS;
    }
  });

  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [selectedTeacherInput, setSelectedTeacherInput] = useState('');

  const handleSaveClassTeacher = (teacherName: string) => {
    const updated = { ...classTeachers, [selectedGrade]: teacherName };
    setClassTeachers(updated);
    localStorage.setItem('eduneev_class_teachers', JSON.stringify(updated));
    setIsAssignTeacherModalOpen(false);
  };

  useEffect(() => {
    fetchClasses();
    if (userRole === 'teacher' && teacherAssignedGrade) {
      setSelectedGrade(teacherAssignedGrade);
    }
  }, []);

  useEffect(() => {
    if (selectedGrade) {
      fetchTimetable();
    } else {
      setTimetable([]);
    }
  }, [selectedGrade]);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      const classesData = response.data || [];
      if (Array.isArray(classesData) && classesData.length > 0) {
        setClasses(classesData);
        if (userRole === 'teacher' && teacherAssignedGrade) {
          setSelectedGrade(teacherAssignedGrade);
        } else if (!selectedGrade) {
          setSelectedGrade(classesData[0].name);
        }
      } else {
        // Fallback default classes
        setClasses(PRESET_CLASSES.map((c, i) => ({ id: String(i + 1), name: c.name })));
      }
    } catch (error) {
      console.error('Failed to fetch classes', error);
      setClasses(PRESET_CLASSES.map((c, i) => ({ id: String(i + 1), name: c.name })));
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await apiClient.get('/admin/staff');
      setStaffList(Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeacherSubjects = async () => {
    if (!selectedGrade) return;
    try {
      const response = await apiClient.get(`/timetable/teachers/${encodeURIComponent(selectedGrade)}`);
      setTeacherSubjects(response.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isSettingsModalOpen) {
      fetchTeacherSubjects();
    }
  }, [isSettingsModalOpen, selectedGrade]);

  const handleAddTeacherSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/timetable/teachers', {
        ...newTs,
        grade: selectedGrade
      });
      setNewTs({ teacher_id: '', subject: '', weekly_periods: 5 });
      fetchTeacherSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error adding assignment");
    }
  };

  const handleDeleteTeacherSubject = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiClient.delete(`/timetable/teachers/${id}`);
      fetchTeacherSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/timetable/${encodeURIComponent(selectedGrade)}`);
      setTimetable(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch timetable', error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (!selectedGrade) {
      alert('Please select a class first');
      return;
    }
    setIsEditing(false);
    
    // Auto-calculate next period number
    const dayPeriods = timetable.filter(t => t.day_of_week === selectedDay);
    const nextPeriodNum = dayPeriods.length > 0 
      ? Math.max(...dayPeriods.map(p => p.period_number)) + 1 
      : 1;

    setFormData({
      ...emptyForm,
      period_number: String(nextPeriodNum),
      day_of_week: selectedDay,
      start_time: '09:00',
      end_time: '09:45'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setIsEditing(true);
    setFormData({
      id: entry.id,
      subject: entry.subject,
      period_number: entry.period_number.toString(),
      start_time: entry.start_time,
      end_time: entry.end_time,
      day_of_week: entry.day_of_week
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.period_number || !formData.start_time || !formData.end_time) {
      alert('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        grade: selectedGrade,
        day_of_week: isEditing ? formData.day_of_week : selectedDay,
        period_number: parseInt(formData.period_number),
        subject: formData.subject,
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      if (isEditing) {
        await apiClient.put(`/timetable/${formData.id}`, payload);
      } else {
        await apiClient.post('/timetable', payload);
      }
      setIsModalOpen(false);
      fetchTimetable();
    } catch (error: any) {
      console.error('Failed to save period', error);
      alert(error.response?.data?.error || 'Could not save period');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedGrade) {
      alert("Please select a class first");
      return;
    }

    setApplyingPreset(true);
    try {
      const isDaycare = selectedGrade.toLowerCase().includes('daycare');
      const routine = isDaycare ? PRESCHOOL_ROUTINES.daycare : PRESCHOOL_ROUTINES.nursery;
      const targetDays = presetTargetScope === 'week' ? days : [selectedDay];

      for (const day of targetDays) {
        // Find existing periods for this day and delete them to prevent duplicates
        const existing = timetable.filter(t => t.day_of_week === day);
        for (const item of existing) {
          try {
            await apiClient.delete(`/timetable/${item.id}`);
          } catch (e) {
            // continue
          }
        }

        // Insert fresh standard preschool periods
        for (const item of routine) {
          await apiClient.post('/timetable', {
            grade: selectedGrade,
            day_of_week: day,
            period_number: item.period_number,
            subject: item.subject,
            start_time: item.start_time,
            end_time: item.end_time
          });
        }
      }

      setIsPresetModalOpen(false);
      await fetchTimetable();
      alert(`Success! EduNeev Preschool routine applied for ${selectedGrade} (${presetTargetScope === 'week' ? 'All Weekdays Mon-Fri' : selectedDay})`);
    } catch (error: any) {
      console.error('Failed to apply routine template', error);
      alert(error.response?.data?.error || 'Error applying preschool routine');
    } finally {
      setApplyingPreset(false);
    }
  };

  const handleCopyFromMonday = async () => {
    const mondayPeriods = timetable.filter(t => t.day_of_week === 'Monday');
    if (mondayPeriods.length === 0) {
      alert("Monday has no periods to copy from yet! Please add periods to Monday first.");
      return;
    }

    if (!window.confirm(`Copy all ${mondayPeriods.length} periods from Monday to ${selectedDay}?`)) return;

    setLoading(true);
    try {
      // Clear existing for selectedDay
      const existing = timetable.filter(t => t.day_of_week === selectedDay);
      for (const item of existing) {
        try {
          await apiClient.delete(`/timetable/${item.id}`);
        } catch (e) {
          // continue
        }
      }

      // Re-create each
      for (const item of mondayPeriods) {
        await apiClient.post('/timetable', {
          grade: selectedGrade,
          day_of_week: selectedDay,
          period_number: item.period_number,
          subject: item.subject,
          start_time: item.start_time,
          end_time: item.end_time
        });
      }

      await fetchTimetable();
      alert(`Successfully copied schedule from Monday to ${selectedDay}!`);
    } catch (error: any) {
      console.error(error);
      alert("Could not copy periods");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedGrade) {
      alert("Please select a class first");
      return;
    }
    setGenerating(true);
    try {
      await apiClient.post('/timetable/generate', {
        target_grades: [selectedGrade]
      });
      setIsGenerateModalOpen(false);
      fetchTimetable();
      alert("Timetable generated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || "Error generating timetable. Please ensure teachers are mapped in settings first, or use 'Preschool Template'.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (entry: TimetableEntry) => {
    if (!window.confirm(`Are you sure you want to delete Period ${entry.period_number} (${entry.subject})?`)) return;
    try {
      await apiClient.delete(`/timetable/${entry.id}`);
      fetchTimetable();
    } catch (error: any) {
      console.error('Failed to delete period', error);
      alert(error.response?.data?.error || 'Could not delete period');
    }
  };

  const handlePrintTimetable = () => {
    const printContent = document.getElementById('printable-timetable-area');
    if (!printContent) return;
    const printWindow = window.open('about:blank', `Print_Timetable_${Date.now()}`, 'width=1000,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Class Timetable - ${selectedGrade} - EduNeev Kids Pre School</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #ffffff;
                color: #0F172A;
                padding: 20mm 15mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: A4 landscape;
                margin: 8mm;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              th, td {
                border: 1.5px solid #CBD5E1;
                padding: 10px 8px;
                text-align: center;
                font-size: 11px;
              }
              th {
                background-color: #F8FAFC;
                color: #1E293B;
                font-weight: 800;
                text-transform: uppercase;
              }
              .period-time {
                font-size: 10px;
                color: #64748B;
                display: block;
                margin-top: 2px;
              }
              .subject-cell {
                font-weight: 700;
                color: #0F172A;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const filteredTimetable = timetable
    .filter(t => t.day_of_week === selectedDay)
    .sort((a, b) => a.period_number - b.period_number);

  // Group timetable by day for week view
  const weeklyMatrix: Record<string, TimetableEntry[]> = {};
  days.forEach(d => {
    weeklyMatrix[d] = timetable.filter(t => t.day_of_week === d).sort((a, b) => a.period_number - b.period_number);
  });

  const allClassesList = classes.length > 0
    ? classes
    : PRESET_CLASSES.map(p => ({ id: p.name, name: p.name }));

  const allClassesMerged = (userRole === 'teacher' && teacherAssignedGrade)
    ? (allClassesList.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase()).length > 0 
        ? allClassesList.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase())
        : [{ id: teacherAssignedGrade, name: teacherAssignedGrade }])
    : allClassesList;

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* HEADER */}
        <header className="header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: 'white', 
                color: 'var(--text-main)', 
                border: '1px solid #E2E8F0', 
                padding: '0.6rem', 
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 className="welcome-text" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>Class Timetable</h1>
                <span style={{ background: '#EC4899', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {selectedGrade}
                </span>
              </div>
              <p className="date-text" style={{ margin: '0.2rem 0 0 0', color: '#64748B' }}>
                Daily activity schedule & period time slots for preschool students
              </p>

              {/* Class Teacher Badge Banner */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.65rem', 
                marginTop: '0.55rem', 
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', 
                border: '1.5px solid #86EFAC', 
                padding: '0.35rem 0.85rem', 
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <span style={{ fontSize: '1rem' }}>👩‍🏫</span>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#15803D', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                    Dedicated Class Teacher ({selectedGrade}):
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#14532D' }}>
                    {classTeachers[selectedGrade] || 'Mrs. Ananya Sharma'}
                  </span>
                </div>
                {isAdminOrSuperAdmin && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedTeacherInput(classTeachers[selectedGrade] || '');
                      setIsAssignTeacherModalOpen(true);
                    }}
                    style={{ 
                      background: 'white', 
                      border: '1px solid #86EFAC', 
                      color: '#15803D', 
                      padding: '3px 9px', 
                      borderRadius: '6px', 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      marginLeft: '0.4rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    Change Teacher
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={handlePrintTimetable}
              className="btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                background: 'white', 
                border: '1.5px solid #CBD5E1', 
                padding: '0.55rem 1rem', 
                borderRadius: '0.65rem', 
                cursor: 'pointer', 
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#334155'
              }}
              title="Print official class schedule"
            >
              <Printer size={16} color="#475569" /> Print Timetable
            </button>

            {isAdminOrSuperAdmin ? (
              <>
                <button 
                  onClick={() => setIsPresetModalOpen(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', 
                    border: '1.5px solid #C7D2FE', 
                    padding: '0.55rem 1rem', 
                    borderRadius: '0.65rem', 
                    cursor: 'pointer', 
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: '#4338CA'
                  }}
                  title="Load standard preschool schedule"
                >
                  <Sparkles size={16} color="#4F46E5" /> Preschool Template
                </button>

                <button 
                  className="btn-secondary" 
                  onClick={() => setIsSettingsModalOpen(true)} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: 'white', 
                    border: '1.5px solid #E2E8F0', 
                    padding: '0.55rem 1rem', 
                    borderRadius: '0.65rem', 
                    cursor: 'pointer', 
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#475569'
                  }}
                >
                  <Settings size={16} /> Teacher Mapping
                </button>

                <button 
                  className="btn-primary" 
                  onClick={openAddModal} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', 
                    border: 'none', 
                    color: 'white', 
                    padding: '0.55rem 1.25rem', 
                    borderRadius: '0.65rem', 
                    cursor: 'pointer', 
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 10px rgba(236, 72, 153, 0.25)' 
                  }}
                >
                  <Plus size={18} /> Add Period
                </button>
              </>
            ) : (
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 800, 
                color: '#475569', 
                background: '#F1F5F9', 
                padding: '0.5rem 0.95rem', 
                borderRadius: '0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                border: '1px solid #CBD5E1' 
              }}>
                👁️ View Only Schedule
              </span>
            )}
          </div>
        </header>

        {/* TOP INTERACTIVE CONTROL PANEL */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1.25rem', 
          border: '1.5px solid #E2E8F0', 
          padding: '1.25rem 1.5rem', 
          marginBottom: '1.75rem',
          boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)'
        }}>
          
          {/* 1. Class Selection Chips */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={15} color="#EC4899" /> {userRole === 'teacher' && teacherAssignedGrade ? 'My Assigned Class' : 'Select Class'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                Active: <strong style={{ color: '#DB2777' }}>{selectedGrade}</strong> ({timetable.length} total periods)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {allClassesMerged.map(cls => {
                const isSelected = selectedGrade === cls.name;
                const presetMeta = PRESET_CLASSES.find(p => p.name.toLowerCase() === cls.name.toLowerCase());
                const icon = presetMeta?.icon || '🎓';
                
                return (
                  <button
                    key={cls.name}
                    type="button"
                    onClick={() => setSelectedGrade(cls.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.85rem',
                      border: isSelected ? '2px solid #DB2777' : '1.5px solid #E2E8F0',
                      background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
                      color: isSelected ? '#BE185D' : '#334155',
                      fontWeight: isSelected ? 900 : 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 10px rgba(219, 39, 119, 0.15)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span>{cls.name}</span>
                    {isSelected && (
                      <span style={{ background: '#DB2777', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* 2. Day Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', marginRight: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={15} /> Day:
              </span>
              {days.map(day => {
                const count = weeklyMatrix[day]?.length || 0;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setViewMode('day');
                    }}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '2rem',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      border: isSelected && viewMode === 'day' ? '1.5px solid #F472B6' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isSelected && viewMode === 'day' ? '#FCE7F3' : '#F8FAFC',
                      color: isSelected && viewMode === 'day' ? '#BE185D' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>{day}</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '1px 6px', 
                      borderRadius: '10px', 
                      background: isSelected && viewMode === 'day' ? '#DB2777' : '#E2E8F0',
                      color: isSelected && viewMode === 'day' ? 'white' : '#64748B',
                      fontWeight: 800
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. View Mode Toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.6rem',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === 'day' ? 'white' : 'transparent',
                  color: viewMode === 'day' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <List size={15} /> Day View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.6rem',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === 'week' ? 'white' : 'transparent',
                  color: viewMode === 'week' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <LayoutGrid size={15} /> Full Week Grid
              </button>
            </div>

          </div>
        </div>

        {/* TIMETABLE CONTENT */}
        {loading ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="flex-center py-4 text-muted" style={{ fontWeight: 700, fontSize: '1rem' }}>
              Loading schedule for {selectedGrade}...
            </div>
          </div>
        ) : viewMode === 'day' ? (
          /* ───────────── DAY VIEW ───────────── */
          <div>
            {filteredTimetable.length > 0 ? (
              <div>
                {/* Stats Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem 0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                      {selectedDay}'s Daily Schedule
                    </span>
                    <span style={{ background: '#FCE7F3', color: '#BE185D', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {filteredTimetable.length} Periods Scheduled
                    </span>
                  </div>
                  
                  {isAdminOrSuperAdmin && selectedDay !== 'Monday' && weeklyMatrix['Monday']?.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyFromMonday}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        padding: '0.35rem 0.8rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={13} /> Copy from Monday
                    </button>
                  )}
                </div>

                {/* Period Cards Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredTimetable.map((entry) => {
                    const style = getActivityStyle(entry.subject);
                    return (
                      <div 
                        key={entry.id} 
                        style={{ 
                          background: 'white',
                          borderRadius: '1rem',
                          border: `1.5px solid ${style.border}`,
                          padding: '1.1rem 1.4rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1.25rem', 
                          boxShadow: '0 2px 6px -1px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.transform = 'translateY(-2px)'; 
                          e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0,0,0,0.08)'; 
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = '0 2px 6px -1px rgba(0,0,0,0.04)'; 
                        }}
                      >
                        {/* Period Number Badge */}
                        <div style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '1rem', 
                          backgroundColor: style.bg, 
                          border: `1.5px solid ${style.border}`,
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0 
                        }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PERIOD</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: style.color, lineHeight: 1 }}>{entry.period_number}</span>
                        </div>
                        
                        {/* Period Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 800, 
                              background: style.bg, 
                              color: style.color, 
                              border: `1px solid ${style.border}`,
                              padding: '2px 8px', 
                              borderRadius: '6px' 
                            }}>
                              {style.badge}
                            </span>
                          </div>

                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.subject}
                          </h3>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>
                              <Clock size={14} color="#64748B" />
                              <span>{entry.start_time} - {entry.end_time}</span>
                            </div>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                              Class: {selectedGrade}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Admin only) */}
                        {isAdminOrSuperAdmin && (
                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                            <button 
                              onClick={() => openEditModal(entry)} 
                              style={{ 
                                background: '#F1F5F9', 
                                color: '#334155', 
                                border: 'none', 
                                padding: '0.6rem', 
                                borderRadius: '0.65rem', 
                                cursor: 'pointer', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }} 
                              title="Edit Period"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(entry)} 
                              style={{ 
                                background: '#FEE2E2', 
                                color: '#DC2626', 
                                border: 'none', 
                                padding: '0.6rem', 
                                borderRadius: '0.65rem', 
                                cursor: 'pointer', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }} 
                              title="Delete Period"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ───────────── EMPTY STATE WITH FAST PRESCHOOL PRESET BUTTON ───────────── */
              <div style={{ 
                background: 'white', 
                borderRadius: '1.25rem', 
                border: '1.5px dashed #CBD5E1', 
                padding: '3.5rem 2rem', 
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: '#FDF2F8', 
                  color: '#DB2777', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.25rem auto' 
                }}>
                  <Calendar size={40} color="#DB2777" />
                </div>
                
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#0F172A' }}>
                  No Periods Scheduled for {selectedDay}
                </h3>
                <p style={{ margin: '0 auto 1.75rem auto', maxWidth: '480px', color: '#64748B', fontSize: '0.92rem', lineHeight: '1.5' }}>
                  There are no periods configured for <strong>{selectedDay}</strong> in <strong>{selectedGrade}</strong>.
                </p>

                {isAdminOrSuperAdmin ? (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        setPresetTargetScope('day');
                        setIsPresetModalOpen(true);
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.75rem 1.4rem', 
                        borderRadius: '0.75rem', 
                        fontWeight: 800, 
                        fontSize: '0.92rem', 
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(219, 39, 119, 0.3)'
                      }}
                    >
                      <Sparkles size={18} /> ⚡ Load Preschool Routine ({selectedDay})
                    </button>

                    {selectedDay !== 'Monday' && weeklyMatrix['Monday']?.length > 0 && (
                      <button 
                        type="button"
                        onClick={handleCopyFromMonday}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          background: '#F8FAFC', 
                          color: '#334155', 
                          border: '1.5px solid #CBD5E1', 
                          padding: '0.75rem 1.4rem', 
                          borderRadius: '0.75rem', 
                          fontWeight: 800, 
                          fontSize: '0.92rem', 
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={16} /> Copy from Monday
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={openAddModal}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        background: 'white', 
                        color: '#475569', 
                        border: '1.5px solid #E2E8F0', 
                        padding: '0.75rem 1.4rem', 
                        borderRadius: '0.75rem', 
                        fontWeight: 700, 
                        fontSize: '0.92rem', 
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={18} /> Add Custom Period
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: '1rem 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 700 }}>
                    Official timetable for {selectedGrade} is published and maintained by the School Administration.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ───────────── FULL WEEK GRID VIEW ───────────── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
            {days.map(day => {
              const dayList = weeklyMatrix[day] || [];
              const isSelectedDay = selectedDay === day;
              
              return (
                <div 
                  key={day}
                  style={{
                    background: 'white',
                    borderRadius: '1rem',
                    border: isSelectedDay ? '2px solid #F472B6' : '1.5px solid #E2E8F0',
                    boxShadow: isSelectedDay ? '0 4px 12px rgba(236, 72, 153, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: isSelectedDay ? '#FCE7F3' : '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: isSelectedDay ? '#BE185D' : '#1E293B' }}>
                        {day}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                        {dayList.length} Periods
                      </span>
                    </div>

                    {isAdminOrSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          openAddModal();
                        }}
                        style={{
                          background: 'white',
                          border: '1px solid #CBD5E1',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={`Add period to ${day}`}
                      >
                        <Plus size={14} color="#475569" />
                      </button>
                    )}
                  </div>

                  {/* Column Periods */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '180px' }}>
                    {dayList.length > 0 ? (
                      dayList.map(p => {
                        const style = getActivityStyle(p.subject);
                        return (
                          <div
                            key={p.id}
                            style={{
                              background: style.bg,
                              border: `1px solid ${style.border}`,
                              borderRadius: '0.65rem',
                              padding: '0.6rem 0.75rem',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: style.color, background: 'rgba(255,255,255,0.7)', padding: '1px 5px', borderRadius: '4px' }}>
                                #{p.period_number}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                                {p.start_time} - {p.end_time}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.subject}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                        No periods
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ───────────── HIDDEN PRINTABLE TIMETABLE TEMPLATE ───────────── */}
        <div id="printable-timetable-area" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #0F172A', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', color: '#0F172A', margin: 0 }}>
              EduNeev Kids Pre School
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', fontWeight: 600 }}>
              Affiliated & Managed by EduNeev Educational Group • Pune, Maharashtra
            </p>
            <div style={{ marginTop: '10px', display: 'inline-block', background: '#F1F5F9', padding: '4px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              OFFICIAL CLASS TIMETABLE — {selectedGrade?.toUpperCase()} (ACADEMIC YEAR 2025-26)
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '8%' }}>Period</th>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '16%' }}>Monday</th>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '16%' }}>Tuesday</th>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '16%' }}>Wednesday</th>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '16%' }}>Thursday</th>
                <th style={{ border: '1.5px solid #0F172A', padding: '8px', width: '16%' }}>Friday</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(num => {
                return (
                  <tr key={num}>
                    <td style={{ border: '1.5px solid #0F172A', padding: '8px', textAlign: 'center', fontWeight: 900, background: '#F8FAFC' }}>
                      Period {num}
                    </td>
                    {days.map(d => {
                      const item = weeklyMatrix[d]?.find(p => p.period_number === num);
                      return (
                        <td key={d} style={{ border: '1.5px solid #0F172A', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {item ? (
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '11px', color: '#0F172A' }}>{item.subject}</div>
                              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>{item.start_time} - {item.end_time}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '10px' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #0F172A', width: '180px', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '11px', fontWeight: 700 }}>Class Teacher Signature</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #0F172A', width: '180px', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '11px', fontWeight: 700 }}>School Stamp & Date</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #0F172A', width: '180px', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '11px', fontWeight: 700 }}>Principal / Center Head</p>
            </div>
          </div>
        </div>

        {/* ───────────── LOAD PRESET MODAL ───────────── */}
        {isPresetModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px', width: '95%', padding: '0', overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#9D174D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900 }}>
                    <Sparkles size={20} color="#DB2777" /> Load EduNeev Preschool Routine
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#831843' }}>
                    Instant prefill for <strong>{selectedGrade}</strong> based on EduNeev curriculum standards
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsPresetModalOpen(false)} style={{ background: 'white' }}>
                  <X size={18} color="#831843" />
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                    Choose Target Scope:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setPresetTargetScope('week')}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '0.75rem',
                        border: presetTargetScope === 'week' ? '2px solid #DB2777' : '1.5px solid #CBD5E1',
                        background: presetTargetScope === 'week' ? '#FDF2F8' : 'white',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 900, color: presetTargetScope === 'week' ? '#BE185D' : '#1E293B', fontSize: '0.9rem' }}>
                        🗓️ Entire Week (Mon-Fri)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Applies routine to all 5 weekdays
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetTargetScope('day')}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '0.75rem',
                        border: presetTargetScope === 'day' ? '2px solid #DB2777' : '1.5px solid #CBD5E1',
                        background: presetTargetScope === 'day' ? '#FDF2F8' : 'white',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 900, color: presetTargetScope === 'day' ? '#BE185D' : '#1E293B', fontSize: '0.9rem' }}>
                        📅 {selectedDay} Only
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Applies to selected day only
                      </div>
                    </button>
                  </div>
                </div>

                {/* Routine Preview List */}
                <div style={{ background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Routine Preview (6 Standard Periods):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                    {(selectedGrade.toLowerCase().includes('daycare') ? PRESCHOOL_ROUTINES.daycare : PRESCHOOL_ROUTINES.nursery).map(p => (
                      <div key={p.period_number} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', background: 'white', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{p.subject}</span>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>{p.start_time} - {p.end_time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsPresetModalOpen(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '0.65rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={applyingPreset}
                    onClick={handleApplyPreset}
                    style={{ 
                      background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '0.6rem 1.4rem', 
                      borderRadius: '0.65rem', 
                      fontWeight: 800,
                      cursor: 'pointer' 
                    }}
                  >
                    {applyingPreset ? 'Applying Routine...' : 'Confirm & Apply Schedule'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── ADD / EDIT PERIOD MODAL ───────────── */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px', width: '95%', padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0, fontWeight: 900 }}>
                    {isEditing ? 'Edit Period' : 'Add Period'}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    {selectedGrade} • {isEditing ? formData.day_of_week : selectedDay}
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  
                  {/* Subject Input with Quick suggestions */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>
                      Subject / Activity Name <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      name="subject"
                      className="input-field" 
                      placeholder="e.g. 🎨 Drawing & Coloring, 🔤 Phonics" 
                      value={formData.subject} 
                      onChange={handleInputChange} 
                      required 
                      style={{ background: '#F8FAFC', fontWeight: 700, marginBottom: '0.5rem' }}
                    />

                    {/* Quick Activity Chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="no-scrollbar">
                      {QUICK_SUBJECT_SUGGESTIONS.slice(0, 6).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, subject: s }))}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>
                      Period Number <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      type="number" 
                      name="period_number"
                      className="input-field" 
                      placeholder="e.g. 1, 2, 3" 
                      value={formData.period_number} 
                      onChange={handleInputChange} 
                      required
                      min="1"
                      style={{ background: '#F8FAFC', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>
                      Day of Week
                    </label>
                    <select
                      name="day_of_week"
                      className="input-field"
                      value={isEditing ? formData.day_of_week : selectedDay}
                      onChange={handleInputChange}
                      style={{ background: '#F8FAFC', fontWeight: 700 }}
                    >
                      {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>
                      Start Time <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      type="time" 
                      name="start_time"
                      className="input-field" 
                      value={formData.start_time} 
                      onChange={handleInputChange} 
                      required 
                      style={{ background: '#F8FAFC', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem' }}>
                      End Time <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      type="time" 
                      name="end_time"
                      className="input-field" 
                      value={formData.end_time} 
                      onChange={handleInputChange} 
                      required 
                      style={{ background: '#F8FAFC', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '0.65rem' }}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary" 
                    style={{ 
                      background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', 
                      border: 'none', 
                      borderRadius: '0.65rem',
                      fontWeight: 800 
                    }}
                  >
                    {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Period')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────── TEACHER SETTINGS MODAL ───────────── */}
        {isSettingsModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px', width: '95%', padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0, fontWeight: 900 }}>Teacher Mapping for {selectedGrade}</h2>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Assign staff teachers to subjects in <strong>{selectedGrade}</strong> for schedule generation.
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>
              
              <div style={{ padding: '1.5rem 1.75rem' }}>
                <form onSubmit={handleAddTeacherSubject} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Select Teacher</label>
                    <select className="input-field" value={newTs.teacher_id} onChange={e => setNewTs({...newTs, teacher_id: e.target.value})} required style={{ background: '#F8FAFC', fontWeight: 600 }}>
                      <option value="">-- Choose Teacher --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.user?.first_name || s.first_name} {s.user?.last_name || s.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Subject / Activity</label>
                    <input type="text" className="input-field" value={newTs.subject} onChange={e => setNewTs({...newTs, subject: e.target.value})} placeholder="e.g. Rhymes, Art" required style={{ background: '#F8FAFC' }} />
                  </div>
                  <div style={{ width: '85px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Periods/Wk</label>
                    <input type="number" className="input-field" value={newTs.weekly_periods} onChange={e => setNewTs({...newTs, weekly_periods: parseInt(e.target.value) || 5})} min="1" required style={{ background: '#F8FAFC' }} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ background: '#3B82F6', border: 'none', height: '40px', borderRadius: '0.5rem', fontWeight: 800 }}>
                    Add
                  </button>
                </form>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>Teacher</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>Subject</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>Periods/Wk</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherSubjects.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No teachers mapped for {selectedGrade} yet.</td></tr>
                      ) : teacherSubjects.map(ts => (
                        <tr key={ts.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.88rem', fontWeight: 700 }}>{ts.first_name} {ts.last_name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.88rem' }}>{ts.subject}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.88rem', textAlign: 'center', fontWeight: 800 }}>{ts.weekly_periods}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteTeacherSubject(ts.id)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}>
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── AUTO-GENERATE MODAL ───────────── */}
        {isGenerateModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '420px', width: '95%', padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FCE7F3', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Calendar size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '0.5rem', fontWeight: 900 }}>Auto-Generate Timetable</h2>
              <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
                This will reset the schedule for <strong>{selectedGrade}</strong> and assign periods based on teacher workload settings. Continue?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsGenerateModalOpen(false)} style={{ borderRadius: '0.65rem' }}>Cancel</button>
                <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary" style={{ background: '#DB2777', border: 'none', borderRadius: '0.65rem' }}>
                  {generating ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── ASSIGN CLASS TEACHER MODAL ───────────── */}
        {isAssignTeacherModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '460px', width: '95%', padding: '0', overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: '#14532D', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👩‍🏫 Assign Class Teacher for {selectedGrade}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#15803D' }}>
                    Dedicated educator managing all daily activity periods for <strong>{selectedGrade}</strong>
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsAssignTeacherModalOpen(false)} style={{ background: 'white', border: '1px solid #86EFAC' }}>
                  <X size={18} color="#15803D" />
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Select Class Teacher from Staff List:
                  </label>
                  <select 
                    className="input-field" 
                    value={selectedTeacherInput}
                    onChange={(e) => setSelectedTeacherInput(e.target.value)}
                    style={{ background: '#F8FAFC', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <option value="">-- Choose Staff Teacher --</option>
                    {staffList.map((s: any) => {
                      const name = `${s.user?.first_name || s.first_name || ''} ${s.user?.last_name || s.last_name || ''}`.trim();
                      return (
                        <option key={s.id || name} value={name || 'Teacher'}>
                          {name || 'Teacher'} ({s.role || s.user?.role || 'Staff Teacher'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Or Enter Custom Teacher Name / Title:
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Mrs. Ananya Sharma"
                    value={selectedTeacherInput}
                    onChange={(e) => setSelectedTeacherInput(e.target.value)}
                    style={{ background: '#F8FAFC', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsAssignTeacherModalOpen(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '0.65rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => handleSaveClassTeacher(selectedTeacherInput || 'Class Teacher')}
                    style={{ background: '#22C55E', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.65rem', fontWeight: 800 }}
                  >
                    Save Class Teacher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default TimetableManagement;
