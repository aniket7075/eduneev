import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import { Megaphone, Plus, Calendar, Users, X, Send, Trash2, ArrowLeft, User, MessageSquare } from 'lucide-react';
import './Dashboard.css';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: 'All' | 'Parents' | 'Staff';
  author?: string;
  created_at?: string;
}

const NoticesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Parents' | 'Staff'>('All');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isParent = userRole === 'parent';
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'super_admin' || userRole === 'school_admin' || userRole === 'owner';
  const canCreateNotice = isAdmin || isTeacher;

  const fetchNotices = async () => {
    try {
      
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get('/notices');
      setNotices(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // New Notice form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAudience, setNewAudience] = useState<'All' | 'Parents' | 'Staff'>('All');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.post('/notices', {
        title: newTitle,
        content: newContent,
        audience: newAudience,
        type: 'general'
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      await fetchNotices();
    } catch (error) {
      console.error('Failed to create notice:', error);
      alert('Could not create notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.delete(`/notices/${id}`);
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('Could not delete notice');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredNotices = filter === 'All' 
    ? (isParent ? notices.filter(n => n.audience !== 'Staff') : notices) 
    : notices.filter(n => n.audience === filter || n.audience === 'All');

  const getAudienceBadgeStyle = (audience: string) => {
    switch (audience) {
      case 'Parents':
        return { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' };
      case 'Staff':
        return { background: '#CCFBF1', color: '#0F766E', border: '1px solid #99F6E4' };
      default:
        return { background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
    }
  };

  const filterOptions = isParent 
    ? (['All', 'Parents'] as const)
    : (['All', 'Parents', 'Staff'] as const);

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header Bar */}
        <header className="header flex-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
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
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }} 
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                <Megaphone color="var(--kid-orange, #F59E0B)" size={30} />
                Notices & Announcements
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                {isParent ? 'View official school announcements and notices for your child' : 'Manage school-wide communications and parent notifications'}
              </p>
            </div>
          </div>
          {canCreateNotice && (
            <button 
              className="btn-primary" 
              onClick={() => setIsModalOpen(true)} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                height: '42px', 
                padding: '0 1.25rem', 
                borderRadius: '0.85rem', 
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)'
              }}
            >
              <Plus size={20} />
              Create Notice
            </button>
          )}
        </header>

        {/* Category Filter Pills Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.65rem', 
          marginBottom: '1.75rem', 
          background: '#FFFFFF', 
          padding: '0.65rem 1rem', 
          borderRadius: '1.15rem', 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' 
        }}>
          {filterOptions.map(f => {
            const count = f === 'All' 
              ? (isParent ? notices.filter(n => n.audience !== 'Staff').length : notices.length)
              : notices.filter(n => n.audience === f || n.audience === 'All').length;
            const active = filter === f;
            return (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '999px',
                  border: active ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  background: active ? '#4F46E5' : '#F8FAFC',
                  color: active ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: active ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                }}
              >
                <span>{f}</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  background: active ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                  color: active ? '#FFFFFF' : '#64748B',
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notice Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 600 }}>
              Loading announcements...
            </div>
          ) : filteredNotices.map((notice) => {
            const badgeStyle = getAudienceBadgeStyle(notice.audience);
            const formattedDate = formatDate(notice.date || notice.created_at);
            const authorName = notice.author && notice.author.trim() !== '' ? notice.author : 'School Admin';

            return (
              <div 
                key={notice.id} 
                style={{ 
                  background: '#FFFFFF',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Header of Notice */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {notice.title}
                    </h3>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      ...badgeStyle
                    }}>
                      {notice.audience === 'All' ? '📢 All (Parents & Staff)' : `👥 ${notice.audience}`}
                    </span>
                  </div>

                  {!isParent && (
                    <button 
                      onClick={() => handleDelete(notice.id)}
                      style={{ 
                        background: '#FEF2F2', 
                        border: '1px solid #FEE2E2', 
                        color: '#EF4444', 
                        cursor: 'pointer', 
                        padding: '0.45rem',
                        borderRadius: '0.65rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      title="Delete Notice"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                {/* Content */}
                <p style={{ color: '#334155', margin: 0, lineHeight: 1.65, fontSize: '0.95rem' }}>
                  {notice.content}
                </p>
                
                {/* Footer Metadata */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '1.75rem', 
                  marginTop: '0.25rem', 
                  width: '100%', 
                  borderTop: '1px solid #F1F5F9', 
                  paddingTop: '0.85rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Calendar size={15} color="#4F46E5" />
                    <span>{formattedDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Users size={15} color="#F59E0B" />
                    <span>Audience: <strong style={{ color: '#0F172A' }}>{notice.audience}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                    <User size={15} color="#0D9488" />
                    <span>By: <strong style={{ color: '#0F172A' }}>{authorName}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filteredNotices.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              background: '#FFFFFF', 
              borderRadius: '1.25rem', 
              border: '1px solid #E2E8F0',
              color: '#64748B' 
            }}>
              <MessageSquare size={40} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>No notices found</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>There are no announcements for the "{filter}" category yet.</p>
            </div>
          )}
        </div>

        {/* Create Notice Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px' }}>
              <div className="modal-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Megaphone size={22} color="#4F46E5" />
                  Publish New Notice
                </h2>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              
              <form onSubmit={handleCreateNotice} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Notice Title</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="E.g., Annual Sports Day Announcement"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select 
                    className="input-field"
                    value={newAudience}
                    onChange={e => setNewAudience(e.target.value as any)}
                  >
                    <option value="All">All (Parents & Staff)</option>
                    <option value="Parents">Parents Only</option>
                    <option value="Staff">Staff Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Announcement Content</label>
                  <textarea 
                    className="input-field"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Write detailed announcement message here..."
                    rows={4}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', padding: '0 1.25rem' }}
                  >
                    <Send size={18} /> {submitting ? 'Publishing...' : 'Publish Notice'}
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

export default NoticesManagement;
