import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Plus, Search, ArrowLeft, X, Trash2, Check, User, GraduationCap } from 'lucide-react';
import './Directory.css';

interface StudentNote {
  id: string;
  student_id: string;
  student_name: string;
  student_grade?: string;
  teacher_name: string;
  note_type: string;
  content: string;
  is_visible_to_parent: boolean;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  class_name?: string;
  roll_number?: string;
  admission_number?: string;
}

const StudentNotesManagement: React.FC = () => {
  const navigate = useNavigate();

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isParent = userRole === 'parent';
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'super_admin' || userRole === 'school_admin' || userRole === 'owner';

  const canCreateNote = isAdmin || isTeacher;
  const canDeleteNote = isAdmin || isTeacher;

  // Dedicated Teacher Assigned Grade Resolution
  const teacherAssignedGrade = loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.class || loggedUser?.class_name || loggedUser?.department || '';

  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id?: string; name: string }[]>([
    { name: 'Playgroup' },
    { name: 'Nursery' },
    { name: 'Jr KG' },
    { name: 'Sr KG' },
    { name: 'Daycare' }
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filter States - Default to teacher's assigned grade if logged in as teacher
  const [selectedClassFilter, setSelectedClassFilter] = useState(() => {
    if (isTeacher && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'ALL';
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSelectedClass, setModalSelectedClass] = useState(() => {
    if (isTeacher && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'ALL';
  });
  const [formData, setFormData] = useState({
    studentId: '',
    noteType: 'General',
    content: '',
    isVisibleToParent: true
  });

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get('/notes');
      setNotes(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch notes', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        apiClient.get('/admin/students').catch(() => ({ data: [] })),
        apiClient.get('/classes').catch(() => ({ data: [] }))
      ]);

      setStudents(studentsRes.data?.data || studentsRes.data || []);
      const fetchedClasses = classesRes.data || [];
      if (Array.isArray(fetchedClasses) && fetchedClasses.length > 0) {
        if (isTeacher && teacherAssignedGrade) {
          setAvailableClasses([{ name: teacherAssignedGrade }]);
          setSelectedClassFilter(teacherAssignedGrade);
          setModalSelectedClass(teacherAssignedGrade);
        } else {
          setAvailableClasses(fetchedClasses);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students & classes', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchInitialData();
    if (isTeacher && teacherAssignedGrade) {
      setSelectedClassFilter(teacherAssignedGrade);
      setModalSelectedClass(teacherAssignedGrade);
    }
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleModalClassChange = (newClass: string) => {
    setModalSelectedClass(newClass);
    // Reset or auto-select student from this class
    const classStudents = students.filter(s => matchesClass(s, newClass));
    if (classStudents.length > 0) {
      setFormData(prev => ({ ...prev, studentId: classStudents[0].id }));
    } else {
      setFormData(prev => ({ ...prev, studentId: '' }));
    }
  };

  const openAddModal = () => {
    setModalSelectedClass('ALL');
    setFormData({
      studentId: students.length > 0 ? students[0].id : '',
      noteType: 'General',
      content: '',
      isVisibleToParent: true
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.content) {
      alert('Please select a student and write a note');
      return;
    }
    try {
      await apiClient.post('/notes', {
        student_id: formData.studentId,
        note_type: formData.noteType,
        content: formData.content,
        is_visible_to_parent: formData.isVisibleToParent
      });
      setIsAddModalOpen(false);
      setFormData({ studentId: '', noteType: 'General', content: '', isVisibleToParent: true });
      fetchNotes();
      alert('Note saved successfully! ✅');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  // Filter students for modal dropdown based on modalSelectedClass
  const modalFilteredStudents = students.filter(s => matchesClass(s, modalSelectedClass));

  // Filter notes on main page based on search and selectedClassFilter
  const filteredNotes = notes
    .filter(note => {
      if (selectedClassFilter === 'ALL') return true;
      const grade = (note.student_grade || '').toLowerCase();
      const target = selectedClassFilter.toLowerCase();
      if (grade === target) return true;
      if (target === 'jr kg' && (grade.includes('jr') || grade.includes('junior') || grade === 'lkg')) return true;
      if (target === 'sr kg' && (grade.includes('sr') || grade.includes('senior') || grade === 'ukg')) return true;
      if (target === 'playgroup' && grade.includes('play')) return true;
      if (target === 'nursery' && grade.includes('nursery')) return true;
      return grade.includes(target);
    })
    .filter(note => 
      `${note.student_name} ${note.note_type} ${note.content} ${note.student_grade || ''}`.toLowerCase().includes(search.toLowerCase())
    );

  const getClassBadgeStyle = (gradeStr?: string) => {
    const g = (gradeStr || '').toLowerCase();
    if (g.includes('play')) return { bg: '#FCE7F3', text: '#BE185D' };
    if (g.includes('nursery')) return { bg: '#FEF3C7', text: '#B45309' };
    if (g.includes('jr')) return { bg: '#EFF6FF', text: '#1D4ED8' };
    if (g.includes('sr')) return { bg: '#ECFDF5', text: '#047857' };
    return { bg: '#F1F5F9', text: '#475569' };
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Student Notes</h1>
              <p className="date-text">{isParent ? 'View teacher remarks and progress logs for your child' : 'Track behavior, progress, and daily remarks class-wise'}</p>
            </div>
          </div>
          {canCreateNote && (
            <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={20} /> Add Student Note
            </button>
          )}
        </header>

        {/* Filters Bar: Search & Class Pills */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div className="search-box" style={{ flex: '1', minWidth: '240px' }}>
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search notes by student name, remark or class..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Class Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569', marginRight: '0.3rem', whiteSpace: 'nowrap' }}>
                {isTeacher && teacherAssignedGrade ? 'My Class:' : 'Filter Class:'}
              </span>
              
              {(!isTeacher || !teacherAssignedGrade) && (
                <button
                  type="button"
                  onClick={() => setSelectedClassFilter('ALL')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    background: selectedClassFilter === 'ALL' ? '#4F46E5' : '#E2E8F0',
                    color: selectedClassFilter === 'ALL' ? 'white' : '#475569'
                  }}
                >
                  All Classes
                </button>
              )}

              {((isTeacher && teacherAssignedGrade)
                ? (availableClasses.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase()).length > 0
                    ? availableClasses.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase())
                    : [{ name: teacherAssignedGrade }])
                : availableClasses
              ).map(cls => {
                const isSel = selectedClassFilter === cls.name;
                const count = getStudentCountForClass(cls.name);
                return (
                  <button
                    key={cls.name}
                    type="button"
                    onClick={() => setSelectedClassFilter(cls.name)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '1rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      border: isSel ? 'none' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      background: isSel ? '#4F46E5' : 'white',
                      color: isSel ? 'white' : '#334155',
                      boxShadow: isSel ? '0 2px 4px rgba(79, 70, 229, 0.25)' : 'none'
                    }}
                  >
                    {cls.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notes Cards Grid */}
        <div className="glass-card table-container">
          {loading ? (
            <div className="flex-center py-8">Loading notes...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', padding: '1rem' }}>
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  const badge = getClassBadgeStyle(note.student_grade);
                  return (
                    <div key={note.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 900, fontSize: '1.1rem' }}>
                            <User size={20} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 800 }}>{note.student_name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                              {note.student_grade && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: badge.bg, color: badge.text }}>
                                  🎓 {note.student_grade}
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {canDeleteNote && (
                          <button onClick={() => handleDelete(note.id)} className="icon-btn" style={{ color: 'var(--main-red)', background: '#FEE2E2', border: '1px solid #FECACA' }} title="Delete Note">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', backgroundColor: note.note_type === 'Behavior' ? '#fef3c7' : note.note_type === 'Academic' ? '#e0e7ff' : note.note_type === 'Health' ? '#fee2e2' : '#f3f4f6', color: note.note_type === 'Behavior' ? '#d97706' : note.note_type === 'Academic' ? '#4f46e5' : note.note_type === 'Health' ? '#ef4444' : '#4b5563', fontWeight: 800 }}>
                        {note.note_type}
                      </div>

                      <p style={{ margin: 0, color: '#334155', lineHeight: '1.5', fontSize: '0.92rem' }}>
                        {note.content}
                      </p>

                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Teacher: <strong>{note.teacher_name || 'Admin'}</strong></span>
                        {note.is_visible_to_parent && (
                           <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--main-green)', fontWeight: 700 }}><Check size={14} /> Visible to Parents</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted" style={{ gridColumn: '1 / -1', padding: '3rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
                  <h4 style={{ margin: 0, color: '#475569', fontWeight: 800 }}>No student notes found</h4>
                  <p style={{ margin: '0.3rem 0 1rem 0', fontSize: '0.85rem' }}>
                    {selectedClassFilter === 'ALL' 
                      ? 'No notes match your search query.' 
                      : `No notes registered for ${selectedClassFilter} students yet.`}
                  </p>
                  {canCreateNote && (
                    <button className="btn-primary" onClick={openAddModal} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      + Add First Note
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ADD STUDENT NOTE MODAL (WITH CLASS-WISE STUDENT SELECTION) */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px', width: '95%' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Add Student Note</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Select Class first, then choose student to log remarks
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form" style={{ marginTop: '0.75rem' }}>
                
                {/* 1. CLASS SELECTION */}
                <div className="form-group" style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.85rem', border: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, textTransform: 'uppercase' }}>
                      <GraduationCap size={18} color="#4F46E5" /> 1. Select Class *
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '10px' }}>
                      {modalFilteredStudents.length} Students
                    </span>
                  </div>

                  {/* Class Dropdown */}
                  <select 
                    className="input-field" 
                    value={modalSelectedClass} 
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem', background: 'white' }}
                  >
                    <option value="ALL">🏫 All Classes ({students.length} Students)</option>
                    {availableClasses.map(cls => (
                      <option key={cls.name} value={cls.name}>
                        🎓 {cls.name} ({getStudentCountForClass(cls.name)} Students)
                      </option>
                    ))}
                  </select>

                  {/* Quick Class Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingTop: '0.2rem' }} className="no-scrollbar">
                    {(!isTeacher || !teacherAssignedGrade) && (
                      <button
                        type="button"
                        onClick={() => handleModalClassChange('ALL')}
                        style={{
                          padding: '0.3rem 0.7rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: modalSelectedClass === 'ALL' ? '#4F46E5' : '#E2E8F0',
                          color: modalSelectedClass === 'ALL' ? 'white' : '#475569'
                        }}
                      >
                        All ({students.length})
                      </button>
                    )}
                    {((isTeacher && teacherAssignedGrade)
                      ? (availableClasses.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase()).length > 0
                          ? availableClasses.filter(c => c.name.toLowerCase() === teacherAssignedGrade.toLowerCase())
                          : [{ name: teacherAssignedGrade }])
                      : availableClasses
                    ).map(cls => {
                      const isSel = modalSelectedClass === cls.name;
                      const count = getStudentCountForClass(cls.name);
                      return (
                        <button
                          key={cls.name}
                          type="button"
                          onClick={() => handleModalClassChange(cls.name)}
                          style={{
                            padding: '0.3rem 0.7rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
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

                {/* 2. STUDENT SELECTION (FILTERED BY CLASS) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} color="#4F46E5" /> 2. Select Student *
                  </label>
                  <select 
                    name="studentId" 
                    className="input-field" 
                    value={formData.studentId} 
                    onChange={handleInputChange} 
                    required
                    style={{ fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    {modalFilteredStudents.length === 0 ? (
                      <option value="">No students in {modalSelectedClass} class</option>
                    ) : (
                      <>
                        <option value="">-- Choose Student from {modalSelectedClass === 'ALL' ? 'School' : modalSelectedClass} --</option>
                        {modalFilteredStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            👤 {s.first_name} {s.last_name} ({s.class_name || s.grade || 'Student'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {modalFilteredStudents.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.2rem' }}>
                      ⚠️ No students available in this class. Please select another class from above.
                    </span>
                  )}
                </div>

                {/* Note Type */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>Note Type</label>
                  <select name="noteType" className="input-field" value={formData.noteType} onChange={handleInputChange} required style={{ fontWeight: 700 }}>
                    <option value="General">General Remark 📝</option>
                    <option value="Academic">Academic Performance 📚</option>
                    <option value="Behavior">Behavior & Conduct 🌟</option>
                    <option value="Health">Health & Wellness 🩺</option>
                  </select>
                </div>

                {/* Note Content */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>Note Content *</label>
                  <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                    rows={4} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem' }} 
                    placeholder="Write student feedback, food/nap notes, or daily remarks here..." 
                    required
                  ></textarea>
                </div>
                
                {/* Visibility to Parents Checkbox */}
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <input type="checkbox" id="isVisibleToParent" name="isVisibleToParent" checked={formData.isVisibleToParent} onChange={handleInputChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                  <label htmlFor="isVisibleToParent" style={{ margin: 0, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#1E293B' }}>
                    Make this note visible to parents in their app
                  </label>
                </div>
                
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={!formData.studentId} className="btn-primary" style={{ background: '#4F46E5' }}>Save Note ✅</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentNotesManagement;
