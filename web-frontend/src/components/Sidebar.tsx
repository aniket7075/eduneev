import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, LayoutDashboard, LogOut, BookOpen,
  IndianRupee, Bus, Megaphone, CalendarDays, Baby, FileQuestion,
  Clock, Ribbon, FileText, Receipt, Box,
  Building2, Briefcase, ScanLine, Images, MessageSquare,
  Image, FileOutput, Video, Activity, TrendingUp, Info, UtensilsCrossed
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import './Sidebar.css';

interface NavSection {
  titleKey?: string;
  items: Array<{
    nameKey: string;
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
}

const Sidebar: React.FC = () => {
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
  const userRole = (loggedUser?.role || 'school_admin').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'owner' || loggedUser?.email === 'admin@prescole.com' || loggedUser?.email === 'admin@edunive.com';
  const isTeacher = userRole === 'teacher';
  const userName = loggedUser?.firstName ? `${loggedUser.firstName} ${loggedUser.lastName || ''}`.trim() : (loggedUser?.first_name ? `${loggedUser.first_name} ${loggedUser.last_name || ''}`.trim() : (loggedUser?.email || 'Admin User'));
  const userInitials = userName.substring(0, 2).toUpperCase();

  const rawAllowed = loggedUser?.allowed_screens || loggedUser?.allowedScreens;
  let allowedScreensList: string[] | null = null;
  if (rawAllowed && !isSuperAdmin) {
    try {
      allowedScreensList = typeof rawAllowed === 'string' ? JSON.parse(rawAllowed) : rawAllowed;
    } catch {
      allowedScreensList = null;
    }
  }

  const rawNavSections: NavSection[] = [
    {
      items: [
        { nameKey: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      titleKey: 'tabAcademic',
      items: [
        { nameKey: 'studentsDirectory', path: '/admin/students', icon: Users },
        ...(!isTeacher ? [
          { nameKey: 'staffDirectory', path: '/admin/staff', icon: GraduationCap },
          { nameKey: 'classesManagement', path: '/admin/classes', icon: BookOpen },
          { nameKey: 'certificates', path: '/admin/certificates', icon: Ribbon },
        ] : []),
        { nameKey: 'homework', path: '/admin/homework', icon: BookOpen },
        { nameKey: 'timetable', path: '/admin/timetable', icon: Clock },
        { nameKey: 'studentNotes', path: '/admin/notes', icon: FileText },
        { nameKey: 'healthRecords', path: '/admin/health', icon: Activity },
        { nameKey: 'progressReports', path: '/admin/progress', icon: TrendingUp },
      ]
    },
    {
      titleKey: 'tabDaycare',
      items: [
        ...(!isTeacher ? [
          { nameKey: 'daycareManagement', path: '/admin/daycare', icon: Baby },
          { nameKey: 'foodMenuManagement', path: '/admin/food-menu', icon: UtensilsCrossed },
          { nameKey: 'admissionEnquiries', path: '/admin/enquiries', icon: FileQuestion },
          { nameKey: 'ptmScheduler', path: '/admin/ptm', icon: Users }
        ] : []),
        { nameKey: 'schoolCalendar', path: '/admin/calendar', icon: CalendarDays },
      ]
    },
    ...(!isTeacher ? [{
      titleKey: 'tabFinance',
      items: [
        { nameKey: 'feesPayments', path: '/admin/fees', icon: IndianRupee },
        { nameKey: 'feeStructures', path: '/admin/fee-structures', icon: FileText },
        { nameKey: 'expensesManagement', path: '/admin/expenses', icon: Receipt },
        ...(isSuperAdmin ? [{ nameKey: 'hrPayroll', path: '/admin/hr', icon: Briefcase }] : []),
        { nameKey: 'transportRoutes', path: '/admin/transport', icon: Bus },
        { nameKey: 'inventoryStock', path: '/admin/inventory', icon: Box },
        ...(isSuperAdmin || userRole === 'school_admin' || userRole === 'admin' ? [{ nameKey: 'franchiseNetwork', path: '/admin/franchise', icon: Building2 }] : []),
        { nameKey: 'digitalAttendance', path: '/admin/attendance', icon: ScanLine },
      ]
    }] : [{
      titleKey: 'digitalAttendance',
      items: [
        { nameKey: 'digitalAttendance', path: '/admin/attendance', icon: ScanLine },
      ]
    }]),
    {
      titleKey: 'tabCommunication',
      items: [
        { nameKey: 'storyFeed', path: '/admin/stories', icon: Images },
        { nameKey: 'notices', path: '/admin/notices', icon: Megaphone },
        { nameKey: 'chatPortal', path: '/admin/chat', icon: MessageSquare },
        { nameKey: 'schoolGallery', path: '/admin/gallery', icon: Image },
        { nameKey: 'leaveApprovals', path: '/admin/leaves', icon: FileOutput },
        ...(!isTeacher ? [
          { nameKey: 'cctvAccess', path: '/admin/cctv', icon: Video },
        ] : []),
        { nameKey: 'libraryBooks', path: '/admin/library', icon: BookOpen },
        { nameKey: 'aboutUs', path: '/admin/about', icon: Info },
      ]
    }
  ];

  const navSections = rawNavSections.map(section => {
    const items = section.items.filter(item => {
      if (item.path === '/admin/dashboard') return true;
      if (Array.isArray(allowedScreensList) && allowedScreensList.length > 0) {
        return allowedScreensList.includes(item.path);
      }
      return true;
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img 
          src="/logopre.png" 
          alt="EduNeev Kids Preschool Logo" 
          style={{ 
            width: '100%', 
            maxWidth: '210px', 
            maxHeight: '115px', 
            borderRadius: '12px', 
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))',
            display: 'block',
            margin: '0 auto'
          }} 
        />
      </div>

      <div className="nav-links">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.titleKey && <div className="nav-section-title">{t(section.titleKey)}</div>}
            {section.items.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div className="nav-item" key={index}>
                  <NavLink to={item.path} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <IconComponent size={18} />
                    <span>{t(item.nameKey)}</span>
                  </NavLink>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-role">{isSuperAdmin ? 'Super Admin' : (isTeacher ? 'Teacher' : (loggedUser?.role === 'school_admin' ? 'Franchise Admin' : 'Admin'))}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
