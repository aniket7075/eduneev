import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Plus, ArrowLeft, Trash2, X, FileText, Eye, EyeOff } from 'lucide-react';
import './Directory.css';

interface Note {
  id: string;
  student_id: string;
  student_name: string;
  note_type: string;
  content: string;
  is_visible_to_parent: boolean;
  teacher_name?: string;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

const NOTE_TYPES = ['Academic', 'Behavior', 'Health', 'Observation', 'General'];
const TYPE_COLORS: Record<string, string> = {
  Academic: '#4F46E5', Behavior: '#F59E0B', Health: '#EF4444',
  Observation: '#10B981', General: '#64748B',
};

const TYPE_BG: Record<string, string> = {
  Academic: '#EEF2FF', Behavior: '#FEF3C7', Health: '#FEE2E2',
  Observation: '#D1FAE5', General: '#F1F5F9',
};

const NotesManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Data States
  const [notes, setNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [noteType, setNoteType] = useState('Academic');
  const [content, setContent] = useState('');
  const [isVisibleToParent, setIsVisibleToParent] = useState(true);

  useEffect(() => {
    fetchNotes();
    fetchStudents();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/notes');
      setNotes(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch notes', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/admin/students');
      setStudents(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const openAddModal = () => {
    setSelectedStudentId('');
    setNoteType('Academic');
    setContent('');
    setIsVisibleToParent(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Please select a student');
      return;
    }
    if (!content.trim()) {
      alert('Note content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/notes', {
        student_id: selectedStudentId,
        note_type: noteType,
        content: content.trim(),
        is_visible_to_parent: isVisibleToParent
      });
      setIsModalOpen(false);
      fetchNotes();
    } catch (error: any) {
      console.error('Failed to save note', error);
      alert(error.response?.data?.error || 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      fetchNotes();
    } catch (error: any) {
      console.error('Failed to delete note', error);
      alert(error.response?.data?.error || 'Could not delete note');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">Student Notes</h1>
              <p className="date-text">Academic & behavioral observations</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F59E0B', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)' }}>
            <Plus size={20} /> Add Note
          </button>
        </header>

        {loading ? (
          <div className="flex-center py-8 text-muted">Loading notes...</div>
        ) : notes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {notes.map((note) => {
              const bColor = TYPE_COLORS[note.note_type] || '#64748B';
              const bg = TYPE_BG[note.note_type] || '#F1F5F9';
              
              return (
                <div 
                  key={note.id} 
                  className="glass-card" 
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{note.student_name}</h3>
                      <div style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: bg, color: bColor, fontSize: '0.75rem', fontWeight: 800 }}>
                        {note.note_type}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(note.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 1.5rem 0', whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>By:</span> {note.teacher_name || 'Staff'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {note.is_visible_to_parent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#10B981' }} title="Visible to Parent">
                          <Eye size={14} /> Visible
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#94A3B8' }} title="Hidden from Parent">
                          <EyeOff size={14} /> Hidden
                        </div>
                      )}
                      <span>•</span>
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <FileText size={64} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No notes found</h3>
            <p style={{ margin: 0, color: '#94A3B8' }}>Click 'Add Note' to create your first observation.</p>
          </div>
        )}

        {/* Add Note Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>Create Student Note</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Select Student *</label>
                    <select 
                      className="input-field" 
                      value={selectedStudentId} 
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      style={{ background: '#F8FAFC' }}
                    >
                      <option value="">-- Choose a student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Note Category</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {NOTE_TYPES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNoteType(t)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: noteType === t ? TYPE_COLORS[t] : '#F8FAFC',
                            borderColor: noteType === t ? TYPE_COLORS[t] : '#E2E8F0',
                            color: noteType === t ? 'white' : '#64748B',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Note Details & Remarks *</label>
                    <textarea 
                      className="input-field" 
                      placeholder="Enter academic observation, progress remark or behavior note..." 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)} 
                      rows={5}
                      required
                      style={{ background: '#F8FAFC', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Eye size={16} /> Visible to Parent
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Show this note on the parent app feed</p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={isVisibleToParent} 
                        onChange={(e) => setIsVisibleToParent(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: isVisibleToParent ? '#F59E0B' : '#CBD5E1', 
                        transition: '.4s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', 
                          left: isVisibleToParent ? '22px' : '3px', bottom: '3px', 
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#F59E0B', border: 'none', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)' }}>
                    {saving ? 'Saving...' : 'Save Student Note'}
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

export default NotesManagement;
