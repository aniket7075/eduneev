"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get all students grouped by grade (for MarkAttendanceScreen)
router.get('/students/all', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), attendance_controller_1.getAllStudentsForAttendance);
// Teachers and Admins can fetch class students and mark attendance
router.get('/class/:grade', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), attendance_controller_1.getClassStudents);
router.post('/mark', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), attendance_controller_1.bulkMarkAttendance);
// Unified Dashboard
router.get('/unified/stats', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), attendance_controller_1.getUnifiedDashboardStats);
router.post('/unified/mark', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), attendance_controller_1.markFaceQrAttendance);
// Parents, Teachers, Admins can view individual student attendance (with optional ?month=&year= filters)
router.get('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), attendance_controller_1.getStudentAttendance);
router.get('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), attendance_controller_1.getStudentAttendance);
exports.default = router;
