import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Plus, ArrowLeft, Users, Clock, Calendar as CalendarIcon, X } from 'lucide-react';
import './Directory.css';

interface PTMSchedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

const PTMSchedulerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<PTMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: '', start_time: '', end_time: '', slot_duration: 15 });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/ptm');
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch PTM schedules', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/ptm', formData);
      setIsAddModalOpen(false);
      setFormData({ date: '', start_time: '', end_time: '', slot_duration: 15 });
      fetchSchedules();
    } catch (error) {
      console.error('Failed to create PTM schedule', error);
      alert('Failed to schedule PTM');
    }
  };

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">PTM Scheduler</h1>
              <p className="date-text">Manage Parent-Teacher Meetings</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={20} /> Schedule PTM
          </button>
        </header>

        <div className="glass-card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
          {loading ? (
            <div className="flex-center py-8">Loading PTM schedules...</div>
          ) : schedules.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {schedules.map((schedule) => (
                <div key={schedule.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: '#CCFBF1', padding: '0.75rem', borderRadius: '50%', color: '#0F766E' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Parent Teacher Meeting</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#0F766E', fontWeight: 600 }}>
                          {new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Clock size={18} />
                      <span style={{ fontWeight: 600 }}>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                    </div>
                    <div style={{ background: '#F0FDFA', color: '#0F766E', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {schedule.slot_duration} min slots
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-center" style={{ flexDirection: 'column', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <CalendarIcon size={64} style={{ color: '#CCFBF1', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No PTM scheduled yet.</h3>
              <p>Click "Schedule PTM" to create a new meeting.</p>
            </div>
          )}
        </div>

        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Schedule PTM</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="date" className="input-field" value={formData.date} onChange={handleInputChange} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" name="start_time" className="input-field" value={formData.start_time} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" name="end_time" className="input-field" value={formData.end_time} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Slot Duration (minutes)</label>
                  <input type="number" name="slot_duration" className="input-field" value={formData.slot_duration} onChange={handleInputChange} min="5" max="60" required />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Schedule Meeting</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PTMSchedulerManagement;
