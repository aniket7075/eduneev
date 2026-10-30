import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentSidebar from '../../components/ParentSidebar';
import LanguageSelector from '../../components/LanguageSelector';
import { useLanguage } from '../../utils/LanguageContext';
import {
  CalendarCheck, IndianRupee, BookOpen, MessageSquare, Images, Megaphone,
  Video, Activity, FileOutput, Award, Utensils, Heart, ChevronRight
} from 'lucide-react';
import apiClient from '../../api/client';
import './ParentDashboard.css';

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [liveStats, setLiveStats] = useState({
    activeHomeworkCount: 2,
    paidFees: 35000,
    balanceFees: 0,
    noticesCount: 1,
    attendancePct: '96%'
  });

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const childName = selectedChild 
    ? `${selectedChild.first_name} ${selectedChild.last_name || ''}`.trim()
    : (loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'My Child'));
  const childClass = selectedChild?.grade || loggedUser?.className || loggedUser?.grade || 'Nursery';
  const branchName = loggedUser?.school_name || loggedUser?.branchName || 'Chinchwad Branch';

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await apiClient.get('/users/children');
        const kids = res.data || [];
        setChildren(kids);
        if (kids.length > 0) {
          const savedChildId = localStorage.getItem('selectedChildId');
          const found = kids.find((k: any) => k.id === savedChildId);
          setSelectedChild(found || kids[0]);
        }
      } catch (e) {
        console.error('Failed to fetch children list', e);
      }
    };
    fetchChildren();
  }, []);

  useEffect(() => {
    const fetchOriginalParentData = async () => {
      try {
        const studentId = selectedChild?.id || loggedUser?.student_id;
        const [hwRes, feesRes, noticesRes, attRes] = await Promise.all([
          apiClient.get('/homework').catch(() => ({ data: [] })),
          apiClient.get('/fees').catch(() => ({ data: [] })),
          apiClient.get('/notices').catch(() => ({ data: [] })),
          apiClient.get(studentId ? `/attendance/${studentId}` : '/attendance').catch(() => ({ data: [] }))
        ]);

        const hwList = hwRes.data?.data || hwRes.data || [];
        const feeList = feesRes.data?.data || feesRes.data || [];
        const noticeList = noticesRes.data?.data || noticesRes.data || [];
        const attList = attRes.data?.data || attRes.data || [];

        const myHwCount = Array.isArray(hwList) 
          ? hwList.filter((h: any) => {
              const hg = (h.grade || h.class_name || '').toLowerCase().trim();
              const cg = childClass.toLowerCase().trim();
              return !hg || hg === 'all' || hg === cg;
            }).length
          : 0;

        let paidSum = 0;
        let balSum = 0;
        if (Array.isArray(feeList) && feeList.length > 0) {
          const tot = feeList.reduce((acc: number, f: any) => acc + parseFloat(f.total_amount || f.amount || '0'), 0);
          paidSum = feeList.reduce((acc: number, f: any) => acc + parseFloat(f.total_paid || f.amount_paid || '0'), 0);
          balSum = Math.max(0, tot - paidSum);
        }

        let attendancePct = '100%';
        if (Array.isArray(attList) && attList.length > 0) {
          const presentCount = attList.filter((a: any) => (a.status || '').toLowerCase() === 'present' || (a.status || '').toLowerCase() === 'late').length;
          attendancePct = `${Math.round((presentCount / attList.length) * 100)}%`;
        } else {
          attendancePct = 'N/A';
        }

        setLiveStats({
          activeHomeworkCount: myHwCount,
          paidFees: paidSum,
          balanceFees: balSum,
          noticesCount: Array.isArray(noticeList) ? noticeList.length : 0,
          attendancePct: attendancePct
        });
      } catch (err) {
        console.error('Failed to fetch live parent dashboard telemetry', err);
      }
    };

    fetchOriginalParentData();
  }, [childClass, selectedChild]);

  const getTimeGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'goodMorning';
    if (hour < 17) return 'goodAfternoon';
    return 'goodEvening';
  };

  const kpiCards = [
    {
      titleKey: 'todayAttendance',
      value: t('presentToday'),
      subText: t('arrivalTime'),
      icon: <CalendarCheck size={22} />,
      color: '#059669',
      bg: '#ECFDF5',
      path: '/parent/attendance',
      badge: `${liveStats.attendancePct} Attendance`
    },
    {
      titleKey: 'feesPayments',
      value: `₹ ${liveStats.paidFees.toLocaleString()} Paid`,
      subText: `₹ ${liveStats.balanceFees.toLocaleString()} Outstanding Balance`,
      icon: <IndianRupee size={22} />,
      color: '#4F46E5',
      bg: '#EEF2FF',
      path: '/parent/fees',
      badge: liveStats.balanceFees === 0 ? 'Paid in Full 🟢' : 'Installment Due 🟡'
    },
    {
      titleKey: 'activeAssignments',
      value: `${liveStats.activeHomeworkCount} Assignments`,
      subText: t('dueTomorrow'),
      icon: <BookOpen size={22} />,
      color: '#F59E0B',
      bg: '#FEF3C7',
      path: '/parent/homework',
      badge: 'Active'
    },
    {
      titleKey: 'starStudent',
      value: 'Star of Week ⭐',
      subText: 'Awarded by Teacher',
      icon: <Award size={22} />,
      color: '#EC4899',
      bg: '#FDF2F8',
      path: '/parent/certificates',
      badge: 'Award Winner'
    }
  ];

  const parentModules = [
    {
      titleKey: 'storyFeed',
      sub: 'View class photos & activity video moments',
      icon: <Images size={24} />,
      path: '/parent/stories',
      color: '#6366F1',
      bg: '#EEF2FF'
    },
    {
      titleKey: 'chatWithTeacher',
      sub: 'Direct 1-on-1 messaging with class teacher',
      icon: <MessageSquare size={24} />,
      path: '/parent/chat',
      color: '#EC4899',
      bg: '#FDF2F8'
    },
    {
      titleKey: 'notices',
      sub: 'School announcements, circulars & holidays',
      icon: <Megaphone size={24} />,
      path: '/parent/notices',
      color: '#F59E0B',
      bg: '#FEF3C7'
    },
    {
      titleKey: 'cctvLiveStream',
      sub: t('cameraEnabledByAdmin'),
      icon: <Video size={24} />,
      path: '/parent/cctv',
      color: '#059669',
      bg: '#ECFDF5'
    },
    {
      titleKey: 'todayMealMenu',
      sub: 'Fruit Salad, Dal Rice & Evening Milk',
      icon: <Utensils size={24} />,
      path: '/parent/daycare',
      color: '#D97706',
      bg: '#FEF3C7'
    },
    {
      titleKey: 'healthRecords',
      sub: 'Height: 98cm • Weight: 14.5kg • Medical Log',
      icon: <Heart size={24} />,
      path: '/parent/health',
      color: '#EF4444',
      bg: '#FEF2F2'
    },
    {
      titleKey: 'applyLeave',
      sub: `Submit leave request for ${childName.split(' ')[0]}`,
      icon: <FileOutput size={24} />,
      path: '/parent/leaves',
      color: '#8B5CF6',
      bg: '#F3E8FF'
    },
    {
      titleKey: 'progressReports',
      sub: 'Academic & Skill Development Report Card',
      icon: <Activity size={24} />,
      path: '/parent/progress',
      color: '#10B981',
      bg: '#ECFDF5'
    }
  ];


  return (
    <div className="parent-layout">
      <ParentSidebar />

      <main className="parent-main-content">
        
        {/* Parent Hero Banner */}
        <header className="parent-hero-card">
          <div className="parent-hero-left" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="child-avatar-hero">👶</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                <span style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                  📍 {branchName}
                </span>
                <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {childClass}
                </span>
              </div>
              <h1 className="parent-hero-title">{t(getTimeGreetingKey())}! Welcome to {childName}’s Portal</h1>
              <p className="parent-hero-subtitle">{t('parentWelcome')}</p>
            </div>
          </div>

          <div className="parent-hero-actions">
            <LanguageSelector />
          </div>
        </header>

        {/* Multi-Child / Ward Switcher */}
        {children.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>Select Ward:</span>
            {children.map((child: any) => {
              const isSelected = selectedChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child);
                    localStorage.setItem('selectedChildId', child.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                    background: isSelected ? '#F3E8FF' : '#F8FAFC',
                    color: isSelected ? '#6B21A8' : '#475569',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>👶</span>
                  <span>{child.first_name} {child.last_name || ''}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, background: isSelected ? '#DDD6FE' : '#E2E8F0', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>{child.grade}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Parent KPI Grid */}
        <div className="parent-kpi-grid">
          {kpiCards.map((card, idx) => (
            <div key={idx} className="parent-kpi-card" onClick={() => navigate(card.path)}>
              <div className="parent-kpi-header">
                <div className="parent-kpi-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: card.bg, color: card.color, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  {card.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 700 }}>{t(card.titleKey)}</h3>
              <p className="parent-kpi-value">{card.value}</p>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.3rem', display: 'block' }}>
                {card.subText}
              </span>
            </div>
          ))}
        </div>

        {/* Feature Hub Modules */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 900, margin: 0 }}>
              Parent Portal Features & Quick Actions
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Live Telemetry</span>
          </div>

          <div className="parent-hub-grid">
            {parentModules.map((m, idx) => (
              <div key={idx} className="parent-hub-card" onClick={() => navigate(m.path)}>
                <div className="parent-hub-icon" style={{ backgroundColor: m.bg, color: m.color }}>
                  {m.icon}
                </div>
                <div className="parent-hub-info" style={{ flex: 1 }}>
                  <h3>{t(m.titleKey)}</h3>
                  <p>{m.sub}</p>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>
            ))}
          </div>
        </div>


      </main>
    </div>
  );
};

export default ParentDashboard;
