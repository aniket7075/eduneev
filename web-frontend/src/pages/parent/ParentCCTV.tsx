import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import { Video, ArrowLeft, ShieldCheck, Lock, Play, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import '../admin/Dashboard.css';

interface Camera {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  status: 'active' | 'offline';
}

const ParentCCTV: React.FC = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childClass = loggedUser?.className || loggedUser?.grade || 'Classroom';
  const childName = loggedUser?.childName || 'Child';

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/cctv');
      const camList: Camera[] = res.data?.data || res.data || [];
      setCameras(camList);
      if (camList.length > 0) {
        // Prefer a camera matching the child's class or default to first
        const matched = camList.find(c => 
          c.name.toLowerCase().includes(childClass.toLowerCase()) || 
          c.location.toLowerCase().includes(childClass.toLowerCase())
        );
        setSelectedCamera(matched || camList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch CCTV cameras', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
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
                <Video color="#EF4444" size={30} />
                Live Classroom CCTV Stream
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Secure real-time video feed for {childName} ({childClass})
              </p>
            </div>
          </div>

          <button 
            onClick={fetchCameras} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1' }}
          >
            <RefreshCw size={16} /> Refresh Feeds
          </button>
        </header>

        {/* Live Stream Box */}
        <div style={{ background: '#0F172A', borderRadius: '1.25rem', padding: '2rem', textAlign: 'center', color: 'white', border: '1px solid #1E293B', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginBottom: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#EF4444', padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span> LIVE SECURE STREAM
            </div>

            {selectedCamera && (
              <span style={{ color: '#94A3B8', fontSize: '0.88rem', fontWeight: 700 }}>
                🎥 {selectedCamera.name} • {selectedCamera.location}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              Loading secure streams...
            </div>
          ) : selectedCamera ? (
            <div style={{ width: '100%', height: '360px', background: '#1E293B', borderRadius: '1rem', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
              {selectedCamera.stream_url && (selectedCamera.stream_url.startsWith('http') || selectedCamera.stream_url.includes('embed')) ? (
                <iframe 
                  src={selectedCamera.stream_url} 
                  title={selectedCamera.name}
                  style={{ width: '100%', height: '100%', border: 'none' }} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={32} color="#EF4444" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedCamera.name}
                    </h3>
                    <p style={{ margin: '0.4rem 0 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
                      Location: {selectedCamera.location} • Status: <span style={{ color: selectedCamera.status === 'active' ? '#10B981' : '#F59E0B', fontWeight: 800 }}>{selectedCamera.status.toUpperCase()}</span>
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                      Operating Hours: 9:00 AM - 1:30 PM (Preschool Schedule)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '300px', background: '#1E293B', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '1px dashed #334155' }}>
              <Lock size={44} color="#94A3B8" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                  No Active Classroom Cameras Found
                </h3>
                <p style={{ margin: '0.4rem 0 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
                  The school administrator has not enabled camera feeds for this session. Please check with the school office.
                </p>
              </div>
            </div>
          )}

          {/* Camera Selection Grid if multiple cameras exist */}
          {cameras.length > 1 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {cameras.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  style={{
                    background: selectedCamera?.id === cam.id ? '#3B82F6' : '#1E293B',
                    color: 'white',
                    border: '1px solid #334155',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Eye size={14} /> {cam.name}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.82rem', color: '#94A3B8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ShieldCheck size={16} color="#10B981" /> 256-bit Encrypted Stream</span>
            <span>•</span>
            <span>Watermarked for Privacy Protection</span>
            <span>•</span>
            <span>Parent Access View Only</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentCCTV;
