import React, { useState } from 'react';
import apiClient from '../api/client';
import { GraduationCap, CheckCircle2, User, Heart, Send, Sparkles } from 'lucide-react';

const PublicEnquiryPage: React.FC = () => {
  const [formData, setFormData] = useState({
    child_name: '',
    child_dob: '',
    child_age: '',
    class_interested: 'Nursery',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_address: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.child_name.trim() || !formData.parent_name.trim() || !formData.parent_phone.trim()) {
      alert('Please fill all required fields: Child Name, Parent Name, and Mobile Number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await apiClient.post('/enquiries/public', {
        child_name: formData.child_name,
        child_dob: formData.child_dob || null,
        child_age: formData.child_age || null,
        class_interested: formData.class_interested,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        parent_email: formData.parent_email || null,
        remarks: `${formData.parent_address ? `Address: ${formData.parent_address}. ` : ''}${formData.remarks || ''}`.trim() || null,
        lead_source: 'QR Code / Online Enquiry'
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 50%, #ECFDF5 100%)',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      padding: '2rem 1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: '#FFFFFF',
        borderRadius: '1.25rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            marginBottom: '0.75rem',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <GraduationCap size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            EduNeev Kids International
          </h1>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.95rem', opacity: 0.9, fontWeight: 500 }}>
            Admission Enquiry & Registration Form 🎒
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 800,
            marginTop: '0.75rem'
          }}>
            <Sparkles size={14} /> Academic Year 2026 - 2027 Admissions Open!
          </div>
        </div>

        {submitted ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={44} />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.5rem', fontWeight: 900 }}>
              Enquiry Received Successfully!
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Thank you, <strong>{formData.parent_name}</strong>. We have received your admission enquiry for <strong>{formData.child_name}</strong>. Our admissions counselor will contact you shortly on <strong>{formData.parent_phone}</strong>.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  child_name: '',
                  child_dob: '',
                  child_age: '',
                  class_interested: 'Nursery',
                  parent_name: '',
                  parent_phone: '',
                  parent_email: '',
                  parent_address: '',
                  remarks: '',
                });
              }}
              style={{
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.75rem 1.5rem' }}>
            {errorMessage && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                {errorMessage}
              </div>
            )}

            {/* Child Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4F46E5', fontWeight: 800, fontSize: '0.9rem' }}>
                <Heart size={18} /> CHILD INFORMATION
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Child's Full Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="child_name"
                    value={formData.child_name}
                    onChange={handleChange}
                    placeholder="e.g. Aarav Patil"
                    required
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      Class Interested In
                    </label>
                    <select
                      name="class_interested"
                      value={formData.class_interested}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem', background: 'white' }}
                    >
                      <option value="Playgroup">Playgroup (1.5 - 2.5 yrs)</option>
                      <option value="Nursery">Nursery (2.5 - 3.5 yrs)</option>
                      <option value="Jr KG">Jr KG (3.5 - 4.5 yrs)</option>
                      <option value="Sr KG">Sr KG (4.5 - 5.5 yrs)</option>
                      <option value="Daycare">Daycare (Full / Half Day)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="child_dob"
                      value={formData.child_dob}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Details */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669', fontWeight: 800, fontSize: '0.9rem' }}>
                <User size={18} /> PARENT / GUARDIAN DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Parent / Guardian Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patil"
                    required
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      Mobile Number <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      required
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleChange}
                      placeholder="e.g. parent@gmail.com"
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Residential Area / Address
                  </label>
                  <input
                    type="text"
                    name="parent_address"
                    value={formData.parent_address}
                    onChange={handleChange}
                    placeholder="e.g. Chinchwad / Ravet / Nigdi, Pune"
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Questions / Special Requests
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any specific questions regarding transport, timings, food or fees..."
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                color: 'white',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
              }}
            >
              {submitting ? 'Submitting Enquiry...' : <><Send size={18} /> Submit Admission Enquiry</>}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.75rem' }}>
              🔒 Your details are secure and used only for EduNeev preschool admission communication.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicEnquiryPage;
