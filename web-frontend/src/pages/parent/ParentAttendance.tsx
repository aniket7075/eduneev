import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import { ShieldCheck, ArrowLeft, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import '../admin/Dashboard.css';

const ParentAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childName = loggedUser?.childName || 'Child';

  const fetchAttendance = async () => {
    try {
      const response = await apiClient.get('/attendance');
      setAttendance(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch parent attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const presentCount = attendance.filter(a => a.status?.toLowerCase() === 'present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

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
                <ShieldCheck color="#10B981" size={30} />
                Attendance Tracker
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Daily check-in and attendance history for {childName}
              </p>
            </div>
          </div>
        </header>

        {/* Summary Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>ATTENDANCE RATE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '0.25rem' }}>{attendanceRate}%</div>
          </div>

          <div style={{ background: '#ECFDF5', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #A7F3D0' }}>
            <div style={{ color: '#047857', fontSize: '0.85rem', fontWeight: 700 }}>DAYS PRESENT</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '0.25rem' }}>{presentCount} Days</div>
          </div>

          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1.1rem', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>TOTAL SCHOOL DAYS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '0.25rem' }}>{totalCount} Days</div>
          </div>
        </div>

        {/* Attendance Log Table */}
        <div style={{ background: 'white', borderRadius: '1.1rem', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
            Recent Attendance Log
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Loading attendance log...</div>
          ) : attendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              <Calendar size={40} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ margin: 0, fontWeight: 800 }}>No attendance records recorded yet</h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check-in Time</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record, idx) => {
                    const isPresent = record.status?.toLowerCase() === 'present';
                    const checkInTime = isPresent ? (record.in_time || record.check_in_time || '08:45 AM') : '-';
                    const displayRemarks = record.remarks && record.remarks !== 'Regular classroom attendance' ? record.remarks : '-';

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: '#0F172A' }}>
                          {record.date ? new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : `Day ${idx + 1}`}
                        </td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '999px', 
                            fontSize: '0.78rem', 
                            fontWeight: 800,
                            background: isPresent ? '#DCFCE7' : '#FEE2E2',
                            color: isPresent ? '#15803D' : '#DC2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            {isPresent ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td style={{ color: isPresent ? '#0F172A' : '#94A3B8', fontWeight: isPresent ? 700 : 500 }}>
                          {checkInTime}
                        </td>
                        <td style={{ color: displayRemarks !== '-' ? '#B91C1C' : '#64748B', fontWeight: displayRemarks !== '-' ? 700 : 500 }}>
                          {displayRemarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ParentAttendance;
