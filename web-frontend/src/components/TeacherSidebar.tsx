import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Clock, FileText,
  ScanLine, Images, Megaphone, MessageSquare, CalendarDays, LogOut, Info, FileOutput, TrendingUp,
  Baby, UtensilsCrossed
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import './TeacherSidebar.css';

const TeacherSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const teacherName = loggedUser?.firstName 
    ? `${loggedUser.firstName} ${loggedUser.lastName || ''}`.trim() 
    : (loggedUser?.email || 'Class Teacher');
  const assignedClass = loggedUser?.className || loggedUser?.grade || loggedUser?.assigned_grade || loggedUser?.assignedClass || 'Class Teacher';
  const isDaycare = (assignedClass || '').toLowerCase().includes('daycare');

  const navItems = isDaycare ? [
    { nameKey: 'dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { nameKey: 'daycareTracker', path: '/teacher/daycare', icon: Baby },
    { nameKey: 'foodMenuManagement', path: '/teacher/food', icon: UtensilsCrossed },
    { nameKey: 'digitalAttendance', path: '/teacher/attendance', icon: ScanLine },
    { nameKey: 'timetable', path: '/teacher/timetable', icon: Clock },
    { nameKey: 'studentsDirectory', path: '/teacher/students', icon: Users },
    { nameKey: 'studentNotes', path: '/teacher/notes', icon: FileText },
    { nameKey: 'leaveApprovals', path: '/teacher/leaves', icon: FileOutput },
    { nameKey: 'schoolCalendar', path: '/teacher/calendar', icon: CalendarDays },
    { nameKey: 'storyFeed', path: '/teacher/stories', icon: Images },
    { nameKey: 'notices', path: '/teacher/notices', icon: Megaphone },
    { nameKey: 'chatPortal', path: '/teacher/chat', icon: MessageSquare },
    { nameKey: 'aboutUs', path: '/teacher/about', icon: Info },
  ] : [
    { nameKey: 'dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { nameKey: 'studentsDirectory', path: '/teacher/students', icon: Users },
    { nameKey: 'homework', path: '/teacher/homework', icon: BookOpen },
    { nameKey: 'digitalAttendance', path: '/teacher/attendance', icon: ScanLine },
    { nameKey: 'timetable', path: '/teacher/timetable', icon: Clock },
    { nameKey: 'studentNotes', path: '/teacher/notes', icon: FileText },
    { nameKey: 'progressReports', path: '/teacher/progress', icon: TrendingUp },
    { nameKey: 'leaveApprovals', path: '/teacher/leaves', icon: FileOutput },
    { nameKey: 'schoolCalendar', path: '/teacher/calendar', icon: CalendarDays },
    { nameKey: 'storyFeed', path: '/teacher/stories', icon: Images },
    { nameKey: 'notices', path: '/teacher/notices', icon: Megaphone },
    { nameKey: 'chatPortal', path: '/teacher/chat', icon: MessageSquare },
    { nameKey: 'aboutUs', path: '/teacher/about', icon: Info },
  ];

  return (
    <aside className="teacher-sidebar">
      <div className="teacher-sidebar-logo">
        <img src="/logopre.png" alt="EduNeev Kids Preschool Logo" />
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isDaycare ? '#0891B2' : '#059669', marginTop: '2px', letterSpacing: '0.5px' }}>
          {isDaycare ? '🧸 DAYCARE PORTAL' : 'TEACHER PORTAL'}
        </div>
      </div>

      <div className="teacher-nav-links">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index}>
              <NavLink to={item.path} className={({ isActive }) => isActive ? "teacher-nav-link active" : "teacher-nav-link"}>
                <IconComponent size={18} />
                <span>{t(item.nameKey)}</span>
              </NavLink>
            </div>
          );
        })}
      </div>

      <div className="teacher-sidebar-footer">
        <div className="teacher-info-card">
          <div className="teacher-avatar">👩‍🏫</div>
          <div className="teacher-info">
            <div className="teacher-name">{teacherName}</div>
            <div className="teacher-sub">{assignedClass}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-teacher-logout">
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default TeacherSidebar;
