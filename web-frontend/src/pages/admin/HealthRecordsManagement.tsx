import React, { useState, useEffect } from 'react';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import { Search, HeartPulse, Edit2, X, Activity, Droplet, Scale, Ruler, AlertCircle, Calendar, Trash2, GraduationCap, Users } from 'lucide-react';
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

interface HealthData {
  id?: string;
  blood_group?: string;
  height?: string;
  weight?: string;
  allergies?: string;
  last_checkup_date?: string;
}

const HealthRecordsManagement: React.FC = () => {
  // Left Panel Data
  const [students, setStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id?: string; name: string }[]>([
    { name: 'Playgroup' },
    { name: 'Nursery' },
    { name: 'Jr KG' },
    { name: 'Sr KG' },
    { name: 'Daycare' }
  ]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Right Panel Data
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<HealthData>({
    blood_group: '',
    height: '',
    weight: '',
    allergies: '',
    last_checkup_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

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

      // Auto-select first student if available
      if (fetchedStudents.length > 0) {
        handleSelectStudent(fetchedStudents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch health dashboard data', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setHealthData(null);
    setLoadingHealth(true);

    try {
      const response = await apiClient.get(`/health/${student.id}`);
      if (response.data?.data) {
        setHealthData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch health data', error);
    } finally {
      setLoadingHealth(false);
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
      setHealthData(null);
    }
  };

  const openEditModal = () => {
    if (healthData) {
      setFormData({
        blood_group: healthData.blood_group || '',
        height: healthData.height || '',
        weight: healthData.weight || '',
        allergies: healthData.allergies || '',
        last_checkup_date: healthData.last_checkup_date ? new Date(healthData.last_checkup_date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({ blood_group: '', height: '', weight: '', allergies: '', last_checkup_date: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSaving(true);
    try {
      await apiClient.post(`/health/${selectedStudent.id}`, formData);
      setIsModalOpen(false);
      handleSelectStudent(selectedStudent);
    } catch (error: any) {
      console.error('Failed to save health record', error);
      alert(error.response?.data?.error || 'Could not save health record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Are you sure you want to delete the health record for ${selectedStudent.first_name}?`)) return;
    
    try {
      await apiClient.delete(`/health/${selectedStudent.id}`);
      handleSelectStudent(selectedStudent);
    } catch (error: any) {
      console.error('Failed to delete health record', error);
      alert(error.response?.data?.error || 'Could not delete health record');
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

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        
        <header style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <h1 className="welcome-text" style={{ color: '#166534' }}>Health Records</h1>
          <p className="date-text">Track and manage student medical information class-wise</p>
        </header>

        <div style={{ display: 'flex', flex: 1, background: 'white', borderRadius: '1rem', border: '1px solid #DCFCE7', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          {/* Left Panel: Class Selection & Student List */}
          <div style={{ width: '380px', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
            
            {/* 1. Class Selection Section */}
            <div style={{ padding: '1.25rem 1.25rem 0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                  <GraduationCap size={16} color="#16A34A" /> 1. Select Class
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
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
                    transition: 'all 0.2s',
                    background: selectedClass === 'ALL' ? '#16A34A' : '#E2E8F0',
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
                        transition: 'all 0.2s',
                        background: isSel ? '#16A34A' : 'white',
                        color: isSel ? 'white' : '#334155',
                        boxShadow: isSel ? '0 2px 4px rgba(22, 163, 74, 0.25)' : 'none'
                      }}
                    >
                      {cls.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Students in Selected Class Header */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} color="#64748B" /> 2. Students in {selectedClass === 'ALL' ? 'All Classes' : selectedClass}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '1px 8px', borderRadius: '10px' }}>
                {filteredStudents.length} Found
              </span>
            </div>

            {/* Search Input */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder={`Search students in ${selectedClass === 'ALL' ? 'school' : selectedClass}...`} 
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
                        padding: '1rem 1.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.9rem', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelected ? 'white' : 'transparent',
                        borderLeft: isSelected ? '4px solid #16A34A' : '4px solid transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: isSelected ? '2px solid #16A34A' : 'none' }}>
                        {student.profile_image_url ? (
                          <img src={student.profile_image_url} alt={student.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#16A34A' }}>{student.first_name[0]}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.first_name} {student.last_name}
                          </h3>
                          <span style={{ 
                            fontSize: '0.68rem', 
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
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          {student.admission_number ? `Adm: ${student.admission_number}` : (student.roll_number ? `Roll: #${student.roll_number}` : 'Active Student')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#475569', fontSize: '0.95rem' }}>
                    {selectedClass === 'ALL' 
                      ? 'No students found' 
                      : `No students available in ${selectedClass}`}
                  </h4>
                  <p style={{ margin: '0.3rem 0 1rem 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                    {selectedClass === 'ALL' 
                      ? 'Try adjusting your search criteria.' 
                      : `Currently no active students enrolled in ${selectedClass}.`}
                  </p>
                  {selectedClass !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => handleClassChange('ALL')}
                      style={{ background: '#16A34A', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Show All Classes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Health Profile */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F0FDF4', overflowY: 'auto' }}>
            {selectedStudent ? (
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {selectedStudent.profile_image_url ? (
                        <img src={selectedStudent.profile_image_url} alt={selectedStudent.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16A34A' }}>{selectedStudent.first_name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </h2>
                        <span style={{ 
                          background: '#DCFCE7', 
                          color: '#15803D', 
                          padding: '3px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.82rem', 
                          fontWeight: 800,
                          border: '1px solid #BBF7D0'
                        }}>
                          🎓 Class: {selectedStudent.class_name || selectedStudent.grade || 'Preschool'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
                        Medical Profile {selectedStudent.admission_number ? `• Admission ID: ${selectedStudent.admission_number}` : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {healthData && (
                      <button onClick={handleDelete} className="icon-btn" style={{ background: '#FEE2E2', border: '1px solid #FECACA', padding: '0.6rem' }} title="Clear Record">
                        <Trash2 size={16} color="#DC2626" />
                      </button>
                    )}
                    <button onClick={openEditModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22C55E', border: 'none' }}>
                      <Edit2 size={16} /> Update Record
                    </button>
                  </div>
                </div>

                {loadingHealth ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#16A34A', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Activity size={48} color="#86EFAC" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600 }}>Loading health data...</p>
                  </div>
                ) : !healthData ? (
                  <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #86EFAC' }}>
                    <HeartPulse size={64} color="#BBF7D0" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1.25rem' }}>No medical records found</h3>
                    <p style={{ margin: 0, color: '#15803D' }}>Click 'Update Record' to add health information for {selectedStudent.first_name}.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                      
                      {/* Blood Group */}
                      <div style={{ backgroundColor: '#FEF2F2', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Droplet size={28} color="#EF4444" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#991B1B' }}>Blood Group</p>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#7F1D1D' }}>{healthData.blood_group || 'Not provided'}</h3>
                        </div>
                      </div>

                      {/* Height */}
                      <div style={{ backgroundColor: '#EFF6FF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ruler size={28} color="#3B82F6" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#1E3A8A' }}>Height</p>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1E3A8A' }}>{healthData.height ? `${healthData.height} cm` : 'Not provided'}</h3>
                        </div>
                      </div>

                      {/* Weight */}
                      <div style={{ backgroundColor: '#FAF5FF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #F3E8FF', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Scale size={28} color="#A855F7" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#581C87' }}>Weight</p>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#581C87' }}>{healthData.weight ? `${healthData.weight} kg` : 'Not provided'}</h3>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div style={{ backgroundColor: '#FFF7ED', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AlertCircle size={28} color="#F97316" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#9A3412' }}>Allergies</p>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#9A3412' }}>{healthData.allergies || 'None reported'}</h3>
                        </div>
                      </div>

                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Calendar size={24} color="#64748B" />
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#64748B' }}>Last Checkup Date</p>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                          {healthData.last_checkup_date ? new Date(healthData.last_checkup_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never'}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', padding: '2rem', textAlign: 'center' }}>
                <HeartPulse size={72} color="#DCFCE7" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontWeight: 800, fontSize: '1.25rem' }}>
                  Student Medical Records
                </h3>
                <p style={{ margin: 0, maxWidth: '420px', color: '#15803D', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {selectedClass === 'ALL'
                    ? 'Select a class or click on a student to view their health & medical profile.'
                    : `Click on any student in ${selectedClass} from the list to view profile.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Update Modal */}
        {isModalOpen && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #DCFCE7', background: '#F0FDF4' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HeartPulse size={20} /> Update Health Record
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#15803D' }}>For {selectedStudent.first_name} {selectedStudent.last_name}</p>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #DCFCE7' }}>
                  <X size={20} color="#16A34A" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Blood Group</label>
                    <select 
                      className="input-field" 
                      value={formData.blood_group} 
                      onChange={(e) => setFormData({...formData, blood_group: e.target.value})}
                      style={{ background: '#F8FAFC' }}
                    >
                      <option value="">-- Select --</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Last Checkup Date</label>
                    <input 
                      type="date"
                      className="input-field" 
                      value={formData.last_checkup_date} 
                      onChange={(e) => setFormData({...formData, last_checkup_date: e.target.value})}
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Height (cm)</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="input-field" 
                      placeholder="E.g. 110" 
                      value={formData.height} 
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Weight (kg)</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="input-field" 
                      placeholder="E.g. 20.5" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#4B5563' }}>Allergies / Medical Notes</label>
                    <textarea 
                      className="input-field" 
                      placeholder="E.g. Peanuts, Dust..." 
                      value={formData.allergies} 
                      onChange={(e) => setFormData({...formData, allergies: e.target.value})} 
                      rows={3}
                      style={{ background: '#F8FAFC', resize: 'vertical' }}
                    />
                  </div>

                </div>

                <div className="modal-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#22C55E', border: 'none', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.3)' }}>
                    {saving ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default HealthRecordsManagement;
