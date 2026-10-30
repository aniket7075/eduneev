import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import { Baby, ArrowLeft, Clock, Utensils, Moon } from 'lucide-react';
import '../admin/Dashboard.css';

const ParentDaycare: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childName = loggedUser?.childName || 'Child';

  const fetchDaycareLogs = async () => {
    try {
      const response = await apiClient.get('/daycare');
      setLogs(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch daycare logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaycareLogs();
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
                <Baby color="#06B6D4" size={30} />
                Daycare Routine & Meal Tracker
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Daily meals, nap times, washroom visits & activity logs for {childName}
              </p>
            </div>
          </div>
        </header>

        {/* Daycare Routine Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading daycare logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.2rem', border: '1px solid #E2E8F0' }}>
            <Baby size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontWeight: 800 }}>No Daycare Logs Recorded Today</h3>
            <p style={{ color: '#64748B', margin: 0 }}>Daily meal and nap updates from the daycare teacher will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '1.1rem', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>📅 {log.date ? new Date(log.date).toLocaleDateString() : 'Today'}</span>
                  <span style={{ background: '#ECFEFF', color: '#0891B2', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>Daycare Log</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <Utensils size={16} color="#F59E0B" />
                    <span><strong>Snacks/Meals:</strong> {log.snacks_notes || log.meal || 'Ate full meal'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <Moon size={16} color="#6366F1" />
                    <span><strong>Nap Time:</strong> {log.nap_time || '1:30 PM - 3:00 PM (1.5 hrs)'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <Clock size={16} color="#10B981" />
                    <span><strong>Learning Activity:</strong> {log.learning_activity || log.activity || 'Sensory play & story telling'}</span>
                  </div>
                </div>

                {log.parent_message && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
                    💬 Teacher note: "{log.parent_message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentDaycare;
