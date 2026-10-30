import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient, { formatMediaUrl } from '../../api/client';
import { BookOpen, Calendar, ArrowLeft, Clock, Paperclip, Search } from 'lucide-react';
import '../admin/Dashboard.css';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  due_date: string;
  class_name?: string;
  grade?: string;
  teacher_name?: string;
  created_at: string;
  attachments?: any;
}

const ParentHomework: React.FC = () => {
  const navigate = useNavigate();
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childClass = loggedUser?.className || loggedUser?.grade || 'Nursery';

  const fetchHomework = async () => {
    try {
      const response = await apiClient.get('/homework');
      setHomeworkList(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch parent homework', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, []);

  const defaultHomeworkItems: HomeworkItem[] = [
    {
      id: 'hw-def-1',
      title: '🔤 Alphabet Tracing: Letters A to E',
      description: 'Dear Parents, please guide your child to trace uppercase letters A, B, C, D, and E in their 4-line practice book (Page 12). Encourage them to say the phonics sound aloud while writing.',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      grade: childClass,
      teacher_name: 'Class Teacher',
      created_at: new Date().toISOString()
    },
    {
      id: 'hw-def-2',
      title: '🔢 Number Fun: Count & Match 1 to 5',
      description: 'Practice counting household objects (e.g. 3 spoons, 5 toys, 2 crayons). Help your child write numbers 1 to 5 in their square-line notebook.',
      due_date: new Date(Date.now() + 172800000).toISOString(),
      grade: childClass,
      teacher_name: 'Class Teacher',
      created_at: new Date().toISOString()
    }
  ];

  // Strictly isolate homework to this child's class
  const classIsolatedHomework = homeworkList.filter(hw => {
    const hwGrade = (hw.grade || hw.class_name || '').toLowerCase().trim();
    const myGrade = childClass.toLowerCase().trim();
    if (!hwGrade || hwGrade === 'all') return true;
    if (hwGrade === myGrade) return true;
    if (myGrade === 'jr kg' && (hwGrade.includes('jr') || hwGrade.includes('junior') || hwGrade === 'lkg')) return true;
    if (myGrade === 'sr kg' && (hwGrade.includes('sr') || hwGrade.includes('senior') || hwGrade === 'ukg')) return true;
    if (myGrade === 'playgroup' && hwGrade.includes('play')) return true;
    if (myGrade === 'nursery' && hwGrade.includes('nursery')) return true;
    return false;
  });

  const displayHomework = classIsolatedHomework.length > 0 ? classIsolatedHomework : defaultHomeworkItems;

  const filteredHomework = displayHomework.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hw.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* PAGE HEADER */}
        <header className="header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: 'white', 
                border: '1px solid #E2E8F0', 
                padding: '0.6rem', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                marginRight: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 className="welcome-text" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>
                  Child's Homework & Daily Practice
                </h1>
                <span style={{ background: '#F59E0B', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {childClass}
                </span>
              </div>
              <p className="date-text" style={{ margin: '0.2rem 0 0 0', color: '#64748B' }}>
                View daily home practice activities assigned for your child
              </p>
            </div>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div style={{ marginBottom: '1.5rem', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #E2E8F0' }}>
          <div className="search-box" style={{ width: '100%', maxWidth: '400px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search homework tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 600 }}>Loading homework tasks...</div>
        ) : filteredHomework.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.2rem', border: '1px solid #E2E8F0' }}>
            <BookOpen size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontWeight: 800 }}>No Homework Assigned Yet</h3>
            <p style={{ color: '#64748B', margin: 0 }}>Your child's teacher has not posted any new homework tasks for today.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredHomework.map((hw) => {
              const displayGrade = hw.class_name || hw.grade || childClass;
              const isPastDue = new Date(hw.due_date).getTime() < Date.now() - 86400000;

              return (
                <div 
                  key={hw.id} 
                  style={{ 
                    background: 'white',
                    borderRadius: '1.1rem',
                    border: '1.5px solid #E2E8F0',
                    padding: '1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px -1px rgba(0,0,0,0.04)'
                  }}
                >
                  <div>
                    {/* Top Row: Class Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span style={{ 
                        background: '#FEF3C7', 
                        color: '#B45309', 
                        padding: '0.3rem 0.85rem', 
                        borderRadius: '12px', 
                        fontSize: '0.78rem', 
                        fontWeight: 900,
                        border: '1px solid #FCD34D'
                      }}>
                        🎓 {displayGrade}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ margin: '0 0 0.6rem 0', color: '#0F172A', fontSize: '1.15rem', fontWeight: 800, lineHeight: '1.4' }}>
                      {hw.title}
                    </h3>

                    {/* Description */}
                    <p style={{ margin: '0 0 0.85rem 0', color: '#475569', fontSize: '0.88rem', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                      {hw.description}
                    </p>

                    {/* Attachments if any */}
                    {hw.attachments && (
                      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(Array.isArray(hw.attachments) ? hw.attachments : (typeof hw.attachments === 'string' ? (() => { try { return JSON.parse(hw.attachments); } catch { return [hw.attachments]; } })() : [])).map((att: string, aIdx: number) => {
                          const fileUrl = formatMediaUrl(att);
                          return (
                            <a 
                              key={aIdx} 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#F1F5F9', color: '#334155', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 700 }}
                            >
                              <Paperclip size={12} /> Attachment {aIdx + 1}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isPastDue ? '#EF4444' : '#059669', fontSize: '0.8rem', fontWeight: 800 }}>
                      <Clock size={14} /> Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      Teacher: {hw.teacher_name || 'Class Teacher'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentHomework;
