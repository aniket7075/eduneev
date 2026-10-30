import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, IndianRupee, BookOpen, Images, Megaphone, FileText,
  MessageSquare, Video, Baby, FileOutput, Activity, LogOut, ShieldCheck, TrendingUp
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import './ParentSidebar.css';

const ParentSidebar: React.FC = () => {
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

  const childName = loggedUser?.childName || (loggedUser?.firstName ? `${loggedUser.firstName}'s Child` : 'My Child');
  const childClass = loggedUser?.className || loggedUser?.grade || '';

  const navItems = [
    { nameKey: 'dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
    { nameKey: 'progressReports', path: '/parent/progress', icon: TrendingUp },
    { nameKey: 'todayAttendance', path: '/parent/attendance', icon: ShieldCheck },
    { nameKey: 'feesPayments', path: '/parent/fees', icon: IndianRupee },
    { nameKey: 'homework', path: '/parent/homework', icon: BookOpen },
    { nameKey: 'storyFeed', path: '/parent/stories', icon: Images },
    { nameKey: 'notices', path: '/parent/notices', icon: Megaphone },
    { nameKey: 'studentNotes', path: '/parent/notes', icon: FileText },
    { nameKey: 'chatPortal', path: '/parent/chat', icon: MessageSquare },
    { nameKey: 'daycareManagement', path: '/parent/daycare', icon: Baby },
    { nameKey: 'cctvAccess', path: '/parent/cctv', icon: Video },
    {nameKey: 'healthRecords', path: '/parent/health', icon: Activity },
    { nameKey: 'studentLeave', path: '/parent/leaves', icon: FileOutput },
  ];

  return (
    <aside className="parent-sidebar">
      <div className="parent-sidebar-logo">
        <img src="/logopre.png" alt="EduNeev Kids Preschool Logo" />
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--kid-orange)', marginTop: '2px', letterSpacing: '0.5px' }}>
          PARENT PORTAL
        </div>
      </div>

      <div className="parent-nav-links">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index}>
              <NavLink to={item.path} className={({ isActive }) => isActive ? "parent-nav-link active" : "parent-nav-link"}>
                <IconComponent size={18} />
                <span>{t(item.nameKey)}</span>
              </NavLink>
            </div>
          );
        })}
      </div>

      <div className="parent-sidebar-footer">
        <div className="parent-child-card">
          <div className="parent-child-avatar">👶</div>
          <div className="parent-child-info">
            <div className="parent-child-name">{childName}</div>
            <div className="parent-child-sub">{childClass}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-parent-logout">
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default ParentSidebar;
