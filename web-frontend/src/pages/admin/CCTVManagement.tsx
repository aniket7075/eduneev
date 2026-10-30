import React, { useState, useEffect, useCallback } from 'react';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient from '../../api/client';
import { Search, Plus, Edit2, Trash2, X, Video, Camera as CameraIcon, AlertCircle, PlayCircle, MapPin } from 'lucide-react';
import './Directory.css';

interface Camera {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  status: 'active' | 'offline';
  created_at?: string;
}

const CCTVManagement: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Split View State
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [cameraId, setCameraId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'offline'>('active');

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/cctv');
      setCameras(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedCamera(prev => prev || response.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch cameras', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const filteredCameras = cameras.filter(cam => 
    cam.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cam.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setCameraId('');
    setName('');
    setLocation('');
    setStreamUrl('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (cam: Camera) => {
    setCameraId(cam.id);
    setName(cam.name);
    setLocation(cam.location);
    setStreamUrl(cam.stream_url);
    setStatus(cam.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, camName: string) => {
    if (!window.confirm(`Are you sure you want to delete camera "${camName}"?`)) return;
    try {
      await apiClient.delete(`/cctv/${id}`);
      if (selectedCamera?.id === id) setSelectedCamera(null);
      fetchCameras();
    } catch (error: any) {
      console.error('Failed to delete camera', error);
      alert(error.response?.data?.error || 'Could not delete camera');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, location, stream_url: streamUrl, status };
      
      if (cameraId) {
        await apiClient.put(`/cctv/${cameraId}`, payload);
      } else {
        await apiClient.post('/cctv', payload);
      }
      setIsModalOpen(false);
      fetchCameras();
    } catch (error: any) {
      console.error('Failed to save camera', error);
      alert(error.response?.data?.error || 'Could not save camera details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <header className="header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div>
            <h1 className="welcome-text" style={{ color: '#0F172A' }}>CCTV Surveillance</h1>
            <p className="date-text">Monitor campus live feeds</p>
          </div>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F172A', border: 'none' }}>
            <Plus size={20} /> Add Camera
          </button>
        </header>

        {/* Split View Container */}
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: Camera List */}
          <div className="glass-card" style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div className="search-bar" style={{ margin: 0, background: 'white' }}>
                <Search size={20} className="search-icon" color="#94A3B8" />
                <input 
                  type="text" 
                  placeholder="Search cameras or locations..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
              {loading ? (
                <div className="flex-center py-4 text-muted">Loading cameras...</div>
              ) : filteredCameras.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredCameras.map((cam) => (
                    <div 
                      key={cam.id}
                      onClick={() => setSelectedCamera(cam)}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '0.75rem', 
                        border: selectedCamera?.id === cam.id ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                        background: selectedCamera?.id === cam.id ? '#EFF6FF' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CameraIcon size={18} color={selectedCamera?.id === cam.id ? '#3B82F6' : '#64748B'} />
                          <h4 style={{ margin: 0, color: '#1E293B', fontWeight: 700, fontSize: '0.95rem' }}>{cam.name}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: cam.status === 'active' ? '#22C55E' : '#EF4444' 
                          }} />
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cam.status === 'active' ? '#22C55E' : '#EF4444', textTransform: 'uppercase' }}>
                            {cam.status}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem' }}>
                        <MapPin size={14} /> {cam.location}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                         <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(cam); }} 
                          className="icon-btn" 
                          style={{ padding: '0.3rem', border: '1px solid #E2E8F0', background: 'white', color: '#3B82F6', flex: 1, borderRadius: '0.4rem' }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(cam.id, cam.name); }} 
                          className="icon-btn" 
                          style={{ padding: '0.3rem', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', flex: 1, borderRadius: '0.4rem' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Video size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                  <p style={{ margin: 0, color: '#64748B' }}>No cameras found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Feed */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            {selectedCamera ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#020617' }}>
                
                {/* Player Header */}
                <div style={{ padding: '1.25rem', background: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      padding: '0.5rem', 
                      borderRadius: '0.5rem' 
                    }}>
                      <CameraIcon size={24} color="white" />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{selectedCamera.name}</h2>
                      <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={12} /> {selectedCamera.location}
                      </p>
                    </div>
                  </div>
                  
                  {selectedCamera.status === 'active' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.1)', padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                      <span style={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle size={14} color="#EF4444" />
                      <span style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>OFFLINE</span>
                    </div>
                  )}
                </div>

                {/* Video Player Area */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedCamera.status === 'active' ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      {/* Using iframe with autoplay and mute as a simulated view. Usually RTSP requires a WebRTC component */}
                      <video 
                        src={selectedCamera.stream_url} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        autoPlay 
                        muted 
                        loop
                        controls
                        poster="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=1000"
                      />
                      {/* Watermark/OSD overlay */}
                      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'rgba(255,255,255,0.7)', textShadow: '1px 1px 2px black', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                        CAM: {selectedCamera.name.toUpperCase()} <br/>
                        {new Date().toLocaleString()}
                      </div>
                      <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'red', textShadow: '1px 1px 2px black', fontWeight: 'bold' }}>
                        ● REC
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#475569' }}>
                      <Video size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <h3 style={{ margin: 0, color: '#94A3B8' }}>Camera Offline</h3>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Check network connection or power supply.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <PlayCircle size={40} color="#94A3B8" />
                </div>
                <h2 style={{ margin: 0, color: '#1E293B', fontSize: '1.5rem' }}>No Camera Selected</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748B', maxWidth: '300px', textAlign: 'center' }}>
                  Select a camera from the list on the left to view its live feed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal for Add/Edit */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>
                    {cameraId ? 'Edit Camera' : 'Add New Camera'}
                  </h2>
                </div>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Camera Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Main Gate Cam" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Location *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Building A Entrance" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stream URL (RTSP / HLS / MP4) *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. https://domain.com/stream.m3u8" 
                      value={streamUrl} 
                      onChange={(e) => setStreamUrl(e.target.value)}
                      required 
                    />
                    <small style={{ color: '#64748B', display: 'block', marginTop: '0.25rem' }}>Provide the video stream link for the web player.</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="input-field"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'offline')}
                    >
                      <option value="active">Active</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#0F172A', border: 'none' }}>
                    {saving ? 'Saving...' : 'Save Camera'}
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

export default CCTVManagement;
