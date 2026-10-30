const fs = require('fs');
const path = require('path');

const content = `import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Sidebar from '../../components/Sidebar';
import { Plus, Search, FileText, ArrowLeft, X, Trash2, Check, User } from 'lucide-react';
import './Directory.css';

interface StudentNote {
  id: string;
  student_id: string;
  student_name: string;
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
}

const StudentNotesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    noteType: 'General',
    content: '',
    isVisibleToParent: true
  });

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get('/notes');
      setNotes(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch notes', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiClient.get('/admin/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchStudents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
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
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiClient.delete(\`/notes/\${id}\`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(note => 
    \`\${note.student_name} \${note.note_type} \${note.content}\`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Student Notes</h1>
              <p className="date-text">Track behavior, progress, and daily remarks</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={20} /> Add Note
          </button>
        </header>

        <div className="glass-card table-container">
          <div className="table-header flex-between">
            <div className="search-box">
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading notes...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', padding: '1rem' }}>
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div key={note.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--main-blue)' }}>
                          <User size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{note.student_name}</h3>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(note.id)} className="icon-btn" style={{ color: 'var(--main-red)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', backgroundColor: note.note_type === 'Behavior' ? '#fef3c7' : note.note_type === 'Academic' ? '#e0e7ff' : note.note_type === 'Health' ? '#fee2e2' : '#f3f4f6', color: note.note_type === 'Behavior' ? '#d97706' : note.note_type === 'Academic' ? '#4f46e5' : note.note_type === 'Health' ? '#ef4444' : '#4b5563', fontWeight: 'bold' }}>
                      {note.note_type}
                    </div>

                    <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5' }}>
                      {note.content}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <span>By: {note.teacher_name || 'Admin'}</span>
                      {note.is_visible_to_parent && (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--main-green)' }}><Check size={14} /> Visible to Parents</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted" style={{ gridColumn: '1 / -1' }}>
                  No student notes found.
                </div>
              )}
            </div>
          )}
        </div>

        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Add Student Note</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Student</label>
                  <select name="studentId" value={formData.studentId} onChange={handleInputChange} required>
                    <option value="">Select Student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Note Type</label>
                  <select name="noteType" value={formData.noteType} onChange={handleInputChange} required>
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Behavior">Behavior</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Note Content</label>
                  <textarea name="content" value={formData.content} onChange={handleInputChange} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} placeholder="Write your remarks here..." required></textarea>
                </div>
                
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  <input type="checkbox" id="isVisibleToParent" name="isVisibleToParent" checked={formData.isVisibleToParent} onChange={handleInputChange} style={{ width: '1.25rem', height: '1.25rem' }} />
                  <label htmlFor="isVisibleToParent" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>Make this note visible to parents</label>
                </div>
                
                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Note</button>
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
`;

fs.writeFileSync(path.join(__dirname, 'src/pages/admin/StudentNotesManagement.tsx'), content);
console.log('Done');
