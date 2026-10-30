import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient, { formatMediaUrl } from '../../api/client';
import {
  BookOpen, Plus, Calendar, Trash2, ArrowLeft, Send, CheckCircle2,
  Sparkles, Layers, Search, Filter, Clock, User, MessageCircle, AlertCircle, Paperclip
} from 'lucide-react';
import './Dashboard.css';

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

const PRESET_CLASSES = [
  { name: 'Playgroup', icon: '👶', color: '#EC4899', badgeBg: '#FDF2F8' },
  { name: 'Nursery', icon: '🌱', color: '#10B981', badgeBg: '#F0FDF4' },
  { name: 'Jr KG', icon: '⭐', color: '#F59E0B', badgeBg: '#FFFBEB' },
  { name: 'Sr KG', icon: '🎓', color: '#6366F1', badgeBg: '#EEF2FF' },
  { name: 'Daycare', icon: '🧸', color: '#06B6D4', badgeBg: '#ECFEFF' }
];

const PRESCHOOL_HOMEWORK_TEMPLATES = [
  {
    title: '🔤 Alphabet Tracing: Letters A to E',
    category: 'Phonics & Literacy',
    grade: 'Nursery',
    description: 'Dear Parents, please guide your child to trace uppercase letters A, B, C, D, and E in their 4-line practice book (Page 12). Encourage them to say the phonics sound aloud while writing.'
  },
  {
    title: '🔢 Number Fun: Count & Match 1 to 5',
    category: 'Math & Numbers',
    grade: 'Nursery',
    description: 'Practice counting household objects (e.g. 3 spoons, 5 toys, 2 crayons). Help your child write numbers 1 to 5 in their square-line notebook.'
  },
  {
    title: '🎨 Color the Apple: Primary Colors Fun',
    category: 'Art & Craft',
    grade: 'Playgroup',
    description: 'Use a red crayon to color inside the apple drawing in Art Book (Page 5). Focus on hand grip and coloring within the boundary lines.'
  },
  {
    title: '🎵 Rhyme Practice: Twinkle Twinkle & Action Song',
    category: 'Rhymes & Music',
    grade: 'Playgroup',
    description: 'Sing and practice actions for "Twinkle Twinkle Little Star" and "Johny Johny Yes Papa" together with your child for 10 minutes.'
  },
  {
    title: '🌱 Nature Activity: Collect 3 Different Leaves',
    category: 'General Awareness',
    grade: 'Jr KG',
    description: 'Take a brief walk in the garden. Help your child observe and collect 3 different shaped fallen leaves. Paste them gently in their scrapbook.'
  },
  {
    title: '📖 2-Letter Sight Words: at, an, in, on',
    category: 'Phonics & Reading',
    grade: 'Sr KG',
    description: 'Read and write 2-letter sight words: AT, AN, IN, ON, IS. Have the child read each word aloud 3 times.'
  }
];

const HomeworkManagement: React.FC = () => {
  const navigate = useNavigate();

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isParent = userRole === 'parent';
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'super_admin' || userRole === 'school_admin' || userRole === 'owner';
  const canAssignHomework = isAdmin || isTeacher;
  const canDeleteHomework = isAdmin || isTeacher;

  // Dedicated Teacher Assigned Grade Resolution
  const teacherAssignedGrade = loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.class || loggedUser?.class_name || loggedUser?.department || '';

  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);

  // Filter States - Default to teacher's class if logged in as teacher
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (isTeacher && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'All';
  });

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [grade, setGrade] = useState<string>(() => {
    if (isTeacher && teacherAssignedGrade) {
      return teacherAssignedGrade;
    }
    return 'Nursery';
  });
  const [broadcastToParents, setBroadcastToParents] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [availableClasses, setAvailableClasses] = useState<string[]>(['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare']);

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const param = selectedGrade === 'All' ? 'all' : selectedGrade;
      const res = await apiClient.get(`/homework/${encodeURIComponent(param)}`);
      setHomeworkList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch homework', err);
      setHomeworkList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [selectedGrade]);

  useEffect(() => {
    if (isTeacher && teacherAssignedGrade) {
      setSelectedGrade(teacherAssignedGrade);
      setGrade(teacherAssignedGrade);
    }

    const fetchClasses = async () => {
      try {
        const res = await apiClient.get('/classes');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const names = res.data.map((c: any) => c.name).filter(Boolean);
          if (isTeacher && teacherAssignedGrade) {
            setAvailableClasses([teacherAssignedGrade]);
            setSelectedGrade(teacherAssignedGrade);
            setGrade(teacherAssignedGrade);
          } else {
            setAvailableClasses(names.length > 0 ? names : ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Daycare']);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic classes in homework management', e);
      }
    };
    fetchClasses();
  }, [isTeacher, teacherAssignedGrade]);

const handleCreateHomework = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim() || !description.trim() || !dueDate) {
    alert('Please fill in all required fields');
    return;
  }

  setSubmitting(true);
  try {
    // 1. Create FormData for text + file attachments
    const formPayload = new FormData();
    formPayload.append('title', title.trim());
    formPayload.append('description', description.trim());
    formPayload.append('due_date', dueDate);
    formPayload.append('grade', grade);

    if (selectedFiles && selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        formPayload.append('files', selectedFiles[i]);
      }
    }

    await apiClient.post('/homework', formPayload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // 2. Broadcast to Chat Rooms if selected
    if (broadcastToParents) {
      try {
        const roomsRes = await apiClient.get('/chat/rooms');
        const rooms = roomsRes.data?.data || [];
        const classRoom = rooms.find((r: any) => r.name?.toLowerCase().includes(grade.toLowerCase()));
        if (classRoom) {
          await apiClient.post('/chat/messages', {
            room_id: classRoom.id,
            message: `📚 [HOMEWORK FOR ${grade.toUpperCase()}]\n📌 ${title.trim()}\n📝 Instructions: ${description.trim()}\n📅 Due Date: ${new Date(dueDate).toLocaleDateString()}${selectedFiles.length > 0 ? `\n📎 ${selectedFiles.length} file(s) attached` : ''}`
          });
        }
      } catch (chatErr) {
        console.warn('Chat broadcast skipped:', chatErr);
      }
    }

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setSelectedFiles([]);
    fetchHomework();
    alert(`Success! Homework assigned to ${grade} and broadcasted to parents.`);
  } catch (err: any) {
    console.error('Failed to create homework', err);
    alert(err.response?.data?.error || 'Could not post homework');
  } finally {
    setSubmitting(false);
  }
};

const handleApplyTemplate = (tmpl: typeof PRESCHOOL_HOMEWORK_TEMPLATES[0]) => {
  setTitle(tmpl.title);
  setDescription(tmpl.description);
  setGrade(tmpl.grade);
  // default due date: tomorrow
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  setDueDate(tomorrow);
};

const handleDeleteHomework = async (id: string) => {
  if (!window.confirm('Are you sure you want to delete this homework?')) return;
  try {
    await apiClient.delete(`/homework/${id}`);
    fetchHomework();
  } catch (err) {
    console.error('Delete failed', err);
  }
};

const filteredHomework = homeworkList.filter(hw => {
  const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hw.description.toLowerCase().includes(searchTerm.toLowerCase());
  return matchesSearch;
});

const getHomeworkCountForClass = (className: string) => {
  if (className === 'All') return homeworkList.length;
  return homeworkList.filter(h => (h.class_name || h.grade || '').toLowerCase() === className.toLowerCase()).length;
};

return (
  <div className="dashboard-layout">
    <SmartSidebar />
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
                Homework & Assignments
              </h1>
              <span style={{ background: '#4F46E5', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                Class-Wise Portal
              </span>
            </div>
            <p className="date-text" style={{ margin: '0.2rem 0 0 0', color: '#64748B' }}>
              Assign daily practice work class-wise and automatically broadcast to parent WhatsApp/App
            </p>
          </div>
        </div>

        {canAssignHomework && (
          <button
            className="btn-primary"
            onClick={() => {
              if (selectedGrade !== 'All') setGrade(selectedGrade);
              // default due date: tomorrow
              const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
              setDueDate(tomorrow);
              setIsModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
              padding: '0.65rem 1.4rem',
              borderRadius: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={20} /> + Give Homework
          </button>
        )}
      </header>

      {/* TOP CLASS SELECTION BAR */}
      <div style={{
        background: 'white',
        borderRadius: '1.25rem',
        border: '1.5px solid #E2E8F0',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} color="#4F46E5" /> Filter by Class:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search homework..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.4rem 0.8rem 0.4rem 2rem',
                  borderRadius: '0.65rem',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Class Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(!isTeacher || !teacherAssignedGrade) && (
            <button
              onClick={() => setSelectedGrade('All')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.85rem',
                border: selectedGrade === 'All' ? '2px solid #4F46E5' : '1.5px solid #CBD5E1',
                background: selectedGrade === 'All' ? '#EEF2FF' : '#FFFFFF',
                color: selectedGrade === 'All' ? '#4338CA' : '#334155',
                fontWeight: selectedGrade === 'All' ? 900 : 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedGrade === 'All' ? '0 4px 10px rgba(79, 70, 229, 0.15)' : 'none'
              }}
            >
              <span>🏫 All Classes</span>
            </button>
          )}

          {((isTeacher && teacherAssignedGrade)
            ? (availableClasses.filter(g => g.toLowerCase() === teacherAssignedGrade.toLowerCase()).length > 0
              ? availableClasses.filter(g => g.toLowerCase() === teacherAssignedGrade.toLowerCase())
              : [teacherAssignedGrade])
            : availableClasses
          ).map(g => {
            const isSelected = selectedGrade === g;
            const meta = PRESET_CLASSES.find(p => p.name.toLowerCase() === g.toLowerCase());
            const icon = meta?.icon || '🎓';

            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '0.85rem',
                  border: isSelected ? '2px solid #4F46E5' : '1.5px solid #CBD5E1',
                  background: isSelected ? '#EEF2FF' : '#FFFFFF',
                  color: isSelected ? '#4338CA' : '#334155',
                  fontWeight: isSelected ? 900 : 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 10px rgba(79, 70, 229, 0.15)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span>{g}</span>
                {isTeacher && teacherAssignedGrade && (
                  <span style={{ background: '#22C55E', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: '8px', marginLeft: '0.2rem' }}>
                    Assigned Class
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* HOMEWORK FEED / LIST */}
      {loading ? (
        <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
          Loading homework assignments for {selectedGrade === 'All' ? 'all classes' : selectedGrade}...
        </div>
      ) : filteredHomework.length === 0 ? (
        /* Empty State */
        <div style={{
          background: 'white',
          borderRadius: '1.25rem',
          border: '1.5px dashed #CBD5E1',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <BookOpen size={36} color="#4F46E5" />
          </div>

          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
            No Homework Assigned for {selectedGrade === 'All' ? 'any class' : selectedGrade}
          </h3>
          <p style={{ margin: '0 auto 1.75rem auto', maxWidth: '480px', color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Create a custom practice task or choose from the ready-made EduNeev Preschool homework templates below.
          </p>

          {canAssignHomework && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (selectedGrade !== 'All') setGrade(selectedGrade);
                  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                  setDueDate(tomorrow);
                  setIsModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
              >
                <Plus size={18} /> Assign Homework Now
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredHomework.map((hw) => {
            const displayGrade = hw.class_name || hw.grade || selectedGrade || 'Nursery';
            const meta = PRESET_CLASSES.find(p => p.name.toLowerCase() === displayGrade.toLowerCase());
            const classColor = meta?.color || '#4F46E5';
            const classBg = meta?.badgeBg || '#EEF2FF';

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
                  boxShadow: '0 2px 6px -1px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  position: 'relative'
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
                <div>
                  {/* Top Row: Class Badge + Delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{
                      background: classBg,
                      color: classColor,
                      padding: '0.3rem 0.85rem',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: `1px solid ${classColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      {meta?.icon || '🎓'} {displayGrade}
                    </span>

                    {canDeleteHomework && (
                      <button
                        onClick={() => handleDeleteHomework(hw.id)}
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
                        const isImg = att.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                        return (
                          <a
                            key={aIdx}
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#4F46E5',
                              fontWeight: 700,
                              background: '#EEF2FF',
                              border: '1px solid #C7D2FE',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Paperclip size={12} /> {isImg ? '🖼️ View Worksheet Photo' : `📄 Attachment ${aIdx + 1}`}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Strip: Due Date & Broadcast Badge */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                    <Calendar size={14} color={isPastDue ? '#EF4444' : '#F59E0B'} />
                    Due: <strong style={{ color: isPastDue ? '#EF4444' : '#1E293B' }}>{new Date(hw.due_date).toLocaleDateString()}</strong>
                  </span>

                  <span style={{
                    background: '#ECFDF5',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}>
                    <CheckCircle2 size={13} /> Active & Sent
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────── GIVE HOMEWORK MODAL ───────────── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', width: '95%', padding: 0, overflow: 'hidden' }}>

            <div className="modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#312E81', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={20} color="#4F46E5" /> Assign New Homework
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#4338CA' }}>
                  Create class practice work and broadcast notifications to parents
                </p>
              </div>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white' }}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateHomework} style={{ padding: '1.5rem 1.75rem' }}>

              {/* Preschool Template Suggestions Banner */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <Sparkles size={14} /> Quick Preschool Homework Templates:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="no-scrollbar">
                  {PRESCHOOL_HOMEWORK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '12px',
                        background: 'white',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Selection */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Target Class <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="input-field"
                  style={{ background: '#F8FAFC', fontWeight: 700 }}
                >
                  {availableClasses.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Homework Title <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🔤 Alphabet Practice: Letters A to E"
                  className="input-field"
                  style={{ background: '#F8FAFC', fontWeight: 700 }}
                  required
                />
              </div>

              {/* Instructions */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Instructions for Parents <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain step-by-step instructions for parents (e.g. Workbook Page No, Practice 3 times)..."
                  rows={4}
                  className="input-field"
                  style={{ background: '#F8FAFC', lineHeight: '1.4' }}
                  required
                />
              </div>

              {/* Due Date */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Due Date <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field"
                  style={{ background: '#F8FAFC', fontWeight: 700 }}
                  required
                />
              </div>

              {/* File Attachment Upload */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#334155', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <Paperclip size={16} color="#4F46E5" /> Attach Worksheets / Photos / PDF (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="input-field"
                  style={{ background: '#F8FAFC', padding: '0.5rem', cursor: 'pointer' }}
                />
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {selectedFiles.map((file, idx) => (
                      <span key={idx} style={{ background: '#EEF2FF', color: '#4338CA', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        📎 {file.name} ({Math.round(file.size / 1024)} KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Broadcast to Parents Toggle */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem'
              }}>
                <input
                  type="checkbox"
                  id="broadcastToggle"
                  checked={broadcastToParents}
                  onChange={(e) => setBroadcastToParents(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                />
                <label htmlFor="broadcastToggle" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', cursor: 'pointer' }}>
                  📢 Automatically broadcast assignment details to parents' WhatsApp & chat portal
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '0.65rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 800
                  }}
                >
                  <Send size={16} /> {submitting ? 'Assigning...' : 'Post & Broadcast Homework'}
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

export default HomeworkManagement;
