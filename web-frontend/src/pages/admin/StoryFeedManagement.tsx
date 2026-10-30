import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import { Plus, MoreVertical, Eye, ArrowLeft } from 'lucide-react';
import './Directory.css';

const mockStories = [
  { id: 1, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop', caption: 'Science Fair Preparations!', targetClass: 'All Classes', views: 142, postedTime: '2 hours ago' },
  { id: 2, image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=400&auto=format&fit=crop', caption: 'Art Class Masterpieces', targetClass: 'Grade A', views: 56, postedTime: '5 hours ago' },
  { id: 3, image: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=400&auto=format&fit=crop', caption: 'Sports Day Practice', targetClass: 'Grade B', views: 89, postedTime: '1 day ago' },
];

const StoryFeedManagement: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">Story Feed</h1>
          <p className="date-text">Manage daily photo and video stories for parents</p>
        </div>
          </div>
          <button className="btn-primary">
          <Plus size={20} />
          Create Story
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {mockStories.map((story) => (
          <div key={story.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', height: '200px' }}>
              <img src={story.image} alt={story.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> {story.views}
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#111827' }}>{story.caption}</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><MoreVertical size={16} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6b7280' }}>
                <span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: '50px' }}>{story.targetClass}</span>
                <span>{story.postedTime}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State Add Button */}
        <div style={{ border: '2px dashed #d1d5db', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', cursor: 'pointer', color: '#6b7280', transition: 'all 0.2s ease' }}>
          <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '50%', marginBottom: '12px' }}>
            <Plus size={32} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>Upload New Story</p>
        </div>
      </div>
    </main>
    </div>
  );
};

export default StoryFeedManagement;
