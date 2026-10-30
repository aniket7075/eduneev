import React from 'react';
import SmartSidebar from '../../components/SmartSidebar';
import { 
  Building2, Phone, MapPin, Award, ShieldCheck, Heart, 
  Sparkles, ExternalLink, Calendar, GraduationCap, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  const centers = [
    {
      name: 'Chinchwad Center',
      branch: 'Branch 1',
      address: 'RL-32, G Block, Near Sant Bahinabai Choudhary Zoo, Sambhajinagar, Chinchwad - 411019',
      phone: '+91 988 988 3033',
      color: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE'
    },
    {
      name: 'Chikhali Center',
      branch: 'Branch 2',
      address: 'Pingale Chowk, Behind Imperial Hospital, Next to Shine Square, Gat No-1227, Chikhali - 411062',
      phone: '+91 9970 841 748',
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A'
    },
    {
      name: 'Dudulgaon Center',
      branch: 'Branch 3',
      address: 'Survey No 64, Near Manthan Building, S.P College Road, Dudulgaon - 412105',
      phone: '+91 9960 893 010',
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0'
    }
  ];

  const features = [
    { title: 'Loving & Caring Environment', icon: '❤️', bg: '#FEE2E2', color: '#991B1B' },
    { title: 'Child-Friendly Infrastructure', icon: '🎨', bg: '#FEF3C7', color: '#92400E' },
    { title: 'Well-Trained Teachers & Staff', icon: '👩‍🏫', bg: '#E0E7FF', color: '#3730A3' },
    { title: 'Highly Secured Classrooms with CCTV', icon: '📹', bg: '#FCE7F3', color: '#9D174D' },
    { title: 'Spacious Indoor & Outdoor Play Area', icon: '🛝', bg: '#D1FAE5', color: '#065F46' },
    { title: 'Splash Pool & Modern Teaching Aids', icon: '🌊', bg: '#CFFAFE', color: '#155E75' },
    { title: 'Disinfected Toilets & Washrooms', icon: '✨', bg: '#F3E8FF', color: '#6B21A8' },
    { title: 'Safe Transport Facility Available', icon: '🚌', bg: '#FEF9C3', color: '#854D0E' }
  ];

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="welcome-text">About Us</h1>
              <p className="date-text">EduNeev Kids Preschool • A Foundation for the Future</p>
            </div>
          </div>
        </header>

        {/* Hero Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2.5rem 2rem', 
            borderRadius: '1.5rem', 
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)', 
            border: '2px solid #FCD34D',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.1)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <img 
                src="/logopre.png" 
                alt="EduNeev Logo" 
                style={{ height: '90px', width: 'auto', borderRadius: '16px', border: '2px solid #FCD34D', padding: '4px', background: 'white' }} 
              />
              <div>
                <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '99px', fontWeight: 800, fontSize: '0.85rem' }}>
                  ESTABLISHED SINCE 2013
                </span>
                <h2 style={{ fontSize: '2.2rem', color: '#78350F', margin: '0.4rem 0 0.2rem 0', fontWeight: 900 }}>
                  EduNeev Kids Preschool
                </h2>
                <p style={{ color: '#92400E', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                  Nurturing young minds in a safe, loving, and joyful environment across Chinchwad, Chikhali & Dudulgaon.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a 
                href="/" 
                target="_blank" 
                rel="noreferrer"
                className="btn-kid"
                style={{ 
                  background: '#D97706', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 700
                }}
              >
                <ExternalLink size={18} />
                Visit Website
              </a>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '5px solid #2563EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.9rem', borderRadius: '1rem' }}>
              <Building2 size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B' }}>3</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Preschool Centers</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '5px solid #D97706', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#FFFBEB', color: '#D97706', padding: '0.9rem', borderRadius: '1rem' }}>
              <Calendar size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B' }}>10+</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Years of Excellence</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '5px solid #059669', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#ECFDF5', color: '#059669', padding: '0.9rem', borderRadius: '1rem' }}>
              <GraduationCap size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B' }}>5</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Core Programs</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '5px solid #9333EA', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#F3E8FF', color: '#9333EA', padding: '0.9rem', borderRadius: '1rem' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>CCTV Secured</div>
            </div>
          </div>
        </div>

        {/* Our Story & Philosophy Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Heart size={24} color="#EF4444" />
              <h3 style={{ fontSize: '1.4rem', color: '#1E293B', margin: 0 }}>Our Philosophy</h3>
            </div>
            <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '0.98rem' }}>
              At EduNeev Kids Preschool, we believe that early childhood education is the fundamental cornerstone of a child's lifetime journey. Since 2013, our dedicated educators and staff work tirelessly to create a safe, stimulating, and joyful environment where children feel loved, respected, and encouraged to discover their unique potential.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Sparkles size={24} color="#F59E0B" />
              <h3 style={{ fontSize: '1.4rem', color: '#1E293B', margin: 0 }}>Curriculum & Growth</h3>
            </div>
            <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '0.98rem' }}>
              Our age-tailored curriculum covers Playgroup, Nursery, LKG, UKG, and Day Care. We emphasize holistic growth combining cognitive phonics, social-emotional development, creative play, physical motor skills, and primary school readiness.
            </p>
          </div>
        </div>

        {/* Preschool Centers Section */}
        <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={24} color="#2563EB" />
          Our Preschool Centers
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {centers.map((c, index) => (
            <div 
              key={index}
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: '1.25rem',
                border: `2px solid ${c.borderColor}`,
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: c.color, background: c.bgColor, padding: '4px 10px', borderRadius: '12px' }}>
                  {c.branch}
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#1E293B', marginBottom: '0.75rem' }}>{c.name}</h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px', color: c.color }} />
                {c.address}
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color={c.color} />
                <a href={`tel:${c.phone.replace(/[^0-9]/g, '')}`} style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color, textDecoration: 'none' }}>
                  {c.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Highlights Section */}
        <h2 style={{ fontSize: '1.5rem', color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={24} color="#D97706" />
          Key Infrastructure & Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {features.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.92rem' }}>{item.title}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
