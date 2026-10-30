import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient, { formatMediaUrl } from '../../api/client';
import { Images, ArrowLeft, Heart, Calendar } from 'lucide-react';
import '../admin/Dashboard.css';

interface Story {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  likes_count?: number;
}

const ParentStories: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const response = await apiClient.get('/stories');
      setStories(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch parent stories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

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
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }} 
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                <Images color="#EC4899" size={30} />
                Preschool Activity Story Feed
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Daily activity photos, celebrations and moments of your child
              </p>
            </div>
          </div>
        </header>

        {/* Stories Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading activity stories...</div>
        ) : stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.2rem', border: '1px solid #E2E8F0' }}>
            <Images size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontWeight: 800 }}>No Activity Photos Posted Yet</h3>
            <p style={{ color: '#64748B', margin: 0 }}>Photos from classroom activities will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {stories.map((story) => (
              <div key={story.id} style={{ background: 'white', borderRadius: '1.2rem', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                {(() => {
                  const img = (story as any).cover_image_url || story.image_url;
                  if (img) {
                    return <img src={formatMediaUrl(img)} alt={story.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />;
                  }
                  return (
                    <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      🎨
                    </div>
                  );
                })()}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{story.title}</h3>
                  <p style={{ margin: '0 0 0.85rem 0', color: '#475569', fontSize: '0.88rem', lineHeight: '1.5' }}>{story.description}</p>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} color="#EC4899" /> {new Date(story.created_at).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#E11D48', fontWeight: 700 }}><Heart size={14} fill="#E11D48" /> {story.likes_count || 1} Likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentStories;
