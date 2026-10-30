import { Router } from 'express';
import { bulkMarkAttendance, getStudentAttendance, getClassStudents, getAllStudentsForAttendance, markFaceQrAttendance, getUnifiedDashboardStats } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get all students grouped by grade (for MarkAttendanceScreen)
router.get('/students/all', authorize(['super_admin', 'school_admin', 'teacher']), getAllStudentsForAttendance);

// Teachers and Admins can fetch class students and mark attendance
router.get('/class/:grade', authorize(['super_admin', 'school_admin', 'teacher']), getClassStudents);
router.post('/mark', authorize(['super_admin', 'school_admin', 'teacher']), bulkMarkAttendance);

// Unified Dashboard
router.get('/unified/stats', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), getUnifiedDashboardStats);
router.post('/unified/mark', authorize(['super_admin', 'school_admin', 'teacher']), markFaceQrAttendance);

// Parents, Teachers, Admins can view individual student attendance (with optional ?month=&year= filters)
router.get('/', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), getStudentAttendance);
router.get('/:student_id', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), getStudentAttendance);

export default router;
