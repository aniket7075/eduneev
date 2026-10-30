import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import apiClient from '../../api/client';
import { Activity, ArrowLeft, ShieldCheck, Heart, AlertCircle, Plus, Send, CheckCircle2, Clock, Stethoscope, X } from 'lucide-react';
import '../admin/Dashboard.css';

interface SickReport {
  id: string;
  illnessType: string;
  startDate: string;
  restDays: string;
  symptoms: string;
  requestedCallback: boolean;
  status: 'School Notified' | 'Acknowledged by Teacher' | 'Recovered';
  createdAt: string;
}

const ParentHealth: React.FC = () => {
  const navigate = useNavigate();
  const [healthRecords, setHealthRecords] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for Sick Report
  const [illnessType, setIllnessType] = useState('Fever / Flu');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [restDays, setRestDays] = useState('1 to 2 Days');
  const [symptoms, setSymptoms] = useState('');
  const [requestedCallback, setRequestedCallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sickReports, setSickReports] = useState<SickReport[]>([]);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const childName = loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'Child');

  const fetchHealthRecords = async () => {
    try {
      const studentId = loggedUser?.student_id || loggedUser?.id || '';
      const response = await apiClient.get(`/health/${studentId}`).catch(() => null);
      if (response?.data) {
        setHealthRecords(response.data.data);
        if (Array.isArray(response.data.sick_reports)) {
          setSickReports(response.data.sick_reports);
        }
      }
    } catch (err) {
      console.error('Failed to fetch parent health records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthRecords();
    const interval = setInterval(fetchHealthRecords, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenReportModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitSickReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const studentId = loggedUser?.student_id || healthRecords?.student_id;
      const response = await apiClient.post('/health/sick-report', {
        student_id: studentId,
        illnessType,
        startDate,
        restDays,
        symptoms: symptoms.trim() || 'Parent reported child feeling unwell and resting at home.',
        requestedCallback
      });

      if (response?.data?.data) {
        setSickReports(prev => [response.data.data, ...prev.filter(p => p.id !== response.data.data.id)]);
      }
      setIsModalOpen(false);
      setSymptoms('');
      setSuccessMsg(`🚨 School and Class Teacher have been notified in real-time that ${childName} is unwell!`);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      console.error('Failed to submit sick report', err);
      alert(err.response?.data?.error || 'Failed to submit sick report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
                <Activity color="#EC4899" size={30} />
                Health & Medical Profile
              </h1>
              <p className="date-text" style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                Medical records & direct sick notification system for {childName}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenReportModal}
            style={{
              background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '0.85rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <AlertCircle size={20} />
            Report Child Unwell / Sick Note
          </button>
        </header>

        {/* Success Alert Banner */}
        {successMsg && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #6EE7B7',
            color: '#047857',
            padding: '1rem 1.25rem',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={24} color="#059669" />
            <div style={{ flex: 1 }}>{successMsg}</div>
          </div>
        )}

        {/* Child Health Summary Card */}
        <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FCE7F3', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900 }}>
                ❤️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>{childName}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Official School Medical Profile & Records</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/parent/leaves')}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              📄 Apply Leave Request
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>BLOOD GROUP</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                {healthRecords?.blood_group || 'Not recorded'}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>HEIGHT / WEIGHT</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                {healthRecords?.height ? `${healthRecords.height} cm` : '--'} / {healthRecords?.weight ? `${healthRecords.weight} kg` : '--'}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>ALLERGIES / NOTES</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: healthRecords?.allergies && healthRecords.allergies !== 'None reported' ? '#DC2626' : '#059669', marginTop: '2px' }}>
                {healthRecords?.allergies || 'None reported'}
              </div>
            </div>
          </div>
        </div>

        {/* Parent Reported Sick Notes Section */}
        <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={22} color="#E11D48" />
                Reported Illness & Sick Notes History
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                Notifications sent by parent directly to class teacher and school administration
              </p>
            </div>

            <button
              onClick={handleOpenReportModal}
              style={{
                background: '#FFF1F2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.6rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Plus size={16} /> New Sick Note
            </button>
          </div>

          {sickReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAFC', borderRadius: '0.85rem', color: '#64748B', fontWeight: 700 }}>
              👍 No sick notes reported recently. {childName} is doing great!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {sickReports.map((report) => (
                <div key={report.id} style={{
                  background: '#FFF1F2',
                  border: '1px solid #FFE4E6',
                  borderRadius: '1rem',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>🌡️</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#9F1239' }}>
                        {report.illnessType}
                      </h4>
                      <span style={{ fontSize: '0.75rem', background: '#FFE4E6', color: '#BE123C', padding: '0.15rem 0.6rem', borderRadius: '999px', fontWeight: 800 }}>
                        {report.restDays} Rest
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        background: report.status === 'Acknowledged by Teacher' ? '#DCFCE7' : '#FEF3C7',
                        color: report.status === 'Acknowledged by Teacher' ? '#15803D' : '#92400E',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <CheckCircle2 size={14} /> {report.status}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#4C0519', fontWeight: 600 }}>
                    "{report.symptoms}"
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#9F1239', fontWeight: 700, paddingTop: '0.4rem', borderTop: '1px dashed #FECDD3' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} /> Reported: {report.createdAt} (Starting {report.startDate})
                    </span>
                    {report.requestedCallback && (
                      <span style={{ background: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #FECDD3', color: '#E11D48' }}>
                        📞 Callback Requested from Teacher
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Modal: Report Child Unwell / Health Incident */}
        {isModalOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                color: 'white',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={24} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>Report Child Unwell / Sick Note</h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Send urgent health update to school & teacher</span>
                  </div>
                </div>
                <button
                  onClick={handleCloseReportModal}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmitSickReport} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    Select Illness / Health Issue *
                  </label>
                  <select
                    value={illnessType}
                    onChange={(e) => setIllnessType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      borderRadius: '0.65rem',
                      border: '1.5px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      outline: 'none',
                      background: '#F8FAFC'
                    }}
                  >
                    <option value="Fever / Flu">🌡️ Fever / Flu</option>
                    <option value="Cold & Cough">🤧 Cold & Severe Cough</option>
                    <option value="Stomach Ache / Infection">🤢 Stomach Ache / Infection</option>
                    <option value="Physical Injury / Sprain">🩹 Physical Injury / Sprain</option>
                    <option value="Viral / Infectious Illness">💊 Infectious Illness (Chickenpox, Conjunctivitis)</option>
                    <option value="Doctor Visit / Checkup">🏥 Scheduled Doctor Visit</option>
                    <option value="General Feeling Unwell">❓ General Feeling Unwell</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '0.65rem',
                        border: '1.5px solid #CBD5E1',
                        fontWeight: 700,
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                      Expected Rest *
                    </label>
                    <select
                      value={restDays}
                      onChange={(e) => setRestDays(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '0.65rem',
                        border: '1.5px solid #CBD5E1',
                        fontWeight: 700,
                        fontSize: '0.88rem'
                      }}
                    >
                      <option value="1 Day">1 Day</option>
                      <option value="1 to 2 Days">1 to 2 Days</option>
                      <option value="3 Days">3 Days</option>
                      <option value="1 Week">1 Week</option>
                      <option value="Until Doctor Clears">Until Doctor Clears</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    Symptoms & Note to Class Teacher *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write details e.g. Child has high fever, doctor advised rest & medication. Will keep school updated."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.65rem',
                      border: '1.5px solid #CBD5E1',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '0.75rem 1rem', borderRadius: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="checkbox"
                    id="reqCall"
                    checked={requestedCallback}
                    onChange={(e) => setRequestedCallback(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="reqCall" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9F1239', cursor: 'pointer' }}>
                    Request Class Teacher / School Staff to Call Parent Back 📞
                  </label>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCloseReportModal}
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      padding: '0.7rem 1.25rem',
                      borderRadius: '0.65rem',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1.4rem',
                      borderRadius: '0.65rem',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
                    }}
                  >
                    <Send size={16} />
                    {submitting ? 'Sending...' : 'Submit Sick Note to School'}
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

export default ParentHealth;
