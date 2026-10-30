import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import { Megaphone, Calendar, User, ArrowLeft, MessageSquare } from 'lucide-react';
import '../admin/Dashboard.css';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: 'All' | 'Parents' | 'Staff';
  author?: string;
  created_at?: string;
}

const ParentNotices: React.FC = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Parents'>('All');

  const fetchNotices = async () => {
    try {
      const { default: apiClient } = await import('../../api/client');
      const response = await apiClient.get('/notices');
      const all: Notice[] = response.data.data || response.data || [];
      // Filter out staff-only notices for parents
      setNotices(all.filter(n => n.audience !== 'Staff'));
    } catch (error) {
      console.error('Failed to fetch parent notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

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
    ? notices 
    : notices.filter(n => n.audience === filter);

  return (
    <div className="dashboard-layout">
      <ParentSidebar />
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
                School Notices & Announcements
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Official announcements and updates for your child from EduNeev Preschool
              </p>
            </div>
          </div>
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
          {(['All', 'Parents'] as const).map(f => {
            const count = f === 'All' ? notices.length : notices.filter(n => n.audience === 'Parents').length;
            const active = filter === f;
            return (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '999px',
                  border: active ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                  background: active ? '#F59E0B' : '#F8FAFC',
                  color: active ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: active ? '0 4px 12px rgba(245, 158, 11, 0.25)' : 'none'
                }}
              >
                <span>{f === 'All' ? 'All Notices' : 'Parent Circulars'}</span>
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
            const formattedDate = formatDate(notice.date || notice.created_at);
            const authorName = notice.author && notice.author.trim() !== '' ? notice.author : 'School Administration';

            return (
              <div 
                key={notice.id} 
                style={{ 
                  background: '#FFFFFF',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
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
                      background: '#FEF3C7',
                      color: '#D97706',
                      border: '1px solid #FCD34D'
                    }}>
                      📢 Official Circular
                    </span>
                  </div>
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
                    <Calendar size={15} color="#F59E0B" />
                    <span>{formattedDate}</span>
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
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>No announcements found</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>There are no active notices for parents right now.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ParentNotices;
