import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { FileOutput, Check, X, Calendar, ArrowLeft, RefreshCcw, User, Users, GraduationCap } from 'lucide-react';
import './Directory.css';

const LeaveApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff');
  const [staffRequests, setStaffRequests] = useState<any[]>([]);
  const [studentRequests, setStudentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'owner';
  const isAdmin = isSuperAdmin || userRole === 'school_admin';
  const isTeacher = userRole === 'teacher';

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const [hrRes, studentRes] = await Promise.all([
        apiClient.get('/hr/leaves').catch(() => ({ data: [] })),
        apiClient.get('/leaves').catch(() => ({ data: [] }))
      ]);
      setStaffRequests(hrRes.data?.data || hrRes.data || []);
      setStudentRequests(studentRes.data?.data || studentRes.data || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      setStaffRequests([]);
      setStudentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    if (isTeacher) {
      setActiveTab('student');
    }
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      if (activeTab === 'staff') {
        await apiClient.put(`/hr/leaves/${id}/status`, { status: newStatus.toLowerCase() });
        setStaffRequests(staffRequests.map(req => 
          req.id === id ? { ...req, status: newStatus } : req
        ));
      } else {
        await apiClient.put(`/leaves/${id}/status`, { status: newStatus.toLowerCase() });
        setStudentRequests(studentRequests.map(req => 
          req.id === id ? { ...req, status: newStatus.toLowerCase() } : req
        ));
      }
      alert(`Leave request marked as ${newStatus}!`);
    } catch (error) {
      console.error('Failed to update leave status:', error);
      alert('Failed to update leave status');
    }
  };

  const currentList = activeTab === 'staff' ? staffRequests : studentRequests;
  const filteredRequests = currentList.filter(r => filter === 'All' || (r.status || 'Pending').toLowerCase() === filter.toLowerCase());

  // Modal for Applying Staff / Teacher Leave
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApplyLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert('Please fill in start date, end date, and reason for leave.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/hr/leaves', {
        employeeName: loggedUser?.firstName ? `${loggedUser.firstName} ${loggedUser.lastName || ''}`.trim() : (loggedUser?.email || 'Teacher'),
        first_name: loggedUser?.firstName || 'Class',
        last_name: loggedUser?.lastName || 'Teacher',
        role: loggedUser?.role || 'teacher',
        startDate,
        endDate,
        leaveType,
        reason: reason.trim(),
        status: 'Pending'
      });

      alert('✅ LEAVE APPLICATION SUBMITTED SUCCESSFULLY!\n\nYour leave request has been forwarded to the Principal / Admin for approval.');
      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Leave application submitted for approval.');
      setIsApplyModalOpen(false);
      fetchLeaves();
    } finally {
      setSubmitting(false);
    }
  };

  const pendingStaffCount = staffRequests.filter(r => (r.status || 'Pending').toLowerCase() === 'pending').length;
  const pendingStudentCount = studentRequests.filter(r => (r.status || 'Pending').toLowerCase() === 'pending').length;

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <FileOutput color="#4F46E5" size={28} /> Leave Approvals & Management
              </h1>
              <p className="date-text" style={{ margin: '0.2rem 0 0 0', color: '#64748B' }}>
                Review and approve staff time-offs & parent student leave requests
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(isTeacher || isAdmin) && (
              <button 
                onClick={() => setIsApplyModalOpen(true)}
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}
              >
                + Apply for Leave
              </button>
            )}
            <button 
              className="btn-primary" 
              onClick={fetchLeaves}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', boxShadow: 'none' }}
            >
              <RefreshCcw size={18} /> Refresh List
            </button>
          </div>
        </header>

        {/* Category Tabs: Staff Leaves vs Student Leaves */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('staff')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.6rem 1.2rem',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: activeTab === 'staff' ? '#4F46E5' : '#64748B',
                borderBottom: activeTab === 'staff' ? '3px solid #4F46E5' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <GraduationCap size={20} />
              👨‍🏫 Staff & Teacher Leaves
              {pendingStaffCount > 0 && (
                <span style={{ background: '#EF4444', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingStaffCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('student')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1.2rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeTab === 'student' ? '#0D9488' : '#64748B',
              borderBottom: activeTab === 'student' ? '3px solid #0D9488' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <Users size={20} />
            👶 Student Leaves (From Parents)
            {pendingStudentCount > 0 && (
              <span style={{ background: '#0D9488', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
                {pendingStudentCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '99px', fontWeight: 800, border: 'none', cursor: 'pointer',
                background: filter === f ? (activeTab === 'staff' ? '#6366F1' : '#0D9488') : '#F1F5F9',
                color: filter === f ? 'white' : '#475569',
                fontSize: '0.85rem', transition: 'all 0.2s', letterSpacing: '0.5px'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-center py-8 text-muted">Loading leave requests...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {filteredRequests.map((req) => {
              const status = req.status || 'Pending';
              let statusColor = '#F59E0B'; // Pending (Orange)
              let statusBg = '#FEF3C7';
              if (status.toLowerCase() === 'approved') {
                statusColor = '#10B981'; // Green
                statusBg = '#D1FAE5';
              } else if (status.toLowerCase() === 'rejected') {
                statusColor = '#EF4444'; // Red
                statusBg = '#FEE2E2';
              }

              const isStaff = activeTab === 'staff';
              const nameTitle = isStaff 
                ? (req.first_name ? `${req.first_name} ${req.last_name}` : req.employeeName || 'Staff Member')
                : (req.student_name || 'Student');
              const subtitle = isStaff
                ? (req.role_name || req.role || 'Teacher / Staff')
                : `Class: ${req.grade || '-'} • Adm: ${req.admission_number || '-'}`;

              const canApprove = isStaff ? isAdmin : (isAdmin || isTeacher);

              return (
                <div key={req.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `6px solid ${statusColor}`, background: 'white', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isStaff ? '#EEF2FF' : '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isStaff ? '#4F46E5' : '#0D9488', fontWeight: 900, fontSize: '1.2rem' }}>
                        {nameTitle?.[0] || 'U'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#1E293B', fontSize: '1.05rem', fontWeight: 900 }}>{nameTitle}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>{subtitle}</span>
                      </div>
                    </div>
                    
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem', 
                      fontWeight: 900,
                      background: statusBg,
                      color: statusColor,
                      textTransform: 'uppercase'
                    }}>
                      {status}
                    </span>
                  </div>
                  
                  <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      <Calendar size={14} /> Leave Duration
                    </div>
                    <div style={{ fontWeight: 800, color: '#1E293B', marginBottom: '0.75rem' }}>
                      {new Date(req.start_date || req.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} 
                      {' - '} 
                      {new Date(req.end_date || req.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    
                    {!isStaff && req.parent_name && (
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                        <strong>Parent:</strong> {req.parent_name} {req.contact_number ? `(${req.contact_number})` : ''}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Reason</div>
                    <div style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}>{req.reason || 'No reason provided.'}</div>
                  </div>
                  
                  {status.toLowerCase() === 'pending' && canApprove && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'Rejected')}
                        style={{ flex: 1, padding: '0.65rem', borderRadius: '0.75rem', fontWeight: 800, background: 'white', color: '#EF4444', border: '2px solid #EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                      >
                        <X size={18} /> Reject
                      </button>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'Approved')}
                        style={{ flex: 1, padding: '0.65rem', borderRadius: '0.75rem', fontWeight: 800, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                      >
                        <Check size={18} /> Approve
                      </button>
                    </div>
                  )}
                  
                </div>
              );
            })}
            
            {filteredRequests.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                <FileOutput size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '1.1rem' }}>No {filter.toLowerCase()} leave requests</h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>Everything is up to date in this tab!</p>
              </div>
            )}
          </div>
        )}

        {/* Apply Leave Modal */}
        {isApplyModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '480px', background: 'white', borderRadius: '1.2rem', padding: '1.75rem' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
                  📝 Apply for Leave
                </h2>
                <button className="icon-btn" onClick={() => setIsApplyModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleApplyLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    Leave Category / Type
                  </label>
                  <select 
                    value={leaveType} 
                    onChange={(e) => setLeaveType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', fontWeight: 700 }}
                  >
                    <option value="Casual Leave">Casual Leave (CL)</option>
                    <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                    <option value="Half Day Leave">Half Day Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                      Start Date
                    </label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      required 
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                      End Date
                    </label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      required 
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    Reason for Leave
                  </label>
                  <textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={3} 
                    placeholder="Provide specific reason for absence..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', outline: 'none', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsApplyModalOpen(false)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', background: 'white', fontWeight: 800, cursor: 'pointer', color: '#64748B' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
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

export default LeaveApprovals;
