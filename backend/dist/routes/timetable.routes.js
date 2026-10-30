"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetable_controller_1 = require("../controllers/timetable.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Auto-generation and teacher settings
router.post('/generate', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.generateTimetable);
router.get('/teachers/:grade', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), timetable_controller_1.getTeacherSubjects);
router.post('/teachers', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.addTeacherSubject);
router.delete('/teachers/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.deleteTeacherSubject);
// Standard CRUD
router.get('/:grade', timetable_controller_1.getTimetable);
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.createTimetableEntry);
router.put('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.updateTimetableEntry);
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), timetable_controller_1.deleteTimetableEntry);
exports.default = router;
