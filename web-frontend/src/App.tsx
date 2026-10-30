import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BackgroundDecorations from './components/BackgroundDecorations';
import { LanguageProvider } from './utils/LanguageContext';

// Public Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const PublicEnquiryPage = lazy(() => import('./pages/PublicEnquiryPage'));

// Parent Portal Pages (Lazy Loaded)
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ParentNotices = lazy(() => import('./pages/parent/ParentNotices'));
const ParentHomework = lazy(() => import('./pages/parent/ParentHomework'));
const ParentNotes = lazy(() => import('./pages/parent/ParentNotes'));
const ParentFees = lazy(() => import('./pages/parent/ParentFees'));
const ParentAttendance = lazy(() => import('./pages/parent/ParentAttendance'));
const ParentStories = lazy(() => import('./pages/parent/ParentStories'));
const ParentDaycare = lazy(() => import('./pages/parent/ParentDaycare'));
const ParentCCTV = lazy(() => import('./pages/parent/ParentCCTV'));
const ParentHealth = lazy(() => import('./pages/parent/ParentHealth'));
const ParentLeaves = lazy(() => import('./pages/parent/ParentLeaves'));
const ParentChat = lazy(() => import('./pages/parent/ParentChat'));
const ParentProgress = lazy(() => import('./pages/parent/ParentProgress'));

// Teacher & Admin Shared / Portal Pages (Lazy Loaded)
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentsDirectory = lazy(() => import('./pages/admin/StudentsDirectory'));
const StaffDirectory = lazy(() => import('./pages/admin/StaffDirectory'));
const ClassesManagement = lazy(() => import('./pages/admin/ClassesManagement'));
const EnquiriesManagement = lazy(() => import('./pages/admin/EnquiriesManagement'));
const DaycareManagement = lazy(() => import('./pages/admin/DaycareManagement'));
const CalendarEventsManagement = lazy(() => import('./pages/admin/CalendarEventsManagement'));
const FoodMenuManagement = lazy(() => import('./pages/admin/FoodMenuManagement'));
const TimetableManagement = lazy(() => import('./pages/admin/TimetableManagement'));
const FeesManagement = lazy(() => import('./pages/admin/FeesManagement'));
const FeeStructureManagement = lazy(() => import('./pages/admin/FeeStructureManagement'));
const ExpensesManagement = lazy(() => import('./pages/admin/ExpensesManagement'));
const HRManagement = lazy(() => import('./pages/admin/HRManagement'));
const TransportManagement = lazy(() => import('./pages/admin/TransportManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const StudentNotesManagement = lazy(() => import('./pages/admin/StudentNotesManagement'));
const CertificatesManagement = lazy(() => import('./pages/admin/CertificatesManagement'));
const PTMSchedulerManagement = lazy(() => import('./pages/admin/PTMSchedulerManagement'));
const FranchiseManagement = lazy(() => import('./pages/admin/FranchiseManagement'));
const AttendanceManagement = lazy(() => import('./pages/admin/AttendanceManagement'));
const NoticesManagement = lazy(() => import('./pages/admin/NoticesManagement'));
const GalleryManagement = lazy(() => import('./pages/admin/GalleryManagement'));
const ChatPortal = lazy(() => import('./pages/admin/ChatPortal'));
const StoryFeed = lazy(() => import('./pages/admin/StoryFeed'));
const LibraryManagement = lazy(() => import('./pages/admin/LibraryManagement'));
const LeaveApprovals = lazy(() => import('./pages/admin/LeaveApprovals'));
const HealthRecordsManagement = lazy(() => import('./pages/admin/HealthRecordsManagement'));
const ProgressDashboardManagement = lazy(() => import('./pages/admin/ProgressDashboardManagement'));
const CCTVManagement = lazy(() => import('./pages/admin/CCTVManagement'));
const HomeworkManagement = lazy(() => import('./pages/admin/HomeworkManagement'));
const AboutUs = lazy(() => import('./pages/admin/AboutUs'));

// Page loading animation fallback
const PageLoader: React.FC = () => (
  <div style={{
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#4F46E5',
    fontFamily: 'inherit'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '4px solid #E0E7FF',
      borderTop: '4px solid #4F46E5',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748B' }}>Loading page...</span>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// Route Auth Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    let role = '';
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      role = (user.role || '').toLowerCase();
    } catch {
      role = '';
    }

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    // super_admin & owner have access across admin areas
    if (role === 'owner') role = 'super_admin';
    if (!normalizedAllowed.includes(role) && !normalizedAllowed.includes('*')) {
      if (role === 'parent') return <Navigate to="/parent/dashboard" replace />;
      if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <BackgroundDecorations />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/enquiry" element={<PublicEnquiryPage />} />
            <Route path="/enquiry-form" element={<PublicEnquiryPage />} />
            <Route path="/admission-enquiry" element={<PublicEnquiryPage />} />
            
            {/* Dedicated Parent Portal Routes */}
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/notices" element={<ProtectedRoute allowedRoles={['parent']}><ParentNotices /></ProtectedRoute>} />
            <Route path="/parent/homework" element={<ProtectedRoute allowedRoles={['parent']}><ParentHomework /></ProtectedRoute>} />
            <Route path="/parent/notes" element={<ProtectedRoute allowedRoles={['parent']}><ParentNotes /></ProtectedRoute>} />
            <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
            <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent']}><ParentAttendance /></ProtectedRoute>} />
            <Route path="/parent/stories" element={<ProtectedRoute allowedRoles={['parent']}><ParentStories /></ProtectedRoute>} />
            <Route path="/parent/daycare" element={<ProtectedRoute allowedRoles={['parent']}><ParentDaycare /></ProtectedRoute>} />
            <Route path="/parent/cctv" element={<ProtectedRoute allowedRoles={['parent']}><ParentCCTV /></ProtectedRoute>} />
            <Route path="/parent/health" element={<ProtectedRoute allowedRoles={['parent']}><ParentHealth /></ProtectedRoute>} />
            <Route path="/parent/leaves" element={<ProtectedRoute allowedRoles={['parent']}><ParentLeaves /></ProtectedRoute>} />
            <Route path="/parent/chat" element={<ProtectedRoute allowedRoles={['parent']}><ParentChat /></ProtectedRoute>} />
            <Route path="/parent/progress" element={<ProtectedRoute allowedRoles={['parent']}><ParentProgress /></ProtectedRoute>} />
            <Route path="/parent/certificates" element={<ProtectedRoute allowedRoles={['parent']}><CertificatesManagement /></ProtectedRoute>} />

            {/* Dedicated Teacher Portal Routes */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/daycare" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><DaycareManagement /></ProtectedRoute>} />
            <Route path="/teacher/food" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><FoodMenuManagement /></ProtectedRoute>} />
            <Route path="/teacher/food-menu" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><FoodMenuManagement /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><StudentsDirectory /></ProtectedRoute>} />
            <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><HomeworkManagement /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><TimetableManagement /></ProtectedRoute>} />
            <Route path="/teacher/notes" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><StudentNotesManagement /></ProtectedRoute>} />
            <Route path="/teacher/stories" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><StoryFeed /></ProtectedRoute>} />
            <Route path="/teacher/notices" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><NoticesManagement /></ProtectedRoute>} />
            <Route path="/teacher/chat" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><ChatPortal /></ProtectedRoute>} />
            <Route path="/teacher/progress" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><ProgressDashboardManagement /></ProtectedRoute>} />
            <Route path="/teacher/leaves" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><LeaveApprovals /></ProtectedRoute>} />
            <Route path="/teacher/calendar" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><CalendarEventsManagement /></ProtectedRoute>} />
            <Route path="/teacher/about" element={<ProtectedRoute allowedRoles={['teacher', 'super_admin', 'school_admin']}><AboutUs /></ProtectedRoute>} />

            {/* Admin Management Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><StudentsDirectory /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><StaffDirectory /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><ClassesManagement /></ProtectedRoute>} />
            <Route path="/admin/homework" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><HomeworkManagement /></ProtectedRoute>} />
            <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><TimetableManagement /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><CertificatesManagement /></ProtectedRoute>} />
            <Route path="/admin/notes" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><StudentNotesManagement /></ProtectedRoute>} />
            <Route path="/admin/daycare" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><DaycareManagement /></ProtectedRoute>} />
            <Route path="/admin/enquiries" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><EnquiriesManagement /></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><CalendarEventsManagement /></ProtectedRoute>} />
            <Route path="/admin/food-menu" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><FoodMenuManagement /></ProtectedRoute>} />
            <Route path="/admin/ptm" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><PTMSchedulerManagement /></ProtectedRoute>} />

            {/* Finance & Operations */}
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><FeesManagement /></ProtectedRoute>} />
            <Route path="/admin/fee-structures" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><FeeStructureManagement /></ProtectedRoute>} />
            <Route path="/admin/fees/structures" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><FeeStructureManagement /></ProtectedRoute>} />
            <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><ExpensesManagement /></ProtectedRoute>} />
            <Route path="/admin/hr" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><HRManagement /></ProtectedRoute>} />
            <Route path="/admin/transport" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><TransportManagement /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><InventoryManagement /></ProtectedRoute>} />

            {/* Other Admin Modules */}
            <Route path="/admin/franchise" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><FranchiseManagement /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/admin/stories" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><StoryFeed /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><NoticesManagement /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><ChatPortal /></ProtectedRoute>} />
            <Route path="/admin/library" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><LibraryManagement /></ProtectedRoute>} />
            <Route path="/admin/gallery" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><GalleryManagement /></ProtectedRoute>} />
            <Route path="/admin/leaves" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><LeaveApprovals /></ProtectedRoute>} />
            <Route path="/admin/cctv" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><CCTVManagement /></ProtectedRoute>} />
            <Route path="/admin/health" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><HealthRecordsManagement /></ProtectedRoute>} />
            <Route path="/admin/progress" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><ProgressDashboardManagement /></ProtectedRoute>} />
            <Route path="/admin/about" element={<ProtectedRoute allowedRoles={['super_admin', 'school_admin']}><AboutUs /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  );
}

export default App;
