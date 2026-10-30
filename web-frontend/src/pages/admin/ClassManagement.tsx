import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Plus, ArrowLeft, School, GraduationCap, Edit2, Trash2, X, Users } from 'lucide-react';
import './Directory.css';

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_teacher_id?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
}

interface TeacherData {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  class_name: string;
  profile_image_url?: string;
}

const ClassManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Data States
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [classStudents, setClassStudents] = useState<StudentData[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const emptyForm = { id: '', name: '', description: '', class_teacher_id: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.name);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/classes');
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/admin/staff');
      const teacherList = (response.data || []).filter((s: any) => s.role === 'teacher' && s.is_active);
      setTeachers(teacherList);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    }
  };

  const fetchClassStudents = async (className: string) => {
    setStudentsLoading(true);
    try {
      const response = await apiClient.get('/admin/students');
      const allStudents = response.data.data || response.data || [];
      const filtered = allStudents.filter((s: any) => 
        s.grade === className || s.class_name === className
      );
      setClassStudents(filtered);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassData) => {
    setIsEditing(true);
    setFormData({
      id: cls.id,
      name: cls.name,
      description: cls.description || '',
      class_teacher_id: cls.class_teacher_id || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Class name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        class_teacher_id: formData.class_teacher_id || null
      };

      if (isEditing) {
        await apiClient.put(`/classes/${formData.id}`, payload);
      } else {
        await apiClient.post('/classes', payload);
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      console.error('Failed to save class', error);
      alert(error.response?.data?.error || 'Could not save class');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls: ClassData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening class view
    if (!window.confirm(`Are you sure you want to delete ${cls.name}?`)) return;
    try {
      await apiClient.delete(`/classes/${cls.id}`);
      fetchClasses();
    } catch (error: any) {
      console.error('Failed to delete class', error);
      alert(error.response?.data?.error || 'Could not delete class');
    }
  };

  const renderClassesView = () => (
    <>
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="welcome-text">Classes</h1>
            <p className="date-text">{classes.length} active classes</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563EB', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
          <Plus size={20} /> Create Class
        </button>
      </header>

      {loading ? (
        <div className="flex-center py-8 text-muted">Loading classes...</div>
      ) : classes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {classes.map((cls) => (
            <div 
              key={cls.id} 
              className="glass-card" 
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}
              onClick={() => setSelectedClass(cls)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <School size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{cls.name}</h3>
                    {cls.description && (
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {cls.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {cls.teacher_first_name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}>
                    <Users size={14} color="#1D4ED8" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8' }}>
                      {cls.teacher_first_name} {cls.teacher_last_name}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Unassigned</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(cls); }} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => handleDelete(cls, e)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <School size={64} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No classes found</h3>
          <p style={{ margin: 0, color: '#94A3B8' }}>Click 'Create Class' to get started.</p>
        </div>
      )}
    </>
  );

  const renderClassStudentsView = () => (
    <>
      <header className="header" style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setSelectedClass(null)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Back to Classes">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class Details</p>
            <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{selectedClass?.name}</h1>
          </div>
        </div>
      </header>

      {studentsLoading ? (
        <div className="flex-center py-8 text-muted">Loading students...</div>
      ) : classStudents.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {classStudents.map((student) => (
            <div key={student.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #F1F5F9' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {student.profile_image_url ? (
                  <img src={student.profile_image_url} alt={student.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#6366F1' }}>{student.first_name?.[0] || '?'}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {student.first_name} {student.last_name}
                </h3>
                {student.admission_number && (
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    ADM: {student.admission_number}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <GraduationCap size={64} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No students found</h3>
          <p style={{ margin: 0, color: '#94A3B8' }}>There are no students assigned to {selectedClass?.name} yet.</p>
        </div>
      )}
    </>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {selectedClass ? renderClassStudentsView() : renderClassesView()}

        {/* Add/Edit Class Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>{isEditing ? 'Edit Class' : 'Create New Class'}</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Class Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      className="input-field" 
                      placeholder="e.g. Playgroup-A or Nursery" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Description</label>
                    <textarea 
                      name="description"
                      className="input-field" 
                      placeholder="Brief details..." 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      rows={3} 
                      style={{ background: '#F8FAFC', resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Assign Class Teacher</label>
                    <select 
                      name="class_teacher_id"
                      className="input-field" 
                      value={formData.class_teacher_id} 
                      onChange={handleInputChange}
                      style={{ background: '#F8FAFC' }}
                    >
                      <option value="">Unassigned</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#2563EB', border: 'none' }}>
                    {saving ? 'Saving...' : (isEditing ? 'Update Class' : 'Save Class')}
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

export default ClassManagement;
