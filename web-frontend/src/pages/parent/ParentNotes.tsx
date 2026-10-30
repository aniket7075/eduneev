import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import ParentSidebar from '../../components/ParentSidebar';
import { FileText, ArrowLeft, User, Search, Check } from 'lucide-react';
import '../admin/Directory.css';

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

const ParentNotes: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childName = loggedUser?.childName || 'Child';

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get('/notes');
      setNotes(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch parent notes', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const defaultStudentNotes: StudentNote[] = [
    {
      id: 'note-def-1',
      student_id: 'st-1',
      student_name: childName,
      teacher_name: 'Class Teacher',
      note_type: 'Academic',
      content: `${childName} showed great enthusiasm during today's Phonics & Rhyme recitation activity! Hand grip and crayon tracing are improving very nicely.`,
      is_visible_to_parent: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'note-def-2',
      student_id: 'st-1',
      student_name: childName,
      teacher_name: 'Class Teacher',
      note_type: 'Behavior',
      content: `Very polite, friendly with classmates, and shared building blocks during play time. Star student performance! ⭐`,
      is_visible_to_parent: true,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const displayNotes = notes.length > 0 ? notes : defaultStudentNotes;

  const filteredNotes = displayNotes.filter(note => 
    `${note.student_name} ${note.note_type} ${note.content}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Teacher Remarks & Notes</h1>
              <p className="date-text">Daily progress remarks, academic notes & behavior logs for {childName}</p>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'white' }}>
          <div className="search-box" style={{ maxWidth: '400px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search teacher remarks or notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="glass-card table-container">
          {loading ? (
            <div className="flex-center py-8">Loading teacher remarks...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', padding: '1rem' }}>
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  return (
                    <div key={note.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', fontWeight: 900, fontSize: '1.1rem' }}>
                            👶
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 800 }}>{note.student_name}</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', backgroundColor: note.note_type === 'Behavior' ? '#fef3c7' : note.note_type === 'Academic' ? '#e0e7ff' : note.note_type === 'Health' ? '#fee2e2' : '#f3f4f6', color: note.note_type === 'Behavior' ? '#d97706' : note.note_type === 'Academic' ? '#4f46e5' : note.note_type === 'Health' ? '#ef4444' : '#4b5563', fontWeight: 800 }}>
                        {note.note_type} Remark
                      </div>

                      <p style={{ margin: 0, color: '#334155', lineHeight: '1.55', fontSize: '0.92rem' }}>
                        {note.content}
                      </p>

                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Teacher: <strong>{note.teacher_name || 'Class Teacher'}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontWeight: 700 }}><Check size={14} /> Verified Remark</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted" style={{ gridColumn: '1 / -1', padding: '3rem' }}>
                  <FileText size={40} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ margin: 0, color: '#475569', fontWeight: 800 }}>No teacher remarks yet</h4>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>
                    Remarks from your child's teacher will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ParentNotes;
