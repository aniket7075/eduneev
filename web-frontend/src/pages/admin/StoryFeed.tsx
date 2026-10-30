import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import { Images, Plus, Heart, Trash2, X, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import apiClient, { formatMediaUrl } from '../../api/client';
import './Dashboard.css';

interface Story {
  id: string;
  type: string;
  authorName: string;
  authorAvatar: string;
  title?: string;
  content: string;
  imageUrl?: string;
  timeAgo: string;
  views: number;
  likes: number;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop';

const StoryFeed: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fetchFeed = async () => {
    try {
      const [noticesRes, galleryRes] = await Promise.all([
        apiClient.get('/notices').catch(() => ({ data: { data: [] } })),
        apiClient.get('/gallery').catch(() => ({ data: { data: [] } })),
      ]);

      const noticesList = (noticesRes.data?.data || noticesRes.data || []).map((n: any) => ({
        id: `notice_${n.id}`,
        type: 'Notice 📢',
        authorName: n.created_by_name || n.author || 'School Management',
        authorAvatar: 'S',
        title: n.title,
        content: n.content,
        timeAgo: new Date(n.created_at || n.date || Date.now()).toLocaleDateString(),
        views: 0,
        likes: 12,
      }));

      const galleryList = (galleryRes.data?.data || galleryRes.data || []).map((g: any) => {
        const rawUrl = g.cover_image_url || g.coverUrl;
        return {
          id: `gallery_${g.id}`,
          type: 'Album 📷',
          authorName: g.created_by_name || g.author || 'School Staff',
          authorAvatar: 'A',
          title: g.title,
          content: g.description || 'Check out our latest class activities!',
          imageUrl: rawUrl ? formatMediaUrl(rawUrl) : undefined,
          timeAgo: new Date(g.created_at || g.date || Date.now()).toLocaleDateString(),
          views: g.views || 0,
          likes: 24,
        };
      });

      const combined = [...galleryList, ...noticesList];
      setStories(combined);
    } catch (err) {
      console.error('Fetch feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSaving(true);
    try {
      if (selectedFile) {
        // Upload with image as gallery album
        const formData = new FormData();
        formData.append('title', newTitle.trim());
        formData.append('description', newContent.trim());
        formData.append('cover_image', selectedFile);

        await apiClient.post('/gallery', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Post as Notice story
        await apiClient.post('/notices', {
          title: newTitle.trim(),
          content: newContent.trim(),
          audience: 'All',
          category: 'general'
        });
      }

      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setSelectedFile(null);
      setPreviewUrl('');
      fetchFeed();
    } catch (error) {
      console.error('Failed to post story', error);
      alert('Failed to post story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStory = async (storyId: string, title?: string) => {
    if (!window.confirm(`Are you sure you want to delete this story "${title || 'item'}"?`)) return;

    try {
      if (storyId.startsWith('gallery_')) {
        const id = storyId.replace('gallery_', '');
        await apiClient.delete(`/gallery/${id}`);
      } else if (storyId.startsWith('notice_')) {
        const id = storyId.replace('notice_', '');
        await apiClient.delete(`/notices/${id}`);
      }
      fetchFeed();
    } catch (err) {
      console.error('Failed to delete story:', err);
      alert('Failed to delete story.');
    }
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="title-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Images color="var(--kid-blue)" size={32} />
                Story Feed
              </h1>
              <p className="text-subtitle">Share daily moments with parents</p>
            </div>
          </div>
          <button className="btn-kid btn-primary-kid" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} />
            Add Story
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>Loading stories...</div>
          ) : stories.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>No stories found.</div>
          ) : stories.map(story => (
            <div key={story.id} className="stat-card" style={{ width: '320px', padding: 0, overflow: 'hidden', flexDirection: 'column', gap: 0, alignItems: 'stretch', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', borderRadius: '1rem', border: '1px solid #E2E8F0', background: 'white' }}>
              
              {/* Story Header */}
              <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    background: 'linear-gradient(45deg, var(--kid-orange, #F97316), var(--kid-red, #EF4444))', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 'bold', fontSize: '0.9rem'
                  }}>
                    {story.authorAvatar}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700 }}>{story.authorName}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{story.timeAgo} • {story.type}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteStory(story.id, story.title)} 
                  title="Delete Story"
                  style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Content Area */}
              <div style={{ padding: '1rem' }}>
                {story.title && <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>{story.title}</h3>}
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.4 }}>{story.content}</p>
              </div>

              {/* Story Image */}
              {story.imageUrl && (
                <div style={{ height: '210px', width: '100%', background: '#F1F5F9', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={story.imageUrl} 
                    alt={story.title || "Story"} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              )}

              {/* Story Footer */}
              <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 600 }}>
                    <Heart size={16} color="#EF4444" fill="#EF4444" /> {story.likes}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>EduNeev Moments</span>
              </div>
            </div>
          ))}
        </div>

        {/* Create Story Modal */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              background: 'white', padding: '1.75rem', borderRadius: '1.25rem',
              width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, color: '#1E293B', fontSize: '1.3rem', fontWeight: 800 }}>Add to Story Feed</h2>
                <button onClick={() => { setIsModalOpen(false); setSelectedFile(null); setPreviewUrl(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleCreateStory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Story Title *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Science Fair or Clay Modeling" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Story Content / Notes *</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Write update for parents..." 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3} 
                    required 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Story Photo / Media (Optional)</label>
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed #CBD5E1', borderRadius: '0.75rem', padding: '1rem',
                    cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s'
                  }}>
                    {previewUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                        <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Change</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748B' }}>
                        <Upload size={28} color="#6366F1" style={{ margin: '0 auto 0.4rem' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', color: '#1E293B' }}>Click to upload photo</span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>PNG, JPG or WEBP</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setSelectedFile(null); setPreviewUrl(''); }}
                    style={{ flex: 1, padding: '0.65rem', border: '1px solid #E2E8F0', borderRadius: '0.6rem', background: '#F1F5F9', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={saving} 
                    type="submit" 
                    className="btn-kid btn-primary-kid" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '0.6rem', padding: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <Plus size={18} /> {saving ? 'Posting...' : 'Post Story'}
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

export default StoryFeed;
