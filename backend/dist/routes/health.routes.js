"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Sick Reports (Parent and Staff)
router.post('/sick-report', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), health_controller_1.createSickReport);
router.patch('/sick-report/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), health_controller_1.updateSickReportStatus);
// Medical Checkups (Staff)
router.post('/checkup/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), health_controller_1.addMedicalCheckup);
// Get health records for a specific student (Accessible by admin, teacher, parent)
router.get('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), health_controller_1.getHealthRecords);
// Create or update health records (Accessible by admin, teacher)
router.post('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), health_controller_1.upsertHealthRecord);
// Delete health records (Admin only)
router.delete('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), health_controller_1.deleteHealthRecord);
exports.default = router;
