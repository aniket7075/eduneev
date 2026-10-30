import React from 'react';
import Sidebar from './Sidebar';
import ParentSidebar from './ParentSidebar';
import TeacherSidebar from './TeacherSidebar';

/**
 * SmartSidebar automatically renders the correct sidebar based on the
 * logged-in user's role:
 *   - 'parent'  → ParentSidebar (parent portal view)
 *   - 'teacher' → TeacherSidebar (teacher portal view)
 *   - all others → Sidebar (admin view)
 */
const SmartSidebar: React.FC = () => {
  const loggedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const userRole = (loggedUser?.role || '').toLowerCase();

  if (userRole === 'parent') {
    return <ParentSidebar />;
  }

  if (userRole === 'teacher') {
    return <TeacherSidebar />;
  }

  return <Sidebar />;
};

export default SmartSidebar;
