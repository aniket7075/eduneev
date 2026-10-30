import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import SmartSidebar from '../../components/SmartSidebar';
import { Search, Plus, Calendar as CalendarIcon, Trash2, ArrowLeft, Printer, X } from 'lucide-react';
import './Directory.css';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  type: 'Festival' | 'Govt Holiday' | 'Sunday' | 'Vacation' | 'Exam' | 'Activity' | 'Event';
  icon?: string;
  isCustom?: boolean;
}

const OFFICIAL_INDIAN_CALENDAR_2026: CalendarEvent[] = [
  // January
  { id: 'cal-1', title: "New Year's Day", description: "Start of the Calendar Year", start_date: "2026-01-01", type: "Govt Holiday", icon: "🎉" },
  { id: 'cal-2', title: "Makar Sankranti / Pongal", description: "Harvest Festival & Traditional Celebrations", start_date: "2026-01-14", type: "Festival", icon: "🪁" },
  { id: 'cal-3', title: "Republic Day", description: "77th National Republic Day (Flag Hoisting in School)", start_date: "2026-01-26", type: "Govt Holiday", icon: "🇮🇳" },

  // February
  { id: 'cal-4', title: "Maha Shivratri", description: "Lord Shiva Worship & Fasting Day", start_date: "2026-02-15", type: "Festival", icon: "🔱" },
  { id: 'cal-5', title: "Chhatrapati Shivaji Maharaj Jayanti", description: "Public Holiday honoring Chhatrapati Shivaji Maharaj", start_date: "2026-02-19", type: "Govt Holiday", icon: "👑" },

  // March
  { id: 'cal-6', title: "Holi (Dhulivandan / Rangapanchami)", description: "Festival of Vibrant Colors & Joy", start_date: "2026-03-03", type: "Festival", icon: "🎨" },
  { id: 'cal-7', title: "Gudi Padwa", description: "Traditional New Year Celebration", start_date: "2026-03-19", type: "Festival", icon: "🚩" },
  { id: 'cal-8', title: "Ramzan Eid (Eid-ul-Fitr)", description: "Public Holiday marking end of Holy Ramadan", start_date: "2026-03-21", type: "Festival", icon: "🌙" },

  // April
  { id: 'cal-9', title: "Good Friday", description: "Christian Observance Gazetted Holiday", start_date: "2026-04-03", type: "Govt Holiday", icon: "✝️" },
  { id: 'cal-10', title: "Dr. Babasaheb Ambedkar Jayanti", description: "National Gazetted Holiday honoring the Father of Constitution", start_date: "2026-04-14", type: "Govt Holiday", icon: "⚖️" },

  // May
  { id: 'cal-11', title: "Maharashtra Day & Labour Day", description: "Formation of Maharashtra State & International Workers Day", start_date: "2026-05-01", type: "Govt Holiday", icon: "🚩" },
  { id: 'cal-12', title: "Annual Summer Vacation", description: "Preschool Summer Break (2 May to 7 June 2026)", start_date: "2026-05-02", end_date: "2026-06-07", type: "Vacation", icon: "☀️" },
  { id: 'cal-13', title: "Bakri Eid (Eid-ul-Adha)", description: "Feast of Sacrifice Gazetted Holiday", start_date: "2026-05-27", type: "Festival", icon: "🌙" },

  // June & July
  { id: 'cal-14', title: "School Reopening Day", description: "Welcome back students for Academic Term 1", start_date: "2026-06-08", type: "Activity", icon: "🎒" },
  { id: 'cal-15', title: "Chhatrapati Shahu Maharaj Jayanti", description: "Social Justice Day Remembrance", start_date: "2026-06-26", type: "Govt Holiday", icon: "👑" },
  { id: 'cal-16', title: "Muharram", description: "Islamic Public Holiday", start_date: "2026-07-26", type: "Festival", icon: "🕌" },

  // August
  { id: 'cal-17', title: "Independence Day", description: "79th Indian Independence Day Celebration (Flag Hoisting in School)", start_date: "2026-08-15", type: "Govt Holiday", icon: "🇮🇳" },
  { id: 'cal-18', title: "Parsi New Year (Navroz)", description: "Parsi Community Celebration Public Holiday", start_date: "2026-08-16", type: "Festival", icon: "🕊️" },
  { id: 'cal-19', title: "Raksha Bandhan", description: "Traditional Festival of Brother & Sister Bond", start_date: "2026-08-28", type: "Festival", icon: "🪷" },

  // September
  { id: 'cal-20', title: "Gokulashtami (Dahi Handi)", description: "Lord Krishna Janmashtami Celebrations", start_date: "2026-09-04", type: "Festival", icon: "🦚" },
  { id: 'cal-21', title: "Ganesh Chaturthi (Ganeshotsav Begins)", description: "Grand Lord Ganesha Sthapana Festival Public Holiday", start_date: "2026-09-14", type: "Festival", icon: "🐘" },
  { id: 'cal-22', title: "Anant Chaturdashi (Ganesh Visarjan)", description: "Grand Ganeshotsav Visarjan Public Holiday", start_date: "2026-09-24", type: "Festival", icon: "🐘" },

  // October
  { id: 'cal-23', title: "Mahatma Gandhi Jayanti", description: "National Gazetted Holiday celebrating Father of Nation", start_date: "2026-10-02", type: "Govt Holiday", icon: "🕊️" },
  { id: 'cal-24', title: "Dussehra (Vijayadashami)", description: "Victory of Good over Evil Festival & Public Holiday", start_date: "2026-10-20", type: "Festival", icon: "🏹" },

  // November
  { id: 'cal-25', title: "Diwali Vacation", description: "Diwali Festival Holiday for Preschool (8 Nov to 16 Nov 2026)", start_date: "2026-11-08", end_date: "2026-11-16", type: "Vacation", icon: "🪔" },
  { id: 'cal-26', title: "Diwali Lakshmi Pujan", description: "Goddess Lakshmi Puja & Deepotsav Festival", start_date: "2026-11-09", type: "Festival", icon: "🪔" },
  { id: 'cal-27', title: "Diwali Balipratipada (Padwa) & Bhaubeej", description: "New Vikram Samvat Year & Bhaubeej Festival", start_date: "2026-11-10", type: "Festival", icon: "🪔" },
  { id: 'cal-28', title: "Guru Nanak Jayanti", description: "Gurpurab Celebrations Gazetted Holiday", start_date: "2026-11-24", type: "Festival", icon: "🪯" },

  // December
  { id: 'cal-29', title: "Christmas Day", description: "Celebration of Jesus Christ Birth Gazetted Holiday", start_date: "2026-12-25", type: "Govt Holiday", icon: "🎄" },
  { id: 'cal-30', title: "Winter Break", description: "Year-End Winter Holiday (26 Dec 2026 to 1 Jan 2027)", start_date: "2026-12-26", end_date: "2027-01-01", type: "Vacation", icon: "❄️" },
];

const generateSundays2026 = (): CalendarEvent[] => {
  const sundays: CalendarEvent[] = [];
  const year = 2026;
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 0) {
    d.setDate(d.getDate() + 1);
  }
  let count = 1;
  while (d.getFullYear() === year) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${day}`;
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    sundays.push({
      id: `sun-${count}`,
      title: `Sunday Weekly Off (#${count})`,
      description: `Weekly off for students, teachers, and staff (${monthName})`,
      start_date: isoDate,
      type: "Sunday",
      icon: "☀️"
    });
    count++;
    d.setDate(d.getDate() + 7);
  }
  return sundays;
};

const CalendarEventsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Festival' | 'Govt Holiday' | 'Sunday' | 'Vacation' | 'Other'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    start_date: '', 
    end_date: '', 
    type: 'Event' as CalendarEvent['type'] 
  });


  const [customLocalEvents, setCustomLocalEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('eduneev_calendar_events_custom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const sundays = useMemo(() => generateSundays2026(), []);

  const [approvedLeaveEvents, setApprovedLeaveEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [response, leavesRes] = await Promise.all([
          apiClient.get('/events').catch(() => ({ data: [] })),
          apiClient.get('/hr/leaves').catch(() => ({ data: [] }))
        ]);

        const list = response.data.data || response.data || [];
        if (Array.isArray(list)) {
          setDbEvents(list.map((e: any) => ({
            id: String(e.id),
            title: e.title,
            description: e.description || '',
            start_date: e.start_date ? e.start_date.split('T')[0] : '',
            end_date: e.end_date ? e.end_date.split('T')[0] : undefined,
            type: e.type || 'Event',
            isCustom: true
          })));
        }

        const leavesList = leavesRes.data?.data || leavesRes.data || [];
        if (Array.isArray(leavesList)) {
          const approved = leavesList
            .filter((l: any) => (l.status || '').toLowerCase() === 'approved')
            .map((l: any, idx: number) => ({
              id: `approved-leave-${l.id || idx}`,
              title: `🏝️ [STAFF LEAVE] ${l.first_name ? `${l.first_name} ${l.last_name}` : (l.employeeName || 'Teacher')}`,
              description: `Approved ${l.leaveType || l.leave_type || 'Leave'}: ${l.reason || 'Personal Work'} (${l.role || 'Class Teacher'})`,
              start_date: l.start_date ? l.start_date.split('T')[0] : (l.startDate ? l.startDate.split('T')[0] : ''),
              end_date: l.end_date ? l.end_date.split('T')[0] : (l.endDate ? l.endDate.split('T')[0] : undefined),
              type: 'Vacation' as const,
              isCustom: true
            }));
          setApprovedLeaveEvents(approved);
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const allCombinedEvents = useMemo(() => {
    const list = [...OFFICIAL_INDIAN_CALENDAR_2026, ...sundays, ...customLocalEvents, ...dbEvents, ...approvedLeaveEvents];
    return list.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [sundays, customLocalEvents, dbEvents, approvedLeaveEvents]);

  const filteredEvents = useMemo(() => {
    return allCombinedEvents.filter(e => {
      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'Other' && ['Festival', 'Govt Holiday', 'Sunday', 'Vacation'].includes(e.type)) {
          return false;
        } else if (categoryFilter !== 'Other' && e.type !== categoryFilter) {
          return false;
        }
      }

      // Month filter
      if (monthFilter !== 'all' && e.start_date) {
        const monthNum = String(parseInt(e.start_date.split('-')[1], 10));
        if (monthNum !== monthFilter) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const tMatch = (e.title || '').toLowerCase().includes(q);
        const dMatch = (e.description || '').toLowerCase().includes(q);
        const typeMatch = (e.type || '').toLowerCase().includes(q);
        const dateMatch = (e.start_date || '').includes(q);
        if (!tMatch && !dMatch && !typeMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [allCombinedEvents, categoryFilter, monthFilter, search]);

  const getEventTypeBadge = (type: string) => {
    switch(type) {
      case 'Festival': 
        return <span className="role-badge" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800 }}>🪔 Indian Festival</span>;
      case 'Govt Holiday': 
        return <span className="role-badge" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 800 }}>🇮🇳 Govt Holiday</span>;
      case 'Sunday': 
        return <span className="role-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }}>☀️ Sunday Off</span>;
      case 'Vacation': 
        return <span className="role-badge" style={{ background: '#F3E8FF', color: '#6B21A8', fontWeight: 800 }}>🎒 Vacation</span>;
      case 'Exam': 
        return <span className="role-badge" style={{ background: '#FEF3C7', color: '#D97706', fontWeight: 800 }}>📝 Exam</span>;
      case 'Activity': 
        return <span className="role-badge" style={{ background: '#D1FAE5', color: '#059669', fontWeight: 800 }}>🎨 Activity</span>;
      default: 
        return <span className="role-badge" style={{ background: '#DBEAFE', color: '#2563EB', fontWeight: 800 }}>📌 {type || 'Event'}</span>;
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.start_date) return;

    try {
      const response = await apiClient.post('/events', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        type: formData.type
      }).catch(() => null);

      const newEvt: CalendarEvent = {
        id: response?.data?.data?.id || `local-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        type: formData.type,
        icon: formData.type === 'Festival' ? '🪔' : formData.type === 'Govt Holiday' ? '🏛️' : formData.type === 'Vacation' ? '🎒' : '📌',
        isCustom: true
      };

      const updated = [newEvt, ...customLocalEvents];
      setCustomLocalEvents(updated);
      try {
        localStorage.setItem('eduneev_calendar_events_custom', JSON.stringify(updated));
      } catch {}

      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', start_date: '', end_date: '', type: 'Event' });
      alert(`✅ Event "${newEvt.title}" added to calendar successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to save event.');
    }
  };

  const handleDeleteEvent = async (evtId: string, evtTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${evtTitle}"?`)) return;

    try {
      if (!evtId.startsWith('cal-') && !evtId.startsWith('sun-') && !evtId.startsWith('local-')) {
        await apiClient.delete(`/events/${evtId}`).catch(() => null);
      }
      const updated = customLocalEvents.filter(e => e.id !== evtId);
      setCustomLocalEvents(updated);
      setDbEvents(prev => prev.filter(e => e.id !== evtId));
      try {
        localStorage.setItem('eduneev_calendar_events_custom', JSON.stringify(updated));
      } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintCalendar = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EduNeev Kids Preschool - Annual Academic Calendar & Holidays 2026</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #1E293B; margin: 0; padding: 10px; }
            .header { text-align: center; border-bottom: 3px double #4F46E5; padding-bottom: 12px; margin-bottom: 15px; }
            .header h1 { margin: 0; color: #1E1B4B; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header h3 { margin: 4px 0; color: #4F46E5; font-size: 14px; font-weight: 700; }
            .header p { margin: 2px 0; font-size: 11px; color: #64748B; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background: #1E1B4B; color: white; padding: 6px 8px; text-align: left; font-weight: 800; }
            td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
            tr:nth-child(even) { background: #F8FAFC; }
            .badge { padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; display: inline-block; }
            .Festival { background: #FEF3C7; color: #92400E; }
            .Govt-Holiday { background: #FEE2E2; color: #991B1B; }
            .Sunday { background: #EFF6FF; color: #1E40AF; }
            .Vacation { background: #F3E8FF; color: #6B21A8; }
            .footer { margin-top: 15px; text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EduNeev Kids International Preschool</h1>
            <h3>ANNUAL INDIAN FESTIVALS, GOVERNMENT HOLIDAYS & ACADEMIC CALENDAR 2026</h3>
            <p>Official School Calendar for Students, Parents & Staff</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th style="width: 90px;">Date</th>
                <th>Festival / Holiday Name</th>
                <th style="width: 120px;">Category</th>
                <th>Description / Details</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map((evt, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${evt.start_date.split('-').reverse().join('/')}</strong>${evt.end_date && evt.end_date !== evt.start_date ? `<br/><span style="color:#64748B;font-size:10px;">to ${evt.end_date.split('-').reverse().join('/')}</span>` : ''}</td>
                  <td>${evt.icon ? `${evt.icon} ` : ''}<strong>${evt.title}</strong></td>
                  <td><span class="badge ${evt.type.replace(' ', '-')}">${evt.type}</span></td>
                  <td>${evt.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Printed on ${new Date().toLocaleDateString('en-IN')} • EduNeev Preschool Management System
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const isAdminOrSuperAdmin = loggedUser?.role === 'super_admin' || loggedUser?.role === 'school_admin' || loggedUser?.role === 'owner' || loggedUser?.email === 'admin@prescole.com' || loggedUser?.email === 'admin@eduneev.com';

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={28} color="#4F46E5" /> Calendar & Events
              </h1>
              <p className="date-text">Indian festivals, government holidays, Sundays & preschool academic events</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handlePrintCalendar}
              title="Print official calendar for notice board"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem', color: '#1E293B', cursor: 'pointer' }}
            >
              <Printer size={16} /> Print A4 Calendar
            </button>

            {isAdminOrSuperAdmin && (
              <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '0.75rem' }}>
                <Plus size={18} /> Add Event
              </button>
            )}
          </div>
        </header>

        {/* Top Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              🪔
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#92400E' }}>
                {allCombinedEvents.filter(e => e.type === 'Festival').length}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>Indian Festivals</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              🇮🇳
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#991B1B' }}>
                {allCombinedEvents.filter(e => e.type === 'Govt Holiday').length}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B91C1C' }}>Govt Holidays</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              ☀️
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1E40AF' }}>
                {allCombinedEvents.filter(e => e.type === 'Sunday').length}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D4ED8' }}>Sundays (Weekly Off)</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.1rem', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              🎒
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#6B21A8' }}>
                {allCombinedEvents.filter(e => e.type === 'Vacation').length}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7E22CE' }}>School Vacations</div>
            </div>
          </div>
        </div>

        <div className="glass-card table-container" style={{ borderRadius: '1rem', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          
          {/* Filters & Search Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `All (${allCombinedEvents.length})` },
                { key: 'Festival', label: `Festivals (${allCombinedEvents.filter(e => e.type === 'Festival').length}) 🪔` },
                { key: 'Govt Holiday', label: `Govt Holidays (${allCombinedEvents.filter(e => e.type === 'Govt Holiday').length}) 🇮🇳` },
                { key: 'Sunday', label: `Sundays (${allCombinedEvents.filter(e => e.type === 'Sunday').length}) ☀️` },
                { key: 'Vacation', label: `Vacations (${allCombinedEvents.filter(e => e.type === 'Vacation').length}) 🎒` },
                { key: 'Other', label: `Exams & Activities 📝` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCategoryFilter(tab.key as any)}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 800, transition: 'all 0.15s',
                    background: categoryFilter === tab.key ? '#1E1B4B' : '#F1F5F9',
                    color: categoryFilter === tab.key ? 'white' : '#475569'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box & Month Dropdown */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ margin: 0, width: '220px' }}>
                <Search size={16} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search festival, holiday, date..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.6rem 0.45rem 2rem' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0 4px' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, color: '#334155', background: 'white' }}
              >
                <option value="all">🗓️ All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex-center py-8">Loading calendar events...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Event / Festival Title</th>
                  <th style={{ width: '18%' }}>Category</th>
                  <th style={{ width: '18%' }}>Start Date</th>
                  <th style={{ width: '18%' }}>End Date</th>
                  {isAdminOrSuperAdmin && <th style={{ width: '14%' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => {
                    const [yr, mo, da] = evt.start_date.split('-');
                    const formattedDate = `${da}/${mo}/${yr}`;

                    return (
                      <tr key={evt.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {evt.icon && <span style={{ fontSize: '1.25rem' }}>{evt.icon}</span>}
                            <div>
                              <div className="font-bold text-main" style={{ fontSize: '0.95rem' }}>{evt.title}</div>
                              <div className="text-muted text-sm line-clamp-1" style={{ fontSize: '0.8rem' }}>{evt.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{getEventTypeBadge(evt.type)}</td>
                        <td>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontWeight: 700, color: '#1E293B' }}>
                            <CalendarIcon size={14} className="text-muted" /> 
                            {formattedDate}
                          </div>
                        </td>
                        <td>
                          {evt.end_date && evt.end_date !== evt.start_date ? (
                            <span style={{ fontWeight: 700, color: '#475569' }}>
                              {evt.end_date.split('-').reverse().join('/')}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Single Day</span>
                          )}
                        </td>
                        {isAdminOrSuperAdmin && (
                          <td>
                            {evt.isCustom ? (
                              <button 
                                className="icon-btn text-red" 
                                title="Delete Custom Event"
                                onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                                Official
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdminOrSuperAdmin ? 5 : 4} className="text-center py-8 text-muted" style={{ padding: '3rem 1rem' }}>
                      <CalendarIcon size={40} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 800, color: '#1E293B' }}>No events or holidays found matching filters.</div>
                      <div style={{ fontSize: '0.85rem' }}>Try clearing the search or category filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Event Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '460px' }}>
              <div className="modal-header">
                <h2>Add Calendar Event / Holiday</h2>
                <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="modal-form">
                <div className="form-group">
                  <label>Event / Festival Title *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Annual Sports Day, Republic Day Celebration"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Category / Type *</label>
                  <select 
                    className="input-field" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Event">📌 General School Event</option>
                    <option value="Festival">🪔 Indian Festival</option>
                    <option value="Govt Holiday">🏛️ Govt / Public Holiday</option>
                    <option value="Vacation">🎒 School Vacation Break</option>
                    <option value="Exam">📝 Exam / Assessment</option>
                    <option value="Activity">🎨 Class Activity</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={formData.start_date} 
                      onChange={e => setFormData({...formData, start_date: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={formData.end_date} 
                      onChange={e => setFormData({...formData, end_date: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description / Details</label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    placeholder="Event details for parents and teachers..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#4F46E5', color: 'white', fontWeight: 800 }}>Save to Calendar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarEventsManagement;
