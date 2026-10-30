import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import apiClient from '../../api/client';
import { Search, Plus, ArrowLeft, Megaphone, Users, Calendar, Trash2, Edit2, X, Bell } from 'lucide-react';
import './Directory.css';

interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string;
  date: string;
  isRead?: boolean;
}

const NoticeManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const emptyForm = { id: '', title: '', content: '', audience: 'all', date: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState(emptyForm);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/notices');
      setNotices(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setIsEditing(true);
    setFormData({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      audience: notice.audience || 'all',
      date: notice.date ? new Date(notice.date).toISOString().split('T')[0] : emptyForm.date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        audience: formData.audience,
        date: formData.date
      };

      if (isEditing) {
        await apiClient.put(`/notices/${formData.id}`, payload);
      } else {
        await apiClient.post('/notices', payload);
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (error: any) {
      console.error('Failed to save notice', error);
      alert(error.response?.data?.error || 'Could not save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the notice "${title}"?`)) return;
    try {
      await apiClient.delete(`/notices/${id}`);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice', error);
      alert('Error deleting notice');
    }
  };

  const filteredNotices = notices
    .filter(n => activeCategory === 'all' || n.audience === activeCategory)
    .filter(n => n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || n.content?.toLowerCase().includes(searchTerm.toLowerCase()));

  const parentNotices = notices.filter(n => n.audience === 'parents').length;
  const teacherNotices = notices.filter(n => n.audience === 'teachers').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">Notice Board</h1>
              <p className="date-text">Publish school-wide announcements and updates</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F59E0B', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)' }}>
            <Plus size={20} /> Create Notice
          </button>
        </header>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #FEF3C7' }}>
            <div style={{ padding: '1rem', background: '#FFFBEB', color: '#D97706', borderRadius: '1rem' }}>
              <Megaphone size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#D97706', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Notices</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#92400E', fontSize: '1.75rem', fontWeight: 900 }}>{notices.length}</h3>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #E0E7FF' }}>
            <div style={{ padding: '1rem', background: '#EEF2FF', color: '#6366F1', borderRadius: '1rem' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6366F1', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>For Parents</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#312E81', fontSize: '1.75rem', fontWeight: 900 }}>{parentNotices}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid #D1FAE5' }}>
            <div style={{ padding: '1rem', background: '#ECFDF5', color: '#059669', borderRadius: '1rem' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#059669', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>For Teachers</p>
              <h3 style={{ margin: '0.25rem 0 0 0', color: '#064E3B', fontSize: '1.75rem', fontWeight: 900 }}>{teacherNotices}</h3>
            </div>
          </div>
        </div>

        {/* Toolbar (Filters & Search) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'parents', 'teachers', 'students'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '99px', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  textTransform: 'capitalize',
                  border: `1px solid ${activeCategory === cat ? '#F59E0B' : '#E2E8F0'}`, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  background: activeCategory === cat ? '#F59E0B' : 'white', 
                  color: activeCategory === cat ? 'white' : '#64748B' 
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-box" style={{ width: '300px', background: 'white', border: '1px solid #E2E8F0' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search notices..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Notice Feed */}
        {loading ? (
          <div className="flex-center py-8 text-muted">Loading notices...</div>
        ) : filteredNotices.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {filteredNotices.map((notice) => (
              <div key={notice.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Megaphone size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.3 }}>{notice.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          <Calendar size={12} /> {notice.date ? new Date(notice.date).toLocaleDateString() : ''}
                        </span>
                        {notice.audience && notice.audience !== 'all' && (
                          <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            {notice.audience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', flexGrow: 1, marginBottom: '1rem', border: '1px solid #F1F5F9' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {notice.content}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  <button onClick={() => openEditModal(notice)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#F1F5F9', color: '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(notice.id, notice.title)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Bell size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No notices found</h3>
            <p style={{ margin: 0, color: '#94A3B8' }}>Try changing the audience filter or create a new notice.</p>
          </div>
        )}

        {/* Add/Edit Notice Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: 0 }}>{isEditing ? 'Edit Notice' : 'Publish Notice'}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>School-wide announcements & updates</p>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Notice Title *</label>
                    <input type="text" name="title" className="input-field" placeholder="e.g. Diwali Holidays" value={formData.title} onChange={handleInputChange} required style={{ background: '#F8FAFC' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Target Audience</label>
                      <select name="audience" className="input-field" value={formData.audience} onChange={handleInputChange} style={{ background: '#F8FAFC' }}>
                        <option value="all">All (School-wide)</option>
                        <option value="parents">Parents Only</option>
                        <option value="teachers">Teachers Only</option>
                        <option value="students">Students Only</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Date *</label>
                      <input type="date" name="date" className="input-field" value={formData.date} onChange={handleInputChange} required style={{ background: '#F8FAFC' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Notice Content *</label>
                    <textarea 
                      name="content" 
                      className="input-field" 
                      placeholder="Enter the full announcement details here..." 
                      value={formData.content} 
                      onChange={handleInputChange} 
                      required 
                      rows={5}
                      style={{ background: '#F8FAFC', resize: 'vertical' }} 
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#F59E0B', padding: '0.8rem 2rem', fontSize: '1rem', border: 'none' }}>
                    {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Publish Notice')}
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

export default NoticeManagement;
