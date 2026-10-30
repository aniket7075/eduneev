import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Building2, X, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [enquiryForm, setEnquiryForm] = useState({
    child_name: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    class_interested: 'Nursery',
    center_preferred: 'Chinchwad - Sambhajinagar',
    remarks: ''
  });

  const openEnquiryModal = () => {
    setSubmittedSuccess(false);
    setEnquiryForm({
      child_name: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      class_interested: 'Nursery',
      center_preferred: 'Chinchwad - Sambhajinagar',
      remarks: ''
    });
    setIsEnquiryModalOpen(true);
  };

  const handlePublicEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.child_name || !enquiryForm.parent_name || !enquiryForm.parent_phone) {
      alert("Please fill in Child's Name, Parent's Name, and Phone Number");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/enquiries/public', {
        child_name: enquiryForm.child_name,
        parent_name: enquiryForm.parent_name,
        parent_phone: enquiryForm.parent_phone,
        parent_email: enquiryForm.parent_email || undefined,
        class_interested: enquiryForm.class_interested,
        lead_source: 'Website Online Form',
        remarks: `Center Preferred: ${enquiryForm.center_preferred}. ${enquiryForm.remarks || ''}`
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit enquiry. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <Link to="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logopre.png" alt="EduNeev Kids Preschool Logo" style={{ height: '52px', width: 'auto', borderRadius: '8px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--kid-dark)', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', lineHeight: 1.1 }}>EduNeev Kids</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--kid-orange)', letterSpacing: '0.3px' }}>Preschool • Since 2013</span>
          </div>
        </Link>
        <div className="landing-nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#centers">Our Centers</a>
          <a href="#programs">Programs</a>
          <a href="#contact">Contact Us</a>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={openEnquiryModal} className="btn-kid btn-primary-kid" style={{ background: '#0D9488' }}>
            Admission Enquiry 📝
          </button>
          <Link to="/login" className="btn-kid btn-secondary-kid">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div style={{ color: 'var(--kid-orange)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✏️</span> Kindergarten & Daycare Preschool
          </div>
          <h1 className="title-primary">
            EduNeev Kids Preschool
          </h1>
          <p className="text-subtitle">
            Welcome to EduNeev Kids Preschool — A Foundation for the Future... Since 2013. Nurturing young minds in a safe, loving, and joyful environment across Chinchwad, Chikhali & Dudulgaon.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={openEnquiryModal} className="btn-kid btn-primary-kid" style={{ padding: '0.9rem 1.8rem', fontSize: '1.1rem' }}>
              Apply for Admission 📝
            </button>
            <a href="#centers" className="btn-kid btn-secondary-kid">Explore Our Centers</a>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-blob"></div>
          <img 
            src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800&auto=format&fit=crop" 
            alt="Happy EduNeev preschool students learning" 
            className="hero-image"
          />
        </div>
      </section>

      {/* Highlights Banner from Official Pamphlet */}
      <section id="about" style={{ background: '#FFFBEB', padding: '2rem 1rem', borderTop: '3px dashed #FCD34D', borderBottom: '3px dashed #FCD34D' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.4rem 1rem', borderRadius: '99px', fontWeight: 800, fontSize: '0.85rem' }}>
            🎉 ADMISSIONS OPEN FOR 2025 - 2026
          </span>
          <h2 style={{ fontSize: '2rem', color: '#78350F', marginTop: '0.75rem', marginBottom: '1rem' }}>
            Playgroup • Nursery • LKG • UKG & Day Care
          </h2>
          <button onClick={openEnquiryModal} className="btn-kid btn-primary-kid" style={{ background: '#D97706', marginBottom: '1.5rem' }}>
            Fill Online Admission Enquiry Form 📝
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', textAlign: 'left' }}>
            {[
              { title: 'Loving & Caring Environment', icon: '❤️', bg: '#FEE2E2', color: '#991B1B' },
              { title: 'Child Friendly Infrastructure', icon: '🎨', bg: '#FEF3C7', color: '#92400E' },
              { title: 'Well Trained Teachers & Staff', icon: '👩‍🏫', bg: '#E0E7FF', color: '#3730A3' },
              { title: 'Highly Secured Classrooms with CCTV', icon: '📹', bg: '#FCE7F3', color: '#9D174D' },
              { title: 'Spacious Indoor & Outdoor Play Area', icon: '🛝', bg: '#D1FAE5', color: '#065F46' },
              { title: 'Splash Pool & Modern Teaching Aids', icon: '🌊', bg: '#CFFAFE', color: '#155E75' },
              { title: 'Disinfected Toilets & Washrooms', icon: '✨', bg: '#F3E8FF', color: '#6B21A8' },
              { title: 'Transport Facility Available', icon: '🚌', bg: '#FEF9C3', color: '#854D0E' },
            ].map((item, idx) => (
              <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FDE68A' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  {item.icon}
                </div>
                <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our 3 Preschool Centers */}
      <section id="centers" className="mission-vision-section" style={{ background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--kid-orange)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Visit Our Campuses
          </span>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--kid-dark)', marginTop: '0.5rem' }}>
            Our 3 Preschool Centers
          </h2>
          <p style={{ color: '#64748B', maxWidth: '650px', margin: '0.5rem auto 0', fontSize: '1.05rem' }}>
            Located conveniently across Chinchwad, Chikhali, and Dudulgaon to serve your family.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '2px solid #DBEAFE', background: 'white', position: 'relative' }}>
            <div style={{ background: '#EEF2FF', color: '#3B82F6', width: '50px', height: '50px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Building2 size={28} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', background: '#DBEAFE', padding: '4px 10px', borderRadius: '12px' }}>
              CENTER 1
            </span>
            <h3 style={{ fontSize: '1.5rem', color: '#1E293B', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Chinchwad Branch</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              RL-32, G Block, Near Sant Bahinabai Choudhary Zoo, Sambhajinagar, Chinchwad - 411019.
            </p>
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>CONTACT</span>
                <a href="tel:9889883033" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563EB' }}>📞 988 988 3033</a>
              </div>
              <button onClick={openEnquiryModal} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Enquire 📝
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '2px solid #FDE68A', background: 'white', position: 'relative' }}>
            <div style={{ background: '#FEF3C7', color: '#D97706', width: '50px', height: '50px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Building2 size={28} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '4px 10px', borderRadius: '12px' }}>
              CENTER 2
            </span>
            <h3 style={{ fontSize: '1.5rem', color: '#1E293B', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Chikhali Branch</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Pingale Chowk, Behind Imperial Hospital, Next to Shine Square, Gat No-1227, Chikhali - 411062.
            </p>
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>CONTACT</span>
                <a href="tel:9970841748" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D97706' }}>📞 9970 841 748</a>
              </div>
              <button onClick={openEnquiryModal} style={{ background: '#FFFBEB', color: '#D97706', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Enquire 📝
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '2px solid #A7F3D0', background: 'white', position: 'relative' }}>
            <div style={{ background: '#ECFDF5', color: '#059669', width: '50px', height: '50px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Building2 size={28} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '4px 10px', borderRadius: '12px' }}>
              CENTER 3
            </span>
            <h3 style={{ fontSize: '1.5rem', color: '#1E293B', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Dudulgaon Branch</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Survey No 64, Near Manthan Building, S.P College Road, Dudulgaon.
            </p>
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>CONTACT</span>
                <a href="tel:9960893010" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>📞 9960 893 010</a>
              </div>
              <button onClick={openEnquiryModal} style={{ background: '#ECFDF5', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Enquire 📝
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="programs-section">
        <div className="wave-top">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
        
        <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
          Programs We Offer<br/>Playgroup, Nursery, LKG, UKG & Day Care
        </h2>
        
        <div className="programs-grid" style={{ position: 'relative', zIndex: 10 }}>
          <div className="program-card">
            <img src="https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=400&auto=format&fit=crop" alt="Playgroup" />
            <h3 style={{ color: 'var(--kid-red)' }}>Playgroup</h3>
            <p style={{ fontWeight: 600, color: '#888', marginBottom: '1rem' }}>(1.5 - 2.5 years)</p>
            <p>Sensory exploration, motor skill enhancement, and fun group play activities.</p>
          </div>
          <div className="program-card">
            <img src="https://images.unsplash.com/photo-1544281679-62325c15e8df?q=80&w=400&auto=format&fit=crop" alt="Nursery" />
            <h3 style={{ color: 'var(--kid-green)' }}>Nursery</h3>
            <p style={{ fontWeight: 600, color: '#888', marginBottom: '1rem' }}>(2.5 - 3.5 years)</p>
            <p>Language building, social skills, creative arts, and foundational learning concepts.</p>
          </div>
          <div className="program-card">
            <img src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400&auto=format&fit=crop" alt="LKG / Jr KG" />
            <h3 style={{ color: 'var(--kid-teal)' }}>LKG (Jr. KG)</h3>
            <p style={{ fontWeight: 600, color: '#888', marginBottom: '1rem' }}>(3.5 - 4.5 years)</p>
            <p>Early phonics, number concepts, logical reasoning, and structured play sessions.</p>
          </div>
          <div className="program-card">
            <img src="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=400&auto=format&fit=crop" alt="UKG / Sr KG & Daycare" />
            <h3 style={{ color: 'var(--kid-orange)' }}>UKG & Day Care</h3>
            <p style={{ fontWeight: 600, color: '#888', marginBottom: '1rem' }}>(4.5 - 6 years)</p>
            <p>Primary school readiness, advanced vocabulary, interactive games, and full day daycare.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-details-section">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--kid-orange)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Get In Touch
          </span>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--kid-dark)', marginTop: '0.5rem' }}>
            Contact EduNeev Kids Preschool
          </h2>
          <p style={{ color: '#6C757D', maxWidth: '600px', margin: '0.5rem auto 0', fontSize: '1.05rem' }}>
            Reach out to any of our 3 centers for admissions, campus tours, or enquiries.
          </p>
        </div>

        <div className="contact-cards-grid">
          <div className="contact-card">
            <div className="contact-icon-box" style={{ backgroundColor: '#EEF2FF', color: 'var(--kid-blue)' }}>
              <Phone size={32} />
            </div>
            <h3>Chinchwad Center</h3>
            <p className="contact-highlight">
              <a href="tel:9889883033">+91 988 988 3033</a>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Sambhajinagar, Chinchwad</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon-box" style={{ backgroundColor: '#FEF3C7', color: 'var(--kid-orange)' }}>
              <Phone size={32} />
            </div>
            <h3>Chikhali Center</h3>
            <p className="contact-highlight">
              <a href="tel:9970841748">+91 9970 841 748</a>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Pingale Chowk, Chikhali</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon-box" style={{ backgroundColor: '#DCFCE7', color: 'var(--kid-green)' }}>
              <Phone size={32} />
            </div>
            <h3>Dudulgaon Center</h3>
            <p className="contact-highlight">
              <a href="tel:9960893010">+91 9960 893 010</a>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>S.P College Road, Dudulgaon</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="wave-footer">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
        <div className="footer-content" style={{ position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '2rem' }}>EduNeev Kids Preschool</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
            "A Foundation for the future... Since 2013"
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem', fontSize: '0.95rem' }}>
            <span>📍 Chinchwad (9889883033)</span>
            <span>📍 Chikhali (9970841748)</span>
            <span>📍 Dudulgaon (9960893010)</span>
          </div>
          <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
            © {new Date().getFullYear()} EduNeev Kids Preschool. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Public Online Admission Enquiry Form Modal */}
      {isEnquiryModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '1.5rem', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            
            <button onClick={() => setIsEnquiryModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
              <X size={20} />
            </button>

            {submittedSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '70px', height: '70px', background: '#D1FAE5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={42} />
                </div>
                <h2 style={{ fontSize: '1.75rem', color: '#0F172A', marginBottom: '0.75rem', fontWeight: 900 }}>Enquiry Submitted! 🎉</h2>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Thank you! We have received your admission enquiry for <strong>{enquiryForm.child_name}</strong>. Our EduNeev Kids admissions team will get in touch with you shortly.
                </p>
                <button onClick={() => setIsEnquiryModalOpen(false)} className="btn-kid btn-primary-kid" style={{ width: '100%' }}>
                  Done / Close
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                    ADMISSIONS OPEN 2025 - 2026
                  </span>
                  <h2 style={{ fontSize: '1.6rem', color: '#0F172A', margin: '0.5rem 0 0.2rem 0', fontWeight: 900 }}>Online Admission Enquiry</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Fill the form below and our counselor will call you</p>
                </div>

                <form onSubmit={handlePublicEnquirySubmit} style={{ display: 'grid', gap: '1rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Child's Name <span style={{color: 'red'}}>*</span></label>
                      <input 
                        type="text" 
                        required
                        value={enquiryForm.child_name}
                        onChange={e => setEnquiryForm({ ...enquiryForm, child_name: e.target.value })}
                        placeholder="Child's Full Name"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Program Interested</label>
                      <select 
                        value={enquiryForm.class_interested}
                        onChange={e => setEnquiryForm({ ...enquiryForm, class_interested: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem', background: 'white' }}
                      >
                        <option value="Playgroup">Playgroup (1.5 - 2.5 yrs)</option>
                        <option value="Nursery">Nursery (2.5 - 3.5 yrs)</option>
                        <option value="Jr KG">LKG / Jr KG (3.5 - 4.5 yrs)</option>
                        <option value="Sr KG">UKG / Sr KG (4.5 - 6 yrs)</option>
                        <option value="Daycare">Daycare</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Parent's Name <span style={{color: 'red'}}>*</span></label>
                      <input 
                        type="text" 
                        required
                        value={enquiryForm.parent_name}
                        onChange={e => setEnquiryForm({ ...enquiryForm, parent_name: e.target.value })}
                        placeholder="Father / Mother Name"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Mobile Number <span style={{color: 'red'}}>*</span></label>
                      <input 
                        type="tel" 
                        required
                        value={enquiryForm.parent_phone}
                        onChange={e => setEnquiryForm({ ...enquiryForm, parent_phone: e.target.value })}
                        placeholder="10-digit Mobile No."
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Email Address</label>
                      <input 
                        type="email" 
                        value={enquiryForm.parent_email}
                        onChange={e => setEnquiryForm({ ...enquiryForm, parent_email: e.target.value })}
                        placeholder="email@example.com"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Preferred Center</label>
                      <select 
                        value={enquiryForm.center_preferred}
                        onChange={e => setEnquiryForm({ ...enquiryForm, center_preferred: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem', background: 'white' }}
                      >
                        <option value="Chinchwad - Sambhajinagar">Chinchwad (Sambhajinagar)</option>
                        <option value="Chikhali">Chikhali (Pingale Chowk)</option>
                        <option value="Dudulgaon">Dudulgaon (S.P College Rd)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Questions / Remarks (Optional)</label>
                    <textarea 
                      rows={2} 
                      value={enquiryForm.remarks}
                      onChange={e => setEnquiryForm({ ...enquiryForm, remarks: e.target.value })}
                      placeholder="Any specific questions or preferred callback time..."
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem', resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="btn-kid btn-primary-kid"
                    style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Admission Enquiry 🚀'}
                  </button>

                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
